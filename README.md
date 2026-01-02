# Cricket Expense Management Application

A full-stack web application for managing cricket team expenses, contributions, and member information with Azure cloud deployment and automated CI/CD pipelines.

## Features

### Core Functionality
- **Authentication & Authorization**: JWT-based authentication with role-based access control (Admin and Player roles)
- **Security Questions**: Password reset with security question verification
- **Dashboard**: Real-time statistics including total contributions, expenses, balance, and player count
- **Player Management**: Complete CRUD operations for player profiles (name, contact, email, birthday)
- **Player Accounts**: Individual player balance tracking with contribution and expense history
- **Team Management**: Create and manage teams with designated managers
- **Match Management**: Record matches with automatic expense calculation and player assignment
- **Contribution Tracking**: Financial contribution recording and tracking
- **Expense Management**: Team expense tracking by category

### Technical Features
- **Environment-Aware Database**: Automatically switches between SQLite (local) and Azure SQL (production)
- **End-to-End Logging**: Application Insights integration with correlation ID tracking
- **Tool-Agnostic Logging**: Abstract logging interface for easy monitoring tool switching
- **Automated CI/CD**: GitHub Actions pipelines for testing and deployment
- **Infrastructure as Code**: ARM templates for Azure resource provisioning
- **Security Scanning**: Automated vulnerability and secret detection

### Role-Based Access Control

- **Admin Role**: Full access to create, edit, and delete all data
- **Player Role**: Read-only access to view all data

## Tech Stack

### Frontend
- React 18 with React Router
- Bootstrap 5 for responsive UI
- Axios for API communication
- Application Insights (production monitoring)
- Error boundaries for graceful error handling

### Backend
- Node.js with Express.js
- SQLite (local development)
- Azure SQL Server (production)
- JWT authentication with bcryptjs
- CORS enabled
- Application Insights with request tracing

### DevOps & Infrastructure
- **Hosting**: Azure Web App (backend), Azure Static Web App (frontend)
- **Database**: Azure SQL Database with automated backups
- **Monitoring**: Application Insights with end-to-end tracing
- **CI/CD**: GitHub Actions with automated testing and deployment
- **IaC**: ARM templates for infrastructure provisioning
- **Security**: Trivy vulnerability scanning, TruffleHog secret detection

## Quick Start

### Local Development

1. **Prerequisites**
   - Node.js 18.x or higher
   - npm 9.x or higher
   - Git

2. **Clone and Install**
   ```bash
   git clone https://github.com/rams4tech/cricketteamexpenseapp.git
   cd cricketteamexpenseapp
   npm run install-all
   ```

3. **Start Backend** (Terminal 1)
   ```bash
   cd server
   npm start
   ```
   Server runs at http://localhost:5000

4. **Start Frontend** (Terminal 2)
   ```bash
   cd client
   npm start
   ```
   App opens at http://localhost:3000

5. **Create Admin User**
   ```bash
   cd server
   node create-admin.js
   ```
   Default credentials: `admin` / `admin123`

### Azure Deployment

Follow the interactive checklist: **[QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md)**

Or see detailed guides:
- **[CI/CD Setup Guide](CI_CD_SETUP_GUIDE.md)** - Complete deployment setup
- **[Azure Deployment Guide](AZURE_DEPLOYMENT_GUIDE.md)** - Manual Azure deployment
- **[Quick Start](DEPLOYMENT_QUICK_START.md)** - 5-step quick deployment

## Project Structure

