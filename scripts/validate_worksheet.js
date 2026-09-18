#!/usr/bin/env node
/** Validate built reading worksheet HTML against normalized canonical JSON. */

const fs = require("fs");
const path = require("path");

const sourcePath = process.argv[2];
const outputDir = process.argv[3];
if (!sourcePath || !outputDir) {
  console.error("Usage: node validate_worksheet.js <normalized-worksheet.json> <output_dir>");
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const stem = source.meta.filenameStem;
const htmlPath = path.join(outputDir, `${stem}_Student_Worksheet.html`);

if (!fs.existsSync(htmlPath) || fs.statSync(htmlPath).size === 0) {
  throw new Error(`Missing output: ${htmlPath}`);
}

const html = fs.readFileSync(htmlPath, "utf8");

if (html.includes("/Users/")) {
  throw new Error("HTML contains an absolute local user path.");
}

const contracts = [
  "wbSubmit",
  "editBtn",
  "exportBtn",
  "exportMenu",
  "Export all as HTML",
  "Export current as PDF",
  "Student Worksheet",
  "section-matching",
  "section-fill",
  "section-imitation",
  "section-para-imitation",
  "section-summary",
  "word-bank",
  "match-columns",
  "anti-peek",
  "Fraunces",
  "Work Sans",
  "--ocean-deep",
];
for (const needle of contracts) {
  if (!html.includes(needle)) {
    throw new Error(`HTML contract missing: ${needle}`);
  }
}

const match = html.match(/const INITIAL_DATA = (\{[\s\S]*?\});\s*\n\s*const meta/);
if (!match) throw new Error("HTML INITIAL_DATA is missing or malformed.");
const embedded = JSON.parse(match[1]);
if (JSON.stringify(embedded) !== JSON.stringify(source)) {
  throw new Error("HTML INITIAL_DATA differs from normalized source JSON.");
}

const m = source.matching.items;
if (m.length < 6 || m.length > 8) throw new Error("matching.items must be 6–8.");
if (source.fillInBlank.items.length !== 5) throw new Error("fillInBlank.items must be 5.");
const im = source.imitation.items;
if (im.length < 3 || im.length > 4) throw new Error("imitation.items must be 3–4.");
for (const [i, item] of im.entries()) {
  if (item.scenarios.length !== 2) {
    throw new Error(`imitation.items[${i}] needs 2 scenarios.`);
  }
}
const pimit = source.paragraphImitation || {};
if (!pimit.modelParagraph) throw new Error("paragraphImitation.modelParagraph required.");
if (!Array.isArray(pimit.logicSteps) || pimit.logicSteps.length < 3) {
  throw new Error("paragraphImitation.logicSteps needs ≥3 steps.");
}
if (!Array.isArray(pimit.scenarios) || pimit.scenarios.length < 2 || pimit.scenarios.length > 3) {
  throw new Error("paragraphImitation.scenarios must be 2–3.");
}
if (!source.summary.answers.length) throw new Error("summary.answers required.");

function summaryWordCount(summary) {
  let text = "";
  for (const seg of summary.segments || []) {
    if (typeof seg === "string") text += seg;
    else if (seg.blank !== undefined) text += (summary.answers[seg.blank] || "") + " ";
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}
const words = summaryWordCount(source.summary);
if (words < 30 || words > 260) {
  throw new Error(`summary word count out of range: got ${words} words (expected 30–250 words depending on text difficulty).`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      stem,
      matching: m.length,
      fillInBlank: source.fillInBlank.items.length,
      imitation: im.length,
      paragraphImitationScenarios: (source.paragraphImitation?.scenarios || []).length,
      summaryBlanks: source.summary.answers.length,
    },
    null,
    2
  )
);
