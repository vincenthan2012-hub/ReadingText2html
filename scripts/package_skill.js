#!/usr/bin/env node
/**
 * Build a WorkBuddy-ready skill ZIP (manifest.yaml + SKILL.md + resources).
 * Excludes .git, .DS_Store, and dist/ so uploads stay clean.
 *
 * Usage (from skill root):
 *   node scripts/package_skill.js [output_dir]
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const skillRoot = path.resolve(__dirname, "..");
const version = fs.readFileSync(path.join(skillRoot, "VERSION"), "utf8").trim();
const outDir = path.resolve(process.argv[2] || path.join(skillRoot, "dist"));
const zipName = `reading-courseware-${version}.zip`;
const zipPath = path.join(outDir, zipName);

function readYamlVersion(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const m = fs.readFileSync(filePath, "utf8").match(/^version:\s*([^\n#]+)/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

const manifestVersion = readYamlVersion(path.join(skillRoot, "manifest.yaml"));
const configVersion = readYamlVersion(path.join(skillRoot, "config.yaml"));
if (!manifestVersion) {
  console.error("manifest.yaml is required for WorkBuddy upload.");
  process.exit(1);
}
if (manifestVersion !== version) {
  console.error(`VERSION (${version}) must match manifest.yaml version (${manifestVersion}).`);
  process.exit(1);
}
if (configVersion && configVersion !== version) {
  console.error(`VERSION (${version}) must match config.yaml version (${configVersion}).`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

const excludeArgs = [
  "-x", "*.git/*",
  "-x", "*/.git/*",
  "-x", "*/.DS_Store",
  "-x", ".DS_Store",
  "-x", "dist/*",
  "-x", "*/dist/*",
];

try {
  execSync(
    `zip -r ${JSON.stringify(zipPath)} . ${excludeArgs.join(" ")}`,
    { cwd: skillRoot, stdio: "inherit" }
  );
} catch (err) {
  console.error("Failed to create ZIP. Ensure the `zip` command is available.");
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, version, zip: zipPath }, null, 2));
