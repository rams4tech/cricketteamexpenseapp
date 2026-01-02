# Azure Deployment Guide

Complete guide for deploying the Cricket Expense Management Application to Azure Web Apps.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Local Development Setup](#local-development-setup)
4. [Azure Resources Setup](#azure-resources-setup)
5. [Database Configuration](#database-configuration)
6. [Application Configuration](#application-configuration)
7. [Deployment Steps](#deployment-steps)
8. [Post-Deployment Configuration](#post-deployment-configuration)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Azure Subscription**: Active Azure account
- **Azure CLI**: Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
- **Node.js**: Version 18.x or higher
- **Git**: For source control
- **VS Code** (Optional): With Azure App Service extension

---

## Architecture Overview

### Local Development
- **Database**: SQLite (file-based)
- **Environment**: NODE_ENV=local
- **Port**: 5000

### Production (Azure)
- **Backend**: Azure Web App (Node.js)
- **Database**: Azure SQL Database
- **Monitoring**: Application Insights
- **Environment**: NODE_ENV=production

---

## Local Development Setup

### 1. Environment Configuration

Create `server/.env` file:

```env
NODE_ENV=local
PORT=5000
DB_TYPE=sqlite
SQLITE_FILE=./cricket_expenses.db
JWT_SECRET=your-local-secret-key
LOGGING_TYPE=console
```

### 2. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 3. Run Locally

```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client
cd client
npm start
```

The application will run at:
- Client: http://localhost:3000
- Server: http://localhost:5000

---

## Azure Resources Setup

### Step 1: Create Resource Group

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name cricket-expense-rg \
  --location southindia
```

### Step 2: Create Azure SQL Database

```bash
# Create SQL Server
az sql server create \
  --name cricket-expense-sqlserver \
  --resource-group cricket-expense-rg \
  --location southindia \
  --admin-user sqladmin \
  --admin-password 'YourStrongPassword123!'

# Create SQL Database
az sql db create \
  --resource-group cricket-expense-rg \
  --server cricket-expense-sqlserver \
  --name cricketexpensedb \
  --service-objective S0 \
  --max-size 2GB

# Configure firewall to allow Azure services
az sql server firewall-rule create \
  --resource-group cricket-expense-rg \
  --server cricket-expense-sqlserver \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Step 3: Create Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app cricket-expense-insights \
  --location southindia \
  --resource-group cricket-expense-rg \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app cricket-expense-insights \
  --resource-group cricket-expense-rg \
  --query instrumentationKey \
  --output tsv
```

Save the instrumentation key for later.

### Step 4: Create Azure Web App (Backend)

```bash
# Create App Service Plan
az appservice plan create \
  --name cricket-expense-plan \
  --resource-group cricket-expense-rg \
  --sku B1 \
  --is-linux

# Create Web App for Node.js
az webapp create \
  --resource-group cricket-expense-rg \
  --plan cricket-expense-plan \
  --name cricketteamexpense-api \
  --runtime "NODE:18-lts"
```

### Step 5: Create Azure Web App (Frontend)

```bash
# Create Static Web App for React
az staticwebapp create \
  --name cricketteamexpense \
  --resource-group cricket-expense-rg \
  --location southindia
```

---

## Database Configuration

### Get SQL Connection String

```bash
az sql db show-connection-string \
  --name cricketexpensedb \
  --server cricket-expense-sqlserver \
  --client ado.net
```

Parse the connection string to extract:
- **Server**: `cricket-expense-sqlserver.database.windows.net`
- **Database**: `cricketexpensedb`
- **User**: `sqladmin`
- **Password**: Your password

---

## Application Configuration

### Configure Backend Environment Variables

Set environment variables in Azure Web App:

```bash
# Set Node environment
az webapp config appsettings set \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api \
  --settings \
    NODE_ENV=production \
    DB_TYPE=mssql \
    AZURE_SQL_SERVER="cricket-expense-sqlserver.database.windows.net" \
    AZURE_SQL_DATABASE="cricketexpensedb" \
    AZURE_SQL_USER="sqladmin" \
    AZURE_SQL_PASSWORD="YourStrongPassword123!" \
    JWT_SECRET="your-production-secret-key-change-this" \
    APPINSIGHTS_INSTRUMENTATION_KEY="your-instrumentation-key-here" \
    LOGGING_TYPE="applicationInsights" \
    CORS_ORIGIN="https://cricketteamexpense.azurestaticapps.net"
```

**IMPORTANT**: Change `JWT_SECRET` to a strong, unique value!

### Or Configure via Azure Portal

1. Go to Azure Portal → App Services → cricketteamexpense-api
2. Settings → Configuration → Application settings
3. Add the following settings:

| Name | Value |
|------|-------|
| NODE_ENV | production |
| DB_TYPE | mssql |
| AZURE_SQL_SERVER | cricket-expense-sqlserver.database.windows.net |
| AZURE_SQL_DATABASE | cricketexpensedb |
| AZURE_SQL_USER | sqladmin |
| AZURE_SQL_PASSWORD | YourStrongPassword123! |
| JWT_SECRET | your-production-secret-key |
| APPINSIGHTS_INSTRUMENTATION_KEY | your-key-here |
| LOGGING_TYPE | applicationInsights |

---

## Deployment Steps

### Option 1: Deploy via Azure CLI

#### Backend Deployment

```bash
cd server

# Create a zip file
zip -r deploy.zip . -x "*.git*" "node_modules/*" "*.db"

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api \
  --src deploy.zip
```

#### Frontend Deployment

```bash
cd client

# Build production version
npm run build

# Deploy to Static Web App (requires Azure Static Web Apps CLI)
npm install -g @azure/static-web-apps-cli
swa deploy ./build \
  --deployment-token <your-deployment-token>
```

### Option 2: Deploy via VS Code

1. Install "Azure App Service" extension
2. Sign in to Azure
3. Right-click on `server` folder
4. Select "Deploy to Web App"
5. Choose "cricketteamexpense-api"

### Option 3: Deploy via GitHub Actions (Recommended)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        cd server
        npm install --production

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'cricketteamexpense-api'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./server
```

---

## Post-Deployment Configuration

### 1. Verify Database Schema

The application will automatically create tables on first run. Monitor the logs:

```bash
az webapp log tail \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api
```

You should see: "Azure SQL schema created successfully!"

### 2. Create Admin User

Run the admin creation script:

```bash
# SSH into the web app
az webapp ssh \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api

# Inside the SSH session
cd site/wwwroot
node create-admin.js
```

Or create admin via SQL query:

```sql
INSERT INTO users (username, password, role, security_question, security_answer, created_at)
VALUES (
  'admin',
  '$2a$10$YourHashedPasswordHere',  -- Use bcrypt hash
  'admin',
  'What is your favorite movie?',
  '$2a$10$YourHashedAnswerHere',     -- Use bcrypt hash
  GETDATE()
);
```

### 3. Configure CORS

Update CORS settings if needed:

```bash
az webapp cors add \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api \
  --allowed-origins "https://cricketteamexpense.azurestaticapps.net"
```

### 4. Enable HTTPS Only

```bash
az webapp update \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api \
  --https-only true
```

### 5. Configure Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name cricketteamexpense-api \
  --resource-group cricket-expense-rg \
  --hostname api.yourdomain.com

# Enable SSL
az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI \
  --name cricketteamexpense-api \
  --resource-group cricket-expense-rg
```

---

## Monitoring

### View Application Insights

1. Go to Azure Portal
2. Navigate to Application Insights → cricket-expense-insights
3. Check:
   - Live Metrics: Real-time telemetry
   - Failures: Error tracking
   - Performance: Slow requests
   - Availability: Uptime monitoring

### View Application Logs

```bash
# Stream logs in real-time
az webapp log tail \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api

# Download logs
az webapp log download \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api \
  --log-file app-logs.zip
```

### Set Up Alerts

Create alerts for:
- High error rate
- Slow response times
- Database connection failures
- High CPU/memory usage

---

## Troubleshooting

### Database Connection Errors

**Problem**: "Failed to connect to Azure SQL"

**Solutions**:
1. Check firewall rules:
   ```bash
   az sql server firewall-rule list \
     --resource-group cricket-expense-rg \
     --server cricket-expense-sqlserver
   ```

2. Verify connection string in app settings
3. Check if database exists:
   ```bash
   az sql db show \
     --resource-group cricket-expense-rg \
     --server cricket-expense-sqlserver \
     --name cricketexpensedb
   ```

### Application Won't Start

**Problem**: Web app shows "503 Service Unavailable"

**Solutions**:
1. Check application logs
2. Verify Node.js version matches
3. Check package.json scripts has `"start": "node server.js"`
4. Ensure all environment variables are set

### CORS Errors

**Problem**: Frontend can't connect to backend API

**Solutions**:
1. Add frontend URL to CORS whitelist
2. Check `CORS_ORIGIN` environment variable
3. Enable CORS in Azure portal

### JWT Secret Not Set

**Problem**: Login fails with "Invalid token"

**Solution**: Set JWT_SECRET in application settings

---

## Environment Variables Reference

### Required for Production

| Variable | Example | Description |
|----------|---------|-------------|
| NODE_ENV | production | Environment mode |
| DB_TYPE | mssql | Database type |
| AZURE_SQL_SERVER | server.database.windows.net | SQL Server hostname |
| AZURE_SQL_DATABASE | cricketexpensedb | Database name |
| AZURE_SQL_USER | sqladmin | SQL admin username |
| AZURE_SQL_PASSWORD | StrongPass123! | SQL admin password |
| JWT_SECRET | unique-secret-key | JWT signing key |

### Optional

| Variable | Example | Description |
|----------|---------|-------------|
| APPINSIGHTS_INSTRUMENTATION_KEY | xxx-xxx-xxx | App Insights key |
| LOGGING_TYPE | applicationInsights | Logger type |
| CORS_ORIGIN | https://yourdomain.com | Allowed CORS origin |
| PORT | 8080 | Server port (auto-set by Azure) |

---

## Cost Optimization

### Development/Testing

- **App Service**: B1 Basic tier (~$13/month)
- **SQL Database**: S0 Standard (~$15/month)
- **Application Insights**: Free tier (5GB/month)

**Total**: ~$28/month

### Production

- **App Service**: S1 Standard tier (~$70/month)
- **SQL Database**: S2 Standard (~$75/month)
- **Application Insights**: Pay-as-you-go

**Total**: ~$145/month

### Tips to Reduce Costs

1. Use auto-scale to reduce compute during low traffic
2. Enable auto-pause for SQL Database (if applicable)
3. Use Free tier App Insights for small projects
4. Schedule scale-down during off-hours

---

## Security Best Practices

1. ✅ **Use strong passwords** for SQL Server
2. ✅ **Enable HTTPS only** for web apps
3. ✅ **Rotate JWT secrets** regularly
4. ✅ **Use Managed Identity** for Azure resource access
5. ✅ **Enable Advanced Threat Protection** for SQL Database
6. ✅ **Regular security updates** for dependencies
7. ✅ **Implement rate limiting** (future enhancement)
8. ✅ **Monitor suspicious activity** in Application Insights

---

## Additional Resources

- [Azure Web Apps Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Node.js on Azure Best Practices](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs)

---

## Support

For issues or questions:
1. Check Application Insights logs
2. Review deployment logs in Azure Portal
3. Check this documentation
4. Contact the development team

---

**Last Updated**: 2026-01-02
**Version**: 1.0
