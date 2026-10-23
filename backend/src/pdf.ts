import PDFDocument from "pdfkit";
import { resolve } from "node:path";
import { type Portfolio, type CVOptions, labels } from "../../shared/schema.js";
export class CVTooLong extends Error {
  status = 422;
  constructor() {
    super(
      "Ce CV dépasse deux pages. Réduisez les descriptions ou désélectionnez des éléments.",
    );
  }
}
export function filename(name: string) {
  return `CV_${
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "Profil"
  }.pdf`;
}
const english = {
  experiences: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
};
async function render(
  data: Portfolio,
  opts: CVOptions,
  size: number,
): Promise<{ buffer: Buffer; pages: number }> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 46,
    bufferPages: true,
    info: {
      Title: `CV — ${data.profile.full_name}`,
      Author: data.profile.full_name,
    },
  });
  doc.registerFont("Regular", resolve("assets/DejaVuSans.ttf"));
  doc.registerFont("Bold", resolve("assets/DejaVuSans-Bold.ttf"));
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((ok, no) => {
    doc.on("data", (b: Buffer) => chunks.push(b));
    doc.on("end", () => ok(Buffer.concat(chunks)));
    doc.on("error", no);
  });
  const accent = opts.template === "modern" ? "#137b6e" : "#26344b";
  const width = 503;
  const line = (
    text: string,
    bold = false,
    color = "#26344b",
    fontSize = size,
  ) => {
    doc
      .font(bold ? "Bold" : "Regular")
      .fontSize(fontSize)
      .fillColor(color)
      .text(text, { width, lineGap: 2 });
  };
  if (opts.template === "modern") {
    doc.rect(0, 0, 10, 842).fill(accent);
    doc.rect(46, 32, 34, 4).fill(accent);
    doc.y = 50;
  }
  line(data.profile.full_name, true, accent, 24);
  line(data.profile.headline, false, "#465368", 12);
  doc.moveDown(0.5);
  const contact = opts.includeContact
    ? [data.profile.email, data.profile.phone, data.profile.city]
    : [data.profile.city];
  line(contact.filter(Boolean).join("  ·  "), false, "#536174", 8.5);
  if (opts.includeContact)
    for (const link of [
      data.profile.linkedin_url,
      data.profile.github_url,
      data.profile.website_url,
    ].filter(Boolean)) {
      doc
        .font("Regular")
        .fontSize(8)
        .fillColor(accent)
        .text(link, { width, link });
    }
  doc.moveDown(0.8);
  if (data.profile.bio) {
    line(data.profile.bio);
    doc.moveDown(0.6);
  }
  for (const section of opts.sections) {
    const items = data[section].filter(
      (i) => !opts.ids || opts.ids.includes(i.id),
    );
    if (!items.length) continue;
    if (doc.y > 700) doc.addPage();
    line(
      (opts.language === "en" ? english : labels)[section].toUpperCase(),
      true,
      accent,
      10,
    );
    doc.moveDown(0.4);
    for (const item of items) {
      if (doc.y > 710) doc.addPage();
      if (section === "skills") {
        line(`${item.title} · ${item.category} · ${item.level}/5`);
        continue;
      }
      line(item.title, true);
      if (item.subtitle) line(item.subtitle, false, "#536174");
      if (item.start_date)
        line(
          `${item.start_date.slice(0, 7)} — ${item.end_date.slice(0, 7) || (opts.language === "en" ? "Present" : "Aujourd’hui")}`,
          false,
          "#637083",
          8.5,
        );
      if (item.description) line(item.description);
      if (item.technologies.length)
        line(item.technologies.join(" · "), false, accent, 8.5);
      for (const url of [item.repo_url, item.demo_url].filter(Boolean)) {
        doc
          .font("Regular")
          .fontSize(8)
          .fillColor(accent)
          .text(url, { width, link: url });
      }
      doc.moveDown(0.65);
    }
    doc.moveDown(0.4);
  }
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Regular")
      .fontSize(8)
      .fillColor("#758094")
      .text(
        `${data.profile.full_name}  •  ${i + 1} / ${range.count}`,
        46,
        804,
        { lineBreak: false },
      );
  }
  doc.end();
  return { buffer: await completed, pages: range.count };
}
export async function generateCV(
  data: Portfolio,
  opts: CVOptions,
): Promise<Buffer> {
  for (const size of [10, 9, 8.5]) {
    const result = await render(data, opts, size);
    if (result.pages <= 2) return result.buffer;
  }
  throw new CVTooLong();
}
