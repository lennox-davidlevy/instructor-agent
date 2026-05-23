#!/usr/bin/env bun
// Bump the version in package.json and (optionally) commit + tag + push.
//
// Usage:
//   bun bump.ts             # patch bump, commit, tag, push
//   bun bump.ts minor       # minor bump
//   bun bump.ts major       # major bump
//   bun bump.ts --no-push   # bump + commit + tag, skip push
//   bun bump.ts --dry-run   # show what would happen

import { $ } from "bun";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_PUSH = args.includes("--no-push");
const kind =
  (args.find((a) => ["patch", "minor", "major"].includes(a)) as
    | "patch"
    | "minor"
    | "major"
    | undefined) ?? "patch";

const pkgPath = new URL("./package.json", import.meta.url);
const pkg = await Bun.file(pkgPath).json();

const [major, minor, patch] = pkg.version.split(".").map(Number);
const next =
  kind === "major"
    ? `${major + 1}.0.0`
    : kind === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

console.log(`${pkg.version} → ${next} (${kind})`);

if (DRY) {
  console.log("(dry run — nothing changed)");
  process.exit(0);
}

pkg.version = next;
await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

await $`git add package.json`;
await $`git commit -m ${`chore: bump to v${next}`}`;
await $`git tag ${`v${next}`}`;

if (!NO_PUSH) {
  await $`git push`;
  await $`git push --tags`;
}

console.log(`✓ v${next}${NO_PUSH ? " (not pushed)" : " pushed"}`);
