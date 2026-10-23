# Folio — Portfolio professionnel et générateur de CV

Application complète en **React + TypeScript**, prolongement du starter fourni. Un étudiant gère son parcours dans un espace privé, publie son portfolio et génère lui-même son CV PDF à partir des données enregistrées.

## Démarrage rapide — Windows / PowerShell

Ouvrir Docker Desktop, puis ouvrir un terminal **dans ce dossier**, celui qui contient `package.json` et `docker-compose.yml`.

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Ouvrir **http://localhost:5173**. La première construction peut prendre quelques minutes. Créer son compte avec **Créer mon portfolio**. Aucun compte ni mot de passe de démonstration n'est préinstallé.

- Application : http://localhost:5173
- Exemple fictif, sans compte : http://localhost:5173/demo
- Santé des services : http://localhost:3000/api/health
- PostgreSQL local : port **5433**, base/utilisateur `portfolio`.
- Redis local : port **6380**.

Le fichier `.env.example` contient uniquement des paramètres locaux d'exemple. Les secrets réels ne doivent jamais entrer dans Git. Le mot de passe Docker local est remplacé en définissant `POSTGRES_PASSWORD` dans `.env` (et en adaptant `DATABASE_URL` si vous développez hors Docker).

## Ce que fait l'application

- Inscription, connexion, déconnexion, changement du mot de passe et suppression du compte.
- Sessions Redis, cookie HttpOnly, bcrypt, validation Zod et isolation des données par utilisateur.
- CRUD du profil, expériences, formations, compétences et projets ; ordre modifiable.
- Portfolio public responsive à `/p/votre-slug`, privé par défaut.
- Publication et permission de télécharger le CV public indépendantes.
- **Deux modèles de CV : Classique et Moderne.**
- Choix des sections, des éléments et de la présence des coordonnées.
- Aperçu du **vrai PDF** avant téléchargement ; fichier `CV_Prenom_Nom.pdf`.
- Format A4, texte sélectionnable, polices embarquées, liens cliquables.
- Ajustement de la taille du texte ; refus explicite si le contenu dépasse deux pages, sans troncature silencieuse.
- Cache Redis du portfolio et des PDF, versionné à chaque modification.
- Titres des rubriques du CV en français ou en anglais (les textes saisis ne sont pas traduits).

Les images se renseignent par URL http(s). Le téléversement d'images, la traduction automatique du contenu, le contact par formulaire, les statistiques, le thème sombre et l'administration ne sont pas inclus : ce sont des bonus du cahier des charges. Le lien de contact ouvre la messagerie de l'utilisateur.

## Utiliser le générateur de CV

1. Créer un compte et compléter **Mon profil**.
2. Ajouter expériences, formations, compétences et projets.
3. Ouvrir **Mon CV**, sélectionner un modèle et les informations à inclure.
4. Cliquer sur **Générer l'aperçu** ; après modification des options, actualiser l'aperçu.
5. Cliquer sur **Télécharger mon CV**.
6. Pour partager le portfolio : **Paramètres → Publier mon portfolio**.

Le CV public, si autorisé, utilise le modèle Moderne avec toutes les données. Les choix de l'atelier privé s'appliquent à ses téléchargements uniquement. La sélection est temporaire, conservée tant que l'atelier reste ouvert.

## Technologies et structure

| Élément                                | Technologie                                                            |
| -------------------------------------- | ---------------------------------------------------------------------- |
| Interface                              | React 18, TypeScript strict, Vite, React Router, Lucide                |
| API REST                               | Node.js 22, Express 5, Zod, Helmet                                     |
| Données                                | PostgreSQL 16 et `pg`, SQL paramétré                                   |
| Sessions / cache / limitation du débit | Redis 7 et `ioredis`                                                   |
| PDF                                    | PDFKit, police DejaVu embarquée                                        |
| Tests / qualité                        | Vitest, React Testing Library, Supertest, Playwright, ESLint, Prettier |
| Local                                  | Docker Compose : frontend, backend, postgres, redis                    |
| En ligne                               | Frontend et API Vercel ; PostgreSQL et Redis hébergés externes         |

`frontend/` : interface et Nginx ; `backend/` : API et schéma SQL ; `shared/` : contrats Zod/types ; `api/` : point d'entrée Vercel ; `assets/` : polices ; `tests/` : tests ; `docs/` : guides et CV exemples.

