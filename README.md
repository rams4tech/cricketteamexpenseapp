# Cricket Expenses Manager

A full-stack web application for managing cricket team expenses, contributions, and member information.

## Features

- **Authentication & Authorization**: User login/signup system with role-based access control (Admin and Player roles)
- **Dashboard**: View summary statistics including total contributions, expenses, balance, and number of players
- **Players Management**: Add, edit, and delete player information (firstname, lastname, mobile number, optional email, optional birthday)
- **Player Account**: View individual player's contribution history, match expenses, and current balance
- **Teams Management**: Create and manage teams with team name, date formed, and team manager (selected from existing players). Add/remove players to teams.
- **Match Management**: Record matches with detailed expense tracking (ground fee, ball amount, other expenses). Mark players as paying or non-paying. Expenses are automatically divided equally only among paying players.
- **Contributions Tracking**: Record financial contributions from players
- **Expenses Management**: Track team expenses by category

### Role-Based Access Control

- **Admin Role**: Full access to create, edit, and delete all data (players, teams, matches, contributions, expenses)
- **Player Role**: Read-only access - can view all data but cannot make any changes

## Tech Stack

### Frontend
- React 18
- React Router for navigation
- Bootstrap 5 for styling
- Axios for API calls

### Backend
- Node.js
- Express.js
- SQLite database
- JWT (JSON Web Tokens) for authentication
- bcryptjs for password hashing
- CORS enabled

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup Instructions

1. **Install all dependencies**
   ```bash
   npm run install-all
   ```

2. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   The server will run on http://localhost:5000

3. **Start the React frontend** (in a new terminal)
   ```bash
   cd client
   npm start
   ```
   The app will open in your browser at http://localhost:3000

## Project Structure

```
cricket-expenses/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── Players.js
│   │   │   ├── PlayerAccount.js
│   │   │   ├── Teams.js
│   │   │   ├── Matches.js
│   │   │   ├── Contributions.js
│   │   │   └── Expenses.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── server/                # Express backend
│   ├── server.js         # API routes
│   ├── database.js       # SQLite setup
│   ├── cricket_expenses.db  # Database file (created on first run)
│   └── package.json
└── README.md
```

## Authentication

### First Time Setup

1. **Create an Admin User**: Since all signups default to the 'player' role, you need to manually create an admin user:

   ```bash
   cd server
   node create-admin.js
   ```

   This creates an admin user with:
   - **Username**: admin
   - **Password**: admin123
   - **Role**: admin

   Note: If the admin user already exists, the script will notify you.

