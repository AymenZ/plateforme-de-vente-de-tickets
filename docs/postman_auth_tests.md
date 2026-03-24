# Guide de Tests Postman — Authentification, Rôles & Événements

## Prérequis

1. **MySQL** doit être démarré avec la base `eventdb` créée :
   ```sql
   CREATE DATABASE IF NOT EXISTS eventdb;
   ```

2. **Initialiser les rôles** (depuis le dossier `backend/`) :
   ```bash
   python -m scripts.seed_roles
   ```
   Résultat attendu :
   ```
   Rôle 'ADMIN' créé.
   Rôle 'ORGANIZER' créé.
   Rôle 'CLIENT' créé.
   Initialisation des rôles terminée.
   ```

3. **Lancer le serveur** :
   ```bash
   uvicorn app.main:app --reload
   ```
   Vérifier que http://localhost:8000 retourne `{"message": "API is running"}`

4. **Ouvrir Postman** et créer une nouvelle Collection nommée `Event Ticket Platform`

---

## Configuration Postman

### Variables de Collection
Dans l'onglet "Variables" de la collection, créer :

| Variable         | Initial Value              |
|------------------|----------------------------|
| `base_url`       | `http://localhost:8000`    |
| `client_token`   | (vide)                     |
| `admin_token`    | (vide)                     |
| `organizer_token`| (vide)                     |
| `user_id`        | (vide)                     |
| `event_id`       | (vide)                     |

---

## TEST 1 — Inscription d'un utilisateur (CLIENT)

**Objectif** : Vérifier qu'un utilisateur peut s'inscrire et reçoit un token JWT

- **Méthode** : `POST`
- **URL** : `{{base_url}}/auth/register`
- **Headers** :
  - `Content-Type` : `application/json`
- **Body** (raw → JSON) :
```json
{
    "email": "client@test.com",
    "password": "password123"
}
```

### Réponse attendue
- **Status** : `201 Created`
- **Body** :
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
}
```

### Script de test (onglet "Scripts" → "Post-response")
```javascript
pm.test("Status 201 Created", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has access_token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("access_token");
    pm.expect(jsonData.token_type).to.eql("bearer");
    // Sauvegarder le token pour les prochains tests
    pm.collectionVariables.set("client_token", jsonData.access_token);
});
```

---

## TEST 2 — Inscription avec email déjà existant (ERREUR)

**Objectif** : Vérifier qu'on ne peut pas créer 2 comptes avec le même email

- **Méthode** : `POST`
- **URL** : `{{base_url}}/auth/register`
- **Body** (raw → JSON) :
```json
{
    "email": "client@test.com",
    "password": "autrepassword"
}
```

### Réponse attendue
- **Status** : `400 Bad Request`
- **Body** :
```json
{
    "detail": "Un compte avec cet email existe déjà"
}
```

### Script de test
```javascript
pm.test("Status 400 Bad Request", function () {
    pm.response.to.have.status(400);
});

pm.test("Error message for duplicate email", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.detail).to.eql("Un compte avec cet email existe déjà");
});
```

---

## TEST 3 — Inscription avec email invalide (ERREUR)

**Objectif** : Vérifier la validation du format email

- **Méthode** : `POST`
- **URL** : `{{base_url}}/auth/register`
- **Body** (raw → JSON) :
```json
{
    "email": "pas-un-email",
    "password": "password123"
}
```

### Réponse attendue
- **Status** : `422 Unprocessable Entity`

### Script de test
```javascript
pm.test("Status 422 for invalid email", function () {
    pm.response.to.have.status(422);
});
```

---

## TEST 4 — Connexion réussie

**Objectif** : Vérifier qu'un utilisateur inscrit peut se connecter

- **Méthode** : `POST`
- **URL** : `{{base_url}}/auth/login`
- **Headers** :
  - `Content-Type` : `application/json`
- **Body** (raw → JSON) :
```json
{
    "email": "client@test.com",
    "password": "password123"
}
```

### Réponse attendue
- **Status** : `200 OK`
- **Body** :
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
}
```

