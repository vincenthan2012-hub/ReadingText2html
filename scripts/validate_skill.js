#!/usr/bin/env node
/**
 * Validate skill packaging metadata for WorkBuddy / Agent Skills.
 */
const fs = require("fs");
const path = require("path");

const skillRoot = path.resolve(__dirname, "..");

function readYamlVersion(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const m = fs.readFileSync(filePath, "utf8").match(/^version:\s*([^\n#]+)/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

function readYamlName(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const m = fs.readFileSync(filePath, "utf8").match(/^name:\s*([^\n#]+)/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

const version = fs.readFileSync(path.join(skillRoot, "VERSION"), "utf8").trim();
const manifestPath = path.join(skillRoot, "manifest.yaml");
const configPath = path.join(skillRoot, "config.yaml");
const skillMdPath = path.join(skillRoot, "SKILL.md");

if (!fs.existsSync(manifestPath)) {
  throw new Error("manifest.yaml is missing (required for WorkBuddy enterprise upload).");
}
if (!fs.existsSync(skillMdPath)) {
  throw new Error("SKILL.md is missing.");
}

const manifestVersion = readYamlVersion(manifestPath);
const manifestName = readYamlName(manifestPath);
const configVersion = readYamlVersion(configPath);

if (manifestVersion !== version) {
  throw new Error(`manifest.yaml version (${manifestVersion}) must match VERSION (${version}).`);
}
if (manifestName !== "reading-courseware") {
  throw new Error(`manifest.yaml name must be reading-courseware, got ${manifestName}.`);
}
if (configVersion && configVersion !== version) {
  throw new Error(`config.yaml version (${configVersion}) must match VERSION (${version}).`);
}

const skillMd = fs.readFileSync(skillMdPath, "utf8");
if (!/^---\r?\n[\s\S]*?name:\s*reading-courseware/m.test(skillMd)) {
  throw new Error("SKILL.md frontmatter name must be reading-courseware.");
}
if (!skillMd.includes("description:")) {
  throw new Error("SKILL.md frontmatter must include description.");
}

console.log(JSON.stringify({
  ok: true,
  name: "reading-courseware",
  version,
  manifest: true,
  config: fs.existsSync(configPath),
}, null, 2));
