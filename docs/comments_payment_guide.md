# Guide Commentaires + Paiement Stripe

Ce document explique :
- comment fonctionne le module **Commentaires** (MongoDB)
- comment fonctionne le module **Paiement Stripe** (MySQL + Stripe)
- comment tester les deux modules de bout en bout

---

## 1) Vue d'ensemble

### Commentaires
- Stockage : MongoDB
- Base : `eventdb_comments`
- Collection : `comments`
- Front : section commentaires de la page événement
- Backend : routes FastAPI CRUD + règles de permission

### Paiement
- Stockage : MySQL (`orders`, `order_items`, `ticket_types`, `events`)
- Prestataire : Stripe Checkout
- Front : page panier + pages de retour paiement (`success` / `cancel`)
- Backend : création de session Stripe, webhook, synchronisation de session

---

## 2) Module Commentaires — Fonctionnement

### Schéma de données (MongoDB)
Un commentaire contient :
- `id` (ObjectId sérialisé)
- `event_id` (int)
- `user_id` (int)
- `user_email` (str)
- `rating` (1..5)
- `content` (1..2000)
- `created_at` (datetime)
- `updated_at` (datetime)
- `is_edited` (bool)

### Règles métier
- 1 utilisateur peut poster **1 commentaire max par événement**.
- Création : utilisateur connecté requis.
- Modification/Suppression : propriétaire du commentaire ou admin.
- Lister les commentaires d'un événement : public.

### Endpoints backend
- `GET /events/{event_id}/comments`
- `POST /events/{event_id}/comments`
- `GET /users/me/comments`
- `PUT /comments/{comment_id}`
- `DELETE /comments/{comment_id}`

### Côté frontend
- Chargement des commentaires par événement.
- Création, édition et suppression connectées au backend.
- Affichage des notes, moyenne, tri, états loading/erreur/succès.

---

## 3) Module Paiement Stripe — Fonctionnement

### Champs ajoutés sur les commandes (MySQL)
En plus des champs existants, une commande stocke :
- `payment_status` (`UNPAID`, `PENDING`, `PAID`, `FAILED`, `CANCELED`)
- `payment_provider` (`STRIPE`, `FREE`, `OFFLINE`)
- `payment_currency` (ex: `usd`)
- `stripe_session_id`
- `stripe_payment_intent_id`
- `paid_at`
- `updated_at`

### Cycle de vie d'une commande Stripe
1. L'utilisateur clique **Payer avec Stripe** depuis le panier.
2. Le backend crée une session Stripe via `POST /orders/cart/checkout-session`.
3. Le backend passe la commande en `PENDING_PAYMENT` + `payment_status=PENDING`.
4. Stripe redirige vers `/payment/success` ou `/payment/cancel`.
5. Le backend confirme le paiement par :
   - webhook Stripe `POST /payments/webhook`
   - ou synchronisation frontend `POST /payments/checkout-session/sync`
6. À confirmation :
   - commande -> `status=PAID`, `payment_status=PAID`
   - mise à jour stock tickets (`ticket_types.sold`)
   - mise à jour participants (`events.attendees`)

### Endpoints backend paiement
- `POST /orders/cart/checkout-session`
- `POST /payments/checkout-session/sync`
- `POST /payments/webhook` (hors Swagger)
- `GET /payments/health` (protégé)

### Frontend paiement
- Panier : redirection vers Stripe Checkout.
- Success page : synchronise la session puis affiche le résumé commande.
- Cancel page : permet de relancer le paiement.

---

## 4) Préparation environnement

## 4.1 Variables backend (.env)
Dans `backend/.env`, renseigner :

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd
FRONTEND_BASE_URL=http://localhost:5173
```

## 4.2 Dépendances
Depuis la racine du repo :

```bash
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
cd frontend
npm install
```

## 4.3 Migration DB paiement
Depuis `backend/` :

```bash
python migrate_order_payment_fields.py
```

---

## 5) Démarrage local

Ouvrir 3 terminaux.

### Terminal A — Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### Terminal B — Frontend
```bash
cd frontend
npm run dev
```

### Terminal C — Stripe CLI (webhook local)
```bash
stripe login
stripe listen --forward-to http://localhost:8000/payments/webhook
```

Copier le `whsec_...` affiché par Stripe CLI dans `STRIPE_WEBHOOK_SECRET`.

---

## 6) Tests Commentaires (end-to-end)

### 6.1 Via frontend
1. Se connecter avec un compte client.
2. Ouvrir un événement.
3. Publier un commentaire avec note + texte.
4. Vérifier l'affichage dans la liste.
5. Modifier puis supprimer le commentaire.

### 6.2 Via Swagger
1. Ouvrir `http://localhost:8000/docs`.
2. Authorize avec un compte.
3. Tester :
- `POST /events/{event_id}/comments`
- `GET /events/{event_id}/comments`
- `PUT /comments/{comment_id}`
- `DELETE /comments/{comment_id}`

