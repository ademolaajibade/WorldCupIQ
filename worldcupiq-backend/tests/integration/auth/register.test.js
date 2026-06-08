const request = require('supertest');
const app = require('../../../app');
const User = require('../../../src/models/User');
const mongoose = require('mongoose');

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/v1/auth/register', () => {
  const validPayload = {
    email: 'newuser@test.com',
    password: 'Password1!',
    displayName: 'New User',
    country: 'US',
  };

  test('creates user and returns accessToken', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('newuser@test.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('rejects duplicate email with 409', async () => {
    await request(app).post('/api/v1/auth/register').send(validPayload);
    const res = await request(app).post('/api/v1/auth/register').send(validPayload);
    expect(res.status).toBe(409);
  });

  test('rejects weak password with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validPayload, password: 'weak' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('rejects invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validPayload, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('does not return passwordHash in response', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validPayload);
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'login@test.com',
      password: 'Password1!',
      displayName: 'Login User',
      country: 'NG',
    });
  });

  test('returns tokens with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test('rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'WrongPass1!' });
    expect(res.status).toBe(401);
  });

  test('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password1!' });
    expect(res.status).toBe(401);
  });
});
