# Quick Start Checklist

Use this checklist to deploy the Cricket Expense Management Application to Azure with CI/CD.

## Prerequisites ✅

- [ ] Azure subscription (active)
- [ ] Azure CLI installed (`az --version`)
- [ ] GitHub account
- [ ] GitHub CLI installed (optional, `gh --version`)
- [ ] Node.js 18+ installed
- [ ] Git installed and configured

## Step 1: Create GitHub Repository ⚡

**If repository doesn't exist on GitHub yet:**

- [ ] Go to https://github.com/rams4tech
- [ ] Click "+" → "New repository"
- [ ] Repository name: `cricketteamexpenseapp`
- [ ] Choose Public or Private
- [ ] **DO NOT** initialize with README
- [ ] Click "Create repository"

**Push local code:**

```bash
git push -u origin main
```

- [ ] Verify code is on GitHub

## Step 2: Deploy Azure Infrastructure 🏗️

**Login to Azure:**

```bash
az login
az account show  # Verify correct subscription
```

- [ ] Logged in successfully

**Deploy ARM template:**

```bash
# Create resource group
az group create --name cricket-expense-rg --location eastus

# Deploy resources
az deployment group create \
  --resource-group cricket-expense-rg \
  --template-file azure/azuredeploy.json \
  --parameters azure/azuredeploy.parameters.json \
  --parameters \
    sqlAdministratorPassword='YourStrongPassword123!' \
    jwtSecret='your-super-secure-jwt-secret-key-minimum-32-characters'
```

- [ ] Resource group created
- [ ] ARM template deployed successfully
- [ ] No deployment errors

**Save deployment outputs:**

```bash
# Save all outputs to file
az deployment group show \
  --resource-group cricket-expense-rg \
  --name azuredeploy \
  --query properties.outputs > deployment-outputs.json
```

- [ ] Outputs saved to file

## Step 3: Configure GitHub Secrets 🔐

**Create service principal for GitHub Actions:**

```bash
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az ad sp create-for-rbac \
  --name "cricket-expense-github-actions" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/cricket-expense-rg \
  --sdk-auth > azure-credentials.json
```

- [ ] Service principal created
- [ ] Credentials saved to azure-credentials.json

**Get deployment values:**

```bash
# Get webapp name
WEBAPP_NAME=$(az deployment group show --resource-group cricket-expense-rg --name azuredeploy --query properties.outputs.webAppName.value -o tsv)
echo "Web App Name: $WEBAPP_NAME"

# Get SQL Server FQDN
SQL_SERVER=$(az deployment group show --resource-group cricket-expense-rg --name azuredeploy --query properties.outputs.sqlServerFqdn.value -o tsv)
echo "SQL Server: $SQL_SERVER"

# Get Static Web App token
STATIC_TOKEN=$(az staticwebapp secrets list --name cricket-expense-web --resource-group cricket-expense-rg --query properties.apiKey -o tsv)
echo "Static Web App Token: $STATIC_TOKEN"

# Get App Insights key
APPINSIGHTS_KEY=$(az deployment group show --resource-group cricket-expense-rg --name azuredeploy --query properties.outputs.appInsightsInstrumentationKey.value -o tsv)
echo "App Insights Key: $APPINSIGHTS_KEY"
```

- [ ] All values retrieved

**Set GitHub secrets (via GitHub CLI):**

```bash
# Navigate to repository
cd /path/to/cricketexpenseapp

# Set secrets
gh secret set AZURE_CREDENTIALS < azure-credentials.json
gh secret set AZURE_RESOURCE_GROUP --body "cricket-expense-rg"
gh secret set AZURE_WEBAPP_NAME --body "$WEBAPP_NAME"
gh secret set AZURE_SQL_SERVER --body "$SQL_SERVER"
gh secret set AZURE_SQL_DATABASE --body "cricketexpensedb"
gh secret set AZURE_SQL_USER --body "sqladmin"
gh secret set AZURE_SQL_PASSWORD --body "YourStrongPassword123!"
gh secret set JWT_SECRET --body "your-super-secure-jwt-secret-key-minimum-32-characters"
gh secret set APPINSIGHTS_INSTRUMENTATION_KEY --body "$APPINSIGHTS_KEY"
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$STATIC_TOKEN"
gh secret set REACT_APP_API_URL --body "https://$WEBAPP_NAME.azurewebsites.net/api"
gh secret set REACT_APP_APPINSIGHTS_KEY --body "$APPINSIGHTS_KEY"
```

- [ ] All 12 secrets configured

**Or set via GitHub web UI:**

Go to: `https://github.com/rams4tech/cricketteamexpenseapp/settings/secrets/actions`

