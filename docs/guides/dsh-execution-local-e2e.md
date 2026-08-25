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

Stop `dsh web` first if this profile is already running, then run:

```sh
pnpm --dir execution-system quickstart:prepare
export WSR_RELEASE_DIR="$PWD/tmp/local-e2e/release"
export WSR_CONFIG="$PWD/../wsr-local/execution.json"
export WSR_CREDENTIALS="$PWD/../wsr-local/credentials.yml"
```

Run the preparation command from the super-project root. It installs the repository dependencies, compiles the current `execution-system` worktree, builds and verifies both `0.1.1` archives, initializes deployment-specific local paths, and reconciles the DSH `web` profile in one operation.

Before any package operation, reconciliation merges `better-sqlite3: true` into the profile's pnpm 11 `allowBuilds` map while preserving every existing approval. For a fresh profile, reconciliation then installs Core first and Intake second. For an existing profile, it remove Intake first and remove Core second, then installs the exact newly built Core and Intake archives. This remove/re-add sequence deliberately replaces a changed local archive even when its package version is unchanged. Before changing the profile, preparation loads the generated configuration through the production configuration loader. A legacy generated configuration whose workspace included the sibling `wsr-local/state` directory is narrowed to the target worktree while preserving its state path and every non-path user edit; any other invalid existing configuration fails closed. The command then inserts or replaces only WSR's `workflow-execution` row in `$DSH_HOME/profiles/web/cordis.patch.yml`, preserves unrelated user patch entries, and verifies the composed profile with `dsh --profile web --dump-config`. It fails if the composed profile retains a `__REQUIRED__` placeholder or does not resolve the generated configuration and binding paths.

Repeated preparation rebuilds temporary artifacts and reconciles the plugin packages, but preserves existing Execution configuration, credential material, durable state, binding state, and unrelated DSH user overrides. Restart `dsh web` after the command completes.

If pnpm rejects an existing profile with `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF` or another modules-layout mismatch, stop `dsh web` and explicitly request a profile dependency reinstall:

```sh
pnpm --dir execution-system quickstart:prepare -- --reinstall-dsh-profile
```

This opt-in switch removes only `$DSH_HOME/profiles/web/node_modules` before the normal reconciliation. It does not delete the profile manifest, lockfile, pnpm workspace policy, Cordis configuration and patches, Execution configuration, credentials, bindings, or durable state; the normal package reconciliation may update its package-managed manifest and lockfile entries. Preparation does not remove profile modules unless this switch is present.

The following package-manager warnings can appear during reconciliation without invalidating it:

- `DEP0169` means DSH found an old pnpm CLI on `PATH`; use the optional Corepack upgrade above to remove it.
- `prebuild-install@7.1.3` is a deprecated installer below `better-sqlite3`, reached through `@langchain/langgraph-checkpoint-sqlite`; it is not the installed Execution runtime version.
- Core `declares no dsh.bundle` is expected. `@workflow-self-recursive/execution-system` is deliberately installed as a host-neutral plain dependency, while `@workflow-self-recursive/dsh-intake` supplies the DSH profile layer.

## 2. Add the credential

The generated `execution.config@1.0.0` already points at this worktree, the sibling durable state directory, the public `firestige/workflow-package` Source, and the default DeepSeek route. Open `$WSR_CREDENTIALS` and replace only `replace-with-the-provider-key`:

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

The preparation command creates this file with owner-only permissions and never overwrites it. If this E2E uses another compatible provider deployment, edit only `runner.provider` in `$WSR_CONFIG`. See the [configuration reference](../reference/execution-configuration.md).

## 3. Verify the DSH Intake Adapter

Use locked DSH's built-in `web` profile. It is the supported interactive assembly because it includes DSH's conversation, attachment, command, and result-rendering surface; a new custom profile contains only `dsh-base` and is not interactive. Preparation already installed the host-neutral Core package and the Intake profile layer and wrote only their absolute presentation paths to the WSR-owned override. It never copies the Execution config or API key into the patch. Verify the composed profile and launcher:

```sh
dsh --profile web --dump-config
dsh --help
```

Expected: the dump includes `webserver`, `ui-conversation`, `ui-commands`, row `workflow-execution`, the absolute `configFile`/`bindingFile`, `skill-filesystem`, and `tool-skill`; it does not contain the API key. In locked DSH `0.1.1-rc.2`, launcher-level `dsh --help` verifies syntax without booting the interactive profile. This step verifies assembly only; it does not execute any `/wsr` product command.

