# Azure Deployment Quick Start

Quick reference for deploying the Cricket Expense Management Application to Azure.

## 🚀 Quick Deploy (5 Steps)

### 1. Create Azure Resources

```bash
# Login
az login

# Create everything
az group create --name cricket-expense-rg --location southindia

az sql server create \
  --name cricket-expense-sqlserver \
  --resource-group cricket-expense-rg \
  --location southindia \
  --admin-user sqladmin \
  --admin-password 'YourStrongPassword123!'

az sql db create \
  --resource-group cricket-expense-rg \
  --server cricket-expense-sqlserver \
  --name cricketexpensedb \
  --service-objective S0

az webapp up \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api \
  --runtime "NODE:18-lts" \
  --sku B1 \
  --location southindia
```

### 2. Configure Environment Variables

```bash
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
    JWT_SECRET="change-this-to-something-secure-123"
```

### 3. Deploy Code

```bash
cd server
zip -r deploy.zip . -x "node_modules/*" "*.db"
az webapp deployment source config-zip \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api \
  --src deploy.zip
```

### 4. Create Admin User

```bash
# Option A: Run create-admin.js via SSH
az webapp ssh --resource-group cricket-expense-rg --name cricketteamexpense-api
# Then: node create-admin.js

# Option B: Create manually
# Default admin credentials:
# Username: admin
# Password: admin123
```

### 5. Test the Deployment

```bash
# Get the URL
az webapp show \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api \
  --query defaultHostName \
  --output tsv

# Test endpoint
curl https://cricketteamexpense-api.azurewebsites.net/api/summary
```

---

## 📝 Environment Configuration

### Local Development (.env)

```env
NODE_ENV=local
DB_TYPE=sqlite
SQLITE_FILE=./cricket_expenses.db
JWT_SECRET=local-dev-secret
PORT=5000
```

### Production (Azure App Settings)

| Setting | Value |
|---------|-------|
| NODE_ENV | production |
| DB_TYPE | mssql |
| AZURE_SQL_SERVER | yourserver.database.windows.net |
| AZURE_SQL_DATABASE | cricketexpensedb |
| AZURE_SQL_USER | sqladmin |
| AZURE_SQL_PASSWORD | YourPassword |
| JWT_SECRET | strong-secret-key |

---

## 🔍 Verify Deployment

```bash
# Check logs
az webapp log tail --resource-group cricket-expense-rg --name cricketteamexpense-api

# Check app status
az webapp show --resource-group cricket-expense-rg --name cricketteamexpense-api --query state

# Test API
curl https://your-app.azurewebsites.net/api/summary
```

---

## ⚠️ Common Issues

### Database Connection Failed
```bash
# Add firewall rule for your IP
az sql server firewall-rule create \
  --resource-group cricket-expense-rg \
  --server cricket-expense-sqlserver \
  --name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### App Won't Start
```bash
# Check Node version
az webapp config show --resource-group cricket-expense-rg --name cricketteamexpense-api

# Restart app
az webapp restart --resource-group cricket-expense-rg --name cricketteamexpense-api
```

### CORS Errors
```bash
# Add CORS origin
az webapp cors add \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-api \
  --allowed-origins "https://your-frontend-domain.com"
```

---

## 🗑️ Clean Up (Delete Everything)

```bash
# Delete resource group (removes all resources)
az group delete --name cricket-expense-rg --yes
```

---

## 📚 Full Documentation

See [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md) for complete instructions.

---

**Need Help?**
- Check application logs in Azure Portal
- Review [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md)
- Use Application Insights for debugging
