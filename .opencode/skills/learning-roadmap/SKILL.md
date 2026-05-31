---
name: learning-roadmap
description: Plan a structured learning project with the user. Use this skill whenever the user wants to learn a set of technologies by building something real, asks for a learning path, says things like "I want to learn X by building Y," or asks to plan, scope, or sequence the phases of a hands-on learning project. Also use when they want a phased TODO or roadmap for picking up unfamiliar tech. Runs a multi-stage conversation to define the app, agree on phases, verify integrations, and produce a phased TODO document.
---

# Learning Roadmap

Guide the user through a staged conversation to produce a phased, prescriptive learning TODO. Read `references/example-todo.md` now. That file is the target format and granularity for the final output.

The TODO is the instructor agent's primary reference. The instructor runs on a smaller model and follows this plan one step at a time. The more accurate detail you front-load here — specific commands, expected output, gotchas, the reasoning for ordering — the less real-time reasoning the instructor has to do, and the better the learning experience becomes.

This is not a tutorial the user reads top-to-bottom. It is a working checklist the instructor delivers from. The user is an experienced engineer who will research as they go, but the instructor should never have to guess what a step means or invent a command on the fly.

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
- Leave the final phase as a placeholder named "Capstone (TBD)" — its shape is chosen in Stage 3.5, not assumed here

Present the phase list to the user. Wait for approval, modifications, or reordering before proceeding.

---

## Stage 3.5: Choose the capstone

The final phase is what the user does once the core build works. Its purpose is to convert the project from a finished exercise into something with lasting value. Don't assume which shape they want — present the three options below with their one-line trade-offs and your recommendation, then wait for the user to pick.

- **Reusable asset / template:** parameterize what they built into a starter they can spin new projects from — extract config, document the variables, strip project-specific details, leave a "fork and fill in" scaffold. Best when the user expects to build similar things repeatedly and wants leverage, not just understanding.
- **Real app:** harden the build toward production — error handling, observability, CI/CD, real domain/TLS, scaling, security review. Best when the project is something they actually want to keep running and use.
- **Tear down and rebuild:** delete everything and rebuild from their own docs, fixing the docs whenever they get stuck. The strongest proof of understanding, but produces nothing reusable. Best when the goal is purely learning and the user wants to verify mastery.

Recommend based on the end state captured in Stage 2 (purely-learning → tear down and rebuild; demo they'll keep → real app; "I'll build more like this" → reusable asset). State your recommendation, but let the user choose.

Once chosen, name the final phase accordingly and design it around that shape in Stage 4. See `references/example-todo.md` for a worked final phase of each type.

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

Write the full TODO phase by phase. The output is prescriptive — closer to a lesson plan than a checklist. The instructor needs enough detail in each step to deliver it without inventing specifics.

### Format

- `### Phase N: <name>` with `**Goal:** <one sentence>` immediately after
- Steps are `- [ ] **Step name**` with sub-bullets containing the prescriptive detail
- Mark optional steps with `(Optional)` in the step name
- Horizontal rules (`---`) between phases

### What every step needs

For each step, include the relevant items from this list (not all will apply to every step):

- **The specific command(s)** to run. Real commands with real flags, not pseudocode
- **Required config values** — flag names, env var names, file paths, ports, partition counts, replica counts
- **What "done" looks like** — expected output, log lines, status checks the user can use to verify
- **Gotchas** — version-specific behavior, platform quirks (OCP vs. plain K8s), things that look like bugs but aren't, things that fail silently
- **The reasoning for ordering or choice** — why this step comes before the next one, why this tool over an alternative, why this is intentionally the wrong long-term answer (in problem-first phases)

### Research while writing

Don't write Stage 4 from memory if you're uncertain. Invoke **tech-researcher** when:

- You're about to write a command with specific flags you haven't verified
- A step depends on version-specific behavior
- You're inferring an integration pattern rather than recalling a documented one
- You're writing for a platform combination (e.g., Vault on OpenShift) where the standard docs may not apply

Better to pause and verify than to ship a step that will fail in the instructor's hands.

### Length and density

Each step's sub-bullets typically run 3-8 lines. Less than that usually means underspecified; more than that usually means the step should be split. The example file averages around 5 lines per step.

Present the full draft to the user for review before writing to file.

---

## Stage 5: Write to file

Save to `docs/<project-name>-TODO.md` in the current working directory. The `-TODO.md` suffix is required — it distinguishes the checklist from phase docs and lets the instructor find it by glob. Example: `docs/confluent-hashi-learning-TODO.md`. Do not ask the user for a path.

Invoke **roadmap-writer** with the composed content and the target path. Do not write the file directly.
