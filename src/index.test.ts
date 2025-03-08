import { describe, it, expect } from "vitest";
import { reactive } from ".";
import { Observer } from "./observer";

describe("reactive", () => {
  it("notifies the observer on property change", () => {
    // Create a reactive object.
    const data = reactive({ value: 1 });
    let notified = false;

    // Create an observer that sets notified flag.
    const observer = new Observer();

    // Start observing and register dependency by accessing property.
    const untrack = observer.track();
    // register observation...
    data.value;
    // Stop observing.
    untrack();

    observer.subscribe(() => {
      notified = true;
    });

    // When setting property observer should be notified.
    data.value = 2;

    expect(notified).toBe(true);
  });
});

describe("reactive - array mutations", () => {
  it("notifies the observer on array mutation", () => {
    const arr = reactive<number[]>([]);
    let notified = false;

    const observer = new Observer();

    const untrack = observer.track();
    // Trigger observation by accessing the array.
    arr.length;

    untrack();

    observer.subscribe(() => {
      notified = true;
    });

    // Mutate the array.
    arr.push(42);

    expect(notified).toBe(true);
  });
});

// New tests for nested tracking
describe("reactive - nested tracking", () => {
  it("notifies the observer on nested property change", () => {
    const data = reactive({ nested: { value: 1 } });
    let notified = false;

    const observer = new Observer();

    const untrack = observer.track();
    // Register observation on nested property
    data.nested.value;

    untrack();

    observer.subscribe(() => {
      notified = true;
    });

    // Change nested property's value
    data.nested.value = 2;

    expect(notified).toBe(true);
  });
});

// Tests for readonly functionality
describe("readonly", () => {
  it("prevents modification of object properties", () => {
    const data = reactive({ value: 1 });
    const readonlyData = reactive.readonly(data);

    expect(() => {
      readonlyData.value = 2;
    }).toThrow("Cannot mutate a readonly object");

    expect(readonlyData.value).toBe(1);
  });

  it("prevents array mutations", () => {
    const arr = reactive([1, 2, 3]);
    const readonlyArr = reactive.readonly(arr);

    expect(() => {
      readonlyArr.push(4);
    }).toThrow("Cannot mutate a readonly array");

    expect(() => {
      readonlyArr[0] = 10;
    }).toThrow("Cannot mutate a readonly array");

    expect(readonlyArr).toEqual([1, 2, 3]);
  });

  it("makes nested objects readonly", () => {
    const data = reactive({ nested: { value: 1 } });
    const readonlyData = reactive.readonly(data);

    expect(() => {
      readonlyData.nested.value = 2;
    }).toThrow("Cannot mutate a readonly object");

    expect(readonlyData.nested.value).toBe(1);
  });

  it("allows observing readonly objects", () => {
    const data = reactive({ value: 1 });
    const readonlyData = reactive.readonly(data);
    let notified = false;

    const observer = new Observer();

    const untrack = observer.track();
    // Read the value to register observation
    readonlyData.value;
    untrack();

    observer.subscribe(() => {
      notified = true;
    });

    // Attempt to modify (will throw but should not notify)
    try {
      readonlyData.value = 2;
    } catch (e) {
      // Expected error
    }

    expect(notified).toBe(false);
  });

  it("makes objects returned from getters readonly", () => {
    const original = reactive({
      items: [
        { id: 1, value: "one" },
        { id: 2, value: "two" },
      ],
      get firstItem() {
        return original.items[0];
      },
    });

    const readonlyObj = reactive.readonly(original);

    expect(() => {
      readonlyObj.firstItem.value = "modified";
    }).toThrow("Cannot mutate a readonly object");
  });
});

// Tests for nested reactive and readonly combinations
describe("reactive and readonly - nested combinations", () => {
  it("allows mutation and observation with reactive containing nested reactive", () => {
    const nested = reactive({ value: 1 });
    const outer = reactive({ nested });
    let notified = false;

    const observer = new Observer();

    const untrack = observer.track();
    // Access nested value to register observation
    outer.nested.value;
    untrack();

    observer.subscribe(() => {
      notified = true;
    });

    // Change nested reactive property through outer reference
    outer.nested.value = 2;

    expect(notified).toBe(true);
    expect(outer.nested.value).toBe(2);
    expect(nested.value).toBe(2); // Original nested object should also be updated
  });

  it("prevents mutation at all levels with readonly containing nested readonly", () => {
    const nested = reactive.readonly(reactive({ value: 1 }));
    const outer = reactive.readonly(reactive({ nested }));

    // Try to modify outer property
    expect(() => {
      outer.nested = reactive.readonly(reactive({ value: 2 }));
    }).toThrow("Cannot mutate a readonly object");

    // Try to modify nested property
    expect(() => {
      outer.nested.value = 2;
    }).toThrow("Cannot mutate a readonly object");

    expect(outer.nested.value).toBe(1); // Value should remain unchanged
  });

  it("prevents mutation at all levels with readonly containing nested reactive", () => {
    const nested = reactive({ value: 1 });
    const outer = reactive.readonly(reactive({ nested }));

    // Try to modify outer property
    expect(() => {
      outer.nested = reactive({ value: 2 });
    }).toThrow("Cannot mutate a readonly object");

    // Try to modify nested property - should also be readonly despite being originally reactive
    expect(() => {
      outer.nested.value = 2;
    }).toThrow("Cannot mutate a readonly object");

    expect(outer.nested.value).toBe(1); // Value should remain unchanged
    expect(nested.value).toBe(1); // Original nested object should remain unchanged
  });

  it("prevents mutation of readonly property inside reactive object", () => {
    const nested = reactive.readonly(reactive({ value: 1 }));
    const outer = reactive({ nested });

    // Can modify outer properties
    outer.nested = reactive.readonly(reactive({ value: 2 }));
    expect(outer.nested.value).toBe(2);

    // Cannot modify readonly nested properties
    expect(() => {
      outer.nested.value = 3;
    }).toThrow("Cannot mutate a readonly object");
  });

  it("allows observation of readonly nested in reactive", () => {
    const nested = reactive.readonly(reactive({ value: 1 }));
    const outer = reactive({ nested });
    let notified = false;

    const observer = new Observer();
    const untrack = observer.track();
    // Access nested value to register observation
    outer.nested.value;
    untrack();

    observer.subscribe(() => {
      notified = true;
    });

    // Replace the nested readonly with a new one
    outer.nested = reactive.readonly(reactive({ value: 2 }));

    expect(notified).toBe(true);
    expect(outer.nested.value).toBe(2);
  });

  it("allows observation of reactive nested in readonly through source object", () => {
    const nested = reactive({ value: 1 });
    const outer = reactive.readonly(reactive({ nested }));
    let notified = false;

    const observer = new Observer();
    const untrack = observer.track();
    // Access nested value to register observation
    outer.nested.value;
    untrack();

    observer.subscribe(() => {
      notified = true;
    });

    // Should not be able to modify through readonly reference
    expect(() => {
      outer.nested.value = 2;
    }).toThrow("Cannot mutate a readonly object");

    expect(notified).toBe(false);
  });
});
