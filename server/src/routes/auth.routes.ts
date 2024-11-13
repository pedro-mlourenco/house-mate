// auth.routes.ts
import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { checkRole } from "../middleware/auth.middleware";
import { UserRole } from "../models/user";

export const authRouter = express.Router();
authRouter.use(express.json());

// Register new user
authRouter.post("/register",async (req, res) => {
    try {
        const { email, password, name, role = UserRole.USER } = req.body;
        
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
            password: await bcrypt.hash(password, 10),
            name,
            role, // Will use default USER if not provided
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

// auth.routes.ts
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
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        // Return token and user data
        res.status(200).json({
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Error during login");
    }
});

// Get all users
authRouter.get("/all", async (req, res) => {
    try {
        const users = collections.users;
        if (!users) {
            throw new Error('Users collection is not initialized');
        }
        const allUsers = await users.find({}).toArray();
        // Remove passwords from all users
        const usersWithoutPasswords = allUsers.map(user => {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.status(200).json({
            success: true,
            users: usersWithoutPasswords
        });
    } catch (error) {
        console.error('Fetch all users error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get user profile by email
authRouter.get("/profile", async (req, res) => {
    try {
        const email = req.query.email as string;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email parameter is required"
            });
        }

        const users = collections.users;
        if (!users) {
            throw new Error('Users collection is not initialized');
        }

        // Match query format with working /all endpoint
        const user = await users.findOne({ email: email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User not found with email: ${email}`
            });
        }

        // Match response format with /all endpoint
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({
            success: true,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching user profile",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Update user
authRouter.put("/profile", async (req, res) => {
    try {
        const email = req.query.email as string;
        const { password, ...updateData } = req.body;
        const query = { email: email };

        // If password is being updated, hash it
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const result = await collections?.users?.updateOne(query, { $set: updateData });

        if (result && result.matchedCount) {
            let updatedUser = await collections?.users?.findOne(query);
            res.status(200).json({
                success: true,
                user: updatedUser
            });
        } else if (!result?.matchedCount) {
            res.status(404).send(`Failed to find user: ${email}`);
        } else {
            res.status(304).send(`Failed to update user: ${email}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

// Delete user
authRouter.delete("/profile", async (req, res) => {
    try {
        const email = req.query.email as string;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email parameter is required"
            });
        }

        const users = collections.users;
        if (!users) {
            throw new Error('Users collection is not initialized');
        }

        const result = await users.deleteOne({ email });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: `User not found with email: ${email}`
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting user",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

