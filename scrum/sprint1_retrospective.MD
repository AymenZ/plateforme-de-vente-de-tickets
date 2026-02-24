# 🔄 Sprint 1 — Retrospective

## Format : Start-Stop-Continue

---

## 🟢 START (Quoi commencer ?)

| ID | Suggestion | Proposed By | Priority |
|----|-----------|-------------|----------|
| 1 | Définir un contrat d'interface (JSON) avant de coder les liaisons au Sprint 2. | Aymen | High |
| 2 | Utiliser des variables d'environnement (`.env`) systématiquement pour les clés JWT. | Roua | High |
| 3 | Mettre en place un Linter (ESLint/Prettier) pour avoir un style de code identique. | Aymen | Medium |

### Selected for Next Sprint :
- [ ] Créer une documentation des endpoints (URL, méthode, body) pour l'intégration Front.
- [ ] Adopter une convention de nommage stricte pour les composants Frontend.

---

## 🔴 STOP (What should we stop doing?)

| ID | Issue | Proposed By | Priority |
|----|-------|-------------|----------|
| 1 | Pousser du code (`git push`) sans avoir fait de `pull --rebase` (évite les rejets). | Aymen | High |
| 2 | Perdre du temps sur des commandes Linux (`touch`) non supportées sur Windows. | Roua | Medium |
| 3 | Coder des fonctionnalités complexes sans avoir validé le schéma SQL final. | Team | Medium |

### Agreed to Stop :
- [x] Arrêter de travailler sur la branche `main` directement (Passer par des branches de features au Sprint 2).
- [ ] Arrêter les tests manuels trop tardifs : tester chaque route dès qu'elle est codée.

---

## 🔵 CONTINUE (What should we keep doing?)

| ID | Good Practice | Proposed By | Notes |
|----|--------------|-------------|-------|
| 1 | Séparation Auth (Aymen) / Events (Roua). | Team | Très efficace, pas de chevauchement de code. |
| 2 | Documentation systématique et tests Postman. | Roua | Indispensable pour prouver que le backend fonctionne. |
| 3 | Communication rapide via terminal/chat. | Aymen | Permet de résoudre les bugs de config en quelques minutes. |

---

## 📊 Team Health Check

| Area | Rating | Notes |
|------|--------|-------|
| Communication | ⭐⭐⭐⭐⭐ | Excellente réactivité sur les problèmes de déploiement Git. |
| Collaboration | ⭐⭐⭐⭐⭐ | Bonne répartition des tâches selon les affinités. |
| Technical Practices | ⭐⭐⭐☆☆ | Quelques frictions avec les outils (Git, PowerShell). |
| Work-Life Balance | ⭐⭐⭐⭐☆ | Objectif 40h atteint sans dépassement majeur. |
| Planning Accuracy | ⭐⭐⭐⭐☆ | 16 points livrés comme prévu. |
| Code Quality | ⭐⭐⭐⭐☆ | JWT sécurisé et hashage Bcrypt opérationnels. |

---

## 🎯 Action Items (Sprint 2)

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Créer le fichier `.gitignore` complet pour le Frontend | Aymen | Début Sprint 2 | 🔲 Not Started |
| Préparer les données "Mock" (fictives) pour le catalogue statique | Roua | Milieu Sprint 2 | 🔲 Not Started |
| Configurer l'instance Axios globale pour le Frontend | Aymen | Début Sprint 2 | 🔲 Not Started |

---

## 📈 Previous Action Items Review (Phase 0)

| Action from Phase 0 | Owner | Status |
|---------------------|-------|--------|
| Création du dépôt et structure de dossiers | Aymen | ✅ Completed |
| Rédaction du Product Backlog | Aymen + Roua | ✅ Completed |
| Diagramme de cas d'utilisation | Roua | ✅ Completed |

---

## 💬 Open Discussion Notes

- On a remarqué que le modèle Event aura besoin de plus de champs (images, catégories) lors du passage au Frontend.
- On a suggéré d'utiliser **Tailwind CSS** pour gagner du temps sur le design statique.
- On insiste sur le fait de **protéger les routes "Create Event"** dès l'intégration.

---

## 🏆 Kudos & Recognition

| Team Member | Recognition |
|-------------|-------------|
| **Roua** | Pour avoir géré seule le CRUD Événements et les tests Postman sans erreur. |
| **Aymen** | Pour la mise en place robuste du système JWT qui servira de base à tout le projet. |
