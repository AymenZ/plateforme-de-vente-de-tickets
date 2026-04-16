# Guide de test — Liaison Frontend ↔ Backend (Utilisateurs + Commentaires MongoDB)

Ce guide explique comment vérifier que l'authentification, la gestion des utilisateurs et le module commentaires (stocké dans MongoDB) fonctionnent de bout en bout.

---

## 1. Prérequis

| Élément | Détail |
|---------|--------|
| **MySQL** | Serveur actif, base `eventdb` créée (`CREATE DATABASE IF NOT EXISTS eventdb;`) |
| **MongoDB** | Service MongoDB actif sur `localhost:27017` (base utilisée: `eventdb_comments`) |
| **Python** | 3.10+ avec les dépendances installées (`pip install -r requirements.txt`) |
| **Node.js** | 18+ avec les dépendances installées (`cd frontend && npm install`) |

---

## 2. Préparer les données (MySQL + MongoDB)

Depuis le dossier **`backend/`** :

```bash
# 1 — Créer les rôles (ADMIN, ORGANIZER, CLIENT)
python seed_roles.py

# 2 — Créer les utilisateurs de test
python seed_users.py
```

### Comptes de test créés

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin@eventhub.tn` | `test123` | ADMIN |
| `org@eventhub.tn` | `test123` | ORGANIZER |
| `client@eventhub.tn` | `test123` | CLIENT |
| `client2@eventhub.tn` | `test123` | CLIENT |

### Vérifier MongoDB local

Depuis un terminal PowerShell :

```powershell
Start-Service MongoDB
Get-Service MongoDB
Test-NetConnection localhost -Port 27017
```

Résultat attendu :
- Service `MongoDB` en `Running`
- Port `27017` accessible

---

## 3. Démarrer les serveurs

Ouvrir **deux terminaux** :

### Terminal 1 — Backend (FastAPI)

```bash
cd backend
uvicorn app.main:app --reload
```

Le backend tourne sur **http://localhost:8000**.  
Docs Swagger : **http://localhost:8000/docs**

### Terminal 2 — Frontend (Vite + React)

```bash
cd frontend
npm run dev
```

Le frontend tourne sur **http://localhost:5173**.

---

## 4. Scénarios de test

### 4.1. Connexion (Login)

1. Ouvrir **http://localhost:5173/login**
2. Se connecter avec `admin@eventhub.tn` / `test123`
3. ✅ Vérifier :
   - Redirection vers `/admin`
   - La barre de navigation affiche le rôle **admin**
   - Le bouton « Déconnexion » est visible
4. Se déconnecter, puis réessayer avec `client@eventhub.tn` / `test123`
5. ✅ Vérifier :
   - Redirection vers `/` (catalogue)
   - Pas de lien « Admin » dans la navigation

### 4.2. Inscription (Register)

1. Ouvrir **http://localhost:5173/register**
2. Remplir un email unique (ex. `test@test.com`) et un mot de passe
3. ✅ Vérifier :
   - Redirection vers `/` après inscription
   - L'utilisateur est connecté automatiquement avec le rôle **client**

### 4.3. Persistance de session

1. Se connecter avec n'importe quel compte
2. Fermer l'onglet, puis rouvrir **http://localhost:5173**
3. ✅ Vérifier :
   - L'utilisateur est toujours connecté (le token JWT est sauvegardé dans `localStorage`)

### 4.4. Panneau Admin — Liste des utilisateurs

1. Se connecter avec `admin@eventhub.tn` / `test123`
2. Aller sur **http://localhost:5173/admin**
3. ✅ Vérifier :
   - Le tableau contient tous les utilisateurs de la base
   - Chaque ligne affiche : ID, Email, Rôle

### 4.5. Panneau Admin — Modifier un rôle

1. Sur la page Admin, trouver l'utilisateur `client2@eventhub.tn`
2. Changer son rôle en **ORGANIZER** via le menu déroulant, puis cliquer **Modifier**
3. ✅ Vérifier :
   - Le badge de rôle se met à jour dans le tableau
   - Se déconnecter, se reconnecter avec `client2@eventhub.tn` → le rôle affiché est **organizer**

### 4.6. Swagger — Auth OAuth2 (pour routes commentaires)

1. Ouvrir **http://localhost:8000/docs**
2. Cliquer sur **Authorize**
3. Dans `OAuth2PasswordBearer`, saisir :
   - `username` = email (ex. `client@eventhub.tn`)
   - `password` = mot de passe (ex. `test123`)
4. Cliquer **Authorize**, puis **Close**
5. ✅ Vérifier :
   - Les routes protégées n'affichent plus `401 Unauthorized`

### 4.7. Commentaires — Créer un commentaire

1. Dans Swagger, ouvrir `POST /events/{event_id}/comments`
2. Utiliser un `event_id` existant (ex. `5`)
3. Body :

```json
{
  "rating": 5,
  "content": "Excellent evenement, organisation au top"
}
```

4. ✅ Vérifier :
   - Status `201`
   - Retour avec `id`, `event_id`, `user_id`, `rating`, `content`, `created_at`

### 4.8. Commentaires — Lister et modifier

1. Tester `GET /events/{event_id}/comments`
2. Tester `GET /users/me/comments`
3. Copier un `comment_id`, puis appeler `PUT /comments/{comment_id}` avec :

```json
{
  "rating": 4,
  "content": "Update: tres bon evenement, quelques retards au debut"
}
```

4. ✅ Vérifier :
   - Status `200`
   - `is_edited: true`
   - `updated_at` mis à jour

### 4.9. Commentaires — Supprimer

1. Appeler `DELETE /comments/{comment_id}`
2. ✅ Vérifier :
   - Status `200`
   - Message de succès

### 4.10. Vérification MongoDB Compass

1. Ouvrir MongoDB Compass
2. Se connecter à `mongodb://localhost:27017`
3. Ouvrir la base `eventdb_comments`, puis la collection `comments`
4. Filtre conseillé :

