# Modern Git Workflow Reference

Opinionated for GitHub Flow + squash-merge. Modern porcelain (Git 2.23+). Always use the modern forms below — do not revert to legacy equivalents.

---

## 1. Branch creation and switching

**Use `git switch` and `git restore`. Never `git checkout` for these.**

```sh
git switch <branch>                          # switch to existing branch
git switch -c <new-branch>                  # create + switch
git switch -C <new-branch> <start-point>    # create or reset to start-point, then switch
git switch -c feature/x origin/main         # branch from remote ref, auto-tracks
git switch --detach <commit>                # detached HEAD (not git checkout <commit>)
```

`-C` = "create or reset" — if `<new-branch>` already exists, it's force-reset to `<start-point>`. Use this in the post-merge cleanup (§13).

**Restoring files — use `git restore`. Never `git checkout -- <file>` or `git reset HEAD <file>`.**

```sh
git restore <file>                          # discard unstaged changes (gone, no reflog)
git restore --staged <file>                 # unstage (replaces: git reset HEAD <file>)
git restore --source=<commit> <file>        # pull file from a specific commit
git restore --source=HEAD~3 --staged --worktree <file>
```

**Gotcha:** `git restore <file>` discards uncommitted changes permanently — no reflog entry.

---

## 2. Fetching, pulling, and pruning

```sh
git fetch --prune                           # update remotes + drop stale remote-tracking refs
git config --global fetch.prune true        # apply globally
```

**Pull config — use `pull.ff only` for squash-merge GitHub Flow:**

```sh
git config --global pull.ff only            # refuses if can't fast-forward (recommended)
# OR for long-lived branches that track upstream:
git config --global pull.rebase true
```

---

## 3. Force-pushing safely

**Use `--force-with-lease --force-if-includes`. Never bare `--force`.**

```sh
git push --force-with-lease --force-if-includes
git config --global push.useForceIfIncludes true
```

**Gotcha (`--force-if-includes`):** `--force-with-lease` alone has a footgun — a background `git fetch` (editor, CI agent) updates your remote-tracking ref, making the lease check pass, so you silently clobber teammates' commits. `--force-if-includes` additionally checks the remote tip is reachable from your local reflog (you actually saw it). Always use both.

**Rule:** never force-push to `main` or shared branches. Routine on personal feature branches after `rebase -i` or `--amend`.

---

## 4. Squash-merge workflows

When GitHub squash-merges a PR, it creates a new commit on `main` with a different SHA — your branch tip is not reachable from `main`.

```sh
git branch -D feature/x    # -D required after squash-merge; -d refuses ("not fully merged")
```

`-D` is correct and safe here. Reflog retains commits for ~90 days.

**"Never check out local `main`" pattern:**

```sh
git fetch origin --prune
git switch -c feature/next origin/main      # branches from origin/main, auto-tracks
```

Local `main` has no value in squash-merge flow — `origin/main` is the source of truth.

---

## 5. Commit hygiene

**Conventional Commits format (preferred for squash-merge flow):**

