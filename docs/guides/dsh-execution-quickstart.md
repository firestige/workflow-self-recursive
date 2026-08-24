# DSH Execution quickstart

This guide installs the Iteration 3 developer-preview release in a trusted local environment. The DSH plugin is the first Intake Adapter distribution; `@workflow-self-recursive/execution-system` remains a host-neutral package that can be embedded without DSH.

## 1. Download the two Execution artifacts

```sh
mkdir -p "$PWD/.wsr-release"
curl -fL -o "$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/workflow-self-recursive-execution-system-0.1.0.tgz
curl -fL -o "$PWD/.wsr-release/workflow-self-recursive-dsh-intake-0.1.0.tgz" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/workflow-self-recursive-dsh-intake-0.1.0.tgz
curl -fL -o "$PWD/.wsr-release/release-metadata.json" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/release-metadata.json
curl -fL -o "$PWD/.wsr-release/core.publication.json" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/workflow-self-recursive-execution-system-0.1.0.tgz.publication.json
curl -fL -o "$PWD/.wsr-release/plugin.publication.json" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/workflow-self-recursive-dsh-intake-0.1.0.tgz.publication.json
```

Each `execution.artifact-publication@1.0.0` record contains the expected archive SHA-256 and inventory. Compare it with `shasum -a 256 "$PWD/.wsr-release/"*.tgz` before installation. The final digest table is also recorded in the Iteration 3 implementation result.

## 2. Initialize the canonical configuration

Choose durable paths outside the repository, worktree, and DSH plugin installation directory. The only installation schema is `execution.config@1.0.0`:

```sh
export WSR_CONFIG="$PWD/../wsr-local/execution.yaml"
export WSR_STATE="$PWD/../wsr-local/state"
export WSR_CREDENTIALS="$PWD/../wsr-local/credentials.yml"
mkdir -p "$(dirname "$WSR_CONFIG")" "$WSR_STATE"
npm exec --yes --package="$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz" -- \
  execution-config init "$WSR_CONFIG" yaml
```

Replace only the values marked `__REQUIRED__`: `paths.repositoryRoot`, `paths.workspaceRoot`, the matching `paths.allowedWorktreeRoots` item, `paths.stateRoot`, `paths.credentialStorePath`, and `runner.provider.route/modelId/baseUrl/credentialRef`. Keep the default single Source, `firestige/workflow-package`, unless this installation deliberately selects one alternate Adapter.

Provision the referenced key outside the Execution config:

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

Set the credential file to owner-only access, then validate and inspect the redacted effective value:

```sh
chmod 600 "$WSR_CREDENTIALS"
npm exec --yes --package="$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz" -- \
  execution-config validate "$WSR_CONFIG"
npm exec --yes --package="$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz" -- \
  execution-config dump-effective "$WSR_CONFIG"
```

`dump-effective` prints an installation identity and redacts paths, endpoints, and credential references. See the [configuration reference](../reference/execution-configuration.md).

## 3. Install the DSH Intake Adapter

The exact profile is `workflow-execution`; the current DSH preview requires `--workspace-root` for its generated workspace. Install the host-neutral package first so the plugin can import its public surface:

```sh
dsh plugin --profile workflow-execution add --workspace-root "$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz"
dsh plugin --profile workflow-execution add --workspace-root "$PWD/.wsr-release/workflow-self-recursive-dsh-intake-0.1.0.tgz"
```

Edit `$DSH_HOME/profiles/workflow-execution/cordis.patch.yml` so the stable row contains only absolute presentation paths:

```yaml
- id: workflow-execution
  config:
    configFile: /absolute/path/wsr-local/execution.yaml
    bindingFile: /absolute/path/wsr-local/dsh-intake-bindings.json
```

Do not copy the Execution config or API key into this patch. Verify the composed profile and launcher:

```sh
dsh --profile workflow-execution --dump-config
dsh --help
```

Expected: the dump includes row `workflow-execution`, the absolute `configFile`/`bindingFile`, `skill-filesystem`, and `tool-skill`; it does not contain the API key. In locked DSH `0.1.1-rc.2`, launcher-level `dsh --help` verifies syntax without booting the interactive profile; profile-level help belongs to the configured app and may keep that app running. Neither is the plugin command catalog. The exact product commands are:

```text
/wsr list
/wsr create <name|name@latest|name@version>
/wsr recover [delivery-id]
/wsr status [delivery-id]
/wsr action finish
/wsr abandon <delivery-id>
```

## 4. Start and invoke

Start DSH from the target worktree using a profile that has an interactive app configured:

```sh
dsh --profile workflow-execution
```

Direct command example—everything after the activation directive, plus chat attachments, becomes the `TaskPrompt`; there is no `--intent` argument:

```text
/wsr create implementation-workflow@0.3.0
Implement the requested change and preserve existing user edits.
```

Explicit first-party skill example:

```text
/workflow-execution
Create implementation-workflow@0.3.0 for this request and its attachments.
```

The explicit-only skill calls the DSH-I-only `workflow_execution_intake` tool exactly once. Command and skill use the same `WorkflowIntakeService`, M01 resolution/validation/READY path, and host-neutral Core operation. Workflow Actions execute in Runner-owned `DSH-E`, never in Intake `DSH-I`.

Inspect privacy-safe state and output:

```text
/wsr list
/wsr status
```

An ordinary reply while an Action is awaiting input remains inside that Action. Use `/wsr action finish` only to request closure of the current multi-turn interaction; the Action and validated `workflow_complete` remain the completion authority.

## 5. Recovery, shutdown, update, and removal

Stopping DSH closes the Intake gate, performs bounded Observation flush, and cascades through Execution to every Runner-owned `DSH-E`. It does not fabricate cancellation or delete Manifest/current-slot, Runner durable facts, or the private binding file. Restart the same profile to recover from the last durable boundary. Use `/wsr recover [delivery-id]` for an exact detached Delivery, or omit the ID to recover this canonical worktree's Delivery; selection never guesses by name, alias, or recency.

For a later compatible exact version, update Core first and Intake second. To remove the installation, remove Intake first and Core second:

```sh
dsh plugin --profile workflow-execution update --workspace-root @workflow-self-recursive/execution-system@<new-exact-version>
dsh plugin --profile workflow-execution update --workspace-root @workflow-self-recursive/dsh-intake@<new-exact-version>
dsh plugin --profile workflow-execution remove --workspace-root @workflow-self-recursive/dsh-intake
dsh plugin --profile workflow-execution remove --workspace-root @workflow-self-recursive/execution-system
dsh plugin --profile workflow-execution add --workspace-root "$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz"
dsh plugin --profile workflow-execution add --workspace-root "$PWD/.wsr-release/workflow-self-recursive-dsh-intake-0.1.0.tgz"
```

DSH owns these package-lifecycle operations. WSR does not add install/remove hooks. Removal leaves external durable state untouched; a compatible reinstall resumes the same persisted Delivery binding. Interaction state written after the last durable boundary may be lost.
