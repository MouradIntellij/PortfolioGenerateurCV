# Référence API

Base : `/api` sur la même origine que React. JSON pour les écritures, cookie de session automatiquement transmis par le navigateur. Toutes les écritures nécessitent `Origin: <APP_ORIGIN>`. Aucun jeton n'est à conserver dans localStorage.

## Comptes

| Méthode | Route            | Corps / réponse                                               |
| ------- | ---------------- | ------------------------------------------------------------- |
| POST    | `/auth/register` | `{email,password,full_name,slug}` ; 201 et cookie             |
| POST    | `/auth/login`    | `{email,password}` ; 200 et cookie                            |
| POST    | `/auth/logout`   | Révoque la session courante                                   |
| GET     | `/me`            | Portfolio complet du compte connecté                          |
| PUT     | `/auth/password` | `{current_password,new_password}` ; ferme toutes les sessions |
| DELETE  | `/account`       | `{password}` ; supprime le compte et ses contenus             |

## Profil et publication

| Méthode | Route              | Description                                         |
| ------- | ------------------ | --------------------------------------------------- |
| GET     | `/profile`         | Profil privé                                        |
| PUT     | `/profile`         | Remplacement du profil validé                       |
| PUT     | `/settings`        | `{slug,is_public,allow_cv}`                         |
| GET     | `/public/:slug`    | Portfolio si public ; 404 sinon                     |
| GET     | `/public/:slug/cv` | PDF Moderne complet si publication et permission CV |
| GET     | `/health`          | Test PostgreSQL + Redis, 200 ou 503                 |

Le profil comprend : `full_name`, `headline`, `bio`, `email`, `phone`, `city`, `linkedin_url`, `github_url`, `website_url`, `photo_url`. Les chaînes optionnelles se transmettent vides, pas `null`.

## Contenu

Remplacer `{section}` par `experiences`, `education`, `skills` ou `projects`.

| Méthode | Route              | Description                                                           |
| ------- | ------------------ | --------------------------------------------------------------------- |
| GET     | `/{section}`       | Liste triée de l'utilisateur                                          |
| POST    | `/{section}`       | Création ; 201 et `{id}`                                              |
| PUT     | `/{section}/:id`   | Modification d'un élément appartenant au compte                       |
| DELETE  | `/{section}/:id`   | Suppression ; 404 si inaccessible                                     |
| PUT     | `/{section}/order` | `{ids:[3,1,2]}` : exactement tous les IDs de la section, sans doublon |

Exemple d'expérience :

```json
{
  "title": "Développeur web",
  "subtitle": "Entreprise Exemple",
  "start_date": "2026-05-01",
  "end_date": "",
  "description": "Développement de composants React et de tests.",
  "technologies": [],
  "repo_url": "",
  "demo_url": "",
  "image_url": "",
  "category": "Outil",
  "level": 3
}
```

`title` est obligatoire. Les autres champs disposent de valeurs par défaut. `category` : Langage, Framework, Outil, Langue, Savoir-être. `level` : entier 1 à 5. Dates ISO réelles et fin non antérieure au début. Maximum 50 éléments par section.

## PDF

- GET `/cv/preview?options=<JSON encodé>` : PDF inline.
- GET `/cv/download?options=<JSON encodé>` : PDF attachment.

```typescript
const options = {
  template: "modern", // ou classic
  language: "fr", // ou en pour les rubriques
  sections: ["experiences", "education", "skills", "projects"],
  ids: [1, 2, 4], // omis = tous ; [] = aucun élément
  includeContact: true,
};
const url =
  "/api/cv/preview?options=" + encodeURIComponent(JSON.stringify(options));
```

Les IDs ne donnent accès qu'aux éléments du compte connecté. Le nom, le titre professionnel, la biographie et la ville forment l'en-tête permanent ; `includeContact=false` retire courriel, téléphone et liens personnels. Le cache tient compte de toutes les options et de la version des données. Aucun contenu CV n'est accepté comme source depuis le client.

## Erreurs

Réponse JSON `{ "error": "Message lisible" }` : 400 validation, 401 session absente/expirée, 403 origine refusée, 404 contenu inaccessible, 409 courriel/slug déjà utilisé, 422 CV trop long/limite de contenu, 429 limitation du débit, 503 service indisponible. Les erreurs techniques ne divulguent pas les chaînes de connexion.
