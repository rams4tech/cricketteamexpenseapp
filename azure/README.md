# Azure ARM Templates

This directory contains Azure Resource Manager (ARM) templates for deploying the Cricket Expense Management Application infrastructure.

## Files

- **azuredeploy.json** - Main ARM template that creates all Azure resources
- **azuredeploy.parameters.json** - Parameters file for the ARM template

## Resources Created

The ARM template creates the following Azure resources:

1. **Azure SQL Server**
   - SQL Server instance with admin credentials
   - Firewall rule allowing Azure services
   - Database with configurable SKU

2. **Azure SQL Database**
   - Database: cricketexpensedb
   - Configurable tier (Basic, S0, S1, S2, P1, P2)
   - 2GB initial size

3. **Application Insights**
   - Web application monitoring
   - 90-day data retention
   - Connected to web app

4. **App Service Plan**
   - Linux-based hosting plan
   - Configurable SKU (F1, B1, B2, S1, S2, P1V2, P2V2)

5. **Azure Web App** (Backend)
   - Node.js 18 LTS runtime
   - HTTPS only
   - Auto-configured with environment variables
   - Connected to SQL Database and App Insights

6. **Azure Static Web App** (Frontend)
   - React hosting
   - Free tier by default
   - Global CDN distribution

## Quick Deployment

### Prerequisites

- Azure CLI installed and configured
- Active Azure subscription
- Contributor access to subscription or resource group

### Deploy with Default Parameters

```bash
# Login to Azure
az login

# Create resource group
az group create --name cricket-expense-rg --location eastus

# Deploy template
az deployment group create \
  --resource-group cricket-expense-rg \
  --template-file azuredeploy.json \
  --parameters azuredeploy.parameters.json \
  --parameters \
    sqlAdministratorPassword='YourStrongPassword123!' \
    jwtSecret='your-super-secure-jwt-secret-key'
```

### Deploy with Custom Parameters

```bash
az deployment group create \
  --resource-group cricket-expense-rg \
  --template-file azuredeploy.json \
  --parameters \
    projectName='my-cricket-app' \
    location='westus2' \
    sqlAdministratorLogin='myadmin' \
    sqlAdministratorPassword='MySecurePass123!' \
    appServicePlanSku='S1' \
    sqlDatabaseSku='S1' \
    jwtSecret='my-jwt-secret-key-min-32-characters' \
    staticWebAppLocation='West US 2'
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| projectName | string | cricket-expense | Base name for all resources |
| location | string | Resource Group location | Location for resources |
| sqlAdministratorLogin | string | sqladmin | SQL Server admin username |
| sqlAdministratorPassword | securestring | (required) | SQL Server admin password |
| appServicePlanSku | string | B1 | App Service Plan SKU |
| sqlDatabaseSku | string | S0 | SQL Database tier |
| jwtSecret | securestring | (required) | JWT signing key |
| staticWebAppLocation | string | East US 2 | Static Web App location |

## Outputs

After successful deployment, the template provides these outputs:

| Output | Description |
|--------|-------------|
| sqlServerFqdn | Fully qualified domain name of SQL Server |
| sqlDatabaseName | Name of the created database |
| webAppUrl | URL of the backend web app |
| webAppName | Name of the backend web app |
| staticWebAppUrl | URL of the frontend static web app |
| appInsightsInstrumentationKey | Application Insights instrumentation key |
| appInsightsConnectionString | Application Insights connection string |

### Retrieve Outputs

```bash
# Get all outputs as JSON
az deployment group show \
  --resource-group cricket-expense-rg \
  --name azuredeploy \
  --query properties.outputs

# Get specific output
az deployment group show \
  --resource-group cricket-expense-rg \
  --name azuredeploy \
  --query properties.outputs.webAppUrl.value \
  --output tsv
