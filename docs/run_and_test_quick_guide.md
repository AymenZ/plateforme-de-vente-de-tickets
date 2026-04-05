# Guide Rapide - Lancement, Comptes et Tests par Iteration

Ce document donne une version simple pour:
- lancer l'application
- utiliser les comptes de test
- verifier les fonctionnalites a chaque etape d'avancement

## 1) Lancer le projet

## Option A - Local (recommande pour dev)

Prerequis:
- MySQL demarre
- Base eventdb creee
- Python 3.10+
- Node 18+

### Etape 1 - Backend

Depuis backend:

```bash
pip install -r requirements.txt
python seed_roles.py
python seed_users.py
uvicorn app.main:app --reload
```

Backend:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

### Etape 2 - Frontend

Depuis frontend:

```bash
npm install
npm run dev
```

Frontend:
- http://localhost:5173

## Option B - Docker

Depuis la racine du projet:

```bash
docker compose up --build -d
docker compose exec backend python seed_all.py
```

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- MySQL expose local: 3307

## 2) Comptes de test disponibles

Comptes crees par seed_users.py / seed_all.py:

- admin@eventhub.tn / test123 (ADMIN)
- org@eventhub.tn / test123 (ORGANIZER)
- client@eventhub.tn / test123 (CLIENT)
- client2@eventhub.tn / test123 (CLIENT)

## 3) Conseils importants avant test

- Si tu testes sur une base ancienne, execute les migrations Sprint 3 selon besoin:

```bash
cd backend
python migrate_orders_tables.py
python migrate_tickets_to_ticket_types.py
```

- Si ta base est toute nouvelle (tables recreees depuis les modeles), la migration des anciens tickets JSON n'est pas obligatoire.
- Le script seed_events.py est base sur l'ancien format tickets JSON et peut ne pas correspondre au nouveau modele Ticket Types. Pour eviter les blocages, cree les evenements via l'interface organisateur.
- Si tu modifies roles/tokens en base, reconnecte-toi pour regenerer un token JWT propre.

## 4) Checklist de test par iteration

## Iteration 1 - Auth et roles

Objectif: valider login/register + protections de routes.

A verifier:
- Login admin redirige vers /admin
- Login client redirige vers /
- Register cree un compte CLIENT
- /users/me retourne le bon role
- Admin peut changer le role d'un utilisateur

## Iteration 2 - Evenements et dashboard organisateur

Objectif: valider CRUD evenements depuis frontend + API.

A verifier:
- Organizer voit son dashboard
- Creation evenement fonctionne (avec statut Brouillon ou Publie)
- Modification/Suppression evenement fonctionnent
- /events/my retourne uniquement les events de l'organizer connecte
- Le detail evenement affiche correctement date, lieu, tickets

## Iteration 3 - Ticket Types et panier multi-evenements

Objectif: valider logique stock + panier + checkout.

A verifier:
- Un evenement expose ses ticket types
- Client ajoute plusieurs tickets de plusieurs evenements dans le meme panier
- /orders/cart contient bien des lignes multi-evenements
- Update quantite dans panier fonctionne
- Delete ligne panier fonctionne
- Checkout valide:
  - incremente ticket_types.sold
  - incremente events.attendees
  - passe la commande CART en CONFIRMED
- En cas de stock insuffisant ou capacite depassee:
  - checkout refuse
  - aucune vente partielle

## 5) URLs utiles

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Login: http://localhost:5173/login
- Register: http://localhost:5173/register
- Dashboard organizer: http://localhost:5173/dashboard
- Panier client: http://localhost:5173/cart

## 6) Depannage rapide

- Erreur 401: reconnecte-toi
- Erreur CORS: verifier backend lance sur 8000 et frontend sur 5173
- Panier vide alors que connecte: verifier role client/admin et endpoint /orders/cart
- Checkout refuse: verifier stock restant (quantity - sold) et capacite evenement
