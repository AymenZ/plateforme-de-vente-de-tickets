# 🔄 Sprint 2 — Retrospective

## Format : Start-Stop-Continue

---

## 🟢 START (Quoi commencer ?)

| ID | Suggestion | Proposed By | Priority |
|----|-----------|-------------|----------|
| 1 | Configurer CORS et les variables d'environnement frontend dès le Day 1. | Aymen | High |
| 2 | Préparer des données seed réalistes avant d'attaquer le design statique. | Roua | High |
| 3 | Définir les interfaces TypeScript (ou JSDoc) pour les réponses API. | Aymen | Medium |

### Selected for Next Sprint :
- [ ] Mettre en place Docker dès le début du Sprint 3 pour homogénéiser les environnements.
- [ ] Préparer la structure MongoDB avant de coder les routes commentaires.

---

## 🔴 STOP (What should we stop doing?)

| ID | Issue | Proposed By | Priority |
|----|-------|-------------|----------|
| 1 | Tester les liaisons fullstack uniquement en fin de sprint — trop de bugs découverts tard. | Aymen | High |
| 2 | Utiliser des données fictives trop simplistes qui ne couvrent pas les cas limites. | Roua | Medium |
| 3 | Laisser la configuration CORS et les variables d'environnement pour "plus tard". | Team | High |

### Agreed to Stop :
- [x] Arrêter de valider les pages statiques sans avoir vérifié leur compatibilité avec la structure de données API réelle.
- [ ] Arrêter de grouper tous les tests en fin de sprint.

---

## 🔵 CONTINUE (What should we keep doing?)

| ID | Good Practice | Proposed By | Notes |
|----|--------------|-------------|-------|
| 1 | Séparation design statique (Roua) / liaison backend (Aymen). | Team | Très efficace, livraison rapide sans blocage mutuel. |
| 2 | Context API pour la gestion de l'authentification. | Aymen | Solide, réutilisé sans modification dans tout le Frontend. |
| 3 | Mise à jour de la collection Postman à chaque nouvel endpoint. | Roua | Indispensable pour la coordination et les tests. |

---

## 📊 Team Health Check

| Area | Rating | Notes |
|------|--------|-------|
| Communication | ⭐⭐⭐⭐⭐ | Bonne coordination sur les interfaces JSON avant le codage. |
| Collaboration | ⭐⭐⭐⭐⭐ | Répartition statique/liaison très efficace. |
| Technical Practices | ⭐⭐⭐⭐☆ | CORS résolu rapidement, Axios bien configuré. |
| Work-Life Balance | ⭐⭐⭐⭐☆ | Sprint dense mais objectif atteint. |
| Planning Accuracy | ⭐⭐⭐⭐☆ | 13 points livrés comme prévu. |
| Code Quality | ⭐⭐⭐⭐☆ | Composants réutilisables bien structurés. |

---

## 🎯 Action Items (Sprint 3)

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Mettre en place Docker et docker-compose pour tous les services | Aymen | Début Sprint 3 | 🔲 Not Started |
| Configurer la connexion MongoDB dans FastAPI avant les routes commentaires | Roua | Début Sprint 3 | 🔲 Not Started |
| Préparer la structure de données pour les types de tickets | Roua | Début Sprint 3 | 🔲 Not Started |

---

## 📈 Previous Action Items Review (Sprint 1)

| Action from Sprint 1 | Owner | Status |
|----------------------|-------|--------|
| Créer la documentation des endpoints pour l'intégration Front | Aymen | ✅ Completed |
| Adopter une convention de nommage stricte pour les composants | Team | ✅ Completed |
| Créer le fichier `.gitignore` complet pour le Frontend | Aymen | ✅ Completed |
| Préparer les données Mock pour le catalogue statique | Roua | ✅ Completed |
| Configurer l'instance Axios globale | Aymen | ✅ Completed |

---

## 💬 Open Discussion Notes

- Le système de panier devra être réfléchi dès le Sprint 3 avant d'attaquer les commandes.
- On a décidé d'utiliser MongoDB pour les commentaires afin de garder MySQL propre pour les données critiques.
- La gestion des images d'événements sera traitée en Sprint 3 avec le stockage statique.

---

## 🏆 Kudos & Recognition

| Team Member | Recognition |
|-------------|-------------|
| **Roua** | Pour la qualité et la rapidité des pages statiques livrées en avance sur le planning. |
| **Aymen** | Pour la mise en place robuste du Context Auth et la liaison fullstack sans régression. |
