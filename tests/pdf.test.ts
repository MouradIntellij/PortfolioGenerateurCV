import { describe, it, expect } from "vitest";
import { generateCV, filename, CVTooLong } from "../backend/src/pdf";
import { demo } from "../shared/demo";
import { cvSchema } from "../shared/schema";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
async function pdfText(buffer: Buffer) {
  const doc = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;
  let text = "";
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text +=
        content.items.map((item) => ("str" in item ? item.str : "")).join(" ") +
        "\f";
    }
    return text;
  } finally {
    await doc.destroy();
  }
}
describe("PDF professionnel", () => {
  for (const template of ["classic", "modern"] as const)
    it(`produit un PDF ${template} avec texte, accents et pagination`, async () => {
      const b = await generateCV(demo, cvSchema.parse({ template }));
      expect(b.subarray(0, 5).toString()).toBe("%PDF-");
      const text = await pdfText(b);
      expect(text).toContain("Mourad Sehboub");
      expect(text).toContain("Équilibre");
      expect(text.split("\f").length - 1).toBeLessThanOrEqual(2);
    });
  it("respecte les sections, les éléments et les coordonnées sélectionnés", async () => {
    const b = await generateCV(
      demo,
      cvSchema.parse({
        sections: ["projects"],
        ids: [8],
        includeContact: false,
      }),
    );
    const text = await pdfText(b);
    expect(text).toContain("Agora");
    expect(text).not.toContain("Équilibre");
    expect(text).not.toContain("camille@example.com");
    expect(text).not.toContain("Stage");
  });
  it("refuse une longueur illisible au lieu de tronquer", async () => {
    const d = structuredClone(demo);
    d.experiences = Array.from({ length: 20 }, (_, i) => ({
      ...demo.experiences[0],
      id: 100 + i,
      description: "Une longue expérience professionnelle. ".repeat(50),
    }));
    await expect(generateCV(d, cvSchema.parse({}))).rejects.toBeInstanceOf(
      CVTooLong,
    );
  });
  it("construit un nom sûr", () =>
    expect(filename("Émilie Dupré")).toBe("CV_Emilie_Dupre.pdf"));
});
