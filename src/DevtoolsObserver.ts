import { Devtools, Message } from "./Devtool";
import { ReactiveObserver, ReactiveEvent } from "./events";

/**
 * DevtoolsObserver implements the ReactiveObserver interface and sends
 * reactive events to the Overmind Devtools via WebSocket.
 *
 * @example
 * ```typescript
 * import { reactive } from 'reactx';
 * import { DevtoolsObserver } from 'reactx/devtools';
 *
 * const observer = new DevtoolsObserver('localhost:3031');
 * const state = reactive({ count: 0 }, { observer });
 * ```
 */
export class DevtoolsObserver implements ReactiveObserver {
  private devtools: Devtools;

  /**
   * Creates a new DevtoolsObserver instance
   * @param host The WebSocket host to connect to (default: "localhost:3031")
   * @param appName The application name to display in devtools (default: "reactx")
   * @param onMessage Optional callback for messages received from devtools
   */
  constructor(
    host: string = "localhost:3031",
    appName: string = "reactx",
    onMessage?: (message: Message) => void
  ) {
    this.devtools = new Devtools(appName);
    this.devtools.connect(host, onMessage || (() => {}));

    // Send initialization message
    this.devtools.send({
      type: "init",
      data: {
        state: {},
        actions: {},
        delimiter: ".",
        features: {
          charts: false,
          transitions: false,
          components: false,
          flushes: false,
          runActions: false,
        },
      },
    });
  }

  private currentActionId = 0;
  private executionToActionMap = new Map<string, { actionId: string; operatorId: number; actionName: string }>();

  private getActionInfo(executionId: string, path: string[]): { actionId: string; operatorId: number; actionName: string } {
    let info = this.executionToActionMap.get(executionId);
    if (!info) {
      info = {
        actionId: `action-${this.currentActionId++}`,
        operatorId: 0,
        actionName: path.join("."),
      };
      this.executionToActionMap.set(executionId, info);
    }
    return info;
  }

  /**
   * Receives and processes reactive events, translating them to devtools messages
   * Maps new event format to legacy Overmind devtools format
   * @param event The reactive event to process
   */
  onEvent(event: ReactiveEvent): void {
    switch (event.type) {
      case "init":
        this.devtools.send({
          type: "init",
          data: event.data,
        });
        break;

      case "property:mutated": {
        const { executionId, executionPath, mutations } = event.data;
        const actionInfo = this.getActionInfo(executionId, executionPath);

        // Map to old mutation format
        this.devtools.send({
          type: "mutations",
          data: {
            actionId: actionInfo.actionId,
            executionId,
            operatorId: actionInfo.operatorId,
            actionName: actionInfo.actionName,
            mutations: mutations.map((m) => ({
              method: m.operation,
              delimiter: ".",
              path: m.propertyPath,
              args: m.args,
              hasChangedValue: m.operation !== "set",
            })),
          },
        });
        break;
      }

      case "property:tracked": {
        const { path, value } = event.data;

        // Map to old state format
        this.devtools.send({
          type: "state",
          data: {
            path,
            value,
            isMutation: false,
          },
        });
        break;
      }

      case "computed:evaluated": {
        const { path, value, dependencies, evaluationCount } = event.data;

        // Map to old derived format
        this.devtools.send({
          type: "derived",
          data: {
            path,
            paths: dependencies,
            value,
            updateCount: evaluationCount,
          },
        });
        break;
      }

      case "action:start": {
        const { executionId, path, args, parentExecutionId } = event.data;
        const actionInfo = this.getActionInfo(executionId, path);
        const parentExecution = parentExecutionId
          ? this.executionToActionMap.get(parentExecutionId)
          : undefined;

        // Map to old action:start format
        this.devtools.send({
          type: "action:start",
          data: {
            actionId: actionInfo.actionId,
            executionId,
            actionName: path.join("."),
            path,
            parentExecution: parentExecution ? { operatorId: parentExecution.operatorId } : undefined,
            value: args,
          },
        });
        break;
      }

      case "action:end": {
        const { executionId } = event.data;
        const actionInfo = this.executionToActionMap.get(executionId);

        if (actionInfo) {
          // Map to old action:end format
          this.devtools.send({
            type: "action:end",
            data: {
              actionId: actionInfo.actionId,
              executionId,
            },
          });

          // Cleanup
          this.executionToActionMap.delete(executionId);
        }
        break;
      }

      case "execution:start": {
        const { executionId, name, path, parentExecutionId } = event.data;
        const actionInfo = this.getActionInfo(executionId, path);
        const parentExecution = parentExecutionId
          ? this.executionToActionMap.get(parentExecutionId)
          : undefined;

        // Map to old operator:start format
        this.devtools.send({
          type: "operator:start",
          data: {
            actionId: actionInfo.actionId,
            executionId,
            operatorId: actionInfo.operatorId,
            name,
            path: [],
            type: "action",
            parentExecution: parentExecution ? { operatorId: parentExecution.operatorId } : undefined,
          },
        });
        break;
      }

      case "execution:end": {
        const { executionId, isAsync, error } = event.data;
        const actionInfo = this.executionToActionMap.get(executionId);

        if (actionInfo) {
          // Map to old operator:end format
          this.devtools.send({
            type: "operator:end",
            data: {
              actionId: actionInfo.actionId,
              executionId,
              operatorId: actionInfo.operatorId,
              isAsync,
              error,
            },
          });
        }
        break;
      }

      case "instance:method": {
        const { methodName, methodPath, args, result, error, executionId } = event.data;
        const actionInfo = this.executionToActionMap.get(executionId);

        if (actionInfo) {
          // Map to old effect format
          this.devtools.send({
            type: "effect",
            data: {
              effectId: 0, // Legacy field
              actionId: actionInfo.actionId,
              executionId,
              operatorId: actionInfo.operatorId,
              method: methodName,
              args,
              name: methodPath.join("."),
              result,
              isPending: false,
              error,
            },
          });
        }
        break;
      }
    }
  }
}
