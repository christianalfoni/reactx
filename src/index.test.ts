import { describe, it, expect } from "vitest";
import { reactive, Observer } from ".";

describe("observable", () => {
  it("notifies the observer on property change when active", () => {
    // Create an observable object.
    const data = reactive({ value: 1 });
    let notified = false;

    // Create an observer that sets notified flag.
    const observer = new Observer();

    observer.subscribe(() => {
      notified = true;
    });

    // Start observing and register dependency by accessing property.
    const untrack = observer.track();
    // ...existing code: register observation...
    data.value;
    // When setting property while still active, observer should be notified.
    data.value = 2;
    // Stop observing.
    untrack();

    expect(notified).toBe(true);
  });

  // ...existing tests...
});

describe("observable - array mutations", () => {
  it("notifies the observer on array mutation", () => {
    const arr = reactive<number[]>([]);
    let notified = false;

    const observer = new Observer();

    observer.subscribe(() => {
      notified = true;
    });

    const untrack = observer.track();
    // Trigger observation by accessing the array.
    arr.length;
    // Mutate the array.
    arr.push(42);
    untrack();

    expect(notified).toBe(true);
  });
});

// New tests for nested tracking
describe("observable - nested tracking", () => {
  it("notifies the observer on nested property change", () => {
    const data = reactive({ nested: { value: 1 } });
    let notified = false;

    const observer = new Observer();

    observer.subscribe(() => {
      notified = true;
    });

    const untrack = observer.track();
    // Register observation on nested property
    data.nested.value;
    // Change nested property's value
    data.nested.value = 2;
    untrack();

    expect(notified).toBe(true);
  });
});
