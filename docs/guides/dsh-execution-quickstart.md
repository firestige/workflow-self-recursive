# DSH Execution quickstart

This guide installs a qualified final Execution Release in a trusted local environment. Do not use it for an unpublished candidate; use the [local pre-release E2E guide](dsh-execution-local-e2e.md) instead. The DSH plugin is the first Intake Adapter distribution; `wsr-execution` remains a host-neutral package that can be embedded without DSH.

## 0. Check the host prerequisites

Use Node `24.12.0` and DSH `0.1.1-rc.2`. DSH's `plugin` subcommand requires pnpm, but it does not declare an exact pnpm version.

First, inspect the installed versions:

```sh
node --version
pnpm --version
dsh --version
gh --version
```

If `pnpm --version` fails because pnpm is missing, install it and rerun the check:

```sh
npm install --global pnpm
```

If `dsh --version` fails because DSH is missing, or reports a version other than `0.1.1-rc.2`, install the required preview and rerun the check:

```sh
npm install --global @deepseek-ai/dsh@0.1.1-rc.2
```

Finally, inspect the launcher help:

```sh
dsh --help
```

## 1. Bind the qualified published coordinates

```sh
export WSR_DSH_VERSION="0.1.0"
export WSR_EXECUTION_VERSION="0.1.4"
export WSR_EXECUTION_ASSET="https://github.com/firestige/wsr-execution/releases/download/0.1.4-rc.1/wsr-execution-0.1.4.tgz"
```

`dsh-wsr-execution@0.1.0` is the qualified stable DSH bundle. Its immutable metadata binds the exact `wsr-execution@0.1.4` owner asset above (SHA-256 `4407239534795f528b3ca597583a682636dd539516f567434a128d5437345e4d`); do not substitute a branch, `latest`, or local checkout.

## 2. Initialize the canonical configuration

Choose durable paths outside the repository, worktree, and DSH plugin installation directory. The only installation schema is `execution.config@1.0.0`:

```sh
export WSR_CONFIG="$PWD/../wsr-local/execution.yaml"
export WSR_STATE="$PWD/../wsr-local/state"
export WSR_CREDENTIALS="$PWD/../wsr-local/credentials.yml"
mkdir -p "$(dirname "$WSR_CONFIG")" "$WSR_STATE"
npm exec --yes --package="$WSR_EXECUTION_ASSET" -- \
  execution-config init "$WSR_CONFIG" yaml
```

Replace only the values marked `__REQUIRED__`: `paths.repositoryRoot`, `paths.workspaceRoot`, the matching `paths.allowedWorktreeRoots` item, `paths.stateRoot`, `paths.credentialStorePath`, and `runner.provider.route/modelId/baseUrl/credentialRef`. Keep the default single Source, `firestige/wsr-workflow-package`, unless this installation deliberately selects one alternate Adapter.

Provision the referenced key outside the Execution config:

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

Set the credential file to owner-only access, then validate and inspect the redacted effective value:

```sh
chmod 600 "$WSR_CREDENTIALS"
npm exec --yes --package="$WSR_EXECUTION_ASSET" -- \
  execution-config validate "$WSR_CONFIG"
npm exec --yes --package="$WSR_EXECUTION_ASSET" -- \
  execution-config dump-effective "$WSR_CONFIG"
```

`dump-effective` prints an installation identity and redacts paths, endpoints, and credential references. See the [configuration reference](../reference/execution-configuration.md).

## 3. Install the DSH Intake Adapter

Use locked DSH's built-in `web` profile. It is the supported interactive assembly because it includes DSH's conversation, attachment, command, and result-rendering surface; a new custom profile contains only `dsh-base` and is not interactive. The current DSH preview requires `--workspace-root` for its generated workspace. Core uses `better-sqlite3` for durable checkpoints, so pnpm 11 must approve that native build in the DSH profile before either artifact is added. For a fresh profile, the first command below creates the profile and its `allowBuilds` map. For an existing profile, preserve every existing `allowBuilds` entry and merge `better-sqlite3: true` in `$DSH_HOME/profiles/web/pnpm-workspace.yaml` instead of replacing the map. Then install the host-neutral package first so the plugin can import its public surface:

```sh
dsh plugin --profile web config set --location=project --json allowBuilds '{"better-sqlite3":true}'
dsh plugin --profile web add --workspace-root "$WSR_EXECUTION_ASSET"
dsh plugin --profile web add --workspace-root "dsh-wsr-execution@$WSR_DSH_VERSION"
```

