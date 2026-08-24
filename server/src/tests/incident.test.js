const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const { app } = require('../app');
const User = require('../models/User.model');
const Incident = require('../models/Incident.model');
const agentGraph = require('../agents/agentGraph'); // We will mock this!

jest.setTimeout(60000);

let mongoServer;
let adminToken;
let adminUserId;

// ─────────────────────────────────────────────
// MOCK THE LANGGRAPH AI PIPELINE
// ─────────────────────────────────────────────
// This intercepts any call to agentGraph.invoke() and returns fake data instantly.
// This saves money, runs in 1ms, and guarantees our tests don't randomly fail if Groq is down!
jest.mock('../agents/agentGraph', () => ({
  app: {
    invoke: jest.fn().mockResolvedValue({
      incidentId: 'fake-id',
      severity: 'Critical',
      rootCause: 'Mocked out of memory error',
      confidence: 99,
      postMortemId: 'fake-pm-id'
    })
  }
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create an admin user to get a JWT token (since incident routes are protected)
  const admin = await User.create({
    name: 'Admin Tester',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  });
  adminUserId = admin._id;

  // Login to get token
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'password123' });
  
  adminToken = res.body.token;
});

afterEach(async () => {
  await Incident.deleteMany(); // Clear incidents, keep user
  jest.clearAllMocks(); // Reset mock counters
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// ─────────────────────────────────────────────
// 🧪 INCIDENT TESTS
// ─────────────────────────────────────────────
describe('Incident API Endpoints', () => {
  
  it('should block unauthorized users (no token) from creating an incident', async () => {
    const response = await request(app)
      .post('/api/incidents')
      .send({ title: 'Server Down', description: 'Help' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Access denied. No token provided. Please login.');
  });

  it('should create an incident when an authorized user submits the form', async () => {
    const response = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Database Crash',
        description: 'Redis cache ran out of memory',
        severity: 'High'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe('Database Crash');
    expect(response.body.data.createdBy.toString()).toBe(adminUserId.toString());
  });

  it('should trigger the mocked AI pipeline when /analyse is called', async () => {
    // 1. Create a fake incident in the DB
    const incident = await Incident.create({
      title: 'AI Test Incident',
      description: 'Something broke',
      severity: 'Low',
      createdBy: adminUserId
    });

    // 2. Call the AI analyse route
    const response = await request(app)
      .post(`/api/incidents/${incident._id}/analyse`)
      .set('Authorization', `Bearer ${adminToken}`);

    // 3. Verify it used our Mock instead of calling Groq!
    expect(response.status).toBe(200);
    expect(response.body.data.rootCause).toBe('Mocked out of memory error');
    
    // 4. Verify that Jest successfully intercepted the function call
    // Since we mocked { app: { invoke: ... } }, we check agentGraph.app.invoke
    expect(agentGraph.app.invoke).toHaveBeenCalledTimes(1);
  });
});
