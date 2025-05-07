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
    
    // 5. Extraire l'ID de la première tâche trouvée
    if (!tasksResponse.data || !tasksResponse.data.length) {
      throw new Error('Aucune tâche trouvée pour cette classe');
    }
    
    const firstTask = tasksResponse.data[0];
    const taskId = firstTask._id || firstTask.id;
    
    if (!taskId) {
      throw new Error('Impossible de trouver l\'ID de la tâche');
    }
    
    console.log(`\nID de la première tâche: ${taskId}`);
    
    // 6. Récupérer les soumissions associées à cette tâche
    console.log(`\nRécupération des soumissions pour la tâche "${firstTask.title}" (ID: ${taskId})...`);
    const submissionsResponse = await axios.get(`${API_BASE_URL}/submissions?taskId=${taskId}`, authHeaders);
    
    // Afficher les soumissions récupérées
    console.log('Soumissions récupérées avec succès:');
    console.log(JSON.stringify(submissionsResponse.data, null, 2));
    
    // Afficher un résumé
    const submissionsCount = submissionsResponse.data.length || 0;
    console.log(`\nRésumé: ${submissionsCount} soumission(s) trouvée(s) pour la tâche "${firstTask.title}" dans la classe "${firstClass.name}"`);
    
    // Si nous avons des soumissions, récupérons la première pour voir les URLs des pages
    if (submissionsCount > 0) {
      const firstSubmission = submissionsResponse.data[0];
      const submissionId = firstSubmission._id || firstSubmission.id;
      
      console.log(`\nRécupération des détails de la soumission avec les URLs des pages pour l'ID: ${submissionId}...`);
      try {
        const submissionDetailsResponse = await axios.get(`${API_BASE_URL}/submissions/${submissionId}`, authHeaders);
        
        // Afficher les URLs des pages s'ils existent
        if (submissionDetailsResponse.data.pageUrls && submissionDetailsResponse.data.pageUrls.length > 0) {
          console.log(`\nURLs des pages de la soumission (${submissionDetailsResponse.data.pageUrls.length} pages):`);
          submissionDetailsResponse.data.pageUrls.forEach((url, index) => {
            console.log(`Page ${index + 1}: ${url}`);
          });
        } else {
          console.log('\nAucune URL de page trouvée dans la réponse de soumission.');
        }
      } catch (submissionDetailsError) {
        console.error(`Erreur lors de la récupération des détails de la soumission ${submissionId}:`, 
          submissionDetailsError.message);
        
        if (submissionDetailsError.response) {
          console.error('Détails:', {
            status: submissionDetailsError.response.status,
            data: submissionDetailsError.response.data
          });
        }
      }
    }
    
    // 7. Récupérer les corrections associées à chaque soumission
    console.log('\n--- Récupération des corrections pour chaque soumission ---');
    
    if (submissionsCount > 0) {
      for (const submission of submissionsResponse.data) {
        const submissionId = submission._id || submission.id;
        
        if (!submissionId) {
          console.warn(`Avertissement: ID manquant pour une soumission, impossible de récupérer ses corrections`);
          continue;
        }
        
        console.log(`\nRécupération des corrections pour la soumission ID: ${submissionId}...`);
        try {
          const correctionResponse = await axios.get(`${API_BASE_URL}/corrections/submission/${submissionId}`, authHeaders);
          
          console.log(`Corrections récupérées avec succès pour la soumission ${submissionId}:`);
          console.log(JSON.stringify(correctionResponse.data, null, 2));
          
          // 8. Récupérer les commentaires pour chaque correction
          const correction = correctionResponse.data;
          const correctionId = correction._id || correction.id;
          
          if (correctionId) {
            console.log(`\nRécupération des commentaires pour la correction ID: ${correctionId}...`);
            try {
              const commentsResponse = await axios.get(`${API_BASE_URL}/corrections/${correctionId}/comments`, authHeaders);
              
              const commentsCount = commentsResponse.data.length || 0;
              console.log(`${commentsCount} commentaire(s) récupéré(s) avec succès pour la correction ${correctionId}:`);
              console.log(JSON.stringify(commentsResponse.data, null, 2));
            } catch (commentsError) {
              console.error(`Erreur lors de la récupération des commentaires pour la correction ${correctionId}:`, 
                commentsError.message);
              
              if (commentsError.response) {
                console.error('Détails:', {
                  status: commentsError.response.status,
                  data: commentsError.response.data
                });
              }
            }
            
            // 9. Récupérer les annotations pour chaque correction
            console.log(`\nRécupération des annotations pour la correction ID: ${correctionId}...`);
            try {
              const annotationsResponse = await axios.get(`${API_BASE_URL}/corrections/${correctionId}/annotations`, authHeaders);
              
              const annotationsCount = annotationsResponse.data.length || 0;
              console.log(`${annotationsCount} annotation(s) récupérée(s) avec succès pour la correction ${correctionId}:`);
              console.log(JSON.stringify(annotationsResponse.data, null, 2));
            } catch (annotationsError) {
              console.error(`Erreur lors de la récupération des annotations pour la correction ${correctionId}:`, 
                annotationsError.message);
              
              if (annotationsError.response) {
                console.error('Détails:', {
                  status: annotationsError.response.status,
                  data: annotationsError.response.data
                });
              }
            }
          }
        } catch (correctionError) {
          console.error(`Erreur lors de la récupération des corrections pour la soumission ${submissionId}:`, 
            correctionError.message);
          
          if (correctionError.response) {
            console.error('Détails:', {
              status: correctionError.response.status,
              data: correctionError.response.data
            });
          }
        }
      }
    } else {
      console.log('Aucune soumission trouvée, donc aucune correction à récupérer.');
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