## 4. Start and invoke

Start DSH Web from the target worktree:

```sh
dsh web
```

The closed operation reference is shown here for orientation. `/wsr list` and `/wsr status` remain compatibility/automation aliases; the manual acceptance run uses sidebar tabs as their default user-facing entry:

```text
/wsr list
/wsr create <name|name@latest|name@version>
/wsr recover [delivery-id]
/wsr status [delivery-id]
/wsr action finish
/wsr abandon <delivery-id>
```

Direct command example—everything after the activation directive, plus chat attachments, becomes the `TaskPrompt`; there is no `--intent` argument:

```text
/wsr create hello-world-workflow@0.1.0
Greet me and mention the task described in this conversation.
```

Explicit first-party skill example:

```text
/workflow-execution
Create system-design-workflow@0.3.0 to design the requested change from this task description and its attachments.
```

The explicit-only skill calls the DSH-I-only `workflow_execution_intake` tool exactly once. Command and skill use the same `WorkflowIntakeService`, M01 resolution/validation/READY path, and host-neutral Core operation. Workflow Actions execute in Runner-owned `DSH-E`, never in Intake `DSH-I`.

`implementation-workflow@0.3.0` requires an existing design input. Do not use it as a from-zero smoke or interaction test; use it only when the conversation or attachments supply the required design artifact.

### Manual #57 acceptance run

Product surface boundary: use the sidebar tabs for Delivery list and current Delivery status. Use the chat timeline for create/recover/abandon/action-finish commands, command acknowledgement, Action output/input, ordinary user answers, errors, and terminal result.

Run both cases below. They prove different acceptance boundaries and must not substitute for each other.

#### 1. Published hello-world smoke

In the browser opened by `dsh web`, create a conversation rooted at the target worktree, then click the sidebar Deliveries tab. It must show an explicit empty result when no Delivery exists without requiring a chat command. Optionally attach a small test file, then submit:

```text
/wsr create hello-world-workflow@0.1.0
Greet me, summarize this request, and acknowledge the attachment if one is present.
```

This case must resolve the independently published exact Package `hello-world-workflow@0.1.0` through the configured Source and render command acknowledgement, model-backed Action output, and the terminal result in the same chat timeline. Process logs, sidebar projection, or a helper-only response do not count. Inspect the bound Delivery through the sidebar Current status tab. A credential, Source, package-resolution, or Runner error fails this case.

#### 2. From-zero multi-turn interaction

Create a new conversation rooted at the same target worktree. Do not reuse `implementation-workflow@0.3.0`: it requires a pre-existing design artifact and therefore cannot prove a from-zero flow. Submit an ordinary design task instead:

```text
/wsr create system-design-workflow@0.3.0
Design a bounded change for this repository from the task description and attachments in this conversation.
```

This case must start from that ordinary task description, produce its initial Action output without user intervention, and then complete at least two question/ordinary-answer ping-pong rounds in the same chat timeline. The Agent must ask whether agreement has been reached; answer that confirmation normally. When the interaction is ready to close, submit `/wsr action finish`. The same chat timeline must render every Action output/input request, the acknowledgement, and the terminal result. Use Current status between steps to inspect the same bound Delivery without entering `/wsr status` in chat. A detached answer, missing second round, missing agreement confirmation, or missing terminal result fails this case.

The following compatibility/automation operations remain available even though the product UI uses sidebar tabs:

```text
/wsr list
/wsr status
```

An ordinary reply while an Action is awaiting input remains inside that Action. Use `/wsr action finish` only to request closure of the current multi-turn interaction; the Action and validated `workflow_complete` remain the completion authority.

For a repeatable source-candidate browser oracle, run `pnpm --dir execution-system qualify:dsh-product -- <absolute-core-archive> <absolute-intake-archive> <absolute-source-config>`. It creates a fresh DSH Web profile and Chrome profile, clicks both sidebar tabs, drives the same published hello-world smoke and a two-answer system-design interaction, restarts the same version, and returns the URL, environment tuple, artifact SHA-256 values, and surface-separated DOM evidence. The source config points to an external credential file; the result never prints key material.

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
