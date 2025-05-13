/**
 * Script pour exécuter le processus de dump avec les variables d'environnement de production
 * Charge les variables d'environnement depuis .env.prod et lance npm run dump
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Chemin vers le fichier .env.prod
const envFilePath = path.resolve(process.cwd(), '.env.prod');

// Vérifier si le fichier .env.prod existe
if (!fs.existsSync(envFilePath)) {
  console.error(`Le fichier ${envFilePath} n'existe pas. Veuillez créer ce fichier avec les variables d'environnement de production.`);
  process.exit(1);
}

// Charger les variables d'environnement depuis .env.prod
const productionEnv = dotenv.parse(fs.readFileSync(envFilePath));

// Récupérer les arguments supplémentaires (comme le chemin du fichier de sortie)
const args = process.argv.slice(2);

// Définir la commande à exécuter
const command = 'npm';
const commandArgs = ['run', 'dump', ...args];

// Lancer le processus de dump avec les variables d'environnement de production
const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ...productionEnv,
  },
});

// Gérer la fin du processus
child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Le processus de dump a échoué avec le code ${code}`);
    process.exit(code);
  }
  
  console.log('Le processus de dump a été exécuté avec succès!');
  process.exit(0);
});

// Gérer les erreurs
child.on('error', (err) => {
  console.error(`Une erreur est survenue lors de l'exécution du processus de dump: ${err.message}`);
  process.exit(1);
}); 