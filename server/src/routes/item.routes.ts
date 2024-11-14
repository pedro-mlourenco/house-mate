import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import { authenticateToken, checkRole } from "../middleware/auth.middleware";

export const itemRouter = express.Router();
itemRouter.use(express.json());

itemRouter.get("/", authenticateToken, async (_req, res) => {
  try {
    const items = await collections?.items?.find({}).toArray();
    res.status(200).send(items);
  } catch (error) {
    res
      .status(500)
      .send(
        error instanceof Error ? error.message : "Server error getting Items"
      );
  }
});

itemRouter.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req?.params?.id;
    const query = { _id: new ObjectId(id) };
    const item = await collections?.items?.findOne(query);

    if (item) {
      res.status(200).send(item);
    } else {
      res.status(404).send(`Failed to find item: ID ${id}`);
    }
  } catch (error) {
    res.status(404).send(`Failed to find item: ID ${req?.params?.id}`);
  }
});

itemRouter.post("/", authenticateToken, async (req, res) => {
  try {
    const item = req.body;
    const result = await collections?.items?.insertOne(item);

    if (result?.acknowledged) {
      res.status(201).send(`Created new Item: ID ${result.insertedId}.`);
    } else {
      res.status(500).send("Failed to create new Item.");
    }
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .send(error instanceof Error ? error.message : "Unknown error");
  }
});

itemRouter.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req?.params?.id;
    const item = req.body;
    const query = { _id: new ObjectId(id) };
    const result = await collections?.items?.updateOne(query, { $set: item });

    if (result && result.matchedCount) {
      res.status(200).send(`Updated Item: ID ${id}.`);
    } else if (!result?.matchedCount) {
      res.status(404).send(`Failed to find Item: ID ${id}`);
    } else {
      res.status(304).send(`Failed to update Item: ID ${id}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);
    res.status(400).send(message);
  }
});

itemRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req?.params?.id;
    const query = { _id: new ObjectId(id) };
    const result = await collections?.items?.deleteOne(query);

    if (result && result.deletedCount) {
      res.status(202).send(`Removed an Item: ID ${id}`);
    } else if (!result) {
      res.status(400).send(`Failed to remove an Item: ID ${id}`);
    } else if (!result.deletedCount) {
      res.status(404).send(`Failed to find a Store: ID ${id}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);
    res.status(400).send(message);
  }
});
