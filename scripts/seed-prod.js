#!/usr/bin/env node

/**
 * Script pour exécuter le seeding avec les variables d'environnement de production
 * Lit les variables depuis le fichier .env.prod
 */

// Chemin vers le fichier seed.ts pour l'exécution avec ts-node
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Chemin vers le fichier .env.prod
const envProdPath = path.resolve(process.cwd(), '.env.prod');

// Vérifier si le fichier .env.prod existe
if (!fs.existsSync(envProdPath)) {
  console.error('❌ Erreur: Le fichier .env.prod est introuvable!');
  console.error('Créez un fichier .env.prod à la racine du projet avec les variables MongoDB suivantes:');
  console.error('MONGODB_URI=mongodb://your-prod-host:27017/metacopi');
  console.error('MONGODB_USER=your-prod-username');
  console.error('MONGODB_PASSWORD=your-prod-password');
  process.exit(1);
}

// Charger les variables d'environnement du fichier .env.prod
const envConfig = dotenv.parse(fs.readFileSync(envProdPath));

// Vérifier que les variables requises existent
const requiredVars = ['MONGODB_URI', 'MONGODB_USER', 'MONGODB_PASSWORD'];
const missingVars = requiredVars.filter(varName => !envConfig[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Erreur: Variables manquantes dans .env.prod: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Configurations de production depuis .env.prod
const prodEnv = {
  ...process.env,
  ...envConfig,
  NODE_ENV: 'production'
};

console.log('Lancement du seeding en environnement de production...');

// Chemin vers le script seed.ts relatif à la racine du projet
const seedPath = path.resolve(__dirname, '../src/seed.ts');

// Exécution du script avec ts-node
const tsNode = spawn('npx', ['ts-node', seedPath], {
  env: prodEnv,
  stdio: 'inherit'
});

tsNode.on('close', (code) => {
  if (code === 0) {
    console.log('Seeding en production terminé avec succès ✅');
  } else {
    console.error(`Seeding en production échoué avec le code d'erreur ${code} ❌`);
    process.exit(code);
  }
}); 