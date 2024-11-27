// src/routes/recipe.routes.ts
import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import { authenticateToken } from "../middleware/auth.middleware";
import { Recipe } from "../models/recipe";

export const recipeRouter = express.Router();
recipeRouter.use(express.json());

// Get all recipes
recipeRouter.get("/", authenticateToken, async (_req, res) => {
  try {
    const recipes = await collections.recipes?.find({}).toArray();
    res.status(200).send(recipes);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Error fetching recipes");
  }
});

// Get single recipe
recipeRouter.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req?.params?.id;
    const query = { _id: new ObjectId(id) };
    const recipe = await collections?.recipes?.findOne(query);

    if (recipe) {
      res.status(200).send(recipe);
    } else {
      res.status(404).send(`Recipe with ID ${id} not found`);
    }
  } catch (error) {
    res.status(404).send(`Error fetching recipe with ID ${req?.params?.id}`);
  }
});

// Create recipe
recipeRouter.post("/", authenticateToken, async (req, res) => {
  try {
    // Validate required fields
    const { name, category } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, category are required"
      });
    }

    // Validate types
    if (typeof name !== 'string' || 
      !Array.isArray(category) || 
      category.length === 0 || 
      !category.every(item => typeof item === 'string') ) {
      return res.status(400).json({
        success: false,
        message: "Invalid field types or values"
      });
    }

    const recipe: Recipe = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(req.user?.id)
    };

    const result = await collections.recipes?.insertOne(recipe);

    if (result?.acknowledged) {
      res.status(201).send(`Created recipe: ID ${result.insertedId}.`);
    } else {
      res.status(500).send("Failed to create recipe");
    }
  } catch (error) {
    res.status(400).send(error instanceof Error ? error.message : "Error creating recipe");
  }
});

// Update recipe
recipeRouter.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req?.params?.id;
    const recipe: Recipe = {
      ...req.body,
      updatedAt: new Date()
    };
    const query = { _id: new ObjectId(id) };
    const result = await collections.recipes?.updateOne(query, { $set: recipe });

    if (result && result.matchedCount) {
      res.status(200).send(`Updated recipe: ID ${id}`);
    } else if (!result?.matchedCount) {
      res.status(404).send(`Recipe with ID ${id} not found`);
    } else {
      res.status(304).send(`Recipe with ID ${id} not modified`);
    }
  } catch (error) {
    res.status(400).send(error instanceof Error ? error.message : "Error updating recipe");
  }
});

// Delete recipe
recipeRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req?.params?.id;
    const query = { _id: new ObjectId(id) };
    const result = await collections.recipes?.deleteOne(query);

    if (result && result.deletedCount) {
      res.status(202).send(`Removed recipe: ID ${id}`);
    } else if (!result) {
      res.status(400).send(`Failed to remove recipe: ID ${id}`);
    } else if (!result.deletedCount) {
      res.status(404).send(`Recipe with ID ${id} does not exist`);
    }
  } catch (error) {
    res.status(400).send(error instanceof Error ? error.message : "Error deleting recipe");
  }
});