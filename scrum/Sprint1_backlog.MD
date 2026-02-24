# 📋 Sprint 1 Backlog

## Sprint Goal
> Créer un serveur backend fonctionnel avec inscription, connexion et gestion basique des événements.

**Durée** : 2 semaines  
**Total estimé** : 16 Story Points (~40h — 20h par personne)

---

## PB-01, PB-02 & PB-04 : Système d'Identité & Sécurité (8 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T1.01 | Setup initial, config MySQL et Architecture | Aymen | 3h | ✅ Done |
| T1.03 | Modèle User, Service et Logique de Hashage | Aymen | 4h | ✅ Done |
| T1.04 | Routes Login/Register et Schémas de validation | Aymen | 4h | ✅ Done |
| T1.05 | Middleware JWT, gestion des rôles et sécurité | Aymen | 5h | ✅ Done |

---

## PB-05 & PB-08 : Moteur de Gestion d'Événements (8 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T1.06 | Modèle Event, Schéma de validation et Service | Roua | 5h | ✅ Done |
| T1.07 | Routes CRUD (Create, Read, Update, Delete) | Roua | 4h | ✅ Done |
| T1.08 | Tests unitaires/manuels des routes Event | Roua | 3h | ✅ Done |
| T1.09 | Collection Postman & Documentation technique | Equipe | 4h | ✅ Done |

---

## 📊 Sprint Burndown

```
Day 1:  ████████████████ 16 SP
Day 2:  ██████████████   14 SP (Modèles définis)
Day 4:  ██████████       10 SP (Auth & Events de base OK)
Day 6:  ████████          8 SP (JWT middleware terminé)
Day 8:  ████              4 SP (CRUD complet & Sécurisé)
Day 9:  ░                 0 SP ✅ (Tests & Docs finis)
```

---

## 📝 Daily Scrum Notes

### Day 2
- **Aymen** : Modèle User terminé avec gestion des rôles (Admin/Org/Client).
- **Roua** : Schéma de base de données validé, début du Service Event.
- **Blocker** : Discussion sur la structure du dossier `services/` vs `controllers/` (tranché pour une séparation nette).

### Day 5
- **Aymen** : Routes Login/Register fonctionnelles. Hashage Bcrypt opérationnel.
- **Roua** : CRUD Event terminé. Les organisateurs peuvent créer des événements en base.
- **Stuck** : Erreur Git lors de la fusion des deux branches (résolu avec `git pull --rebase`).

### Day 8
- **Aymen** : Middleware de sécurité ajouté : seules les routes publiques sont accessibles sans token.
- **Roua** : Tests Postman terminés. Documentation des routes exportée pour le Sprint 2.

---

## ✅ Definition of Done (Sprint 1)

- [x] Code métier (Services/Routes) testé et sans erreur.
- [x] Authentification par token JWT fonctionnelle.
- [x] CRUD Événement complet (Modèle, Schéma, Routes).
- [x] Base de données MySQL mise à jour via les scripts.
- [x] Collection Postman partagée entre les membres.
---

## 🔄 Sprint Retrospective Matrix

| What went well? (Points positifs) | What could improve? (Axes d'amélioration) | Action Items (Actions correctives) |
|:-----------------------------------|:-------------------------------------------|:-----------------------------------|
| **Séparation claire des domaines** : Pas de conflit de code sur les services. | **Coordination Git initiale** : Erreurs de push sur la branche main. | **Utiliser des branches séparées** par feature (`feature/auth`, `feature/events`). |
| **Qualité du code** : Middleware de sécurité robuste et JWT opérationnel. | **Documentation tardive** : README et collection Postman faits en fin de sprint. | **Commenter le code en temps réel** et noter les endpoints au fur et à mesure. |
| **Rapidité de Roua sur le CRUD** : Modèle et routes finis en avance. | **Gestion des erreurs PowerShell** : Confusion entre commandes Linux et Windows. | **Créer un mémo des commandes Windows** (voir ci-dessous). |

---