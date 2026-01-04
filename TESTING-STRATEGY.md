# Testing Strategy for Cricket Team Expense Management Application

## Overview

This document outlines the comprehensive testing strategy for the Cricket Team Expense Management Application, covering unit tests, integration tests, and end-to-end testing approaches.

## Current Test Coverage

### ✅ Existing Tests

**Client-Side (3 test files):**
1. `api.config.test.js` - API configuration and URL formatting
2. `AuthContext.test.js` - Authentication state management
3. `logger.test.js` - Client-side logging functionality

**Server-Side (4 test files):**
1. `environment.test.js` - Environment configuration
2. `azureSQLSchema.test.js` - Database schema validation
3. `logger.test.js` - Server-side logging
4. `api/auth.test.js` - Authentication API integration tests (NEW)

### 📊 Coverage Goals

| Component | Target Coverage | Current Status |
|-----------|----------------|----------------|
| Configuration | 80% | ✅ Achieved |
| Authentication | 70% | ✅ Achieved |
| API Endpoints | 60% | 🟡 Partial (auth only) |
| React Components | 50% | ⚠️ Not implemented |
| Database Layer | 70% | ✅ Achieved |
| Logger/Utilities | 80% | ✅ Achieved |

## Testing Pyramid

```
               /\
              /  \
             / E2E \              10% - Critical user flows
            /______\
           /        \
          / API/Int  \            30% - Integration tests
         /____________\
        /              \
       /  Unit Tests    \         60% - Unit tests
      /__________________\
```

### Level 1: Unit Tests (60% of tests)

**Purpose:** Test individual functions and modules in isolation

**What to Test:**
- ✅ Configuration modules
- ✅ Utility functions
- ✅ Logger implementations
- ✅ Context providers
- ⚠️ Pure business logic functions
- ⚠️ Data transformation functions

**Tools:**
- Jest (test runner)
- React Testing Library (for React components)
- Mock functions and modules

**Example:**
```javascript
describe('formatBirthday', () => {
  test('should format MM-DD correctly', () => {
    expect(formatBirthday('03-15')).toBe('March 15');
  });
});
```

### Level 2: Integration Tests (30% of tests)

**Purpose:** Test interactions between multiple components/modules

**What to Test:**
- ✅ Authentication API endpoints (signup, login, reset password)
- ⏳ Player CRUD API endpoints
- ⏳ Team CRUD API endpoints
- ⏳ Match CRUD API endpoints
- ⏳ Contribution API endpoints
- ⏳ Expense API endpoints
- ⏳ Database interactions
- ⏳ Middleware functionality

**Tools:**
- Jest + Supertest (API testing)
- Test database or mock database
- JWT token generation for protected routes

**Example:**
```javascript
describe('POST /api/auth/login', () => {
  test('should return token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'pass123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### Level 3: End-to-End Tests (10% of tests)

**Purpose:** Test complete user workflows from UI to database

**What to Test:**
- User registration and login flow
- Adding and managing players
- Creating teams and matches
- Recording contributions and expenses
- Viewing summaries and reports

**Tools (Recommended):**
- Cypress or Playwright
- Test database with seed data
- Deployed test environment

**Example Flow:**
```javascript
describe('User Registration Flow', () => {
  it('should allow new user to sign up and access dashboard', () => {
    cy.visit('/signup');
    cy.get('[name="username"]').type('newuser');
    cy.get('[name="password"]').type('password123');
    // ... fill rest of form
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/profile');
  });
});
```

## Test Organization

### Directory Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Component.js
│   │   └── Component.test.js
│   ├── pages/
│   │   ├── Page.js
│   │   └── Page.test.js
│   ├── services/
│   │   ├── service.js
│   │   └── service.test.js
│   └── setupTests.js

server/
├── api/
│   ├── auth.test.js
│   ├── players.test.js
│   └── teams.test.js
├── config/
│   ├── environment.js
│   └── environment.test.js
├── database/
│   ├── azureSQLSchema.js
│   └── azureSQLSchema.test.js
└── utils/
    ├── helper.js
    └── helper.test.js
```

### Naming Conventions

- **Test files:** `*.test.js` or `*.spec.js`
- **Test suites:** Use `describe()` blocks
- **Test cases:** Use `test()` or `it()`
- **Test names:** Should be descriptive and start with "should"

```javascript
describe('ComponentName', () => {
  describe('methodName', () => {
    test('should do something when condition', () => {
      // test implementation
    });
  });
});
```

## Testing Best Practices

### 1. Arrange-Act-Assert Pattern

```javascript
test('should calculate total correctly', () => {
  // Arrange: Set up test data
  const contributions = [100, 200, 300];

  // Act: Execute the function
  const total = calculateTotal(contributions);

  // Assert: Verify the result
  expect(total).toBe(600);
});
```

### 2. Test Independence

- Each test should be independent
- Use `beforeEach()` to reset state
- Don't rely on test execution order

```javascript
describe('UserService', () => {
  beforeEach(() => {
    mockDb.reset();
    jest.clearAllMocks();
  });

  test('test 1', () => { /* ... */ });
  test('test 2', () => { /* ... */ });
});
```

### 3. Mock External Dependencies

```javascript
// Mock axios for API calls
jest.mock('axios');

// Mock database
const mockDb = {
  get: jest.fn(),
  run: jest.fn()
};
```

### 4. Test Both Success and Failure Cases

