# DSH Execution local pre-release E2E

This guide builds the current Iteration 3 candidate from this checkout and installs it for pre-release E2E in a trusted local environment. It deliberately does not download an Execution GitHub Release. The DSH plugin is the first Intake Adapter distribution; `@workflow-self-recursive/execution-system` remains a host-neutral package that can be embedded without DSH.

## 0. Check the host prerequisites

Use Node `>=24.12.0 <25` and DSH `0.1.1-rc.2`. DSH's `plugin` subcommand requires pnpm, but it does not declare an exact pnpm version. Release qualification currently uses pnpm `11.23.0` for reproducibility; that is not an end-user version constraint.

First, inspect the installed versions:

```sh
node --version
pnpm --version
dsh --version
```

If `pnpm --version` fails because pnpm is missing, install it and rerun the check:

```sh
npm install --global pnpm
```

An existing pnpm 9 installation still works, but Node 24 may report `DEP0169` from that old CLI when DSH invokes it. To remove that tooling warning, optionally align Corepack with the repository-qualified version, then rerun `pnpm --version`:

```sh
corepack install --global pnpm@11.23.0
```

This is a tooling upgrade, not an Execution runtime compatibility requirement.

If `dsh --version` fails because DSH is missing, or reports a version other than `0.1.1-rc.2`, install the required preview and rerun the check:

```sh
npm install --global @deepseek-ai/dsh@0.1.1-rc.2
```

Finally, inspect the launcher help:

```sh
dsh --help
```

## 1. Prepare the local candidate

```sh
pnpm --dir execution-system quickstart:prepare
export WSR_RELEASE_DIR="$PWD/tmp/local-e2e/release"
export WSR_CONFIG="$PWD/../wsr-local/execution.json"
export WSR_CREDENTIALS="$PWD/../wsr-local/credentials.yml"
```

Run the preparation command from the super-project root. It installs the repository dependencies, compiles the current `execution-system` worktree, builds and verifies both `0.1.1` archives, and initializes deployment-specific local paths in one operation. Repeated preparation rebuilds temporary artifacts but preserves an existing configuration and credential file.

## 2. Add the credential

The generated `execution.config@1.0.0` already points at this worktree, the sibling durable state directory, the public `firestige/workflow-package` Source, and the default DeepSeek route. Open `$WSR_CREDENTIALS` and replace only `replace-with-the-provider-key`:

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

The preparation command creates this file with owner-only permissions and never overwrites it. If this E2E uses another compatible provider deployment, edit only `runner.provider` in `$WSR_CONFIG`. See the [configuration reference](../reference/execution-configuration.md).

## 3. Install the DSH Intake Adapter

Use locked DSH's built-in `web` profile. It is the supported interactive assembly because it includes DSH's conversation, attachment, command, and result-rendering surface; a new custom profile contains only `dsh-base` and is not interactive. The current DSH preview requires `--workspace-root` for its generated workspace. Install the host-neutral package first so the plugin can import its public surface:

```sh
dsh plugin --profile web add --workspace-root "$WSR_RELEASE_DIR/workflow-self-recursive-execution-system-0.1.1.tgz"
dsh plugin --profile web add --workspace-root "$WSR_RELEASE_DIR/workflow-self-recursive-dsh-intake-0.1.1.tgz"
```

Both commands succeed when they end with `Done` and list the expected package under `dependencies`. The following warnings do not invalidate this installation:

- `DEP0169` means DSH found an old pnpm CLI on `PATH`; use the optional Corepack upgrade above to remove it.
- `prebuild-install@7.1.3` is a deprecated installer below `better-sqlite3`, reached through `@langchain/langgraph-checkpoint-sqlite`; it is not the installed Execution runtime version.
- Core `declares no dsh.bundle` is expected. `@workflow-self-recursive/execution-system` is deliberately installed as a host-neutral plain dependency, while `@workflow-self-recursive/dsh-intake` supplies the DSH profile layer.

Edit `$DSH_HOME/profiles/web/cordis.patch.yml` so the stable WSR row contains only absolute presentation paths. `web` is the DSH profile name; `workflow-execution` remains the plugin's stable Cordis row ID:

```yaml
- id: workflow-execution
  config:
    configFile: /absolute/path/wsr-local/execution.json
    bindingFile: /absolute/path/wsr-local/dsh-intake-bindings.json
```

Do not copy the Execution config or API key into this patch. Verify the composed profile and launcher:

```sh
dsh --profile web --dump-config
dsh --help
```

Expected: the dump includes `webserver`, `ui-conversation`, `ui-commands`, row `workflow-execution`, the absolute `configFile`/`bindingFile`, `skill-filesystem`, and `tool-skill`; it does not contain the API key. In locked DSH `0.1.1-rc.2`, launcher-level `dsh --help` verifies syntax without booting the interactive profile. Neither help surface is the plugin command catalog. The exact product commands are:

```text
/wsr list
/wsr create <name|name@latest|name@version>
/wsr recover [delivery-id]
/wsr status [delivery-id]
/wsr action finish
/wsr abandon <delivery-id>
```

## 4. Start and invoke

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

In the browser opened by `dsh web`, create or select a conversation rooted at the target worktree, then run:

```text
/wsr list
```

The conversation must render a WSR result. Next attach any files needed by the task and submit one composer message whose first line is the command and whose remaining chat text is the task prompt:

```text
/wsr create implementation-workflow@0.3.0
Perform the requested implementation using the text and attachments in this conversation.
```

Success requires the same conversation to render the new Delivery/result; process logs or a helper-only response do not count. Record the returned Delivery ID, then verify it through `/wsr status`. If the Workflow enters a multi-turn Action such as grilling, answer normally in this conversation. When that interaction is complete, submit `/wsr action finish`; then use `/wsr status` again to observe the next state. A credential, Source, package-resolution, or Runner error is a failed acceptance run and must be fixed before #57 is closed.

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
dsh plugin --profile web update --workspace-root @workflow-self-recursive/execution-system@<new-exact-version>
dsh plugin --profile web update --workspace-root @workflow-self-recursive/dsh-intake@<new-exact-version>
dsh plugin --profile web remove --workspace-root @workflow-self-recursive/dsh-intake
dsh plugin --profile web remove --workspace-root @workflow-self-recursive/execution-system
dsh plugin --profile web add --workspace-root "$WSR_RELEASE_DIR/workflow-self-recursive-execution-system-0.1.1.tgz"
dsh plugin --profile web add --workspace-root "$WSR_RELEASE_DIR/workflow-self-recursive-dsh-intake-0.1.1.tgz"
```

DSH owns these package-lifecycle operations. WSR does not add install/remove hooks. Removal leaves external durable state untouched; a compatible reinstall resumes the same persisted Delivery binding. Interaction state written after the last durable boundary may be lost.
