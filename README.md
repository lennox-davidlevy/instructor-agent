# instructor-agent

Drop-in `.opencode/` agents and skills for any project.

## Usage

In any project directory:

```sh
bunx github:lennox-davidlevy/instructor-agent#v1.0.9
```

Copies `.opencode/agents/` and `.opencode/skills/` into the current working
directory, skipping any files that already exist.

### Flags

| Flag              | Description                                  |
| ----------------- | -------------------------------------------- |
| `--force`, `-f`   | Overwrite files that already exist           |
| `--dry-run`, `-n` | Print what would change without writing      |
| `--help`, `-h`    | Show help                                    |

### Examples

```sh
# Preview without writing
bunx github:lennox-davidlevy/instructor-agent#v1.0.9 --dry-run

# Refresh everything to the latest versions
bunx github:lennox-davidlevy/instructor-agent#v1.0.9 --force

# Pin to a specific commit
bunx github:lennox-davidlevy/instructor-agent#<sha>
```

## Layout

```
.opencode/
  agents/        # subagent definitions (.md)
  skills/        # skill bundles (SKILL.md + assets)
```

The package mirrors this structure at its root, so the setup script is a
straight recursive copy.

## Updating

Edit `.opencode/`, then bump and push in one shot:

```sh
bun run bump            # patch bump → commit → tag → push
bun run bump:minor
bun run bump:major
```

Bumping the version is what makes `bunx` actually fetch a fresh copy. Without
a version change, `bunx` will serve a stale cached build. If you forget to
bump, pin to the commit SHA instead: `bunx github:lennox-davidlevy/instructor-agent#<sha>`.

To pull the new versions into a consuming project, re-run with `--force`:

```sh
bunx github:lennox-davidlevy/instructor-agent#v1.0.9 --force
```

## Why install from GitHub instead of publishing to npm?

No publish step. Edit → commit → push. Consumers always get the latest from
`main` (or whatever ref they pin to).
