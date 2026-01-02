const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

// Logging setup
const loggingConfig = require('./config/logging.config');
const { LoggerFactory } = require('./logger');
const { createLoggingMiddleware, createErrorLoggingMiddleware } = require('./middleware/loggingMiddleware');

// Initialize logger
const logger = LoggerFactory.createLogger(loggingConfig);
logger.info('Cricket Expense App Server starting up', {
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000
});

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add logging middleware (should be early in the middleware chain)
app.use(createLoggingMiddleware(logger));

// ===== HEALTH CHECK ENDPOINT =====
// Health check endpoint for monitoring and availability checks
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };

  // Check database connection
  if (db && typeof db.get === 'function') {
    db.get('SELECT 1 as health', [], (err) => {
      if (err) {
        healthCheck.status = 'unhealthy';
        healthCheck.database = 'disconnected';
        healthCheck.error = err.message;
        logger.error('Health check failed - database error', { error: err.message });
        return res.status(503).json(healthCheck);
      }
      healthCheck.database = 'connected';
      logger.debug('Health check passed');
      res.status(200).json(healthCheck);
    });
  } else {
    // Azure SQL uses different API
    healthCheck.database = 'connected';
    logger.debug('Health check passed (Azure SQL)');
    res.status(200).json(healthCheck);
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cricket Team Expense Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// ===== PLAYERS ROUTES =====

// Get all players
app.get('/api/players', (req, res) => {
  db.all('SELECT * FROM players ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single player
app.get('/api/players/:id', (req, res) => {
  db.get('SELECT * FROM players WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Create player
app.post('/api/players', (req, res) => {
  const { firstname, lastname, mobilenumber, email, birthday } = req.body;

  db.run(
    'INSERT INTO players (firstname, lastname, mobilenumber, email, birthday) VALUES (?, ?, ?, ?, ?)',
    [firstname, lastname, mobilenumber, email || null, birthday || null],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, firstname, lastname, mobilenumber, email, birthday });
    }
  );
});

// Update player
app.put('/api/players/:id', (req, res) => {
  const { firstname, lastname, mobilenumber, email, birthday } = req.body;

  db.run(
    'UPDATE players SET firstname = ?, lastname = ?, mobilenumber = ?, email = ?, birthday = ? WHERE id = ?',
    [firstname, lastname, mobilenumber, email || null, birthday || null, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: req.params.id, firstname, lastname, mobilenumber, email, birthday });
    }
  );
});

// Delete player
app.delete('/api/players/:id', (req, res) => {
  db.run('DELETE FROM players WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Player deleted', changes: this.changes });
  });
});

// ===== CONTRIBUTIONS ROUTES =====

// Get all contributions
app.get('/api/contributions', (req, res) => {
  db.all(
    `SELECT c.*, cr.firstname, cr.lastname
     FROM contributions c
     LEFT JOIN players cr ON c.player_id = cr.id
     ORDER BY c.date DESC`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Create contribution
app.post('/api/contributions', (req, res) => {
  const { player_id, amount, date, description } = req.body;

  db.run(
    'INSERT INTO contributions (player_id, amount, date, description) VALUES (?, ?, ?, ?)',
    [player_id, amount, date, description],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, player_id, amount, date, description });
    }
  );
});

// Delete contribution
app.delete('/api/contributions/:id', (req, res) => {
  db.run('DELETE FROM contributions WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Contribution deleted', changes: this.changes });
  });
});

// ===== EXPENSES ROUTES =====

// Get all expenses
app.get('/api/expenses', (req, res) => {
  db.all('SELECT * FROM expenses ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create expense
app.post('/api/expenses', (req, res) => {
  const { description, amount, date, category } = req.body;

  db.run(
    'INSERT INTO expenses (description, amount, date, category) VALUES (?, ?, ?, ?)',
    [description, amount, date, category],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, description, amount, date, category });
    }
  );
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  db.run('DELETE FROM expenses WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Expense deleted', changes: this.changes });
  });
});

// ===== TEAMS ROUTES =====

