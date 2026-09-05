export type OperationsCommand =
  | "setup" | "install" | "preflight" | "config"
  | "status" | "health" | "logs" | "start" | "stop" | "restart"
  | "upgrade" | "rollback" | "uninstall" | "doctor" | "cleanup" | "version";

export interface ProductVersionIdentity {
  release: string;
  manifestDigest: string;
}

export interface VersionFacts {
  cli: { version: string };
  applied: ProductVersionIdentity | null;
  target: ProductVersionIdentity;
  activeOperation: null | (ProductVersionIdentity & {
    operationId: string;
    command: string;
    currentComponent: string | null;
    resumable: true;
  });
  alignment: "not-installed" | "aligned" | "drifted";
}

export interface ComponentResult {
  id: string;
  layer: string;
  status: "succeeded" | "blocked" | "failed" | "unavailable" | "resumed";
  phase: "preflight" | "apply" | "resume" | "abort" | "rollback" | "inspect";
  data?: unknown;
}

export interface OperationsDiagnostic {
  code: string;
  message: string;
  component?: string;
}

export interface OperationsResult {
  schema: "wsr.operations.result@1.0.0";
  command: OperationsCommand;
  operationId: string;
  status: "succeeded" | "blocked" | "failed";
  changed: boolean;
  components: ComponentResult[];
  diagnostics: OperationsDiagnostic[];
  resume?: { operationId: string; manifestDigest: string; nextComponent: string };
  data?: unknown;
}

export interface VersionOperationsResult extends OperationsResult {
  command: "version";
  data?: VersionFacts;
}

export interface StatusOperationsResult extends OperationsResult {
  command: "status";
  data?: { versions: VersionFacts };
}
