// tests/helpers/testSetup.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import express, { Express } from "express";
import { MongoClient, Db } from "mongodb";
import { connectToDatabase } from "../../src/database";

export interface TestSetup {
  app: Express;
  mongoClient: MongoClient;
  db: Db;
}

export async function setupTestApp(): Promise<TestSetup> {
  const testUri = process.env.TEST_MONGODB_URI;
  if (!testUri) {
    throw new Error("TEST_MONGODB_URI must be defined");
  }

  const mongoClient = await connectToDatabase(testUri);
  const db = mongoClient.db();
  const app = express();
  app.use(express.json());

  return { app, mongoClient, db };
}

export async function clearCollections(db: Db): Promise<void> {
  await Promise.all([
    db.collection("users").deleteMany({}),
    db.collection("items").deleteMany({}),
    db.collection("stores").deleteMany({})
  ]);
}