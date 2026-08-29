# Iteration 6 authority migration preparation

`authority-migration.json` is the versioned, machine-readable execution contract for issue #124. It is bound to the merged authority commit `6ed68756` and is intentionally preparation-only.

The tooling has three commands:

- `validate` checks manifest structure, frozen-authority coverage, command effects, and rollback ordering.
- `scan` reports every tracked old-coordinate occurrence as `active`, `historical`, `rollback`, or `fixture`. `--enforce-target` fails while any active occurrence remains.
- `rewrite --direction forward|reverse` applies only exact coordinate substitutions in a local worktree and preserves allowlisted historical, rollback, and fixture inputs. It never runs commands stored in the manifest.

Run the complete local qualification with:

```bash
python3 qualification/iter6/migration/qualify.py
```

The staged files are desired cutover inputs, not active configuration. Repository renames, publisher changes, npm deprecation, App installation changes, image/Release authority switches, and `wsr-ui` archival remain gated remote effects owned by #124/#125.

The current GitHub CLI credential cannot enumerate the `wsr-release` App installation, and npm exposes no supported CLI for trusted-publisher settings. Their exact desired states are staged, but an authorized administrator must apply and verify them during the approved cutover window.
