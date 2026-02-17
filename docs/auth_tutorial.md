# Tutoriel — Système d'Authentification & Gestion des Rôles

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du système](#2-architecture-du-système)
3. [Les rôles utilisateurs](#3-les-rôles-utilisateurs)
4. [Inscription d'un utilisateur](#4-inscription-dun-utilisateur)
5. [Connexion et obtention du token JWT](#5-connexion-et-obtention-du-token-jwt)
6. [Comprendre le token JWT](#6-comprendre-le-token-jwt)
7. [Accéder aux routes protégées](#7-accéder-aux-routes-protégées)
8. [Contrôle d'accès par rôle](#8-contrôle-daccès-par-rôle)
9. [Gestion des rôles par l'admin](#9-gestion-des-rôles-par-ladmin)
10. [Flux complet — Exemple pas à pas](#10-flux-complet--exemple-pas-à-pas)
11. [Erreurs courantes et solutions](#11-erreurs-courantes-et-solutions)
12. [Sécurité — Bonnes pratiques](#12-sécurité--bonnes-pratiques)

---

## 1. Vue d'ensemble

Le système d'authentification de la plateforme repose sur **JWT (JSON Web Tokens)**. Chaque utilisateur s'inscrit, se connecte, et reçoit un token qu'il utilise pour accéder aux ressources protégées.

**Technologies utilisées :**
- **FastAPI** — Framework web Python
- **SQLAlchemy** — ORM pour la base de données MySQL
- **passlib + bcrypt** — Hashage sécurisé des mots de passe
- **python-jose** — Création et vérification des tokens JWT
- **Pydantic** — Validation des données entrantes

---

## 2. Architecture du système

```
Client (Postman / Frontend)
    │
    ├── POST /auth/register  →  Créer un compte
    ├── POST /auth/login     →  Obtenir un token JWT
    │
    ├── GET  /users/me       →  Profil (token requis)
    ├── GET  /users/         →  Liste users (admin)
    ├── PUT  /users/{id}/role → Changer rôle (admin)
    │
    ├── POST /events/        →  Créer événement (organisateur)
    ├── GET  /events/        →  Liste événements (public)
    └── GET  /events/{id}    →  Détail événement (public)
```

### Structure des fichiers

```
backend/app/
├── core/
│   ├── security.py        # Hashage mot de passe, JWT
│   ├── dependencies.py    # Middleware d'authentification
│   └── config.py          # Variables de configuration
├── models/
│   ├── user.py            # Modèle SQLAlchemy User
│   └── role.py            # Modèle SQLAlchemy Role
├── schemas/
│   ├── user_schema.py     # Validation Pydantic (User)
│   └── auth_schema.py     # Validation Pydantic (Token)
├── services/
│   ├── user_service.py    # Logique métier utilisateur
│   └── auth_service.py    # Logique métier authentification
├── routes/
│   ├── auth_routes.py     # Endpoints /auth/*
│   └── user_routes.py     # Endpoints /users/*
├── database.py            # Connexion base de données
└── main.py                # Point d'entrée FastAPI
```

---

## 3. Les rôles utilisateurs

Le système définit **3 rôles** stockés dans la table `roles` :

| Rôle         | Description                                      | Permissions                              |
|--------------|--------------------------------------------------|------------------------------------------|
| **CLIENT**   | Utilisateur standard (rôle par défaut)           | Voir événements, consulter son profil    |
| **ORGANIZER**| Organisateur d'événements                         | Créer, modifier, supprimer ses événements|
| **ADMIN**    | Administrateur de la plateforme                   | Tout : gérer rôles, users, événements    |

> À l'inscription, chaque utilisateur reçoit automatiquement le rôle **CLIENT**.

### Initialisation des rôles

Avant toute utilisation, les rôles doivent être créés en base :

```bash
cd backend
python seed_roles.py
```

Ce script insère les 3 rôles s'ils n'existent pas déjà.

---

## 4. Inscription d'un utilisateur

### Endpoint

```
POST /auth/register
```

### Corps de la requête

```json
{
    "email": "user@example.com",
    "password": "monMotDePasse"
}
```

### Ce qui se passe en coulisse

1. **Validation** : Pydantic vérifie que l'email est valide et que le mot de passe est présent
2. **Doublon ?** : Le système vérifie qu'aucun compte n'existe avec cet email
3. **Hashage** : Le mot de passe est hashé avec bcrypt (il n'est **jamais** stocké en clair)
4. **Création** : L'utilisateur est créé avec le rôle `CLIENT` par défaut
5. **Token** : Un token JWT est généré et retourné immédiatement

### Réponse (201 Created)

```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "token_type": "bearer"
}
```

### Code source — Hashage du mot de passe

```python
# core/security.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)
    # Résultat : "$2b$12$LJ3m4ys..." (irréversible)
```

> **Important** : Le mot de passe original ne peut pas être retrouvé à partir du hash. Lors de la connexion, on compare le mot de passe saisi avec le hash stocké.

---

## 5. Connexion et obtention du token JWT

### Endpoint

```
POST /auth/login
```

### Corps de la requête

```json
{
    "email": "user@example.com",
    "password": "monMotDePasse"
}
```

### Ce qui se passe en coulisse

1. **Recherche** : Le système cherche l'utilisateur par email
2. **Vérification** : Le mot de passe saisi est comparé au hash stocké via bcrypt
3. **Token** : Si correct, un token JWT est généré avec l'`user_id` et le `role`

### Réponse (200 OK)

```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "token_type": "bearer"
}
```

### Code source — Vérification du mot de passe

```python
# services/auth_service.py
def authenticate_user(db, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
```

---

## 6. Comprendre le token JWT

Un token JWT est composé de 3 parties séparées par des points :

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiQ0xJRU5UIiwiZXhwIjoxNjk5...   .signature
|______ Header ______||________________________ Payload ___________________________|______|
```

### Contenu du Payload

```json
{
    "user_id": 1,
    "role": "CLIENT",
    "exp": 1699999999
}
```

| Champ     | Description                                    |
|-----------|------------------------------------------------|
| `user_id` | Identifiant unique de l'utilisateur            |
| `role`    | Nom du rôle (CLIENT, ORGANIZER, ADMIN)         |
| `exp`     | Date d'expiration du token (timestamp UNIX)    |

### Durée de validité

Le token expire après **60 minutes** (configurable dans `config.py`).

### Code source — Création du token

```python
# core/security.py
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
```

---

## 7. Accéder aux routes protégées

Pour accéder aux routes qui nécessitent une authentification, il faut inclure le token dans le header de la requête :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Exemple avec Postman

1. Copier le `access_token` reçu lors du login
2. Aller dans l'onglet **Authorization**
3. Type : **Bearer Token**
4. Coller le token

### Exemple avec cURL

```bash
curl -H "Authorization: Bearer eyJhbGci..." http://localhost:8000/users/me
```

### Code source — Extraction du token

```python
# core/dependencies.py
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    return user
```

---

## 8. Contrôle d'accès par rôle

Certaines routes sont accessibles uniquement à certains rôles. Le système utilise la dépendance `role_required()`.

### Comment ça marche

```python
# Dans les routes
@router.post("/events/")
def create_event(
    event: EventCreate,
    organizer: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    # Seuls les ORGANIZER et ADMIN arrivent ici
    # Les CLIENT reçoivent une erreur 403
    ...
```

### Réponse si rôle insuffisant (403 Forbidden)

```json
{
    "detail": "Accès refusé : rôle insuffisant"
}
```

### Tableau récapitulatif des accès

| Endpoint                  | CLIENT | ORGANIZER | ADMIN |
|---------------------------|--------|-----------|-------|
| `POST /auth/register`     | ✅ (public)| ✅ (public)| ✅ (public)|
| `POST /auth/login`        | ✅ (public)| ✅ (public)| ✅ (public)|
| `GET /users/me`           | ✅     | ✅        | ✅    |
| `GET /users/`             | ❌     | ❌        | ✅    |
| `PUT /users/{id}/role`    | ❌     | ❌        | ✅    |
| `GET /events/`            | ✅ (public)| ✅ (public)| ✅ (public)|
| `GET /events/{id}`        | ✅ (public)| ✅ (public)| ✅ (public)|
| `POST /events/`           | ❌     | ✅        | ✅    |
| `PUT /events/{id}`        | ❌     | ✅ (ses propres)| ✅ |
| `DELETE /events/{id}`     | ❌     | ✅ (ses propres)| ✅ |

---

## 9. Gestion des rôles par l'admin

Un admin peut modifier le rôle de n'importe quel utilisateur.

### Endpoint

```
PUT /users/{user_id}/role
```

### Corps de la requête

```json
{
    "role_name": "ORGANIZER"
}
```

### Exemple : Promouvoir un CLIENT en ORGANIZER

1. **Se connecter en tant qu'admin** (POST `/auth/login`)
2. **Récupérer la liste des users** (GET `/users/`) pour trouver le `user_id`
3. **Changer le rôle** (PUT `/users/3/role`) avec le body ci-dessus

### Réponse (200 OK)

```json
{
    "id": 3,
    "email": "organisateur@test.com",
    "role_id": 2,
    "role_name": "ORGANIZER"
}
```

> **Note** : Il n'y a pas d'endpoint pour créer un admin. Le premier admin doit être assigné manuellement via la base de données ou en utilisant le seed script puis en mettant à jour le rôle directement en SQL :
> ```sql
> UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN') WHERE email = 'admin@test.com';
> ```

---

## 10. Flux complet — Exemple pas à pas

Voici un scénario complet d'utilisation :

### Étape 1 : Initialiser les rôles

```bash
cd backend
python seed_roles.py
# → Rôle 'ADMIN' créé.
# → Rôle 'ORGANIZER' créé.
# → Rôle 'CLIENT' créé.
```

### Étape 2 : Lancer le serveur

```bash
python -m uvicorn app.main:app --reload
# → Uvicorn running on http://127.0.0.1:8000
```

### Étape 3 : Créer un compte

```
POST http://localhost:8000/auth/register
Body: {"email": "alice@test.com", "password": "secret123"}
→ 201 Created + token JWT (rôle = CLIENT)
```

### Étape 4 : Se connecter

```
POST http://localhost:8000/auth/login
Body: {"email": "alice@test.com", "password": "secret123"}
→ 200 OK + token JWT
```

### Étape 5 : Consulter son profil

```
GET http://localhost:8000/users/me
Header: Authorization: Bearer <token>
→ 200 OK : {"id": 1, "email": "alice@test.com", "role_id": 3, "role_name": "CLIENT"}
```

### Étape 6 : Promouvoir en admin (via SQL la première fois)

```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN') WHERE email = 'alice@test.com';
```

### Étape 7 : Se reconnecter pour obtenir un token admin

```
POST http://localhost:8000/auth/login
Body: {"email": "alice@test.com", "password": "secret123"}
→ Nouveau token avec role = ADMIN
```

### Étape 8 : Créer un autre utilisateur et le promouvoir organisateur

```
PUT http://localhost:8000/users/2/role
Header: Authorization: Bearer <admin_token>
Body: {"role_name": "ORGANIZER"}
→ 200 OK
```

### Étape 9 : L'organisateur crée un événement

```
POST http://localhost:8000/events/
Header: Authorization: Bearer <organizer_token>
Body: {
    "title": "Concert Jazz",
    "description": "Soirée jazz au centre-ville",
    "category": "Musique",
    "event_date": "2026-04-15T20:00:00"
}
→ 201 Created
```

---

## 11. Erreurs courantes et solutions

### "Token invalide ou expiré" (401)
- **Cause** : Token manquant, mal formé, ou expiré (> 60 min)
- **Solution** : Se reconnecter via `/auth/login` pour obtenir un nouveau token

### "Accès refusé : rôle insuffisant" (403)
- **Cause** : Votre rôle ne permet pas cette action
- **Solution** : Vérifier le rôle nécessaire dans le tableau d'accès (section 8)

### "Un compte avec cet email existe déjà" (400)
- **Cause** : Email déjà utilisé
- **Solution** : Utiliser un autre email ou se connecter

### "Email ou mot de passe incorrect" (401)
- **Cause** : Mauvais identifiants
- **Solution** : Vérifier l'email et le mot de passe

### Erreur passlib/bcrypt
- **Cause** : Incompatibilité entre bcrypt 5.x et passlib
- **Solution** : Utiliser bcrypt 4.0.1 (`pip install bcrypt==4.0.1`)

---

## 12. Sécurité — Bonnes pratiques

| Pratique                          | Implémentation                                |
|-----------------------------------|-----------------------------------------------|
| Mots de passe jamais en clair     | Hashage bcrypt via passlib                    |
| Tokens signés et temporaires      | JWT avec signature HS256, expire en 60 min    |
| Clé secrète externalisée          | Variable d'environnement `SECRET_KEY`         |
| Validation des entrées            | Pydantic vérifie format email, types, etc.    |
| Contrôle d'accès par rôle         | Middleware `role_required()` sur les routes   |
| Base de données credentials       | `.env` exclu du git via `.gitignore`          |

### Points d'amélioration futurs

- Ajouter un **refresh token** pour éviter de se reconnecter toutes les heures
- Implémenter un **rate limiting** sur `/auth/login` contre le brute-force
- Ajouter un **endpoint de logout** (blacklist de tokens)
- Valider la **complexité du mot de passe** (longueur min, caractères spéciaux)
- Utiliser **HTTPS** en production

---

*Document rédigé dans le cadre du Sprint 1 — Plateforme de vente de tickets d'événements*
