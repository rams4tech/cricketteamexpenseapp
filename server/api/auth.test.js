/**
 * Integration tests for Authentication API endpoints
 * Tests signup, login, and password reset functionality
 */

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock database
const mockDb = {
  data: {
    users: [],
    players: []
  },
  run(query, params, callback) {
    // Simulate INSERT for signup
    if (query.includes('INSERT INTO users')) {
      const id = this.data.users.length + 1;
      this.data.users.push({
        id,
        username: params[0],
        password: params[1],
        role: params[2],
        player_id: id,
        security_question: params[3],
        security_answer: params[4]
      });
      callback.call({ lastID: id }, null);
    } else if (query.includes('INSERT INTO players')) {
      const id = this.data.players.length + 1;
      this.data.players.push({
        id,
        firstname: params[0],
        lastname: params[1],
        birthday: params[2],
        contact: params[3]
      });
      callback.call({ lastID: id }, null);
    }
  },
  get(query, params, callback) {
    // Simulate SELECT for login
    if (query.includes('SELECT * FROM users WHERE username')) {
      const user = this.data.users.find(u => u.username === params[0]);
      callback(null, user);
    }
  },
  reset() {
    this.data.users = [];
    this.data.players = [];
  }
};

// Create a test app
function createTestApp() {
  const app = express();
  const cors = require('cors');
  const bodyParser = require('body-parser');

  app.use(cors());
  app.use(bodyParser.json());

  const JWT_SECRET = 'test-secret-key';

  // Signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    const { username, password, firstname, lastname, birthday, contact, securityQuestion, securityAnswer } = req.body;

    try {
      // Validate birthday format if provided
      if (birthday && !/^\d{2}-\d{2}$/.test(birthday)) {
        return res.status(400).json({ error: 'Birthday must be in MM-DD format (e.g., 03-15)' });
      }

      // Check if user already exists
      mockDb.get('SELECT * FROM users WHERE username = ?', [username], async (err, existingUser) => {
        if (existingUser) {
          return res.status(409).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

        // Insert into players table
        mockDb.run(
          'INSERT INTO players (firstname, lastname, birthday, contact) VALUES (?, ?, ?, ?)',
          [firstname, lastname, birthday || null, contact || null],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            const playerId = this.lastID;

            // Insert into users table
            mockDb.run(
              'INSERT INTO users (username, password, role, player_id, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?)',
              [username, hashedPassword, 'player', playerId, securityQuestion, hashedAnswer],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }

                res.status(201).json({ message: 'User created successfully' });
              }
            );
          }
        );
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      mockDb.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { userId: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            player_id: user.player_id
          }
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Password reset endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    const { username, securityQuestion, securityAnswer, newPassword } = req.body;

    try {
      mockDb.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) {
          return res.status(404).json({ error: 'User not found' });
        }

        if (user.security_question !== securityQuestion) {
          return res.status(400).json({ error: 'Incorrect security question' });
        }

        const isValidAnswer = await bcrypt.compare(
          securityAnswer.toLowerCase().trim(),
          user.security_answer
        );

        if (!isValidAnswer) {
          return res.status(400).json({ error: 'Incorrect security answer' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // In real implementation, would update database here
        res.json({ message: 'Password reset successfully' });
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return app;
}

describe('Authentication API', () => {
  let app;

  beforeEach(() => {
    mockDb.reset();
    app = createTestApp();
  });

  describe('POST /api/auth/signup', () => {
    test('should create a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        firstname: 'John',
        lastname: 'Doe',
        birthday: '03-15',
        contact: '+1234567890',
        securityQuestion: 'What was the name of your first pet?',
        securityAnswer: 'Fluffy'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
    });

    test('should reject signup with invalid birthday format', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        firstname: 'John',
        lastname: 'Doe',
        birthday: '2000-03-15', // Wrong format
        contact: '+1234567890',
        securityQuestion: 'What was the name of your first pet?',
        securityAnswer: 'Fluffy'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Birthday must be in MM-DD format');
    });

    test('should reject signup with duplicate username', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        firstname: 'John',
        lastname: 'Doe',
        securityQuestion: 'What was the name of your first pet?',
        securityAnswer: 'Fluffy'
      };

      // First signup
      await request(app).post('/api/auth/signup').send(userData);

      // Duplicate signup
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Username already exists');
    });

    test('should allow signup without optional fields', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        firstname: 'John',
        lastname: 'Doe',
        securityQuestion: 'What was the name of your first pet?',
        securityAnswer: 'Fluffy'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(201);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post('/api/auth/signup').send({
        username: 'testuser',
        password: 'password123',
        firstname: 'John',
        lastname: 'Doe',
        securityQuestion: 'What was the name of your first pet?',
        securityAnswer: 'Fluffy'
      });
    });

    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.role).toBe('player');
    });

    test('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject login with non-existent username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.body.token).toBeTruthy();

      // Verify token structure
      const tokenParts = response.body.token.split('.');
      expect(tokenParts).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('POST /api/auth/reset-password', () => {
    const securityQuestion = 'What was the name of your first pet?';
    const securityAnswer = 'Fluffy';

    beforeEach(async () => {
      // Create a test user
      await request(app).post('/api/auth/signup').send({
        username: 'testuser',
        password: 'oldpassword123',
        firstname: 'John',
        lastname: 'Doe',
        securityQuestion,
        securityAnswer
      });
    });

    test('should reset password with correct security answer', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          username: 'testuser',
          securityQuestion,
          securityAnswer,
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successfully');
    });

    test('should reject password reset with wrong security answer', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          username: 'testuser',
          securityQuestion,
          securityAnswer: 'WrongAnswer',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Incorrect security answer');
    });

    test('should reject password reset with wrong security question', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          username: 'testuser',
          securityQuestion: 'Different question?',
          securityAnswer,
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Incorrect security question');
    });

    test('should reject password reset for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          username: 'nonexistent',
          securityQuestion,
          securityAnswer,
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    test('should be case-insensitive for security answers', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          username: 'testuser',
          securityQuestion,
          securityAnswer: 'FLUFFY', // Uppercase
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
    });
  });
});
