#!/usr/bin/env node

const axios = require('axios');

// Informations d'identification pour Jean Dupont (extraites de seed-data.json)
const credentials = {
  email: 'jean.dupont@monlycee.net',
  password: 'Teacher123!'
};

// URL de base de l'API (à ajuster selon votre environnement)
const API_BASE_URL = 'http://localhost:3002';

// ID de correction à utiliser pour le test (à adapter si besoin)
const TEST_CORRECTION_ID = process.env.TEST_CORRECTION_ID || 'cor_alice_gribouille_ds_8_2025_05_12_by_jean_dupont';

// Génère un ID de commentaire unique basé sur un timestamp
function generateCommentId() {
  return `COMM-${Date.now()}`;
}

async function main() {
  try {
    console.log('Tentative de connexion avec Jean Dupont...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    const token = loginResponse.data.access_token;
    if (!token) throw new Error('Pas de token reçu dans la réponse de connexion');
    console.log('Connexion réussie! Token JWT reçu.');
    const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    // 1. Créer un commentaire
    const createPayload = {
      id: generateCommentId(),
      pageId: 'p1',
      pageY: 100,
      type: 'note',
      color: '#FFD700',
      text: 'Ceci est un commentaire de test',
      markdown: 'Ceci est un **commentaire** de test',
      annotations: []
      // Note: correctionId sera injecté côté backend depuis l'URL
      // Note: createdByEmail sera automatiquement défini par le service si non fourni
    };
    
    console.log(`Création d'un commentaire sur la correction ${TEST_CORRECTION_ID}...`);
    const createRes = await axios.post(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/comments`, createPayload, authHeaders);
    const createdComment = createRes.data;
    console.log('Commentaire créé:', createdComment);
    const commentId = createdComment.id; // Utiliser l'ID logique, pas l'ID MongoDB
    if (!commentId) throw new Error('Impossible de récupérer l\'ID du commentaire créé');

    // 2. Récupérer ce commentaire
    console.log(`Récupération du commentaire ${commentId}...`);
    const getRes1 = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/comments/${commentId}`, authHeaders);
    console.log('Commentaire récupéré:', getRes1.data);

    // 3. Mettre à jour ce commentaire
    const updatePayload = {
      text: 'Ceci est un commentaire de test (modifié)',
      markdown: 'Ceci est un **commentaire** de test (modifié)'
    };
    console.log(`Mise à jour du commentaire ${commentId}...`);
    const updateRes = await axios.patch(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/comments/${commentId}`, updatePayload, authHeaders);
    console.log('Commentaire après update:', updateRes.data);

    // 4. Récupérer à nouveau pour vérifier l'update
    console.log(`Récupération du commentaire ${commentId} après update...`);
    const getRes2 = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/comments/${commentId}`, authHeaders);
    console.log('Commentaire récupéré après update:', getRes2.data);

    // Vérification simple
    if (getRes2.data.text === updatePayload.text) {
      console.log('✅ Mise à jour vérifiée avec succès !');
    } else {
      console.error('❌ La mise à jour du commentaire n\'a pas été prise en compte.');
    }

    // 5. Supprimer le commentaire
    console.log(`Suppression du commentaire ${commentId}...`);
    await axios.delete(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/comments/${commentId}`, authHeaders);
    console.log('✅ Commentaire supprimé avec succès (statut HTTP 204)');

    // 6. Tenter de récupérer le commentaire supprimé pour vérifier qu'il n'existe plus
    try {
      console.log(`Tentative de récupération du commentaire supprimé ${commentId}...`);
      await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/comments/${commentId}`, authHeaders);
      console.error('❌ Le commentaire existe toujours après suppression !');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Vérification de suppression réussie : le commentaire n\'existe plus (erreur 404)');
      } else {
        throw error; // Si c'est une autre erreur, la propager
      }
    }
  } catch (error) {
    console.error('Erreur:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

main(); 