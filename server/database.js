/**
 * Database Connection Module
 *
 * Automatically selects the appropriate database based on environment:
 * - Local: SQLite
 * - Production: Azure SQL Server
 */

const config = require('./config/environment');

let db;

if (config.useSQLite()) {
  // SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');

  db = new sqlite3.Database(
    path.join(__dirname, config.database.sqlite.filename),
    (err) => {
      if (err) {
        console.error('Error opening SQLite database:', err.message);
      } else {
        console.log(`Connected to SQLite database (${config.environment} environment)`);
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
          mobilenumber TEXT,
          email TEXT,
          birthday TEXT,
          contact TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Note: birthday stores MM-DD format (e.g., "03-15" for March 15)

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

      console.log('SQLite database tables initialized');
    });
  }

} else if (config.useAzureSQL()) {
  // Azure SQL for production
  const AzureSQLAdapter = require('./database/azureSQLAdapter');
  const { createSchema } = require('./database/azureSQLSchema');

  db = new AzureSQLAdapter();

  // Initialize Azure SQL connection and schema
  (async () => {
    try {
      await db.connect();
      console.log(`Connected to Azure SQL database (${config.environment} environment)`);
      await createSchema(db);
    } catch (err) {
      console.error('Failed to initialize Azure SQL:', err);
      process.exit(1);
    }
  })();
}

module.exports = db;
