import { describe, it, expect } from "vitest";
import { reactive, Observer, readonly } from ".";

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
    const readonlyData = readonly(data);

    expect(() => {
      readonlyData.value = 2;
    }).toThrow("Cannot mutate a readonly object");

    expect(readonlyData.value).toBe(1);
  });

  it("prevents array mutations", () => {
    const arr = reactive([1, 2, 3]);
    const readonlyArr = readonly(arr);

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
    const readonlyData = readonly(data);

    expect(() => {
      readonlyData.nested.value = 2;
    }).toThrow("Cannot mutate a readonly object");

    expect(readonlyData.nested.value).toBe(1);
  });

  it("allows observing readonly objects", () => {
    const data = reactive({ value: 1 });
    const readonlyData = readonly(data);
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

    const readonlyObj = readonly(original);

    expect(() => {
      readonlyObj.firstItem.value = "modified";
    }).toThrow("Cannot mutate a readonly object");
  });
});
