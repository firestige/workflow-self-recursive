# Session, Delivery, and Worktree Binding Design

Status: `APPROVED`

Issue: [#94](https://github.com/firestige/workflow-self-recursive/issues/94)

Implementation: [#102](https://github.com/firestige/workflow-self-recursive/issues/102)

Owner: Execution System

Scope: design and implementation-level acceptance only; no Iteration 4 product implementation

## 1. Decision boundary

This design refines the existing Execution current-slot and DSH Intake binding models. It does not change a FROZEN contract, the Runner five-module boundary, public `execute`/`inspect`/`cancel` semantics, or Workflow outcome truth. “Session” here means a host DSH Intake conversation session, never a Runner-native Provider session.

The design deliberately adds no third durable source of truth and no cross-store transaction. Execution remains authoritative for Delivery and canonical-worktree occupancy through Manifest/current-slot. The DSH Intake Adapter remains authoritative only for the presentation binding between one host Session and one Delivery.

## 2. Entities and authority

| Entity | Identity | Unique authority/writer | Durable location | Rule |
|---|---|---|---|---|
| Host Session availability | exact DSH session key | DSH host; Intake observes | DSH-owned session registry, not WSR state | availability is not Delivery truth and is never guessed |
| Session–Delivery binding | session key + Delivery ID + correlation | DSH Intake Adapter | adapter-private binding file outside plugin installation | zero or one active binding in each direction |
| Delivery | Delivery ID + immutable `deliveryBindingIdentity` | Execution Delivery (M01) | Manifest + current-slot + Runner durable facts | one immutable canonical worktree after Manifest persistence |
| Worktree occupancy | canonical realpath | Execution Delivery (M01) | existing current-slot record | zero or one current Delivery; no queue, stealing, or timeout expiry |
| Conversation-workspace authorization | session key + DSH workspace ID + exact canonical path | DSH Intake Adapter supplies; private Bootstrap control validates | invocation-scoped only; no durable identity | authorization is exact and cannot admit a parent or sibling |

`allowedWorktreeRoots` remains the only authority for the public application surface. The DSH private path accepts only exact, typed, invocation-scoped conversation-workspace authorization after live-Agent, registry-resolution, membership, absolute-path, realpath, and Git-worktree-root equality checks. This authorization has no independently persisted identity, cannot be retained by the caller, and is not a Prepared Binding or a new source of truth. It does not append to or widen `allowedWorktreeRoots`. `process.cwd()` is never a business workspace or fallback.

For a new Delivery, Intake supplies proof of the registered conversation workspace; Execution derives and canonicalizes the exact Git worktree, performs exclusive admission, and persists that selected worktree in the Manifest. After persistence, the Manifest/current-slot—not the conversation’s later cwd—is the durable worktree authority.

## 3. Closed invariants

1. One host Session has zero or one `BOUND` active Delivery.
2. One active Delivery has zero or one `BOUND` host Session. Zero is the valid `DETACHED` recovery condition.
3. One Delivery has exactly one immutable canonical worktree after Manifest persistence.
4. One canonical worktree has zero or one current Delivery across every non-empty current-slot state.
5. A binding record must join exactly one current Delivery with the same Delivery ID, canonical worktree, correlation, and `deliveryBindingIdentity`.
6. A normal contention error never mutates either store. Durable one-to-many, many-to-one, identity drift, or duplicate records are corruption and fail startup closed; no winner is selected.
7. Missing/invalid Session authority produces `DSH_INTAKE_WORKSPACE_UNAUTHORIZED` before Delivery, Package, Runner, or binding effects.
8. A Session conflict produces a typed `SESSION_INTAKE_BOUND`; a Delivery already bound to another available Session produces `DELIVERY_INTAKE_BOUND`; occupied-worktree behavior remains the existing `CONTENDED`/exact `RECOVERY` result.

The current architecture statement “one active Delivery to exactly one session” is refined to “one active Delivery to at most one Session”; otherwise crash-safe `DETACHED` recovery would be impossible. This wording change is proposed for the architecture document only when the implementation card lands.

## 4. Independent lifecycle projections

### 4.1 Host Session availability

WSR observes but does not persist or own this state:

```text
UNKNOWN --exact host lookup--> AVAILABLE
UNKNOWN --exact host lookup--> UNAVAILABLE
AVAILABLE --authoritative host loss/restart join miss--> UNAVAILABLE
UNAVAILABLE --exact host discovery--> AVAILABLE
```

Availability alone never creates, terminates, moves, or selects a Delivery. UI Session switching changes only which explicit session key invokes Intake; it does not transfer a binding.

### 4.2 Intake binding

```text
UNBOUND --new Delivery registration / explicit recover--> BOUND
BOUND --plugin restart--> RESTORING
RESTORING --exact Session + Delivery join--> BOUND
RESTORING --Delivery valid, Session unavailable--> DETACHED
DETACHED --explicit recover by authorized unbound Session--> BOUND
BOUND/DETACHED --conclusive terminal or authorized abandonment--> UNBOUND
```

`RESTORING` is an in-memory startup phase, not a persisted competing truth. Persisted records are `BOUND` or `DETACHED`. A changed Session cannot implicitly inherit a binding. Recover with or without an explicit Delivery ID must prove that the invoking Session’s exact authorized workspace equals the persisted Manifest worktree.

### 4.3 Delivery

The existing current-slot states and owners remain unchanged:

```text
NO_DELIVERY -> BOUND -> START_UNCERTAIN -> RUNNING_CORRELATED
RUNNING_CORRELATED -> RESULT_UNRESOLVED -> RUNNING_CORRELATED | TERMINAL_HANDLING
START_UNCERTAIN -> START_FAILED -> NO_DELIVERY
RUNNING_CORRELATED -> TERMINAL_HANDLING -> NO_DELIVERY
```

Pre-Manifest preparation is not a Delivery lifecycle state. Process death before Manifest persistence leaves no Delivery. Death after persistence leaves an exact recoverable Delivery, whether or not Intake completed its binding write.

### 4.4 Worktree occupancy

Worktree lifecycle is a projection of the existing current-slot record, not a new file or writer:

| Worktree projection | Current-slot basis | Release rule |
|---|---|---|
| `FREE` | `EMPTY` | M01 may admit one `NEW` holder |
| `OCCUPIED` | `BOUND`, `START_UNCERTAIN`, `RUNNING_CORRELATED` | reject/return exact recovery; never steal |
| `UNCERTAIN` | `RESULT_UNRESOLVED`, unresolved start | remain occupied until conclusive reconciliation |
| `RELEASING` | `START_FAILED`, `TERMINAL_HANDLING` | release only through existing owner transition |

Crash, Session loss, wall-clock time, or a new request never changes `OCCUPIED`/`UNCERTAIN` to `FREE`.

## 5. Establishment and release ordering

### Create

1. Intake proves the invoking live Session and exact registered workspace; failure returns `DSH_INTAKE_WORKSPACE_UNAUTHORIZED` with zero Execution effect.
2. Execution validates the private invocation authorization, derives the exact canonical Git worktree, and runs worktree admission before Package work.
3. Only `NEW` performs Package preparation and persists Manifest/current-slot before Runner effect.
4. Intake joins the registered Delivery by correlation and persists the exclusive Session binding including `deliveryBindingIdentity`.
5. If the process dies between steps 3 and 4, the Delivery is valid and detached. Restart or explicit recover must join it; no rollback or fabricated terminal result is allowed.

No pre-Delivery reservation is required. Adding one would duplicate authority and contradict the existing “no Prepared Binding store” decision.

### Recover/rebind

1. Bootstrap completes Execution current-slot/Manifest recovery first. If it cannot establish exact truth, application startup fails closed.
2. Intake loads and validates its binding document, then joins it against the complete Execution inventory.
3. Exact valid binding + available Session becomes `BOUND`; exact valid Delivery + unavailable Session becomes `DETACHED`.
4. A binding whose Delivery is conclusively absent after successful Bootstrap is removed as stale presentation state. Ambiguous inventory, identity mismatch, duplicates, or corruption stop Intake startup.
5. Explicit recover is allowed only from an unbound, workspace-authorized Session and only when the Delivery is detached. It atomically replaces the adapter-private binding record; it never changes Manifest/current-slot.

### Release

Conclusive terminal handling or authorized abandonment clears the Intake binding as presentation cleanup and clears current-slot only through the existing M01 transition. If either cleanup is interrupted, restart reconciliation uses Execution truth and never invents an outcome. Session disappearance alone only detaches presentation and never releases the worktree.

## 6. Required implementation oracles

| Scenario | Required result | Forbidden effect |
|---|---|---|
| two Sessions create on the same worktree | one `NEW`; other `CONTENDED` or exact `RECOVERY` | second Package/Runner/binding effect |
| one Session attempts a second Delivery | `SESSION_INTAKE_BOUND` | new admission or implicit switch |
| second Session claims a bound Delivery | `DELIVERY_INTAKE_BOUND` | rebinding or winner selection |
| different Sessions, different worktrees | both may proceed within global concurrency limit | cross-session presentation leakage |
| UI switches current Session | no binding transfer | alias/recency-based lookup |
| registered workspace/session mismatch | `DSH_INTAKE_WORKSPACE_UNAUTHORIZED` | `process.cwd()`, parent, sibling, or configured-root widening fallback |
| crash before Manifest persistence | no Delivery and no binding | recovery from partial Package/preparation state |
| crash after Manifest but before Intake bind | exact Delivery recovered as detached | Manifest deletion or new selector resolution |
| crash after binding write | exact four-field/identity join | automatic winner or changed worktree |
| restart with Session unavailable | `DETACHED`; worktree remains occupied | timeout release |
| recover from different workspace | `DSH_INTAKE_WORKSPACE_UNAUTHORIZED` | Delivery disclosure through mutation |
| stale binding after conclusive terminal cleanup | remove binding after Bootstrap-ready inventory join | startup-time guess before recovery completes |
| corrupt/duplicate binding or Manifest mismatch | startup failure with bounded diagnostic | repair by dropping an arbitrary record |

## 7. Provisional transition replacement

The #93 checks remain the authorization source but stop passing a raw workspace string as if it were already the durable worktree. The later implementation must introduce a private, typed, invocation-only conversation-workspace authorization input and let Execution derive/persist the worktree. The input has no identity or durable lifecycle of its own. Existing binding documents require an explicit schema migration that adds `deliveryBindingIdentity`; migration must exact-join every v1 record to one recovered Delivery or fail closed. It must not silently rewrite an unmatched record.

## 8. Later implementation ownership

No production path is changed by this design wave. Implementation is tracked by [#102](https://github.com/firestige/workflow-self-recursive/issues/102) and remains outside Iteration 4 unless the Iter4 plan, DAG, release baseline, and `0.1.3+` decision are explicitly revised.

Expected owned paths for that card:

- Intake binding and authority: `packages/dsh-intake/src/binding-repository.js`, `src/index.d.ts`, `src/plugin.js`;
- private invocation-authorization seam/composition: `src/bootstrap/contracts.ts`, `src/bootstrap/production.ts`, `src/core/request.ts`, `src/core/execution-core.ts`;
- Delivery identity/read model only as required: `src/delivery/manifest.ts`, `src/delivery/admission.ts`, `src/delivery/current-slot.ts` (no state-semantic rewrite);
- focused tests: `test/intake/**`, `test/delivery/**`, `test/bootstrap/**`, and DSH restart/product qualification scripts;
- post-implementation wording: Execution/Intake READMEs, configuration reference, and agent architecture translations.

The Runner five modules, FROZEN contracts, Evidence, public application methods, and Provider-native Session types are forbidden paths for this change.
