// server.test.ts
import express, { Express } from 'express';
import request from 'supertest';
import { MongoClient } from 'mongodb';
import { connectToDatabase } from '../src/database';
import { itemRouter } from '../src/routes/item.routes';
import { storeRouter } from '../src/routes/store.routes';
import { authRouter } from '../src/routes/auth.routes';
import { UserRole } from '../src/models/user';

// Setup global variables
let app: Express;
let mongoClient: MongoClient | null = null;

// Add timeout and proper error handling
beforeAll(async () => {
  try {
    const testUri = process.env.ATLAS_URI || 'mongodb+srv://learnmongoonline:2ILJBsuY5Ren3rkg@learnmongo.ou70c.mongodb.net?retryWrites=true&w=majority';
    const client = await connectToDatabase(testUri);
    mongoClient = client;
    
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    app.use('/items', itemRouter);
    app.use('/stores', storeRouter);
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}, 30000);

// Add cleanup
afterAll(async () => {
  if (mongoClient) {
    const db = mongoClient.db();
    await Promise.all([
      db.collection('users').deleteMany({}),
      db.collection('items').deleteMany({}),
      db.collection('stores').deleteMany({})
    ]);
    await mongoClient.close();
  }
});

// Add test data setup
beforeEach(async () => {
  if (mongoClient) {
    const db = mongoClient.db();
    await Promise.all([
      db.collection('users').deleteMany({}),
      db.collection('items').deleteMany({}),
      db.collection('stores').deleteMany({})
    ]);
  }
});

describe('Auth API', () => {
  const defaultUser = {
    email: 'user@test.com',
    password: 'password123',
    name: 'Test User'
  };

  const adminUser = {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin User',
    role: UserRole.ADMIN
  };

  let userToken: string;
  let userId: string;

  // Create - Register
  test('should register new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(defaultUser);
    
    expect(response.status).toBe(201);
    expect(response.body.email).toBe(defaultUser.email);
    expect(response.body).not.toHaveProperty('password');
    expect(response.body.role).toBe(UserRole.USER);
    userId = response.body._id;
  });

  // Login
  test('should login user and return token', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: defaultUser.email,
        password: defaultUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    userToken = response.body.token;
  });

  // Read - Get Profile
  test('should get user profile', async () => {
    const response = await request(app)
      .get(`/auth/profile/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(defaultUser.email);
    expect(response.body).not.toHaveProperty('password');
  });

  // Update - Update Profile
  test('should update user profile', async () => {
    const updatedData = {
      name: 'Updated Name'
    };

    const response = await request(app)
      .put(`/auth/profile/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatedData);

    expect(response.status).toBe(200);

    // Verify update
    const getResponse = await request(app)
      .get(`/auth/profile/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(getResponse.body.name).toBe(updatedData.name);
  });

  // Delete - Delete Account
  test('should delete user account', async () => {
    const response = await request(app)
      .delete(`/auth/profile/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    // Verify deletion
    const getResponse = await request(app)
      .get(`/auth/profile/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(getResponse.status).toBe(404);
  });

  // Validation Tests
  test('should not register user with existing email', async () => {
    // First registration
    await request(app)
      .post('/auth/register')
      .send(defaultUser);

    // Attempt duplicate registration
    const response = await request(app)
      .post('/auth/register')
      .send(defaultUser);

    expect(response.status).toBe(409);
  });

  test('should not login with invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: defaultUser.email,
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
  });

  // Role-based Tests
  test('should register admin user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(adminUser);

    expect(response.status).toBe(201);
    expect(response.body.role).toBe(UserRole.ADMIN);
  });
});

describe('Items API', () => {
  let authToken: string;
  const testItem = {
    name: 'Test Item',
    category: 'Test Category',
    quantity: 1,
    unit: 'piece'
  };
  let itemId: string;

  beforeAll(async () => {
    // Login as admin to get token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });
    authToken = loginResponse.body.token;
  });

  // Create
  test('should create new item', async () => {
    const response = await request(app)
      .post('/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testItem);

    expect(response.status).toBe(201);
    itemId = response.text.match(/ID (.*)\./)?.[1] || '';
  });

  // Read
  test('should get all items', async () => {
    const response = await request(app)
      .get('/items')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('should get specific item', async () => {
    const response = await request(app)
      .get(`/items/${itemId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testItem.name);
  });

  // Update
  test('should update item', async () => {
    const updatedItem = {
      ...testItem,
      name: 'Updated Item'
    };

    const response = await request(app)
      .put(`/items/${itemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedItem);

    expect(response.status).toBe(200);
  });

  // Delete
  test('should delete item', async () => {
    const response = await request(app)
      .delete(`/items/${itemId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(202);
  });
});

describe('Stores API', () => {
  let authToken: string;
  const testStore = {
    name: 'Test Store',
    location: 'Test Location',
    contact: '1234567890'
  };
  let storeId: string;

  beforeAll(async () => {
    // Login as admin
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });
    authToken = loginResponse.body.token;
  });

  // Create
  test('should create new store', async () => {
    const response = await request(app)
      .post('/stores')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testStore);

    expect(response.status).toBe(201);
    storeId = response.text.match(/ID (.*)\./)?.[1] || '';
  });

  // Read
  test('should get all stores', async () => {
    const response = await request(app)
      .get('/stores')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('should get specific store', async () => {
    const response = await request(app)
      .get(`/stores/${storeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testStore.name);
  });

  // Update
  test('should update store', async () => {
    const updatedStore = {
      ...testStore,
      name: 'Updated Store'
    };

    const response = await request(app)
      .put(`/stores/${storeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedStore);

    expect(response.status).toBe(200);
  });

  // Delete
  test('should delete store', async () => {
    const response = await request(app)
      .delete(`/stores/${storeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(202);
  });

  // Validation
  test('should not create store without required fields', async () => {
    const invalidStore = {
      name: 'Test Store'
      // Missing location
    };

    const response = await request(app)
      .post('/stores')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidStore);

    expect(response.status).toBe(400);
  });
});