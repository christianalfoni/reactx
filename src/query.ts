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

function executeQuery<T>(query: Query<T>) {
  if (query[INTERNAL].internalState.current !== "IDLE") {
    query[INTERNAL].internalState.abortController.abort();
  }

  const abortController = new AbortController();

  query.isRevalidating = true;

  const observablePromise = createObservablePromise<T>(
    query[INTERNAL].fetcher(),
    abortController,
    (promise) => {
      if (promise.status === "fulfilled") {
        const value = promise.value;
        transaction(() => {
          Object.assign(query, {
            error: null,
            isFetching: false,
            promise,
            value,
            isRevalidating: false,
          });
        });
      } else {
        transaction(() => {
          Object.assign(query, {
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

  query[INTERNAL].internalState = {
    current: "ACTIVE",
    abortController,
  };

  return observablePromise;
}

const INTERNAL = Symbol("internal");

export class Query<T> {
  private [INTERNAL]: {
    fetcher: () => Promise<T>;
    subscriptionCount: number;
    internalState: InternalState<T>;
    lazy: boolean;
  };

  private state: QueryState<T>;

  constructor(fetcher: () => Promise<T>, lazy = false) {
    const blockingPromise = createBlockingPromise<T>();
    const initialInternalState: IdleInternalState<T> = {
      current: "IDLE",
      blockingPromise,
    };

    this[INTERNAL] = {
      fetcher,
      subscriptionCount: 0,
      lazy,
      internalState: initialInternalState,
    };
    this.state = observable({
      error: null,
      value: null,
      isRevalidating: false,
      isFetching: true,
      // We set a pending blocking promise as we can not set state during render
      promise: createPendingPromise(blockingPromise.promise),
    });

    // If not lazy, execute immediately
    if (!lazy) {
      initialInternalState.blockingPromise.resolve(executeQuery(this));
    }
  }

  get error() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
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
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
    }

    return this.state.value;
  }
  set value(newValue) {
    this.state.value = newValue;
  }
  get isFetching() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
    }

    return this.state.isFetching;
  }
  set isFetching(newValue) {
    this.state.isFetching = newValue;
  }
  get isRevalidating() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
    }

    return this.state.isRevalidating;
  }
  set isRevalidating(newValue) {
    this.state.isRevalidating = newValue;
  }
  get promise() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
    }

    return this.state.promise;
  }
  set promise(newValue) {
    this.state.promise = newValue;
  }
  fetch() {
    const promise = executeQuery(this);

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
    this[INTERNAL].subscriptionCount++;

    return () => {
      this[INTERNAL].subscriptionCount--;

      if (
        this[INTERNAL].subscriptionCount === 0 &&
        this[INTERNAL].internalState.current !== "IDLE"
      ) {
        this[INTERNAL].internalState.abortController.abort();
        this[INTERNAL].internalState = {
          current: "IDLE",
          blockingPromise: createBlockingPromise(),
        };

        Object.assign(this, {
          error: null,
          isFetching: true,
          promise: createPendingPromise(
            this[INTERNAL].internalState.blockingPromise.promise
          ),
          value: null,
          isRevalidating: false,
        });
      }
    };
  }

  revalidate(): Promise<T> {
    if (this[INTERNAL].internalState.current !== "ACTIVE") {
      const promise = executeQuery(this);

      this[INTERNAL].internalState.blockingPromise.resolve(promise);

      return this.promise;
    }

    return executeQuery(this);
  }
}

export function query<T>(
  fetcher: () => Promise<T>,
  options?: { lazy?: boolean }
) {
  return new Query(fetcher, options?.lazy) as Query<T> & QueryState<T>;
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
