# Déployer Folio sur Vercel

## 1. Préparer le dépôt

Extraire l'archive et ouvrir le dossier contenant `package.json`. Publier ce dossier dans un dépôt Git personnel. Ne pas inclure `.env` ni `node_modules` (déjà ignorés). Conserver `package-lock.json`, les dossiers `assets`, `api`, `backend`, `shared`, `frontend` et `vercel.json`.

## 2. Créer les services de données

- **PostgreSQL** : par exemple une instance Neon ou Supabase. Créer une nouvelle base dédiée. Utiliser une URL avec pool de connexions adaptée aux fonctions serveur et TLS, fournie par l'hébergeur.
- **Redis** : une instance Redis hébergée, par exemple Redis Cloud, ou un fournisseur proposant une **URL Redis TCP avec TLS `rediss://`**. L'application utilise `ioredis` : une URL REST et un token HTTP ne sont pas équivalents à `REDIS_URL`.
- Placer autant que possible la fonction Vercel et les données dans une région proche ; choisir des plans adaptés au volume et à la disponibilité attendus.

Dans l'éditeur SQL du fournisseur PostgreSQL, exécuter entièrement **`backend/db/init.sql`**. Cette opération crée les tables ; elle ne crée aucun utilisateur de démonstration. Ne pas l'exécuter sur les tables de l'ancien starter : choisir une nouvelle base.

Alternative : saisir temporairement l'URL PostgreSQL distante dans `.env`, puis lancer `npm run db:migrate`. Ne jamais placer cette URL dans une variable commençant par `VITE_` : elle deviendrait visible du navigateur.

## 3. Importer dans Vercel

Importer le dépôt Git avec **Add New → Project**.

| Paramètre        | Valeur                                     |
| ---------------- | ------------------------------------------ |
| Root Directory   | Dossier contenant le `package.json` racine |
| Framework Preset | Other (configuration explicite fournie)    |
| Node.js          | 22.x                                       |
| Install Command  | `npm ci`                                   |
| Build Command    | `npm run build`                            |
| Output Directory | `dist`                                     |

`api/index.ts` est une fonction Node.js Express. La première réécriture dirige les chemins `/api/...` vers cette fonction. La deuxième laisse React Router gérer `/connexion`, `/app`, `/p/...` et `/demo`. Les fichiers statiques de `dist/assets` restent servis directement. Les polices PDF sont incluses par `includeFiles`.

## 4. Variables d'environnement

| Nom            | Exemple / règle                                                                        |
| -------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL` | URL PostgreSQL du fournisseur avec TLS ; préférer son endpoint avec pool de connexions |
| `REDIS_URL`    | `rediss://utilisateur:mot-de-passe@hote:port`                                          |
| `APP_ORIGIN`   | `https://votre-projet.vercel.app`, sans slash final                                    |
| `NODE_ENV`     | `production`                                                                           |

L'API n'accepte les écritures du navigateur que depuis `APP_ORIGIN`. Cela protège les opérations utilisant le cookie contre les requêtes d'autres sites. Si vous ajoutez un domaine personnalisé, mettre à jour cette variable puis redéployer ; choisir une seule origine canonique et rediriger l'autre domaine vers elle.

Pour les **Preview Deployments**, utiliser une base de test et un Redis de test, ainsi qu'une `APP_ORIGIN` correspondant exactement au domaine de prévisualisation choisi. Ne pas réutiliser une origine de production différente. Les pages statiques peuvent se charger avec une mauvaise origine, mais les formulaires seront refusés.

Ne pas désactiver la validation des certificats TLS. Les fournisseurs imposant des certificats spécifiques doivent être configurés selon leur documentation.

## 5. Déployer et vérifier

1. Déployer puis consulter `https://votre-projet.vercel.app/api/health` : trois états `ok` attendus.
2. Créer un compte ; remplir le profil et au moins un élément de chaque section.
3. Ouvrir Mon CV, générer les aperçus Classique et Moderne, télécharger les PDF.
4. Publier le portfolio et tester son URL dans une fenêtre privée.
5. Activer le téléchargement public du CV, le tester sans connexion.
6. Repasser en privé : l'URL publique et le CV doivent devenir inaccessibles.
7. Consulter les journaux Vercel si les services renvoient 503.

La compilation et les tests locaux ne remplacent pas cette recette sur l'hébergement réel : les identifiants, le réseau TLS, les quotas et les domaines doivent être vérifiés sur votre compte. Cette livraison prépare le déploiement ; elle n'a pas créé de services cloud ni publié de site.

## Références officielles

- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/postgres
- https://vercel.com/docs/redis
- https://vercel.com/kb/guide/connection-pooling-with-functions

La documentation du projet reflète le mode d'intégration Vite + fonction Node.js, avec services de données externes.
