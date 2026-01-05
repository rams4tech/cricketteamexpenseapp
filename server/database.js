/**
 * Database Connection Module
 *
 * Automatically selects the appropriate database based on environment:
 * - Local: SQLite
 * - Production: Azure SQL Server
 */

const config = require('./config/environment');
const loggingConfig = require('./config/logging.config');
const { LoggerFactory } = require('./logger');

// Initialize logger
const logger = LoggerFactory.createLogger(loggingConfig);

let db;

if (config.useSQLite()) {
  // SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');

  db = new sqlite3.Database(
    path.join(__dirname, config.database.sqlite.filename),
    (err) => {
      if (err) {
        logger.error('Error opening SQLite database', err, { environment: config.environment });
      } else {
        logger.info('Connected to SQLite database', { environment: config.environment });

        // Set busy timeout to prevent database locked errors
        db.configure('busyTimeout', 5000);

        initSQLiteDatabase();
      }
    }
  );

  // Initialize SQLite database tables
  function initSQLiteDatabase() {
    db.serialize(() => {
      // Players table
      db.run(`
        CREATE TABLE IF NOT EXISTS players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstname TEXT NOT NULL,
          lastname TEXT NOT NULL,
          mobilenumber TEXT NOT NULL,
          email TEXT,
          birthday TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Note: birthday stores MM-DD format (e.g., "03-15" for March 15)

      // Migration: Add mobilenumber and email columns if they don't exist (for existing databases)
      db.all("PRAGMA table_info(players)", [], (err, columns) => {
        if (err) {
          logger.error('Error checking players table schema', err);
          return;
        }

        const hasMobilenumber = columns.some(col => col.name === 'mobilenumber');
        const hasEmail = columns.some(col => col.name === 'email');

        if (!hasMobilenumber) {
          db.run('ALTER TABLE players ADD COLUMN mobilenumber TEXT', (err) => {
            if (err) {
              logger.error('Error adding mobilenumber column', err);
            } else {
              logger.info('Added mobilenumber column to players table');
            }
          });
        }

        if (!hasEmail) {
          db.run('ALTER TABLE players ADD COLUMN email TEXT', (err) => {
            if (err) {
              logger.error('Error adding email column', err);
            } else {
              logger.info('Added email column to players table');
            }
          });
        }
      });

      // Contributions table
      db.run(`
        CREATE TABLE IF NOT EXISTS contributions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          date DATE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
        )
      `);

      // Expenses table
      db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          date DATE NOT NULL,
          category TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Teams table
      db.run(`
        CREATE TABLE IF NOT EXISTS teams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          date_formed DATE NOT NULL,
          manager_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (manager_id) REFERENCES players(id) ON DELETE SET NULL
        )
      `);

      // Team-Players junction table
      db.run(`
        CREATE TABLE IF NOT EXISTS team_players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          player_id INTEGER NOT NULL,
          joined_date DATE DEFAULT (date('now')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
          UNIQUE(team_id, player_id)
        )
      `);

      // Matches table
      db.run(`
        CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER,
          match_date DATE NOT NULL,
          opponent_team TEXT,
          venue TEXT,
          ground_fee REAL DEFAULT 0,
          ball_amount REAL DEFAULT 0,
          other_expenses REAL DEFAULT 0,
          total_expense REAL DEFAULT 0,
          expense_per_player REAL DEFAULT 0,
          players_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
        )
      `);

      // Match-Players junction table
      db.run(`
        CREATE TABLE IF NOT EXISTS match_players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          match_id INTEGER NOT NULL,
          player_id INTEGER NOT NULL,
          expense_share REAL DEFAULT 0,
          is_paying INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
          UNIQUE(match_id, player_id)
        )
      `);

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'player' CHECK(role IN ('admin', 'player')),
          player_id INTEGER,
          security_question TEXT,
          security_answer TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
        )
      `);

      logger.info('SQLite database tables initialized');
    });
  }

} else if (config.useAzureSQL()) {
  // Azure SQL for production
  const AzureSQLAdapter = require('./database/azureSQLAdapter');
  const { createSchema } = require('./database/azureSQLSchema');

  db = new AzureSQLAdapter();

  // Store initialization promise for server to wait on
  db.initializationPromise = (async () => {
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        logger.info('Attempting to connect to Azure SQL', {
          attempt: retryCount + 1,
          maxRetries: maxRetries,
          server: config.database.azureSQL.server,
          database: config.database.azureSQL.database,
          user: config.database.azureSQL.user,
          hasPassword: !!config.database.azureSQL.password
        });

        await db.connect();
        logger.info('Connected to Azure SQL database', {
          environment: config.environment,
          server: config.database.azureSQL.server,
          database: config.database.azureSQL.database
        });

        logger.info('Creating database schema...');
        await createSchema(db);
        logger.info('Database schema created successfully');

        // Connection successful, break the retry loop
        db.ready = true;
        break;
      } catch (err) {
        retryCount++;
        logger.error('Failed to initialize Azure SQL', err, {
          attempt: retryCount,
          maxRetries: maxRetries,
          errorCode: err.code,
          originalError: err.originalError?.message,
          server: config.database.azureSQL.server,
          database: config.database.azureSQL.database
        });

        if (retryCount < maxRetries) {
          logger.info(`Retrying Azure SQL connection`, {
            retryIn: `${retryDelay/1000} seconds`,
            nextAttempt: retryCount + 1,
            maxRetries: maxRetries
          });
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          logger.error('All Azure SQL connection attempts failed. Exiting...', null, {
            totalAttempts: retryCount,
            server: config.database.azureSQL.server,
            database: config.database.azureSQL.database
          });
          process.exit(1);
        }
      }
    }
  })();
}

module.exports = db;
