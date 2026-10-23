import { writeFile } from "node:fs/promises";
import { generateCV } from "../backend/src/pdf.js";
import { demo } from "../shared/demo.js";
import { cvSchema } from "../shared/schema.js";
for (const template of ["classic", "modern"] as const)
  await writeFile(
    `docs/CV_Camille_Martin_${template}.pdf`,
    await generateCV(demo, cvSchema.parse({ template })),
  );
console.log("Deux exemples fictifs générés dans docs/.");
