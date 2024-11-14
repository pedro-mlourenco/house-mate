// tests/auth.test.ts
import request from "supertest";
import { UserRole } from "../src/models/user";
import { authRouter } from "../src/routes/auth.routes";
import { TestSetup, setupTestApp, clearCollections } from "./helpers/testSetup";

interface TestUser {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

describe("Auth API", () => {
  let setup: TestSetup;

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

  beforeAll(async () => {
    setup = await setupTestApp();
    setup.app.use("/auth", authRouter);
  }, 30000);

  beforeEach(async () => {
    await clearCollections(setup.db);
  });

  afterAll(async () => {
    await setup.mongoClient.close();
  });

  test("should register new user", async () => {
    const response = await request(setup.app)
      .post("/auth/register")
      .send(defaultUser);

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(defaultUser.email);
    expect(response.body.role).toBe(UserRole.USER);
    expect(response.body).not.toHaveProperty("password");
    userId = response.body._id;
  });

  test("should login user and return token", async () => {
    await request(setup.app).post("/auth/register").send(defaultUser);

    const response = await request(setup.app).post("/auth/login").send({
      email: defaultUser.email,
      password: defaultUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    userToken = response.body.token;
  });

  test("should get user profile", async () => {
    // First register the user
    await request(setup.app).post("/auth/register").send(defaultUser);

    // Then login to get token
    const loginResponse = await request(setup.app).post("/auth/login").send({
      email: defaultUser.email,
      password: defaultUser.password,
    });
    userToken = loginResponse.body.token;

    // Now get profile
    const response = await request(setup.app)
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
    await request(setup.app).post("/auth/register").send(defaultUser);
    const response = await request(setup.app)
      .post("/auth/register")
      .send(defaultUser);
    expect(response.status).toBe(409);
  });
  test("should update user profile", async () => {
    // Register and login
    await request(setup.app).post("/auth/register").send(defaultUser);

    const loginResponse = await request(setup.app).post("/auth/login").send({
      email: defaultUser.email,
      password: defaultUser.password,
    });

    const updatedData = {
      name: "Updated Name",
    };

    const response = await request(setup.app)
      .put(`/auth/profile?email=${defaultUser.email}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe(updatedData.name);
  });

  test("should delete user account", async () => {
    // Register and login
    await request(setup.app).post("/auth/register").send(defaultUser);

    const loginResponse = await request(setup.app).post("/auth/login").send({
      email: defaultUser.email,
      password: defaultUser.password,
    });

    const response = await request(setup.app)
      .delete(`/auth/profile?email=${defaultUser.email}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);

    // Verify deletion
    const profileResponse = await request(setup.app)
      .get(`/auth/profile?email=${defaultUser.email}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`);
    expect(profileResponse.status).toBe(404);
  });

  test("should not login with invalid credentials", async () => {
    // Register user first
    await request(setup.app).post("/auth/register").send(defaultUser);

    const response = await request(setup.app).post("/auth/login").send({
      email: defaultUser.email,
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body).not.toHaveProperty("token");
  });

  test("should register admin user", async () => {
    const response = await request(setup.app)
      .post("/auth/register")
      .send(adminUser);

    expect(response.status).toBe(201);
    expect(response.body.role).toBe(UserRole.ADMIN);
    expect(response.body.email).toBe(adminUser.email);
    expect(response.body).not.toHaveProperty("password");
  });
});
