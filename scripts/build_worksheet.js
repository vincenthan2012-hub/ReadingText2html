#!/usr/bin/env node
/** Build student worksheet HTML (internal module). */

const fs = require("fs");
const path = require("path");

function normalizeWorksheet(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Content root must be an object.");
  }
  const meta = value.meta || {};
  for (const field of ["titleEn", "filenameStem"]) {
    if (!meta[field]) throw new Error(`meta.${field} is required.`);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(meta.filenameStem)) {
    throw new Error("meta.filenameStem must use ASCII letters, digits, underscores, and hyphens.");
  }
  for (const key of ["matching", "fillInBlank", "imitation", "paragraphImitation", "summary"]) {
    if (!value[key]) throw new Error(`Missing required section: ${key}`);
  }

  const matchItems = value.matching.items || [];
  if (matchItems.length < 6 || matchItems.length > 8) {
    throw new Error("matching.items must have 6–8 entries.");
  }
  const fillItems = value.fillInBlank.items || [];
  if (fillItems.length !== 5) {
    throw new Error("fillInBlank.items must have exactly 5 entries.");
  }
  if (!Array.isArray(value.fillInBlank.wordBank) || value.fillInBlank.wordBank.length < 5) {
    throw new Error("fillInBlank.wordBank needs at least 5 entries.");
  }
  const imitItems = value.imitation.items || [];
  if (imitItems.length < 3 || imitItems.length > 4) {
    throw new Error("imitation.items must have 3–4 entries.");
  }
  for (const [i, item] of imitItems.entries()) {
    if (!Array.isArray(item.scenarios) || item.scenarios.length !== 2) {
      throw new Error(`imitation.items[${i}].scenarios must have exactly 2 Chinese prompts.`);
    }
  }
  const pimit = value.paragraphImitation || {};
  if (!pimit.modelParagraph) throw new Error("paragraphImitation.modelParagraph is required.");
  if (!Array.isArray(pimit.logicSteps) || pimit.logicSteps.length < 3) {
    throw new Error("paragraphImitation.logicSteps needs ≥3 steps from Text Walkthrough.");
  }
  if (!Array.isArray(pimit.scenarios) || pimit.scenarios.length < 2 || pimit.scenarios.length > 3) {
    throw new Error("paragraphImitation.scenarios must have 2–3 items.");
  }
  for (const [i, sc] of pimit.scenarios.entries()) {
    if (!sc.id || !(sc.titleZh || sc.titleEn) || !sc.prompt) {
      throw new Error(`paragraphImitation.scenarios[${i}] needs id, titleZh/titleEn, and prompt.`);
    }
  }
  const answers = value.summary.answers || [];
  if (!answers.length) throw new Error("summary.answers is required.");
  if (!Array.isArray(value.summary.wordBank) || value.summary.wordBank.length < answers.length) {
    throw new Error("summary.wordBank must cover all blank answers.");
  }
  const words = summaryWordCount(value.summary);
  if (words < 30 || words > 260) {
    throw new Error(`summary word count out of range: got ${words} words (expected 30–250 words depending on text difficulty).`);
  }

  const out = JSON.parse(JSON.stringify(value));
  out.meta.badges = out.meta.badges || ["Student Worksheet", out.meta.titleEn];
  out.meta.footer = out.meta.footer || "Reading & Writing · Student Worksheet";
  return out;
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function summaryWordCount(summary) {
  let text = "";
  for (const seg of summary.segments || []) {
    if (typeof seg === "string") text += seg;
    else if (seg.blank !== undefined) text += (summary.answers[seg.blank] || "") + " ";
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildWorksheet(raw, outDir, options = {}) {
  const content = normalizeWorksheet(raw);
  const stem = content.meta.filenameStem;
  const outFile = path.join(outDir, `${stem}_Student_Worksheet.html`);
  const sourcePath = options.sourcePath ? path.resolve(options.sourcePath) : null;

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.join(outDir, "source"), { recursive: true });

  const templatePath = path.join(__dirname, "..", "assets", "worksheet.html.template");
  let tpl = fs.readFileSync(templatePath, "utf8");
  tpl = tpl
    .replace(/__TITLE_EN__/g, esc(content.meta.titleEn))
    .replace("__INITIAL_DATA_JSON__", JSON.stringify(content));

  fs.writeFileSync(outFile, tpl);
  fs.writeFileSync(
    path.join(outDir, "source", "normalized_worksheet.json"),
    JSON.stringify(content, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, "source", "worksheet-build-record.json"),
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        stem,
        source: sourcePath,
        template: "assets/worksheet.html.template",
        parts: ["matching", "fillInBlank", "imitation", "paragraphImitation", "summary"],
      },
      null,
      2
    )
  );

  return { stem, outFile, content };
}

module.exports = { normalizeWorksheet, buildWorksheet, esc };