```
<type>[scope]: <description>
```

Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`. `feat!:` = breaking change.

PR title = squashed commit on `main`. Individual WIP commits can be loose.

```sh
git commit --amend --no-edit               # fold staged into last commit
git commit --fixup=<sha>                   # mark fixup against earlier commit
git rebase -i --autosquash <base>          # collapse fixups before push
git config --global rebase.autosquash true # apply globally
```

---

## 6. Stash

**Use `git stash push`. Never `git stash save` (deprecated).**

```sh
git stash push -m "wip: description"
git stash push -m "partial" path/to/file   # pathspec (not possible with save)
git stash list
git stash show -p stash@{0}
git stash pop                              # apply + drop
git stash apply stash@{2}                 # apply without dropping
git stash drop stash@{2}
git stash -u                              # include untracked files
```

---

## 7. Rebase and the `--ours`/`--theirs` flip

**The #1 gotcha in Git. `--ours`/`--theirs` means opposite things during rebase vs merge.**

During `git merge feature` (on `main`):
- `--ours` = `main` (current branch)
- `--theirs` = `feature` (being merged in)

During `git rebase main` (on `feature`):
- `--ours` = `main` (the branch you're rebasing *onto*)
- `--theirs` = `feature` (your commits being replayed — *your* changes are `theirs`)

Mental model: `ours` = "already in place"; `theirs` = "being applied on top." During rebase, you're the one being applied — so your changes are `theirs`. This applies equally to `git restore --ours/--theirs`.

**`--onto` for surgical rewrites:**

```sh
git rebase --onto <newbase> <oldbase> <branch>
# Example: feature branched off wrong-base, move to main:
git rebase --onto main old-base feature
```

**`rerere` — reuse recorded resolutions:**

```sh
git config --global rerere.enabled true    # auto-replay resolutions on repeat conflicts
```

---

## 8. Conflict resolution

**Use `zdiff3` — shows the merge base for easier resolution:**

```sh
git config --global merge.conflictStyle zdiff3
```

Conflict markers with `zdiff3`:
```
<<<<<<< HEAD
our version
||||||| merged common ancestors
original version
=======
their version
>>>>>>> feature/x
```

**Accepting one side wholesale — use `git restore`, not `git checkout`:**

```sh
git restore --ours <file>       # keep our version (subject to rebase flip above!)
git restore --theirs <file>     # take their version
git add <file>
```

**Aborting:**

```sh
git merge --abort
git rebase --abort
git rebase --skip
git cherry-pick --abort
```

---

## 9. Recommended global config (paste-ready)

```sh
git config --global init.defaultBranch main
git config --global pull.ff only
git config --global fetch.prune true
git config --global rebase.autosquash true
git config --global rebase.autostash true
git config --global rebase.updateRefs true
git config --global rerere.enabled true
git config --global push.useForceIfIncludes true
git config --global push.autoSetupRemote true
git config --global branch.sort -committerdate
git config --global column.ui auto
git config --global merge.conflictStyle zdiff3
git config --global diff.algorithm histogram
git config --global diff.colorMoved zebra
git config --global feature.manyFiles true
git config --global core.fsmonitor true        # Git 2.37+
git config --global credential.helper osxkeychain  # macOS

# Aliases
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.st "status -sb"
git config --global alias.amend "commit --amend --no-edit"
git config --global alias.unstage "restore --staged"
git config --global alias.undo "reset --soft HEAD~1"
```

---

## 10. Recovery

```sh
git reflog                          # HEAD's reflog
git reflog show <branch>            # specific branch
git reflog --date=iso

git reset --hard ORIG_HEAD          # undo last merge/rebase (ORIG_HEAD set before destructive ops)

git switch -c rescue <sha>          # recover lost commit to new branch (non-destructive)
git fsck --lost-found               # last-resort: find commits not in any reflog
```

---

## 11. GitHub CLI

```sh
gh pr create --fill                          # use commit message as title+body — prefer this
gh pr create --fill --draft
gh pr create --title "title" --body "short description"   # only if fill isn't enough
gh pr checkout <number>
gh pr status
gh pr view --web
gh pr merge --squash --delete-branch
gh pr review --approve
gh pr diff
gh issue create
```

**Never** use `--body "$(cat <<'EOF'...EOF)"` heredoc syntax for `gh pr create`. Use `--fill` or a plain `--body "..."` string. The heredoc is unnecessary complexity.

---

## 12. Worktrees

```sh
git worktree add ../repo-hotfix -b hotfix/name origin/main
git worktree add ../repo-review review-branch   # track existing branch
git worktree list
git worktree remove ../repo-hotfix
git worktree prune                              # clean up metadata for manually-deleted worktrees
```

**Gotcha:** the same branch cannot be checked out in two worktrees simultaneously.

---

## 13. Post-merge cleanup chain

After a PR is squash-merged on GitHub:

```sh
git fetch origin --prune                    # 1. update origin/main, drop dead remote refs
git switch -C <new-branch> origin/main      # 2. create or reset new branch from origin/main
git branch -D <merged-branch>               # 3. force-delete the squashed local branch
```

**Never touch local `main`.** `origin/main` is the source of truth. Do not `git switch main` or `git pull` as part of this flow.

**Do NOT use this old pattern:**
```sh
git switch main          # ← wrong: unnecessary, local main has no value
git pull --ff-only       # ← wrong: use fetch instead
git branch -D feature    # -d fails after squash-merge regardless
git switch -c feature/next
```

The 3-command pattern above replaces all of that.

---

## 14. Stacked PRs

```sh
git rebase --update-refs origin/main        # updates refs for all stacked branches
git config --global rebase.updateRefs true  # apply globally
```

---

## 15. Repo maintenance

```sh
git maintenance start    # register for background maintenance (launchctl/systemd/schtasks)
git maintenance stop
git maintenance run --task=gc
```
