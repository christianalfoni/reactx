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
  });

  // Test for object observation when adding or deleting keys
  it("notifies the observer when adding or deleting object keys", () => {
    const obj = reactive<Record<string, string>>({ existingKey: "value" });
    let addNotified = false;
    let deleteNotified = false;

    // Test adding a key
    const addObserver = new Observer();
    const untrackAdd = addObserver.track();
    // Access the object to register observation
    obj.existingKey;
    untrackAdd();

    addObserver.subscribe(() => {
      addNotified = true;
    });

    // Add a new key
    obj.newKey = "new value";
    expect(addNotified).toBe(true);
    expect(obj.newKey).toBe("new value");

    // Test deleting a key
    const deleteObserver = new Observer();
    const untrackDelete = deleteObserver.track();
    // Access the object to register observation
    obj.existingKey;
    untrackDelete();

    deleteObserver.subscribe(() => {
      deleteNotified = true;
    });

    // Delete a key
    delete obj.existingKey;
    expect(deleteNotified).toBe(true);
    expect(obj.existingKey).toBeUndefined();
  });

  // Test for array observation when mutating using functions or setting/deleting indexes
  it("notifies the observer when array mutates using functions or index operations", () => {
    const arr = reactive([1, 2, 3]);
    let methodNotified = false;
    let indexSetNotified = false;
    let indexDeleteNotified = false;

    // Test array mutation using methods
    const methodObserver = new Observer();
    const untrackMethod = methodObserver.track();
    // Access the array to register observation
    arr.length;
    untrackMethod();

    methodObserver.subscribe(() => {
      methodNotified = true;
    });

    // Mutate using array method
    arr.push(4);
    expect(methodNotified).toBe(true);
    expect(arr).toEqual([1, 2, 3, 4]);

    // Test setting an index
    const indexSetObserver = new Observer();
    const untrackIndexSet = indexSetObserver.track();
    // Access the array to register observation
    arr.length;
    untrackIndexSet();

    indexSetObserver.subscribe(() => {
      indexSetNotified = true;
    });

    // Set an index
    arr[0] = 100;
    expect(indexSetNotified).toBe(true);
    expect(arr[0]).toBe(100);

    // Test deleting an index
    const indexDeleteObserver = new Observer();
    const untrackIndexDelete = indexDeleteObserver.track();
    // Access the array to register observation
    arr.length;
    untrackIndexDelete();

    indexDeleteObserver.subscribe(() => {
      indexDeleteNotified = true;
    });

    // Delete an index
    delete arr[1];
    expect(indexDeleteNotified).toBe(true);
    expect(arr[1]).toBeUndefined();
  });

  // Tests for reference changes in readonly reactive state when nested mutations occur
  describe("readonly reference changes on nested mutations", () => {
    it("changes object references within readonly state when nested objects mutate", () => {
      // Setup: Create a nested structure with a readonly wrapper
      const nestedObj = reactive({ value: 1 });
      const outerObj = reactive({ nested: nestedObj });
      const readonlyOuter = reactive.readonly(outerObj);

      // Capture initial references
      const initialReadonlyOuter = readonlyOuter;
      const initialNestedRef = readonlyOuter.nested;

      // Mutate the nested object through its reactive reference
      nestedObj.value = 2;

      // Verify the readonly wrapper reference hasn't changed
      expect(readonlyOuter).toBe(initialReadonlyOuter);

      // Verify the nested object reference has changed in the readonly wrapper
      expect(readonlyOuter.nested).not.toBe(initialNestedRef);

      // Verify the value was actually updated
      expect(readonlyOuter.nested.value).toBe(2);
    });

    it("changes array references within readonly state when nested arrays mutate", () => {
      // Setup: Create a nested structure with a readonly wrapper
      const nestedArray = reactive([1, 2, 3]);
      const outerObj = reactive({ items: nestedArray });
      const readonlyOuter = reactive.readonly(outerObj);

      // Capture initial references
      const initialReadonlyOuter = readonlyOuter;
      const initialItemsRef = readonlyOuter.items;

      // Mutate the nested array through its reactive reference
      nestedArray.push(4);

      // Verify the readonly wrapper reference hasn't changed
      expect(readonlyOuter).toBe(initialReadonlyOuter);

      // Verify the nested array reference has changed in the readonly wrapper
      expect(readonlyOuter.items).not.toBe(initialItemsRef);

      // Verify the array was actually updated
      expect(readonlyOuter.items).toEqual([1, 2, 3, 4]);
    });

    it("changes nested object references when properties are added or deleted", () => {
      // Setup: Create a nested structure with a readonly wrapper
      const nestedObj = reactive<Record<string, any>>({ prop1: "value1" });
      const outerObj = reactive({ data: nestedObj });
      const readonlyOuter = reactive.readonly(outerObj);

      // Capture initial references
      const initialDataRef = readonlyOuter.data;

      // Add a property to the nested object
      nestedObj.prop2 = "value2";

      // Verify the nested object reference has changed
      expect(readonlyOuter.data).not.toBe(initialDataRef);
      expect(readonlyOuter.data.prop2).toBe("value2");

      // Capture the new reference
      const secondDataRef = readonlyOuter.data;

      // Delete a property from the nested object
      delete nestedObj.prop1;

      // Verify the nested object reference has changed again
      expect(readonlyOuter.data).not.toBe(secondDataRef);
      expect(readonlyOuter.data.prop1).toBeUndefined();
    });

    it("changes nested array references when using array methods or index operations", () => {
      // Setup: Create a nested structure with a readonly wrapper
      const nestedArray = reactive([1, 2, 3]);
      const outerObj = reactive({ list: nestedArray });
      const readonlyOuter = reactive.readonly(outerObj);

      // Capture initial reference
      const initialListRef = readonlyOuter.list;

      // Mutate using array method
      nestedArray.push(4);

      // Verify reference changed
      expect(readonlyOuter.list).not.toBe(initialListRef);
      expect(readonlyOuter.list).toEqual([1, 2, 3, 4]);

      // Capture new reference
      const secondListRef = readonlyOuter.list;

      // Mutate using index
      nestedArray[0] = 100;

      // Verify reference changed again
      expect(readonlyOuter.list).not.toBe(secondListRef);
      expect(readonlyOuter.list[0]).toBe(100);
    });
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
