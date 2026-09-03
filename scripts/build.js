#!/usr/bin/env node
/**
 * Build reading courseware (lesson + worksheet) in one command.
 *
 * Usage:
 *   node build.js <package.json> <output_dir>
 *   node build.js <content.json> <worksheet.json> <output_dir>
 *   node build.js --lesson-only <content.json> <output_dir>
 *   node build.js --worksheet-only <worksheet.json> <output_dir>
 */

const fs = require("fs");
const path = require("path");
const { buildLesson } = require("./build_lesson");
const { buildWorksheet } = require("./build_worksheet");

function usage() {
  console.error(`Usage:
  node build.js <package.json> <output_dir>
  node build.js <content.json> <worksheet.json> <output_dir>
  node build.js --lesson-only <content.json> <output_dir>
  node build.js --worksheet-only <worksheet.json> <output_dir>`);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assertSameStem(lessonMeta, worksheetMeta) {
  const a = lessonMeta?.filenameStem;
  const b = worksheetMeta?.filenameStem;
  if (a && b && a !== b) {
    throw new Error(
      `filenameStem mismatch: lesson="${a}" worksheet="${b}". Both outputs must share the same stem.`
    );
  }
}

function writePackageRecord(outDir, record) {
  fs.mkdirSync(path.join(outDir, "source"), { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "source", "package-build-record.json"),
    JSON.stringify(record, null, 2)
  );
}

function buildPackage({ outDir, lesson, worksheet, lessonSource, worksheetSource, packageSource }) {
  assertSameStem(lesson.meta, worksheet.meta);

  const lessonResult = buildLesson(lesson, outDir, { sourcePath: lessonSource });
  const worksheetResult = buildWorksheet(worksheet, outDir, { sourcePath: worksheetSource });

  if (lessonResult.stem !== worksheetResult.stem) {
    throw new Error(
      `Normalized stem mismatch: lesson="${lessonResult.stem}" worksheet="${worksheetResult.stem}".`
    );
  }

  const record = {
    builtAt: new Date().toISOString(),
    stem: lessonResult.stem,
    skill: "reading-courseware",
    outputs: {
      lesson: path.basename(lessonResult.outFile),
      worksheet: path.basename(worksheetResult.outFile),
    },
    sources: {
      lesson: path.resolve(lessonSource),
      worksheet: path.resolve(worksheetSource),
      package: packageSource,
    },
  };
  writePackageRecord(outDir, record);

  return {
    stem: lessonResult.stem,
    lessonFile: lessonResult.outFile,
    worksheetFile: worksheetResult.outFile,
    record,
  };
}

function parseArgs(argv) {
  let mode = "both";
  let args = [...argv];

  if (args[0] === "--lesson-only") {
    mode = "lesson";
    args = args.slice(1);
  } else if (args[0] === "--worksheet-only" || args[0] === "--workbook-only") {
    mode = "worksheet";
    args = args.slice(1);
  }

  if (mode === "lesson") {
    const [lessonFile, outDir] = args;
    if (!lessonFile || !outDir) usage();
    return {
      mode,
      outDir,
      lesson: readJson(lessonFile),
      lessonSource: lessonFile,
    };
  }

  if (mode === "worksheet") {
    const [worksheetFile, outDir] = args;
    if (!worksheetFile || !outDir) usage();
    return {
      mode,
      outDir,
      worksheet: readJson(worksheetFile),
      worksheetSource: worksheetFile,
    };
  }

  if (args.length === 2) {
    const [packageFile, outDir] = args;
    const pkg = readJson(packageFile);
    const worksheet = pkg.worksheet || pkg.workbook;
    if (!pkg.lesson || !worksheet) {
      throw new Error("package.json must contain top-level `lesson` and `worksheet` objects.");
    }
    return {
      mode: "both",
      outDir,
      lesson: pkg.lesson,
      worksheet,
      lessonSource: packageFile,
      worksheetSource: packageFile,
      packageSource: path.resolve(packageFile),
    };
  }

  if (args.length === 3) {
    const [lessonFile, worksheetFile, outDir] = args;
    return {
      mode: "both",
      outDir,
      lesson: readJson(lessonFile),
      worksheet: readJson(worksheetFile),
      lessonSource: lessonFile,
      worksheetSource: worksheetFile,
      packageSource: null,
    };
  }

  usage();
}

if (require.main === module) {
  const inputs = parseArgs(process.argv.slice(2));

  if (inputs.mode === "lesson") {
    const result = buildLesson(inputs.lesson, inputs.outDir, { sourcePath: inputs.lessonSource });
    console.log("Wrote", result.outFile);
    console.log(JSON.stringify({ ok: true, mode: "lesson", stem: result.stem }, null, 2));
  } else if (inputs.mode === "worksheet") {
    const result = buildWorksheet(inputs.worksheet, inputs.outDir, { sourcePath: inputs.worksheetSource });
    console.log("Wrote", result.outFile);
    console.log(JSON.stringify({ ok: true, mode: "worksheet", stem: result.stem }, null, 2));
  } else {
    const result = buildPackage(inputs);
    console.log("Wrote", result.lessonFile);
    console.log("Wrote", result.worksheetFile);
    console.log(
      JSON.stringify(
        { ok: true, mode: "both", stem: result.stem, outputs: result.record.outputs },
        null,
        2
      )
    );
  }
}

module.exports = { buildPackage, parseArgs };
