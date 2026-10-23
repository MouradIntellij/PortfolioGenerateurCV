import { it, expect } from "vitest";
import {
  itemSchema,
  emptyItem,
  profileSchema,
  password,
  slugSchema,
} from "../shared/schema";
import { demo } from "../shared/demo";
it("rejette les URLs de script", () =>
  expect(
    profileSchema.safeParse({
      ...demo.profile,
      website_url: "javascript:alert(1)",
    }).success,
  ).toBe(false));
it("rejette les dates impossibles et inversées", () => {
  expect(
    itemSchema.safeParse({
      ...emptyItem,
      title: "Stage",
      start_date: "2026-02-30",
    }).success,
  ).toBe(false);
  expect(
    itemSchema.safeParse({
      ...emptyItem,
      title: "Stage",
      start_date: "2026-06-01",
      end_date: "2025-01-01",
    }).success,
  ).toBe(false);
});
it("rejette les slugs et mots de passe invalides", () => {
  expect(slugSchema.safeParse("../admin").success).toBe(false);
  expect(password.safeParse("1234").success).toBe(false);
  expect(password.safeParse("é".repeat(40)).success).toBe(false);
});