```json
{ "event_id": 5 }
```

5. ✅ Vérifier :
   - Les commentaires créés via API sont visibles
   - Les champs `created_at`, `updated_at`, `is_edited` sont cohérents
   - Le document disparaît après suppression API

---

## 5. Dépannage

| Problème | Solution |
|----------|----------|
| **CORS error** dans la console | Vérifier que le backend a le middleware CORS avec l'origine `http://localhost:5173` (déjà configuré dans `app/main.py`) |
| **401 Unauthorized** | Le token a peut-être expiré (60 min). Se reconnecter. |
| **"Network Error"** | Vérifier que les deux serveurs sont lancés (backend sur 8000, frontend sur 5173) |
| **"Rôle introuvable"** lors du seed | Lancer `python seed_roles.py` **avant** `python seed_users.py` |
| **Module not found** | Vérifier que vous êtes dans le dossier `backend/` quand vous exécutez les scripts Python |
| **503 Service commentaires indisponible** | Vérifier que MongoDB est démarré (`Start-Service MongoDB`) et que `MONGODB_URL` pointe sur `mongodb://localhost:27017` |
| **No module named bson** | Réinstaller les dépendances backend : `pip install -r requirements.txt` |

---

## 6. Vérification via l'API directement (optionnel)

Vous pouvez aussi tester l'API via **curl** ou **Swagger** :

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@eventhub.tn", "password": "test123"}'

# Récupérer le token de la réponse, puis :
curl http://localhost:8000/users/me \
  -H "Authorization: Bearer <VOTRE_TOKEN>"

# Lister tous les utilisateurs (admin)
curl http://localhost:8000/users/ \
  -H "Authorization: Bearer <VOTRE_TOKEN>"

# Créer un commentaire
curl -X POST http://localhost:8000/events/5/comments \
   -H "Authorization: Bearer <VOTRE_TOKEN>" \
   -H "Content-Type: application/json" \
   -d '{"rating":5,"content":"Commentaire via curl"}'

# Lister les commentaires d'un événement
curl http://localhost:8000/events/5/comments

# Lister mes commentaires
curl http://localhost:8000/users/me/comments \
   -H "Authorization: Bearer <VOTRE_TOKEN>"
```

---

## Résumé des URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Login | http://localhost:5173/login |
| Register | http://localhost:5173/register |
| Admin | http://localhost:5173/admin |
| Catalogue | http://localhost:5173/ |
| MongoDB URI (local) | mongodb://localhost:27017 |
