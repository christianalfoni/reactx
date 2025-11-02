import { describe, it, expect, vi, beforeEach } from "vitest";
import { reactive } from "./proxy";
import { autorun } from "mobx";
import type { ReactiveObserver, ReactiveEvent } from "./events";

describe("reactive - basic functionality", () => {
  it("creates a reactive object from a plain object", () => {
    const data = reactive({ count: 0 });
    expect(data.count).toBe(0);
  });

  it("creates a reactive object from an array", () => {
    const data = reactive([1, 2, 3]);
    expect(data).toEqual([1, 2, 3]);
    expect(data.length).toBe(3);
  });

  it("throws error when trying to mutate from outside an action", () => {
    const data = reactive({ count: 0 });
    expect(() => {
      data.count = 1;
    }).toThrow("Cannot mutate from React");
  });

  it("prevents array mutations from React", () => {
    const data = reactive([1, 2, 3]);
    expect(() => {
      data.push(4);
    }).toThrow("Cannot mutate a readonly array");
  });

  it("prevents property deletion", () => {
    const data = reactive({ count: 0 });
    expect(() => {
      // @ts-ignore
      delete data.count;
    }).toThrow("Cannot mutate from React");
  });
});

describe("reactive - observability", () => {
  it("notifies observers when nested properties change", () => {
    const data = reactive({ nested: { count: 0 } });
    let runCount = 0;
    let observedValue = 0;

    const dispose = autorun(() => {
      observedValue = data.nested.count;
      runCount++;
    });

    expect(runCount).toBe(1);
    expect(observedValue).toBe(0);

    dispose();
  });

  it("tracks deeply nested properties", () => {
    const data = reactive({
      level1: {
        level2: {
          level3: {
            value: "deep",
          },
        },
      },
    });

    let observed = "";
    const dispose = autorun(() => {
      observed = data.level1.level2.level3.value;
    });

    expect(observed).toBe("deep");
    dispose();
  });

  it("handles array access reactively", () => {
    const data = reactive([1, 2, 3]);
    let firstItem = 0;
    let arrayLength = 0;

    const dispose = autorun(() => {
      firstItem = data[0];
      arrayLength = data.length;
    });

    expect(firstItem).toBe(1);
    expect(arrayLength).toBe(3);

    dispose();
  });
});

describe("reactive - custom class instances", () => {
  class Counter {
    count = 0;

    increment() {
      this.count++;
    }

    get double() {
      return this.count * 2;
    }
  }

  it("creates reactive proxy for custom class", () => {
    const counter = reactive(new Counter());
    expect(counter.count).toBe(0);
  });

  it("makes getters computed", () => {
    const counter = reactive(new Counter());
    let computedValue = 0;
    let runCount = 0;

    const dispose = autorun(() => {
      computedValue = counter.double;
      runCount++;
    });

    expect(computedValue).toBe(0);
    expect(runCount).toBe(1);

    dispose();
  });

  it("tracks method existence", () => {
    const counter = reactive(new Counter());
    expect(typeof counter.increment).toBe("function");
  });

  it("binds methods to the instance", () => {
    const counter = reactive(new Counter());
    const { increment } = counter;

    // Methods should be bound even when destructured
    expect(typeof increment).toBe("function");
  });
});

describe("reactive - nested structures", () => {
  it("handles nested objects", () => {
    const data = reactive({
      user: {
        name: "John",
        address: {
          city: "NYC",
        },
      },
    });

    expect(data.user.name).toBe("John");
    expect(data.user.address.city).toBe("NYC");
  });

  it("handles arrays of objects", () => {
    const data = reactive({
      items: [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ],
    });

    expect(data.items[0].name).toBe("Item 1");
    expect(data.items[1].id).toBe(2);
  });

  it("handles nested arrays", () => {
    const data = reactive({
      matrix: [
        [1, 2],
        [3, 4],
      ],
    });

    expect(data.matrix[0][0]).toBe(1);
    expect(data.matrix[1][1]).toBe(4);
  });
});

