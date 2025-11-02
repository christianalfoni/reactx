import { observable, transaction } from "mobx";
import {
  SuspensePromise,
  createPendingPromise,
  createObservablePromise,
} from "./query";

type BlockingPromise<T> = {
  promise: Promise<T>;
  resolve: (value: Promise<T>) => void;
};

type IdleInternalState<T> = {
  current: "IDLE";
  blockingPromise: BlockingPromise<T>;
};

type ActiveInternalState = {
  current: "ACTIVE";
};

type InternalState<T> = ActiveInternalState | IdleInternalState<T>;

export type AsyncState<T> =
  | {
      promise: SuspensePromise<T>;
      error: null;
      value: null;
      isPending: true;
    }
  | {
      promise: SuspensePromise<T>;
      error: Error;
      value: null;
      isPending: false;
    }
  | {
      promise: SuspensePromise<T>;
      error: null;
      value: T;
      isPending: false;
    };

// We need to use a blocking promise for the initial fetch, as we can
// not change the state during render. It will be resolved when the
// async is accessed during IDLE
function createBlockingPromise<T>() {
  let resolve!: (value: Promise<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return {
    promise,
    resolve,
  };
}

function executeAsync<T>(async: Async<T>) {
  // Only execute if still in IDLE state
  if (async[INTERNAL].internalState.current !== "IDLE") {
    return async.promise;
  }

  const observablePromise = createObservablePromise<T>(
    async[INTERNAL].fetcher(),
    new AbortController(), // Dummy controller, not used for abort
    (promise) => {
      if (promise.status === "fulfilled") {
        const value = promise.value;
        transaction(() => {
          Object.assign(async, {
            error: null,
            isPending: false,
            promise,
            value,
          });
        });
      } else {
        transaction(() => {
          Object.assign(async, {
            error: promise.reason,
            isPending: false,
            promise,
            value: null,
          });
        });
      }
    }
  );

  async[INTERNAL].internalState = {
    current: "ACTIVE",
  };

  return observablePromise;
}

const INTERNAL = Symbol("internal");

export class Async<T> {
  private [INTERNAL]: {
    fetcher: () => Promise<T>;
    internalState: InternalState<T>;
    lazy: boolean;
  };

  private state: AsyncState<T>;

  constructor(fetcher: () => Promise<T>, lazy = false) {
    const blockingPromise = createBlockingPromise<T>();
    const initialInternalState: IdleInternalState<T> = {
      current: "IDLE",
      blockingPromise,
    };

    this[INTERNAL] = {
      fetcher,
      lazy,
      internalState: initialInternalState,
    };

    this.state = observable({
      error: null,
      value: null,
      isPending: true,
      // We set a pending blocking promise as we can not set state during render
      promise: createPendingPromise(blockingPromise.promise),
    });

    // If not lazy, execute immediately
    if (!lazy) {
      initialInternalState.blockingPromise.resolve(executeAsync(this));
    }
  }

  get error() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeAsync(this));
    }

    return this.state.error;
  }
  set error(newValue) {
    this.state.error = newValue;
  }

  get value() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeAsync(this));
    }

    return this.state.value;
  }
  set value(newValue) {
    this.state.value = newValue;
  }

  get isPending() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeAsync(this));
    }

    return this.state.isPending;
  }
  set isPending(newValue) {
    this.state.isPending = newValue;
  }

  get promise() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeAsync(this));
    }

    return this.state.promise;
  }
  set promise(newValue) {
    this.state.promise = newValue;
  }
}

export function async<T>(
  fetcher: () => Promise<T>,
  options?: { lazy?: boolean }
) {
  return new Async(fetcher, options?.lazy) as Async<T> & AsyncState<T>;
}
