# 📋 Sprint 5 Backlog

## Sprint Goal
> Finaliser l'application avec l'intégration de l'IA de modération via Gemini, mettre à jour la dockerisation complète, rédiger les tests unitaires sur les modules critiques et préparer la livraison finale du projet.

**Durée** : 2 semaines  
**Total estimé** : 23 Story Points (~48h — 24h par personne)

---

## PB-19 & PB-20 : Intelligence Artificielle — Modération & Classification (10 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T6.01 | Intégration Gemini API : remplacement de l'OpenAI Moderation par Gemini pour la détection de contenu offensant (FR/EN) | Aymen | 5h | 🔲 To Do |
| T6.02 | Logique de masquage automatique : si Gemini détecte un contenu inapproprié, le commentaire est enregistré avec `is_hidden=true` | Aymen | 3h | 🔲 To Do |
| T6.03 | Fallback gracieux : si Gemini est indisponible, le commentaire est enregistré normalement avec un warning loggé | Aymen | 2h | 🔲 To Do |

---

## PB-22 : Mise à Jour Dockerisation (5 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T6.04 | Mise à jour des Dockerfiles backend et frontend avec les dernières dépendances de l'application | Aymen | 3h | 🔲 To Do |
| T6.05 | Mise à jour du `docker-compose.yml` : inclusion de tous les services (backend, frontend, MySQL, MongoDB) avec la dernière version de l'application | Aymen | 3h | 🔲 To Do |
| T6.06 | Validation du démarrage complet en une commande et documentation dans le README | Aymen | 2h | 🔲 To Do |

---

## PB-24 : Tests Unitaires (8 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T6.07 | Tests unitaires — Modération commentaires : création avec contenu offensant (masquage auto), création normale, règle un commentaire par user/event, suppression owner vs non-owner | Roua | 5h | 🔲 To Do |
| T6.08 | Tests unitaires — Event service : création, modification, suppression, contrôle d'accès organisateur, consultation publique | Roua | 5h | 🔲 To Do |
| T6.09 | Tests unitaires — Sécurité : génération et validation JWT, routes protégées sans token, accès refusé mauvais rôle, refresh token | Roua | 4h | 🔲 To Do |
| T6.10 | Rapport de couverture : exécuter les tests, générer le rapport de couverture et documenter les résultats dans le README | Equipe | 3h | 🔲 To Do |

---

## Documentation & Finalisation

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T6.11 | Mise à jour README final : instructions complètes de démarrage, variables d'environnement, architecture et captures d'écran | Roua | 3h | 🔲 To Do |
| T6.12 | Mise à jour collection Postman avec tous les endpoints finaux | Roua | 2h | 🔲 To Do |

---

## 📊 Sprint Burndown

```
Day 1:  ███████████████████████ 23 SP
Day 2:  █████████████████████   21 SP (Gemini API setup lancé)
Day 4:  █████████████████       17 SP (Gemini intégré + Docker mis à jour)
Day 6:  █████████████           13 SP (Tests commentaires + events rédigés)
Day 8:  ████████                 8 SP (Tests sécurité + couverture générée)
Day 9:  ████                     4 SP (Docs finalisées)
Day 10: ░                        0 SP ✅ (Sprint terminé)
```

---

## 📝 Daily Scrum Notes

### Day 2
- **Aymen** : Clé Gemini API récupérée et configurée dans `.env`. Appel Gemini implémenté dans `comment_service.py`.
- **Roua** : Structure des tests unitaires mise en place avec pytest. Premiers tests commentaires écrits.
- **Blocker** : À documenter en cours de sprint.

### Day 5
- **Aymen** : Fallback Gemini opérationnel. Dockerfiles et docker-compose mis à jour avec les dernières dépendances.
- **Roua** : Tests event service terminés. Tests sécurité JWT en cours.
- **Stuck** : À documenter en cours de sprint.

### Day 9
- **Aymen** : Validation docker-compose complet. README final rédigé.
- **Roua** : Rapport de couverture généré. Collection Postman mise à jour.

---

## ✅ Definition of Done (Sprint 6)

- [ ] Gemini API intégrée pour la modération automatique des commentaires (FR/EN).
- [ ] Fallback gracieux si Gemini est indisponible.
- [ ] docker-compose mis à jour et démarrage complet validé en une commande.
- [ ] Tests unitaires rédigés sur : modération commentaires, event service, sécurité JWT.
- [ ] Rapport de couverture de tests généré.
- [ ] README final complet avec instructions de démarrage.

---

## 🔄 Sprint Retrospective Matrix

| What went well? (Points positifs) | What could improve? (Axes d'amélioration) | Action Items (Actions correctives) |
|:-----------------------------------|:-------------------------------------------|:-----------------------------------|
| **IA modération opérationnelle** : Gemini détecte correctement les contenus offensants en FR et EN. | **Tests rédigés trop tard dans le projet** : Auraient dû être faits sprint par sprint. | **Intégrer les tests dès le Sprint 1** dans les prochains projets. |
| **Docker stable** : L'application démarre proprement en une commande sur les deux machines. | **Couverture partielle** : Certains cas limites non couverts faute de temps. | **Prioriser les cas limites critiques** (stock, paiement) en premier. |
| **Projet livrable complet** : Toutes les features Must livrées, bonus IA inclus. | **Documentation finale tardive** : README  mis à jour en fin de projet. | **Maintenir la documentation à jour à chaque sprint** dès le début. |
