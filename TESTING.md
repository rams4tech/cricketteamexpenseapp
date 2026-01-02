# Testing Guide

This document provides information about the test suite for the Cricket Team Expense Management Application.

## Overview

The application includes comprehensive test coverage for both client and server components using industry-standard testing frameworks.

## Client-Side Testing

### Framework
- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions

### Running Client Tests

```bash
# Navigate to client directory
cd client

# Install dependencies (if not already installed)
npm install

# Run tests in watch mode
npm test

# Run tests with coverage report
npm run test:coverage
```

### Client Test Files

1. **api.config.test.js** - Tests for API configuration
   - Validates API URL formatting
   - Tests environment-based configuration
   - Ensures proper path handling

2. **AuthContext.test.js** - Tests for authentication context
   - Tests authentication state management
   - Validates user login/logout flow
   - Tests admin role detection
   - Validates localStorage integration

3. **logger.test.js** - Tests for client-side logger
   - Tests logging functionality (info, error, debug)
   - Validates Application Insights integration
   - Tests event and API call tracking

### Test Configuration

The client uses `setupTests.js` which:
- Configures jest-dom matchers
- Mocks localStorage and sessionStorage
- Mocks window.matchMedia for responsive tests

## Server-Side Testing

### Framework
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library (for API testing)

### Running Server Tests

```bash
# Navigate to server directory
cd server

# Install dependencies (if not already installed)
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Server Test Files

1. **environment.test.js** - Tests for environment configuration
   - Validates configuration loading
   - Tests database selection logic (SQLite vs Azure SQL)
   - Validates JWT and port configuration

2. **azureSQLSchema.test.js** - Tests for database schema
   - Tests table creation logic
   - Validates schema structure
   - Tests MM-DD birthday format implementation
   - Tests error handling

3. **logger.test.js** - Tests for server-side logger
   - Tests logging functionality
   - Validates Application Insights integration
   - Tests correlation ID tracking
   - Tests event tracking

## Test Coverage

Both client and server are configured to generate coverage reports:

- **Client**: Run `npm run test:coverage` in the client directory
- **Server**: Run `npm test` in the server directory (includes coverage by default)

Coverage reports show:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## Best Practices

### Writing Tests

1. **Test Naming**: Use descriptive names that explain what is being tested
   ```javascript
   test('should format API URL with path correctly', () => {
     // test implementation
   });
   ```

2. **Arrange-Act-Assert**: Structure tests clearly
   ```javascript
   test('example test', () => {
     // Arrange: Set up test data
     const input = 'test';

     // Act: Execute the code being tested
     const result = functionToTest(input);

     // Assert: Verify the results
     expect(result).toBe('expected');
   });
   ```

3. **Mock External Dependencies**: Use Jest mocks for external services
   ```javascript
   jest.mock('./externalService');
   ```

4. **Clean Up**: Reset mocks and state after each test
   ```javascript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

### Running Tests in CI/CD

Tests are automatically run in the CI pipeline:

- **Client Tests**: Run during `frontend-ci` job with `CI=true npm test -- --passWithNoTests`
- **Server Tests**: Run during `backend-ci` job with `npm test`

Both generate coverage reports that can be used for quality gates.

## Adding New Tests

### Client Component Test Template

```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  test('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Server Function Test Template

```javascript
const yourFunction = require('./yourFunction');

describe('yourFunction', () => {
  test('should return expected result', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

## Troubleshooting

### Common Issues

1. **Tests Hanging**: If tests hang in watch mode, press `q` to quit
2. **Module Not Found**: Run `npm install` to ensure all dependencies are installed
3. **Coverage Issues**: Ensure test files are named with `.test.js` or `.spec.js` suffix

### Getting Help

For issues with tests:
1. Check the console output for detailed error messages
2. Verify all dependencies are installed
3. Ensure test files follow the naming convention
4. Check that mocks are properly configured

## Future Enhancements

Potential areas for expanding test coverage:

1. **Integration Tests**: Add end-to-end API tests using Supertest
2. **E2E Tests**: Add Cypress or Playwright for full application testing
3. **Component Tests**: Add tests for all React components
4. **API Endpoint Tests**: Add comprehensive tests for all API routes
5. **Performance Tests**: Add load testing for critical endpoints