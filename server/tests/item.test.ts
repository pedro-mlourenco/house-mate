// tests/item.test.ts
import request from "supertest";
import { itemRouter } from "../src/routes/item.routes";
import { TestSetup, setupTestApp, clearCollections, getAuthToken } from "./helpers/testSetup";
import { authRouter } from "../src/routes/auth.routes";

interface TestItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

describe("Items API", () => {
  let setup: TestSetup;
  let authToken: string;
  const testItem: TestItem = {
    name: "Test Item",
    category: "Test Category",
    quantity: 1,
    unit: "piece",
  };

  beforeAll(async () => {
    setup = await setupTestApp();
    setup.app.use('/auth', authRouter);
    setup.app.use("/items", itemRouter);
  }, 30000);

  beforeEach(async () => {
    await clearCollections(setup.db);
    authToken = await getAuthToken(setup.app);
  });

  afterAll(async () => {
    await setup.mongoClient.close();
  });

  let itemId: string;

  test("no token, should not authenticate", async () => {
    const response = await request(setup.app)
      .post("/items")
      .send(testItem);

    expect(response.status).toBe(401);
  });

  test("wrong token, should not authenticate", async () => {
    const response = await request(setup.app)
      .post("/items")
      .set("Authorization", `Bearer  ${authToken}1`)
      .send(testItem);

    expect(response.status).toBe(403);
  });

  test("should create new item", async () => {
    const response = await request(setup.app)
      .post("/items")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testItem);

    expect(response.status).toBe(201);
    itemId = response.text.match(/ID (.*)\./)?.[1] || "";
  });

  test("should get specific item", async () => {
    const createResponse = await request(setup.app)
      .post("/items")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testItem);

    expect(createResponse.status).toBe(201);
    const itemId = createResponse.text.match(/ID (.*)\./)?.[1];

    // Then try to get it
    const response = await request(setup.app)
      .get(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testItem.name);
    expect(response.body.category).toBe(testItem.category);
    expect(response.body.quantity).toBe(testItem.quantity);
  });

  test("should update item", async () => {
    const createResponse = await request(setup.app)
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

    const updateResponse = await request(setup.app)
      .put(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedItem);

    expect(updateResponse.status).toBe(200);

    // Verify update
    const getResponse = await request(setup.app)
      .get(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe(updatedItem.name);
    expect(getResponse.body.quantity).toBe(updatedItem.quantity);
    expect(getResponse.body.category).toBe(updatedItem.category);
  });

  test("should delete item", async () => {
    const createResponse = await request(setup.app)
      .post("/items")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testItem);

    expect(createResponse.status).toBe(201);
    const itemId = createResponse.text.match(/ID (.*)\./)?.[1];

    // Delete the item
    const response = await request(setup.app)
      .delete(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(202);

    // Verify deletion
    const getResponse = await request(setup.app)
      .get(`/items/${itemId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });

  test("should get all items", async () => {
    const response = await request(setup.app)
      .get("/items")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
});
