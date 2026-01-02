# CI/CD Setup Guide

Complete guide for setting up Continuous Integration and Continuous Deployment for the Cricket Expense Management Application using GitHub Actions and Azure.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [ARM Template Deployment](#arm-template-deployment)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [CI/CD Workflows](#cicd-workflows)
6. [Manual Deployment](#manual-deployment)
7. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)

---

## Overview

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     GitHub Repository                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐│
│  │   Source   │  │   CI/CD    │  │   ARM Templates    ││
│  │    Code    │  │ Workflows  │  │                    ││
│  └────────────┘  └────────────┘  └────────────────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Push/PR
                       ▼
         ┌─────────────────────────────┐
         │   GitHub Actions Runners    │
         │  ┌─────────┐  ┌───────────┐ │
         │  │   CI    │  │    CD     │ │
         │  │  Test   │  │  Deploy   │ │
         │  └─────────┘  └───────────┘ │
         └──────────┬──────────────────┘
                    │
                    │ Deploy
                    ▼
    ┌───────────────────────────────────────┐
    │         Azure Resources               │
    │  ┌──────────────┐  ┌───────────────┐ │
    │  │  Azure SQL   │  │   App Service │ │
    │  │   Database   │  │   (Backend)   │ │
    │  └──────────────┘  └───────────────┘ │
    │  ┌──────────────┐  ┌───────────────┐ │
    │  │ Static Web   │  │ Application   │ │
    │  │     App      │  │   Insights    │ │
    │  │  (Frontend)  │  │               │ │
    │  └──────────────┘  └───────────────┘ │
    └───────────────────────────────────────┘
```

### Workflows

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Runs on: Push/PR to main or develop branches
   - Tests both frontend and backend
   - Security scanning
   - Code quality checks

2. **Backend CD** (`.github/workflows/cd-backend.yml`)
   - Runs on: Push to main (server code changes)
   - Deploys to Azure Web App
   - Configures app settings
   - Health checks

3. **Frontend CD** (`.github/workflows/cd-frontend.yml`)
   - Runs on: Push to main (client code changes)
   - Builds React application
   - Deploys to Azure Static Web App

---

## Prerequisites

### Required Tools

```bash
# Azure CLI
az --version  # Should be 2.50.0 or higher

# GitHub CLI (optional)
gh --version

# Node.js
node --version  # Should be 18.x or higher

# Git
git --version
```

### Azure Subscription

1. Active Azure subscription
2. Sufficient permissions to create resources
3. Resource quotas for:
   - 1 Resource Group
   - 1 SQL Server + Database
   - 1 App Service Plan + Web App
   - 1 Static Web App
   - 1 Application Insights

---

## ARM Template Deployment

### Option 1: Deploy via Azure CLI

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"

# Create resource group
az group create \
  --name cricket-expense-rg \
  --location southindia

# Deploy ARM template
az deployment group create \
  --resource-group cricket-expense-rg \
  --template-file azure/azuredeploy.json \
  --parameters azure/azuredeploy.parameters.json \
  --parameters \
    sqlAdministratorPassword='YourStrongPassword123!' \
    jwtSecret='your-super-secure-jwt-secret-key-min-32-chars'

# Get deployment outputs
az deployment group show \
  --resource-group cricket-expense-rg \
  --name azuredeploy \
  --query properties.outputs
```

### Option 2: Deploy via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Template deployment"
3. Click "Build your own template in the editor"
4. Copy contents from `azure/azuredeploy.json`
5. Click "Save"
6. Fill in parameters:
   - **Project Name**: cricket-expense
   - **Location**: South India
   - **SQL Administrator Password**: Strong password
   - **JWT Secret**: Secure random string (min 32 chars)
7. Click "Review + Create" → "Create"

### Important: Save Deployment Outputs

After deployment, save these values (you'll need them for GitHub secrets):

```bash
# Get all outputs
az deployment group show \
  --resource-group cricket-expense-rg \
  --name azuredeploy \
  --query properties.outputs \
  --output json > deployment-outputs.json

# Or get individual values
az deployment group show \
  --resource-group cricket-expense-rg \
  --name azuredeploy \
  --query properties.outputs.webAppName.value \
  --output tsv
```

---

## GitHub Secrets Configuration

### Required Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

#### 1. Azure Credentials

Create a service principal:

```bash
# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal
az ad sp create-for-rbac \
  --name "cricket-expense-github-actions" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/cricket-expense-rg \
  --sdk-auth
```

Copy the entire JSON output and save as `AZURE_CREDENTIALS` secret.

#### 2. Azure Resource Names

From deployment outputs or Azure Portal:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `AZURE_RESOURCE_GROUP` | Resource group name | `cricket-expense-rg` |
| `AZURE_WEBAPP_NAME` | Backend web app name | From deployment output `webAppName` |
| `AZURE_SQL_SERVER` | SQL Server FQDN | From deployment output `sqlServerFqdn` |
| `AZURE_SQL_DATABASE` | Database name | From deployment output `sqlDatabaseName` |
| `AZURE_SQL_USER` | SQL admin username | `sqladmin` (or your choice) |
| `AZURE_SQL_PASSWORD` | SQL admin password | Password used during deployment |
| `JWT_SECRET` | JWT signing key | Same value used during deployment |
| `APPINSIGHTS_INSTRUMENTATION_KEY` | App Insights key | From deployment output `appInsightsInstrumentationKey` |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | App Insights connection string | From deployment output `appInsightsConnectionString` |

#### 3. Static Web App Token

```bash
# Get Static Web App deployment token
az staticwebapp secrets list \
  --name cricket-expense-web \
  --resource-group cricket-expense-rg \
  --query properties.apiKey \
  --output tsv
```

Save as `AZURE_STATIC_WEB_APPS_API_TOKEN`.

#### 4. Frontend Configuration

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `REACT_APP_API_URL` | `https://your-webapp.azurewebsites.net/api` | Backend API URL |
| `REACT_APP_APPINSIGHTS_KEY` | From deployment outputs | Optional: App Insights key |

### Complete Secret List

```
Required Secrets:
├── AZURE_CREDENTIALS
├── AZURE_RESOURCE_GROUP
├── AZURE_WEBAPP_NAME
├── AZURE_SQL_SERVER
├── AZURE_SQL_DATABASE
├── AZURE_SQL_USER
├── AZURE_SQL_PASSWORD
├── JWT_SECRET
├── APPINSIGHTS_INSTRUMENTATION_KEY
├── APPLICATIONINSIGHTS_CONNECTION_STRING
├── AZURE_STATIC_WEB_APPS_API_TOKEN
├── REACT_APP_API_URL
└── REACT_APP_APPINSIGHTS_KEY (optional)
```

### Quick Setup Script

```bash
# Set all secrets at once using GitHub CLI
gh secret set AZURE_CREDENTIALS < azure-credentials.json
gh secret set AZURE_RESOURCE_GROUP --body "cricket-expense-rg"
gh secret set AZURE_WEBAPP_NAME --body "$(az deployment group show --resource-group cricket-expense-rg --name azuredeploy --query properties.outputs.webAppName.value -o tsv)"
gh secret set AZURE_SQL_SERVER --body "$(az deployment group show --resource-group cricket-expense-rg --name azuredeploy --query properties.outputs.sqlServerFqdn.value -o tsv)"
gh secret set AZURE_SQL_DATABASE --body "cricketexpensedb"
gh secret set AZURE_SQL_USER --body "sqladmin"
gh secret set AZURE_SQL_PASSWORD --body "YourStrongPassword123!"
gh secret set JWT_SECRET --body "your-super-secure-jwt-secret-key"
gh secret set APPINSIGHTS_INSTRUMENTATION_KEY --body "$(az deployment group show --resource-group cricket-expense-rg --name azuredeploy --query properties.outputs.appInsightsInstrumentationKey.value -o tsv)"
gh secret set APPLICATIONINSIGHTS_CONNECTION_STRING --body "$(az deployment group show --resource-group cricket-expense-rg --name azuredeploy --query properties.outputs.appInsightsConnectionString.value -o tsv)"
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$(az staticwebapp secrets list --name cricket-expense-web --resource-group cricket-expense-rg --query properties.apiKey -o tsv)"
gh secret set REACT_APP_API_URL --body "https://$(az deployment group show --resource-group cricket-expense-rg --name azuredeploy --query properties.outputs.webAppName.value -o tsv).azurewebsites.net/api"
gh secret set REACT_APP_APPINSIGHTS_KEY --body "$(az deployment group show --resource-group cricket-expense-rg --name azuredeploy --query properties.outputs.appInsightsInstrumentationKey.value -o tsv)"
```

---

## CI/CD Workflows

### CI Workflow

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
1. **Backend CI**: Tests Node.js backend (versions 18.x, 20.x)
2. **Frontend CI**: Tests and builds React frontend
3. **Code Quality**: Checks for TODOs, large files
4. **Security Scan**: Trivy vulnerability scanner, secret detection

**To Run Manually:**

```bash
# Via GitHub CLI
gh workflow run ci.yml

# Or push to trigger
git push origin main
```

### Backend CD Workflow

**Triggers:**
- Push to `main` branch (when server files change)
- Manual trigger via workflow_dispatch

**Steps:**
1. Checkout code
2. Install dependencies
3. Create deployment package
4. Deploy to Azure Web App
5. Configure app settings
6. Health check
7. Deployment summary

**Manual Trigger:**

```bash
# Via GitHub CLI
gh workflow run cd-backend.yml

# Or via GitHub UI
# Actions → Backend CD → Run workflow
```

### Frontend CD Workflow

**Triggers:**
- Push to `main` branch (when client files change)
- Manual trigger via workflow_dispatch

**Steps:**
1. Checkout code
2. Install dependencies
3. Create production environment file
4. Build React application
5. Deploy to Azure Static Web App
6. Upload artifacts

**Manual Trigger:**

```bash
# Via GitHub CLI
gh workflow run cd-frontend.yml

# Or via GitHub UI
# Actions → Frontend CD → Run workflow
```

---

## Manual Deployment

### Backend Manual Deployment

```bash
cd server

# Install production dependencies
npm ci --production

# Create deployment package
zip -r deploy.zip . \
  -x "node_modules/*" \
  -x "*.db" \
  -x "*.db-journal"

# Deploy
az webapp deployment source config-zip \
  --resource-group cricket-expense-rg \
  --name your-webapp-name \
  --src deploy.zip

# Check logs
az webapp log tail \
  --resource-group cricket-expense-rg \
  --name your-webapp-name
```

### Frontend Manual Deployment

```bash
cd client

# Create production env file
echo "REACT_APP_API_URL=https://your-api.azurewebsites.net/api" > .env.production

# Install dependencies
npm ci

# Build
npm run build

# Deploy to Static Web App
npx @azure/static-web-apps-cli deploy \
  --deployment-token your-token \
  --app-location . \
  --output-location build
```

---

## Monitoring and Troubleshooting

### Check Workflow Status

```bash
# List recent workflow runs
gh run list

# View specific run
gh run view <run-id>

# Watch a running workflow
gh run watch
```

### Check Azure Deployment

```bash
# Check web app status
az webapp show \
  --resource-group cricket-expense-rg \
  --name your-webapp-name \
  --query state

# View logs
az webapp log tail \
  --resource-group cricket-expense-rg \
  --name your-webapp-name

# Download logs
az webapp log download \
  --resource-group cricket-expense-rg \
  --name your-webapp-name \
  --log-file app-logs.zip
```

### Common Issues

#### 1. Deployment Failed - Azure Credentials

**Error**: `Azure login failed`

**Solution**:
```bash
# Recreate service principal
az ad sp create-for-rbac \
  --name "cricket-expense-github-actions" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/cricket-expense-rg \
  --sdk-auth

# Update AZURE_CREDENTIALS secret
```

#### 2. Database Connection Failed

**Error**: `Failed to connect to Azure SQL`

**Solution**:
```bash
# Add firewall rule
az sql server firewall-rule create \
  --resource-group cricket-expense-rg \
  --server your-sql-server \
  --name AllowGitHubActions \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255
```

#### 3. App Not Starting

**Error**: `503 Service Unavailable`

**Solutions**:
- Check app settings are configured
- Verify Node.js version matches
- Check application logs
- Restart the app:
  ```bash
  az webapp restart \
    --resource-group cricket-expense-rg \
    --name your-webapp-name
  ```

#### 4. Static Web App Deployment Failed

**Error**: `Invalid deployment token`

**Solution**:
```bash
# Get new token
az staticwebapp secrets list \
  --name cricket-expense-web \
  --resource-group cricket-expense-rg \
  --query properties.apiKey \
  --output tsv

# Update AZURE_STATIC_WEB_APPS_API_TOKEN secret
```

### Health Check Endpoints

```bash
# Backend health check
curl https://your-webapp.azurewebsites.net/api/summary

# Frontend
curl https://your-static-app.azurestaticapps.net

# Application Insights
# Check in Azure Portal → Application Insights → Live Metrics
```

---

## Maintenance

### Update Dependencies

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Trigger CI to test
git add package*.json
git commit -m "chore: update dependencies"
git push
```

### Rotate Secrets

```bash
# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 32)

# Update in Azure
az webapp config appsettings set \
  --resource-group cricket-expense-rg \
  --name your-webapp-name \
  --settings JWT_SECRET="$NEW_JWT_SECRET"

# Update GitHub secret
gh secret set JWT_SECRET --body "$NEW_JWT_SECRET"
```

### Scale Resources

```bash
# Scale up App Service Plan
az appservice plan update \
  --resource-group cricket-expense-rg \
  --name cricket-expense-plan \
  --sku S1

# Scale up SQL Database
az sql db update \
  --resource-group cricket-expense-rg \
  --server your-sql-server \
  --name cricketexpensedb \
  --service-objective S1
```

---

## Cost Monitoring

### Estimated Monthly Costs

**Development/Testing:**
- App Service (B1): ~$13/month
- SQL Database (S0): ~$15/month
- Static Web App (Free): $0
- Application Insights (5GB): $0
- **Total**: ~$28/month

**Production:**
- App Service (S1): ~$70/month
- SQL Database (S1): ~$30/month
- Static Web App (Standard): ~$9/month
- Application Insights: ~$10/month
- **Total**: ~$119/month

### Monitor Costs

```bash
# View cost analysis
az consumption usage list \
  --start-date 2024-01-01 \
  --end-date 2024-01-31

# Set up budget alerts in Azure Portal
# Cost Management → Budgets → Add
```

---

## Security Best Practices

1. ✅ Rotate secrets regularly (every 90 days)
2. ✅ Use separate environments (dev/staging/prod)
3. ✅ Enable Azure AD authentication for sensitive operations
4. ✅ Review workflow logs for sensitive data leaks
5. ✅ Keep dependencies updated
6. ✅ Use minimal permissions for service principals
7. ✅ Enable Azure Security Center recommendations
8. ✅ Implement proper secret management (Azure Key Vault)

---

## Next Steps

1. ✅ Deploy ARM template to Azure
2. ✅ Configure all GitHub secrets
3. ✅ Push code to trigger first CI/CD run
4. ✅ Monitor deployment in GitHub Actions
5. ✅ Verify application in Azure
6. ✅ Set up monitoring alerts
7. ✅ Configure custom domain (optional)
8. ✅ Set up staging environment (optional)

---

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review Azure Application Insights
3. Check this documentation
4. Review Azure Portal logs

---

**Last Updated**: 2026-01-02
**Version**: 1.0
