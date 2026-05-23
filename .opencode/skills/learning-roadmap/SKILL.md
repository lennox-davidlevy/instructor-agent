---
name: learning-roadmap
description: Plan a structured learning project with the user. Use this skill whenever the user wants to learn a set of technologies by building something real, asks for a learning path, says things like "I want to learn X by building Y," or asks to plan, scope, or sequence the phases of a hands-on learning project. Also use when they want a phased TODO or roadmap for picking up unfamiliar tech. Runs a multi-stage conversation to define the app, agree on phases, verify integrations, and produce a phased TODO document.
---

# Learning Roadmap

Guide the user through a three-stage conversation to produce a phased learning TODO. Read `references/example-todo.md` now. That file is the target format and granularity for the final output.

The TODO is not a tutorial. It is a living checklist the user works through independently. Steps are high-level with hints where useful, not step-by-step instructions. The user will research or already know how to execute each item.

---

## Stage 1: Understand the goal

Have a real conversation. Don't fire a list of questions at once — ask one or two, listen, follow up. You're trying to understand:

- What they want to build and why (the "why" often reveals the right phase order)
- Which technologies they want to touch — and whether those are hard requirements or preferences
- Their current level with each technology (new / some exposure / comfortable)
- The end state: is this purely for learning, a demo they'll keep, or something production-bound?
- Any constraints: time, cluster access, cloud accounts, cost

One step at a time. Wait for answers before moving on.

---

## Stage 2: Reflect and confirm

Before designing anything, summarize what you heard:

- The app and what it does
- The technology stack and why each piece is included
- Their level with each technology
- The intended end state

Ask the user to confirm or correct. Don't proceed to phase design until this is locked.

---

## Stage 2.5: Propose a learning approach

Before designing phases, offer 2-3 approaches to structuring the learning. The right shape depends on the user's goal and existing knowledge, and they should choose rather than inherit one silently. Common options:

- **Bottom-up:** start with infrastructure/primitives, build the app on top once the foundation is understood
- **Top-down:** get a working app first, then harden, optimize, and replace hand-waving with real understanding
- **Problem-first:** deliberately do it the wrong way (hardcoded secrets, no TLS, manual steps), experience the pain, then learn the proper fix — most instructive but requires patience

Present the options with a one-line trade-off each and your recommendation. Wait for the user to pick one before designing the phase structure around it.

---

## Stage 3: Phase structure

Propose phase names and goal statements only, no checklist detail yet. Structure phases so that:

- Each phase has a single clear goal (one sentence, starts with a verb)
- Complexity builds deliberately. Earlier phases set up problems that later phases solve
- Technologies are introduced one at a time where possible, not all at once
- The final phase is always a polish/rebuild phase: "prove you understand it by rebuilding from your own docs"

Present the phase list to the user. Wait for approval, modifications, or reordering before proceeding.

---

## Integration audit (before Stage 4)

After phase structure is agreed, audit every point where two technologies hand off to each other. For each integration, assess your own confidence:

- **Known:** you can cite a specific, documented pattern for this integration. Proceed.
- **Inferred:** you believe it works but are reasoning from general knowledge, not a specific example. Invoke tech-researcher to verify before finalizing that phase.
- **Unknown:** novel or version-specific combination you have no strong signal on. Invoke tech-researcher before even finalizing the phase.

Be transparent with the user. Say: "Before we lock in Phase N, I want to verify the X ↔ Y integration, let me check." Then proceed immediately. Do not wait for the user to respond before invoking tech-researcher. Don't do silent background research.

Pay particular attention to:
- Version-specific compatibility (operator versions, chart versions, platform versions)
- Integrations between technologies the user listed as new to them
- Any phase that depends on a specific feature of a cloud service or operator

---

## Stage 4: Fill in the checklist

Write the full TODO phase by phase. For each phase:

- Use `### Phase N: <name>` with `**Goal:** <one sentence>` immediately after
- Steps are `- [ ] **Step name**` with sub-bullets for hints, not instructions
- Hints include: library names, CLI commands worth knowing, config flags, things easy to get wrong
- Mark optional steps with `(Optional)` in the step name
- Steps should be completable by someone who researches as they go, not someone following a recipe
- Horizontal rules (`---`) between phases

Present the full draft to the user for review before writing to file.

---

## Stage 5: Write to file

Ask the user where to save the file. If they don't have a preference, default to `docs/<project-name>.md` in the current working directory.

Invoke **roadmap-writer** with the composed content and the target path. Do not write the file directly.
