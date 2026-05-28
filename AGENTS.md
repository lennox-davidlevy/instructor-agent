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

## Agent architecture

The system uses a **cheap orchestrator, expensive specialists** pattern. Two primary agents handle different phases of a learning project, with subagents providing specialized capabilities.

### Primary agents (user switches between these with Tab)

| Agent | Model | Purpose |
|-------|-------|---------|
| **instructor** (default) | Sonnet 4.6 | Daily driver. Follows the plan, delivers one step at a time, delegates to subagents. Handles session start/wrap-up. |
| **planner** | Opus 4.8 | Architect. Runs once per project to create a detailed lesson plan via the learning-roadmap skill. Returns for replanning. |

### Subagents (invoked by primary agents or via @mention)

| Agent | Model | Purpose |
|-------|-------|---------|
| **advisor** | Opus 4.8 | Escalation. Invoked by the instructor for complex debugging, architecture questions, or off-script situations. |
| **code-reviewer** | Opus 4.8 | Reviews user code in learning context. Calibrates for intentionally wrong steps. |
| **docs-writer** | Sonnet 4.6 | Writes phase documentation. Owns voice and structure. |
| **roadmap-writer** | Sonnet 4.6 | Writes/edits the TODO file. Called by planner (initial creation) and instructor (mid-session edits). |
| **session-recorder** | Haiku 4.5 | Writes/updates the handoff doc for session continuity. |
| **tech-researcher** | Sonnet 4.6 | Fetches authoritative external docs. Used during both planning and instruction. |

### Built-in agent overrides (in opencode.json)

| Agent | Model | Rationale |
|-------|-------|-----------|
| **build** | Opus 4.8 | Writes code autonomously — needs strong reasoning. |
| **plan** | Sonnet 4.6 | Built-in analysis agent. Heavy planning is handled by the custom planner agent. |
| **explore** | Haiku 4.5 | Fast, read-only codebase search. |

### Design rationale

Opus runs where it has the most leverage: planning (once, upfront), escalation (on demand), code review (needs deep reasoning), and autonomous code writing (build). The instructor handles 95%+ of user messages on Sonnet, which is sufficient for following a well-structured plan and delivering step-by-step instruction. The intelligence is concentrated at high-leverage decision points, not on routine delivery.

## Editing the payload

All agent and skill content lives under `.opencode/`. When editing:

- Agent files are Markdown with YAML frontmatter (`description`, `mode`, `model`, `options`, `permission`).
- Skill bundles live in `.opencode/skills/<name>/SKILL.md` with optional asset files alongside.
- `opencode.json` sets the default agent (`instructor`) and model overrides per agent role.
- After any payload change, run `bun run bump` to make the new version available via `bunx`.