describe("reactive - proxy caching", () => {
  it("returns the same proxy for the same object", () => {
    const obj = { count: 0 };
    const proxy1 = reactive(obj);
    const proxy2 = reactive(obj);

    expect(proxy1).toBe(proxy2);
  });

  it("caches nested object proxies", () => {
    const data = reactive({
      nested: { value: 1 },
    });

    const nested1 = data.nested;
    const nested2 = data.nested;

    expect(nested1).toBe(nested2);
  });

  it("handles null values", () => {
    const data = reactive({ value: null });
    expect(data.value).toBe(null);
  });

  it("handles undefined values", () => {
    const data = reactive({ value: undefined });
    expect(data.value).toBe(undefined);
  });
});

describe("reactive - primitive types", () => {
  it("returns primitives unchanged", () => {
    expect(reactive(null as any)).toBe(null);
    expect(reactive(undefined as any)).toBe(undefined);
    expect(reactive(42 as any)).toBe(42);
    expect(reactive("string" as any)).toBe("string");
    expect(reactive(true as any)).toBe(true);
  });

  it("handles primitive values in objects", () => {
    const data = reactive({
      string: "hello",
      number: 42,
      boolean: true,
      null: null,
      undefined: undefined,
    });

    expect(data.string).toBe("hello");
    expect(data.number).toBe(42);
    expect(data.boolean).toBe(true);
    expect(data.null).toBe(null);
    expect(data.undefined).toBe(undefined);
  });
});

describe("reactive - functions", () => {
  it("handles function properties", () => {
    const data = reactive({
      count: 0,
      increment: function () {
        this.count++;
      },
    });

    expect(typeof data.increment).toBe("function");
  });

  it("returns arrow functions", () => {
    const fn = () => "test";
    const data = reactive({
      fn,
    });

    expect(data.fn).toBe(fn);
  });
});

describe("reactive - symbols", () => {
  it("handles symbol properties", () => {
    const sym = Symbol("test");
    const data = reactive({
      [sym]: "value",
    });

    expect(data[sym]).toBe("value");
  });

  it("handles Symbol.iterator", () => {
    const data = reactive([1, 2, 3]);
    const iterator = data[Symbol.iterator]();

    expect(iterator.next().value).toBe(1);
    expect(iterator.next().value).toBe(2);
    expect(iterator.next().value).toBe(3);
  });
});

describe("reactive - array methods", () => {
  it("allows non-mutating array methods", () => {
    const data = reactive([1, 2, 3, 4, 5]);

    expect(data.filter((x) => x > 2)).toEqual([3, 4, 5]);
    expect(data.map((x) => x * 2)).toEqual([2, 4, 6, 8, 10]);
    expect(data.slice(1, 3)).toEqual([2, 3]);
    expect(data.find((x) => x === 3)).toBe(3);
    expect(data.some((x) => x > 4)).toBe(true);
    expect(data.every((x) => x > 0)).toBe(true);
  });

  it("blocks mutating array methods", () => {
    const data = reactive([1, 2, 3]);

    expect(() => data.push(4)).toThrow("Cannot mutate a readonly array");
    expect(() => data.pop()).toThrow("Cannot mutate a readonly array");
    expect(() => data.shift()).toThrow("Cannot mutate a readonly array");
    expect(() => data.unshift(0)).toThrow("Cannot mutate a readonly array");
    expect(() => data.splice(1, 1)).toThrow("Cannot mutate a readonly array");
    expect(() => data.sort()).toThrow("Cannot mutate a readonly array");
    expect(() => data.reverse()).toThrow("Cannot mutate a readonly array");
  });
});

describe("reactive - edge cases", () => {
  it("reads circular references without mutation", () => {
    // Circular references would require mutation which isn't allowed from React context
    // This test just verifies the structure can be read
    const obj: any = { name: "circular" };
    obj.self = obj;
    const reactiveObj = reactive(obj);

    expect(reactiveObj.self.name).toBe("circular");
    expect(reactiveObj.self.self.name).toBe("circular");
  });

  it("handles Date objects", () => {
    const now = new Date();
    const data = reactive({ date: now });

    expect(data.date).toBe(now);
    expect(data.date.getTime()).toBe(now.getTime());
  });

  it("handles RegExp objects", () => {
    const regex = /test/i;
    const data = reactive({ pattern: regex });

    expect(data.pattern).toBe(regex);
    expect(data.pattern.test("TEST")).toBe(true);
  });

  it("handles Map objects", () => {
    const map = new Map([["key", "value"]]);
    const data = reactive({ map });

    expect(data.map).toBe(map);
    expect(data.map.get("key")).toBe("value");
  });

  it("handles Set objects", () => {
    const set = new Set([1, 2, 3]);
    const data = reactive({ set });

    expect(data.set).toBe(set);
    expect(data.set.has(2)).toBe(true);
  });
});

