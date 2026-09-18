#!/usr/bin/env node
/** Validate both lesson and worksheet outputs from one build. */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const outputDir = process.argv[2];
const mode = process.argv[3] || "both";

if (!outputDir) {
  console.error("Usage: node validate.js <output_dir> [--lesson-only|--worksheet-only]");
  process.exit(1);
}

const scriptsDir = __dirname;

function run(script, ...args) {
  execFileSync(process.execPath, [path.join(scriptsDir, script), ...args], { stdio: "inherit" });
}

if (mode === "--lesson-only") {
  const lessonNorm = path.join(outputDir, "source", "normalized_content.json");
  if (!fs.existsSync(lessonNorm)) throw new Error(`Missing ${lessonNorm}`);
  run("validate_lesson.js", lessonNorm, outputDir);
  process.exit(0);
}

if (mode === "--worksheet-only" || mode === "--workbook-only") {
  const worksheetNorm = path.join(outputDir, "source", "normalized_worksheet.json");
  if (!fs.existsSync(worksheetNorm)) throw new Error(`Missing ${worksheetNorm}`);
  run("validate_worksheet.js", worksheetNorm, outputDir);
  process.exit(0);
}

const recordPath = path.join(outputDir, "source", "package-build-record.json");
if (!fs.existsSync(recordPath)) {
  throw new Error(`Missing ${recordPath}. Run build.js (default mode) first.`);
}

const record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
const lessonNorm = path.join(outputDir, "source", "normalized_content.json");
const worksheetNorm = path.join(outputDir, "source", "normalized_worksheet.json");

for (const file of [lessonNorm, worksheetNorm]) {
  if (!fs.existsSync(file)) throw new Error(`Missing normalized source: ${file}`);
}

run("validate_lesson.js", lessonNorm, outputDir);
run("validate_worksheet.js", worksheetNorm, outputDir);

console.log(
  JSON.stringify(
    {
      ok: true,
      stem: record.stem,
      lesson: record.outputs.lesson,
      worksheet: record.outputs.worksheet || record.outputs.workbook,
    },
    null,
    2
  )
);
