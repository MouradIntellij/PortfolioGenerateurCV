import type { Portfolio, Item } from "./schema.js";
import { emptyItem } from "./schema.js";
const item = (id: number, extra: Partial<Item>): Item => ({
  ...emptyItem,
  id,
  sort_order: id,
  ...extra,
});
export const demo: Portfolio = {
  user: {
    id: 0,
    slug: "camille-martin",
    is_public: true,
    allow_cv: true,
    version: 1,
  },
  profile: {
    full_name: "Mourad Sehboub",
    headline: "Développeur web & créateur d’expériences",
    bio: "Je transforme des idées en interfaces utiles, accessibles et soignées. Étudiante en informatique à Montréal, je m’intéresse aux produits qui simplifient le quotidien.",
    email: "camille@example.com",
    phone: "",
    city: "Montréal, Québec",
    linkedin_url: "",
    github_url: "https://github.com",
    website_url: "",
    photo_url: "",
  },
  experiences: [
    item(1, {
      title: "Développeuse front-end",
      subtitle: "Studio Horizon · Stage",
      start_date: "2026-05-01",
      end_date: "2026-08-01",
      description:
        "Conception d’interfaces React accessibles. Création de composants réutilisables et intégration d’une API REST en collaboration avec une équipe de quatre personnes.",
    }),
    item(2, {
      title: "Tutrice en programmation",
      subtitle: "Centre d’aide à la réussite",
      start_date: "2025-09-01",
      description:
        "Accompagnement des étudiants dans leurs premiers projets JavaScript et animation d’ateliers de résolution de problèmes.",
    }),
  ],
  education: [
    item(3, {
      title: "DEC — Techniques de l’informatique",
      subtitle: "Collège LaSalle · Montréal",
      start_date: "2024-08-01",
      end_date: "2027-05-01",
      description:
        "Développement web, bases de données, programmation orientée objet et méthodes agiles.",
    }),
  ],
  skills: [
    item(4, { title: "React", category: "Framework", level: 4 }),
    item(5, { title: "TypeScript", category: "Langage", level: 4 }),
    item(6, { title: "PostgreSQL", category: "Outil", level: 3 }),
    item(7, { title: "Français & anglais", category: "Langue", level: 4 }),
  ],
  projects: [
    item(8, {
      title: "Agora",
      subtitle: "Application collaborative",
      description:
        "Un espace de partage de ressources pensé pour les étudiants. Recherche, favoris et gestion des accès dans une interface simple.",
      technologies: ["React", "Express", "PostgreSQL"],
    }),
    item(9, {
      title: "Équilibre",
      subtitle: "Tableau de bord personnel",
      description:
        "Suivi des habitudes et visualisation des progrès, avec une attention particulière à l’accessibilité.",
      technologies: ["TypeScript", "CSS", "Vite"],
    }),
  ],
};