Un seul `package.json` à la racine simplifie l'installation et le déploiement. Les dossiers frontend/backend du starter sont conservés, avec des Dockerfiles utilisant le contexte racine.

## Développement avec rechargement automatique

Prérequis : Node.js 22+, Docker Desktop. PowerShell : employer `npm.cmd` si Windows bloque `npm.ps1`.

```powershell
Copy-Item .env.example .env
npm.cmd ci
docker compose up -d postgres redis
npm.cmd run db:migrate
npm.cmd run dev
```

Ne pas lancer le frontend/backend Docker en même temps que `npm run dev` : ils utilisent les mêmes ports. Pour passer de Docker complet au développement : `docker compose stop frontend backend`.

Le frontend contacte `/api` sur sa propre origine ; Vite ou Nginx relaie vers Express. Utiliser **localhost**, et non `127.0.0.1`, dans le navigateur avec les paramètres d'origine par défaut.

## Commandes utiles

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
npm.cmd run examples
docker compose ps
docker compose logs backend
docker compose down
```

`docker compose down` conserve les volumes. **Ne pas ajouter `-v`** sauf si vous voulez effacer les données locales. Le SQL d'initialisation est appliqué automatiquement uniquement sur un volume PostgreSQL vide. `npm run db:migrate` réapplique le schéma sans supprimer les données d'une installation Folio existante.

**Ancien starter :** cette version introduit un schéma différent (`title/subtitle` et colonnes supplémentaires). Utiliser une **nouvelle base** ou un nouveau projet Compose (`docker compose -p folio-complet up --build`). Le script n'est pas une migration des anciennes données ; sauvegarder/exporter tout ancien contenu avant transfert manuel.

## Vercel

Suivre **[docs/VERCEL.md](docs/VERCEL.md)**. Le projet contient `vercel.json` et la fonction `api/index.ts`. Configurer `DATABASE_URL`, `REDIS_URL`, `APP_ORIGIN` et `NODE_ENV=production` sur Vercel, puis exécuter le SQL sur une nouvelle base PostgreSQL hébergée.

Vercel n'exécute pas ce Docker Compose. Le PostgreSQL et le Redis locaux ne sont pas accessibles depuis un déploiement Vercel. Les identifiants et la création des services appartiennent au titulaire du compte. Aucune mise en ligne réelle n'a été effectuée dans cette livraison.

## Documentation et exemples

- [Guide Vercel](docs/VERCEL.md)
- [Architecture, sécurité et diagramme ER](docs/ARCHITECTURE.md)
- [Référence API](docs/API.md)
- [Tests et limites vérifiées](docs/TESTS.md)
- [Correspondance avec le cahier des charges](docs/EXIGENCES.md)
- [CV classique fictif](docs/CV_Camille_Martin_classic.pdf)
- [CV moderne fictif](docs/CV_Camille_Martin_modern.pdf)
- Cahier des charges Word d'origine conservé dans `docs/`.

## Dépannage

- **Port déjà utilisé :** arrêter l'autre projet concerné. Les ports choisis pour PostgreSQL/Redis sont 5433/6380, pour éviter les ports habituels.
- **Origine refusée :** vérifier `APP_ORIGIN`, sans slash final, identique à l'adresse ouverte dans le navigateur. Après changement Vercel, redéployer.
- **Service indisponible :** consulter `/api/health`, `docker compose ps` et les journaux du backend. Redis est nécessaire aux sessions.
- **CV trop long :** retirer des éléments ou réduire les descriptions. Le texte n'est jamais coupé pour cacher un dépassement.
- **Aperçu PDF absent sur mobile :** le téléchargement reste disponible ; après génération, utiliser le lien d'ouverture dans un nouvel onglet.
- **Image distante absente :** utiliser une URL publique directe vers une image, disponible en HTTPS ; certains hébergeurs bloquent l'affichage externe.

## Attribution pédagogique

Application complétée avec assistance d'IA. L'étudiant doit comprendre et expliquer le code, ses requêtes SQL, les sessions Redis, les deux caches et la génération PDF conformément au cahier des charges. Les données de Camille Martin sont fictives. Aucune histoire Git artificielle n'est fournie : créer le dépôt, puis effectuer des commits réels lors des évolutions.
