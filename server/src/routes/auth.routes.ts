// auth.routes.ts
import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken, checkRole } from "../middleware/auth.middleware";
import { UserRole } from "../models/user";

export const authRouter = express.Router();
authRouter.use(express.json());

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: User already exists
 */
authRouter.post("/register", async (req, res) => {
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
      createdAt: new Date(),
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
    res
      .status(400)
      .send(error instanceof Error ? error.message : "Unknown error");
  }
});
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *           example:
 *             email: "user@ example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIs..."
 *               user:
 *                 email: "user@ example.com"
 *                 name: "John Doe"
 *                 role: "user"
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
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
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Return token and user data
    res.status(200).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error during login");
  }
});

/**
 * @swagger
 * /auth/all:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all registered users (requires authentication)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: user@ example.com
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       role:
 *                         type: string
 *                         enum: [user, admin]
 *                         example: user
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Invalid token
 *       500:
 *         description: Server error
 */
authRouter.get("/all", authenticateToken, async (req, res) => {
  try {
    const users = collections.users;
    if (!users) {
      throw new Error("Users collection is not initialized");
    }
    const allUsers = await users.find({}).toArray();
    // Remove passwords from all users
    const usersWithoutPasswords = allUsers.map((user) => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.status(200).json({
      success: true,
      users: usersWithoutPasswords,
    });
  } catch (error) {
    console.error("Fetch all users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile by email
 *     description: Retrieve a specific user's profile details (requires authentication)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address of the user to retrieve
 *         example: user@ example.com
 *     responses:
 *       200:
 *         description: User profile successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: user@ example.com
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                       example: user
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Email parameter is missing
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
authRouter.get("/profile", authenticateToken, async (req, res) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required",
      });
    }

    const users = collections.users;
    if (!users) {
      throw new Error("Users collection is not initialized");
    }

    // Match query format with working /all endpoint
    const user = await users.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with email: ${email}`,
      });
    }

    // Match response format with /all endpoint
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update a user's profile information (requires authentication)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the user to update
 *         example: user@ example.com
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the user
 *                 example: John Updated Doe
 *               password:
 *                 type: string
 *                 description: New password (optional)
 *                 format: password
 *                 example: newpassword123
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: New role (optional)
 *                 example: admin
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: user@ example.com
 *                     name:
 *                       type: string
 *                       example: John Updated Doe
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Missing email parameter or invalid input
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
authRouter.put("/profile", authenticateToken, async (req, res) => {
  try {
    const email = req.query.email as string;
    const { password, ...updateData } = req.body;
    const query = { email: email };

    // If password is being updated, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const result = await collections?.users?.updateOne(query, {
      $set: updateData,
    });

    if (result && result.matchedCount) {
      let updatedUser = await collections?.users?.findOne(query);
      res.status(200).json({
        success: true,
        user: updatedUser,
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

/**
 * @swagger
 * /auth/profile:
 *   delete:
 *     summary: Delete user account
 *     description: Delete a user's account by email (requires authentication)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the user to delete
 *         example: user@ example.com
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       400:
 *         description: Email parameter is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Email parameter is required
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Invalid token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found with email: user@ example.com
 *       500:
 *         description: Server error
 */
authRouter.delete("/profile", authenticateToken, async (req, res) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required",
      });
    }

    const users = collections.users;
    if (!users) {
      throw new Error("Users collection is not initialized");
    }

    const result = await users.deleteOne({ email });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `User not found with email: ${email}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate user session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized - No token provided
 */
authRouter.post("/logout", authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    // Add token to blacklist
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!decoded.exp) {
      throw new Error('Token has no expiration');
    }

    await collections.tokenBlacklist?.insertOne({
      token,
      expiresAt: new Date(decoded.exp * 1000)
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
    });
  }
});