```
cricketexpenseapp/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Continuous Integration
│       ├── cd-backend.yml             # Backend deployment
│       ├── cd-frontend.yml            # Frontend deployment
│       └── README.md                  # Workflow documentation
├── azure/
│   ├── azuredeploy.json               # ARM template
│   ├── azuredeploy.parameters.json    # ARM parameters
│   └── README.md                      # ARM template docs
├── client/                            # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── ErrorBoundary.js       # Error handling
│   │   ├── config/
│   │   │   └── logging.config.js      # Logging config
│   │   ├── hooks/
│   │   │   └── usePageTracking.js     # Page view tracking
│   │   ├── pages/                     # React pages
│   │   ├── services/
│   │   │   ├── axiosInterceptor.js    # API logging
│   │   │   └── logger.js              # Client logger
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                            # Express backend
│   ├── config/
│   │   ├── environment.js             # Environment config
│   │   └── logging.config.js          # Logging config
│   ├── database/
│   │   ├── azureSQLAdapter.js         # Azure SQL adapter
│   │   └── azureSQLSchema.js          # Database schema
│   ├── logger/
│   │   ├── ILogger.js                 # Abstract logger
│   │   ├── ApplicationInsightsLogger.js
│   │   ├── ConsoleLogger.js
│   │   └── LoggerFactory.js
│   ├── middleware/
│   │   └── loggingMiddleware.js       # Request logging
│   ├── create-admin.js                # Admin user creation
│   ├── database.js                    # DB initialization
│   ├── server.js                      # API routes
│   ├── web.config                     # Azure IIS config
│   └── package.json
├── AZURE_DEPLOYMENT_GUIDE.md          # Complete Azure guide
├── CI_CD_SETUP_GUIDE.md               # CI/CD setup guide
├── DEPLOYMENT_QUICK_START.md          # Quick deployment
├── LOGGING_GUIDE.md                   # Logging framework docs
├── QUICK_START_CHECKLIST.md           # Deployment checklist
└── README.md                          # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create user account with security question
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/reset-password` - Reset password with security question
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Players
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `GET /api/players/:id/teams` - Get player's teams
- `GET /api/players/:id/account` - Get player account (contributions, expenses, balance)
- `POST /api/players` - Create player (Admin)
- `PUT /api/players/:id` - Update player (Admin)
- `DELETE /api/players/:id` - Delete player (Admin)

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team with players
- `POST /api/teams` - Create team (Admin)
- `PUT /api/teams/:id` - Update team (Admin)
- `DELETE /api/teams/:id` - Delete team (Admin)
- `POST /api/teams/:teamId/players/:playerId` - Add player to team (Admin)
- `DELETE /api/teams/:teamId/players/:playerId` - Remove player from team (Admin)

### Matches
- `GET /api/matches` - Get all matches
- `GET /api/matches/:id` - Get match details with players
- `POST /api/matches` - Create match with automatic expense calculation (Admin)
- `PUT /api/matches/:id` - Update match (Admin)
- `DELETE /api/matches/:id` - Delete match (Admin)
- `POST /api/matches/:matchId/players/:playerId` - Add player to match (Admin)
- `DELETE /api/matches/:matchId/players/:playerId` - Remove player from match (Admin)

### Contributions & Expenses
- `GET /api/contributions` - Get all contributions
- `POST /api/contributions` - Create contribution (Admin)
- `DELETE /api/contributions/:id` - Delete contribution (Admin)
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense (Admin)
- `DELETE /api/expenses/:id` - Delete expense (Admin)

### Summary
- `GET /api/summary` - Get dashboard statistics

## Database Schema

### Users Table
- `id` (PK), `username` (Unique), `password` (Hashed)
- `role` ('admin' or 'player')
- `player_id` (FK → players.id)
- `security_question`, `security_answer` (Hashed)
- `created_at`

### Players Table
- `id` (PK), `firstname`, `lastname`, `mobilenumber`
- `email` (Optional), `birthday` (Optional, MM-DD format)
- `created_at`

### Teams Table
- `id` (PK), `name`, `date_formed`
- `manager_id` (FK → players.id)
- `created_at`

### Team_Players (Junction)
- `id` (PK), `team_id` (FK), `player_id` (FK)
- `joined_date`, `created_at`

### Matches Table
- `id` (PK), `team_id` (FK), `match_date`
- `opponent_team`, `venue`
- `ground_fee`, `ball_amount`, `other_expenses`
- `total_expense`, `expense_per_player`, `players_count`
- `created_at`

