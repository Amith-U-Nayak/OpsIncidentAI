const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const { app } = require('../app');
const User = require('../models/User.model');

// Increase timeout to 60 seconds because mongodb-memory-server needs to download 
// the MongoDB binary on the very first run!
jest.setTimeout(60000);

let mongoServer;

// ─────────────────────────────────────────────
// BEFORE ALL TESTS: Start fake in-memory database
// ─────────────────────────────────────────────
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
});

// ─────────────────────────────────────────────
// AFTER EACH TEST: Clear database so tests don't overlap
// ─────────────────────────────────────────────
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// ─────────────────────────────────────────────
// AFTER ALL TESTS: Stop server and disconnect
// ─────────────────────────────────────────────
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// ─────────────────────────────────────────────
// 🧪 THE TESTS
// ─────────────────────────────────────────────
describe('Auth API Endpoints', () => {
  
  // Test 1: Successful Registration
  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Engineer',
        email: 'test@opsgenie.com',
        password: 'password123',
        role: 'engineer'
        // Notice we omitted 'organization' to prove our previous bug fix works!
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.name).toBe('Test Engineer');
    
    // Verify it was actually saved in the DB
    const userInDb = await User.findOne({ email: 'test@opsgenie.com' });
    expect(userInDb).toBeTruthy();
  });

  // Test 2: Validation Error
  it('should reject registration if email is missing', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Engineer',
        password: 'password123'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Please provide name, email, and password');
  });

  // Test 3: Successful Login
  it('should login an existing user', async () => {
    // First, create the user manually in the database
    await User.create({
      name: 'Login Tester',
      email: 'login@test.com',
      password: 'mypassword',
    });

    // Then, try to hit the login route
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@test.com',
        password: 'mypassword'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('login@test.com');
  });

  // Test 4: Invalid Password
  it('should reject login with wrong password', async () => {
    await User.create({
      name: 'Wrong Pass',
      email: 'wrong@test.com',
      password: 'correctpassword',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@test.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid credentials');
  });
});
