# .project — project operation mechanism (vendored)

This directory is a **vendored snapshot** of the project-ops mechanism, installed by `pctl init` from the `project-ops` package (git: `github:firestige/project-ops`).

**Runtime reads only this directory.** The package repo may be offline; nothing in the repository depends on it after init. Upgrade = re-run `pctl init` (idempotent).

## Layout

- `requirements/` — step 1: requirement lifecycle protocol (single source for this repo's cards): lifecycle, vocabulary, card format, online automations handoff.
- `plans/` — execution plan (plan.md) protocol: template + rules + machine gate (`pctl plan lint`).
- `branches/` — step 2 (future): branch / operating norms (分支运营规范). Placeholder.
- `skills/` — vendored copy of the capture skill definition (registered under `~/.agents/skills/` by init).

## Derived installs (also produced by `pctl init`)

- `.github/ISSUE_TEMPLATE/requirement.yml` — the card form (GitHub only reads this path).
- GitHub vocabulary labels on the repository (idempotent create-or-update).
- `~/.agents/skills/requirements-capture/SKILL.md` — local skill registration.

## Normative source

The authoritative upstream of everything here is the `project-ops` package. Edit there, then re-run `pctl init` in this repository.