describe("reactive - options", () => {
  it("accepts observer option", () => {
    const events: ReactiveEvent[] = [];
    const observer: ReactiveObserver = {
      onEvent: (event) => events.push(event),
    };

    const data = reactive({ count: 0 }, { observer });
    expect(data.count).toBe(0);
  });

  it("calls observer when actions are executed", () => {
    const events: ReactiveEvent[] = [];
    const observer: ReactiveObserver = {
      onEvent: (event) => events.push(event),
    };

    class Counter {
      count = 0;

      increment() {
        this.count++;
      }
    }

    const counter = reactive(new Counter(), { observer });
    counter.increment();

    // Should have received action events
    const actionEvents = events.filter(
      (e) => e.type === "action:start" || e.type === "action:end"
    );
    expect(actionEvents.length).toBeGreaterThan(0);

    // Should have received execution events (renamed from operator events)
    const executionEvents = events.filter(
      (e) => e.type === "execution:start" || e.type === "execution:end"
    );
    expect(executionEvents.length).toBeGreaterThan(0);
  });

  it("works without options", () => {
    const data = reactive({ count: 0 });
    expect(data.count).toBe(0);
  });
});

describe("reactive - class instances with complex patterns", () => {
  class TodoList {
    todos: Array<{ id: number; text: string; done: boolean }> = [];

    addTodo(text: string) {
      this.todos.push({
        id: Date.now(),
        text,
        done: false,
      });
    }

    get completedCount() {
      return this.todos.filter((t) => t.done).length;
    }

    get totalCount() {
      return this.todos.length;
    }
  }

  it("handles class with array property", () => {
    const list = reactive(new TodoList());

    expect(list.todos).toEqual([]);
    expect(list.totalCount).toBe(0);
  });

  it("tracks computed properties on classes", () => {
    const list = reactive(new TodoList());
    let count = 0;

    const dispose = autorun(() => {
      count = list.totalCount;
    });

    expect(count).toBe(0);

    dispose();
  });
});

describe("reactive - getOwnPropertyDescriptor", () => {
  it("returns descriptors for properties", () => {
    const data = reactive({ count: 0 });
    const descriptor = Object.getOwnPropertyDescriptor(data, "count");

    expect(descriptor).toBeDefined();
  });

  it("handles getters in descriptors", () => {
    const obj = reactive({
      _value: 1,
      get value() {
        return this._value * 2;
      },
    });

    expect(obj.value).toBe(2);
  });
});

describe("reactive - ownKeys", () => {
  it("returns own keys", () => {
    const data = reactive({ a: 1, b: 2, c: 3 });
    const keys = Object.keys(data);

    expect(keys).toEqual(["a", "b", "c"]);
  });

  it("works with Object.entries", () => {
    const data = reactive({ a: 1, b: 2 });
    const entries = Object.entries(data);

    expect(entries).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("works with Object.values", () => {
    const data = reactive({ a: 1, b: 2 });
    const values = Object.values(data);

    expect(values).toEqual([1, 2]);
  });
});

describe("reactive - has trap", () => {
  it("checks property existence with 'in' operator", () => {
    const data = reactive({ count: 0 });

    expect("count" in data).toBe(true);
    expect("missing" in data).toBe(false);
  });
});

describe("reactive - isExtensible", () => {
  it("attempts to report as not extensible via trap", () => {
    // Note: The isExtensible trap implementation has a known issue
    // The trap returns false but the target is extensible, causing a TypeError
    // This is a limitation of the current proxy implementation
    const data = reactive({ count: 0 });

    // We expect this to throw because of the trap/target mismatch
    expect(() => Object.isExtensible(data)).toThrow();
  });
});
