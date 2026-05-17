export type ActionContext = {
  path: string[];
  id: string;
  parentId?: string;
  name: string;
};

/**
 * Event types emitted by the reactive system.
 * These events can be observed by implementing the ReactiveObserver interface.
 */

export interface MutationParams {
  actionId: string;
  mutation: {
    path: string;
    operation: string;
    args: any[];
  };
}

export interface StateChangeParams {
  path: string[];
  value: any;
}

export interface ComputedParams {
  path: string[];
  value: any;
  evaluationCount: number;
}

export interface ActionStartParams {
  actionId: string;
  parentActionId?: string;
  path: string[];
  name: string;
  args: any[];
}

export interface ActionEndParams {
  actionId: string;
  duration?: number;
  error?: any;
  isAsync?: boolean;
}

export interface ExecutionStartData {
  executionId: string;
  name: string;
  path: string[];
  parentExecutionId?: string;
}

export interface ServiceCallParams {
  actionId: string;
  serviceCallId: string;
  name: string;
  path: string[];
  args: any[];
  result: any;
  error?: any;
  isAsync?: boolean;
}

export interface ServiceCallResultParams {
  serviceCallId: string;
  result?: any;
  error?: any;
}

export type DevHooks = {
  onMutation(data: MutationParams): void;
  onComputed(data: ComputedParams): void;
  onStateChange(data: StateChangeParams): void;
  onServiceCall(data: ServiceCallParams): void;
  onServiceCallResult(data: ServiceCallResultParams): void;
  onActionStart(data: ActionStartParams): void;
  onActionEnd(data: ActionEndParams): void;
};

export type DevContext = {
  path: string[];
  hooks: DevHooks;
  actionId?: string;
};
