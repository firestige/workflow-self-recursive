# Iter6 product assembly qualification

The Iter6 `product-0.2.0` reference assembly passed the published-artifact journey on 2026-08-30.
The machine-readable record is [qualification.json](qualification.json). The product path installed
the top-level CLI from its stable GitHub Release and did not build or consume an owner source checkout.

## Published authority

| Layer | Stable coordinate | Bound digest |
| --- | --- | --- |
| Product operations | `product-0.2.0/wsr-product-operations-0.2.0.tgz` | `sha256:a04de9d862a9245dee4a51f7c7970cd4d65f31a110997f29a21c19a034885712` |
| DSH release set | `firestige/wsr-dsh@0.2.2` | `sha256:c4fbb644ace3a352d50377dc95b96f2d05c84bb671bb138f732192e029cc3f3c` |
| Execution owner | `wsr-execution@0.2.1` | `sha256:9375714297ea0af221ad9634f08c1b205d985649ae51db2964d46e6a9e4accf4` |
| Services | `compose-0.1.0/wsr-services-0.1.0.tar.gz` | `sha256:d59972441937c93b7454acf9b1c96d5bdd5150cfae7e8467e421f36de61cd131` |
| Workflow source | `hello-world-workflow@0.2.0` | `sha256:de838f4661a9c321c786cafee4fbe888695420c81ac8b6f8a7a41ed0fd029d0d` |
| Providers | Copilot `1.0.78`; Codex `0.144.5` | Execution qualification `sha256:4583cdf1bc4d1498312d2f585f6bba32dd614d9756b238063974e5c5b5fc0d27` |

Promotion run `33302166979` checked out immutable main commit
`3f60f295d3114a76bb621bd8aed36b79326bad0a`, ran all 26 product tests, packed the CLI, installed it
in an empty npm prefix, compared its packaged manifest byte-for-byte with `release/product/0.2.0.json`,
and published the four stable assets. A subsequent download verified the Release target, GitHub asset
digests, the supplied checksum, and the packaged manifest again.

## User journey

The clean profile used suite installation and exact Role bindings: `role.greeter` selected Copilot and
`role.reviewer` selected Codex. `/wsr create hello-world-workflow@0.2.0` created Delivery
`delivery-b6f03802-874a-4cea-b5f7-5dbf458ab258`; both Providers completed and the authoritative
Delivery outcome was `SUCCEEDED`. The sidebar/Delivery view retained the terminal state. A formal DSH
restart changed the process identity and recovered the same Session and Delivery from durable state.

Studio selected Task `task-wave14-studio-published` from Evidence, then completed the
Browser → DSH Host → Evidence → Evolution Evaluate path. It returned one receipt and 12 typed Metric
Results. Values were `UNAVAILABLE` with explicit withholding reasons because this small qualification
cohort intentionally contained no business metric population; no unavailable value was represented as
zero or an error.

The stable Release CLI was then installed into another empty prefix and repeated `setup`, `install`,
`preflight`, `start`, `status`, `health`, and `logs`. Every DSH/Execution, Evidence/Evolution, Workflow,
and Provider component reported `succeeded`. Upgrade reconciled the stable coordinates, rollback used
the compatible stable package rather than removing roots, and uninstall completed all four layers.

## Preservation and privacy

Before and after final uninstall, durable storage contained 63 files. The following values remained
byte-identical:

- config: `78200b19e59e7bd31cfb0a49d22e7e917c5cd71e91551271dee52ff74f8cbbbc`
- terminal Delivery: `f7f7e1cda893465c22d85647d4f6ccc9fce22883873384759f92a5fefd1e7aa3`
- Role binding: `4c007412008f13e45aa9a5b0fbcd281403ea46cc1a62e2af2f279da8a01d05e7`

The `wsr-evidence-data` Docker volume remained present. A targeted scan of the Release assets, product
configuration, typed logs result, and operation state found no GitHub token, OpenAI key, bearer header,
private key, or populated credential field. Configuration validation separately rejects credential-bearing
fields before persistence.

## Follow-ups outside the authoritative outcome

Qualification also retained two narrow defects instead of hiding them: issue #155 tracks a terminal
conversation presentation payload that omitted `summary` even though Delivery state and result were already
authoritatively `SUCCEEDED`; issue #156 tracks digest handling for a synthetic `ABSENT` repository-binding
projection. The real published `PRESENT` binding and Studio Evaluate path passed. Neither defect changes the
qualified Delivery outcome, durable recovery, published installation path, or MVP repository-selector decision.
