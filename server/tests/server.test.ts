import express, { Express } from 'express';
import request from 'supertest';
import { MongoClient } from 'mongodb';
import { connectToDatabase } from '../src/database';
import { itemRouter } from '../src/routes/item.routes';
import { storeRouter } from '../src/routes/store.routes';
import { authRouter } from '../src/routes/auth.routes';

let app: Express;
let mongoClient: MongoClient;

beforeAll(async () => {
  // Setup test database connection
  const testUri = process.env.TEST_ATLAS_URI || 'mongodb://localhost:27017/test';
  await connectToDatabase(testUri);
  
  app = express();
  app.use(express.json());
  app.use('/items', itemRouter);
  app.use('/stores', storeRouter);
  app.use('/auth', authRouter);
});

afterAll(async () => {
  await mongoClient?.close();
});

describe('Items API', () => {
  const testItem = {
    name: 'Test Item',
    category: 'Test Category',
    quantity: 1,
    unit: 'piece'
  };

  let itemId: string;

  test('POST /items - Create item', async () => {
    const response = await request(app)
      .post('/items')
      .send(testItem);
    expect(response.status).toBe(201);
    expect(response.text).toContain('Created new Item');
    itemId = response.text.match(/ID (.*)\./)?.[1] || '';
  });

  test('GET /items - Get all items', async () => {
    const response = await request(app).get('/items');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('GET /items/:id - Get specific item', async () => {
    const response = await request(app).get(`/items/${itemId}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testItem.name);
  });

  test('PUT /items/:id - Update item', async () => {
    const response = await request(app)
      .put(`/items/${itemId}`)
      .send({ ...testItem, name: 'Updated Item' });
    expect(response.status).toBe(200);
  });

  test('DELETE /items/:id - Delete item', async () => {
    const response = await request(app).delete(`/items/${itemId}`);
    expect(response.status).toBe(202);
  });
});

describe('Stores API', () => {
  const testStore = {
    name: 'Test Store',
    location: 'Test Location',
    contact: '1234567890'
  };

  let storeId: string;

  test('POST /stores - Create store', async () => {
    const response = await request(app)
      .post('/stores')
      .send(testStore);
    expect(response.status).toBe(201);
    storeId = response.text.match(/ID (.*)\./)?.[1] || '';
  });

  test('GET /stores - Get all stores', async () => {
    const response = await request(app).get('/stores');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('GET /stores/:id - Get specific store', async () => {
    const response = await request(app).get(`/stores/${storeId}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testStore.name);
  });

  test('PUT /stores/:id - Update store', async () => {
    const response = await request(app)
      .put(`/stores/${storeId}`)
      .send({ ...testStore, name: 'Updated Store' });
    expect(response.status).toBe(200);
  });

  test('DELETE /stores/:id - Delete store', async () => {
    const response = await request(app).delete(`/stores/${storeId}`);
    expect(response.status).toBe(202);
  });
});

describe('Auth API', () => {
  const testUser = {
    email: 'test@test.com',
    password: 'password123',
    name: 'Test User'
  };

  let userId: string;
  let authToken: string;

  test('POST /auth/register - Register user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(testUser);
    expect(response.status).toBe(201);
    expect(response.body.email).toBe(testUser.email);
  });

  test('POST /auth/login - Login user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    authToken = response.body.token;
    userId = response.body.user._id;
  });

  test('GET /auth/profile/:id - Get user profile', async () => {
    const response = await request(app)
      .get(`/auth/profile/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.email).toBe(testUser.email);
  });

  test('PUT /auth/profile/:id - Update user profile', async () => {
    const response = await request(app)
      .put(`/auth/profile/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Name' });
    expect(response.status).toBe(200);
  });
});