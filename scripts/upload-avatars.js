#!/usr/bin/env node

/**
 * Script wrapper pour uploader les avatars avec les bonnes variables d'environnement
 * Met à jour le fichier seed-data.json avec les URLs S3
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Chemin vers le fichier .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');

// Vérifier si le fichier .env.local existe
if (!fs.existsSync(envLocalPath)) {
  console.error('❌ Erreur: Le fichier .env.local est introuvable!');
  console.error('Créez un fichier .env.local avec les variables AWS suivantes:');
  console.error('AWS_REGION=eu-west-3');
  console.error('AWS_ACCESS_KEY_ID=your_access_key');
  console.error('AWS_SECRET_ACCESS_KEY=your_secret_key');
  console.error('AWS_S3_BUCKET=metacopi-storage');
  process.exit(1);
}

// Charger les variables d'environnement
const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));

// Vérifier les variables AWS requises
const requiredAwsVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
const missingVars = requiredAwsVars.filter(varName => !envConfig[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Erreur: Variables AWS manquantes dans .env.local: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Configuration de l'environnement
const localEnv = {
  ...process.env,
  ...envConfig,
  NODE_ENV: 'development'
};

console.log('🚀 Lancement de l\'upload des avatars...');
console.log(`📁 Bucket S3: ${envConfig.AWS_S3_BUCKET}`);
console.log(`🌍 Région AWS: ${envConfig.AWS_REGION || 'eu-west-3'}`);
console.log('📝 Mise à jour du fichier seed-data.json...');

// Chemin vers le script TypeScript
const scriptPath = path.resolve(__dirname, 'upload-avatars.ts');

// Exécution avec ts-node
const tsNode = spawn('npx', ['ts-node', scriptPath], {
  env: localEnv,
  stdio: 'inherit'
});

tsNode.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Upload des avatars terminé avec succès!');
    console.log('📝 Le fichier seed-data.json a été mis à jour avec les URLs S3');
    console.log('🔄 Vous pouvez maintenant exécuter: npm run seed:local');
  } else {
    console.error(`❌ Upload des avatars échoué avec le code ${code}`);
    process.exit(code);
  }
});
