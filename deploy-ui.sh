#!/bin/bash

set -e

echo "🔧 Building UI with Vite..."
cd ./metacopi-ui
npm run build

echo "🚀 Uploading dist/ to metacopi-prod:/home/ubuntu/ui ..."
scp -r ./dist metacopi-prod:/home/ubuntu/ui

echo "✅ UI deployed successfully!"