Edit `$DSH_HOME/profiles/web/cordis.patch.yml` so the stable WSR row contains only absolute presentation paths. `web` is the DSH profile name; `workflow-execution` remains the plugin's stable Cordis row ID:

```yaml
- id: workflow-execution
  config:
    configFile: /absolute/path/wsr-local/execution.yaml
    bindingFile: /absolute/path/wsr-local/dsh-intake-bindings.json
```

Do not copy the Execution config or API key into this patch. Verify the composed profile and launcher:

```sh
dsh --profile web --dump-config
dsh --help
```

Expected: the dump includes `webserver`, `ui-conversation`, `ui-commands`, row `workflow-execution`, the absolute `configFile`/`bindingFile`, `skill-filesystem`, and `tool-skill`; it does not contain the API key. In locked DSH `0.1.1-rc.2`, launcher-level `dsh --help` verifies syntax without booting the interactive profile. Neither help surface is the plugin command catalog. The closed operations are listed below; `/wsr list` and `/wsr status` remain compatibility/automation aliases rather than the default product entry:

```text
/wsr list
/wsr create <name|name@latest|name@version>
/wsr recover [delivery-id]
/wsr status [delivery-id]
/wsr action finish
/wsr abandon <delivery-id>
```

## 4. Start and invoke

Product surface boundary: use the Delivery projections for list and current status. Use the chat timeline for create/recover/abandon/action-finish commands, Action output/input, ordinary user answers, errors, and terminal result. The native user bubble and one host-owned WSR command lifecycle are each rendered once; the keyed view shows a friendly result plus complete admitted JSON details. New Session starts an isolated blank timeline, while the prior Workflow conversation remains separately reopenable.

Start DSH Web from the target worktree:

```sh
dsh web
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

### Manual #57 acceptance run

In the browser opened by `dsh web`, create or select a conversation rooted at the target worktree, then click the sidebar Deliveries tab. It must show an explicit empty result when no Delivery exists without requiring a chat command. Next attach any files needed by the task and submit one composer message whose first line is the command and whose remaining chat text is the task prompt:

```text
/wsr create implementation-workflow@0.3.0
Perform the requested implementation using the text and attachments in this conversation.
```

Success requires the same chat timeline to render acknowledgement, Action output/input and terminal result; process logs, sidebar projection, or a helper-only response do not count. Inspect the bound Delivery through the sidebar Current status tab. If the Workflow enters a multi-turn Action such as grilling, answer normally in this conversation. When that interaction is complete, submit `/wsr action finish`; then use Current status again to observe the next state. A credential, Source, package-resolution, or Runner error is a failed acceptance run and must be fixed before #57 is closed.

The following compatibility/automation operations remain available even though the product UI uses sidebar tabs:

```text
/wsr list
/wsr status
```

An ordinary reply while an Action is awaiting input remains inside that Action. Use `/wsr action finish` only to request closure of the current multi-turn interaction; the Action and validated `workflow_complete` remain the completion authority.

## 5. Recovery, shutdown, update, and removal

Stopping DSH closes the Intake gate, performs bounded Observation flush, and cascades through Execution to every Runner-owned `DSH-E`. It does not fabricate cancellation or delete Manifest/current-slot, Runner durable facts, or the private binding file. Restart the same profile to recover from the last durable boundary. Use `/wsr recover [delivery-id]` for an exact detached Delivery, or omit the ID to recover this canonical worktree's Delivery; selection never guesses by name, alias, or recency.

For a later compatible exact version, update Core first and Intake second. To remove the installation, remove Intake first and Core second:

```sh
dsh plugin --profile web update --workspace-root wsr-execution@<new-exact-version>
dsh plugin --profile web update --workspace-root dsh-wsr-execution@<new-exact-version>
dsh plugin --profile web remove --workspace-root dsh-wsr-execution
dsh plugin --profile web remove --workspace-root wsr-execution
dsh plugin --profile web add --workspace-root "$WSR_EXECUTION_ASSET"
dsh plugin --profile web add --workspace-root "dsh-wsr-execution@$WSR_DSH_VERSION"
```

DSH owns these package-lifecycle operations. WSR does not add install/remove hooks. Removal leaves external durable state untouched; a compatible reinstall resumes the same persisted Delivery binding. Interaction state written after the last durable boundary may be lost.
