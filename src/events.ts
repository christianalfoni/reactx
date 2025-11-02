/**
 * Event types emitted by the reactive system.
 * These events can be observed by implementing the ReactiveObserver interface.
 */

export interface PropertyMutationData {
  executionId: string;
  executionPath: string[];
  mutations: Array<{
    propertyPath: string;
    operation:
      | "set"
      | "push"
      | "pop"
      | "shift"
      | "unshift"
      | "splice"
      | "sort"
      | "reverse";
    args: any[];
  }>;
}

export interface PropertyTrackedData {
  path: string[];
  value: any;
}

export interface ComputedEvaluatedData {
  path: string[];
  value: any;
  dependencies: string[][];
  evaluationCount: number;
}

export interface ActionStartData {
  executionId: string;
  path: string[];
  args: any[];
  parentExecutionId?: string;
}

export interface ActionEndData {
  executionId: string;
  duration?: number;
  error?: any;
}

export interface ExecutionStartData {
  executionId: string;
  name: string;
  path: string[];
  parentExecutionId?: string;
}

export interface ExecutionEndData {
  executionId: string;
  duration?: number;
  isAsync: boolean;
  error?: any;
}

export interface InstanceMethodData {
  methodName: string;
  methodPath: string[];
  args: any[];
  result: any;
  error?: any;
  executionId: string;
}

export interface InitData {
  state: Record<string, any>;
  actions: Record<string, any>;
  delimiter: string;
  features: {
    charts: boolean;
    transitions: boolean;
    components: boolean;
    flushes: boolean;
    runActions: boolean;
  };
}

/**
 * Union type of all possible reactive events
 */
export type ReactiveEvent =
  | { type: "init"; data: InitData }
  | { type: "property:mutated"; data: PropertyMutationData }
  | { type: "property:tracked"; data: PropertyTrackedData }
  | { type: "computed:evaluated"; data: ComputedEvaluatedData }
  | { type: "action:start"; data: ActionStartData }
  | { type: "action:end"; data: ActionEndData }
  | { type: "execution:start"; data: ExecutionStartData }
  | { type: "execution:end"; data: ExecutionEndData }
  | { type: "instance:method"; data: InstanceMethodData };

/**
 * Observer interface for reactive events.
 * Implement this interface to receive notifications about reactive state changes.
 *
 * @example
 * ```typescript
 * class MyObserver implements ReactiveObserver {
 *   onEvent(event: ReactiveEvent): void {
 *     console.log('Event:', event.type, event.data);
 *   }
 * }
 *
 * const state = reactive({ count: 0 }, { observer: new MyObserver() });
 * ```
 */
export interface ReactiveObserver {
  /**
   * Called when a reactive event occurs
   * @param event The event that occurred
   */
  onEvent(event: ReactiveEvent): void;
}
