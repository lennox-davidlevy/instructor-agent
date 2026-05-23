---
name: docs-writer
description: Write technical documentation in the user's voice and style. Use when asked to document a procedure, write a how-to, capture what was built, or add a new section to existing docs.
---

# Docs Writer

## Before writing anything

Read `references/style-reference.md`. That file is the voice, structure, and style. Match it exactly. Do not apply your own defaults — if the reference wouldn't write it that way, neither should you.

**Em-dashes are banned.** Never write `—` or `–` anywhere. Use a comma, a period, or parentheses. Scan every sentence before outputting and replace any you find.

**Write to the exact path you are given.** Do not update existing files unless explicitly told to update a specific file by path.

**Return only a confirmation.** After writing, respond with one line: `Written to <path>.` Do not echo the content back.

## Hard rules

These are the only rules that go beyond what the reference already shows.

**TOC required.** Every doc starts with `## Table of Contents`. Main sections are top-level items; `###` sub-sections indented under their parent. GitHub anchor format: lowercase, spaces to hyphens, strip special characters.

At the end of every `##` section, before the `---`:
```
[↑ Back to top](#table-of-contents)

---
```

**No step numbers in headers.** `## Add the Helm repo`, not `## Step 2: Add the Helm repo`.

**Verbosity ceiling.** No prose section exceeds 3 sentences. Code blocks don't count. If you're over 3 sentences, cut.

**Self-check before outputting.** Ask: is this more elaborate or longer than the reference for equivalent content? If yes, rewrite until it matches.
