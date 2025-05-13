# 🛡️ PRD — Authentification sécurisée Metacopi (JWT access + refresh token)

## 🧭 Objectif général

Mettre en œuvre un **système d’authentification sécurisé** basé sur des **JWT à durée courte (access_token)** et un **refresh_token** géré **via cookie HttpOnly**. Le but est d’assurer :

- La **sécurité** des sessions (éviter XSS, CSRF, vol de token).
- Une **expérience fluide** pour l’utilisateur (session persistante, sans reconnexion manuelle).
- Une base saine pour ajouter plus tard des mécanismes de rotation ou révocation centralisée.

---

## 📌 Portée

### Backend NestJS
- Ne plus exposer le `refresh_token` dans la réponse JSON.
- Lire le `refresh_token` depuis un cookie HttpOnly.
- Configurer le CORS et le middleware `cookie-parser`.
- Gérer `/refresh` de manière sécurisée.
- Conserver `access_token` dans la réponse pour stockage côté client JS.
- Prévoir la révocation simple (actuelle : en mémoire via Set).

### Frontend React/Next.js
- Envoyer le cookie `refresh_token` automatiquement (`withCredentials: true`).
- Stocker uniquement le `access_token` dans Zustand.
- Déclencher un `refresh` automatique à l’expiration (Axios Interceptor prévu plus tard).
- Ne jamais exposer ni stocker le `refresh_token`.

---

## 🔧 Tâches (et prompts Cursor associés)

| Tâche ID | Titre | Description |
|---------|-------|-------------|
| `AUTH-1` | Mise en place du cookie `HttpOnly` | Dans `AuthController.login`, renvoyer le `refresh_token` dans un cookie HttpOnly au lieu du JSON. |
| `AUTH-2` | Lecture du cookie côté `/refresh` | Modifier la route `/auth/refresh` pour extraire le token depuis `req.cookies`, pas depuis le body. |
| `AUTH-3` | Configuration du middleware cookies et CORS | Activer `cookie-parser` et autoriser `credentials: true` dans CORS (domaine du frontend). |
| `AUTH-4` | Ajustement frontend login | Adapter l’appel login pour ne pas dépendre du `refresh_token` dans la réponse JSON. |
| `AUTH-5` | Ajustement frontend `/refresh` | Utiliser `withCredentials: true` dans Axios pour déclencher le refresh sans exposer le token. |
| `AUTH-6` | (Optionnel) Création d’un `RefreshTokenGuard` | Ajouter un guard Passport dédié pour valider le refresh token depuis cookie. |
| `AUTH-7` | (Optionnel) Rotation sécurisée | Implémenter la rotation de refresh tokens et leur persistance en base (avec `jti`). |

---

## 📅 Priorité

| ID | Priorité | Raisonnement |
|----|----------|--------------|
| `AUTH-1` | 🟢 Haute | Supprime l’exposition JS du refresh token |
| `AUTH-2` | 🟢 Haute | Rend le `/refresh` conforme au modèle sécurisé |
| `AUTH-3` | 🟢 Haute | Nécessaire au bon fonctionnement du cookie côté client |
| `AUTH-4` | 🟢 Haute | Aligne le frontend sur le nouveau comportement backend |
| `AUTH-5` | 🟢 Haute | Assure la compatibilité Axios + cookies |
| `AUTH-6` | 🟡 Moyenne | Bonus de propreté + sécurité (guard réutilisable) |
| `AUTH-7` | 🟠 Moyenne / Long terme | Rotation utile pour détecter les vols ou fuites |

---

## 🔒 Contraintes techniques

- L’appel `/auth/refresh` doit fonctionner **même si le frontend ne connaît pas le token**.
- Le token doit être envoyé via cookie, **non exposé à `document.cookie`**.
- NestJS doit utiliser `cookie-parser`.
- Les requêtes Axios côté frontend doivent utiliser `withCredentials: true`.

---

## 📣 Résultat attendu

> Une session utilisateur persistante, sécurisée et invisible du point de vue des tokens sensibles.  
Le frontend reste simple et protégé, le backend maintient un contrôle fin sur les sessions.