# Vérification et recette

## Résultats de la livraison

- Compilation TypeScript stricte et build Vite : réussis.
- ESLint et vérification Prettier : réussis.
- **28 tests Vitest** : comptes, autorisations, CRUD, caches, PDF, schémas et composants.
- **2 tests Playwright** : parcours de création/publication/génération de CV et affichage mobile sans débordement horizontal.
- Le scénario navigateur comprend une analyse axe WCAG 2 A/AA du portfolio public : aucune violation détectée sur cette page de test après correction des contrastes et du rôle du niveau de compétence. Cela ne constitue pas une certification exhaustive d'accessibilité.
- Les deux exemples PDF ont été rendus et inspectés : une page chacun, accents lisibles, aucune coupure observée. Les tests vérifient aussi la sélection du contenu et le rejet des CV dépassant deux pages.
- Audit npm des dépendances de production : aucune vulnérabilité signalée lors de la vérification. Ce résultat peut évoluer avec les avis publiés ensuite.

## Environnement réellement utilisé

Node.js 24 dans l'environnement de validation ; projet ciblant Node.js 22+. Les tests d'intégration ont utilisé **PGlite, moteur PostgreSQL embarqué avec interface TCP**, et **Redis 7.0.15 réel**. Les pilotes et les requêtes de production ont été utilisés sans simulacre de dépôt ou de cache. PGlite n'est pas une dépendance de l'application et n'est pas utilisé dans Docker ni dans Vercel.

Docker n'étant pas disponible dans l'environnement de livraison, **les images Compose n'ont pas été exécutées ici**, et les tests de concurrence PostgreSQL 16 ne sont pas couverts par PGlite. Le workflow GitHub Actions fourni exécute la suite d'intégration avec PostgreSQL 16 et Redis 7 ; il reste à le lancer dans votre dépôt.

L'application a été vérifiée avec Chromium headless, en affichage bureau et à 390 pixels de large. Le téléchargement de `CV_Camille_Martin.pdf`, le rendu PDF.js et la publication ont été exercés dans le navigateur. Aucun déploiement réel Vercel ni test de latence sous charge n'a été effectué : la cible de 300 ms du cahier des charges doit être mesurée sur l'hébergement choisi.

## Tests rapides sans services

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
```

`npm test` lance 11 tests indépendants et **ignore explicitement** les 17 tests d'intégration tant que `RUN_INTEGRATION` n'est pas activé. PDF.js est utilisé pour relire les PDF dans les tests ; aucun outil PDF système n'est requis.

## Tests d'intégration sur une base dédiée

Démarrer les services :

```powershell
docker compose up -d postgres redis
docker compose exec postgres createdb -U portfolio folio_test
```

Si `folio_test` existe déjà, ne pas relancer `createdb`. Dans PowerShell :

```powershell
$env:DATABASE_URL = "postgresql://portfolio:local_dev_only@localhost:5433/folio_test"
$env:REDIS_URL = "redis://localhost:6380/1"
$env:RUN_INTEGRATION = "1"
npm.cmd test
Remove-Item Env:RUN_INTEGRATION
Remove-Item Env:DATABASE_URL
Remove-Item Env:REDIS_URL
```

Adapter le mot de passe si vous avez changé `POSTGRES_PASSWORD`. La suite refuse toute URL de base ne contenant pas `folio_test`. Elle crée des comptes de test temporaires et les supprime après exécution. Ne pas pointer les tests vers des données de production. Redis DB 1 est isolé du développement local (DB 0) pour les limites de débit et les sessions.

## Tests navigateur

Démarrer l'application locale, puis, dans un second terminal :

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Le test utilise l'application sur `http://localhost:5173`. Il crée un compte temporaire, remplit son parcours, ajoute une compétence par formulaire, génère et télécharge le CV, publie le portfolio, vérifie l'accessibilité et supprime le compte dans le nettoyage final. Le second test vérifie la page de démonstration sur mobile. L'application doit disposer de PostgreSQL et Redis actifs.

## Recette finale à faire sur votre hébergement

- Vérifier `/api/health` après configuration des variables cloud.
- Vérifier les cookies Secure et l'origine HTTPS exacte.
- Tester la persistance après redémarrage et les sauvegardes de la base.
- Ouvrir l'URL publique sans session ; tester la désactivation du CV et le retour en privé.
- Essayer des données réelles longues et les deux modèles de CV.
- Vérifier les images distantes, les liens et les profils sur les appareils utilisés.
- Mesurer les temps de réponse avec le cache et la distance réseau de vos services.