### Match_Players (Junction)
- `id` (PK), `match_id` (FK), `player_id` (FK)
- `expense_share`, `is_paying` (1 = paying, 0 = non-paying)
- `created_at`

### Contributions & Expenses
- Standard fields: `id` (PK), `player_id` (FK), `amount`, `date`, `description`, `category`, `created_at`

## Environment Configuration

### Local Development
```env
NODE_ENV=local
DB_TYPE=sqlite
SQLITE_FILE=./cricket_expenses.db
JWT_SECRET=your-dev-secret
PORT=5000
LOGGING_TYPE=console
```

### Production (Azure)
```env
NODE_ENV=production
DB_TYPE=mssql
AZURE_SQL_SERVER=yourserver.database.windows.net
AZURE_SQL_DATABASE=cricketexpensedb
AZURE_SQL_USER=sqladmin
AZURE_SQL_PASSWORD=YourStrongPassword
JWT_SECRET=production-secret-key
APPINSIGHTS_INSTRUMENTATION_KEY=your-key
LOGGING_TYPE=applicationInsights
```

## CI/CD Pipeline

### Continuous Integration
**Triggers**: Push/PR to `main` or `develop`
- Multi-version Node.js testing (18.x, 20.x)
- Security vulnerability scanning
- Code quality checks
- Frontend and backend build verification

### Continuous Deployment
**Backend**: Deploys to Azure Web App on push to `main` (server files)
**Frontend**: Deploys to Azure Static Web App on push to `main` (client files)

**Features**:
- Automated health checks
- Environment variable management
- Deployment summaries
- Manual deployment option

## Monitoring & Logging

### Application Insights Integration
- End-to-end request tracing with correlation IDs
- Performance monitoring
- Error tracking
- Custom events and metrics
- Live metrics stream

### Logging Levels
```javascript
logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error occurred', error);
logger.debug('Debug information');
```

See [LOGGING_GUIDE.md](LOGGING_GUIDE.md) for complete documentation.

## Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Security questions for password reset
- ✅ Role-based access control
- ✅ HTTPS-only in production
- ✅ SQL injection protection
- ✅ Automated vulnerability scanning
- ✅ Secret detection in CI/CD
- ✅ CORS configuration

## Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md) | Interactive deployment checklist |
| [CI_CD_SETUP_GUIDE.md](CI_CD_SETUP_GUIDE.md) | Complete CI/CD setup guide |
| [AZURE_DEPLOYMENT_GUIDE.md](AZURE_DEPLOYMENT_GUIDE.md) | Detailed Azure deployment |
| [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md) | 5-step quick deployment |
| [LOGGING_GUIDE.md](LOGGING_GUIDE.md) | Logging framework documentation |
| [azure/README.md](azure/README.md) | ARM template documentation |
| [.github/workflows/README.md](.github/workflows/README.md) | GitHub Actions workflows |

## Cost Estimate (Azure)

| Tier | Resources | Monthly Cost |
|------|-----------|--------------|
| **Development** | B1 App Service, S0 SQL, Free Static Web App | ~$28 |
| **Production** | S1 App Service, S1 SQL, Standard Static Web App | ~$119 |

## Build Status

![CI](https://github.com/rams4tech/cricketteamexpenseapp/workflows/Continuous%20Integration/badge.svg)
![Backend CD](https://github.com/rams4tech/cricketteamexpenseapp/workflows/Backend%20CD/badge.svg)
![Frontend CD](https://github.com/rams4tech/cricketteamexpenseapp/workflows/Frontend%20CD/badge.svg)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/rams4tech/cricketteamexpenseapp/issues
- **Documentation**: See links above
- **Azure Logs**: `az webapp log tail --resource-group cricket-expense-rg --name your-webapp`

---

**Version**: 1.0.0
**Last Updated**: 2026-01-02
**Author**: Generated with Claude Code
