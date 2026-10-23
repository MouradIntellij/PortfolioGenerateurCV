import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { demo } from "../../shared/demo";
test("créer, gérer, générer et publier un portfolio", async ({ page }) => {
  const slug = "test-" + Date.now();
  const password = "Test-browser-2026";
  await page.goto("/inscription");
  await page.getByLabel("Nom complet").fill("Camille Martin");
  await page.getByLabel("Adresse de votre portfolio").fill(slug);
  await page
    .getByLabel("Courriel", { exact: true })
    .fill(slug + "@example.com");
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(
    page.getByRole("heading", { name: "Bonjour, Camille." }),
  ).toBeVisible();
  try {
    await page.evaluate(async (d) => {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d.profile),
      });
      if (!response.ok) throw Error("Profil refusé");
      for (const section of [
        "experiences",
        "education",
        "skills",
        "projects",
      ] as const)
        for (const item of d[section]) {
          const r = await fetch("/api/" + section, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          if (!r.ok) throw Error("Contenu refusé");
        }
    }, demo);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Bonjour, Camille." }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Compétences", exact: true })
      .click();
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await page.getByLabel("Compétence", { exact: true }).fill("Docker");
    await page
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Docker", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mon CV PDF", exact: true }).click();
    await page
      .getByRole("button", { name: "Générer l’aperçu", exact: true })
      .click();
    await expect(page.locator(".pdf-pages canvas").first()).toBeVisible();
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Télécharger mon CV", exact: true })
      .click();
    expect((await download).suggestedFilename()).toBe("CV_Camille_Martin.pdf");
    await page.getByRole("button", { name: "Paramètres", exact: true }).click();
    await page.getByLabel("Publier mon portfolio").check();
    await page.getByLabel("Autoriser le téléchargement public du CV").check();
    await page
      .getByRole("button", { name: "Enregistrer la visibilité" })
      .click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.goto("/p/" + slug);
    await expect(
      page.getByRole("heading", { name: "Camille Martin", exact: true }),
    ).toBeVisible();
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
  } finally {
    await page.evaluate(async (pwd) => {
      await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
    }, password);
  }
});
test("portfolio lisible sur mobile sans débordement horizontal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Camille Martin", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
