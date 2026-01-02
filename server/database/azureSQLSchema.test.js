/**
 * Test file for Azure SQL Schema
 */

const { createSchema } = require('./azureSQLSchema');

describe('Azure SQL Schema', () => {
  let mockDb;
  let mockRequest;
  let consoleLogSpy;

  beforeEach(() => {
    // Mock the database pool and request
    mockRequest = {
      query: jest.fn().mockResolvedValue({ recordset: [] })
    };

    mockDb = {
      pool: {
        request: jest.fn().mockReturnValue(mockRequest)
      }
    };

    // Spy on console.log to verify table creation messages
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('should create all required tables', async () => {
    await createSchema(mockDb);

    // Verify pool.request was called for each table
    // We have 8 tables: users, players, teams, team_players, matches, match_players, contributions, expenses
    expect(mockDb.pool.request).toHaveBeenCalled();
    expect(mockDb.pool.request().query).toHaveBeenCalled();

    // Verify success message
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Creating Azure SQL schema'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Azure SQL schema created successfully'));
  });

  test('should log table creation for each table', async () => {
    await createSchema(mockDb);

    // Check that individual table creation messages were logged
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Users table created'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Players table created'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Teams table created'));
  });

  test('should handle database errors gracefully', async () => {
    const mockError = new Error('Database connection failed');
    mockRequest.query.mockRejectedValue(mockError);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(createSchema(mockDb)).rejects.toThrow('Database connection failed');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error creating Azure SQL schema'),
      mockError
    );

    consoleErrorSpy.mockRestore();
  });

  test('should use MM-DD format for birthday field', async () => {
    await createSchema(mockDb);

    // Get all the query calls
    const queryCalls = mockRequest.query.mock.calls;

    // Find the players table creation query
    const playersQuery = queryCalls.find(call =>
      call[0]?.includes('CREATE TABLE players')
    );

    expect(playersQuery).toBeDefined();
    // Verify birthday is NVARCHAR(5) for MM-DD format
    expect(playersQuery[0]).toMatch(/birthday\s+NVARCHAR\(5\)/i);
  });
});