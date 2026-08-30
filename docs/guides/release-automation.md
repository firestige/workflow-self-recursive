# Release automation

Iteration 4 makes the release machinery implementation-ready. Wave 12 uses it for the real Contract, Execution, and Evidence publication sequence after the required approval gates.

## Shared lifecycle

Every active component declares `wsr.release-component@1.0.0` with its repository, `main` release branch, `release/next` trigger branch, asset mode, acceptance command, publisher adapter, remote qualification mode, and `qualified-candidate-exact-assets` stable policy.

The only supported transition is:

`SOURCE → ACCEPTED → BUILT → MANIFESTED → RC → QUALIFIED → COMPONENT_MERGED → SUPERPROJECT_REPINNED → STABLE`

Create `release/next` from the exact component candidate and include an immutable `release/request.json` in the pushed commit. That push runs the candidate workflow from the same ref, so first publication does not depend on the workflow already existing on the default branch. After qualification, squash-merge the component to `main` and repin the superproject to that component main commit. Stable promotion still targets the qualified RC commit and reuses its exact assets; it does not rebuild from the squash commit.

| Component | Asset and publisher adapter | Release status |
|---|---|---|
| Execution | one npm core package + GitHub Release | active |
| DSH bundles | three-package npm set + DSH clean-profile + GitHub Release | active (`firestige/wsr-dsh`) |
| Evidence | Python wheel/sdist + GHCR OCI + GitHub Release | active |
| system-contracts | publication records + GitHub Release | active |
| workflow-package | deterministic workflow assets + GitHub Release | active |
| Evolution | parameter-only | no Iter4 publication |
| BI | excluded | no Iter4 automation |

Python support is expressed as minor-version compatibility and tested on Python 3.13 and 3.14; it is not pinned to a Python patch release. npm/DSH rules belong only to the Execution adapter.

## Trigger and recovery

Candidate workflows reject any ref other than `release/next`. The first RC is triggered by pushing a commit whose `release/request.json` contains the fixed request. Contract and Evidence requests contain only `candidate_tag`; Execution additionally contains `local_manual_e2e_evidence`, `authority_ref`, and `authority_manifest`. For example:

```json
{
  "candidate_tag": "evidence-query-0.1.0-rc.1"
}
```

After the workflow has reached the default branch, `workflow_dispatch` from `release/next` remains an equivalent recovery entry point with the same fields. Execution requires an exact superproject `authority_ref` whose Execution submodule points to the candidate, an `authority_manifest` path to the tracked unified candidate, and a GitHub issue/comment URL for credentialed local DSH evidence. The workflow materializes those bound assets instead of rebuilding them. See the component-specific guide.

| Failure | Stable allowed? | Recovery |
|---|---:|---|
| Acceptance/build failure | no | fix source; rerun before creating an RC |
| RC tag collision | no | inspect the existing immutable tag; use the next RC number for changed bytes |
| Downloaded digest mismatch | no | preserve URLs/digests for investigation; never replace the RC assets |
| Permission denial | no | repair App/registry configuration; rerun the same immutable candidate |
| Candidate differs from component `main` after squash | yes, after repin | expected; stable still targets the qualified candidate commit |
| One package in the DSH set published, a later package failed | no stable DSH Release yet | rerun the same `wsr-dsh` manifest; skip only exact registry-byte matches, then continue the ordered set |
| Stable operation fails | no new build | retry from the qualified manifest and candidate commit; never retarget a tag |

## GitHub App identity

The approved App identity is owned by `firestige`, with slug `wsr-release`. Its installation allowlist is exactly `workflow-self-recursive`, `wsr-execution`, `wsr-evidence`, `wsr-evolution`, `wsr-contracts`, `wsr-workflow-package`, and `wsr-dsh`. Registration permissions are Contents read/write, Workflows read/write, and Metadata read. Each promotion workflow further narrows the minted token to its own repository and `contents: write`.

Store the App ID as Actions variable `WSR_RELEASE_APP_ID` and the PEM private key as Actions secret `WSR_RELEASE_APP_PRIVATE_KEY`. Build and qualification steps never receive that key or an installation token. Candidate workflows mint a short-lived token only after all local qualification gates pass and use it only for the scoped RC Release write; stable workflows mint a new token only immediately before the final stable GitHub Release operation. Request both `contents: write` and `workflows: write` when the selected release target changes `.github/workflows/` relative to the default branch; otherwise GitHub rejects Release creation even when Contents is writable. GitHub documents that installation tokens expire after one hour and can be restricted to selected repositories and permissions ([workflow authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow), [installation token scope](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app), [Release target permission rule](https://docs.github.com/en/rest/releases/releases#create-a-release)).

Bootstrap:

1. Register/install the App with the approved allowlist and permissions.
2. Add the variable and secret independently to each active publishing repository.
3. Confirm that no PAT or App key appears in repository files, logs, artifacts, or reports.
4. Run only the no-side-effect configuration/oracle checks before publication approval; use the real release sequence only in Wave 12.

Rotate by generating a second App private key, replacing the Actions secret, running the static attestation, and then deleting the old key. Revoke during an incident by disabling/uninstalling the App or deleting the key; cancel release runs and preserve run URLs and immutable digests. Break-glass means pausing publication and obtaining explicit owner approval to restore the App path. A host `gh` credential or personal PAT is not an accepted publication fallback.

## npm trusted publishing

Execution chooses npm trusted publishing through GitHub Actions OIDC, not a long-lived automation token. Configure `wsr-execution` for organization/user `firestige`, repository `wsr-execution`, workflow `release-promote.yml`, and no environment unless the workflow later uses one. Configure the three independently versioned `dsh-wsr-*` packages against the separate `firestige/wsr-dsh` promotion workflow. Both workflows have `id-token: write`, require npm 11.5 or newer, run on GitHub-hosted runners, publish only immutable qualified tgz files, and carry no `NODE_AUTH_TOKEN`.

npm requires npm CLI 11.5.1 or newer, Node 22.14 or newer, an exact repository/workflow match, and `id-token: write`; trusted publishing provides short-lived credentials and provenance ([npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)). If a reusable workflow is introduced around the npm publish job, reconfigure npm for the caller workflow identity and give OIDC permission to both caller and called workflow.

After a successful publish, each owner adapter verifies its exact tarball digests, non-empty descriptions, version list, and `latest`. Direct source `npm pack`/`npm publish` fails closed. A source build is allowed only through the relevant verified artifact builder, and promotion accepts only its immutable manifest.

## Release cadence and versioning

There is no calendar-forced release. Publish when a reviewed change and its ecosystem-specific qualification are ready. Use SemVer: PATCH for backward-compatible fixes or metadata/automation corrections, MINOR for backward-compatible capabilities, and MAJOR for incompatible public contract or installation changes. Execution core and the DSH bundle set are independently versioned; each release manifest binds the exact compatible cross-owner coordinates.