| Secret Name | Value |
|-------------|-------|
| AZURE_CREDENTIALS | Contents of azure-credentials.json |
| AZURE_RESOURCE_GROUP | cricket-expense-rg |
| AZURE_WEBAPP_NAME | From deployment outputs |
| AZURE_SQL_SERVER | From deployment outputs |
| AZURE_SQL_DATABASE | cricketexpensedb |
| AZURE_SQL_USER | sqladmin |
| AZURE_SQL_PASSWORD | Your SQL password |
| JWT_SECRET | Your JWT secret |
| APPINSIGHTS_INSTRUMENTATION_KEY | From deployment outputs |
| AZURE_STATIC_WEB_APPS_API_TOKEN | From static web app |
| REACT_APP_API_URL | https://your-webapp.azurewebsites.net/api |
| REACT_APP_APPINSIGHTS_KEY | Same as APPINSIGHTS_INSTRUMENTATION_KEY |

- [ ] All secrets configured via web UI

## Step 4: Trigger First Deployment 🚀

**Option A: Push to main branch (already done)**

If you've already pushed to main, workflows should have triggered automatically.

- [ ] Check GitHub Actions tab: https://github.com/rams4tech/cricketteamexpenseapp/actions

**Option B: Manual trigger**

```bash
# Trigger backend deployment
gh workflow run cd-backend.yml

# Trigger frontend deployment
gh workflow run cd-frontend.yml
```

- [ ] Backend workflow triggered
- [ ] Frontend workflow triggered

**Monitor deployments:**

```bash
# Watch workflow runs
gh run list
gh run watch  # Watch latest run
```

- [ ] CI workflow completed successfully
- [ ] Backend CD workflow completed successfully
- [ ] Frontend CD workflow completed successfully

## Step 5: Verify Deployment ✅

**Check Azure resources:**

```bash
# Check web app status
az webapp show \
  --resource-group cricket-expense-rg \
  --name $WEBAPP_NAME \
  --query state

# Get web app URL
BACKEND_URL=$(az webapp show --resource-group cricket-expense-rg --name $WEBAPP_NAME --query defaultHostName -o tsv)
echo "Backend URL: https://$BACKEND_URL"

# Get static web app URL
FRONTEND_URL=$(az staticwebapp show --name cricket-expense-web --resource-group cricket-expense-rg --query defaultHostname -o tsv)
echo "Frontend URL: https://$FRONTEND_URL"
```

- [ ] Web app is running
- [ ] URLs retrieved

**Test backend API:**

```bash
# Test API endpoint
curl https://$BACKEND_URL/api/summary

# Should return JSON like:
# {"totalContributions":0,"totalExpenses":0,"balance":0,"playersCount":0}
```

- [ ] Backend API responding
- [ ] Returns valid JSON

**Test frontend:**

```bash
# Open in browser
open https://$FRONTEND_URL

# Or use curl
curl -I https://$FRONTEND_URL
# Should return: HTTP/2 200
```

- [ ] Frontend loads successfully
- [ ] Can navigate to login page

**Check application logs:**

```bash
# Stream backend logs
az webapp log tail \
  --resource-group cricket-expense-rg \
  --name $WEBAPP_NAME

# Look for:
# - "Connected to Azure SQL database (production environment)"
# - No error messages
```

- [ ] Backend logs show successful database connection
- [ ] No errors in logs

## Step 6: Create Admin User 👤

**SSH into web app:**

```bash
az webapp ssh \
  --resource-group cricket-expense-rg \
  --name $WEBAPP_NAME

# Inside SSH session:
cd site/wwwroot
node create-admin.js
exit
```

- [ ] SSH connection successful
- [ ] Admin user created
- [ ] Credentials: admin / admin123

**Or test signup/login:**

1. Navigate to your frontend URL
2. Click "Sign Up"
3. Create an account
4. Login with credentials

- [ ] Can access frontend
- [ ] Can sign up
- [ ] Can login

## Step 7: Configure CORS (Optional) 🔧

**Add frontend URL to CORS:**

```bash
az webapp cors add \
  --resource-group cricket-expense-rg \
  --name $WEBAPP_NAME \
  --allowed-origins "https://$FRONTEND_URL"

# Verify
az webapp cors show \
  --resource-group cricket-expense-rg \
  --name $WEBAPP_NAME
```

- [ ] CORS configured
- [ ] Frontend can call backend API

## Step 8: Post-Deployment Checks ✅

**Application Insights:**

1. Go to Azure Portal → Application Insights → cricket-expense-insights
2. Check "Live Metrics"
3. Navigate your app to generate some requests
4. Verify telemetry is being collected

