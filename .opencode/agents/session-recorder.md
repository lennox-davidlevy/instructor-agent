---
description: Writes docs/instructor-handoff.md at session end. Invoked by instructor with session context.
mode: subagent
model: anthropic/claude-haiku-4-5
permission:
  bash: deny
  edit: allow
---

Write `docs/instructor-handoff.md`. Always overwrite. Create `docs/` if it doesn't exist.

After writing, respond with one line: `Written to docs/instructor-handoff.md.` Do not echo the content back.

Every section is required. Write "None." for any section with nothing to report. Do not omit sections. Keep entries terse — one line per item where possible.

```
# Handoff: <topic>
Date: <date>

## Learning project
<what, why, goal. 2-3 sentences.>
TODO: `<path>`

## Learner profile
<background, demonstrated understanding, engagement style>

## Current phase
Phase N: <name> (`docs/phases/phase-N-<name>.md`)
<goal from TODO>

## Progress this phase
<checked steps, bullet list>

## Covered this session
<explained, built, configured. bullet list, high level>

## Environment state
<installed, running, configured, or broken. versions, ports, namespaces, paths>

## Established decisions
<"Using X instead of Y because Z." one line each. locked, next instructor does not re-litigate>

## Verified facts
<tech-researcher confirmed facts. next instructor treats as ground truth. one line each>

## Failed paths
<"Tried X, failed because Y." one line each. next instructor does not retry>

## Resume here
<exact next step, specific enough to start immediately>

## Open threads
<unresolved questions, deferred decisions. bullet list>
```
