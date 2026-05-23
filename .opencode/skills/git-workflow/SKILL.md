---
name: git-workflow
description: Answer git questions and guide workflows — branch creation, force-pushing, squash-merge cleanup, conflict resolution (including the --ours/--theirs rebase flip), rebase vs merge, stash, worktrees, pre-commit hooks, post-merge cleanup chain, recovery with reflog, recommended global config, and GitHub CLI. Use this skill whenever the user asks how to do something in git or what git command to run.
---

Consult `references/git-best-practices.md` for all guidance. It covers modern Git (post 2.23) with GitHub Flow + squash-merge as the assumed workflow.

Key sections to know so you can jump straight to the right one:

| Topic | Section |
|---|---|
| `git switch` / `git restore` vs `git checkout` | §1 |
| Fetch, pull, pruning stale remote refs | §2 |
| `--force-with-lease` and `--force-if-includes` | §3 |
| Squash-merge consequences and `-D` cleanup | §4 |
| Commit hygiene, amend, `rebase -i --autosquash` | §5 |
| `git restore`, stash push | §6 |
| Rebase vs merge, `--ours`/`--theirs` flip, `--onto`, `rerere` | §7 |
| Conflict markers, `zdiff3`, aborting | §8 |
| Recommended global config (paste-ready) | §9 |
| `reflog`, `ORIG_HEAD`, `fsck --lost-found` | §10 |
| Aliases, `gh` CLI commands | §11 |
| Worktrees | §12 |
| Pre-commit hooks (`pre-commit` framework, Husky) | §13 |
| PR best practices | §14 |
| Post-merge cleanup chain (3 commands) | §15 |
| `git maintenance`, `rebase --update-refs` | §16 |

When answering, give the exact command(s) first, then a one-line explanation. For gotchas (especially the `--ours`/`--theirs` rebase flip in §7), always call them out explicitly.
