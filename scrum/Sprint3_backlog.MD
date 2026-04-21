# 📋 Sprint 3 Backlog

## Sprint Goal
> Conteneuriser l'application, intégrer MongoDB pour les commentaires, développer la gestion des types de tickets et la logique de commandes, créer les interfaces correspondantes et assurer la liaison fullstack.

**Durée** : 2 semaines  
**Total estimé** : 18 Story Points (~52h — 26h par personne)

---

## PB-22 : Infrastructure & DevOps (5 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T3.01 | Dockerisation des services : Dockerfiles backend/frontend et docker-compose orchestrant tous les services | Aymen | 7h | ✅ Done |
| T3.02 | Persistance & configuration : volumes Docker et variables d'environnement centralisées | Aymen | 3h | ✅ Done |

---

## PB-07 & PB-10 : Backend Tickets & Commandes (8 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T3.03 | Types de tickets : modèle de données, validation et routes CRUD protégées par rôle Organisateur | Roua | 5h | ✅ Done |
| T3.04 | Logique de commande : création de commande avec vérification de stock et mise à jour des quantités | Aymen | 7h | ✅ Done |

---

## PB-15 & PB-16 : Commentaires MongoDB (5 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T3.05 | Intégration MongoDB : connexion au backend et structure de stockage des commentaires | Roua | 4h | ✅ Done |
| T3.06 | Logique commentaires & avis : publication, consultation et suppression avec pagination | Roua | 4h | ✅ Done |

---

## Frontend & Liaison Fullstack

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T3.07 | Page commande (statique) : sélection de tickets et récapitulatif avec données fictives | Roua | 5h | ✅ Done |
| T3.08 | Section commentaires (statique) : formulaire et liste des avis dans la page détail événement | Roua | 4h | ✅ Done |
| T3.09 | Liaison commandes : connexion page commande aux API avec gestion des erreurs stock/auth | Aymen | 5h | ✅ Done |
| T3.10 | Liaison commentaires : affichage, soumission et suppression depuis l'interface | Aymen | 4h | ✅ Done |
| T3.11 | Tests & documentation : collection Postman, démarrage Docker et README mis à jour | Equipe | 4h | ✅ Done |

---

## 📊 Sprint Burndown

```
Day 1:  ██████████████████ 18 SP
Day 2:  ████████████████   16 SP (Docker setup lancé)
Day 4:  █████████████      13 SP (Docker fonctionnel, modèles tickets OK)
Day 6:  █████████          9 SP  (Commandes backend + MongoDB intégrés)
Day 8:  █████              5 SP  (Interfaces statiques livrées)
Day 10: ░                  0 SP ✅ (Liaisons fullstack et tests finis)
```

---

## 📝 Daily Scrum Notes

### Day 2
- **Aymen** : Dockerfiles backend et frontend créés. docker-compose en cours avec les 4 services.
- **Roua** : Modèle ticket_types défini et validé. Début des routes CRUD organisateur.
- **Blocker** : Conflit de ports entre MySQL local et MySQL Docker — résolu en changeant le port exposé.

### Day 5
- **Aymen** : Logique de commande implémentée avec gestion des stocks et transactions atomiques. Panier multi-événements décidé et implémenté.
- **Roua** : MongoDB connecté à FastAPI. Collection commentaires opérationnelle avec index.
- **Stuck** : Décision architecturale sur le panier — retenu comme persistant en base (statut CART) plutôt que côté frontend.

### Day 9
- **Aymen** : Liaisons fullstack commandes et commentaires terminées. Gestion des erreurs stock insuffisant et non authentifié opérationnelle.
- **Roua** : Interfaces statiques connectées. Section commentaires visible avec notes en étoiles.

---

## ✅ Definition of Done (Sprint 3)

- [x] Application démarrable en une commande via `docker-compose up`.
- [x] Gestion des types de tickets fonctionnelle côté organisateur.
- [x] Système de commandes avec vérification de stock en temps réel.
- [x] MongoDB intégré, commentaires publiables et consultables.
- [x] Page commande connectée au backend.
- [x] Section commentaires connectée à MongoDB.
- [x] Collection Postman mise à jour et README Docker rédigé.

---

## 🔄 Sprint Retrospective Matrix

| What went well? (Points positifs) | What could improve? (Axes d'amélioration) | Action Items (Actions correctives) |
|:-----------------------------------|:-------------------------------------------|:-----------------------------------|
| **Logique panier robuste** : Transactions atomiques évitent la survente, décision multi-événements bien prise. | **Conflit ports Docker** : Non anticipé, a bloqué le Day 1. | **Documenter les ports utilisés** dans le README dès le setup. |
| **MongoDB bien intégré** : Séparation propre des données structurées (MySQL) et non structurées (MongoDB). | **Tests Docker tardifs** : Le démarrage complet n'a été validé qu'en fin de sprint. | **Tester le `docker-compose up` dès que le fichier est écrit**. |
| **Interfaces statiques rapides** : Roua a livré les deux interfaces en avance, laissant du temps pour la liaison. | **Décision panier tardive** : La décision multi-événements aurait dû être prise en Sprint Planning. | **Valider les décisions architecturales majeures en Sprint Planning** et non en cours de sprint. |
