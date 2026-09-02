export type OperationsCommand =
  | "setup" | "install" | "preflight" | "config"
  | "status" | "health" | "logs" | "start" | "stop" | "restart"
  | "upgrade" | "rollback" | "uninstall" | "doctor" | "cleanup";

export interface ComponentResult {
  id: string;
  layer: string;
  status: "succeeded" | "blocked" | "failed" | "unavailable" | "resumed";
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
