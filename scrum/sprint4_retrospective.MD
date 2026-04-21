# 🔄 Sprint 4 — Retrospective

## Format : Start-Stop-Continue

---

## 🟢 START (Quoi commencer ?)

| ID | Suggestion | Proposed By | Priority |
|----|-----------|-------------|----------|
| 1 | Rédiger les tests unitaires en parallèle du développement, pas en fin de sprint. | Aymen | High |
| 2 | Penser responsive dès la création de chaque composant/page. | Roua | High |
| 3 | Mettre en place le pipeline CI/CD dès le début du Sprint 6 pour automatiser les tests. | Aymen | High |

### Selected for Next Sprint :
- [ ] Configurer GitHub Actions pour exécuter les tests automatiquement à chaque push.
- [ ] Choisir la plateforme de déploiement (Render, Railway, VPS) avant de coder le pipeline.

---

## 🔴 STOP (What should we stop doing?)

| ID | Issue | Proposed By | Priority |
|----|-------|-------------|----------|
| 1 | Regrouper tous les tests unitaires en fin de sprint — couverture insuffisante et corrections tardives. | Aymen | High |
| 2 | Appliquer le responsive en post-production sur des pages déjà finies — trop de retouches. | Roua | Medium |
| 3 | Laisser la documentation README sans les instructions d'installation des outils tiers (Stripe CLI). | Team | Medium |

### Agreed to Stop :
- [x] Arrêter de valider une tâche "Done" sans avoir testé sur mobile.
- [ ] Arrêter de regrouper la rédaction des tests en fin de sprint.

---

## 🔵 CONTINUE (What should we keep doing?)

| ID | Good Practice | Proposed By | Notes |
|----|--------------|-------------|-------|
| 1 | Attaquer la feature la plus risquée en Day 1 (Stripe). | Aymen | A évité le blocage classique de fin de sprint. |
| 2 | Séparation statique (Roua) / liaison backend (Aymen). | Team | Toujours aussi efficace, aucun conflit de code. |
| 3 | Mise à jour README à chaque fin de tâche backend. | Roua 

---

## 📊 Team Health Check

| Area | Rating | Notes |
|------|--------|-------|
| Communication | ⭐⭐⭐⭐⭐ | Coordination fluide sur le flow Stripe — problèmes résolus rapidement. |
| Collaboration | ⭐⭐⭐⭐⭐ | Répartition paiement/dashboards très efficace. |
| Technical Practices | ⭐⭐⭐⭐☆ | Webhook Stripe et QR codes bien maîtrisés. Tests à renforcer. |
| Work-Life Balance | ⭐⭐⭐☆☆ | Sprint combiné 4+5 chargé — 64h en 2 semaines. |
| Planning Accuracy | ⭐⭐⭐⭐☆ | 36 points livrés, tous les livrables atteints. |
| Code Quality | ⭐⭐⭐⭐☆ | Flow paiement solide, modération IA bien intégrée. |

---

## 🎯 Action Items (Sprint 6)

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Choisir la plateforme de déploiement et créer le compte | Aymen | Début Sprint 6 | 🔲 Not Started |
| Configurer GitHub Actions pour CI/CD | Aymen | Début Sprint 6 | 🔲 Not Started |
| Rédiger le guide utilisateur final | Roua | Milieu Sprint 6 | 🔲 Not Started |
| Préparer la présentation de soutenance | Equipe | Fin Sprint 6 | 🔲 Not Started |

---

## 📈 Previous Action Items Review (Sprint 3)

| Action from Sprint 3 | Owner | Status |
|----------------------|-------|--------|
| Créer le compte Stripe et récupérer les clés test dès le Day 1 | Aymen | ✅ Completed |
| Installer Stripe CLI pour les webhooks en local | Aymen | ✅ Completed |
| Préparer la structure de données pour les tickets générés post-paiement | Roua | ✅ Completed |

---

## 💬 Open Discussion Notes

- La modération IA via OpenAI Moderation API a été intégrée avec succès — les commentaires offensants sont automatiquement masqués.
- Le déploiement en ligne est la priorité absolue du Sprint 6 — avoir une URL publique est indispensable pour la soutenance.
- On envisage d'ajouter la validation de ticket par scan QR au Sprint 6 si le temps le permet.
- Le rapport final et la présentation de soutenance doivent être commencés dès la première semaine du Sprint 6.

---

## 🏆 Kudos & Recognition

| Team Member | Recognition |
|-------------|-------------|
| **Aymen** | Pour l'intégration complète du flow Stripe de bout en bout et la mise en place de la modération IA sur les commentaires. |
| **Roua** | Pour la livraison du dashboard admin complet et l'application du responsive sur l'ensemble des pages. |
