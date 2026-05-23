# AGENTS.md

## What this repo is

A distributable `.opencode/` payload — agents, skills, and config — installed into other projects via `bunx`. This repo is **not** an application. The deliverable is the `.opencode/` directory tree.

## Repo layout

```
setup.mjs          # CLI entrypoint (bin). Copies .opencode/ into cwd.
bump.ts            # Version bump script (bun). Patches package.json + README refs, commits, tags, pushes.
.opencode/         # The payload that gets copied into consumer projects
  opencode.json    # OpenCode config (default agent, model settings)
  agents/          # Subagent definitions (.md with YAML frontmatter)
  skills/          # Skill bundles (SKILL.md + assets per skill)
```

There is no `src/`, no build step, no compiled output. The two root scripts (`setup.mjs`, `bump.ts`) and the `.opencode/` tree are the entire codebase.

## Key commands

```sh
bun run bump            # patch bump, commit, tag, push (uses bump.ts)
bun run bump:minor      # minor bump
bun run bump:major      # major bump
```

`bump.ts` also updates version refs in `README.md` automatically (regex replace on `instructor-agent#vX.Y.Z`).

To test the installer locally from another directory:

```sh
node /path/to/instructor-agent/setup.mjs          # copies .opencode/ into cwd
node /path/to/instructor-agent/setup.mjs --dry-run # preview only
node /path/to/instructor-agent/setup.mjs --force   # overwrite existing files
```

## Things an agent would get wrong

- **Two separate `package.json` files.** Root `package.json` is the npm/bunx package manifest. `.opencode/package.json` declares the `@opencode-ai/plugin` dependency for the OpenCode runtime. They serve different purposes.
- **`.opencode/.gitignore` ignores itself.** The `.opencode/.gitignore` lists `package.json`, `package-lock.json`, `bun.lock`, and `.gitignore` — meaning those files exist locally but are not tracked. This is intentional: consumer projects shouldn't receive these lockfiles from the installer.
- **Bumping is required for distribution.** `bunx` caches by git ref. Without a version bump (new tag), consumers get stale files. If you forget to bump, tell users to pin to the commit SHA.
- **`setup.mjs` refuses to run in its own directory.** It compares resolved SOURCE and TARGET paths and exits if they match. Don't try to test it from the repo root.
- **`bump.ts` requires `bun`.** It uses `Bun.file()`, `Bun.write()`, and `bun:shell` (`$`). It cannot run under plain Node.
- **`setup.mjs` requires Node >= 18.** It's the CLI entrypoint via `bunx`/`npx` and uses only `node:fs` and `node:path` — no Bun APIs.

## Editing the payload

All agent and skill content lives under `.opencode/`. When editing:

- Agent files are Markdown with YAML frontmatter (`description`, `mode`, `model`, `options`, `permission`).
- Skill bundles live in `.opencode/skills/<name>/SKILL.md` with optional asset files alongside.
- `opencode.json` sets the default agent (`instructor`) and model overrides per agent role.
- After any payload change, run `bun run bump` to make the new version available via `bunx`.
