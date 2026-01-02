# GitHub Actions Workflows

This directory contains CI/CD workflows for the Cricket Expense Management Application.

## Workflows

### 1. CI Workflow ([ci.yml](./ci.yml))

**Purpose**: Continuous Integration - automated testing and quality checks

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Backend CI
- Tests on Node.js 18.x and 20.x
- Installs dependencies
- Security vulnerability check (`npm audit`)
- Linting (if configured)
- Unit tests (if configured)
- Code formatting check

#### Frontend CI
- Tests on Node.js 18.x and 20.x
- Installs dependencies
- Security vulnerability check
- Linting (if configured)
- Unit tests
- Production build
- Uploads build artifacts

#### Code Quality
- Checks for TODOs and FIXMEs
- Identifies large files
- Code analysis

#### Security Scan
- Trivy vulnerability scanner
- TruffleHog secret detection

**Status Badge:**
```markdown
![CI](https://github.com/rams4tech/cricketteamexpenseapp/workflows/Continuous%20Integration/badge.svg)
```

---

### 2. Backend CD Workflow ([cd-backend.yml](./cd-backend.yml))

**Purpose**: Continuous Deployment for Node.js backend to Azure Web App

**Triggers:**
- Push to `main` branch (when server files change)
- Manual trigger with environment selection

**Steps:**
1. Checkout code
2. Setup Node.js 18.x
3. Install production dependencies
4. Create .env file
5. Run migrations (if any)
6. Create deployment package
7. Login to Azure
8. Deploy to Azure Web App
9. Configure app settings
10. Restart web app
11. Health check
12. Generate deployment summary

**Required Secrets:**
- `AZURE_CREDENTIALS`
- `AZURE_WEBAPP_NAME`
- `AZURE_RESOURCE_GROUP`
- `AZURE_SQL_SERVER`
- `AZURE_SQL_DATABASE`
- `AZURE_SQL_USER`
- `AZURE_SQL_PASSWORD`
- `JWT_SECRET`
- `APPINSIGHTS_INSTRUMENTATION_KEY`

**Manual Trigger:**
```bash
gh workflow run cd-backend.yml
```

**Status Badge:**
```markdown
![Backend CD](https://github.com/rams4tech/cricketteamexpenseapp/workflows/Backend%20CD%20-%20Deploy%20to%20Azure/badge.svg)
```

---

### 3. Frontend CD Workflow ([cd-frontend.yml](./cd-frontend.yml))

**Purpose**: Continuous Deployment for React frontend to Azure Static Web App

**Triggers:**
- Push to `main` branch (when client files change)
- Manual trigger with environment selection

**Steps:**
1. Checkout code
2. Setup Node.js 18.x
3. Install dependencies
4. Create .env.production
5. Build React application
6. Post-build optimizations
7. Deploy to Azure Static Web App
8. Upload build artifacts

**Required Secrets:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `REACT_APP_API_URL`
- `REACT_APP_APPINSIGHTS_KEY` (optional)

**Alternative Deployment:**
- Includes optional job for Azure Blob Storage deployment
- Set `if: false` to `if: true` to enable

**Manual Trigger:**
```bash
gh workflow run cd-frontend.yml
```

**Status Badge:**
```markdown
![Frontend CD](https://github.com/rams4tech/cricketteamexpenseapp/workflows/Frontend%20CD%20-%20Deploy%20to%20Azure%20Static%20Web%20App/badge.svg)
```

---

## Quick Commands

### View Workflow Status

```bash
# List all workflow runs
gh run list

# List runs for specific workflow
gh run list --workflow=ci.yml

# View specific run details
gh run view <run-id>

# Watch a running workflow
gh run watch

# View logs
gh run view <run-id> --log
```

### Trigger Workflows Manually

```bash
# Trigger CI workflow
gh workflow run ci.yml

# Trigger backend deployment
gh workflow run cd-backend.yml

# Trigger frontend deployment
gh workflow run cd-frontend.yml

# Trigger with environment selection
gh workflow run cd-backend.yml -f environment=staging
```

### Cancel Running Workflow

```bash
# Cancel specific run
gh run cancel <run-id>

# Cancel latest run of a workflow
gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId' | xargs gh run cancel
```

### Re-run Failed Workflow

