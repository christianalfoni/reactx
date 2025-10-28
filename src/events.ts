/**
 * Event types emitted by the reactive system.
 * These events can be observed by implementing the ReactiveObserver interface.
 */

export interface MutationData {
  actionId: string;
  executionId: string;
  operatorId: number;
  actionName?: string;
  mutations: Array<{
    method: string;
    delimiter: string;
    path: string;
    args: any[];
    hasChangedValue: boolean;
  }>;
}

export interface StateChangeData {
  path: string[];
  value: any;
  isMutation: boolean;
}

export interface DerivedData {
  path: string[];
  paths: string[][];
  value: any;
  updateCount: number;
}

export interface ActionStartData {
  actionId: string;
  executionId: string;
  actionName: string;
  path: string[];
  parentExecution?: { operatorId: number };
  value: any[];
}

export interface ActionEndData {
  actionId: string;
  executionId: string;
}

export interface OperatorStartData {
  actionId: string;
  executionId: string;
  operatorId: number;
  name: string;
  path: string[];
  type: string;
  parentExecution?: { operatorId: number };
}

export interface OperatorEndData {
  actionId: string;
  executionId: string;
  operatorId: number;
  isAsync: boolean;
  error?: any;
}

export interface EffectData {
  effectId: number;
  actionId: string;
  executionId: string;
  operatorId: number;
  method: string | symbol;
  args: any[];
  name: string;
  result: any;
  isPending: boolean;
  error: any;
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
  | { type: "mutation"; data: MutationData }
  | { type: "state"; data: StateChangeData }
  | { type: "derived"; data: DerivedData }
  | { type: "action:start"; data: ActionStartData }
  | { type: "action:end"; data: ActionEndData }
  | { type: "operator:start"; data: OperatorStartData }
  | { type: "operator:end"; data: OperatorEndData }
  | { type: "effect"; data: EffectData };

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
