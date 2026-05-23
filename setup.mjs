#!/usr/bin/env node
// instructor-agent: drop .opencode/ agents & skills into the current project.
//
// Usage:
//   npx github:davidlevy/instructor-agent              # copy, skipping existing files
//   npx github:davidlevy/instructor-agent --force      # overwrite existing files
//   npx github:davidlevy/instructor-agent --dry-run    # show what would change
//   npx github:davidlevy/instructor-agent --help

import { readdirSync, statSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force") || args.has("-f");
const DRY = args.has("--dry-run") || args.has("-n");
const HELP = args.has("--help") || args.has("-h");

if (HELP) {
  console.log(`instructor-agent — drop .opencode/ into the current project

Usage:
  instructor-agent [options]

Options:
  -f, --force      Overwrite files that already exist
  -n, --dry-run    Show what would change without writing
  -h, --help       Show this help
`);
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SOURCE = resolve(__dirname, ".opencode");
const TARGET = resolve(process.cwd(), ".opencode");

if (!existsSync(SOURCE)) {
  console.error(`error: source not found at ${SOURCE}`);
  console.error("This package is missing its .opencode/ payload.");
  process.exit(1);
}

if (resolve(SOURCE) === resolve(TARGET)) {
  console.error("error: refusing to copy .opencode/ onto itself.");
  console.error("Run this from a different project directory.");
  process.exit(1);
}

const stats = { copied: [], skipped: [], overwritten: [] };

/** @param {string} src @param {string} dst */
function walk(src, dst) {
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const dstPath = join(dst, entry.name);
    if (entry.isDirectory()) {
      if (!DRY && !existsSync(dstPath)) mkdirSync(dstPath, { recursive: true });
      walk(srcPath, dstPath);
    } else if (entry.isFile()) {
      const rel = relative(process.cwd(), dstPath);
      const exists = existsSync(dstPath);
      if (exists && !FORCE) {
        stats.skipped.push(rel);
        continue;
      }
      if (!DRY) {
        mkdirSync(dirname(dstPath), { recursive: true });
        copyFileSync(srcPath, dstPath);
      }
      if (exists) stats.overwritten.push(rel);
      else stats.copied.push(rel);
    }
  }
}

console.log(`instructor-agent → ${relative(process.cwd(), TARGET) || ".opencode"}`);
if (DRY) console.log("(dry run — no files will be written)\n");

walk(SOURCE, TARGET);

const line = (label, list) =>
  list.length ? `\n${label} (${list.length}):\n  ${list.join("\n  ")}` : "";

console.log(line("copied", stats.copied));
console.log(line("overwritten", stats.overwritten));
console.log(line("skipped (already exists)", stats.skipped));

const totalChanged = stats.copied.length + stats.overwritten.length;
console.log(
  `\n${DRY ? "would " : ""}wr${DRY ? "ite" : "ote"} ${totalChanged} file${
    totalChanged === 1 ? "" : "s"
  }, skipped ${stats.skipped.length}.`
);

if (stats.skipped.length && !FORCE && !DRY) {
  console.log("Re-run with --force to overwrite existing files.");
}
