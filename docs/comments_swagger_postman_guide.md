# Guide de test - Commentaires (Swagger + Postman)

Ce document explique comment tester le module **commentaires backend** qui stocke les donnees dans **MongoDB**.

---

## 1) Prerequis

1. Activer le venv backend puis installer les dependances:

```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

2. Verifier que **MySQL** et **MongoDB** sont demarres.

3. Verifier les variables backend dans `.env`:

```env
DATABASE_URL=mysql+pymysql://root:@localhost/eventdb
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=eventdb_comments
```

4. Lancer le backend:

```bash
uvicorn app.main:app --reload
```

5. Avoir au moins:
- un utilisateur existant (ex: `client@eventhub.tn` / `test123`)
- un evenement existant (`event_id` valide)

---

## 2) Endpoints commentaires

| Methode | Route | Auth | Description |
|---|---|---|---|
| GET | `/events/{event_id}/comments` | Non | Lister les commentaires d'un evenement |
| POST | `/events/{event_id}/comments` | Oui | Ajouter un commentaire |
| GET | `/users/me/comments` | Oui | Lister mes commentaires |
| PUT | `/comments/{comment_id}` | Oui | Modifier un commentaire (owner/admin) |
| DELETE | `/comments/{comment_id}` | Oui | Supprimer un commentaire (owner/admin) |

### Regles metier

- Un utilisateur ne peut laisser **qu'un seul commentaire par evenement**.
- `rating` doit etre entre **1 et 5**.
- `content` ne doit pas etre vide.

---

## 3) Test via Swagger

Swagger: `http://localhost:8000/docs`

### Etape A - Autoriser Swagger (OAuth2 Password Flow)

1. Cliquer sur **Authorize** (en haut a droite).
2. Dans `OAuth2PasswordBearer` remplir:
   - `username`: ton **email** (ex: `client@eventhub.tn`)
   - `password`: ton mot de passe (ex: `test123`)
3. Cliquer **Authorize** puis **Close**.

Swagger appelle automatiquement `POST /auth/token` en `form-data` et stocke le token.

### Etape B - Creer un commentaire

`POST /events/{event_id}/comments`

Body exemple:

```json
{
  "rating": 5,
  "content": "Excellent evenement, organisation au top"
}
```

Attendu:
- Status `201`
- Reponse avec `id`, `event_id`, `user_id`, `rating`, `content`, `created_at`

### Etape C - Lister les commentaires de l'evenement

`GET /events/{event_id}/comments`

Attendu:
- Status `200`
- Liste contenant le commentaire cree

### Etape D - Lister mes commentaires

`GET /users/me/comments`

Attendu:
- Status `200`
- Liste contenant le commentaire cree

### Etape E - Modifier un commentaire

`PUT /comments/{comment_id}`

Body exemple:

```json
{
  "rating": 4,
  "content": "Update: tres bon evenement, quelques retards au debut"
}
```

Attendu:
- Status `200`
- `is_edited: true`
- `updated_at` mis a jour

### Etape F - Supprimer un commentaire

`DELETE /comments/{comment_id}`

Attendu:
- Status `200`
- Message de succes

---

## 4) Test via Postman

## Variables de collection

Creer une collection `Event Ticket Platform - Comments` avec ces variables:

| Variable | Valeur initiale |
|---|---|
| `base_url` | `http://localhost:8000` |
| `client_token` | (vide) |
| `event_id` | (mettre un id existant) |
| `comment_id` | (vide) |

### Request 1 - Login

- Methode: `POST`
- URL: `{{base_url}}/auth/login`
- Header: `Content-Type: application/json`
- Body:

```json
{
  "email": "client@eventhub.tn",
  "password": "test123"
}
```

Tests (tab Scripts):

```javascript
pm.test("status 200", function () {
  pm.response.to.have.status(200);
});
const data = pm.response.json();
pm.collectionVariables.set("client_token", data.access_token);
```

### Request 2 - Create comment

- Methode: `POST`
- URL: `{{base_url}}/events/{{event_id}}/comments`
- Header: `Authorization: Bearer {{client_token}}`
- Header: `Content-Type: application/json`
- Body:

```json
{
  "rating": 5,
  "content": "Postman test commentaire"
}
```

Tests:

```javascript
pm.test("status 201", function () {
  pm.response.to.have.status(201);
});
const data = pm.response.json();
pm.collectionVariables.set("comment_id", data.id);
```

### Request 3 - List event comments

- Methode: `GET`
- URL: `{{base_url}}/events/{{event_id}}/comments`

### Request 4 - My comments

- Methode: `GET`
- URL: `{{base_url}}/users/me/comments`
- Header: `Authorization: Bearer {{client_token}}`

### Request 5 - Update comment

- Methode: `PUT`
- URL: `{{base_url}}/comments/{{comment_id}}`
- Header: `Authorization: Bearer {{client_token}}`
- Header: `Content-Type: application/json`
- Body:

```json
{
  "rating": 3,
  "content": "Update depuis Postman"
}
```

### Request 6 - Delete comment

- Methode: `DELETE`
- URL: `{{base_url}}/comments/{{comment_id}}`
- Header: `Authorization: Bearer {{client_token}}`

---

## 5) Cas d'erreur a tester

1. **Duplicate comment** (meme user + meme event)
- Action: refaire `POST /events/{event_id}/comments`
- Attendu: `409` + message `Vous avez deja commente cet evenement`

2. **Event inexistant**
- Action: `POST /events/999999/comments`
- Attendu: `404`

3. **Commentaire vide**
- Action: `content: "   "`
- Attendu: `400`

4. **Unauthorized**
- Action: route protegee sans token
- Attendu: `401`

5. **Forbidden**
- Action: modifier/supprimer le commentaire d'un autre user
- Attendu: `403`

6. **Mongo down**
- Action: arreter MongoDB puis appeler une route commentaires
- Attendu: `503` + `Service commentaires indisponible`

---

## 6) Verification directe dans MongoDB (optionnel)

Si `mongosh` est disponible:

```bash
mongosh
use eventdb_comments
db.comments.find({ event_id: NumberInt(1) }).sort({ created_at: -1 })
```

Adapter `event_id` a ton cas.

---

## 7) Rappel rapide de troubleshooting

- Erreur `No module named bson`:

```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

- Si `pip` du venv est casse, recreer le venv:

```bash
cd backend
rmdir /s /q venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

- Erreur `No module named app`:
  - verifier que tu lances uvicorn depuis le dossier `backend/`.
