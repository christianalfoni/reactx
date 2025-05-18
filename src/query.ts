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

        this.isRevalidating = true;

        const observablePromise = createObservablePromise<T>(
          this.fetcher(),
          abortController,
          (promise) => {
            if (promise.status === "fulfilled") {
              const value = promise.value;
              transaction(() => {
                Object.assign(this, {
                  error: null,
                  isFetching: false,
                  promise,
                  value,
                  isRevalidating: false,
                });
              });
            } else {
              transaction(() => {
                Object.assign(this, {
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
  set error(newValue) {
    this[PRIVATE].state.error = newValue;
  }
  get value() {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      this[PRIVATE].internalState.blockingPromise.resolve(
        this[PRIVATE].executeQuery()
      );
    }

    return this[PRIVATE].state.value;
  }
  set value(newValue) {
    this[PRIVATE].state.value = newValue;
  }
  get isFetching() {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      this[PRIVATE].internalState.blockingPromise.resolve(
        this[PRIVATE].executeQuery()
      );
    }

    return this[PRIVATE].state.isFetching;
  }
  set isFetching(newValue) {
    this[PRIVATE].state.isFetching = newValue;
  }
  get isRevalidating() {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      this[PRIVATE].internalState.blockingPromise.resolve(
        this[PRIVATE].executeQuery()
      );
    }

    return this[PRIVATE].state.isRevalidating;
  }
  set isRevalidating(newValue) {
    this[PRIVATE].state.isRevalidating = newValue;
  }
  get promise() {
    if (this[PRIVATE].internalState.current !== "ACTIVE") {
      this[PRIVATE].internalState.blockingPromise.resolve(
        this[PRIVATE].executeQuery()
      );
    }

    return this[PRIVATE].state.promise;
  }
  set promise(newValue) {
    this[PRIVATE].state.promise = newValue;
  }
  fetch() {
    const promise = this[PRIVATE].executeQuery();

    transaction(() => {
      Object.assign(this, {
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

        Object.assign(this, {
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

      return this.promise;
    }

    return this[PRIVATE].executeQuery();
  }
}

export function query<T>(fetcher: () => Promise<T>): Query<T> {
  return new Query(fetcher);
}

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
