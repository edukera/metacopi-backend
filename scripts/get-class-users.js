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
    
    // 2. Récupérer les classes de l'enseignant
    console.log('Récupération des classes...');
    const classesResponse = await axios.get(`${API_BASE_URL}/classes`, authHeaders);
    
    if (!classesResponse.data || !classesResponse.data.length) {
      throw new Error('Aucune classe trouvée');
    }
    
    const firstClass = classesResponse.data[0];
    const classId = firstClass._id || firstClass.id;
    
    if (!classId) {
      throw new Error('Impossible de trouver l\'ID de la classe');
    }
    
    console.log(`\nClasse sélectionnée: "${firstClass.name}" (ID: ${classId})`);
    
    // 3. Récupérer les utilisateurs de la classe
    console.log(`\nRécupération des utilisateurs de la classe ${firstClass.name}...`);
    const usersResponse = await axios.get(`${API_BASE_URL}/users/class/${classId}`, authHeaders);
    
    // Afficher les utilisateurs récupérés
    console.log('Utilisateurs récupérés avec succès:');
    console.log(JSON.stringify(usersResponse.data, null, 2));
    
    // Afficher un résumé
    if (usersResponse.data && usersResponse.data.length) {
      const users = usersResponse.data;
      const teachers = users.filter(user => user.membershipRole === 'teacher');
      const students = users.filter(user => user.membershipRole === 'student');
      
      console.log(`\nRésumé: ${teachers.length} enseignant(s) et ${students.length} élève(s) dans la classe "${firstClass.name}"`);
      
      // Afficher les noms des utilisateurs avec leur rôle
      console.log('\nListe des utilisateurs:');
      
      if (teachers.length > 0) {
        console.log('\nEnseignants:');
        teachers.forEach((teacher, index) => {
          console.log(`${index + 1}. ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
        });
      }
      
      if (students.length > 0) {
        console.log('\nÉlèves:');
        students.forEach((student, index) => {
          console.log(`${index + 1}. ${student.firstName} ${student.lastName} (${student.email})`);
        });
      }
    } else {
      console.log('\nAucun utilisateur trouvé dans cette classe.');
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