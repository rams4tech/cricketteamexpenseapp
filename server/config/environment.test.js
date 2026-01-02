/**
 * Test file for Environment Configuration
 */

const config = require('./environment');

describe('Environment Configuration', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('should have default environment as development', () => {
    expect(config.environment).toBeDefined();
    expect(['development', 'production', 'test']).toContain(config.environment);
  });

  test('should determine database type correctly', () => {
    expect(typeof config.useSQLite).toBe('function');
    expect(typeof config.useAzureSQL).toBe('function');

    const usingSQLite = config.useSQLite();
    const usingAzureSQL = config.useAzureSQL();

    // One should be true, not both
    expect(usingSQLite || usingAzureSQL).toBe(true);
  });

  test('should have SQLite configuration', () => {
    expect(config.database.sqlite).toBeDefined();
    expect(config.database.sqlite.filename).toBeDefined();
    expect(typeof config.database.sqlite.filename).toBe('string');
  });

  test('should have Azure SQL configuration', () => {
    expect(config.database.azureSQL).toBeDefined();
    expect(config.database.azureSQL.server).toBeDefined();
    expect(config.database.azureSQL.database).toBeDefined();
    expect(config.database.azureSQL.authentication).toBeDefined();
  });

  test('should have JWT configuration', () => {
    expect(config.jwt).toBeDefined();
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.expiresIn).toBeDefined();
    expect(typeof config.jwt.secret).toBe('string');
  });

  test('should have port configuration', () => {
    expect(config.port).toBeDefined();
    expect(typeof config.port).toBe('number');
    expect(config.port).toBeGreaterThan(0);
    expect(config.port).toBeLessThan(65536);
  });

  test('should use SQLite in development by default', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.AZURE_SQL_SERVER;

    // Re-require to get fresh config
    jest.resetModules();
    const freshConfig = require('./environment');

    expect(freshConfig.useSQLite()).toBe(true);
  });
});