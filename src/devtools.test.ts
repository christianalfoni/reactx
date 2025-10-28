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

    // Send a test event
    observer.onEvent({
      type: "state",
      data: {
        path: ["count"],
        value: 1,
        isMutation: false,
      },
    });

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
      type: "state",
      data: { path: ["test"], value: 1, isMutation: false },
    });

    observer.onEvent({
      type: "action:start",
      data: {
        actionId: "test-1",
        executionId: "exec-1",
        actionName: "test",
        path: [],
        value: [],
      },
    });

    observer.onEvent({
      type: "action:end",
      data: { actionId: "test-1", executionId: "exec-1" },
    });

    // Should have sent messages for these events
    expect(sentMessages.length).toBeGreaterThan(initialCount);

    // Verify the observer doesn't crash with any event type
    expect(() => {
      observer.onEvent({
        type: "mutation",
        data: {} as any,
      });
      observer.onEvent({
        type: "derived",
        data: {} as any,
      });
      observer.onEvent({
        type: "operator:start",
        data: {} as any,
      });
      observer.onEvent({
        type: "operator:end",
        data: {} as any,
      });
      observer.onEvent({
        type: "effect",
        data: {} as any,
      });
    }).not.toThrow();
  });

  it("buffers messages when not connected", () => {
    const observer = new DevtoolsObserver("localhost:3031", "test-app");

    // Don't trigger connection - send messages while disconnected
    observer.onEvent({
      type: "state",
      data: {
        path: ["count"],
        value: 1,
        isMutation: false,
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
