const db = require('./database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['admin', hashedPassword, 'admin'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            console.log('Admin user already exists');
          } else {
            console.error('Error creating admin user:', err.message);
          }
        } else {
          console.log('✓ Admin user created successfully!');
          console.log('\nLogin credentials:');
          console.log('  Username: admin');
          console.log('  Password: admin123');
          console.log('\nYou can now login at http://localhost:3000/login');
        }

        // Close database connection
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          }
          process.exit(err ? 1 : 0);
        });
      }
    );
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Give the database a moment to initialize
setTimeout(createAdmin, 1000);