### Script de test
```javascript
pm.test("Status 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Login returns valid token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("access_token");
    pm.expect(jsonData.token_type).to.eql("bearer");
    pm.collectionVariables.set("client_token", jsonData.access_token);
});
```

---

## TEST 5 — Connexion avec mauvais mot de passe (ERREUR)

**Objectif** : Vérifier le rejet des identifiants incorrects

- **Méthode** : `POST`
- **URL** : `{{base_url}}/auth/login`
- **Body** (raw → JSON) :
```json
{
    "email": "client@test.com",
    "password": "mauvaispassword"
}
```

### Réponse attendue
- **Status** : `401 Unauthorized`
- **Body** :
```json
{
    "detail": "Email ou mot de passe incorrect"
}
```

### Script de test
```javascript
pm.test("Status 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});

pm.test("Error message for wrong password", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.detail).to.eql("Email ou mot de passe incorrect");
});
```

---

## TEST 6 — Connexion avec email inexistant (ERREUR)

**Objectif** : Vérifier le rejet d'un email non enregistré

- **Méthode** : `POST`
- **URL** : `{{base_url}}/auth/login`
- **Body** (raw → JSON) :
```json
{
    "email": "nexistepas@test.com",
    "password": "password123"
}
```

### Réponse attendue
- **Status** : `401 Unauthorized`

### Script de test
```javascript
pm.test("Status 401 for unknown email", function () {
    pm.response.to.have.status(401);
});
```

---

## TEST 7 — Accéder au profil (GET /users/me)

**Objectif** : Vérifier qu'un utilisateur connecté peut voir son profil

- **Méthode** : `GET`
- **URL** : `{{base_url}}/users/me`
- **Authorization** :
  - Type : `Bearer Token`
  - Token : `{{client_token}}`

### Réponse attendue
- **Status** : `200 OK`
- **Body** :
```json
{
    "id": 1,
    "email": "client@test.com",
    "role_id": 3,
    "role_name": "CLIENT"
}
```

### Script de test
```javascript
pm.test("Status 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("User profile is correct", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
    pm.expect(jsonData).to.have.property("email");
    pm.expect(jsonData.role_name).to.eql("CLIENT");
    // Sauvegarder l'id pour les tests suivants
    pm.collectionVariables.set("user_id", jsonData.id);
});
```

---

## TEST 8 — Accéder au profil sans token (ERREUR)

**Objectif** : Vérifier que les routes protégées rejettent les requêtes non authentifiées

- **Méthode** : `GET`
- **URL** : `{{base_url}}/users/me`
- **Authorization** : `No Auth` (aucun token)

### Réponse attendue
- **Status** : `401 Unauthorized`

### Script de test
```javascript
pm.test("Status 401 without token", function () {
    pm.response.to.have.status(401);
});
```

---

## TEST 9 — Accéder au profil avec token invalide (ERREUR)

**Objectif** : Vérifier le rejet des tokens falsifiés

- **Méthode** : `GET`
- **URL** : `{{base_url}}/users/me`
- **Authorization** :
  - Type : `Bearer Token`
  - Token : `fake_invalid_token_12345`

### Réponse attendue
- **Status** : `401 Unauthorized`
- **Body** :
```json
{
    "detail": "Token invalide ou expiré"
}
```

### Script de test
```javascript
pm.test("Status 401 for invalid token", function () {
    pm.response.to.have.status(401);
});

pm.test("Error message for invalid token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.detail).to.eql("Token invalide ou expiré");
});
```

---

## TEST 10 — Créer un compte admin (préparation pour tests de rôles)

**Objectif** : Créer un utilisateur admin pour tester les routes protégées par rôle

### Étape A — Inscrire un 2e utilisateur
- **Méthode** : `POST`
- **URL** : `{{base_url}}/auth/register`
- **Body** :
```json
{
    "email": "admin@test.com",
    "password": "admin123"
}
```

### Étape B — Lui attribuer le rôle ADMIN manuellement en SQL
Exécuter dans MySQL :
```sql
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN')
WHERE email = 'admin@test.com';
```

### Étape C — Se connecter en tant qu'admin
- **Méthode** : `POST`
- **URL** : `{{base_url}}/auth/login`
- **Body** :
```json
{
    "email": "admin@test.com",
    "password": "admin123"
}
```