```

## SKU Options

### App Service Plan SKUs

| SKU | Tier | vCPU | RAM | Price (approx) |
|-----|------|------|-----|----------------|
| F1 | Free | Shared | 1GB | Free |
| B1 | Basic | 1 | 1.75GB | $13/month |
| B2 | Basic | 2 | 3.5GB | $26/month |
| S1 | Standard | 1 | 1.75GB | $70/month |
| S2 | Standard | 2 | 3.5GB | $140/month |
| P1V2 | Premium | 1 | 3.5GB | $80/month |
| P2V2 | Premium | 2 | 7GB | $160/month |

### SQL Database SKUs

| SKU | Tier | DTUs | Storage | Price (approx) |
|-----|------|------|---------|----------------|
| Basic | Basic | 5 | 2GB | $5/month |
| S0 | Standard | 10 | 250GB | $15/month |
| S1 | Standard | 20 | 250GB | $30/month |
| S2 | Standard | 50 | 250GB | $75/month |
| P1 | Premium | 125 | 500GB | $465/month |
| P2 | Premium | 250 | 500GB | $930/month |

## Post-Deployment Steps

1. **Save Outputs**: Store deployment outputs in secure location
   ```bash
   az deployment group show \
     --resource-group cricket-expense-rg \
     --name azuredeploy \
     --query properties.outputs > deployment-outputs.json
   ```

2. **Configure GitHub Secrets**: Add outputs to GitHub repository secrets (see [CI_CD_SETUP_GUIDE.md](../CI_CD_SETUP_GUIDE.md))

3. **Update CORS Settings**: Add your frontend URL to backend CORS
   ```bash
   az webapp cors add \
     --resource-group cricket-expense-rg \
     --name your-webapp-name \
     --allowed-origins "https://your-static-app.azurestaticapps.net"
   ```

4. **Initialize Database**: Deploy backend application to create database schema

5. **Create Admin User**: SSH into web app and run admin creation script

## Updating the Deployment

To update existing resources:

```bash
# Same command as initial deployment
az deployment group create \
  --resource-group cricket-expense-rg \
  --template-file azuredeploy.json \
  --parameters azuredeploy.parameters.json \
  --parameters \
    sqlAdministratorPassword='YourPassword' \
    jwtSecret='your-secret'
```

ARM templates are idempotent - running again will update changed resources only.

## Cleanup

To delete all resources:

```bash
# Delete entire resource group (CAUTION: This deletes everything!)
az group delete --name cricket-expense-rg --yes --no-wait

# Or delete specific resources
az webapp delete --resource-group cricket-expense-rg --name your-webapp-name
az sql db delete --resource-group cricket-expense-rg --server your-server --name your-db
```

## Customization

### Add Custom Domain

Edit `azuredeploy.json` and add to the Web App resource:

```json
"hostNameSslStates": [
  {
    "name": "api.yourdomain.com",
    "sslState": "SniEnabled",
    "thumbprint": "YOUR_CERT_THUMBPRINT"
  }
]
```

### Add Application Gateway

Add this resource to the template:

```json
{
  "type": "Microsoft.Network/applicationGateways",
  "apiVersion": "2022-07-01",
  "name": "[variables('appGatewayName')]",
  "location": "[parameters('location')]",
  "properties": {
    // Application Gateway configuration
  }
}
```

### Add Azure Key Vault

```json
{
  "type": "Microsoft.KeyVault/vaults",
  "apiVersion": "2022-07-01",
  "name": "[variables('keyVaultName')]",
  "location": "[parameters('location')]",
  "properties": {
    "sku": {
      "family": "A",
      "name": "standard"
    },
    "tenantId": "[subscription().tenantId]"
  }
}
```

## Validation

Validate template before deployment:

```bash
az deployment group validate \
  --resource-group cricket-expense-rg \
  --template-file azuredeploy.json \
  --parameters azuredeploy.parameters.json \
  --parameters \
    sqlAdministratorPassword='Test123!' \
    jwtSecret='test-secret'
```

## What-If Analysis

Preview changes before deploying:

```bash
az deployment group what-if \
  --resource-group cricket-expense-rg \
  --template-file azuredeploy.json \
  --parameters azuredeploy.parameters.json \
  --parameters \
    sqlAdministratorPassword='Test123!' \
    jwtSecret='test-secret'
```

## Troubleshooting

### Deployment Failed

```bash
# Check deployment status
az deployment group show \
  --resource-group cricket-expense-rg \
  --name azuredeploy

# View deployment operations
az deployment operation group list \
  --resource-group cricket-expense-rg \
  --name azuredeploy
```

### Resource Name Conflicts

If resource names already exist, change the `projectName` parameter or use `uniqueString()` function in template.

### Permission Issues

Ensure your Azure account has Contributor role:

```bash
az role assignment list --assignee your-email@domain.com
```

## Best Practices

1. ✅ Use parameters file for environment-specific values
2. ✅ Store secrets in Azure Key Vault
3. ✅ Use managed identities instead of connection strings
4. ✅ Enable diagnostic logging
5. ✅ Tag resources for cost tracking
6. ✅ Use deployment slots for zero-downtime deployments
7. ✅ Implement automated backups for SQL Database
8. ✅ Set up alerts and monitoring

## Additional Resources

- [ARM Template Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)
- [App Service Best Practices](https://docs.microsoft.com/en-us/azure/app-service/app-service-best-practices)
- [Azure SQL Best Practices](https://docs.microsoft.com/en-us/azure/azure-sql/database/best-practices)

---

**Need Help?** Check the [CI_CD_SETUP_GUIDE.md](../CI_CD_SETUP_GUIDE.md) for complete deployment instructions.
