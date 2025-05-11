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

// Génère un ID d'annotation IA unique basé sur un timestamp
function generateAIAnnotationId() {
  return `AIANN-${Date.now()}`;
}

// Création d'une valeur d'annotation IA valide (JSON sérialisé)
function createAIAnnotationValue(text = 'Suggestion IA: Améliorer la structure', x = 150, y = 200) {
  const obj = {
    type: 'text',
    content: text,
    position: { x, y }
  };
  return JSON.stringify(obj);
}

async function main() {
  try {
    console.log('Tentative de connexion avec Jean Dupont...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    const token = loginResponse.data.access_token;
    if (!token) throw new Error('Pas de token reçu dans la réponse de connexion');
    console.log('Connexion réussie! Token JWT reçu.');
    const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    // 1. Créer une annotation IA
    const aiAnnotationId = generateAIAnnotationId();
    const createPayload = {
      id: aiAnnotationId,
      pageId: 'p1',
      value: createAIAnnotationValue(),
      createdByEmail: 'ai-system@metacopi.com'
    };
    
    console.log(`Création d'une annotation IA sur la correction ${TEST_CORRECTION_ID}...`);
    const createRes = await axios.post(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-annotations`, createPayload, authHeaders);
    const createdAIAnnotation = createRes.data;
    console.log('Annotation IA créée:', createdAIAnnotation);
    if (createdAIAnnotation.id !== aiAnnotationId) throw new Error('L\'ID retourné ne correspond pas à celui envoyé');

    // 2. Récupérer toutes les annotations IA de la correction
    console.log(`Récupération de toutes les annotations IA pour la correction ${TEST_CORRECTION_ID}...`);
    const getAllRes = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-annotations`, authHeaders);
    console.log(`${getAllRes.data.length} annotations IA trouvées pour cette correction`);
    
    // Vérifier que notre annotation IA créée est dans la liste
    const foundInList = getAllRes.data.some(ann => ann.id === aiAnnotationId);
    if (foundInList) {
      console.log('✅ L\'annotation IA créée est bien présente dans la liste');
    } else {
      console.error('❌ L\'annotation IA créée n\'est pas retrouvée dans la liste des annotations IA');
    }

    // 3. Récupérer cette annotation IA spécifique
    console.log(`Récupération de l'annotation IA ${aiAnnotationId}...`);
    const getRes = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-annotations/${aiAnnotationId}`, authHeaders);
    console.log('Annotation IA récupérée:', getRes.data);

    // 4. Mettre à jour cette annotation IA
    const updatePayload = {
      value: createAIAnnotationValue('IA: Suggestion améliorée et plus précise', 200, 250)
    };
    console.log(`Mise à jour de l'annotation IA ${aiAnnotationId}...`);
    const updateRes = await axios.patch(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-annotations/${aiAnnotationId}`, updatePayload, authHeaders);
    console.log('Annotation IA après mise à jour:', updateRes.data);

    // 5. Récupérer à nouveau pour vérifier la mise à jour
    console.log(`Récupération de l'annotation IA ${aiAnnotationId} après mise à jour...`);
    const getAfterUpdateRes = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-annotations/${aiAnnotationId}`, authHeaders);
    console.log('Annotation IA récupérée après mise à jour:', getAfterUpdateRes.data);

    // Vérification de la mise à jour
    const updatedValue = JSON.parse(getAfterUpdateRes.data.value);
    if (updatedValue.content === 'IA: Suggestion améliorée et plus précise') {
      console.log('✅ Mise à jour vérifiée avec succès !');
    } else {
      console.error('❌ La mise à jour de l\'annotation IA n\'a pas été prise en compte.');
    }

    // 6. Supprimer l'annotation IA
    console.log(`Suppression de l'annotation IA ${aiAnnotationId}...`);
    await axios.delete(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-annotations/${aiAnnotationId}`, authHeaders);
    console.log('✅ Annotation IA supprimée avec succès (statut HTTP 204)');

    // 7. Tenter de récupérer l'annotation IA supprimée pour vérifier qu'elle n'existe plus
    try {
      console.log(`Tentative de récupération de l'annotation IA supprimée ${aiAnnotationId}...`);
      await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/ai-annotations/${aiAnnotationId}`, authHeaders);
      console.error('❌ L\'annotation IA existe toujours après suppression !');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Vérification de suppression réussie : l\'annotation IA n\'existe plus (erreur 404)');
      } else {
        throw error; // Si c'est une autre erreur, la propager
      }
    }

    console.log('🎉 Tous les tests sur les annotations IA sont terminés avec succès !');
    
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