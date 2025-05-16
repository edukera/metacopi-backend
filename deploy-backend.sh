#!/bin/bash

set -e

REMOTE_HOST="metacopi-prod"
REMOTE_PATH="/home/ubuntu/metacopi-backend"

echo "🔧 Building backend locally (without env)..."
npm run build

echo "🚀 Syncing dist/, package files, and .env.prod to $REMOTE_HOST:$REMOTE_PATH ..."
scp -r ./dist package.json package-lock.json .env.prod "$REMOTE_HOST:$REMOTE_PATH"

echo "🔁 Restarting backend with pm2 (process 0)..."
ssh "$REMOTE_HOST" bash -c "'
  cd $REMOTE_PATH
  mv .env.prod .env  # Optional: rename to .env if needed by your app
  source ~/.nvm/nvm.sh
  npm install --production
  pm2 restart 0
'"

echo "✅ Backend deployed and restarted successfully!"
