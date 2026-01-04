#!/bin/bash

# Deployment script for Azure Web App
set -e

echo "Starting deployment..."

# Navigate to deployment target
cd /home/site/wwwroot

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --production

echo "Deployment completed successfully!"
