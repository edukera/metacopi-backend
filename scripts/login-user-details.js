#!/usr/bin/env node

const axios = require('axios');

// Informations d'identification pour Jean Dupont (extraites de seed-data.json)
const credentials = {
  email: 'jean.dupont@monlycee.net',
  password: 'Teacher123!'
};

// URL de base de l'API (à ajuster selon votre environnement)
const API_BASE_URL = 'http://localhost:3002';

// L'utilisateur cible à rechercher
const targetUserEmail = 'alice.gribouille@monlycee.net';

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
    
    // 2. Chercher d'abord l'utilisateur par email pour obtenir son ID
    console.log(`Recherche de l'utilisateur avec l'email: ${targetUserEmail}...`);
    
    try {
      // Récupérer tous les utilisateurs et filtrer pour trouver celui avec l'email cible
      const usersResponse = await axios.get(`${API_BASE_URL}/users`, authHeaders);
      
      const targetUser = usersResponse.data.find(user => user.email === targetUserEmail);
      
      if (!targetUser) {
        throw new Error(`Aucun utilisateur trouvé avec l'email ${targetUserEmail}`);
      }
      
      const userId = targetUser._id || targetUser.id;
      
      console.log(`Utilisateur trouvé! ID: ${userId}`);
      
      // 3. Utiliser l'ID pour récupérer les détails complets de l'utilisateur
      console.log(`\nRécupération des détails complets pour l'utilisateur ID: ${userId}...`);
      
      const userDetailsResponse = await axios.get(`${API_BASE_URL}/users/${userId}`, authHeaders);
      
      console.log('Détails de l\'utilisateur récupérés avec succès:');
      console.log(JSON.stringify(userDetailsResponse.data, null, 2));
      
      // 4. Récupérer les classes auxquelles l'utilisateur appartient
      console.log(`\nRécupération des classes de l'utilisateur ${targetUserEmail}...`);
      
      const userClassesResponse = await axios.get(`${API_BASE_URL}/users/${userId}/classes`, authHeaders);
      
      console.log('Classes de l\'utilisateur récupérées avec succès:');
      console.log(JSON.stringify(userClassesResponse.data, null, 2));
      
      // Afficher un résumé
      const classesCount = userClassesResponse.data.length || 0;
      console.log(`\nRésumé: ${targetUserEmail} appartient à ${classesCount} classe(s)`);
      
      // 5. Si l'utilisateur est un élève, récupérer ses soumissions
      if (targetUser.role === 'student') {
        console.log(`\nRécupération des soumissions de l'élève ${targetUserEmail}...`);
        
        try {
          const submissionsResponse = await axios.get(`${API_BASE_URL}/submissions?userId=${userId}`, authHeaders);
          
          console.log('Soumissions récupérées avec succès:');
          console.log(JSON.stringify(submissionsResponse.data, null, 2));
          
          const submissionsCount = submissionsResponse.data.length || 0;
          console.log(`\nRésumé: ${submissionsCount} soumission(s) trouvée(s) pour l'élève ${targetUserEmail}`);
        } catch (submissionsError) {
          console.error(`Erreur lors de la récupération des soumissions de l'élève:`, 
            submissionsError.message);
          
          if (submissionsError.response) {
            console.error('Détails:', {
              status: submissionsError.response.status,
              data: submissionsError.response.data
            });
          }
        }
      }
      
    } catch (userError) {
      console.error(`Erreur lors de la recherche de l'utilisateur:`, userError.message);
      
      if (userError.response) {
        console.error('Détails:', {
          status: userError.response.status,
          data: userError.response.data
        });
      }
    }
    
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