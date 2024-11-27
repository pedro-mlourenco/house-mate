// tests/recipe.test.ts
import request from "supertest";
import { ObjectId } from "mongodb";
import { itemRouter } from "../src/routes/item.routes";
import { recipeRouter } from "../src/routes/recipe.routes";
import { TestSetup, setupTestApp, clearCollections, getAuthToken } from "./helpers/testSetup";
import { authRouter } from "../src/routes/auth.routes";
import { Recipe, RecipeIngredient, Step } from "../src/models/recipe";

describe("Recipe API", () => {
  let setup: TestSetup;
  let authToken: string;
  let testItemId: ObjectId;

  const testRecipe: Partial<Recipe> = {
    name: "Test Recipe",
    description: "Test Description",
    servings: 4,
    prepTime: 30,
    cookTime: 45,
    ingredients: [],
    steps: [
      {
        stepNumber: 1,
        description: "Test Step",
        duration: 10
      }
    ],
    difficulty: "Medium",
    category: ["Test"]
  };

  beforeAll(async () => {
    setup = await setupTestApp();
    setup.app.use('/auth', authRouter);
    setup.app.use('/items', itemRouter);
    setup.app.use('/recipes', recipeRouter);
  });

  beforeEach(async () => {
    await clearCollections(setup.db);
    authToken = await getAuthToken(setup.app);

    // Create test item for recipe ingredients
    const itemResponse = await request(setup.app)
      .post('/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: "Test Item",
        category: "Test Category",
        quantity: 1,
        unit: "piece"
      });

    testItemId = new ObjectId(itemResponse.text.match(/ID (.*)\./)?.[1]);
    testRecipe.ingredients = [{
      itemObjId: testItemId,
      quantity: 2,
      unit: "pieces",
      notes: "Test notes"
    }];
  });

  afterAll(async () => {
    await setup.mongoClient.close();
  });

  test("should create new recipe", async () => {
    const response = await request(setup.app)
      .post("/recipes")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testRecipe);

    expect(response.status).toBe(201);
  });

  test("wrong token, should not authenticate", async () => {
    const response = await request(setup.app)
      .post("/recipes")
      .set("Authorization", `Bearer ${authToken}*1`)
      .send(testRecipe);

    expect(response.status).toBe(403);
  });

  test("should get all recipes", async () => {
    // Create a recipe first
    await request(setup.app)
      .post("/recipes")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testRecipe);

    const response = await request(setup.app)
      .get("/recipes")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });

  test("should get specific recipe", async () => {
    const createResponse = await request(setup.app)
      .post("/recipes")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testRecipe);

    const recipeId = createResponse.text.match(/ID (.*)\./)?.[1];

    const response = await request(setup.app)
      .get(`/recipes/${recipeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testRecipe.name);
  });

  test("should update recipe", async () => {
    // Create a recipe first
    const createResponse = await request(setup.app)
      .post("/recipes")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testRecipe);

    const recipeId = createResponse.text.match(/ID (.*)\./)?.[1];
    const updatedRecipe = {
      ...testRecipe,
      name: "Updated Recipe Name"
    };

    const response = await request(setup.app)
      .put(`/recipes/${recipeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedRecipe);

    expect(response.status).toBe(200);

    // Verify update
    const getResponse = await request(setup.app)
      .get(`/recipes/${recipeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getResponse.body.name).toBe(updatedRecipe.name);
  });

  test("should delete recipe", async () => {
    // Create a recipe first
    const createResponse = await request(setup.app)
      .post("/recipes")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testRecipe);

    expect(createResponse.status).toBe(201);
    const recipeId = createResponse.text.match(/ID (.*)\./)?.[1];

    // Delete recipe
    const response = await request(setup.app)
      .delete(`/recipes/${recipeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(202);

    // Verify deletion
    const getResponse = await request(setup.app)
      .get(`/recipes/${recipeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });

  test("should not create recipe without required fields", async () => {
    const invalidRecipe = {
      name: "Invalid Recipe"
      // Missing required fields
    };

    const response = await request(setup.app)
      .post("/recipes")
      .set("Authorization", `Bearer ${authToken}`)
      .send(invalidRecipe);

    expect(response.status).toBe(400);
  });
});