### Script de test
```javascript
pm.test("Admin login successful", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.collectionVariables.set("admin_token", jsonData.access_token);
});
```

---

## TEST 11 — Modifier le rôle d'un utilisateur (ADMIN)

**Objectif** : Vérifier qu'un admin peut changer le rôle d'un utilisateur

- **Méthode** : `PUT`
- **URL** : `{{base_url}}/users/{{user_id}}/role`
- **Authorization** :
  - Type : `Bearer Token`
  - Token : `{{admin_token}}`
- **Body** (raw → JSON) :
```json
{
    "role_name": "ORGANIZER"
}
```

### Réponse attendue
- **Status** : `200 OK`
- **Body** :
```json
{
    "id": 1,
    "email": "client@test.com",
    "role_id": 2,
    "role_name": "ORGANIZER"
}
```

### Script de test
```javascript
pm.test("Status 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Role updated to ORGANIZER", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.role_name).to.eql("ORGANIZER");
});
```

---

## TEST 12 — Modifier un rôle en tant que CLIENT (ERREUR — accès refusé)

**Objectif** : Vérifier qu'un non-admin ne peut pas modifier les rôles

- **Méthode** : `PUT`
- **URL** : `{{base_url}}/users/{{user_id}}/role`
- **Authorization** :
  - Type : `Bearer Token`
  - Token : `{{client_token}}`
- **Body** (raw → JSON) :
```json
{
    "role_name": "ADMIN"
}
```

### Réponse attendue
- **Status** : `403 Forbidden`
- **Body** :
```json
{
    "detail": "Accès refusé : rôle insuffisant"
}
```

### Script de test
```javascript
pm.test("Status 403 Forbidden", function () {
    pm.response.to.have.status(403);
});

pm.test("Access denied message", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.detail).to.eql("Accès refusé : rôle insuffisant");
});
```

---

## TEST 13 — Lister tous les utilisateurs (ADMIN)

**Objectif** : Vérifier qu'un admin peut lister tous les utilisateurs

- **Méthode** : `GET`
- **URL** : `{{base_url}}/users/`
- **Authorization** :
  - Type : `Bearer Token`
  - Token : `{{admin_token}}`

### Réponse attendue
- **Status** : `200 OK`
- **Body** : Un tableau JSON contenant tous les utilisateurs

### Script de test
```javascript
pm.test("Status 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is an array of users", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("array");
    pm.expect(jsonData.length).to.be.greaterThan(0);
    pm.expect(jsonData[0]).to.have.property("email");
    pm.expect(jsonData[0]).to.have.property("role_name");
});
```

---

## TEST 14 — Lister les utilisateurs en tant que CLIENT (ERREUR)

**Objectif** : Vérifier qu'un non-admin ne peut pas lister les utilisateurs

- **Méthode** : `GET`
- **URL** : `{{base_url}}/users/`
- **Authorization** :
  - Type : `Bearer Token`
  - Token : `{{client_token}}`

### Réponse attendue
- **Status** : `403 Forbidden`

### Script de test
```javascript
pm.test("Status 403 Forbidden for non-admin", function () {
    pm.response.to.have.status(403);
});
```

---

## TEST 15 — Modifier rôle avec rôle invalide (ERREUR)

**Objectif** : Vérifier la gestion d'erreur pour un rôle inexistant

- **Méthode** : `PUT`
- **URL** : `{{base_url}}/users/{{user_id}}/role`
- **Authorization** :
  - Type : `Bearer Token`
  - Token : `{{admin_token}}`
- **Body** :
```json
{
    "role_name": "SUPERADMIN"
}
```

### Réponse attendue
- **Status** : `400 Bad Request`
- **Body** :
```json
{
    "detail": "Rôle 'SUPERADMIN' n'existe pas. Rôles valides : ADMIN, ORGANIZER, CLIENT"
}
```

### Script de test
```javascript
pm.test("Status 400 for invalid role", function () {
    pm.response.to.have.status(400);
});
```

---

## Ordre d'exécution recommandé

Exécuter les tests dans cet ordre exact (utiliser le "Collection Runner" de Postman) :

