#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

// Enum pour le statut (doit correspondre à celui défini dans le code TypeScript)
const AICommentStatus = {
  VALIDATED: 'validated',
  REJECTED: 'rejected',
  PENDING: 'pending'
};

// URL de connexion MongoDB (de .env ou valeur par défaut)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/metacopi';

async function updateAIComments() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connexion établie avec succès!');

    // Référence à la collection AIComment
    const AICommentCollection = mongoose.connection.collection('aicomments');

    // Mise à jour de tous les documents sans champ 'status'
    const result = await AICommentCollection.updateMany(
      { status: { $exists: false } }, // Filtrer les documents sans champ status
      { $set: { status: AICommentStatus.PENDING } } // Ajouter le champ avec valeur par défaut
    );

    console.log(`Migration terminée avec succès.`);
    console.log(`${result.modifiedCount} documents AI Comment mis à jour avec le statut 'pending'.`);
    console.log(`${result.matchedCount} documents correspondaient au critère.`);

  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    // Fermer la connexion à MongoDB
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB.');
  }
}

// Exécuter la fonction principale
updateAIComments(); 