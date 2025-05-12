#!/usr/bin/env node

const axios = require('axios');

// Informations d'identification pour Jean Dupont (extraites de seed-data.json)
const credentials = {
  email: 'jean.dupont@monlycee.net',
  password: 'Teacher123!'
};

const classId = 'MATH_1ere_03'
const testEmail = 'alice.gribouille@monlycee.net';

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
    
    console.log(`\nUtilisation directe du classId: ${classId}`);
    
    // 1. Test sans filtre - récupérer tous les utilisateurs
    console.log(`\n=== TEST 1: Récupération de tous les utilisateurs de la classe avec ID: ${classId} ===`);
    
    const usersResponse = await axios.get(`${API_BASE_URL}/classes/${classId}/users`, authHeaders);
    
    // Afficher les utilisateurs récupérés
    console.log('Utilisateurs récupérés avec succès:');
    console.log(JSON.stringify(usersResponse.data, null, 2));
    
    // Afficher un résumé
    if (usersResponse.data && usersResponse.data.length) {
      const users = usersResponse.data;
      const teachers = users.filter(user => user.role === 'teacher');
      const students = users.filter(user => user.role === 'student');
      
      console.log(`\nRésumé: ${teachers.length} enseignant(s) et ${students.length} élève(s) dans la classe "${classId}"`);
      
      // Afficher les noms des utilisateurs avec leur rôle
      console.log('\nListe des utilisateurs:');
      
      if (teachers.length > 0) {
        console.log('\nEnseignants:');
        teachers.forEach((teacher, index) => {
          console.log(`${index + 1}. ${`${teacher.firstName} ${teacher.lastName}`} (${teacher.email})`);
        });
      }
      
      if (students.length > 0) {
        console.log('\nÉlèves:');
        students.forEach((student, index) => {
          console.log(`${index + 1}. ${`${student.firstName} ${student.lastName}`} (${student.email})`);
        });
      }
    } else {
      console.log('\nAucun utilisateur trouvé dans cette classe.');
    }
    
    // 2. Test avec filtre par email
    console.log(`\n\n=== TEST 2: Récupération des utilisateurs de la classe avec filtre email: ${testEmail} ===`);
    
    const filteredUsersResponse = await axios.get(`${API_BASE_URL}/classes/${classId}/users?email=${encodeURIComponent(testEmail)}`, authHeaders);
    
    // Afficher les utilisateurs filtrés récupérés
    console.log('Utilisateurs filtrés récupérés avec succès:');
    console.log(JSON.stringify(filteredUsersResponse.data, null, 2));
    
    // Afficher un résumé pour les résultats filtrés
    if (filteredUsersResponse.data && filteredUsersResponse.data.length) {
      const filteredUsers = filteredUsersResponse.data;
      const filteredTeachers = filteredUsers.filter(user => user.role === 'teacher');
      const filteredStudents = filteredUsers.filter(user => user.role === 'student');
      
      console.log(`\nRésumé filtré: ${filteredTeachers.length} enseignant(s) et ${filteredStudents.length} élève(s) pour l'email "${testEmail}"`);
      
      // Afficher les noms des utilisateurs filtrés avec leur rôle
      console.log('\nListe des utilisateurs filtrés:');
      
      if (filteredTeachers.length > 0) {
        console.log('\nEnseignants:');
        filteredTeachers.forEach((teacher, index) => {
          console.log(`${index + 1}. ${`${teacher.firstName} ${teacher.lastName}`} (${teacher.email})`);
        });
      }
      
      if (filteredStudents.length > 0) {
        console.log('\nÉlèves:');
        filteredStudents.forEach((student, index) => {
          console.log(`${index + 1}. ${`${student.firstName} ${student.lastName}`} (${student.email})`);
        });
      }
    } else {
      console.log(`\nAucun utilisateur trouvé avec l'email "${testEmail}" dans cette classe.`);
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