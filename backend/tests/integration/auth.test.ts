import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import { PasswordService } from '../../src/services/passwordService';

describe('Authentication API', () => {
  let testUser: { email: string; password: string; id: string };
  const agent = request.agent(app); // Maintains session cookies

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await PasswordService.hash('TestPass123');
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      },
    });

    testUser = {
      email: 'test@example.com',
      password: 'TestPass123',
      id: user.id,
    };
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' },
    });
    await prisma.$disconnect();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await agent.post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'invalid@example.com',
        password: testUser.password,
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate email format', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'invalid-email',
        password: 'password',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user when authenticated', async () => {
      // First login
      await agent.post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      // Then get current user
      const response = await agent.get('/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail when not authenticated', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      // First login
      await agent.post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      // Then logout
      const response = await agent.post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify session is destroyed
      const meResponse = await agent.get('/auth/me');
      expect(meResponse.status).toBe(401);
    });
  });

  describe('POST /auth/register', () => {
    it('should register new user with valid data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'NewPass123',
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');

      // Cleanup
      await prisma.user.deleteMany({ where: { email: 'newuser@example.com' } });
    });

    it('should fail when user already exists', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: 'TestPass123',
        });

      expect(response.status).toBe(409);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'weak@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
    });
  });
});
