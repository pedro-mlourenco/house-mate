// tests/helpers/testSetup.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import express, { Express } from "express";
import { MongoClient, Db } from "mongodb";
import { connectToDatabase } from "../../src/database";
import { authRouter } from "../../src/routes/auth.routes";
import request from "supertest"; 

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
export async function getAuthToken(app: Express): Promise<string> {
  const adminUser = {
    email: `admin${Date.now()}@test.com`,
    password: 'admin123',
    name: 'Admin Test',
    role: 'admin'
  };

  await request(app)
    .post('/auth/register')
    .send(adminUser);

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: adminUser.email,
      password: adminUser.password
    });

  return loginResponse.body.token;
}