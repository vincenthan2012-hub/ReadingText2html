#!/usr/bin/env node
/** Validate built reading lesson HTML against normalized canonical JSON. */

const fs = require("fs");
const path = require("path");

const sourcePath = process.argv[2];
const outputDir = process.argv[3];
if (!sourcePath || !outputDir) {
  console.error("Usage: node validate_lesson.js <normalized-content.json> <output_dir>");
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const stem = source.meta.filenameStem;
const htmlPath = path.join(outputDir, `${stem}_Reading_Lesson.html`);

if (!fs.existsSync(htmlPath) || fs.statSync(htmlPath).size === 0) {
  throw new Error(`Missing output: ${htmlPath}`);
}

const html = fs.readFileSync(htmlPath, "utf8");

// No accidental local absolute paths
if (html.includes("/Users/")) {
  throw new Error("HTML contains an absolute local user path.");
}

// Interaction / layout contracts from prototype template
const contracts = [
  "stage-tab",
  "panel-pre",
  "panel-while",
  "panel-post",
  "persist-hl",
  "flash-grid",
  "passage-num",
  "passage-para",
  "plogic-btn",
  "sent-step",
  "activity-tab",
  "subtab",
  "light-tab",
  "fcard",
  "flip-icon",
  "vocab-flip",
  "tf-btn",
  "chip word",
  "goToStage",
  "setHighlight",
  "Reading for Gist",
  "Exploring Content",
  "Exploring Language",
  "Comprehension Check",
  "Power Word",
  "Blocking Words",
  "editBtn",
  "exportBtn",
  "exportMenu",
  "Export all as HTML",
  "Export current as PDF",
  "Text Walkthrough",
  "Deep Dive",
  "Text-to-Self",
  "Text-to-World",
  "--ocean-deep",
  "Fraunces",
  "Work Sans",
];
for (const needle of contracts) {
  if (!html.includes(needle)) {
    throw new Error(`HTML interaction/layout contract missing: ${needle}`);
  }
}

// Embedded INITIAL_DATA must match normalized source
const match = html.match(/const INITIAL_DATA = (\{[\s\S]*?\});\s*\n\s*const meta/);
if (!match) throw new Error("HTML INITIAL_DATA is missing or malformed.");
const embedded = JSON.parse(match[1]);
if (JSON.stringify(embedded) !== JSON.stringify(source)) {
  throw new Error("HTML INITIAL_DATA differs from normalized source JSON.");
}

// Schema density checks
const pre = source.preReading;
const wr = source.whileReading;
const post = source.postReading;

if (!pre.leadIn?.prompt) throw new Error("preReading.leadIn.prompt required.");
if (!pre.prediction?.prompt) throw new Error("preReading.prediction.prompt required.");
if (!Array.isArray(pre.keyWords) || pre.keyWords.length < 4 || pre.keyWords.length > 6) {
  throw new Error("preReading.keyWords must have 4–6 items.");
}
if (!Array.isArray(wr.passageParagraphs) || wr.passageParagraphs.length < 2) {
  throw new Error("whileReading.passageParagraphs must have at least 2 paragraphs.");
}
for (const [i, p] of wr.passageParagraphs.entries()) {
  if (!/<p\b/i.test(p) || !/\bid=["']para-/i.test(p)) {
    throw new Error(`passageParagraphs[${i}] must be a <p> with id="para-N".`);
  }
}
if (!wr.gist?.options || wr.gist.options.length !== 4) {
  throw new Error("whileReading.gist.options must have exactly 4 choices.");
}
if (typeof wr.gist.correct !== "number" || wr.gist.correct < 0 || wr.gist.correct > 3) {
  throw new Error("whileReading.gist.correct must be an index 0–3.");
}
if (!Array.isArray(wr.gist.paragraphFunctions) || wr.gist.paragraphFunctions.length < 2) {
  throw new Error("whileReading.gist.paragraphFunctions must have at least 2 items.");
}
if (Array.isArray(wr.textWalkthrough) && wr.textWalkthrough.length >= 2) {
  if (wr.gist.paragraphFunctions.length !== wr.textWalkthrough.length) {
    throw new Error("gist.paragraphFunctions length must match textWalkthrough section count.");
  }
  for (const [i, card] of wr.textWalkthrough.entries()) {
    const pf = wr.gist.paragraphFunctions[i];
    if (pf?.p && card.tag && pf.p !== card.tag) {
      throw new Error(`gist.paragraphFunctions[${i}].p (${pf.p}) must match textWalkthrough[${i}].tag (${card.tag}).`);
    }
  }
}
if (!wr.structure?.nodes || wr.structure.nodes.length < 2) {
  throw new Error("whileReading.structure.nodes must have at least 2 items.");
}
const layout = wr.structure.layout;
if (layout && !["hub", "timeline", "sequence", "compare", "problem-solution"].includes(layout)) {
  throw new Error(`whileReading.structure.layout invalid: ${layout}`);
}
if (!wr.deepDive?.title) throw new Error("whileReading.deepDive.title is required.");
if (!Array.isArray(wr.textWalkthrough) || wr.textWalkthrough.length < 2) {
  throw new Error("whileReading.textWalkthrough must have at least 2 cards.");
}
for (const [i, card] of wr.textWalkthrough.entries()) {
  if (!Array.isArray(card.targets) || !card.targets.length) {
    throw new Error(`textWalkthrough[${i}].targets required.`);
  }
  if (!Array.isArray(card.questions) || card.questions.length < 2 || card.questions.length > 3) {
    throw new Error(`textWalkthrough[${i}].questions must have 2–3 items.`);
  }
  const allowedTypes = new Set(["Fact", "Infer", "Tone", "Vocabulary", "Structure", "Reflect"]);
  for (const [j, q] of card.questions.entries()) {
    if (!allowedTypes.has(q.type)) {
      throw new Error(`textWalkthrough[${i}].questions[${j}].type invalid: ${q.type}`);
    }
    if (!q.question) {
      throw new Error(`textWalkthrough[${i}].questions[${j}].question is required.`);
    }
    if (!q.answerEn && !(Array.isArray(q.bulletsEn) && q.bulletsEn.length)) {
      throw new Error(`textWalkthrough[${i}].questions[${j}] needs answerEn or bulletsEn.`);
    }
  }
  if (!card.paragraphLogic || !Array.isArray(card.paragraphLogic.steps) || card.paragraphLogic.steps.length < 1) {
    throw new Error(`textWalkthrough[${i}].paragraphLogic.steps needs ≥1 item.`);
  }
  if (!Array.isArray(card.paragraphLogic.devices)) {
    throw new Error(`textWalkthrough[${i}].paragraphLogic.devices must be an array (may be empty).`);
  }
  const allowedCats = new Set(["cause", "contrast", "addition", "sequence", "hedge"]);
  for (const [j, step] of card.paragraphLogic.steps.entries()) {
    if (!step.id || !step.labelEn) {
      throw new Error(`textWalkthrough[${i}].paragraphLogic.steps[${j}] needs id + labelEn.`);
    }
  }
  for (const [j, dev] of card.paragraphLogic.devices.entries()) {
    if (!allowedCats.has(dev.cat) || !dev.labelEn) {
      throw new Error(`textWalkthrough[${i}].paragraphLogic.devices[${j}] needs valid cat + labelEn.`);
    }
  }
  // Step ids must appear as data-step on sent-step spans inside targeted paragraphs.
  // Within one walkthrough card (esp. multi-para sections), each id must be UNIQUE —
  // do not reset data-step="1" on every paragraph’s first sentence.
  const targetBlob = card.targets
    .map((tid) => {
      const hit = wr.passageParagraphs.find((p) => p.includes(`id="${tid}"`) || p.includes(`id='${tid}'`));
      return hit || "";
    })
    .join("\n");
  const stepIdCounts = new Map();
  const stepAttrRe = /data-step=["']([^"']+)["']/g;
  let stepAttrMatch;
  while ((stepAttrMatch = stepAttrRe.exec(targetBlob))) {
    const sid = stepAttrMatch[1];
    stepIdCounts.set(sid, (stepIdCounts.get(sid) || 0) + 1);
  }
  for (const step of card.paragraphLogic.steps) {
    const sid = String(step.id);
    const count = stepIdCounts.get(sid) || 0;
    if (count === 0) {
      throw new Error(`textWalkthrough[${i}] step id="${step.id}" missing <span class="sent-step" data-step="..."> in targets.`);
    }
    if (count > 1) {
      throw new Error(
        `textWalkthrough[${i}] step id="${step.id}" appears ${count} times in targets. ` +
          `Each data-step must be unique across the whole section — number steps 1…N continuously; ` +
          `do not put data-step="1" on the first sentence of every paragraph.`
      );
    }
  }
  for (const sid of stepIdCounts.keys()) {
    if (!card.paragraphLogic.steps.some((s) => String(s.id) === sid)) {
      throw new Error(
        `textWalkthrough[${i}] has data-step="${sid}" in targets but no matching paragraphLogic.steps entry.`
      );
    }
  }

  // Signpost (dm): only block clear relative-clause false positives.
  // Do not over-constrain temporal/contrast words — authoring guidance prefers
  // a few major cohesive devices per section (see lesson-schema.md).
  const RELATIVE_ONLY =
    /^(in which|of which|to which|for which|on which|at which|by which|with which|which|who|whom|whose|that|where)$/i;
  const dmOpenRe = /<span\b[^>]*\bdm\b[^>]*>/gi;
  let dmOpen;
  while ((dmOpen = dmOpenRe.exec(targetBlob))) {
    const openTag = dmOpen[0];
    const catMatch = openTag.match(/data-cat=["']([^"']+)["']/i);
    const cat = catMatch ? catMatch[1] : "?";
    const start = dmOpen.index + openTag.length;
    const end = targetBlob.indexOf("</span>", start);
    if (end < 0) continue;
    const text = targetBlob
      .slice(start, end)
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    if (RELATIVE_ONLY.test(text)) {
      throw new Error(
        `textWalkthrough[${i}] dm "${text}" (cat=${cat}) is a relative-clause marker, not a discourse signpost. ` +
          `Do not mark who/which/that/where/in which as Signpost words.`
      );
    }
  }
}
if (!wr.deepDive?.bulletsEn || wr.deepDive.bulletsEn.length < 2 || wr.deepDive.bulletsEn.length > 6) {
  throw new Error("whileReading.deepDive.bulletsEn needs 2–6 items (match the article; not a fixed count).");
}
if (!wr.deepDive?.bulletsZh || wr.deepDive.bulletsZh.length !== wr.deepDive.bulletsEn.length) {
  throw new Error("whileReading.deepDive.bulletsZh must match bulletsEn length.");
}
if (!Array.isArray(wr.powerWords) || wr.powerWords.length < 3) {
  throw new Error("whileReading.powerWords needs ≥3 items.");
}
for (const [i, item] of wr.powerWords.entries()) {
  for (const field of ["target", "word", "meaningEn", "trait", "meaningZh"]) {
    if (!item[field]) throw new Error(`powerWords[${i}].${field} is required.`);
  }
}
if (!Array.isArray(wr.phrases) || wr.phrases.length < 2) {
  throw new Error("whileReading.phrases needs ≥2 items.");
}
for (const [i, item] of wr.phrases.entries()) {
  for (const field of ["target", "word", "meaningEn", "trait", "meaningZh"]) {
    if (!item[field]) throw new Error(`phrases[${i}].${field} is required.`);
  }
}
if (!Array.isArray(wr.structures) || wr.structures.length < 1) {
  throw new Error("whileReading.structures needs ≥1 language-structure card.");
}
if (!Array.isArray(wr.trueFalse) || wr.trueFalse.length < 3) {
  throw new Error("whileReading.trueFalse needs ≥3 items.");
}
if (!Array.isArray(wr.vocabMatch) || wr.vocabMatch.length < 4) {
  throw new Error("whileReading.vocabMatch needs ≥4 items.");
}
if (!post.predictionCheck?.prompt) throw new Error("postReading.predictionCheck.prompt required.");
if (!post.speaking?.prompts || post.speaking.prompts.length < 2) {
  throw new Error("postReading.speaking.prompts needs ≥2 items.");
}
if (!post.textToSelf?.prompt) throw new Error("postReading.textToSelf.prompt required.");
if (!post.textToWorld?.prompt || !post.textToWorld.sides || post.textToWorld.sides.length < 2) {
  throw new Error("postReading.textToWorld needs prompt + ≥2 sides.");
}
if (!post.exitTicket?.prompt) throw new Error("postReading.exitTicket.prompt required.");

// Passage highlight targets referenced by language / walkthrough should exist in passage HTML
const passageBlob = wr.passageParagraphs.join("\n");
const idTargets = new Set();
for (const card of wr.textWalkthrough) {
  for (const t of card.targets) idTargets.add(t);
}
for (const item of [...(wr.powerWords || []), ...(wr.phrases || [])]) {
  if (item.target) idTargets.add(item.target);
}
for (const group of wr.structures || []) {
  for (const item of group.items || []) {
    if (item.target) idTargets.add(item.target);
  }
}
for (const id of idTargets) {
  if (!passageBlob.includes(`id="${id}"`) && !passageBlob.includes(`id='${id}'`)) {
    throw new Error(`Highlight target id="${id}" not found in passageParagraphs.`);
  }
}
for (const v of wr.vocabMatch) {
  if (!passageBlob.includes(`data-word="${v.word}"`) && !passageBlob.includes(`data-word='${v.word}'`)) {
    throw new Error(`vocabMatch word "${v.word}" missing <span class="vocab" data-word="..."> in passage.`);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      stem,
      keyWords: pre.keyWords.length,
      paragraphs: wr.passageParagraphs.length,
      walkthrough: wr.textWalkthrough.length,
      trueFalse: wr.trueFalse.length,
      vocabMatch: wr.vocabMatch.length,
    },
    null,
    2
  )
);
