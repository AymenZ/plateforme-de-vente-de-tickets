# 🔄 Sprint 3 — Retrospective

## Format : Start-Stop-Continue

---

## 🟢 START (Quoi commencer ?)

| ID | Suggestion | Proposed By | Priority |
|----|-----------|-------------|----------|
| 1 | Valider les décisions architecturales majeures en Sprint Planning avant de coder. | Aymen | High |
| 2 | Documenter les ports et services dans le README dès le premier jour du sprint. | Roua | High |
| 3 | Intégrer l'OpenAI Moderation API pour la détection automatique des commentaires offensants. | Aymen | Medium |

### Selected for Next Sprint :
- [ ] Attaquer Stripe dès le Day 1 — ne pas laisser l'intégration paiement pour la fin.
- [ ] Préparer la structure de données tickets (pour génération QR) avant le design des pages.

---

## 🔴 STOP (What should we stop doing?)

| ID | Issue | Proposed By | Priority |
|----|-------|-------------|----------|
| 1 | Prendre des décisions architecturales importantes en cours de sprint sans concertation préalable. | Team | High |
| 2 | Tester le démarrage Docker complet uniquement en fin de sprint. | Aymen | High |
| 3 | Laisser des variables d'environnement non documentées — confusions entre membres. | Roua | Medium |

### Agreed to Stop :
- [x] Arrêter de reporter les tests d'intégration Docker à la dernière journée.
- [ ] Arrêter de coder des features sans avoir validé la structure de données en amont.

---

## 🔵 CONTINUE (What should we keep doing?)

| ID | Good Practice | Proposed By | Notes |
|----|--------------|-------------|-------|
| 1 | Interfaces statiques d'abord, liaison ensuite — séparation claire du travail. | Team | Zéro conflit, livraison fluide. |
| 2 | Transactions atomiques sur les opérations critiques (stock, commandes). | Aymen | Indispensable pour éviter la survente. |
| 3 | Mise à jour continue de la collection Postman à chaque nouvel endpoint. | Roua | Facilite les tests et la coordination. |

---

## 📊 Team Health Check

| Area | Rating | Notes |
|------|--------|-------|
| Communication | ⭐⭐⭐⭐⭐ | Décision panier tranchée rapidement malgré la complexité. |
| Collaboration | ⭐⭐⭐⭐⭐ | Bonne répartition infra (Aymen) / données et UI (Roua). |
| Technical Practices | ⭐⭐⭐⭐☆ | Docker maîtrisé, MongoDB bien intégré. |
| Work-Life Balance | ⭐⭐⭐⭐☆ | Sprint chargé (52h) mais objectifs atteints. |
| Planning Accuracy | ⭐⭐⭐⭐☆ | 18 points livrés, quelques ajustements en cours de sprint. |
| Code Quality | ⭐⭐⭐⭐⭐ | Logique transactionnelle solide, séparation MySQL/MongoDB propre. |

---

## 🎯 Action Items (Sprint 4+5)

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Créer le compte Stripe et récupérer les clés test dès le Day 1 | Aymen | Début Sprint 4 | 🔲 Not Started |
| Installer Stripe CLI pour les webhooks en local | Aymen | Début Sprint 4 | 🔲 Not Started |
| Préparer la structure de données pour les tickets générés post-paiement | Roua | Début Sprint 4 | 🔲 Not Started |

---

## 📈 Previous Action Items Review (Sprint 2)

| Action from Sprint 2 | Owner | Status |
|----------------------|-------|--------|
| Mettre en place Docker et docker-compose | Aymen | ✅ Completed |
| Configurer la connexion MongoDB dans FastAPI | Roua | ✅ Completed |
| Préparer la structure de données pour les types de tickets | Roua | ✅ Completed |

---

## 💬 Open Discussion Notes

- La modération des commentaires par IA (OpenAI Moderation API) a été identifiée comme un bonus réalisable au Sprint 4+5.
- La génération de QR codes devra utiliser une librairie Python légère compatible avec Docker.
- On envisage d'ajouter un badge "Admin" sur les commentaires postés par un administrateur.

---

## 🏆 Kudos & Recognition

| Team Member | Recognition |
|-------------|-------------|
| **Aymen** | Pour la conception et l'implémentation du système de panier multi-événements avec transactions atomiques. |
| **Roua** | Pour l'intégration propre de MongoDB et la livraison rapide des interfaces statiques. |
