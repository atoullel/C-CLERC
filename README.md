Voici la version unifiée et consolidée de votre documentation, fusionnant la précision algorithmique du premier document avec la structure détaillée et les exemples chiffrés du second (en appliquant la priorité stricte au premier README en cas de divergence).

---

# NOTES.md

## 1. Choix techniques structurants et ce qu'ils me coûtent

### Logique pure et architecture serveur (`shared/matching/` & `generateAllPairMatches`)

Le matching (normalisation, scoring, clustering) est implémenté sous forme de fonctions pures sans couplage avec Express ou React. `generateAllPairMatches` sert d'**unique source de vérité** : le clustering et le panneau "pourquoi" de l'interface consomment directement le même tableau de `PairMatchResult`, éliminant tout risque de divergence de score entre la détection et l'affichage.

* **Bénéfice :** Testabilité unitaire facilitée sans monter l'UI ni le serveur ; persistance et calculs centralisés côté serveur.
* **Coût :** Comparaison exhaustive en $\mathcal{O}(n^2)$ (325 paires pour 26 fiches). Négligeable sur ce volume, mais demandera impérativement une étape de *blocking* / indexation (par nom normalisé ou préfixe téléphonique) pour passer à l'échelle.

### Scoring pondéré et dérogations explicites (Overrides)

Chaque champ produit une similarité (0 à 1) pondérée selon son pouvoir discriminant (`email: 0.30`, `phone: 0.25`, `birthDate: 0.20`, `lastName: 0.12`, `firstName: 0.08`, `city: 0.05`).

* **Gestion des champs manquants :** La moyenne est calculée **uniquement sur les champs non `missing**` (un champ absent ne compte ni pour ni contre : le dénominateur est la somme des poids des champs effectivement présents).
* **Règles d'override (dérogations) :**
* Un désaccord franc ou un écart sur `birthDate` (> 5 ans) déclenche un cap d'override (`OVERRIDE_SCORE_CAP` à `0.15`) quel que soit le reste, car c'est le signal le plus fiable de deux personnes distinctes.
* Canal de contact partagé : un email ou téléphone strictement identique associé à un score d'identité faible (nom/prénom/date < 0.4) est plafonné à `0.35` pour neutraliser les standards téléphoniques ou boîtes génériques.


* **Coût :** Arbitrage explicite en faveur de la **précision** au détriment du rappel (*precision > recall*). Deux vraies fiches dupliquées comportant une coquille de saisie sur la date de naissance seront sous-scorées plutôt que fusionnées à tort.

### Alignement des noms tolérant à l'inversion (`NameAlignment`)

Les champs `firstName` et `lastName` sont comparés dans les deux sens ($A_{\text{first}} \leftrightarrow B_{\text{first}}$ et $A_{\text{first}} \leftrightarrow B_{\text{last}}$) afin d'absorber les inversions de colonnes (ex. "C. Petit" vs "Petit Camille").

* **Bénéfice :** Détection robuste des inversions courantes en saisie CRM.
* **Coût :** Complexité algorithmique accrue dans `compareFields`. Le panneau "pourquoi" doit explicitement exposer le champ source réel (`matchedFromField`) pour que l'utilisateur comprenne qu'une comparaison croisée a eu lieu, plutôt que de masquer silencieusement l'inversion.

### Clustering par Union-Find avec détection de contradiction

Les groupes de 2+ fiches sont formés par composantes connexes ordonnées par score décroissant. Une union entre deux composantes est **refusée** si elles contiennent une paire "contradictoire" (`overridden` ou score inférieur à `CONTRADICTION_THRESHOLD`). Le score d'un groupe reflète le score minimum interne pour éviter qu'une arête faible ne soit masquée par dilution.

* **Coût assumé :** N'élimine pas la transitivité interne au sein d'un sous-groupe déjà constitué. Le trio *Camille Petit* (`c014/c015/c016`) illustre ce cas : la paire faible `c015 ↔ c016` (36 %) se retrouve dans le même groupe que la paire forte `c014 ↔ c015` (96 %) via le pivot `c014`. C'est un compromis inhérent à l'Union-Find nécessitant une validation humaine.
* **Granularité de décision :** Le refus ou la confirmation est pensé au niveau du groupe complet (signature triée des identifiants `c014|c015|c016`) pour préserver la simplicité d'implémentation dans le temps imparti.

### Fusion douce (`mergedInto`) et persistance fichier

Une confirmation de fusion ne supprime aucune donnée physique : la fiche survivante reçoit les valeurs consolidées, tandis que les autres reçoivent un pointeur `mergedInto: <idSurvivant>`.

* **Bénéfice :** Auditabilité intégrale, réversibilité et conformité avec l'impératif « fusionner à tort est pire que ne pas fusionner ». Stockage sur fichiers (`contacts.json` et `decisions.json`).
* **Coût :** Nécessite une synchronisation stricte : `GET /api/contacts`, `generateAllPairMatches` et `clusterContacts` doivent filtrer rigoureusement sur la même liste de fiches actives non fusionnées.

### Front-end minimaliste

Interface développée en React vanilla (`useState`, `useEffect`), sans dépendance externe de gestion d'état ni cache de requête (React Query/SWR).

* **Coût :** Pas de re-fetch automatique, gestion basique des états (chargé/vide) et gestion d'erreurs globale.

---

## 2. Pièges du jeu de données identifiés et traitements

