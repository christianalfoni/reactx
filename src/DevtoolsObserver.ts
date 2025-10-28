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

  /**
   * Receives and processes reactive events, translating them to devtools messages
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

      case "mutation":
        this.devtools.send({
          type: "mutations",
          data: event.data,
        });
        break;

      case "state":
        this.devtools.send({
          type: "state",
          data: event.data,
        });
        break;

      case "derived":
        this.devtools.send({
          type: "derived",
          data: event.data,
        });
        break;

      case "action:start":
        this.devtools.send({
          type: "action:start",
          data: event.data,
        });
        break;

      case "action:end":
        this.devtools.send({
          type: "action:end",
          data: event.data,
        });
        break;

      case "operator:start":
        this.devtools.send({
          type: "operator:start",
          data: event.data,
        });
        break;

      case "operator:end":
        this.devtools.send({
          type: "operator:end",
          data: event.data,
        });
        break;

      case "effect":
        this.devtools.send({
          type: "effect",
          data: event.data,
        });
        break;
    }
  }
}
