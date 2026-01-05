/**
 * Azure SQL Database Adapter
 *
 * Provides a SQLite-like interface for Azure SQL Server
 * to minimize code changes when switching between databases.
 */

const sql = require('mssql');
const config = require('../config/environment');

class AzureSQLAdapter {
  constructor() {
    this.pool = null;
    this.connected = false;
  }

  /**
   * Initialize database connection pool
   */
  async connect() {
    if (this.connected) {
      return this.pool;
    }

    try {
      const sqlConfig = {
        server: config.database.azureSQL.server,
        database: config.database.azureSQL.database,
        user: config.database.azureSQL.user,
        password: config.database.azureSQL.password,
        options: config.database.azureSQL.options,
        pool: config.database.azureSQL.pool
      };

      this.pool = await sql.connect(sqlConfig);
      this.connected = true;
      console.log('Connected to Azure SQL Database');
      return this.pool;
    } catch (err) {
      console.error('Azure SQL connection error:', err);
      throw err;
    }
  }

  /**
   * Execute a query - SQLite-like interface
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @param {Function} callback - Callback function (err, result)
   */
  async run(query, params, callback) {
    try {
      await this.connect();
      const request = this.pool.request();

      // Bind parameters
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });

      // Replace ? placeholders with @param0, @param1, etc.
      let modifiedQuery = query;
      params.forEach((_, index) => {
        modifiedQuery = modifiedQuery.replace('?', `@param${index}`);
      });

      // For INSERT statements, add OUTPUT clause to get the inserted ID
      if (modifiedQuery.trim().toUpperCase().startsWith('INSERT INTO')) {
        // Find the position after the table name and columns
        const valuesIndex = modifiedQuery.toUpperCase().indexOf('VALUES');
        if (valuesIndex > 0) {
          // Insert OUTPUT INSERTED.id before VALUES
          modifiedQuery = modifiedQuery.substring(0, valuesIndex).trim() +
                         ' OUTPUT INSERTED.id ' +
                         modifiedQuery.substring(valuesIndex);
        }
      }

      const result = await request.query(modifiedQuery);

      // Mimic SQLite behavior
      const sqliteResult = {
        lastID: result.recordset && result.recordset.length > 0
          ? result.recordset[0].id
          : (result.rowsAffected && result.rowsAffected[0]) || 0,
        changes: (result.rowsAffected && result.rowsAffected[0]) || 0
      };

      if (callback) {
        callback.call(sqliteResult, null);
      }
    } catch (err) {
      console.error('SQL execution error:', err);
      if (callback) {
        callback(err);
      }
    }
  }

  /**
   * Get a single row - SQLite-like interface
   */
  async get(query, params, callback) {
    try {
      await this.connect();
      const request = this.pool.request();

      // Bind parameters
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });

      // Replace ? placeholders
      let modifiedQuery = query;
      params.forEach((_, index) => {
        modifiedQuery = modifiedQuery.replace('?', `@param${index}`);
      });

      const result = await request.query(modifiedQuery);

      if (callback) {
        callback(null, result.recordset[0] || null);
      }
    } catch (err) {
      console.error('SQL get error:', err);
      if (callback) {
        callback(err, null);
      }
    }
  }

  /**
   * Get all rows - SQLite-like interface
   */
  async all(query, params, callback) {
    try {
      await this.connect();
      const request = this.pool.request();

      // Bind parameters
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });

      // Replace ? placeholders
      let modifiedQuery = query;
      params.forEach((_, index) => {
        modifiedQuery = modifiedQuery.replace('?', `@param${index}`);
      });

      const result = await request.query(modifiedQuery);

      if (callback) {
        callback(null, result.recordset || []);
      }
    } catch (err) {
      console.error('SQL all error:', err);
      if (callback) {
        callback(err, []);
      }
    }
  }

  /**
   * Execute multiple statements in a transaction
   */
  async serialize(callback) {
    try {
      await this.connect();
      const transaction = this.pool.transaction();
      await transaction.begin();

      // Execute callback with transaction context
      await callback();

      await transaction.commit();
    } catch (err) {
      console.error('Transaction error:', err);
      throw err;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.close();
      this.connected = false;
      console.log('Azure SQL connection closed');
    }
  }

  /**
   * Event emitter compatibility
   */
  on(event, callback) {
    if (event === 'error') {
      this.errorCallback = callback;
    }
  }
}

module.exports = AzureSQLAdapter;
