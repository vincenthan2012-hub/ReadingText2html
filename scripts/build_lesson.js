#!/usr/bin/env node
/** Build interactive reading lesson HTML (internal module). */

const fs = require("fs");
const path = require("path");

function normalizeLesson(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Content root must be an object.");
  }
  const meta = value.meta || {};
  for (const field of ["titleEn", "filenameStem", "lessonType"]) {
    if (!meta[field]) throw new Error(`meta.${field} is required.`);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(meta.filenameStem)) {
    throw new Error("meta.filenameStem must use ASCII letters, digits, underscores, and hyphens.");
  }
  if (meta.lessonType !== "reading_and_writing") {
    throw new Error('meta.lessonType must be "reading_and_writing".');
  }
  for (const key of ["preReading", "whileReading", "postReading"]) {
    if (!value[key]) throw new Error(`Missing required section: ${key}`);
  }
  const out = JSON.parse(JSON.stringify(value));
  out.meta.badges = out.meta.badges || ["Reading & Writing", out.meta.titleEn];
  out.meta.footer =
    out.meta.footer || "Reading & Writing courseware · Pre / While / Post lesson flow";
  out.teacherTips = out.teacherTips || {};
  return out;
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLesson(raw, outDir, options = {}) {
  const content = normalizeLesson(raw);
  const stem = content.meta.filenameStem;
  const outFile = path.join(outDir, `${stem}_Reading_Lesson.html`);
  const sourcePath = options.sourcePath ? path.resolve(options.sourcePath) : null;

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.join(outDir, "source"), { recursive: true });

  const templatePath = path.join(__dirname, "..", "assets", "lesson.html.template");
  let tpl = fs.readFileSync(templatePath, "utf8");
  tpl = tpl
    .replace(/__TITLE_EN__/g, esc(content.meta.titleEn))
    .replace("__INITIAL_DATA_JSON__", JSON.stringify(content));

  fs.writeFileSync(outFile, tpl);
  fs.writeFileSync(
    path.join(outDir, "source", "normalized_content.json"),
    JSON.stringify(content, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, "source", "build-record.json"),
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        stem,
        source: sourcePath,
        template: "assets/lesson.html.template",
        stages: ["preReading", "whileReading", "postReading"],
      },
      null,
      2
    )
  );

  return { stem, outFile, content };
}

module.exports = { normalizeLesson, buildLesson, esc };
