# 📋 Sprint 4 Backlog

## Sprint Goal
> Intégrer Stripe pour le paiement en ligne, générer des tickets avec QR codes, construire les dashboards organisateur et admin, rendre l'interface responsive et renforcer la sécurité de l'application.

**Durée** : 2 semaines  
**Total estimé** : 36 Story Points (~64h — 32h par personne)

> ⚠️ **Priorité absolue** : Attaquer Stripe dès le Day 1 — ne pas laisser l'intégration paiement pour la fin du sprint.

---

## PB-11, PB-12 & PB-13 : Paiement Stripe & Billetterie QR (15 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T45.01 | Intégration paiement Stripe : session de paiement, webhook de confirmation et mise à jour du statut de commande | Aymen | 8h | ✅ Done |
| T45.02 | Génération des tickets et QR codes après confirmation du paiement | Aymen | 5h | ✅ Done |
| T45.06 | Page paiement et confirmation de commande (statique) | Roua | 4h | ✅ Done |
| T45.07 | Page affichage des tickets avec QR code et historique des commandes (statique) | Roua | 5h | ✅ Done |
| T45.11 | Liaison paiement et tickets : du checkout Stripe jusqu'à l'affichage du QR code | Aymen | 6h | ✅ Done |

---

## PB-09, PB-17 & PB-18 : Dashboards & Administration (11 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T45.03 | Statistiques de ventes par événement pour les organisateurs | Aymen | 4h | ✅ Done |
| T45.05 | Routes admin : gestion des utilisateurs et modération des commentaires | Roua | 4h | ✅ Done |
| T45.08 | Dashboard organisateur avec graphiques de ventes et statistiques par événement (statique) | Roua | 6h | ✅ Done |
| T45.09 | Page admin : gestion des utilisateurs et modération des commentaires (statique) | Roua | 4h | ✅ Done |
| T45.12 | Liaison dashboards et admin aux API réelles | Aymen | 5h | ✅ Done |

---

## PB-03, PB-27 & PB-24 : Sécurité, Responsive & Tests (10 SP)

| Task ID | Task Description | Assignee | Estimate | Status |
|---------|-----------------|----------|----------|--------|
| T45.10 | Adaptation responsive de l'ensemble des pages sur mobile | Roua | 5h | ✅ Done |
| T45.13 | Tests unitaires sur la logique critique, mise à jour Postman et README | Equipe | 4h | ✅ Done |

---

## 📊 Sprint Burndown

```
Day 1:  ████████████████████████████████████ 36 SP
Day 2:  ████████████████████████████████     32 SP (Stripe setup + clés configurées)
Day 4:  ████████████████████████████         28 SP (Session paiement fonctionnelle)
Day 6:  ████████████████████                 20 SP (QR codes + webhook OK)
Day 8:  █████████████                        13 SP (Dashboards statiques livrés)
Day 9:  ████                                  4 SP (Liaisons fullstack terminées)
Day 10: ░                                     0 SP ✅ (Tests, responsive & docs finis)
```

---

## 📝 Daily Scrum Notes

### Day 2
- **Aymen** : Compte Stripe configuré, clés test récupérées, Stripe CLI installé. Session de paiement créée côté backend.
- **Roua** : Page paiement statique en cours. Structure de la page confirmation définie.
- **Blocker** : Stripe CLI non reconnu en PowerShell après installation — résolu en ajoutant le bon dossier au PATH système.

### Day 5
- **Aymen** : Webhook Stripe opérationnel via Stripe CLI. Statut commande mis à jour à `PAID` après confirmation. Génération QR codes implémentée.
- **Roua** : Pages tickets et historique commandes terminées en statique. Dashboard organisateur avec graphiques en cours.
- **Stuck** : Format de la clé `whsec_` webhook — résolu en relançant `stripe listen` et en copiant la clé affichée dans le terminal.

### Day 8
- **Aymen** : Liaison paiement end-to-end validée. Refresh token et rate limiting ajoutés. Liaison dashboards et admin aux API terminée.
- **Roua** : Dashboard organisateur et page admin connectés. Responsive appliqué sur toutes les pages. Tests unitaires rédigés sur la logique critique.

---

## ✅ Definition of Done (Sprint 4+5)

- [x] Paiement Stripe fonctionnel en mode test avec carte `4242 4242 4242 4242`.
- [x] Génération automatique de tickets avec QR codes après paiement confirmé.
- [x] Historique des commandes accessible par le client.
- [x] Dashboard organisateur avec statistiques de ventes réelles.
- [x] Page admin — gestion utilisateurs et modération commentaires opérationnelle.
- [x] Interface responsive sur mobile.
- [x] Refresh token opérationnel.
- [x] Tests unitaires sur la logique critique rédigés et passants.

---

## 🔄 Sprint Retrospective Matrix

| What went well? (Points positifs) | What could improve? (Axes d'amélioration) | Action Items (Actions correctives) |
|:-----------------------------------|:-------------------------------------------|:-----------------------------------|
| **Stripe intégré rapidement** : Attaquer en Day 1 a évité le blocage en fin de sprint. | **Stripe CLI sous Windows** : Setup long et non documenté. | **Ajouter les instructions Stripe CLI Windows** dans le README. |
| **Flow paiement complet** : Du checkout jusqu'au QR code, tout fonctionne de bout en bout. | **Tests unitaires faits en dernière minute** : Manque de couverture sur certains cas limites. | **Rédiger les tests en parallèle du développement**, pas en fin de sprint. |
| **Dashboard admin complet** : Gestion utilisateurs, événements et commentaires dans une seule page. | **Responsive appliqué tardivement** : Aurait dû être intégré page par page dès leur création. | **Penser responsive dès la création de chaque page** au Sprint 6. |