| Piège identifié | Exemple concret | Traitement apporté |
| --- | --- | --- |
| **Formats de date divergents** | `AAAA-MM-JJ` (CRM) vs `JJ/MM/AAAA` (partenaire) | Normalisation systématique vers le format canonique ISO `AAAA-MM-JJ` avant tout calcul. |
| **Formats de téléphone variés** | `0612345678`, `+33 6 12 34 56 78`, espaces/tirets | Nettoyage complet : extraction des chiffres seuls et alignement sur la forme E.164. |
| **Typo, casse, accents** | `Élodie` vs `Elodie`, `Lefèvre` vs `Lefevre` | Dé-accentuation, passage en minuscules et similarité floue (Jaro-Winkler) au lieu d'une égalité stricte. |
| **Inversion prénom / nom** | `c023/c024` ("François Muller" vs "Muller François") | Module `alignNames` testant l'appariement direct et croisé ; sélectionne le score moyen le plus élevé et renseigne `matchedFromField`. |
| **Initiales et noms composés** | `c015` ("C." pour Camille), `c008` ("P.A." pour Pierre-Alexandre) | Détection de préfixe court + extraction des initiales sur chaque segment séparé par espace ou tiret. |
| **Homonymes avec écart d'âge** | `c001/c003` ("Jean Dupont", 24 ans d'écart) | Dérogation sur `birthDate` : un écart supérieur à 5 ans écrase le score final sous le seuil critique via `OVERRIDE_SCORE_CAP`. |
| **Canaux partagés (standard, secrétariat)** | `c009/c010/c011/c025` (`contact@cabinet-durand.fr`, même standard fixe) | Un canal partagé ne suffit jamais : dérogation si canal identique mais identité faible. La similarité reste une moyenne sur tous les champs valides. |
| **Champs manquants** | `phone`, `birthDate`, ou `city` à `null` | Statut `missing` : exclusion formelle du dénominateur du calcul de moyenne pondérée (ni pénalisé, ni considéré comme match). |
| **Doublons transitifs asymétriques** | `c014/c015/c016` (*Camille Petit*) | Regroupement via composantes connexes (Union-Find) sur l'ensemble des paires, avec score du groupe aligné sur le minimum interne. |
| **Fiche organisation ambiguë** *(limite connue)* | `c025` ("— Cabinet Durand", prénom null, nom = raison sociale) | Faux positif résiduel : `c010 ↔ c025` ressort à 94 %. L'absence de prénom neutralise le contrôle d'identité au dénominateur au lieu de sanctionner l'incohérence personne physique / morale. |

---

## 3. Utilisation d'une IA et corrections apportées

L'IA (Claude) a servi d'accélérateur pour le squelette du MVP d'affichage React (onglets, liste de contacts, cartes de doublons et panneau d'explication "pourquoi" branchés sur `GET /api/contacts` et `GET /api/duplicates`) et d'outil de relecture critique du code de matching existant. **Aucune logique métier de scoring ni de clustering n'a été déployée sans contrôle et validation humaine.**

### Points concrets corrigés ou arbitrés suite aux revues :

* **Désynchronisation du pipeline de filtrage :** Correction d'une incohérence entre `generateAllPairMatches` et `clusterContacts`. L'exclusion des fiches `mergedInto` a été unifiée en amont sur une liste unique active pour éviter toute dérive d'index.
* **Filtrage de l'API de consultation :** Correction de l'endpoint `GET /api/contacts`, qui omettait initialement d'exclure les contacts portant un flag `mergedInto`.
* **Normalisation des poids sur champs partiels :** Correction de la formule de score composite qui additionnait les poids fixes sans recalculer le dénominateur effectif, pénalisant indûment les fiches peu renseignées (ex. `c015`).
* **Robustesse des initiales composées :** Prise en compte du découpage sur tirets/espaces pour que "P.A." s'aligne correctement avec "Pierre-Alexandre".
* **Détection des canaux partagés :** Remplacement d'un calcul moyen imprécis sur les canaux de contact par une détection stricte de l'égalité de téléphone/email combinée à un score d'identité insuffisant (résolvant le cas `c012/c013`).
* **Alignement des seuils UI / Serveur (identifié) :** Détection d'une disparité où l'UI utilisait une valeur en dur (`0.9`) pour qualifier une "Correspondance forte" au lieu d'importer directement `REVIEW_THRESHOLD` / `CONTRADICTION_THRESHOLD` depuis `weight.ts`.

---

## 4. Ce qui n'a pas été fait faute de temps

* **Workflow de fusion complet (UI & API) :**
* Pas d'interface interactive permettant d'éditer champ par champ la valeur gagnante (`ConfirmMergePayload`).
* Absence des endpoints d'action (`POST /api/duplicate-groups/:id/confirm`, `POST /.../reject`, `PATCH`/`DELETE`).
* Pas d'écriture effective des décisions validées dans `decisions.json` (l'application reste en lecture seule).


* **Alignement strict des constantes de seuils :** L'UI utilise encore son seuil local codé en dur plutôt que les constantes partagées de `weight.ts`.
* **Traitement du cas limite organisation (`c010 ↔ c025`) :** La règle discriminant une fiche société dépourvue de prénom face à une personne physique partageant le même standard n'est pas finalisée.
* **Mise à l'échelle & Blocking :** Implémentation du passage de $\mathcal{O}(n^2)$ à une complexité sous-quadratique via des fenêtres de blocage (blocking keys).
* **Finition Front & UX :**
* Absence de feuille de style dédiée sur le tableau brut de l'onglet "Contacts".
* Absence d'indicateurs de chargement fins (skeletons / spinners) et gestion granulaire des erreurs réseau.


* **Couverture de tests :**
* Pas de tests unitaires/composants côté front.
* Suite formelle de tests unitaires automatisés (Vitest) à committer sur le module de matching (la validation actuelle reposant sur des scripts ad hoc exécutés sur le jeu de 26 fiches).


* **Granularité unitaire de rejet :** Possibilité de rejeter une arête spécifique au sein d'un groupe de 3+ contacts sans invalider la composante entière.