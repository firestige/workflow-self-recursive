# Wave11 Execution exclusive binding and unified candidate evidence

Status: `PASS — IMMUTABLE_RELEASE_CANDIDATE` (2026-08-26)

Wave11 implements #102 and freezes the exact `wsr-execution@0.1.3` / `wsr-dsh-intake@0.1.3` bytes that Wave12 must publish. It created no tag, GitHub Release, npm publication, DSH listing, Evidence publication, Contract `FROZEN` transition, or implementation conformance claim. Issue #102 remains OPEN until Wave12 publishes and verifies these exact bytes.

## Pinned inputs and checkpoints

- Execution input: `3179eb13514aaaef733c20cf55b03effd98fbf4e`.
- Approved design authority: #94; implementation card: #102; #93 was the provisional baseline replaced by this implementation.
- Wave10 superproject pin: `7d93175dc150a1a4a876c27a30e2625296ff56c8`.
- Evidence immutable candidate commit: `d37f454e2379fed17294c863482f6fcb0c75a97e`; manifest SHA-256 `28e35e81df4ca7b48f49e166e022eb04bafe0eae9b7347bde091f1c317de1904`.
- system-contracts candidate commit: `6f77510234961149922165666ed0be2d2f82b84b`; `evidence.query@0.1.0` remains `REVIEW_CANDIDATE`.
- Execution candidate build input: `8ec2820e5a16c69dbcd1c46f6d5ddba68d63614b`; candidate archive commit: `3c6259ca07276b1de8520fa6fc0d26c86fd93a41`.
- Superproject payload/repin commit: `d0cb418c2d97b40d0c77692781bc5b3f39df64c7`.
- Branch: `iter4/implementation`; component and superproject checkpoints are pushed to `origin/iter4/implementation`.

The external npm baseline was rechecked immediately before freeze: both `wsr-execution` and `wsr-dsh-intake` still resolve to immutable `0.1.2`. No `0.1.3` coordinate was published.

## Delivered behavior

- Intake private persistence is `execution.intake-bindings@2.0.0` and records immutable `deliveryBindingIdentity`. A v1 inventory migrates only after every recovered record exact-joins one live private Execution inventory item; unmatched, duplicate, corrupt, ambiguous, or identity-drifted state fails startup closed.
- Bootstrap makes Execution recovery ready before Intake migration/join. Binding cleanup occurs only after conclusive absence; uncertainty, process crash, elapsed time, Session loss, or a new request never frees an occupied worktree.
- A Session and an active Delivery each bind zero or one counterpart. `DETACHED` is valid, exact reclaim is explicit, and canonical worktree exclusivity remains owned by Execution current-slot truth. No third durable truth or cross-store transaction was introduced.
- Execution accepts only a private, typed, frozen, invocation-only `ConversationWorkspaceAuthorization`. It canonicalizes the path and verifies exact live DSH Session/workspace authority. Raw paths, cross-workspace recovery, and the former `input.worktree` fallback fail closed.
- Conflict/error ordering is deterministic and side-effect free for `SESSION_INTAKE_BOUND`, `DELIVERY_INTAKE_BOUND`, `DSH_INTAKE_WORKSPACE_UNAUTHORIZED`, `CONTENDED`, and exact `RECOVERY`.
- Presentation retains only the invocation Agent needed to render terminal output; it does not become an authorization oracle. Successful terminal results are visible in the same conversation rather than being hidden by the client.
- Public `execute`/`inspect`/`cancel`, FROZEN contracts, Runner five-module ownership, current-slot semantics, and `allowedWorktreeRoots` fail-closed policy were not changed.

## TDD and qualification defects closed

The initial tests failed because v1 bindings lacked identity, workspace input was a raw path, restart could not prove an exact Session/workspace join, and exclusivity existed only on one side. Those tests turned green after schema v2, private authorization, deterministic bootstrap migration, and bidirectional binding were implemented.

