import { z } from "zod";
const short = z.string().trim().max(160);
const url = z
  .string()
  .trim()
  .max(1500)
  .refine((v) => !v || /^https?:\/\//i.test(v), "Utilisez une URL http(s).")
  .refine((v) => {
    try {
      return !v || !!new URL(v).hostname;
    } catch {
      return false;
    }
  }, "URL invalide.");
const date = z
  .string()
  .refine(
    (v) =>
      !v ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    "Date invalide.",
  );
export const sections = [
  "experiences",
  "education",
  "skills",
  "projects",
] as const;
export type Section = (typeof sections)[number];
export const labels: Record<Section, string> = {
  experiences: "Expériences",
  education: "Formations",
  skills: "Compétences",
  projects: "Projets",
};
export const profileSchema = z.object({
  full_name: short.min(2),
  headline: short,
  bio: z.string().max(3000),
  email: z.string().email().max(254),
  phone: z.string().max(40),
  city: short,
  linkedin_url: url,
  github_url: url,
  website_url: url,
  photo_url: url,
});
export const itemSchema = z
  .object({
    title: short.min(1, "Le titre est obligatoire."),
    subtitle: short.default(""),
    start_date: date.default(""),
    end_date: date.default(""),
    description: z.string().max(3000).default(""),
    technologies: z.array(short.min(1)).max(20).default([]),
    repo_url: url.default(""),
    demo_url: url.default(""),
    image_url: url.default(""),
    category: z
      .enum(["Langage", "Framework", "Outil", "Langue", "Savoir-être"])
      .default("Outil"),
    level: z.number().int().min(1).max(5).default(3),
  })
  .refine(
    (v) => !v.start_date || !v.end_date || v.end_date >= v.start_date,
    "La fin doit suivre le début.",
  );
export const password = z
  .string()
  .min(12, "Au moins 12 caractères.")
  .max(72)
  .refine(
    (v) => new TextEncoder().encode(v).length <= 72,
    "Maximum 72 octets pour le mot de passe.",
  );
export const credentials = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password,
});
export const slugSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Minuscules, chiffres et tirets uniquement.",
  );
export const registerSchema = credentials.extend({
  full_name: short.min(2),
  slug: slugSchema,
});
export const cvSchema = z.object({
  template: z.enum(["classic", "modern"]).default("modern"),
  language: z.enum(["fr", "en"]).default("fr"),
  sections: z
    .array(z.enum(sections))
    .max(4)
    .default([...sections]),
  ids: z.array(z.number().int().positive()).max(200).optional(),
  includeContact: z.boolean().default(true),
});
export type Profile = z.infer<typeof profileSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type Item = ItemInput & { id: number; sort_order: number };
export type CVOptions = z.infer<typeof cvSchema>;
export interface Portfolio {
  user: {
    id: number;
    slug: string;
    is_public: boolean;
    allow_cv: boolean;
    version: number;
  };
  profile: Profile;
  experiences: Item[];
  education: Item[];
  skills: Item[];
  projects: Item[];
}
export const emptyItem: ItemInput = {
  title: "",
  subtitle: "",
  start_date: "",
  end_date: "",
  description: "",
  technologies: [],
  repo_url: "",
  demo_url: "",
  image_url: "",
  category: "Outil",
  level: 3,
};