```javascript
describe('login', () => {
  test('should succeed with valid credentials', async () => {
    // test success path
  });

  test('should fail with invalid password', async () => {
    // test failure path
  });

  test('should fail with non-existent user', async () => {
    // test edge case
  });
});
```

### 5. Use Descriptive Test Names

❌ Bad:
```javascript
test('it works', () => { /* ... */ });
```

✅ Good:
```javascript
test('should return 400 when birthday format is invalid', () => { /* ... */ });
```

## Running Tests

### Client Tests

```bash
cd client

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- Login.test.js

# Run in watch mode
npm test -- --watch
```

### Server Tests

```bash
cd server

# Run all tests
npm test

# Run specific test file
npm test -- api/auth.test.js

# Run in watch mode
npm run test:watch

# Run with verbose output
npm test -- --verbose
```

### CI/CD Integration

Tests are automatically run in GitHub Actions:

```yaml
# Frontend CI
- name: Run tests
  run: CI=true npm test -- --passWithNoTests

# Backend CI
- name: Run tests
  run: npm test
```

## Test Coverage Reports

### Viewing Coverage

Coverage reports show:
- **Statement coverage:** % of statements executed
- **Branch coverage:** % of if/else branches tested
- **Function coverage:** % of functions called
- **Line coverage:** % of lines executed

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report (client)
open client/coverage/lcov-report/index.html

# Open HTML report (server)
open server/coverage/lcov-report/index.html
```

### Coverage Thresholds

Configure in `package.json`:

```json
"jest": {
  "coverageThresholds": {
    "global": {
      "branches": 50,
      "functions": 50,
      "lines": 60,
      "statements": 60
    }
  }
}
```

## Priority Test Implementation Plan

### Phase 1: Core API Tests (Current)
- ✅ Authentication endpoints (signup, login, password reset)
- ⏳ Player CRUD endpoints
- ⏳ Team CRUD endpoints

### Phase 2: Extended API Tests
- ⏳ Match endpoints
- ⏳ Contribution endpoints
- ⏳ Expense endpoints
- ⏳ Summary/Dashboard endpoints

### Phase 3: Component Tests
- ⏳ Login component
- ⏳ Signup component
- ⏳ Profile component
- ⏳ Player list component
- ⏳ Team list component

### Phase 4: E2E Tests (Future)
- ⏳ Critical user flows with Cypress/Playwright
- ⏳ Mobile responsive testing
- ⏳ Performance testing

## Testing Challenges & Solutions

### Challenge 1: Authentication in Tests

**Problem:** Protected routes require valid JWT tokens

**Solution:**
```javascript
// Generate test token
const token = jwt.sign(
  { userId: 1, username: 'test', role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Use in requests
const response = await request(app)
  .get('/api/protected-route')
  .set('Authorization', `Bearer ${token}`);
```

### Challenge 2: Database State

**Problem:** Tests affect each other through shared database

**Solution 1:** Use in-memory SQLite
```javascript
const db = new sqlite3.Database(':memory:');
```

**Solution 2:** Reset database between tests
```javascript
beforeEach(async () => {
  await db.exec('DELETE FROM users');
  await db.exec('DELETE FROM players');
});
```

**Solution 3:** Use transactions and rollback
```javascript
beforeEach(async () => {
  await db.exec('BEGIN TRANSACTION');
});

afterEach(async () => {
  await db.exec('ROLLBACK');
});
```

### Challenge 3: Async Operations

**Problem:** Tests complete before async operations finish

**Solution:**
```javascript
// Use async/await
test('should create user', async () => {
  const response = await request(app)
    .post('/api/users')
    .send(userData);

  expect(response.status).toBe(201);
});

// Or use done callback
test('should create user', (done) => {
  request(app)
    .post('/api/users')
    .send(userData)
    .end((err, res) => {
      expect(res.status).toBe(201);
      done();
    });
});
```

### Challenge 4: Application Insights in Tests

**Problem:** Application Insights tries to send telemetry during tests

**Solution:**
```javascript
// Mock logger in tests
jest.mock('../services/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    trackEvent: jest.fn()
  })
}));
```

## Continuous Improvement

### Metrics to Track

1. **Test Coverage:** Aim for 70%+ overall
2. **Test Execution Time:** Keep under 2 minutes for full suite
3. **Flaky Tests:** Identify and fix tests that fail intermittently
4. **Test Maintenance:** Review and update tests with code changes

### Regular Reviews

- **Weekly:** Review failing tests in CI/CD
- **Monthly:** Analyze coverage reports, identify gaps
- **Quarterly:** Update testing strategy based on learnings

### Adding New Tests

When adding new features:
1. Write tests BEFORE implementing (TDD approach recommended)
2. Include happy path and edge cases
3. Test error handling
4. Update this strategy document if new patterns emerge

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Cypress Documentation](https://docs.cypress.io/)

### Internal Docs
- [TESTING.md](./TESTING.md) - Test execution guide
- [LOGGING-SETUP.md](./LOGGING-SETUP.md) - Logging in tests
- [LOGGING-SUMMARY.md](./LOGGING-SUMMARY.md) - Logging implementation details

## Conclusion

A comprehensive testing strategy ensures:
- ✅ Code quality and reliability
- ✅ Faster debugging and issue resolution
- ✅ Confidence in deployments
- ✅ Better code documentation through tests
- ✅ Easier refactoring and maintenance

Start with the most critical paths (authentication, core CRUD operations) and gradually expand coverage. Prioritize integration tests for APIs and unit tests for business logic.

**Remember:** Tests are living documentation - keep them updated and maintainable!
