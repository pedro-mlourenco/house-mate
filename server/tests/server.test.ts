import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import express, { Express } from "express";
import request from "supertest";
import { MongoClient, Db } from "mongodb";
import { connectToDatabase } from "../src/database";
import { itemRouter } from "../src/routes/item.routes";
import { storeRouter } from "../src/routes/store.routes";
import { authRouter } from "../src/routes/auth.routes";
import { UserRole } from "../src/models/user";

interface TestUser {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface TestItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

interface TestStore {
  name: string;
  location: string;
  contact: string;
}

let app: Express;
let mongoClient: MongoClient;
let db: Db;

beforeAll(async () => {
  try {
    const testUri = process.env.TEST_MONGODB_URI;
    if (!testUri) {
      throw new Error("TEST_MONGODB_URI must be defined");
    }

    mongoClient = await connectToDatabase(testUri);
    if (!mongoClient) {
      throw new Error("Database connection failed");
    }

    db = mongoClient.db();
    app = express();
    app.use(express.json());
    app.use("/auth", authRouter);
    app.use("/items", itemRouter);
    app.use("/stores", storeRouter);
  } catch (error) {
    console.error("Test setup failed:", error);
    throw error;
  }
}, 30000);

beforeEach(async () => {
  try {
    await Promise.all([
      db.collection("users").deleteMany({}),
      db.collection("items").deleteMany({}),
      db.collection("stores").deleteMany({}),
    ]);
  } catch (error) {
    console.error("Test cleanup failed:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await mongoClient.close();
  } catch (error) {
    console.error("Test teardown failed:", error);
  }
});

describe("Auth API", () => {
  const defaultUser: TestUser = {
    email: `test${Date.now()}@example.com`,
    password: "password123",
    name: "Test User",
  };

  const adminUser: TestUser = {
    email: `admin${Date.now()}@example.com`,
    password: "admin123",
    name: "Admin User",
    role: UserRole.ADMIN,
  };

  let userToken: string;
  let userId: string;

  test("should register new user", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send(defaultUser);

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(defaultUser.email);
    expect(response.body.role).toBe(UserRole.USER);
    expect(response.body).not.toHaveProperty("password");
    userId = response.body._id;
  });

  test("should login user and return token", async () => {
    await request(app).post("/auth/register").send(defaultUser);

    const response = await request(app).post("/auth/login").send({
      email: defaultUser.email,
      password: defaultUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    userToken = response.body.token;
  });

  test("should get user profile", async () => {
    // First register the user
    await request(app).post("/auth/register").send(defaultUser);

    // Then login to get token
    const loginResponse = await request(app).post("/auth/login").send({
      email: defaultUser.email,
      password: defaultUser.password,
    });
    userToken = loginResponse.body.token;

    // Now get profile
    const response = await request(app)
      .get(`/auth/profile?email=${defaultUser.email}`)
      .set("Authorization", `Bearer ${userToken}`);

    // Update assertions to match API response structure
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.user.email).toBe(defaultUser.email);
    expect(response.body.user.name).toBe(defaultUser.name);
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("should not register duplicate email", async () => {
    await request(app).post("/auth/register").send(defaultUser);
    const response = await request(app)
      .post("/auth/register")
      .send(defaultUser);
    expect(response.status).toBe(409);
  });
  test("should update user profile", async () => {
    // Register and login
    await request(app).post("/auth/register").send(defaultUser);

    const loginResponse = await request(app).post("/auth/login").send({
      email: defaultUser.email,
      password: defaultUser.password,
    });

    const updatedData = {
      name: "Updated Name",
    };

    const response = await request(app)
      .put(`/auth/profile?email=${defaultUser.email}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe(updatedData.name);
  });

  test("should delete user account", async () => {
    // Register and login
    await request(app).post("/auth/register").send(defaultUser);

    const loginResponse = await request(app).post("/auth/login").send({
      email: defaultUser.email,
      password: defaultUser.password,
    });

    const response = await request(app)
      .delete(`/auth/profile?email=${defaultUser.email}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);

    // Verify deletion
    const profileResponse = await request(app)
      .get(`/auth/profile?email=${defaultUser.email}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`);
    expect(profileResponse.status).toBe(404);
  });

  test("should not login with invalid credentials", async () => {
    // Register user first
    await request(app).post("/auth/register").send(defaultUser);

    const response = await request(app).post("/auth/login").send({
      email: defaultUser.email,
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body).not.toHaveProperty("token");
  });

  test("should register admin user", async () => {
    const response = await request(app).post("/auth/register").send(adminUser);

    expect(response.status).toBe(201);
    expect(response.body.role).toBe(UserRole.ADMIN);
    expect(response.body.email).toBe(adminUser.email);
    expect(response.body).not.toHaveProperty("password");
  });
});

describe("Items API", () => {
  let authToken: string;
  const testItem: TestItem = {
    name: "Test Item",
    category: "Test Category",
    quantity: 1,
    unit: "piece",
  };

  beforeEach(async () => {
    const adminUser = {
      email: `admin${Date.now()}@example.com`,
      password: "admin123",
      name: "Admin User",
      role: UserRole.ADMIN,
    };

    await request(app).post("/auth/register").send(adminUser);
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: adminUser.email, password: adminUser.password });

    authToken = loginResponse.body.token;
  });

  let itemId: string;

  test("should create new item", async () => {
    const response = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testItem);

    expect(response.status).toBe(201);
    itemId = response.text.match(/ID (.*)\./)?.[1] || "";
  });

  test("should get specific item", async () => {
    const createResponse = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testItem);

    expect(createResponse.status).toBe(201);
    const itemId = createResponse.text.match(/ID (.*)\./)?.[1];

    // Then try to get it
    const response = await request(app)
      .get(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testItem.name);
    expect(response.body.category).toBe(testItem.category);
    expect(response.body.quantity).toBe(testItem.quantity);
  });

  test("should update item", async () => {
    const createResponse = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testItem);

    expect(createResponse.status).toBe(201);
    const itemId = createResponse.text.match(/ID (.*)\./)?.[1];

    // Update the item
    const updatedItem = {
      ...testItem,
      name: "Updated Item Name",
      quantity: 2,
    };

    const updateResponse = await request(app)
      .put(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedItem);

    expect(updateResponse.status).toBe(200);

    // Verify update
    const getResponse = await request(app)
      .get(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe(updatedItem.name);
    expect(getResponse.body.quantity).toBe(updatedItem.quantity);
    expect(getResponse.body.category).toBe(updatedItem.category);
  });

  test("should delete item", async () => {
    const createResponse = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testItem);

    expect(createResponse.status).toBe(201);
    const itemId = createResponse.text.match(/ID (.*)\./)?.[1];

    // Delete the item
    const response = await request(app)
      .delete(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(202);

    // Verify deletion
    const getResponse = await request(app)
      .get(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });

  test("should get all items", async () => {
    const response = await request(app)
      .get("/items")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
});

describe("Stores API", () => {
  let authToken: string;
  let storeId: string;

  const testStore: TestStore = {
    name: "Test Store",
    location: "Test Location",
    contact: "1234567890",
  };

  beforeEach(async () => {
    const adminUser = {
      email: `admin${Date.now()}@example.com`,
      password: "admin123",
      name: "Admin User",
      role: UserRole.ADMIN,
    };

    await request(app).post("/auth/register").send(adminUser);
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: adminUser.email, password: adminUser.password });

    authToken = loginResponse.body.token;
  });

  test("should create new store", async () => {
    const response = await request(app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testStore);

    expect(response.status).toBe(201);
    storeId = response.text.match(/ID (.*)\./)?.[1] || "";
  });

  test("should get specific store", async () => {
    // First create a store
    const createResponse = await request(app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testStore);
    storeId = createResponse.text.match(/ID (.*)\./)?.[1] || "";

    // Then get it
    const response = await request(app)
      .get(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testStore.name);
    expect(response.body.location).toBe(testStore.location);
  });

  test("should update store", async () => {
    // First create a store
    const createResponse = await request(app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testStore);
    storeId = createResponse.text.match(/ID (.*)\./)?.[1] || "";

    const updatedStore = {
      ...testStore,
      name: "Updated Store Name",
    };

    const response = await request(app)
      .put(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedStore);

    expect(response.status).toBe(200);

    // Verify update
    const getResponse = await request(app)
      .get(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(getResponse.body.name).toBe(updatedStore.name);
  });

  test("should delete store", async () => {
    // First create a store
    const createResponse = await request(app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testStore);
    storeId = createResponse.text.match(/ID (.*)\./)?.[1] || "";

    const response = await request(app)
      .delete(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(202);

    // Verify deletion
    const getResponse = await request(app)
      .get(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(getResponse.status).toBe(404);
  });

  test("should not create store without required fields", async () => {
    // Test missing location
    const missingLocation = {
      name: "Test Store",
    };
    let response = await request(app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(missingLocation);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Name and location are required fields");

    // Test missing name
    const missingName = {
      location: "Test Location",
    };
    response = await request(app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(missingName);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Name and location are required fields");

    // Test empty strings
    /*
    const emptyStrings = {
      name: "",
      location: " "
    };
    response = await request(app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(emptyStrings);
  
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Name and location cannot be empty");
    */
  });

  test("should get all stores", async () => {
    const response = await request(app)
      .get("/stores/all")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
});
