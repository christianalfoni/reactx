import { observable, transaction } from "mobx";

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
  abortController: AbortController;
};

type InternalState<T> = ActiveInternalState | IdleInternalState<T>;

export type QueryState<T> =
  | {
      promise: SuspensePromise<T>;
      error: null;
      value: null;
      isRevalidating: false;
      isFetching: true;
    }
  | {
      promise: SuspensePromise<T>;
      error: Error;
      value: null;
      isRevalidating: false;
      isFetching: false;
    }
  | {
      promise: SuspensePromise<T>;
      error: null;
      value: T;
      isRevalidating: false;
      isFetching: false;
    }
  | {
      promise: SuspensePromise<T>;
      error: null;
      value: T;
      isRevalidating: true;
      isFetching: false;
    };

// We need to use a blocking promise for the initial fetch, as we can
// not change the state during render. It will be resolved when the
// query is accessed during IDLE
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

const PRIVATE = Symbol("PRIVATE");

export class Query<T> {
  private [PRIVATE]: {
    fetcher: () => Promise<T>;
    executeQuery: () => Promise<T>;
    blockingPromise: BlockingPromise<T>;
    subscriptionCount: number;
    internalState: InternalState<T>;
    state: QueryState<T>;
  };

  constructor(private fetcher: () => Promise<T>) {
    const blockingPromise = createBlockingPromise<T>();
    this[PRIVATE] = {
      fetcher,
      blockingPromise,
      subscriptionCount: 0,
      internalState: {
        current: "IDLE",
        blockingPromise,
      },
      state: observable({
        error: null,
        value: null,
        isRevalidating: false,
        isFetching: true,
        // We set a pending blocking promise as we can not set state during render
        promise: createPendingPromise(blockingPromise.promise),
      }),
      executeQuery: () => {
        if (this[PRIVATE].internalState.current !== "IDLE") {
          this[PRIVATE].internalState.abortController.abort();
        }

        const abortController = new AbortController();

        this[PRIVATE].state.isRevalidating = true;

        const observablePromise = createObservablePromise<T>(
          this.fetcher(),
          abortController,
          (promise) => {
            if (promise.status === "fulfilled") {
              const value = promise.value;
              transaction(() => {
                Object.assign(this[PRIVATE].state, {
                  error: null,
                  isFetching: false,
                  promise,
                  value,
                  isRevalidating: false,
                });
              });
            } else {
              transaction(() => {
                Object.assign(this[PRIVATE].state, {
                  error: promise.reason,
                  isFetching: false,
                  promise,
                  isRevalidating: false,
                  value: null,
                });
              });
            }
          }
        );

        this[PRIVATE].internalState = {
          current: "ACTIVE",
          abortController,
        };

        return observablePromise;
      },
    };
  }

  get error() {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      this[PRIVATE].internalState.blockingPromise.resolve(
        this[PRIVATE].executeQuery()
      );
    }

    return this[PRIVATE].state.error;
  }
  get value() {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      this[PRIVATE].internalState.blockingPromise.resolve(
        this[PRIVATE].executeQuery()
      );
    }

    return this[PRIVATE].state.value;
  }
  get isFetching() {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      this[PRIVATE].internalState.blockingPromise.resolve(
        this[PRIVATE].executeQuery()
      );
    }

    return this[PRIVATE].state.isFetching;
  }
  get isRevalidating() {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      this[PRIVATE].internalState.blockingPromise.resolve(
        this[PRIVATE].executeQuery()
      );
    }

    return this[PRIVATE].state.isRevalidating;
  }
  get promise() {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      this[PRIVATE].internalState.blockingPromise.resolve(
        this[PRIVATE].executeQuery()
      );
    }

    return this[PRIVATE].state.promise;
  }
  fetch() {
    const promise = this[PRIVATE].executeQuery();

    transaction(() => {
      Object.assign(this[PRIVATE].state, {
        isFetching: true,
        isRevalidating: false,
        promise,
        value: null,
        error: null,
      });
    });

    return promise;
  }
  subscribe() {
    this[PRIVATE].subscriptionCount++;

    return () => {
      this[PRIVATE].subscriptionCount--;

      if (
        this[PRIVATE].subscriptionCount === 0 &&
        this[PRIVATE].internalState.current !== "IDLE"
      ) {
        this[PRIVATE].internalState.abortController.abort();
        this[PRIVATE].internalState = {
          current: "IDLE",
          blockingPromise: createBlockingPromise(),
        };

        Object.assign(this[PRIVATE].state, {
          error: null,
          isFetching: true,
          promise: createPendingPromise(
            this[PRIVATE].internalState.blockingPromise.promise
          ),
          value: null,
          isRevalidating: false,
        });
      }
    };
  }

  revalidate(): Promise<T> {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      const promise = this[PRIVATE].executeQuery();

      this[PRIVATE].internalState.blockingPromise.resolve(promise);

      return this[PRIVATE].state.promise;
    }

    return this[PRIVATE].executeQuery();
  }
}

export function query<T>(fetcher: () => Promise<T>): Query<T> {
  return new Query(fetcher);
}