```
1.  POST /auth/register        → Inscrit client@test.com
2.  POST /auth/register        → Erreur email dupliqué
3.  POST /auth/register        → Erreur email invalide
4.  POST /auth/login           → Connexion réussie
5.  POST /auth/login           → Erreur mauvais mot de passe
6.  POST /auth/login           → Erreur email inexistant
7.  GET  /users/me             → Profil avec token
8.  GET  /users/me             → Erreur sans token
9.  GET  /users/me             → Erreur token invalide
10. POST /auth/register        → Inscrit admin@test.com
    → puis SQL : UPDATE users SET role_id = ... (voir Test 10)
    → POST /auth/login admin   → Récupère admin_token
11. PUT  /users/{id}/role      → Admin change rôle → ORGANIZER
12. PUT  /users/{id}/role      → Client tente de changer rôle → 403
13. GET  /users/               → Admin liste les utilisateurs
14. GET  /users/               → Client tente de lister → 403
15. PUT  /users/{id}/role      → Rôle invalide → 400
16. POST /events/              → Organisateur crée un événement
17. POST /events/              → Client tente de créer → 403
18. GET  /events/              → Liste des événements (public)
19. GET  /events/{id}          → Détail d'un événement (public)
20. PUT  /events/{id}          → Organisateur modifie son événement
21. DELETE /events/{id}        → Organisateur supprime son événement
22. POST /events/              → Créer sans token → 401
```

---

## TEST 16 — Créer un événement (ORGANIZER)

> **Pré-requis** : Avoir un utilisateur avec le rôle ORGANIZER (via Test 11) et son token.
> Si pas encore fait, connectez l'organisateur :
> - POST `{{base_url}}/auth/login` avec les identifiants de l'organisateur
> - Sauvegarder le token dans `organizer_token`

**Objectif** : Vérifier qu'un organisateur peut créer un événement

- **Méthode** : `POST`
- **URL** : `{{base_url}}/events/`
- **Headers** :
  - `Content-Type` : `application/json`
  - `Authorization` : `Bearer {{organizer_token}}`
- **Body** (raw → JSON) :
```json
{
    "title": "Concert de Jazz",
    "description": "Une soirée jazz exceptionnelle au centre-ville",
    "category": "Musique",
    "event_date": "2026-04-15T20:00:00"
}
```

### Réponse attendue
- **Status** : `201 Created`
- **Body** :
```json
{
    "id": 1,
    "title": "Concert de Jazz",
    "description": "Une soirée jazz exceptionnelle au centre-ville",
    "category": "Musique",
    "event_date": "2026-04-15T20:00:00",
    "organizer_id": 2
}
```

### Script de test
```javascript
pm.test("Status 201 Created", function () {
    pm.response.to.have.status(201);
});

pm.test("Event has required fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
    pm.expect(jsonData).to.have.property("title");
    pm.expect(jsonData).to.have.property("organizer_id");
    pm.collectionVariables.set("event_id", jsonData.id);
});
```

---

## TEST 17 — Client tente de créer un événement (ERREUR 403)

**Objectif** : Vérifier qu'un CLIENT ne peut pas créer d'événement

- **Méthode** : `POST`
- **URL** : `{{base_url}}/events/`
- **Headers** :
  - `Content-Type` : `application/json`
  - `Authorization` : `Bearer {{client_token}}`
- **Body** (raw → JSON) :
```json
{
    "title": "Mon événement",
    "event_date": "2026-05-01T18:00:00"
}
```

### Réponse attendue
- **Status** : `403 Forbidden`
- **Body** :
```json
{
    "detail": "Accès refusé : rôle insuffisant"
}
```

### Script de test
```javascript
pm.test("Status 403 Forbidden", function () {
    pm.response.to.have.status(403);
});

pm.test("Access denied message", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.detail).to.eql("Accès refusé : rôle insuffisant");
});
```

---

## TEST 18 — Liste des événements (PUBLIC)

**Objectif** : Vérifier que tout le monde peut voir la liste des événements

- **Méthode** : `GET`
- **URL** : `{{base_url}}/events/`
- **Headers** : aucun (pas de token nécessaire)