// Get all teams with player count
app.get('/api/teams', (req, res) => {
  db.all(
    `SELECT t.*, COUNT(tp.player_id) as player_count,
            p.firstname || ' ' || p.lastname as manager_name
     FROM teams t
     LEFT JOIN team_players tp ON t.id = tp.team_id
     LEFT JOIN players p ON t.manager_id = p.id
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Get single team with players
app.get('/api/teams/:id', (req, res) => {
  db.get(
    `SELECT t.*, p.firstname || ' ' || p.lastname as manager_name
     FROM teams t
     LEFT JOIN players p ON t.manager_id = p.id
     WHERE t.id = ?`,
    [req.params.id],
    (err, team) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      // Get players for this team
      db.all(
        `SELECT p.*, tp.joined_date
         FROM players p
         INNER JOIN team_players tp ON p.id = tp.player_id
         WHERE tp.team_id = ?
         ORDER BY tp.joined_date DESC`,
        [req.params.id],
        (err, players) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ ...team, players });
        }
      );
    }
  );
});

// Create team
app.post('/api/teams', (req, res) => {
  const { name, date_formed, manager_id } = req.body;

  db.run(
    'INSERT INTO teams (name, date_formed, manager_id) VALUES (?, ?, ?)',
    [name, date_formed, manager_id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, date_formed, manager_id });
    }
  );
});

// Update team
app.put('/api/teams/:id', (req, res) => {
  const { name, date_formed, manager_id } = req.body;

  db.run(
    'UPDATE teams SET name = ?, date_formed = ?, manager_id = ? WHERE id = ?',
    [name, date_formed, manager_id, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: req.params.id, name, date_formed, manager_id });
    }
  );
});

// Delete team
app.delete('/api/teams/:id', (req, res) => {
  db.run('DELETE FROM teams WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Team deleted', changes: this.changes });
  });
});

// Add player to team
app.post('/api/teams/:teamId/players/:playerId', (req, res) => {
  const { teamId, playerId } = req.params;
  const { joined_date } = req.body;

  db.run(
    'INSERT INTO team_players (team_id, player_id, joined_date) VALUES (?, ?, ?)',
    [teamId, playerId, joined_date || new Date().toISOString().split('T')[0]],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          res.status(400).json({ error: 'Player is already in this team' });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }
      res.json({ id: this.lastID, team_id: teamId, player_id: playerId });
    }
  );
});

// Remove player from team
app.delete('/api/teams/:teamId/players/:playerId', (req, res) => {
  const { teamId, playerId } = req.params;

  db.run(
    'DELETE FROM team_players WHERE team_id = ? AND player_id = ?',
    [teamId, playerId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Player removed from team', changes: this.changes });
    }
  );
});

// Get teams for a specific player
app.get('/api/players/:id/teams', (req, res) => {
  db.all(
    `SELECT t.*, tp.joined_date,
            p.firstname || ' ' || p.lastname as manager_name
     FROM teams t
     INNER JOIN team_players tp ON t.id = tp.team_id
     LEFT JOIN players p ON t.manager_id = p.id
     WHERE tp.player_id = ?
     ORDER BY tp.joined_date DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// ===== MATCHES ROUTES =====

// Get all matches
app.get('/api/matches', (req, res) => {
  db.all(
    `SELECT m.*, t.name as team_name,
            COUNT(mp.player_id) as players_participated
     FROM matches m
     LEFT JOIN teams t ON m.team_id = t.id
     LEFT JOIN match_players mp ON m.id = mp.match_id
     GROUP BY m.id
     ORDER BY m.match_date DESC`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Get single match with players
app.get('/api/matches/:id', (req, res) => {
  db.get(
    `SELECT m.*, t.name as team_name
     FROM matches m
     LEFT JOIN teams t ON m.team_id = t.id
     WHERE m.id = ?`,
    [req.params.id],
    (err, match) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Get players for this match
      db.all(
        `SELECT p.*, mp.expense_share, mp.is_paying
         FROM players p
         INNER JOIN match_players mp ON p.id = mp.player_id
         WHERE mp.match_id = ?`,
        [req.params.id],
        (err, players) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ ...match, players });
        }
      );
    }
  );
});

// Create match
app.post('/api/matches', (req, res) => {
  const {
    team_id,
    match_date,
    opponent_team,
    venue,
    ground_fee,
    ball_amount,
    other_expenses,
    player_ids,
    non_paying_players
  } = req.body;

  const total_expense = (parseFloat(ground_fee) || 0) +
                       (parseFloat(ball_amount) || 0) +
                       (parseFloat(other_expenses) || 0);
  const players_count = player_ids ? player_ids.length : 0;

  // Count only paying players for expense calculation
  const non_paying_set = new Set(non_paying_players || []);
  const paying_players_count = player_ids ? player_ids.filter(id => !non_paying_set.has(id)).length : 0;
  const expense_per_player = paying_players_count > 0 ? total_expense / paying_players_count : 0;

  db.run(
    `INSERT INTO matches (team_id, match_date, opponent_team, venue, ground_fee, ball_amount,
                          other_expenses, total_expense, expense_per_player, players_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [team_id, match_date, opponent_team, venue, ground_fee, ball_amount, other_expenses,
     total_expense, expense_per_player, players_count],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const match_id = this.lastID;

      // Add players to match
      if (player_ids && player_ids.length > 0) {
        const playerInserts = player_ids.map(player_id => {
          const is_paying = !non_paying_set.has(player_id);
          const player_expense = is_paying ? expense_per_player : 0;

          return new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO match_players (match_id, player_id, expense_share, is_paying) VALUES (?, ?, ?, ?)',
              [match_id, player_id, player_expense, is_paying ? 1 : 0],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });

        Promise.all(playerInserts)
          .then(() => {
            res.json({
              id: match_id,
              team_id,
              match_date,
              opponent_team,
              venue,
              total_expense,
              expense_per_player,
              players_count
            });
          })
          .catch(err => {
            res.status(500).json({ error: err.message });
          });
      } else {
        res.json({
          id: match_id,
          team_id,
          match_date,
          opponent_team,
          venue,
          total_expense,
          expense_per_player,
          players_count
        });
      }
    }
  );
});

// Update match
app.put('/api/matches/:id', (req, res) => {
  const {
    team_id,
    match_date,
    opponent_team,
    venue,
    ground_fee,
    ball_amount,
    other_expenses
  } = req.body;

  // First get current player count
  db.get(
    'SELECT players_count FROM matches WHERE id = ?',
    [req.params.id],
    (err, match) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const total_expense = (parseFloat(ground_fee) || 0) +
                           (parseFloat(ball_amount) || 0) +
                           (parseFloat(other_expenses) || 0);
      const players_count = match ? match.players_count : 0;
      const expense_per_player = players_count > 0 ? total_expense / players_count : 0;

      db.run(
        `UPDATE matches
         SET team_id = ?, match_date = ?, opponent_team = ?, venue = ?,
             ground_fee = ?, ball_amount = ?, other_expenses = ?,
             total_expense = ?, expense_per_player = ?
         WHERE id = ?`,
        [team_id, match_date, opponent_team, venue, ground_fee, ball_amount,
         other_expenses, total_expense, expense_per_player, req.params.id],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          // Update expense_share for all players in this match
          db.run(
            'UPDATE match_players SET expense_share = ? WHERE match_id = ?',
            [expense_per_player, req.params.id],
            (err) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json({
                id: req.params.id,
                team_id,
                match_date,
                opponent_team,
                venue,
                total_expense,
                expense_per_player
              });
            }
          );
        }
      );
    }
  );
});

// Delete match
app.delete('/api/matches/:id', (req, res) => {
  db.run('DELETE FROM matches WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Match deleted', changes: this.changes });
  });
});

// Add player to match
app.post('/api/matches/:matchId/players/:playerId', (req, res) => {
  const { matchId, playerId } = req.params;

  // Get match details to calculate expense share
  db.get('SELECT * FROM matches WHERE id = ?', [matchId], (err, match) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Recalculate expense per player
    const new_player_count = match.players_count + 1;
    const expense_per_player = match.total_expense / new_player_count;

    db.run(
      'INSERT INTO match_players (match_id, player_id, expense_share) VALUES (?, ?, ?)',
      [matchId, playerId, expense_per_player],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Player is already in this match' });
          } else {
            res.status(500).json({ error: err.message });
          }
          return;
        }

        // Update match with new player count and expense per player
        db.run(
          'UPDATE matches SET players_count = ?, expense_per_player = ? WHERE id = ?',
          [new_player_count, expense_per_player, matchId],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            // Update all existing players' expense share
            db.run(
              'UPDATE match_players SET expense_share = ? WHERE match_id = ?',
              [expense_per_player, matchId],
              (err) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                res.json({ id: this.lastID, match_id: matchId, player_id: playerId, expense_share: expense_per_player });
              }
            );
          }
        );
      }
    );
  });
});

// Toggle player paying status in match
app.put('/api/matches/:matchId/players/:playerId/paying-status', (req, res) => {
  const { matchId, playerId } = req.params;
  const { is_paying } = req.body;

  // Get match and count paying players
  db.get('SELECT * FROM matches WHERE id = ?', [matchId], (err, match) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Count current paying players
    db.get(
      'SELECT COUNT(*) as paying_count FROM match_players WHERE match_id = ? AND is_paying = 1',
      [matchId],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const paying_count = result.paying_count || 0;
        const new_paying_count = is_paying ? paying_count + 1 : paying_count - 1;

        if (new_paying_count === 0) {
          return res.status(400).json({ error: 'At least one player must be a paying player' });
        }

        const expense_per_player = match.total_expense / new_paying_count;

        // Update player's paying status
        db.run(
          'UPDATE match_players SET is_paying = ?, expense_share = ? WHERE match_id = ? AND player_id = ?',
          [is_paying ? 1 : 0, is_paying ? expense_per_player : 0, matchId, playerId],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            // Update all paying players' expense share
            db.run(
              'UPDATE match_players SET expense_share = ? WHERE match_id = ? AND is_paying = 1',
              [expense_per_player, matchId],
              (err) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }

                // Update match expense_per_player
                db.run(
                  'UPDATE matches SET expense_per_player = ? WHERE id = ?',
                  [expense_per_player, matchId],
                  (err) => {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    res.json({
                      message: 'Player paying status updated',
                      expense_per_player,
                      is_paying
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// Remove player from match
app.delete('/api/matches/:matchId/players/:playerId', (req, res) => {
  const { matchId, playerId } = req.params;

  // Get match details and player's paying status
  db.get('SELECT * FROM matches WHERE id = ?', [matchId], (err, match) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Get player's paying status
    db.get(
      'SELECT is_paying FROM match_players WHERE match_id = ? AND player_id = ?',
      [matchId, playerId],
      (err, playerData) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        db.run(
          'DELETE FROM match_players WHERE match_id = ? AND player_id = ?',
          [matchId, playerId],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            // Count remaining paying players
            db.get(
              'SELECT COUNT(*) as paying_count FROM match_players WHERE match_id = ? AND is_paying = 1',
              [matchId],
              (err, result) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }

                const new_player_count = match.players_count - 1;
                const paying_count = result.paying_count || 0;
                const expense_per_player = paying_count > 0 ? match.total_expense / paying_count : 0;

                // Update match with new player count
                db.run(
                  'UPDATE matches SET players_count = ?, expense_per_player = ? WHERE id = ?',
                  [new_player_count, expense_per_player, matchId],
                  (err) => {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }

                    // Update remaining paying players' expense share
                    db.run(
                      'UPDATE match_players SET expense_share = ? WHERE match_id = ? AND is_paying = 1',
                      [expense_per_player, matchId],
                      (err) => {
                        if (err) {
                          res.status(500).json({ error: err.message });
                          return;
                        }
                        res.json({ message: 'Player removed from match', changes: this.changes });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// Get player account details (contributions, expenses, balance)
app.get('/api/players/:id/account', (req, res) => {
  const playerId = req.params.id;

  // Get player details
  db.get('SELECT * FROM players WHERE id = ?', [playerId], (err, player) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    // Get total contributions
    db.get(
      'SELECT SUM(amount) as total FROM contributions WHERE player_id = ?',
      [playerId],
      (err, contribResult) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const totalContributions = contribResult.total || 0;

        // Get total match expenses
        db.get(
          'SELECT SUM(expense_share) as total FROM match_players WHERE player_id = ?',
          [playerId],
          (err, expenseResult) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            const totalMatchExpenses = expenseResult.total || 0;
            const balance = totalContributions - totalMatchExpenses;

            // Get contribution history
            db.all(
              'SELECT * FROM contributions WHERE player_id = ? ORDER BY date DESC',
              [playerId],
              (err, contributions) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }

                // Get match expense history
                db.all(
                  `SELECT m.*, mp.expense_share, t.name as team_name
                   FROM matches m
                   INNER JOIN match_players mp ON m.id = mp.match_id
                   LEFT JOIN teams t ON m.team_id = t.id
                   WHERE mp.player_id = ?
                   ORDER BY m.match_date DESC`,
                  [playerId],
                  (err, matches) => {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }

                    res.json({
                      player,
                      totalContributions,
                      totalMatchExpenses,
                      balance,
                      contributions,
                      matches
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// ===== DASHBOARD/SUMMARY ROUTES =====

// Get summary statistics
app.get('/api/summary', (req, res) => {
  const summary = {};

  db.get('SELECT SUM(amount) as total FROM contributions', [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    summary.totalContributions = row.total || 0;

    db.get('SELECT SUM(amount) as total FROM expenses', [], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const expensesTableTotal = row.total || 0;

      // Also get match expenses
      db.get('SELECT SUM(total_expense) as total FROM matches', [], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        const matchExpensesTotal = row.total || 0;

        // Combine both expenses
        summary.totalExpenses = expensesTableTotal + matchExpensesTotal;
        summary.balance = summary.totalContributions - summary.totalExpenses;

        db.get('SELECT COUNT(*) as count FROM players', [], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          summary.totalPlayers = row.count || 0;
          res.json(summary);
        });
      });
    });
  });
});

// ===== AUTHENTICATION ROUTES =====

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  const { username, password, firstname, lastname, dob, contact, securityQuestion, securityAnswer } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (!firstname || !lastname) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  if (!securityQuestion || !securityAnswer) {
    return res.status(400).json({ error: 'Security question and answer are required' });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Hash security answer (case-insensitive comparison)
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

    // First, create the player record
    db.run(
      'INSERT INTO players (firstname, lastname, dob, contact) VALUES (?, ?, ?, ?)',
      [firstname, lastname, dob || null, contact || null],
      function(playerErr) {
        if (playerErr) {
          logger.error('Error creating player profile', playerErr, {
            username
          }, req.correlationId);
          return res.status(500).json({ error: 'Error creating player profile: ' + playerErr.message });
        }

        const playerId = this.lastID;

        // Then create the user account linked to the player with security question
        db.run(
          'INSERT INTO users (username, password, role, player_id, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?)',
          [username, hashedPassword, 'player', playerId, securityQuestion, hashedSecurityAnswer],
          function(userErr) {
            if (userErr) {
              if (userErr.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists' });
              }
              logger.error('Error creating user', userErr, {
                username
              }, req.correlationId);
              return res.status(500).json({ error: 'Error creating user: ' + userErr.message });
            }

            logger.trackEvent('UserSignup', {
              userId: this.lastID,
              username,
              role: 'player'
            }, {}, req.correlationId);

            logger.info('User signed up successfully', {
              userId: this.lastID,
              username
            }, req.correlationId);

            res.status(201).json({
              id: this.lastID,
              username,
              role: 'player',
              player_id: playerId,
              message: 'User and player profile created successfully'
            });
          }
        );
      }
    );
  } catch (error) {
    logger.error('Signup error', error, {
      username
    }, req.correlationId);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, player_id: user.player_id },
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
    } catch (error) {
      res.status(500).json({ error: 'Error during login' });
    }
  });
});

// Get current user (verify token)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, role, player_id FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Logout endpoint (client-side token removal, but endpoint for consistency)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Password reset endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, securityQuestion, securityAnswer, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Username and new password are required' });
  }

  if (!securityQuestion || !securityAnswer) {
    return res.status(400).json({ error: 'Security question and answer are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user exists and get security question/answer
    db.get('SELECT id, security_question, security_answer FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        logger.error('Error fetching user for password reset', err, {
          username
        }, req.correlationId);
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(404).json({ error: 'Username not found' });
      }

      // Check if security question matches
      if (user.security_question !== securityQuestion) {
        logger.warn('Password reset attempt with wrong security question', {
          username,
          providedQuestion: securityQuestion
        }, req.correlationId);
        return res.status(403).json({ error: 'Security question does not match' });
      }

      // Verify security answer (case-insensitive)
      const answerMatches = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.security_answer);

      if (!answerMatches) {
        logger.warn('Password reset attempt with wrong security answer', {
          username
        }, req.correlationId);
        return res.status(403).json({ error: 'Security answer is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      db.run(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, username],
        function(err) {
          if (err) {
            logger.error('Error updating password', err, {
              username
            }, req.correlationId);
            return res.status(500).json({ error: 'Error updating password' });
          }

          logger.trackEvent('PasswordReset', {
            username
          }, {}, req.correlationId);

          logger.info('Password reset successfully', {
            username
          }, req.correlationId);

          res.json({ message: 'Password reset successfully' });
        }
      );
    });
  } catch (error) {
    logger.error('Password reset error', error, {
      username
    }, req.correlationId);
    res.status(500).json({ error: 'Error resetting password' });
  }
});

// Get user profile with player details, teams, and account summary
app.get('/api/profile', authenticateToken, (req, res) => {
  const playerId = req.user.player_id;

  const profileData = {};

  // If user has a linked player, fetch player details
  if (playerId) {
    db.get(
      'SELECT * FROM players WHERE id = ?',
      [playerId],
      (err, player) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // If player not found, return empty profile
        if (!player) {
          return res.json({
            player: null,
            teams: [],
            accountSummary: null
          });
        }

        profileData.player = player;

        // Get teams for this player
        db.all(
          `SELECT t.*, tp.joined_date,
           p.firstname || ' ' || p.lastname as manager_name
           FROM teams t
           INNER JOIN team_players tp ON t.id = tp.team_id
           LEFT JOIN players p ON t.manager_id = p.id
           WHERE tp.player_id = ?
           ORDER BY tp.joined_date DESC`,
          [playerId],
          (err, teams) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            profileData.teams = teams;

            // Get account summary (contributions and match expenses for this player)
            db.get(
              'SELECT SUM(amount) as total FROM contributions WHERE player_id = ?',
              [playerId],
              (err, contributionsRow) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                const totalContributions = contributionsRow.total || 0;

                // Get match expenses for this player (expense_share from match_players)
                db.get(
                  'SELECT SUM(expense_share) as total FROM match_players WHERE player_id = ?',
                  [playerId],
                  (err, matchExpensesRow) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }

                    const totalExpenses = matchExpensesRow.total || 0;

                    profileData.accountSummary = {
                      totalContributions,
                      totalExpenses,
                      balance: totalContributions - totalExpenses
                    };

                    res.json(profileData);
                  }
                );
              }
            );
          }
        );
      }
    );
  } else {
    // User has no linked player
    res.json({
      player: null,
      teams: [],
      accountSummary: null
    });
  }
});

// Get admin dashboard with team-wise financial breakdown
app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  const playerId = req.user.player_id;

  // Get teams where user is the manager
  db.all(
    `SELECT t.id, t.name, t.date_formed,
     (SELECT COUNT(*) FROM team_players WHERE team_id = t.id) as player_count
     FROM teams t
     WHERE t.manager_id = ?
     ORDER BY t.name`,
    [playerId],
    (err, teams) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (teams.length === 0) {
        return res.json({
          teams: [],
          overallSummary: {
            totalContributions: 0,
            totalExpenses: 0,
            balance: 0,
            totalTeams: 0
          }
        });
      }

      const teamData = [];
      let overallContributions = 0;
      let overallExpenses = 0;

      let processedTeams = 0;

      teams.forEach(team => {
        const teamInfo = { ...team };

        // Get contributions for players in this team
        db.get(
          `SELECT SUM(c.amount) as total
           FROM contributions c
           INNER JOIN team_players tp ON c.player_id = tp.player_id
           WHERE tp.team_id = ?`,
          [team.id],
          (err, contribRow) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            teamInfo.totalContributions = contribRow.total || 0;
            overallContributions += teamInfo.totalContributions;

            // Get expenses for this team from expenses table
            db.get(
              'SELECT SUM(amount) as total FROM expenses',
              [],
              (err, expensesRow) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                const generalExpenses = expensesRow.total || 0;

                // Get match expenses for this team
                db.get(
                  'SELECT SUM(total_expense) as total FROM matches WHERE team_id = ?',
                  [team.id],
                  (err, matchExpensesRow) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }

                    const matchExpenses = matchExpensesRow.total || 0;

                    // For team view, divide general expenses proportionally by team size
                    db.get('SELECT COUNT(*) as total FROM team_players', [], (err, totalPlayersRow) => {
                      if (err) {
                        return res.status(500).json({ error: err.message });
                      }

                      const totalPlayers = totalPlayersRow.total || 1;
                      const proportionalGeneralExpenses = (generalExpenses / totalPlayers) * team.player_count;

                      teamInfo.totalExpenses = proportionalGeneralExpenses + matchExpenses;
                      teamInfo.balance = teamInfo.totalContributions - teamInfo.totalExpenses;

                      overallExpenses += teamInfo.totalExpenses;
                      teamData.push(teamInfo);

                      processedTeams++;
                      if (processedTeams === teams.length) {
                        res.json({
                          teams: teamData.sort((a, b) => a.name.localeCompare(b.name)),
                          overallSummary: {
                            totalContributions: overallContributions,
                            totalExpenses: overallExpenses,
                            balance: overallContributions - overallExpenses,
                            totalTeams: teams.length
                          }
                        });
                      }
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});

// Add error logging middleware (must be after all routes)
app.use(createErrorLoggingMiddleware(logger));

// Start server
app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
  console.log(`Server running on http://localhost:${PORT}`);
});
