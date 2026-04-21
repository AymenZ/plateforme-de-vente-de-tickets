# Event Ticket Platform

Plateforme full-stack de vente de tickets pour des evenements (concerts, theatre, etc.) avec:
- authentification OAuth2/JWT,
- gestion multi-roles (ADMIN, ORGANIZER, CLIENT),
- billetterie et panier multi-evenements,
- paiement Stripe,
- dashboards admin/organisateur,
- commentaires avec moderation IA (Gemini) + moderation admin.

## Sommaire

- Vue d'ensemble
- Stack technique
- Architecture
- Fonctionnalites principales
- Authentification OAuth2 / JWT
- Systeme de billetterie
- Integration Stripe
- Dashboards
- Commentaires et moderation IA
- Structure du projet
- Demarrage rapide (Docker Compose - 1 seule commande)
- Demarrage local (sans Docker)
- Endpoints API importants
- Variables d'environnement
- Troubleshooting
- Documentation complementaire

## Vue d'ensemble

Le projet est decoupe en 2 applications:
- Backend FastAPI (API REST, logique metier, SQL + MongoDB).
- Frontend React/Vite (catalogue, detail evenement, panier, paiement, dashboards).

Stockage:
- MySQL pour utilisateurs, roles, evenements, commandes, tickets.
- MongoDB pour les commentaires et la moderation.

## Stack technique

### Backend

- Python 3.11
- FastAPI
- SQLAlchemy + PyMySQL
- Pydantic
- jose + passlib (JWT + hash mots de passe)
- Stripe SDK
- PyMongo (commentaires)

### Frontend

- React 18
- Vite 7
- Axios
- React Router
- React Icons

### Infra / DevOps

- Docker + Docker Compose
- Nginx (serveur frontend en production)
- MySQL 8
- MongoDB 7

## Architecture

```text
Frontend (React + Nginx)  --->  Backend (FastAPI)
																		 |
																		 +--> MySQL (users, events, orders, tickets)
																		 |
																		 +--> MongoDB (comments moderation)
																		 |
																		 +--> Stripe Checkout / Webhooks
																		 |
																		 +--> Gemini API (AI moderation)
```

## Fonctionnalites principales

- Authentification: inscription/connexion, token JWT, routes protegees par role.
- Catalogue: listing des evenements publies et page detail.
- Organisateur: creation/modification/suppression des evenements, stats de performance.
- Admin: gestion utilisateurs, moderation commentaires, gestion statut evenement (Publie/Depublie).
- Billetterie: panier, quantites, verification stock/capacite, tickets apres paiement.
- Paiement: session Stripe Checkout, synchro session success, webhook backend.
- Commentaires: CRUD cote utilisateur, moderation auto IA + moderation manuelle admin.

## Authentification OAuth2 / JWT

Le backend expose 3 endpoints auth:
- POST /auth/register
- POST /auth/login
- POST /auth/token (flux OAuth2PasswordBearer pour Swagger)

Principes:
- Le token JWT contient user_id et expiration.
- Le frontend stocke access_token dans localStorage.
- Axios ajoute automatiquement Authorization: Bearer <token> sur les requetes.
- Les dependances backend valident token et role:
	- get_current_user
	- role_required(...)
	- get_optional_current_user (utile pour endpoints publics enrichis)

## Systeme de billetterie

Flux global:
- Un utilisateur ajoute des lignes dans son panier (Order status = CART).
- Chaque ligne reference un ticket_type (nom, prix, quantity, sold).
- Au checkout, le backend verifie:
	- disponibilite du stock (quantity - sold),
	- capacite evenement,
	- coherence des prix/total.
- Paiement confirme -> commande PAID + generation/reconciliation tickets QR.

Points importants:
- Gestion multi-evenements dans un meme panier.
- Protection contre sur-vente via verrous DB pendant la confirmation paiement.
- Endpoint verification QR: GET /tickets/verify/{ticket_code}.

## Integration Stripe

Endpoints principaux:
- POST /orders/cart/checkout-session
- POST /payments/checkout-session/sync
- POST /payments/webhook

Comportement:
- Le backend cree une session Stripe Checkout a partir du panier.
- Le frontend redirige vers stripe checkout_url.
- Au retour success, le frontend synchronise la session.
- Le webhook securise la confirmation serveur->serveur.
- La commande passe en PAID uniquement apres confirmation reelle.

Variables requises:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_CURRENCY

## Dashboards

### Dashboard Organisateur

- KPIs: revenus, tickets vendus, commentaires, note moyenne.
- Filtres de statut (Publie, Brouillon, Termine, Depublie).
- Apercu inline d'un evenement + commentaires sur la meme page.
- Verrou edition: un evenement depublie ne peut pas etre modifie par l'organisateur.

