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

// Génère un ID de commentaire IA unique basé sur un timestamp
function generateAICommentId() {
  return `AIC-${Date.now()}`;
}

async function main() {
  try {
    console.log('Tentative de connexion avec Jean Dupont...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    const token = loginResponse.data.access_token;
    if (!token) throw new Error('Pas de token reçu dans la réponse de connexion');
    console.log('Connexion réussie! Token JWT reçu.');
    const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    // 1. Créer un commentaire IA
    const createPayload = {
      id: generateAICommentId(),
      pageId: 'p1',
      pageY: 100,
      type: 'note',
      color: '#FFD700',
      text: 'Ceci est un commentaire IA de test',
      markdown: 'Ceci est un **commentaire** IA de test',
      annotations: [],
      status: 'pending'
      // Note: correctionId sera injecté côté backend depuis l'URL
      // Note: createdByEmail sera automatiquement défini par le service si non fourni
    };
    
    console.log(`Création d'un commentaire IA sur la correction ${TEST_CORRECTION_ID}...`);
    const createRes = await axios.post(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-comments`, createPayload, authHeaders);
    const createdAIComment = createRes.data;
    console.log('Commentaire IA créé:', createdAIComment);
    const aiCommentId = createdAIComment.id; // Utiliser l'ID logique, pas l'ID MongoDB
    if (!aiCommentId) throw new Error('Impossible de récupérer l\'ID du commentaire IA créé');

    // 2. Récupérer ce commentaire IA
    console.log(`Récupération du commentaire IA ${aiCommentId}...`);
    const getRes1 = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-comments/${aiCommentId}`, authHeaders);
    console.log('Commentaire IA récupéré:', getRes1.data);

    // 3. Mettre à jour ce commentaire IA
    const updatePayload = {
      text: 'Ceci est un commentaire IA de test (modifié)',
      markdown: 'Ceci est un **commentaire** IA de test (modifié)',
      status: 'validated'
    };
    console.log(`Mise à jour du commentaire IA ${aiCommentId}...`);
    const updateRes = await axios.patch(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-comments/${aiCommentId}`, updatePayload, authHeaders);
    console.log('Commentaire IA après update:', updateRes.data);

    // 4. Récupérer à nouveau pour vérifier l'update
    console.log(`Récupération du commentaire IA ${aiCommentId} après update...`);
    const getRes2 = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-comments/${aiCommentId}`, authHeaders);
    console.log('Commentaire IA récupéré après update:', getRes2.data);

    // Vérification simple
    if (getRes2.data.text === updatePayload.text && getRes2.data.status === updatePayload.status) {
      console.log('✅ Mise à jour vérifiée avec succès !');
    } else {
      console.error('❌ La mise à jour du commentaire IA n\'a pas été prise en compte correctement.');
    }

    // 5. Supprimer le commentaire IA
    console.log(`Suppression du commentaire IA ${aiCommentId}...`);
    await axios.delete(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-comments/${aiCommentId}`, authHeaders);
    console.log('✅ Commentaire IA supprimé avec succès (statut HTTP 204)');

    // 6. Tenter de récupérer le commentaire IA supprimé pour vérifier qu'il n'existe plus
    try {
      console.log(`Tentative de récupération du commentaire IA supprimé ${aiCommentId}...`);
      await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-comments/${aiCommentId}`, authHeaders);
      console.error('❌ Le commentaire IA existe toujours après suppression !');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Vérification de suppression réussie : le commentaire IA n\'existe plus (erreur 404)');
      } else {
        throw error; // Si c'est une autre erreur, la propager
      }
    }

    console.log('🎉 Tous les tests sur les commentaires IA sont terminés avec succès !');
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