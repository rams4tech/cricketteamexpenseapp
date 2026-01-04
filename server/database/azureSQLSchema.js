/**
 * Azure SQL Database Schema
 *
 * Creates all necessary tables for the Cricket Expense Management Application
 */

const createSchema = async (db) => {
  console.log('Creating Azure SQL schema...');

  try {
    // Create players table FIRST (referenced by users and other tables)
    await db.pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='players' and xtype='U')
      CREATE TABLE players (
        id INT IDENTITY(1,1) PRIMARY KEY,
        firstname NVARCHAR(255) NOT NULL,
        lastname NVARCHAR(255) NOT NULL,
        mobilenumber NVARCHAR(50),
        email NVARCHAR(255),
        birthday NVARCHAR(5),
        contact NVARCHAR(50),
        created_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✓ Players table created');

    // Create users table (references players)
    await db.pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'player',
        player_id INT,
        security_question NVARCHAR(500),
        security_answer NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Users table created');

    // Create teams table
    await db.pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='teams' and xtype='U')
      CREATE TABLE teams (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        date_formed DATE,
        manager_id INT,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (manager_id) REFERENCES players(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Teams table created');

    // Create team_players table
    await db.pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='team_players' and xtype='U')
      CREATE TABLE team_players (
        id INT IDENTITY(1,1) PRIMARY KEY,
        team_id INT NOT NULL,
        player_id INT NOT NULL,
        joined_date DATE,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        UNIQUE(team_id, player_id)
      )
    `);
    console.log('✓ Team_players table created');

    // Create matches table
    await db.pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='matches' and xtype='U')
      CREATE TABLE matches (
        id INT IDENTITY(1,1) PRIMARY KEY,
        team_id INT,
        match_date DATE NOT NULL,
        opponent_team NVARCHAR(255),
        venue NVARCHAR(255),
        ground_fee DECIMAL(10, 2) DEFAULT 0,
        ball_amount DECIMAL(10, 2) DEFAULT 0,
        other_expenses DECIMAL(10, 2) DEFAULT 0,
        total_expense DECIMAL(10, 2) DEFAULT 0,
        expense_per_player DECIMAL(10, 2) DEFAULT 0,
        players_count INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Matches table created');

    // Create match_players table
    await db.pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='match_players' and xtype='U')
      CREATE TABLE match_players (
        id INT IDENTITY(1,1) PRIMARY KEY,
        match_id INT NOT NULL,
        player_id INT NOT NULL,
        expense_share DECIMAL(10, 2) DEFAULT 0,
        is_paying BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        UNIQUE(match_id, player_id)
      )
    `);
    console.log('✓ Match_players table created');

    // Create contributions table
    await db.pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='contributions' and xtype='U')
      CREATE TABLE contributions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        player_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        description NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Contributions table created');

    // Create expenses table
    await db.pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='expenses' and xtype='U')
      CREATE TABLE expenses (
        id INT IDENTITY(1,1) PRIMARY KEY,
        description NVARCHAR(MAX) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        category NVARCHAR(100),
        created_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✓ Expenses table created');

    console.log('✅ Azure SQL schema created successfully!');
  } catch (err) {
    console.error('Error creating Azure SQL schema:', err);
    throw err;
  }
};

module.exports = { createSchema };