Exact-candidate qualification then exposed two product defects that unit-only testing did not conceal: the asynchronous terminal presenter lost its Session Agent after the command handler returned, and the browser client intentionally suppressed `SUCCEEDED` terminal nodes. Focused failing tests were added first; the presenter now retains only presentation capability through terminal/error, and the client renders the terminal result.

Because `0.1.3` is deliberately unpublished, qualification initially attempted to resolve the exact core dependency from npm. The qualification installer now applies a temporary profile-only override to the same local `wsr-execution-0.1.3.tgz`; the plugin tarball and its exact dependency metadata remain unchanged. Release publication still requires core-before-intake ordering.

One attempted parallel run caused four existing five-second shell/typecheck cases to time out under local resource contention. It is excluded from acceptance. The unchanged tests passed in the final sequential full and coverage runs; no timeout was raised or skipped.

## Final gates

```text
pnpm test:full: 68 files, 567 tests PASS
pnpm test:coverage: PASS
  Statements 90.03% · Branches 85.71% · Functions 94.21% · Lines 95.41%
pnpm typecheck: PASS
pnpm build: PASS
pnpm verify:dsh-intake: PASS
pnpm release:config:verify: PASS
pnpm release:matrix:verify: PASS
pnpm release:check-coordinates: PASS (0.1.3 lockstep)
pnpm release:verify release/candidates/iter4-wave11: PASS (2 artifacts)
pnpm release:simulate happy: STABLE
pnpm release:simulate npm-core-published-intake-failed: RECOVERABLE_PARTIAL
pnpm release:policy candidate 0.1.3-rc.1 0.1.3: PASS
exact-candidate DSH interactive qualification: PASS
exact-candidate DSH product/browser qualification: PASS
  hello terminal: Workflow finished · SUCCEEDED
  presentation: command-accepted, delivery-running, action-output, terminal-result
  grilling: 3 questions, 2 ordinary answers, agreement confirmed, action finish observed
  exact registered workspace outside configured public roots: PASS
  fresh-session isolation: PASS
  restart manifest and binding identity preservation: PASS
package lifecycle 0.1.2 -> 0.1.3 -> remove -> reinstall: PASS
git diff --check: PASS
```

## Immutable candidate

Tracked Execution metadata: `execution-system/release/candidates/iter4-wave11/release-metadata.json`.

- Metadata SHA-256: `cae4b4e126fe075c8a5826d17fdc664706b02bc0cfe1ce9bd40971a45a4999bd`.
- Release-notes SHA-256: `9e72e4052350ec9c3c4417282bcb494d5b29b2f6599a1f7216288c5db501dbc3`.
- `wsr-execution-0.1.3.tgz`: 174990 bytes, `sha256:7c5ab0c061d2cc9f6e3d486e885ee2072870eb09aa0284f0285547fb828d3ca0`.
- `wsr-dsh-intake-0.1.3.tgz`: 22189 bytes, `sha256:d518a687c32077aa8ced55a446da4c744461d3bb58d85aa705638073979618b8`.

The final rebuild after release-note generation reproduced the exact two tgz digests already exercised by the product, interactive, and lifecycle qualifications. Candidate archival is a generated-evidence-only commit excluded from changelog input, preventing recursive candidate drift.

The append-only unified manifest is `release/candidates/iter4-wave11.json`, SHA-256 `c5b78ce1d2c8a5b813032254759c93c9d94bbc1f6a6c250f4511e9dc7c534ef4`. It binds these Execution artifacts, the Wave10 Evidence candidate, the system-contracts review candidate, and the superproject payload commit. Wave12 must use this manifest as the only bits input and must add publication state in a new record; it must never edit or rebuild this candidate.

## Handoff

Wave12 may begin with the partial-failure matrix and Contract gates. It must preserve the candidate bytes above, publish core before Intake in the same `0.1.3` window, and close #102 only after exact stable publication and post-publication product verification. Until then, the unified manifest intentionally carries `CONTRACT_NOT_FROZEN_OR_PUBLISHED` and `NO_IMPLEMENTATION_CONFORMANCE_CLAIM`.