### Réponse attendue
- **Status** : `200 OK`
- **Body** : tableau d'événements
```json
[
    {
        "id": 1,
        "title": "Concert de Jazz",
        "description": "Une soirée jazz exceptionnelle au centre-ville",
        "category": "Musique",
        "event_date": "2026-04-15T20:00:00",
        "organizer_id": 2
    }
]
```

### Script de test
```javascript
pm.test("Status 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is an array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("array");
});

pm.test("Events have required fields", function () {
    var jsonData = pm.response.json();
    if (jsonData.length > 0) {
        pm.expect(jsonData[0]).to.have.property("id");
        pm.expect(jsonData[0]).to.have.property("title");
        pm.expect(jsonData[0]).to.have.property("event_date");
        pm.expect(jsonData[0]).to.have.property("organizer_id");
    }
});
```

---

## TEST 19 — Détail d'un événement (PUBLIC)

**Objectif** : Vérifier qu'on peut consulter un événement spécifique

- **Méthode** : `GET`
- **URL** : `{{base_url}}/events/{{event_id}}`
- **Headers** : aucun

### Réponse attendue
- **Status** : `200 OK`
- **Body** :
```json
{
    "id": 1,
    "title": "Concert de Jazz",
    "description": "Une soirée jazz exceptionnelle au centre-ville",
    "category": "Musique",
    "event_date": "2026-04-15T20:00:00",
    "organizer_id": 2
}
```

### Script de test
```javascript
pm.test("Status 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Event details are correct", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.id).to.eql(parseInt(pm.collectionVariables.get("event_id")));
    pm.expect(jsonData).to.have.property("title");
    pm.expect(jsonData).to.have.property("organizer_id");
});
```

---

## TEST 20 — Modifier un événement (ORGANIZER)

**Objectif** : Vérifier qu'un organisateur peut modifier son propre événement

- **Méthode** : `PUT`
- **URL** : `{{base_url}}/events/{{event_id}}`
- **Headers** :
  - `Content-Type` : `application/json`
  - `Authorization` : `Bearer {{organizer_token}}`
- **Body** (raw → JSON) :
```json
{
    "title": "Concert de Jazz — Édition Spéciale",
    "description": "Mise à jour de la description"
}
```

### Réponse attendue
- **Status** : `200 OK`
- **Body** : L'événement avec le titre mis à jour

### Script de test
```javascript
pm.test("Status 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Title was updated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.title).to.include("Édition Spéciale");
});
```

---

## TEST 21 — Supprimer un événement (ORGANIZER)

**Objectif** : Vérifier qu'un organisateur peut supprimer son propre événement

- **Méthode** : `DELETE`
- **URL** : `{{base_url}}/events/{{event_id}}`
- **Headers** :
  - `Authorization` : `Bearer {{organizer_token}}`

### Réponse attendue
- **Status** : `200 OK`
- **Body** :
```json
{
    "message": "Événement supprimé avec succès"
}
```

### Script de test
```javascript
pm.test("Status 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Delete confirmation message", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.eql("Événement supprimé avec succès");
});
```

---

## TEST 22 — Créer un événement sans token (ERREUR 401)

**Objectif** : Vérifier qu'on ne peut pas créer un événement sans authentification

- **Méthode** : `POST`
- **URL** : `{{base_url}}/events/`
- **Headers** :
  - `Content-Type` : `application/json`
- **Body** (raw → JSON) :
```json
{
    "title": "Événement sans auth",
    "event_date": "2026-06-01T10:00:00"
}
```

### Réponse attendue
- **Status** : `401 Unauthorized`

### Script de test
```javascript
pm.test("Status 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
```

---

## Exporter la collection

1. Clic droit sur la collection → **Export**
2. Choisir le format **Collection v2.1**
3. Sauvegarder le fichier `.json` dans `docs/postman/`

Ce fichier exporté servira comme livrable du Sprint 1 (collection de tests manuels exportable).

---

## Vérifier la documentation Swagger

FastAPI génère automatiquement la documentation. Visiter :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

Tous les endpoints, schémas et modèles y sont documentés automatiquement.