/*
export function query<T>(fetcher: () => Promise<T>): Query<T> {
  let subscriptionCount = 0;
  let internalState: InternalState<T> = {
    current: "IDLE",
    blockingPromise: createBlockingPromise(),
  };
  const state = observable<QueryState<T>>({
    error: null,
    value: null,
    isRevalidating: false,
    isFetching: true,
    // We set a pending blocking promise as we can not set state during render
    promise: createPendingPromise(internalState.blockingPromise.promise),
  });

  const queryState = observable({
    get error() {
      if (internalState.current !== "ACTIVE") {
        internalState.blockingPromise.resolve(executeQuery());
      }

      return state.error;
    },
    get value() {
      if (internalState.current !== "ACTIVE") {
        internalState.blockingPromise.resolve(executeQuery());
      }

      return state.value;
    },
    get isFetching() {
      if (internalState.current !== "ACTIVE") {
        internalState.blockingPromise.resolve(executeQuery());
      }

      return state.isFetching;
    },
    get isRevalidating() {
      if (internalState.current !== "ACTIVE") {
        internalState.blockingPromise.resolve(executeQuery());
      }

      return state.isRevalidating;
    },
    get promise() {
      if (internalState.current !== "ACTIVE") {
        internalState.blockingPromise.resolve(executeQuery());
      }

      return state.promise;
    },
    fetch,
    revalidate,
    subscribe,
  });

  return queryState as Query<T>;

  function fetch() {
    const promise = executeQuery();

    transaction(() => {
      Object.assign(state, {
        isFetching: true,
        isRevalidating: false,
        promise,
        value: null,
        error: null,
      });
    });

    return promise;
  }

  function subscribe() {
    subscriptionCount++;

    return () => {
      subscriptionCount--;

      if (subscriptionCount === 0 && internalState.current !== "IDLE") {
        internalState.abortController.abort();
        internalState = {
          current: "IDLE",
          blockingPromise: createBlockingPromise(),
        };

        Object.assign(state, {
          error: null,
          isFetching: true,
          promise: createPendingPromise(internalState.blockingPromise.promise),
          value: null,
          isRevalidating: false,
        });
      }
    };
  }

  function executeQuery() {
    if (internalState.current !== "IDLE") {
      internalState.abortController.abort();
    }

    const abortController = new AbortController();

    state.isRevalidating = true;

    const observablePromise = createObservablePromise<T>(
      fetcher(),
      abortController,
      (promise) => {
        if (promise.status === "fulfilled") {
          const value = promise.value;
          transaction(() => {
            Object.assign(state, {
              error: null,
              isFetching: false,
              promise,
              value,
              isRevalidating: false,
            });
          });
        } else {
          transaction(() => {
            Object.assign(state, {
              error: promise.reason,
              isFetching: false,
              promise,
              isRevalidating: false,
              value: null,
            });
          });
        }
      }
    );

    internalState = {
      current: "ACTIVE",
      abortController,
    };

    return observablePromise;
  }

  function revalidate(): Promise<T> {
    if (internalState.current !== "ACTIVE") {
      const promise = executeQuery();

      internalState.blockingPromise.resolve(promise);

      return state.promise;
    }

    return executeQuery();
  }
}

*/

type PendingPromise<T> = Promise<T> & {
  status: "pending";
};

type FulfilledPromise<T> = Promise<T> & {
  status: "fulfilled";
  value: T;
};

type RejectedPromise<T> = Promise<T> & {
  status: "rejected";
  reason: Error;
};

export type SuspensePromise<T> =
  | PendingPromise<T>
  | FulfilledPromise<T>
  | RejectedPromise<T>;

export function createPendingPromise<T>(
  promise: Promise<T>
): PendingPromise<T> {
  return Object.assign(promise, {
    status: "pending" as const,
  });
}

export function createFulfilledPromise<T>(
  promise: Promise<T>,
  value: T
): FulfilledPromise<T> {
  return Object.assign(promise, {
    status: "fulfilled" as const,
    value,
  });
}

export function createRejectedPromise<T>(
  promise: Promise<T>,
  reason: Error
): RejectedPromise<T> {
  return Object.assign(promise, {
    status: "rejected" as const,
    reason,
  });
}

// This is responsible for creating the observable promise by
// handling the resolved and rejected state of the initial promise and
// notifying
export function createObservablePromise<T>(
  promise: Promise<any>,
  abortController: AbortController,
  onSettled: (promise: FulfilledPromise<T> | RejectedPromise<T>) => void
): SuspensePromise<T> {
  const observablePromise = createPendingPromise(
    promise
      .then(function (resolvedValue) {
        if (abortController.signal.aborted) {
          return;
        }

        onSettled(
          createFulfilledPromise(Promise.resolve(resolvedValue), resolvedValue)
        );

        return resolvedValue;
      })
      .catch((rejectedReason) => {
        if (abortController.signal.aborted) {
          return;
        }

        const rejectedPromise = Promise.reject(rejectedReason);

        onSettled(createRejectedPromise(rejectedPromise, rejectedReason));

        return rejectedPromise;
      })
  );

  observablePromise.catch(() => {
    // When consuming a promise form a signal we do not consider it an unhandled promise anymore.
    // This catch prevents the browser from identifying it as unhandled, but will still be a rejected
    // promise if you try to consume it
  });

  return observablePromise;
}
