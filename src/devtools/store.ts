import { makeObservable, observable, action } from "mobx";
import type {
  ActionStartParams,
  ActionEndParams,
  ComputedParams,
  MutationParams,
  ServiceCallParams,
  ServiceCallResultParams,
  StateChangeParams,
} from "./types";

// ─── Shared symbol ────────────────────────────────────────────────────────────

export const CLASS_NAME_KEY = Symbol("className");

// ─── Public types ─────────────────────────────────────────────────────────────

export interface MutationEntry {
  path: string;
  operation: string;
  args: any[];
}

export interface ServiceCallEntry {
  serviceCallId: string;
  name: string;
  path: string[];
  args: any[];
  result: any;
  error?: any;
  isAsync?: boolean;
  isPending?: boolean;
}

export interface ActionEntry {
  id: string;
  name: string;
  args: any[];
  duration?: number;
  error?: any;
  status: "running" | "done" | "error";
  isAsync?: boolean;
  changes: ActionEvent[];
}

export type ActionEvent =
  | { kind: "mutation"; mutation: MutationEntry }
  | { kind: "serviceCall"; serviceCall: ServiceCallEntry }
  | { kind: "action"; action: ActionEntry };

// ─── Store ────────────────────────────────────────────────────────────────────

class DevtoolsStore {
  /** Nested state snapshot built from onStateChange changes, keyed by class name. */
  stateSnapshot: Record<string, any> = {};

  /** Dot-joined paths of all computed properties seen, e.g. "Counter.doubled". */
  computedPaths: Set<string> = new Set();

  /** Top-level action history (newest first). */
  actions: ActionEntry[] = [];

  /** Fast lookup for in-flight actions (cleared on onActionEnd). */
  private _actionMap = new Map<string, ActionEntry>();

  /** Fast lookup for pending async service calls (cleared when result arrives). */
  private _serviceCallMap = new Map<string, ServiceCallEntry>();

  constructor() {
    makeObservable(this, {
      stateSnapshot: observable,
      computedPaths: observable,
      actions: observable,
      handleStateChange: action,
      handleComputed: action,
      handleActionStart: action,
      handleActionEnd: action,
      handleMutation: action,
      handleServiceCall: action,
      handleServiceCallResult: action,
      clearActions: action,
    });
  }

  handleStateChange({ path, value }: StateChangeParams) {
    const [instanceName, ...rest] = path;
    if (!this.stateSnapshot[instanceName]) {
      this.stateSnapshot[instanceName] = {};
    }
    setNestedPath(this.stateSnapshot[instanceName], rest, value);
  }

  handleComputed({ path, value }: ComputedParams) {
    const [instanceName, ...rest] = path;
    if (!this.stateSnapshot[instanceName]) {
      this.stateSnapshot[instanceName] = {};
    }
    setNestedPath(this.stateSnapshot[instanceName], rest, value);
    this.computedPaths.add(path.join("."));
  }

  handleActionStart({
    actionId,
    parentActionId,
    name,
    args,
  }: ActionStartParams) {
    const entry: ActionEntry = observable({
      id: actionId,
      name,
      args,
      status: "running" as const,
      duration: undefined,
      error: undefined,
      changes: [] as ActionEvent[],
    });

    this._actionMap.set(actionId, entry);

    if (parentActionId) {
      const parent = this._actionMap.get(parentActionId);
      if (parent) {
        parent.changes.push({ kind: "action", action: entry });
        return;
      }
    }

    this.actions.unshift(entry);
    if (this.actions.length > 100) this.actions.length = 100;
  }

  handleActionEnd({ actionId, duration, error, isAsync }: ActionEndParams) {
    const entry = this._actionMap.get(actionId);
    if (!entry) return;

    entry.duration = duration !== undefined ? Math.round(duration) : undefined;
    entry.error = error;
    entry.isAsync = isAsync;
    entry.status = error ? "error" : "done";

    this._actionMap.delete(actionId);
  }

  handleMutation({ actionId, mutation }: MutationParams) {
    const entry = this._actionMap.get(actionId);
    if (!entry) return;
    entry.changes.push({ kind: "mutation", mutation });
  }

  handleServiceCall({
    actionId,
    serviceCallId,
    name,
    path,
    args,
    result,
    error,
    isAsync,
  }: ServiceCallParams) {
    const entry = this._actionMap.get(actionId);
    if (!entry) return;
    const serviceCall: ServiceCallEntry = observable({
      serviceCallId,
      name,
      path,
      args,
      result,
      error,
      isAsync,
      isPending: isAsync && !error,
    });
    entry.changes.push({ kind: "serviceCall", serviceCall });
    if (isAsync && !error) {
      this._serviceCallMap.set(serviceCallId, serviceCall);
    }
  }

  handleServiceCallResult({ serviceCallId, result, error }: ServiceCallResultParams) {
    const entry = this._serviceCallMap.get(serviceCallId);
    if (!entry) return;
    entry.result = result;
    entry.error = error;
    entry.isPending = false;
    this._serviceCallMap.delete(serviceCallId);
  }

  clearActions() {
    this.actions.length = 0;
    this._actionMap.clear();
    this._serviceCallMap.clear();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const ctor = (value as any).constructor;
  return ctor === Object || ctor === undefined;
}

function setNestedPath(
  obj: Record<string, any>,
  path: string[],
  value: any,
): void {
  if (path.length === 0) return;

  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!isPlainObject(current[segment])) {
      current[segment] = {};
    }
    current = current[segment];
  }

  const lastKey = path[path.length - 1];

  // Class instances are stored as empty-object placeholders so subsequent
  // onStateChange calls for their properties can fill them in properly.
  const isClassInstance =
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !isPlainObject(value);

  if (isClassInstance) {
    if (!isPlainObject(current[lastKey])) {
      current[lastKey] = {};
    }
    current[lastKey][CLASS_NAME_KEY] = (value as any)?.constructor?.name;
  } else {
    current[lastKey] = value;
  }
}

export const devtoolsStore = new DevtoolsStore();
