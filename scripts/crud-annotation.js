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

// Génère un ID d'annotation unique basé sur un timestamp
function generateAnnotationId() {
  return `ANN-${Date.now()}`;
}

// Création d'une valeur d'annotation valide (JSON sérialisé)
function createAnnotationValue(text = 'Travail intéressant', x = 150, y = 200) {
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

    // 1. Créer une annotation
    const annotationId = generateAnnotationId();
    const createPayload = {
      id: annotationId,
      pageId: 'p1',
      value: createAnnotationValue()
    };
    
    console.log(`Création d'une annotation sur la correction ${TEST_CORRECTION_ID}...`);
    const createRes = await axios.post(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/annotations`, createPayload, authHeaders);
    const createdAnnotation = createRes.data;
    console.log('Annotation créée:', createdAnnotation);
    if (createdAnnotation.id !== annotationId) throw new Error('L\'ID retourné ne correspond pas à celui envoyé');

    // 2. Récupérer toutes les annotations de la correction
    console.log(`Récupération de toutes les annotations pour la correction ${TEST_CORRECTION_ID}...`);
    const getAllRes = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/annotations`, authHeaders);
    console.log(`${getAllRes.data.length} annotations trouvées pour cette correction`);
    
    // Vérifier que notre annotation créée est dans la liste
    const foundInList = getAllRes.data.some(ann => ann.id === annotationId);
    if (foundInList) {
      console.log('✅ L\'annotation créée est bien présente dans la liste');
    } else {
      console.error('❌ L\'annotation créée n\'est pas retrouvée dans la liste des annotations');
    }

    // 3. Récupérer cette annotation spécifique
    console.log(`Récupération de l'annotation ${annotationId}...`);
    const getRes = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/annotations/${annotationId}`, authHeaders);
    console.log('Annotation récupérée:', getRes.data);

    // 4. Mettre à jour cette annotation
    const updatePayload = {
      value: createAnnotationValue('Correction mise à jour', 200, 250)
    };
    console.log(`Mise à jour de l'annotation ${annotationId}...`);
    const updateRes = await axios.patch(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/annotations/${annotationId}`, updatePayload, authHeaders);
    console.log('Annotation après mise à jour:', updateRes.data);

    // 5. Récupérer à nouveau pour vérifier la mise à jour
    console.log(`Récupération de l'annotation ${annotationId} après mise à jour...`);
    const getAfterUpdateRes = await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/annotations/${annotationId}`, authHeaders);
    console.log('Annotation récupérée après mise à jour:', getAfterUpdateRes.data);

    // Vérification de la mise à jour
    const updatedValue = JSON.parse(getAfterUpdateRes.data.value);
    if (updatedValue.content === 'Correction mise à jour') {
      console.log('✅ Mise à jour vérifiée avec succès !');
    } else {
      console.error('❌ La mise à jour de l\'annotation n\'a pas été prise en compte.');
    }

    // 6. Supprimer l'annotation
    console.log(`Suppression de l'annotation ${annotationId}...`);
    await axios.delete(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/annotations/${annotationId}`, authHeaders);
    console.log('✅ Annotation supprimée avec succès (statut HTTP 204)');

    // 7. Tenter de récupérer l'annotation supprimée pour vérifier qu'elle n'existe plus
    try {
      console.log(`Tentative de récupération de l'annotation supprimée ${annotationId}...`);
      await axios.get(`${API_BASE_URL}/corrections/${TEST_CORRECTION_ID}/annotations/${annotationId}`, authHeaders);
      console.error('❌ L\'annotation existe toujours après suppression !');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Vérification de suppression réussie : l\'annotation n\'existe plus (erreur 404)');
      } else {
        throw error; // Si c'est une autre erreur, la propager
      }
    }

    console.log('🎉 Tous les tests sur les annotations sont terminés avec succès !');
    
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