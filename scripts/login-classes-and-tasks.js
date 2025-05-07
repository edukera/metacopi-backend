#!/usr/bin/env node

const axios = require('axios');

// Informations d'identification pour Jean Dupont (extraites de seed-data.json)
const credentials = {
  email: 'jean.dupont@monlycee.net',
  password: 'Teacher123!'
};

// URL de base de l'API (à ajuster selon votre environnement)
const API_BASE_URL = 'http://localhost:3002'; 

// Fonction principale
async function main() {
  try {
    console.log('Tentative de connexion avec Jean Dupont...');
    
    // 1. Se connecter et récupérer le token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    const token = loginResponse.data.access_token;
    
    if (!token) {
      throw new Error('Pas de token reçu dans la réponse de connexion');
    }
    
    console.log('Connexion réussie! Token JWT reçu.');
    
    // Configuration des en-têtes avec le token pour les futures requêtes
    const authHeaders = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // 2. Utiliser le token pour faire une requête GET à /classes
    console.log('Récupération des classes...');
    const classesResponse = await axios.get(`${API_BASE_URL}/classes`, authHeaders);
    
    // Afficher les classes récupérées
    console.log('Classes récupérées avec succès:');
    console.log(JSON.stringify(classesResponse.data, null, 2));
    
    // 3. Extraire l'ID de la première classe trouvée
    if (!classesResponse.data || !classesResponse.data.length) {
      throw new Error('Aucune classe trouvée');
    }
    
    const firstClass = classesResponse.data[0];
    const classId = firstClass._id || firstClass.id;
    
    if (!classId) {
      throw new Error('Impossible de trouver l\'ID de la classe');
    }
    
    console.log(`\nID de la première classe: ${classId}`);
    
    // 4. Récupérer les tâches associées à cette classe
    console.log(`\nRécupération des tâches pour la classe "${firstClass.name}" (ID: ${classId})...`);
    const tasksResponse = await axios.get(`${API_BASE_URL}/tasks?classId=${classId}`, authHeaders);
    
    // Afficher les tâches récupérées
    console.log('Tâches récupérées avec succès:');
    console.log(JSON.stringify(tasksResponse.data, null, 2));
    
  } catch (error) {
    console.error('Erreur:', error.message);
    
    // Afficher plus de détails sur l'erreur si disponibles
    if (error.response) {
      console.error('Détails de l\'erreur:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Exécuter la fonction principale
main(); 