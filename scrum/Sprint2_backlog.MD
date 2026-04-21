# 📋 Sprint 2 Backlog

## Sprint Goal
> Créer l'interface web React et la connecter au backend pour une application utilisable de bout en bout.

**Durée** : 2 semaines  
**Total estimé** : 13 Story Points (~40h — 20h par personne)

---

## PB-03, PB-04 & PB-05 : Catalogue & Authentification Frontend (6 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T2.01 | Initialisation Frontend, routage et gestion globale de l'authentification (Context/JWT) | Aymen | 5h | ✅ Done |
| T2.02 | Pages Login, Register et espace Administration (gestion des rôles) | Aymen | 6h | ✅ Done |
| T2.05 | Extensions Backend V2 : pagination événements et endpoint `/me` | Aymen | 4h | ✅ Done |

---

## PB-04, PB-06 & PB-08 : Interface Événements & Organisateur (7 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T2.03 | Design statique — Catalogue (liste + filtres) et Détail événement | Roua | 7h | ✅ Done |
| T2.04 | Design statique — Dashboard organisateur et formulaire création événement | Roua | 7h | ✅ Done |
| T2.06 | Liaison Fullstack : connexion des pages statiques aux API réelles | Aymen | 8h | ✅ Done |
| T2.07 | Tests E2E manuels, mise à jour README et tutoriel d'intégration | Equipe | 3h | ✅ Done |

---

## 📊 Sprint Burndown

```
Day 1:  █████████████ 13 SP
Day 2:  ███████████   11 SP (Initialisation Frontend OK)
Day 4:  █████████      9 SP (Auth Frontend opérationnelle)
Day 6:  ██████         6 SP (Pages statiques catalogue terminées)
Day 8:  ███            3 SP (Dashboard organisateur + liaison partielle)
Day 10: ░              0 SP ✅ (Liaison complète & tests finis)
```

---

## 📝 Daily Scrum Notes

### Day 2
- **Aymen** : Projet React initialisé avec React Router. Context d'authentification fonctionnel avec stockage JWT.
- **Roua** : Début des maquettes statiques du catalogue avec données fictives.
- **Blocker** : Décision sur la gestion d'état — Context API retenu vs Redux (trop lourd pour le projet).

### Day 5
- **Aymen** : Pages Login et Register connectées au backend. Token JWT stocké et injecté dans les headers Axios.
- **Roua** : Pages Catalogue et Détail événement terminées en statique. Dashboard organisateur en cours.
- **Stuck** : CORS non configuré côté FastAPI — résolu en ajoutant le middleware `CORSMiddleware`.

### Day 9
- **Aymen** : Liaison fullstack complète. Les événements s'affichent depuis l'API. Création d'événement fonctionnelle depuis l'interface.
- **Roua** : Dashboard organisateur relié aux données réelles. Tests E2E réalisés sur les flux principaux.

---

## ✅ Definition of Done (Sprint 2)

- [x] Interface web fonctionnelle et navigable.
- [x] Authentification Frontend complète (Login, Register, déconnexion).
- [x] Catalogue d'événements connecté à l'API avec pagination.
- [x] Création d'événement possible depuis le dashboard organisateur.
- [x] Espace admin : modification de rôles opérationnelle.
- [x] Collection Postman mise à jour avec les nouveaux endpoints.

---

## 🔄 Sprint Retrospective Matrix

| What went well? (Points positifs) | What could improve? (Axes d'amélioration) | Action Items (Actions correctives) |
|:-----------------------------------|:-------------------------------------------|:-----------------------------------|
| **Séparation statique/liaison** : Roua sur le design, Aymen sur la liaison — zéro conflit. | **CORS non anticipé** : Bloquant lors de la première intégration. | **Configurer CORS dès le début** de chaque sprint backend. |
| **Context Auth solide** : Réutilisé partout sans refactoring. | **Données fictives insuffisantes** : Manque de variété pour tester les cas limites. | **Préparer des seeds de données** réalistes en début de sprint. |
| **Vitesse sur le design** : Pages statiques livrées en avance. | **Tests trop concentrés en fin de sprint** : Peu de temps pour corriger les bugs. | **Tester chaque liaison dès qu'elle est faite**, pas en batch. |
