# 🔄 Sprint 5 — Retrospective

## Format : Start-Stop-Continue

---

## 🟢 START (Quoi commencer ?)

| ID | Suggestion | Proposed By | Priority |
|----|-----------|-------------|----------|
| 1 | Rédiger les tests unitaires sprint par sprint dès le début — ne pas tout laisser pour le dernier sprint. | Aymen | High |
| 2 | Maintenir le README et la collection Postman à jour après chaque tâche backend. | Roua | High |
| 3 | Valider le docker-compose après chaque ajout de service ou dépendance majeure. | Aymen | Medium |

### Selected for Next Sprint :
- N/A — dernier sprint du projet.

---

## 🔴 STOP (What should we stop doing?)

| ID | Issue | Proposed By | Priority |
|----|-------|-------------|----------|
| 1 | Reporter les tests unitaires au dernier sprint — couverture insuffisante et corrections tardives. | Team | High |
| 2 | Mettre à jour la documentation uniquement en fin de projet. | Roua | High |
| 3 | Ajouter des dépendances sans mettre à jour les Dockerfiles immédiatement. | Aymen | Medium |

### Agreed to Stop :
- [x] Arrêter de valider une feature sans test associé dans les futurs projets.
- [x] Arrêter de laisser le docker-compose sans validation après chaque changement majeur.

---

## 🔵 CONTINUE (What should we keep doing?)

| ID | Good Practice | Proposed By | Notes |
|----|--------------|-------------|-------|
| 1 | Fallback gracieux sur les API externes (Gemini, Stripe) — ne jamais bloquer l'utilisateur. | Aymen | Pattern appliqué sur toutes les intégrations externes du projet. |
| 2 | Séparation claire des responsabilités Backend (Aymen) / Tests & Docs (Roua). | Team | A permis de livrer sans blocage mutuel jusqu'au bout. |
| 3 | Commits atomiques et descriptifs sur chaque branche feature. | Team | Facilite les reviews et le suivi de l'avancement. |

---

## 📊 Team Health Check

| Area | Rating | Notes |
|------|--------|-------|
| Communication | ⭐⭐⭐⭐⭐ | Coordination fluide jusqu'à la fin du projet. |
| Collaboration | ⭐⭐⭐⭐⭐ | Répartition IA/Tests claire et efficace. |
| Technical Practices | ⭐⭐⭐⭐☆ | Tests bien structurés, couverture à améliorer sur les cas limites. |
| Work-Life Balance | ⭐⭐⭐⭐☆ | Sprint final dense mais gérable. |
| Planning Accuracy | ⭐⭐⭐⭐☆ | 23 points livrés, tous les livrables atteints. |
| Code Quality | ⭐⭐⭐⭐⭐ | Codebase propre, modulaire et documentée à la livraison. |

---

## 🎯 Action Items (Post-Projet)

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Préparer la présentation de soutenance | Equipe | Avant soutenance | 🔲 Not Started |
| Rédiger le rapport final du projet | Equipe | Avant soutenance | 🔲 Not Started |
| Archiver le dépôt Git proprement (tags, branches nettoyées) | Aymen | Avant soutenance | 🔲 Not Started |

---

## 📈 Previous Action Items Review (Sprint 4+5)

| Action from Sprint 4+5 | Owner | Status |
|------------------------|-------|--------|
| Configurer GitHub Actions pour CI/CD | Aymen | ✅ Completed |
| Rédiger le guide utilisateur final | Roua | ✅ Completed |
| Choisir la plateforme de déploiement | Aymen | ✅ Completed |
| Préparer la présentation de soutenance | Equipe | 🔄 En cours |

---

## 💬 Open Discussion Notes

- Gemini s'est avéré plus flexible qu'OpenAI Moderation pour le support multilingue FR/EN sans configuration supplémentaire.
- La couverture de tests atteinte couvre les modules critiques (modération, events, sécurité) — suffisant pour la soutenance.
- Le docker-compose final démarre l'ensemble de l'application en une commande sur les deux postes de l'équipe — validé.
- Pour un futur projet, on partirait directement avec une architecture testée dès le Sprint 1 et des tests écrits en parallèle du code.

---

## 🏆 Kudos & Recognition

| Team Member | Recognition |
|-------------|-------------|
| **Aymen** | Pour l'intégration complète de Gemini API avec fallback gracieux et la mise à jour Docker stable sur l'ensemble du projet. |
| **Roua** | Pour la rédaction des tests unitaires sur les trois modules critiques et la finalisation de la documentation complète du projet. |

---

## 🎓 Bilan Global du Projet

| Sprint | Points livrés | Objectif atteint |
|--------|--------------|-----------------|
| Phase 0 | Setup complet | ✅ |
| Sprint 1 | 16 SP | ✅ Backend de base |
| Sprint 2 | 13 SP | ✅ Frontend + liaison |
| Sprint 3 | 18 SP | ✅ Docker + MongoDB + Commandes |
| Sprint 4+5 | 36 SP | ✅ Stripe + QR + Dashboards |
| Sprint 6 | 23 SP | ✅ IA + Tests + Finalisation |
| **Total** | **106 SP** | ✅ **Projet livré complet** |
