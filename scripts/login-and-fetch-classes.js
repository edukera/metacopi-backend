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
    
    // 2. Utiliser le token pour faire une requête GET à /classes
    console.log('Récupération des classes...');
    const classesResponse = await axios.get(`${API_BASE_URL}/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 3. Afficher le résultat
    console.log('Classes récupérées avec succès:');
    console.log(JSON.stringify(classesResponse.data, null, 2));
    
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