2. **Login**: Navigate to [http://localhost:3000/login](http://localhost:3000/login) and login with the admin credentials

3. **Create Regular Users**: Regular users can sign up at [http://localhost:3000/signup](http://localhost:3000/signup) and will automatically be assigned the 'player' role

### Authentication Flow

- All routes except `/login` and `/signup` require authentication
- JWT tokens are stored in localStorage and sent with each API request
- Tokens expire after 24 hours
- Users are redirected to login page if not authenticated

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account (default role: player)
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user info (requires authentication)
- `POST /api/auth/logout` - Logout (requires authentication)

### Players
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get single player
- `GET /api/players/:id/teams` - Get teams for a specific player
- `GET /api/players/:id/account` - Get player account details (contributions, expenses, balance)
- `POST /api/players` - Create player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Teams
- `GET /api/teams` - Get all teams with player count
- `GET /api/teams/:id` - Get single team with players
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:teamId/players/:playerId` - Add player to team
- `DELETE /api/teams/:teamId/players/:playerId` - Remove player from team

### Matches
- `GET /api/matches` - Get all matches with player counts
- `GET /api/matches/:id` - Get single match with players and expenses
- `POST /api/matches` - Create match with expenses and player assignments
- `PUT /api/matches/:id` - Update match details and expenses
- `DELETE /api/matches/:id` - Delete match
- `POST /api/matches/:matchId/players/:playerId` - Add player to match (recalculates expenses)
- `DELETE /api/matches/:matchId/players/:playerId` - Remove player from match (recalculates expenses)

### Contributions
- `GET /api/contributions` - Get all contributions
- `POST /api/contributions` - Create contribution
- `DELETE /api/contributions/:id` - Delete contribution

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense

### Summary
- `GET /api/summary` - Get dashboard statistics

## Database Schema

### Users Table
- id (Primary Key)
- username (Unique, Required)
- password (Hashed, Required)
- role (Required - 'admin' or 'player', default: 'player')
- player_id (Optional - Foreign Key → players.id)
- created_at

### Players Table
- id (Primary Key)
- firstname (Required)
- lastname (Required)
- mobilenumber (Required)
- email (Optional)
- birthday (Optional - Format: MM-DD, e.g., 01-15 for January 15th)
- created_at

### Teams Table
- id (Primary Key)
- name (Required)
- date_formed (Required)
- manager_id (Required - Foreign Key → players.id)
- created_at

### Team_Players Table (Junction Table)
- id (Primary Key)
- team_id (Foreign Key → teams.id)
- player_id (Foreign Key → players.id)
- joined_date (Date player joined the team)
- created_at

### Contributions Table
- id (Primary Key)
- player_id (Foreign Key)
- amount
- date
- description
- created_at

### Expenses Table
- id (Primary Key)
- description
- amount
- date
- category
- created_at

### Matches Table
- id (Primary Key)
- team_id (Foreign Key → teams.id)
- match_date (Required)
- opponent_team (Optional)
- venue (Optional)
- ground_fee (Match expense)
- ball_amount (Match expense)
- other_expenses (Match expense)
- total_expense (Calculated)
- expense_per_player (Calculated - total ÷ paying player count)
- players_count (Number of players in match)
- created_at

### Match_Players Table (Junction Table)
- id (Primary Key)
- match_id (Foreign Key → matches.id)
- player_id (Foreign Key → players.id)
- expense_share (Amount this player owes for the match)
- is_paying (1 = paying player, 0 = non-paying player)
- created_at
- UNIQUE(match_id, player_id)

### Match_Expenses Table (Itemized Expenses)
- id (Primary Key)
- match_id (Foreign Key → matches.id)
- description (Expense description)
- amount (Expense amount)
- category (Optional category)
- created_at

## Usage

### Getting Started

1. **First Time Setup**: Create an admin user using the command provided in the Authentication section
2. **Login**: Access the application at [http://localhost:3000](http://localhost:3000) and login with your credentials
3. **User Roles**:
   - **Admin users** can add, edit, and delete all data
   - **Player users** can view all data but cannot make changes

### Workflow

1. **Add Players**: (Admin only) Add players to the system with their details
2. **Create Teams**: (Admin only) Create teams and assign a manager from existing players
3. **Add Players to Teams**: (Admin only) Assign players to teams
4. **Record Contributions**: (Admin only) Record financial contributions from team members
5. **Create Matches**: (Admin only) Create matches with expenses, select participating players, and mark non-paying players (if any)
6. **Automatic Expense Calculation**: The system automatically divides match expenses equally among paying players only
7. **View Player Accounts**: View individual player accounts to see their contribution history, match expenses, and current balance
8. **Track Expenses**: (Admin only) Track other team expenses by category
9. **View Dashboard**: View summary statistics for the entire system

### Match Expense Calculation
When you create a match:
- Enter ground fee, ball amount, and any other expenses
- Select all players who participated
- Optionally mark some players as "Non-paying" (e.g., guest players who don't contribute financially)
- The system automatically:
  - Calculates total expense (sum of all expense items)
  - Divides total equally among paying players only (non-paying players have ₹0 expense share)
  - Records each player's share
  - Deducts the share from paying players' contribution balance

## License

MIT