### 6.3 Vérification MongoDB
Dans MongoDB Compass :
- URI : `mongodb://localhost:27017`
- DB : `eventdb_comments`
- Collection : `comments`

Filtre utile :
```json
{ "event_id": 5 }
```

Attendu : création, update (`is_edited=true`), suppression effective.

---

## 7) Tests Paiement Stripe (end-to-end)

### 7.1 Préparer un panier
1. Se connecter en client.
2. Ajouter 1 ou plusieurs tickets au panier.
3. Ouvrir la page panier.

### 7.2 Checkout
1. Cliquer **Payer avec Stripe**.
2. Vérifier la redirection Stripe Checkout.
3. Utiliser carte test Stripe :
- Numéro : `4242 4242 4242 4242`
- Date : n'importe quelle date future
- CVC : n'importe quel 3 chiffres
- Code postal : n'importe quelle valeur

### 7.3 Retour succès
1. Après paiement, Stripe redirige vers `/payment/success`.
2. La page synchronise la session (`/payments/checkout-session/sync`).
3. Vérifier :
- statut de paiement affiché `PAID`
- total + lignes de commande affichés

### 7.4 Retour annulation
1. Annuler depuis Stripe.
2. Vérifier la page `/payment/cancel`.
3. Cliquer sur reprise pour revenir au panier.

### 7.5 Vérification MySQL
Vérifier la commande et les impacts stock/capacité.

```sql
SELECT id, status, payment_status, payment_provider, total_amount, stripe_session_id, stripe_payment_intent_id, paid_at
FROM orders
ORDER BY id DESC
LIMIT 10;

SELECT id, order_id, ticket_type_id, quantity, subtotal
FROM order_items
ORDER BY id DESC
LIMIT 20;

SELECT id, name, quantity, sold
FROM ticket_types
ORDER BY id DESC
LIMIT 20;

SELECT id, title, attendees, capacity
FROM events
ORDER BY id DESC
LIMIT 20;
```

Attendu après paiement validé :
- `orders.status = PAID`
- `orders.payment_status = PAID`
- `ticket_types.sold` incrémenté
- `events.attendees` incrémenté

---

## 8) Dépannage rapide

### Commentaires
- `503 Service commentaires indisponible`
  - Vérifier MongoDB démarré + `MONGODB_URL`.
- `409 Vous avez déjà commenté cet événement`
  - Règle métier normale (1 commentaire par user/événement).

### Paiement
- `Configuration Stripe manquante (STRIPE_SECRET_KEY)`
  - Vérifier `STRIPE_SECRET_KEY` dans `.env`.
- Webhook non pris en compte
  - Vérifier Stripe CLI actif + `STRIPE_WEBHOOK_SECRET` correct.
- Paiement fait mais statut non mis à jour
  - Vérifier que la page success reçoit `session_id` et appelle `/payments/checkout-session/sync`.

---

## 9) Références techniques (code)

### Backend
- `backend/app/routes/comment_routes.py`
- `backend/app/services/comment_service.py`
- `backend/app/routes/order_routes.py`
- `backend/app/routes/payment_routes.py`
- `backend/app/services/payment_service.py`
- `backend/app/models/order.py`
- `backend/migrate_order_payment_fields.py`

### Frontend
- `frontend/src/components/CommentsSection.jsx`
- `frontend/src/pages/CartPage.jsx`
- `frontend/src/pages/PaymentSuccessPage.jsx`
- `frontend/src/pages/PaymentCancelPage.jsx`
- `frontend/src/context/CartContext.jsx`
- `frontend/src/services/api.js`

---

## 10) Checklist de validation sprint

- [ ] Commentaires CRUD fonctionnels et persistés en MongoDB
- [ ] Permissions commentaire respectées (owner/admin)
- [ ] Checkout Stripe redirige correctement
- [ ] Confirmation paiement met commande en `PAID`
- [ ] Stock et attendees mis à jour après paiement
- [ ] Pages success/cancel accessibles et lisibles
- [ ] Tests Swagger + Frontend + DB validés
