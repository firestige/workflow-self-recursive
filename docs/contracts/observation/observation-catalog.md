<a id="observation-catalog"></a>
# Observation Catalog

> **FROZEN — PUBLISHED CONTRACT.** This document is a meaning-preserving authority split from superseded `EE-CONTRACT-DRAFT-001`, plus the post-split `EE-OBSERVATION-A-CLASS-INPUTS-2026-08-20` amendment; provenance remains in Git history. It owns the technology-neutral meaning of the Observation facts: fact classes, semantic owners, and the identity / applicability / completeness / unit / privacy / relationship / missingness semantics. It contains no wire-level representation (no machine field names, no carrier or type mapping, no concrete serialization). The exact machine mapping is owned by the published [OTel Observation Profile](otel-observation-profile.md), version `1.0.0`.

<a id="observation-catalog-1"></a>
## 1. Metadata and Authority

| Field | Value |
| --- | --- |
| Document identity | `observation.identity.001` |
| Status | `FROZEN` |
| Contract release | current `observation-contract@1.0.2`; non-semantic exact-binding PATCH over immutable `1.0.1`; wire Profile remains `1.0.0` |
| Publication binding | [`release-binding-1.0.2.json`](release-binding-1.0.2.json); historical `1.0.0` and `1.0.1` remain resolving and byte-identical |
| Normative language | English |
| Origin | Meaning-preserving authority split from superseded `EE-CONTRACT-DRAFT-001`; C55–C57 meaning and ownership resolve to [Concept §3](../../agent-architecture.md#ee-concept-3), [Execution §14](../../systems/execution/project-execution-system.md#ee-execution-14), and [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8); the historical amendment remains provenance only |
| Semantic authorities | [Concept](../../agent-architecture.md), [Execution Design](../../systems/execution/project-execution-system.md), [Evidence Design](../../systems/evidence/evidence-system.md) |
| Representation companion | [OTel Observation Profile](otel-observation-profile.md), published version `1.0.0` |
| Transport/interaction companion | [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md) |
| Confirmed direction | `EE-SKELETON`, SHA-256 `73b3481a099983b57ee9e1dd512c6ed23823f0d045085f9ef585db70be13949a` |
| Translation parity obligation | English/Chinese anchors, headings, tables, IDs, fields, enums and links are paired, per [Concept `concept.acceptance.017`](../../agent-architecture.md) |

This document catalogs what Observation facts *mean* and who owns each fact. It does not own how facts are encoded, transported, admitted, stored, or queried. C55–C57 specifically reference the English [Concept §3](../../agent-architecture.md#ee-concept-3), [Execution §14](../../systems/execution/project-execution-system.md#ee-execution-14), and [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8) owner anchors; Observation encodes them and does not become their semantic producer. When representation conflicts with those anchors, the owner anchors govern.

Profile `0.3.0` is `NON_RESOLVING_LEGACY_HISTORY_ONLY`; it remains provenance in Git history and is not a selectable compatibility target.

<a id="observation-catalog-2"></a>
## 2. Purpose, Ownership Split, and Reading

Observation is the versioned, allow-listed, content-minimized factual record that Execution emits and Evidence accepts. The meaning of those facts is stable and technology-neutral; their encoding is a separate representation decision.

| Concern | Sole owner |
| --- | --- |
| Fact meaning, semantic owner, truth, privacy, fact lifecycle semantics | this document, delegating to the English Concept/Execution/Evidence Designs |
| Exact machine mapping (names, carriers, closed value sets, complete shapes) | [OTel Observation Profile](otel-observation-profile.md), version `1.0.0` |
| Transport flow, endpoints, partial success, retry, ambiguous commit | [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md) |
| Admission, projection, durable storage, query | [Evidence System Design](../../systems/evidence/evidence-system.md) |
| Producer mapping, privacy/redaction, export isolation | [Execution System Design](../../systems/execution/project-execution-system.md) |

The exact field registry appears in exactly one document (the OTel Observation Profile). This Catalog names the same concepts with technology-neutral names only; it never reproduces the machine field registry.

Here, lifecycle means the semantic lifecycle of an Observation fact: when a fact applies, what its absence means, and how its truth/completeness state is read. It is distinct from Evidence retention/expiry data lifecycle, which is owned by the [Evidence System Design](../../systems/evidence/evidence-system.md).

<a id="observation-catalog-3"></a>
## 3. Fact Classes and Semantic Owners

A **fact class** is a typed family of observation records with one stable meaning. The first profile defines exactly ten fact classes. Each fact class has one semantic owner that supplies the scalar and owns its meaning; Delivery Observation only maps it.

| # | Fact class | Meaning | Semantic owner |
| ---: | --- | --- | --- |
| 1 | Delivery Summary | one Delivery's terminal outcome and its business binding (delivery, task, workflow, implementation, runtime, manifest digest, family), with optional owner-reported elapsed time and furthest reached Workflow stage | Runtime/Execution result owner for outcome and elapsed time; Workflow owner for stage identity; Execution/Workflow owners for binding identity |
| 2 | Review Finding | one bounded, non-empty, privacy-safe human-readable Finding assertion plus its source Review, Finding-specific scope, and exactly one typed affected target | source review lens; Workflow/Artifact/target owners supply coordinates |
| 3 | Review Summary | one Review result: identity, lens, scope, reviewed Artifact, writer/reviewer invocations, and an optional observed review count | Workflow review owner |
| 4 | Test Summary | implementation test pass/fail/skip counts and applicable duration for one test report | Implementation test owner; Artifact owner supplies report reference |
| 5 | Intervention | one observed intervention fact | Workflow control owner |
| 6 | Role Lineage | one immutable mapping from a version-local Role identity to a family-scoped lineage identity | Workflow Contract owner |
| 7 | Usage | one native usage quantity with kind, unit, source class, source identity, and nonnegative value | Runtime/provider usage owner |
| 8 | Sampling Decision | one sampling decision and its probability | Delivery Observation sampler |
| 9 | Implementation Summary | one structural-coverage fact for a single dimension (line, branch, or function) and its report | structural coverage owner; Artifact owner supplies report reference |
| 10 | System Design Summary | Fresh Reader result and deterministic verification result | Fresh Reader owner and deterministic verification owner |

No fact class asserts design quality, reviewer effectiveness, ranking, recommendation, or causal inference. Observed activity (Role/Agent/model/tool calls and durations) is recorded as causal activity, not as a summary fact class; it carries no summary-derived causality. Model-role evaluation summarizes those activity facts; the wire never embeds a free-form or list-valued model summary.

<a id="observation-catalog-4"></a>
## 4. Semantic Fields

A **semantic field** is a named attribute of a fact class, described here in technology-neutral terms. `Kind class` names the semantic role of the field; it is not a serialization type. The exact machine field for each semantic field is owned by the [OTel Observation Profile](otel-observation-profile.md#otel-profile-7).

| Semantic field | Fact classes | Kind class | Meaning |
| --- | --- | --- | --- |
| Delivery identity | Delivery Summary | identity | one Delivery; never substitutes for an activity identity |
| Task identity | Delivery Summary | identity | grouping identity across related Deliveries; optional grouping coordinate only, no causality |
| Workflow identity | Delivery Summary | identity | logical workflow identity |
| Workflow version | Delivery Summary | identity | workflow semantic-version coordinate |
| Implementation identity | Delivery Summary | identity | implementation coordinate |
| Runtime identity | Delivery Summary | identity | runtime coordinate |
| Manifest digest | Delivery Summary | integrity | immutable manifest binding |
| Workflow family | Delivery Summary, all family facts | classification | `implementation` or `system-design`; a fact belongs to one family |
| Record identity | every fact record | identity | stable first-accepted record identity and dedup key |
| Delivery outcome | Delivery Summary | status | closed terminal outcome category |
| Delivery elapsed time | Delivery Summary | duration | owner-reported elapsed milliseconds from Delivery start to terminal outcome; nonnegative and unavailable when absent |
| Delivery stage reached | Delivery Summary | classification | owner-reported furthest reached Workflow stage identity at terminal outcome; exact identity only, with no name parsing or inferred ordering |
| Canonical model identity | recorded model-call activity | identity | provider-scoped canonical model identity supplied by the Runtime/provider owner; distinct from display names and request/response aliases |
| Model-to-role attribution | recorded model-call activity | relationship | exact on-call tuple of canonical model identity, provider, version-local Role identity, Runtime identity, and Span identity; evaluation may summarize only recorded tuples |
| Completeness state | summary and usage facts | completeness | closed completeness/applicability state |
| Review identity | Review Finding, Review Summary | identity | review result identity |
| Review lens | Review Finding, Review Summary | classification | closed review-lens category |
| Review scope | Review Finding, Review Summary | identity | coarse review scope; no free text |
| Review severity | Review Finding | classification | closed severity category |
| Review total | Review Summary | count | reported review total |
| Review observed count | Review Summary | count | owner-reported observed count, including zero; absence is "no count fact", never zero |
| Finding identity | Review Finding | identity | Finding identity |
| Finding status | Review Finding | status | closed disposition category; never part of the immutable assertion |
| Finding summary | Review Finding | content | the sole bounded human-readable Finding scalar |
| Finding scope | Review Finding | identity | Finding-specific affected-scope node; distinct from coarse Review scope |
| Source review identity | Review Finding | identity | the review that produced this Finding |
| Fix identity | Review Finding (fixed fact) | identity | fix/change identity |
| Fix-to-Finding edge | Review Finding (fixed fact) | relationship | explicit fix→Finding edge |
| Recheck identity | Review Finding, Review Summary (recheck facts) | identity | recheck identity |
| Recheck-to-prior-review edge | recheck facts | relationship | explicit recheck→prior Review edge |
| Recheck-to-Finding edge | recheck facts | relationship | explicit recheck→Finding edge |
| Recheck-to-Fix edge | recheck facts | relationship | explicit recheck→Fix edge, present only when a Fix is under recheck |
| Iteration identity | Recheck summary and Recheck-on-Finding | identity | objective iteration identity, present exactly on iterated shapes |
| Artifact identity | review/test/report/family facts | identity | referenced Artifact identity |
| Artifact digest | same facts as Artifact identity | integrity | immutable Artifact reference binding |
| Role identity | invocation and lineage facts | identity | version-local Role identity |
| Role lineage identity | Role Lineage | identity | family-scoped lineage identity; no parsing or name inference |
| Parent role identity | lineage/relation facts | identity | parent relationship endpoint; joined only via the lineage mapping |
| Writer/reviewer/recheck role identity | review/artifact/recheck relations | identity | writer/reviewer/recheck endpoint, joined via the mapping |
| Writer/reviewer/recheck invocation identity | review/artifact/recheck relations | identity | the invocation that performed the write/review/recheck |
| Intervention kind | Intervention | classification | closed intervention category |
| Observed loop count | family summary | count | observed-loop fact only; never quality inference |
| Observed intervention count | family summary | count | observed-intervention fact only |
| Usage kind | Usage | classification | closed native-usage category |
| Usage unit | Usage | unit | exact source-scoped unit (or ISO currency for money) |
| Usage source | Usage | provenance | `runtime` or `provider` |
| Usage source identity | Usage | identity | exact runtime or provider identity |
| Usage value | Usage | quantity | nonnegative count or money in minor units |
| Sampling decision | Sampling Decision | status | closed sampling decision |
| Sampling probability | Sampling Decision | quantity | inclusive [0,1] sampling probability |
| Family schema | every family fact | classification | family semantic-version coordinate |
| Finding target kind | Review Finding | classification | closed `artifact`/`section`/`component`/`requirement` category |
| Finding target identity | Review Finding | identity | affected target endpoint |
| Containing artifact identity | Review Finding | identity | containing Artifact for scoped targets; distinct from reviewed Artifact |
| Test passed/failed/skipped count | Test Summary | count | compatible test-count facts |
| Test duration | Test Summary | duration | applicable test duration |
| Coverage dimension | Implementation Summary | classification | `line`, `branch`, or `function`; one per fact |
| Coverage covered / total | Implementation Summary | count | covered and denominator pair; never combined into a score |
| Coverage scope | Implementation Summary | identity | exact coverage scope; no source body or path list |
| Coverage tool | Implementation Summary | provenance | exact tool/version identity |
| Coverage format | Implementation Summary | provenance | exact report-format identity |
| Fresh Reader result | System Design Summary | status | closed Fresh Reader result |
| Fresh Reader finding count | System Design Summary | count | Fresh Reader Finding count |
| Verification identity | System Design Summary | identity | verification-run identity |
| Verification result | System Design Summary | status | closed verification result |
| Verification passed/failed checks | System Design Summary | count | passed/failed check counts |

No field carries a prompt, message, tool argument/result, source/diff, credential, or raw error body. No field asserts quality, effectiveness, ranking, recommendation, or inferred causality.

<a id="observation-catalog-5"></a>
## 5. Fact Class Profiles

Each row is the technology-neutral profile of one fact class: what it means, how it is identified, when it applies, how completeness and unit are expressed, its privacy class, its relationships, and what its absence means.

| Fact class | Identity | Applicability | Completeness | Unit | Privacy | Relationships | Missing meaning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Delivery Summary | distinct Delivery identity plus record identity | one record per Delivery; business binding coordinates required; elapsed time and reached stage are optional direct owner reports | summary state applies when completeness truth is asserted | outcome and stage are categories/identities; elapsed time is nonnegative milliseconds | classification, identity and bounded duration metadata only | Delivery→business binding and Delivery→reached-stage; no causality from task grouping | a missing outcome or binding means no fact; absent elapsed time or stage means unavailable, never zero or an inferred stage |
| Review Finding | Finding assertion `(Finding identity, Finding scope)`; one typed target edge per record | exactly one affected target per record; multi-target repeats the complete assertion once per target | not applicable to the assertion itself | no numeric unit; Finding summary is bounded text | the Finding summary is the sole content scalar, privacy-safe; targets are identifiers only | Finding→source Review; Finding→affected target; Finding-specific scope node | a missing field rejects the record; it never yields a partial Finding |
| Review Summary | Review identity plus record identity | ordinary or Recheck summary; a summary must carry lens, scope, Artifact and writer/reviewer invocations | `FINAL`, `LOWER_BOUND`, `NOT_APPLICABLE`, or `UNAVAILABLE` | observed count is a nonnegative integer; review total is a nonnegative integer | classification and identity metadata | Review→reviewed Artifact; writer/reviewer invocations→Roles | absent observed count means "no count fact", never zero |
| Test Summary | record identity plus report Artifact reference | one record per applicable test report | completeness state applies | counts are nonnegative integers; duration is seconds | counts and duration only | Test Summary→report Artifact | missing duration means no duration fact |
| Intervention | record identity | one record per observed intervention | summary state applies on family summary | kind is a category | factual classification only | none beyond the family summary that counts it | absence of an intervention fact means no intervention was reported |
| Role Lineage | version-local Role identity and family-scoped lineage identity | emitted only when lineage is known/applicable | not applicable | no unit | identity metadata only | version-local Role→family lineage mapping | no lineage fact is emitted for unknown/not-applicable lineage; no synthesized value |
| Usage | record identity plus exact kind/unit/source/source-identity group | one record per native usage quantity; money only in minor units with an ISO currency | `FINAL`, `LOWER_BOUND`, `NOT_APPLICABLE`, or `UNAVAILABLE` when asserted | exact source-scoped unit; ISO-4217 currency for money | factual quantity and provenance only | none; compatible groups aggregate only under identical coordinates | missing usage means unavailable, never zero; no conversion or price inference |
| Sampling Decision | record identity | one record per sampling decision | not applicable | probability is inclusive [0,1] | factual status only | none | a `drop` decision does not imply no execution occurred |
| Implementation Summary | record identity plus exact dimension/scope/tool/format/report group | exactly one coverage dimension per record | completeness state applies | covered and total are nonnegative integers; covered never exceeds total | counts, scope identity, tool/format provenance only | Implementation Summary→report Artifact | a missing covered/total means no coverage fact, never zero coverage |
| System Design Summary | verification-run identity or Fresh Reader record identity | Fresh Reader result applies to `fresh-reader` lens summaries; verification result applies to deterministic verification runs | completeness state applies | result is a category; counts are nonnegative integers | factual status and counts only | System Design Summary→report Artifact | a missing result means no result fact |

<a id="observation-catalog-6"></a>
## 6. Cross-Cutting Semantics

### Identity

Every identity is owner supplied and mechanically compared. Arrival order, text, names, task grouping, display adjacency, and storage-generated identifiers never participate in identity. Distinct identity axes remain distinct: a Delivery is not a task; a logical Workflow is not an implementation; a task is not a retry token; an opaque runtime correlation is not public Workflow state; a display name is not a Role identity. A Finding assertion is keyed by `(Finding identity, Finding scope)`; a Finding target edge is keyed by the assertion plus the typed target and its containing-Artifact context; a status contribution, a Fix, and a Recheck each have their own separate identity domain. Record identity is the stable dedup key of one observation record; the recorded causal activity is identified by its own activity tuple and never by either component alone.

### Applicability

A field is **required**, **conditional**, or **prohibited** exactly as the complete shape in the representation profile dictates. Conditional presence is itself a signal: the observed review count is present on ordinary and Recheck summaries and prohibited on Finding shapes; the iteration identity is present exactly on iterated shapes. Conditional absence is never reconstructed into a value.

### Completeness

Four states express completeness and applicability:

| State | Meaning | Numeric interpretation |
| --- | --- | --- |
| `FINAL` | an applicable final summary was observed | zero is valid only when explicitly reported |
| `LOWER_BOUND` | detail was observed without a complete applicable summary | the value is a lower bound only |
| `NOT_APPLICABLE` | no value exists for the family/metric | no numeric value |
| `UNAVAILABLE` | sampling, loss, or a missing summary prevents a claim | no numeric value |

Only an applicable final summary can prove a final zero or total. The four states never collapse, and missing is never zero.

### Unit

A quantity carries an exact, source-scoped unit. Delivery elapsed time is an owner-reported nonnegative millisecond duration and never substitutes for an individual activity Span duration. Usage quantities carry an exact unit (an ISO-4217 currency for money); token usage and native usage are distinct measurement families and never substitute for each other. Structural coverage carries a dimension and a covered/total pair. Compatible facts aggregate only under identical semantic version, kind, unit-or-currency, source, source identity, and completeness coordinates; no implicit conversion or cross-unit summation is permitted.

### Privacy

The producer allow-list/redaction boundary and Admission both prohibit prompt and system-instruction bodies, model messages and input/output content, tool/Skill argument and result bodies, source files and full diffs and complete Artifact bodies, credentials and secrets and tokens, exception messages and stacks and raw error bodies, complete manifest copies, runtime session/checkpoint/native-state/configuration bodies, arbitrary maps and extension envelopes, and scores/rankings/recommendations/inferred causality. The single human-readable Finding scalar is a bounded nonempty paraphrase authored by the source review lens, never a copied body; all target and scope fields are bounded identifiers only.

### Missing meaning

Missing is never zero, and absence is never reconstructed. An absent observed review count is "no count fact"; a present zero is a recorded zero. An absent usage or token quantity is unavailable, never zero. An absent Delivery elapsed time or reached stage is unavailable, never zero or an inferred initial/terminal stage. An incomplete provider/model/Role/Runtime/Span attribution tuple is unavailable, never completed from aliases, ancestry or task grouping. An absent lineage fact means lineage is unknown or not applicable, never a synthesized identity. An absent completeness claim means no claim, never an assumed final state. Consumers never reconstruct unavailable producer intent.

<a id="observation-catalog-7"></a>
## 7. Relationship Model

The objective review graph joins distinct Review, Finding, Artifact, Fix, Recheck, Invocation, iteration, and Role identities only through typed endpoints; it never infers edges from names, order, counts, or grouping. The recorded causal activity is the only source of causal edges; summary counts never create a causal edge.

- **Review → scope/lens**: a Review carries its coarse scope and lens.
- **Review → reviewed Artifact**: a Review references exactly the reviewed Artifact and its digest.
- **Finding → source Review**: a Finding references the Review that produced it.
- **Finding → affected target**: a Finding asserts exactly one typed `artifact`/`section`/`component`/`requirement` target per record, with a containing Artifact where the target is artifact-scoped; multi-target Findings repeat the complete assertion once per target edge, order-independently.
- **Fix → Finding**: a Fix references exactly the Finding it fixes.
- **Recheck → Review/Finding/Fix/iteration**: a Recheck references the prior Review being rechecked, the Finding addressed, the Fix under recheck (only when one is), and the iteration, in addition to its own invocations and Roles.
- **Writer/reviewer/recheck invocation → Role**: each invocation references the version-local Role that performed it; the join goes through the lineage mapping, never through a display name or position.
- **version-local Role → family lineage**: each known lineage maps one version-local Role to one family-scoped lineage identity.
- **Delivery → reached stage**: a terminal Delivery Summary may carry the Workflow owner's exact furthest-reached stage identity; the consumer never orders or infers stages from names.
- **model call → Role/Runtime**: a model-call activity may assert an exact provider/canonical-model/version-local-Role/Runtime/Span tuple; evaluation may group recorded tuples but never create an attribution from parentage or display names.

<a id="observation-catalog-8"></a>
## 8. Compatibility and Aggregation

Compatible facts aggregate only under identical coordinates: semantic/family version, measurement kind, unit-or-currency, source, source identity, and completeness. Delivery elapsed time remains one direct contribution per Delivery and is grouped only by evaluation-declared cohorts; reached-stage facts remain exact Workflow stage identities. Model-role measures group only complete identical provider/canonical-model/version-local-Role/Runtime coordinates while retaining each Span identity as the contributing activity. Incompatible groups remain separate; premium requests and other provider-native units remain distinct from ordinary requests and credits; money is never converted or cross-summed; reported and estimated usage sources remain separate. Structural coverage aggregates only under identical dimension, scope, tool, format, and report; line, branch, and function pairs never combine into a score. Accepted history is never rewritten, and aggregation never fabricates a value that no accepted fact reported.
