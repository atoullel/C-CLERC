# Déduplication de contacts

Exercice technique fullstack — 2 jours.

full subject :
https://claude.ai/code/artifact/1307c092-ee92-4f7b-b4e1-90f16ca4f3fa

## Contexte

Tu disposes de 26 fiches contacts issues de deux sources (un CRM et un partenaire).
Les mêmes personnes apparaissent parfois plusieurs fois, avec des variations de saisie :
casse, accents, formats de date, formats de téléphone, champs manquants, etc.

L'objectif est de construire un outil permettant à un utilisateur métier d'identifier,
comprendre et traiter ces doublons.

## Démarrer

```bash
npm install
npm run dev
```

| | |
|---|---|
| Interface | http://localhost:5173 |
| API | http://localhost:3001 |

## Commandes utiles

```bash
npm test
npm run test:watch
npm run typecheck
```

## Ce qui est attendu

Un outil fullstack fonctionnel où l'utilisateur peut :

- voir les doublons potentiels détectés automatiquement,
- comprendre pourquoi deux fiches ont été rapprochées,
- décider de fusionner ou non, et retrouver ses décisions après refresh.

Le reste est ton choix : architecture, algorithme, UX, organisation du code.

## Ce qui est évalué

- Pertinence et robustesse de la logique de déduplication
- Qualité de l'interface de revue
- Lisibilité et maintenabilité du code
- Tests sur les parties critiques
- Capacité à expliquer et justifier tes choix

## Rendu

- Le code
- Un historique de commits lisible
- Un `NOTES.md` à la racine avec :
  1. les choix techniques clés et leurs compromis
  2. l'usage éventuel d'IA et ce que tu as corrigé derrière
  3. ce que tu n'as pas eu le temps de faire

Un rendu partiel et lucide vaut mieux qu'un rendu complet mal maîtrisé.
