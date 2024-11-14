import request from "supertest";
import { storeRouter } from "../src/routes/store.routes";
import { TestSetup, setupTestApp, clearCollections, getAuthToken } from "./helpers/testSetup";
import { UserRole } from "../src/models/user";
import { authRouter } from "../src/routes/auth.routes";

interface TestStore {
  name: string;
  location: string;
  contact: string;
}

describe("Stores API", () => {
  let setup: TestSetup;
  let authToken: string;
  let storeId: string;

  const testStore: TestStore = {
    name: "Test Store",
    location: "Test Location",
    contact: "1234567890",
  };

  beforeAll(async () => {
    setup = await setupTestApp();
    setup.app.use("/auth", authRouter);
    setup.app.use("/stores", storeRouter);
  }, 30000);

  beforeEach(async () => {
    await clearCollections(setup.db);
    authToken = await getAuthToken(setup.app);
  });

  afterAll(async () => {
    await setup.mongoClient.close();
  });

  test("should create new store", async () => {
    const response = await request(setup.app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testStore);

    expect(response.status).toBe(201);
    storeId = response.text.match(/ID (.*)\./)?.[1] || "";
  });

  test("should get specific store", async () => {
    // First create a store
    const createResponse = await request(setup.app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testStore);
    storeId = createResponse.text.match(/ID (.*)\./)?.[1] || "";

    // Then get it
    const response = await request(setup.app)
      .get(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testStore.name);
    expect(response.body.location).toBe(testStore.location);
  });

  test("should update store", async () => {
    // First create a store
    const createResponse = await request(setup.app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testStore);
    storeId = createResponse.text.match(/ID (.*)\./)?.[1] || "";

    const updatedStore = {
      ...testStore,
      name: "Updated Store Name",
    };

    const response = await request(setup.app)
      .put(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedStore);

    expect(response.status).toBe(200);

    // Verify update
    const getResponse = await request(setup.app)
      .get(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(getResponse.body.name).toBe(updatedStore.name);
  });

  test("should delete store", async () => {
    // First create a store
    const createResponse = await request(setup.app)
      .post("/stores/new")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testStore);
    storeId = createResponse.text.match(/ID (.*)\./)?.[1] || "";

    const response = await request(setup.app)
      .delete(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(202);

    // Verify deletion
    const getResponse = await request(setup.app)
      .get(`/stores/${storeId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(getResponse.status).toBe(404);
  });

  test("should not create store without required fields", async () => {
    // Test missing location
    const missingLocation = {
      name: "Test Store",
    };
    let response = await request(setup.app)
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
    response = await request(setup.app)
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
    const response = await request(setup.app)
      .get("/stores/all")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
});