- [ ] Application Insights receiving data
- [ ] Live metrics showing requests

**Database:**

```bash
# Check database size
az sql db show \
  --resource-group cricket-expense-rg \
  --server $(echo $SQL_SERVER | cut -d'.' -f1) \
  --name cricketexpensedb \
  --query currentServiceObjectiveName
```

- [ ] Database is accessible
- [ ] Schema created (check logs)

**Cost monitoring:**

1. Go to Azure Portal → Cost Management
2. Set up budget alert
3. Recommended: $50/month for development

- [ ] Budget alert configured

## Step 9: Documentation & Cleanup 📚

**Save important information:**

Create a file `deployment-info.txt` with:
```
Backend URL: https://your-webapp.azurewebsites.net
Frontend URL: https://your-static-app.azurestaticapps.net
Admin Username: admin
Admin Password: admin123
Resource Group: cricket-expense-rg
SQL Server: your-server.database.windows.net
Database: cricketexpensedb
```

- [ ] Deployment info saved securely

**Clean up local files:**

```bash
# Remove sensitive files
rm azure-credentials.json
rm deployment-outputs.json

# These are already in .gitignore
```

- [ ] Sensitive files removed from local machine

**Review security:**

- [ ] Changed default admin password
- [ ] JWT_SECRET is strong and unique
- [ ] SQL password is strong
- [ ] Secrets are not committed to Git

## Step 10: Next Steps 🎯

**Setup monitoring alerts:**

1. Go to Application Insights → Alerts
2. Create alerts for:
   - Response time > 1 second
   - Error rate > 5%
   - Availability < 99%

- [ ] Alerts configured

**Setup backups:**

```bash
# Enable automated SQL backups (already enabled by default)
az sql db show \
  --resource-group cricket-expense-rg \
  --server $(echo $SQL_SERVER | cut -d'.' -f1) \
  --name cricketexpensedb \
  --query earliestRestoreDate
```

- [ ] Backups verified

**Optional: Custom domain:**

If you have a custom domain:

```bash
# Add custom domain to web app
az webapp config hostname add \
  --webapp-name $WEBAPP_NAME \
  --resource-group cricket-expense-rg \
  --hostname api.yourdomain.com

# Add custom domain to static web app
az staticwebapp hostname set \
  --name cricket-expense-web \
  --resource-group cricket-expense-rg \
  --hostname www.yourdomain.com
```

- [ ] Custom domain configured (optional)

## Troubleshooting 🔧

If something goes wrong, check:

1. **GitHub Actions logs**: https://github.com/rams4tech/cricketteamexpenseapp/actions
2. **Azure Web App logs**: `az webapp log tail --resource-group cricket-expense-rg --name $WEBAPP_NAME`
3. **Application Insights**: Azure Portal → Application Insights → Failures
4. **Deployment guide**: [CI_CD_SETUP_GUIDE.md](CI_CD_SETUP_GUIDE.md)

Common issues:
- ❌ "Azure credentials invalid" → Re-create service principal
- ❌ "Database connection failed" → Check firewall rules
- ❌ "App won't start" → Check app settings configured correctly
- ❌ "CORS error" → Add frontend URL to CORS whitelist

## Success! 🎉

You should now have:
- ✅ Application deployed to Azure
- ✅ CI/CD pipelines running
- ✅ Monitoring configured
- ✅ Secure secrets management
- ✅ Automated deployments on push to main

**Access your application:**
- Frontend: https://your-static-app.azurestaticapps.net
- Backend API: https://your-webapp.azurewebsites.net/api
- Azure Portal: https://portal.azure.com

---

## Quick Command Reference

```bash
# View GitHub workflows
gh workflow list
gh run list

# Check Azure resources
az resource list --resource-group cricket-expense-rg --output table

# View logs
az webapp log tail --resource-group cricket-expense-rg --name $WEBAPP_NAME

# Restart app
az webapp restart --resource-group cricket-expense-rg --name $WEBAPP_NAME

# Delete everything (CAUTION!)
az group delete --name cricket-expense-rg --yes
```

---

**Need Help?**
- 📘 [Complete Setup Guide](CI_CD_SETUP_GUIDE.md)
- 🚀 [Quick Deployment Guide](DEPLOYMENT_QUICK_START.md)
- 📊 [Logging Guide](LOGGING_GUIDE.md)
- 💬 [GitHub Issues](https://github.com/rams4tech/cricketteamexpenseapp/issues)

**Estimated Setup Time**: 30-45 minutes

---

**Checklist Created**: 2026-01-02
**Version**: 1.0
