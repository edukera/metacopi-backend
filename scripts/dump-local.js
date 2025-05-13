#!/usr/bin/env node

/**
 * Script pour exécuter le dump avec les variables d'environnement locales
 * Lit les variables depuis le fichier .env.local
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
  console.error('Créez un fichier .env.local à la racine du projet avec les variables MongoDB suivantes:');
  console.error('MONGODB_URI=mongodb://localhost:27017/metacopi');
  console.error('MONGODB_USER=');
  console.error('MONGODB_PASSWORD=');
  process.exit(1);
}

// Charger les variables d'environnement du fichier .env.local
const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));

// Vérifier que la variable MONGODB_URI existe
if (!envConfig.MONGODB_URI) {
  console.error('❌ Erreur: La variable MONGODB_URI est manquante dans .env.local');
  process.exit(1);
}

// Pour les installations MongoDB locales, l'authentification peut ne pas être activée
// On s'assure donc que MONGODB_USER et MONGODB_PASSWORD existent mais peuvent être vides
if (!('MONGODB_USER' in envConfig)) {
  envConfig.MONGODB_USER = '';
}

if (!('MONGODB_PASSWORD' in envConfig)) {
  envConfig.MONGODB_PASSWORD = '';
}

// Configurations locales depuis .env.local
const localEnv = {
  ...process.env,
  ...envConfig,
  NODE_ENV: 'development'
};

// Récupérer les arguments supplémentaires (comme le chemin du fichier de sortie)
const args = process.argv.slice(2);

console.log('Lancement du dump en environnement local...');
console.log(`MongoDB URI: ${envConfig.MONGODB_URI}`);
console.log(`Authentification: ${envConfig.MONGODB_USER ? 'Activée' : 'Désactivée'}`);

// Exécution de la commande dump avec les arguments supplémentaires
const dumpProcess = spawn('npm', ['run', 'dump', ...args], {
  env: localEnv,
  stdio: 'inherit'
});

dumpProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Dump local terminé avec succès ✅');
  } else {
    console.error(`Dump local échoué avec le code d'erreur ${code} ❌`);
    process.exit(code);
  }
});

dumpProcess.on('error', (err) => {
  console.error(`Une erreur est survenue lors de l'exécution du dump local: ${err.message}`);
  process.exit(1);
}); 