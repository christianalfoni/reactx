import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reactive } from "./proxy";
import { DevtoolsObserver } from "./DevtoolsObserver";
import type { ReactiveEvent } from "./events";

describe("DevtoolsObserver", () => {
  let mockWebSocket: any;
  let sentMessages: any[] = [];

  beforeEach(() => {
    // Mock WebSocket
    sentMessages = [];
    mockWebSocket = {
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      send: vi.fn((data: string) => {
        const parsed = JSON.parse(data);
        sentMessages.push(parsed);
      }),
      close: vi.fn(),
    };

    // @ts-ignore
    global.WebSocket = vi.fn(() => mockWebSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a devtools observer", () => {
    const observer = new DevtoolsObserver("localhost:3031", "test-app");
    expect(observer).toBeDefined();
  });

  it("sends init message on creation", () => {
    const observer = new DevtoolsObserver("localhost:3031", "test-app");

    // Trigger connection
    mockWebSocket.onopen?.();

    const initMessages = sentMessages.filter((msg) => {
      return msg.message && msg.message.type === "init";
    });
    expect(initMessages.length).toBeGreaterThan(0);
  });

  it("forwards reactive events to devtools", () => {
    const observer = new DevtoolsObserver("localhost:3031", "test-app");

    // Trigger connection
    mockWebSocket.onopen?.();

    // Send a test event (using new event type)
    observer.onEvent({
      type: "property:tracked",
      data: {
        path: ["count"],
        value: 1,
      },
    });

    // DevtoolsObserver should map it to the old "state" format for Overmind devtools
    const stateMessages = sentMessages.filter((msg) => {
      return msg.message && msg.message.type === "state";
    });
    expect(stateMessages.length).toBeGreaterThan(0);
  });

  it("integrates with reactive system", () => {
    const observer = new DevtoolsObserver("localhost:3031", "test-app");

    // Trigger connection
    mockWebSocket.onopen?.();

    class Counter {
      count = 0;

      increment() {
        this.count++;
      }
    }

    const counter = reactive(new Counter(), { observer });

    const initialMessageCount = sentMessages.length;

    // Perform an action
    counter.increment();

    // Should have sent more messages (action:start, operator:start, mutations, operator:end, action:end)
    expect(sentMessages.length).toBeGreaterThan(initialMessageCount);

    // Check for action messages
    const actionStartMessages = sentMessages.filter((msg) => {
      return msg.message && msg.message.type === "action:start";
    });
    expect(actionStartMessages.length).toBeGreaterThan(0);
  });

  it("handles all event types without crashing", () => {
    const observer = new DevtoolsObserver("localhost:3031", "test-app");

    // Trigger connection
    mockWebSocket.onopen?.();

    const initialCount = sentMessages.length;

    // Send a few representative event types with valid data
    observer.onEvent({
      type: "property:tracked",
      data: { path: ["test"], value: 1 },
    });

    observer.onEvent({
      type: "action:start",
      data: {
        executionId: "exec-1",
        path: ["test"],
        args: [],
      },
    });

    observer.onEvent({
      type: "action:end",
      data: { executionId: "exec-1" },
    });

    // Should have sent messages for these events
    expect(sentMessages.length).toBeGreaterThan(initialCount);

    // Verify the observer doesn't crash with any event type
    expect(() => {
      observer.onEvent({
        type: "property:mutated",
        data: {
          executionId: "exec-1",
          executionPath: ["test"],
          mutations: [],
        },
      });
      observer.onEvent({
        type: "computed:evaluated",
        data: {
          path: ["test"],
          value: 1,
          dependencies: [],
          evaluationCount: 0,
        },
      });
      observer.onEvent({
        type: "execution:start",
        data: {
          executionId: "exec-1",
          name: "test",
          path: ["test"],
        },
      });
      observer.onEvent({
        type: "execution:end",
        data: {
          executionId: "exec-1",
          isAsync: false,
        },
      });
      observer.onEvent({
        type: "instance:method",
        data: {
          methodName: "test",
          methodPath: ["test"],
          args: [],
          result: null,
          executionId: "exec-1",
        },
      });
    }).not.toThrow();
  });

  it("buffers messages when not connected", () => {
    const observer = new DevtoolsObserver("localhost:3031", "test-app");

    // Don't trigger connection - send messages while disconnected
    observer.onEvent({
      type: "property:tracked",
      data: {
        path: ["count"],
        value: 1,
      },
    });

    // Messages should be buffered
    const beforeConnect = sentMessages.length;

    // Now connect
    mockWebSocket.onopen?.();

    // Buffered messages should be sent
    expect(sentMessages.length).toBeGreaterThan(beforeConnect);
  });
});

describe("DevtoolsObserver - reactive integration", () => {
  let mockWebSocket: any;
  let sentMessages: any[] = [];

  beforeEach(() => {
    sentMessages = [];
    mockWebSocket = {
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      send: vi.fn((data: string) => {
        const parsed = JSON.parse(data);
        sentMessages.push(parsed);
      }),
      close: vi.fn(),
    };

    // @ts-ignore
    global.WebSocket = vi.fn(() => mockWebSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tracks state changes", () => {
    const observer = new DevtoolsObserver("localhost:3031", "test-app");
    mockWebSocket.onopen?.();

    class Store {
      count = 0;

      increment() {
        this.count++;
      }
    }

    const store = reactive(new Store(), { observer });

    const beforeAction = sentMessages.length;
    store.increment();

    // Should have action and mutation events
    expect(sentMessages.length).toBeGreaterThan(beforeAction);

    const actionEvents = sentMessages.filter((msg) => {
      return (
        msg.message &&
        (msg.message.type === "action:start" || msg.message.type === "action:end")
      );
    });
    expect(actionEvents.length).toBeGreaterThan(0);
  });

  it("tracks computed properties", () => {
    const observer = new DevtoolsObserver("localhost:3031", "test-app");
    mockWebSocket.onopen?.();

    class Store {
      count = 0;

      get double() {
        return this.count * 2;
      }

      increment() {
        this.count++;
      }
    }

    const store = reactive(new Store(), { observer });

    // Access computed property
    const _ = store.double;

    // Should have derived events
    const derivedEvents = sentMessages.filter((msg) => {
      return msg.message && msg.message.type === "derived";
    });
    expect(derivedEvents.length).toBeGreaterThan(0);
  });
});