### Dashboard Admin

- Gestion des utilisateurs et roles.
- Gestion de statut des evenements (toggle Publie/Depublie).
- Moderation commentaires avec provenance:
	- Masque par IA (langage offensant)
	- Masque par admin

## Commentaires et moderation IA

Stockage commentaires:
- MongoDB, collection comments.

Moderation IA:
- Provider: Gemini (model par defaut: gemini-2.5-flash).
- A la creation d'un commentaire, le backend appelle Gemini.
- Si contenu offensant detecte:
	- is_hidden = true
	- hidden_by = AI
	- hidden_reason = offensive_language

Moderation admin:
- Endpoint toggle hide:
	- PUT /comments/{comment_id}/hide
- Quand admin masque:
	- hidden_by = ADMIN
	- hidden_reason = admin_action

Visibilite:
- Utilisateur normal: ne voit pas les commentaires masques.
- Admin authentifie: voit aussi les commentaires masques.

## Structure du projet

```text
event-ticket-platform/
	backend/
		app/
			core/
			models/
			routes/
			schemas/
			services/
		Dockerfile
	frontend/
		src/
			components/
			pages/
			services/
			styles/
		Dockerfile
	docs/
	docker-compose.yml
	.env.example
```

## Demarrage rapide (Docker Compose - 1 seule commande)

Prerequis:
- Docker Desktop (daemon actif)

1. Depuis la racine du projet, copier le template d'environnement:

```powershell
Copy-Item .env.example .env
```

2. Mettre a jour au minimum dans .env:
- SECRET_KEY
- STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (si paiement Stripe actif)
- APP_GEMINI_API_KEY (si moderation IA active)

3. Lancer toute la stack:

```bash
docker compose up --build -d
```

Services exposes:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- MySQL host: localhost:3307
- MongoDB host: localhost:27018

Notes:
- Le backend seed automatiquement les roles (AUTO_SEED=true).
- Pour creer des comptes de demo:

```bash
docker compose exec backend python seed_all.py
```

Arret:

```bash
docker compose down
```

Arret + suppression volumes DB:

```bash
docker compose down -v
```

## Demarrage local (sans Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed_roles.py
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Si vous utilisez Stripe webhook en local:

```bash
stripe listen --forward-to http://localhost:8000/payments/webhook
```
### Tests unitaire
cd backend
python -m pytest backend/tests -q
## Endpoints API importants

Auth:
- POST /auth/register
- POST /auth/login
- POST /auth/token

Utilisateurs:
- GET /users/me
- GET /users/
- PUT /users/{id}/role

Evenements:
- GET /events/
- POST /events/
- GET /events/my
- GET /events/my/stats
- PATCH /events/admin/{event_id}/toggle-status

Commentaires:
- GET /events/{event_id}/comments
- POST /events/{event_id}/comments
- GET /comments/admin/all
- PUT /comments/{comment_id}/hide

Commandes / Paiement:
- GET /orders/cart
- POST /orders/cart/items
- POST /orders/cart/checkout-session
- POST /payments/checkout-session/sync
- POST /payments/webhook

Tickets:
- GET /tickets/my
- GET /tickets/order/{order_id}
- GET /tickets/verify/{ticket_code}

## Variables d'environnement

Reference complete:
- .env.example (racine)

Variables backend les plus importantes:
- DATABASE_URL
- SECRET_KEY
- MONGODB_URL
- MONGODB_DB_NAME
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_CURRENCY
- FRONTEND_BASE_URL
- BACKEND_BASE_URL
- APP_GEMINI_API_KEY
- APP_GEMINI_MODEL (defaut: gemini-2.5-flash)
- APP_GEMINI_ENABLED
- APP_GEMINI_ENDPOINT_BASE

## Troubleshooting

- 401 Unauthorized:
	- token expire ou manquant; reconnectez-vous.
- 503 Service commentaires indisponible:
	- verifier MongoDB et MONGODB_URL.
- Erreurs Stripe:
	- verifier STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET.
- Docker compose build KO:
	- verifier que Docker Desktop est demarre.

## Documentation complementaire

Voir le dossier docs/:
- docs/run_and_test_quick_guide.md
- docs/comments_payment_guide.md
- docs/comments_swagger_postman_guide.md
- docs/test_fullstack_guide.md

## Remarque securite

Ne committez jamais de cles reelles (Stripe, Gemini, JWT secret) dans Git.
Si des cles ont ete exposees precedemment, faites une rotation immediate.

