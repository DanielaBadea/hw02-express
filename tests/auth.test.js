const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const router = require('../routes/api/auth');
const User = require('../validate/userShema');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use('/api/auth', router);

const dbConnection = process.env.DATABASE_CONNECT || 'mongodb://localhost:27017/test_db';

describe('Authentication API', () => {
  beforeAll(async () => {
    jest.setTimeout(10000);

    await mongoose.connect(dbConnection, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      subscription: 'starter'
    });
  });

  afterAll(async () => {
    // Sterg testul din baza de date
    await User.deleteOne({ email: 'test@example.com' });
    await mongoose.connection.close();
  });

  test('POST /login - should return a token and user details on successful login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('email', 'test@example.com');
    expect(response.body.user).toHaveProperty('subscription');
  });
});
