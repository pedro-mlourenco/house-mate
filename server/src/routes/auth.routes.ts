// auth.routes.ts
import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const authRouter = express.Router();
authRouter.use(express.json());

// Register new user
authRouter.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Check if user exists
        const existingUser = await collections?.users?.findOne({ email });
        if (existingUser) {
            return res.status(409).send("User already exists");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = {
            email,
            password: hashedPassword,
            name,
            createdAt: new Date()
        };

        const result = await collections?.users?.insertOne(user);

        if (result?.acknowledged) {
            const { password: _, ...userWithoutPassword } = user;
            res.status(201).send(userWithoutPassword);
        } else {
            res.status(500).send("Failed to create new user.");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
    }
});

// Login
authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await collections?.users?.findOne({ email });
        if (!user) {
            return res.status(401).send("Invalid credentials");
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).send("Invalid credentials");
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.status(200).send({ user: userWithoutPassword, token });

    } catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
    }
});

// Get user profile
authRouter.get("/profile/:id", async (req, res) => {
    try {
        const id = req?.params?.id;
        const query = { _id: new ObjectId(id) };
        const user = await collections?.users?.findOne(query);

        if (user) {
            const { password: _, ...userWithoutPassword } = user;
            res.status(200).send(userWithoutPassword);
        } else {
            res.status(404).send(`Failed to find user: ID ${id}`);
        }
    } catch (error) {
        res.status(404).send(`Failed to find user: ID ${req?.params?.id}`);
    }
});

// Update user
authRouter.put("/profile/:id", async (req, res) => {
    try {
        const id = req?.params?.id;
        const { password, ...updateData } = req.body;
        const query = { _id: new ObjectId(id) };

        // If password is being updated, hash it
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const result = await collections?.users?.updateOne(query, { $set: updateData });

        if (result && result.matchedCount) {
            res.status(200).send(`Updated user: ID ${id}`);
        } else if (!result?.matchedCount) {
            res.status(404).send(`Failed to find user: ID ${id}`);
        } else {
            res.status(304).send(`Failed to update user: ID ${id}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});