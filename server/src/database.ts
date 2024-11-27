import * as mongodb from "mongodb";
import { Item } from "./models/item"; // Assuming you have defined the Item interface
import { Store } from "./models/store"; // Assuming you have defined the Store interface
import { User, UserRole } from "./models/user";
import { userSchema, itemSchema, storeSchema, tokenSchema,recipeSchema  } from "./models/schemas";
import { TokenBlacklist } from "./models/token";
import { Recipe } from "./models/recipe";

export const collections: {
  items?: mongodb.Collection<Item>;
  stores?: mongodb.Collection<Store>;
  users?: mongodb.Collection<User>;
  tokenBlacklist?: mongodb.Collection<TokenBlacklist>;
  recipes?: mongodb.Collection<Recipe>;
} = {};

export async function connectToDatabase(
  uri: string
): Promise<mongodb.MongoClient> {
  const client = new mongodb.MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Initialize collections
    collections.items = db.collection<Item>("items");
    collections.stores = db.collection<Store>("stores");
    collections.users = db.collection<User>("users");
    collections.tokenBlacklist = db.collection<TokenBlacklist>("tokenBlacklist");
    collections.recipes = db.collection<Recipe>("recipes");
    // Add schema validation
    await Promise.all([
      db
        .command({
          collMod: "users",
          validator: userSchema,
        })
        .catch(async (error: mongodb.MongoServerError) => {
          if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("users", { validator: userSchema });
          }
        }),
      db
        .command({
          collMod: "items",
          validator: itemSchema,
        })
        .catch(async (error: mongodb.MongoServerError) => {
          if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("items", { validator: itemSchema });
          }
        }),
      db
        .command({
          collMod: "stores",
          validator: storeSchema,
        })
        .catch(async (error: mongodb.MongoServerError) => {
          if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("stores", { validator: storeSchema });
          }
        }),
        db
        .command({
          collMod: "tokenBlacklist",
          validator: tokenSchema,
        })
        .catch(async (error: mongodb.MongoServerError) => {
          if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("tokens", { validator: tokenSchema });
          }
        }),
        db
        .command({
          collMod: "recipes",
          validator: recipeSchema,
        })
        .catch(async (error: mongodb.MongoServerError) => {
          if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("recipes", { validator: recipeSchema });
          }
        })
    ]);

    return client;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}