```bash
# Re-run a failed workflow
gh run rerun <run-id>

# Re-run only failed jobs
gh run rerun <run-id> --failed
```

---

## Workflow Customization

### Add Environment Variables

Edit the workflow file and add to `env:` section:

```yaml
env:
  NODE_ENV: production
  CUSTOM_VAR: value
```

### Add Deployment Slot

For staging deployments, add slot parameter:

```yaml
- name: Deploy to Azure Web App
  uses: azure/webapps-deploy@v2
  with:
    app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
    slot-name: staging  # Add this
    package: ./server/deploy.zip
```

### Add Approval Gates

Create an environment in GitHub settings, then reference it:

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: ${{ steps.deploy.outputs.webapp-url }}
```

### Add Slack Notifications

Add this step to any job:

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

---

## Monitoring Workflows

### GitHub Actions Dashboard

View all workflows at:
```
https://github.com/rams4tech/cricketteamexpenseapp/actions
```

### Status Badges

Add to README.md:

```markdown
## Build Status

![CI](https://github.com/rams4tech/cricketteamexpenseapp/workflows/Continuous%20Integration/badge.svg)
![Backend CD](https://github.com/rams4tech/cricketteamexpenseapp/workflows/Backend%20CD%20-%20Deploy%20to%20Azure/badge.svg)
![Frontend CD](https://github.com/rams4tech/cricketteamexpenseapp/workflows/Frontend%20CD%20-%20Deploy%20to%20Azure%20Static%20Web%20App/badge.svg)
```

### Webhook Notifications

Configure webhooks in repository settings:
- Settings → Webhooks → Add webhook
- Payload URL: Your monitoring service
- Content type: application/json
- Events: Workflow runs

---

## Troubleshooting

### Workflow Not Triggering

**Check:**
1. Workflow file is in `.github/workflows/`
2. YAML syntax is valid
3. Branch names match trigger conditions
4. File paths match (for path filters)

**Validate YAML:**
```bash
# Use GitHub CLI
gh workflow view ci.yml

# Or check workflow status
gh workflow list
```

### Secrets Not Working

**Solutions:**
1. Verify secret names match exactly (case-sensitive)
2. Re-create the secret
3. Check secret is available in repository settings
4. Ensure workflow has permission to access secrets

### Deployment Fails

**Common Issues:**

1. **Azure Login Failed**
   - Re-create service principal
   - Update AZURE_CREDENTIALS secret

2. **Package Not Found**
   - Check zip file creation step
   - Verify working directory

3. **App Settings Not Applied**
   - Check secret values are correct
   - Verify Azure CLI version

### Permission Denied

Add permissions to workflow:

```yaml
permissions:
  contents: read
  deployments: write
  statuses: write
```

---

## Best Practices

1. ✅ **Use Secrets for Sensitive Data**
   - Never hardcode credentials
   - Use GitHub Secrets for all sensitive values

2. ✅ **Test Locally First**
   - Test build/deploy scripts locally
   - Use `act` to test workflows locally

3. ✅ **Use Caching**
   - Cache npm dependencies
   - Reduces build time

4. ✅ **Fail Fast**
   - Run tests before deployment
   - Use `continue-on-error: false` for critical steps

5. ✅ **Separate Environments**
   - Use different workflows or environments for dev/staging/prod
   - Implement approval gates for production

6. ✅ **Monitor Workflow Usage**
   - GitHub Actions has usage limits
   - Monitor in Settings → Billing

7. ✅ **Keep Workflows Updated**
   - Update action versions regularly
   - Test changes in feature branches

---

## Workflow Limits

### GitHub Actions (Free Tier)
- **Minutes/month**: 2,000 (public repos: unlimited)
- **Storage**: 500 MB
- **Concurrent jobs**: 20

### Azure Static Web Apps (Free Tier)
- **Bandwidth**: 100 GB/month
- **Apps**: Unlimited
- **Custom domains**: Limited

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Web Apps Deploy Action](https://github.com/Azure/webapps-deploy)
- [Azure Static Web Apps Deploy Action](https://github.com/Azure/static-web-apps-deploy)
- [GitHub CLI Documentation](https://cli.github.com/manual/)

---

**For complete setup instructions**, see [CI_CD_SETUP_GUIDE.md](../../CI_CD_SETUP_GUIDE.md)
