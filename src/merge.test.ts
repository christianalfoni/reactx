import { describe, it, expect } from "vitest";
import { reactive } from ".";
import { merge } from "./merge";
import { Observer } from "./observer";

describe("merge", () => {
  it("should merge properties from multiple objects", () => {
    const obj1 = { foo: 1 };
    const obj2 = { bar: 2 };

    const merged = merge(obj1, obj2);

    expect(merged.foo).toBe(1);
    expect(merged.bar).toBe(2);
  });

  it("should prioritize properties from objects earlier in the parameter list", () => {
    const obj1 = { common: "from obj1" };
    const obj2 = { common: "from obj2" };

    const merged = merge(obj1, obj2);

    expect(merged.common).toBe("from obj1");
  });

  it("should preserve 'this' context for methods", () => {
    const obj1 = {
      value: 10,
      getValue() {
        return this.value;
      },
    };
    const obj2 = { extra: 20 };

    const merged = merge(obj1, obj2);

    expect(merged.getValue()).toBe(10);
  });

  it("should work with reactive objects", () => {
    const obj1 = reactive({ count: 1 });
    const obj2 = reactive({ name: "test" });

    const merged = merge(obj1, obj2);

    expect(merged.count).toBe(1);
    expect(merged.name).toBe("test");

    // Change values in source objects
    obj1.count = 2;
    obj2.name = "updated";

    // Merged object should reflect those changes
    expect(merged.count).toBe(2);
    expect(merged.name).toBe("updated");
  });

  it("should notify observers when source object properties change", () => {
    const obj1 = reactive({ count: 1 });
    const obj2 = reactive({ name: "test" });

    const merged = merge(obj1, obj2);
    let notified = false;
    let notifiedValue: number | null = null;

    const observer = new Observer();

    const untrack = observer.track();
    // Access the property to register observation
    merged.count;
    untrack();

    observer.subscribe(() => {
      notified = true;
      notifiedValue = merged.count;
    });

    // Modify the source object
    obj1.count = 42;

    expect(notified).toBe(true);
    expect(notifiedValue).toBe(42);
  });

  it("should properly handle readonly objects", () => {
    const obj1 = reactive({ count: 1 });
    const readonlyObj1 = reactive.readonly(obj1);
    const obj2 = reactive({ name: "test" });

    const merged = merge(readonlyObj1, obj2);

    // Should be able to read properties from both
    expect(merged.count).toBe(1);
    expect(merged.name).toBe("test");

    // Should not be able to modify readonly properties
    expect(() => {
      merged.count = 2;
    }).toThrow("Cannot mutate");

    // Should be able to modify properties from non-readonly objects
    merged.name = "updated";
    expect(merged.name).toBe("updated");
  });

  it("should work with nested objects", () => {
    const obj1 = reactive({
      nested: { value: 1 },
    });
    const obj2 = reactive({
      other: { text: "hello" },
    });

    const merged = merge(obj1, obj2);

    expect(merged.nested.value).toBe(1);
    expect(merged.other.text).toBe("hello");

    // Change nested values
    obj1.nested.value = 42;
    obj2.other.text = "world";

    expect(merged.nested.value).toBe(42);
    expect(merged.other.text).toBe("world");
  });

  it("should handle mutation of nested objects within merged objects", () => {
    const obj1 = reactive({
      nested: { value: 1 },
    });
    const obj2 = reactive({
      other: { text: "hello" },
    });

    const merged = merge(obj1, obj2);
    let notified = false;

    const observer = new Observer();

    const untrack = observer.track();
    // Access the nested property to register observation
    merged.nested.value;
    untrack();

    observer.subscribe(() => {
      notified = true;
    });

    // Modify the nested object through the merged object
    merged.nested.value = 42;

    expect(notified).toBe(true);
    expect(merged.nested.value).toBe(42);
    // Original object should also be updated
    expect(obj1.nested.value).toBe(42);
  });

  it("should support Object.keys and similar operations", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { c: 3, d: 4 };

    const merged = merge(obj1, obj2);

    expect(Object.keys(merged).sort()).toEqual(["a", "b", "c", "d"]);
    expect("a" in merged).toBe(true);
    expect("z" in merged).toBe(false);
  });

  it("should create a fully readonly merged object when all sources are readonly", () => {
    const obj1 = reactive.readonly(reactive({ a: 1 }));
    const obj2 = reactive.readonly(reactive({ b: 2 }));

    const merged = merge(obj1, obj2);

    expect(() => {
      merged.a = 10;
    }).toThrow("Cannot mutate");

    expect(() => {
      merged.b = 20;
    }).toThrow("Cannot mutate");
  });
});
