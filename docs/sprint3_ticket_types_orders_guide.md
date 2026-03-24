# Guide Sprint 3 - Ticket Types et Orders

Ce document explique la logique backend mise en place pour:
- les types de tickets (ticket_types)
- les commandes client (orders)
- la gestion de stock
- la structure base de donnees

## 1. Pourquoi ce changement

Avant, les tickets etaient stockes dans la colonne `events.tickets` en JSON texte.

Problemes:
- difficile a valider proprement
- difficile a mettre a jour de maniere concurrente
- difficile pour les commandes et la gestion du stock

Solution Sprint 3:
- normaliser les tickets dans une table relationnelle `ticket_types`
- ajouter `orders` et `order_items` pour gerer les achats

## 2. Modele de donnees

## 2.1 Table events

La table `events` garde les informations de l'evenement:
- titre, date, lieu, statut, capacite, attendees, etc.

La colonne legacy `tickets` peut encore exister en base apres migration, mais la logique backend active lit/ecrit via `ticket_types`.

## 2.2 Table ticket_types

Chaque ligne represente un type de ticket pour un evenement.

Champs principaux:
- `id`
- `event_id` (FK vers events.id)
- `name`
- `price`
- `quantity` (stock total)
- `sold` (quantite deja vendue)

Stock disponible calcule:
- disponible = `quantity - sold`

## 2.3 Table orders

Une commande appartient a un client (panier global multi-evenements).

Champs principaux:
- `id`
- `user_id` (FK vers users.id)
- `status` (`CART`, `CONFIRMED`, etc.)
- `total_amount`
- `created_at`

## 2.4 Table order_items

Detail des lignes de commande.

Champs principaux:
- `id`
- `order_id` (FK vers orders.id)
- `event_id` (FK vers events.id)
- `event_title` (snapshot)
- `ticket_type_id` (FK vers ticket_types.id)
- `ticket_name` (snapshot au moment de l'achat)
- `unit_price` (snapshot prix)
- `quantity`
- `subtotal`

Le fait de stocker `ticket_name` et `unit_price` dans `order_items` permet de conserver l'historique meme si le type de ticket change plus tard.

## 3. Flux Ticket Types

## 3.1 Creation / mise a jour par organisateur

Routes:
- `GET /events/{event_id}/tickets/` (public)
- `POST /events/{event_id}/tickets/` (ORGANIZER, ADMIN)
- `PUT /events/{event_id}/tickets/{ticket_id}` (ORGANIZER proprietaire, ADMIN)
- `DELETE /events/{event_id}/tickets/{ticket_id}` (ORGANIZER proprietaire, ADMIN)

Regles metier:
- un organisateur ne peut gerer que les tickets de ses propres evenements
- impossible de reduire `quantity` sous `sold`
- impossible de supprimer un ticket type deja vendu (`sold > 0`)

## 3.2 Migration des anciens tickets JSON

Script:
- `backend/migrate_tickets_to_ticket_types.py`

Ce script:
1. cree la table `ticket_types` si absente
2. lit les tickets JSON legacy depuis `events.tickets`
3. insere les lignes dans `ticket_types`
4. est idempotent (si deja migre pour un event, il skip)

Commande:
- `python migrate_tickets_to_ticket_types.py`

## 4. Flux Orders (commande)

## 4.1 Panier multi-evenements

Routes panier:
- `GET /orders/cart` (CLIENT, ADMIN)
- `POST /orders/cart/items` (CLIENT, ADMIN)
- `PUT /orders/cart/items/{item_id}` (CLIENT, ADMIN)
- `DELETE /orders/cart/items/{item_id}` (CLIENT, ADMIN)
- `POST /orders/cart/checkout` (CLIENT, ADMIN)

Payload ajout ligne panier:
```json
{
  "ticket_type_id": 2,
  "quantity": 2
}
```

Etapes metier checkout:
1. charger le panier `CART` du client
2. verifier qu'il contient des lignes
3. fusionner les quantites par `ticket_type_id`
4. locker les lignes tickets (`with_for_update`)
5. locker les evenements concernes (`with_for_update`)
6. verifier stock par type de ticket (`quantity - sold`)
7. verifier capacite de chaque evenement concerne
8. mettre a jour snapshots (`event_title`, `ticket_name`, `unit_price`)
9. incrementer `ticket_types.sold`
10. incrementer `events.attendees`
11. fixer `orders.total_amount` puis passer `status` a `CONFIRMED`
12. commit transaction

En cas d'erreur stock/capacite:
- rollback complet
- aucune vente partielle

## 4.2 Consultation des commandes

Routes:
- `GET /orders/my` : commandes confirmees du client connecte
- `GET /orders/{order_id}` : detail d'une commande (proprietaire ou ADMIN)

## 4.3 Migration des tables orders

Script:
- `backend/migrate_orders_tables.py`

Ce script cree:
- `orders`
- `order_items`

Commande:
- `python migrate_orders_tables.py`

## 5. Coherence transactionnelle et concurrence

Point cle:
- la creation de commande utilise des locks SQL (`with_for_update`) sur:
  - les lignes ticket_types concernees
  - les lignes evenements concernees

But:
- eviter la survente quand plusieurs clients commandent en meme temps

Exemple multi-evenements:
- panier contient des tickets evenement A + evenement B
- checkout client A et checkout client B arrivent en parallele

Avec lock + transaction:
- un checkout passe en premier
- le second relit l'etat apres commit et peut etre refuse (stock/capacite)

## 6. Fichiers backend concernes

Modeles:
- `backend/app/models/ticket_type.py`
- `backend/app/models/order.py`
- `backend/app/models/order_item.py`
- `backend/app/models/event.py`
- `backend/app/models/user.py`

Schemas:
- `backend/app/schemas/ticket_type.py`
- `backend/app/schemas/order.py`
- `backend/app/schemas/event.py`

Services:
- `backend/app/services/ticket_type_service.py`
- `backend/app/services/order_service.py`
- `backend/app/services/event_service.py`

Routes:
- `backend/app/routes/ticket_type_routes.py`
- `backend/app/routes/order_routes.py`

Migrations:
- `backend/migrate_tickets_to_ticket_types.py`
- `backend/migrate_orders_tables.py`

## 7. Notes pratiques

- Si certains ticket types ont `quantity = 0`, ils ne seront pas commandables tant que tu ne modifies pas la quantite.
- Tu peux garder la colonne legacy `events.tickets` temporairement pour transition.
- Une fois la migration validee, tu peux supprimer cette colonne pour finaliser la normalisation.
