# Correspondance avec le cahier des charges

| Exigence              | Réalisation                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------- |
| RF-01 / RF-02         | Inscription bcrypt, connexion/déconnexion et sessions Redis                               |
| RF-03 / RF-04         | Profil et mot de passe modifiables, suppression en cascade                                |
| CRUD et ordre         | Quatre sections CRUD, profil, boutons de réordonnancement                                 |
| RF-10                 | Portfolio responsive, liens de contact, images distantes                                  |
| RF-11 / RF-12         | Visibilité privée/publique et slug unique personnalisable                                 |
| RF-13                 | Cache Redis versionné, visibilité contrôlée en PostgreSQL                                 |
| RF-20                 | PDF généré par le serveur à partir des données PostgreSQL                                 |
| RF-21                 | Classique et Moderne                                                                      |
| RF-22                 | Sections et éléments sélectionnables, coordonnées masquables                              |
| RF-23                 | Aperçu du PDF réel avec PDF.js, lien vers le PDF et téléchargement                        |
| RF-24                 | A4, adaptation 10/9/8,5 pt, maximum deux pages ou erreur explicite                        |
| RF-25                 | `CV_Prenom_Nom.pdf`, accents normalisés dans le nom de fichier                            |
| RF-26                 | Cache PDF par utilisateur, version et hash des options                                    |
| TypeScript strict     | Frontend, backend, schémas partagés, tests                                                |
| Validation / sécurité | Zod, SQL paramétré, Helmet, cookie sécurisé, vérification d'origine                       |
| Docker                | Quatre services, volumes, initialisation SQL et healthchecks                              |
| Déploiement demandé   | Vercel configuré ; services PostgreSQL/Redis externes à renseigner                        |
| Tests                 | Authentification, génération PDF, deux composants et validation ; scénario navigateur     |
| Documentation         | README, API, ER, guide Vercel, rapport de tests, deux PDF exemples                        |
| Git                   | Fichiers prêts à être déposés ; historique pédagogique à construire par des commits réels |

## Choix explicites

Le schéma reprend les entités du starter mais uniformise les champs de contenu (`title/subtitle`). Cette version vise une base neuve. Les quatre services Docker sont conservés ; un seul package npm racine partage les dépendances. Le site Vercel reste React/Vite avec API Express, sans remplacement par Next.js.

## Bonus

Rubriques du CV en FR/EN : incluses, **sans traduction automatique des textes**. Export DOCX/JSON Resume, certifications séparées, upload d'images, thème sombre, statistiques, formulaire de contact et administration : non inclus. Photo et captures de projets disponibles par URL publique. Aucun service d'IA n'est nécessaire pour générer le CV.
