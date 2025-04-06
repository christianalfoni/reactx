import { transaction } from "mobx";
import { reactive } from ".";

type IdleInternalState = {
  current: "IDLE";
};

type ActiveInternalState = {
  current: "ACTIVE";
  abortController: AbortController;
};

type ExpiredInternalState = {
  current: "EXPIRED";
  abortController: AbortController;
};

type InternalState =
  | ActiveInternalState
  | IdleInternalState
  | ExpiredInternalState;

function unwrapGetter(value: unknown) {
  return typeof value === "function" ? value() : value;
}

type BaseQuery<T> = {
  revalidate: () => Promise<T>;
  fetch: () => Promise<T>;
  subscribe: (subscription: () => void) => () => void;
};

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

type Query<T> = BaseQuery<T> & QueryState<T>;

export function query<T>(fetcher: () => Promise<T>): Query<T>;
export function query<T, O>(
  fetcher: () => Promise<T>,
  setter: (data: T) => () => O
): Query<O>;
export function query<T, O>(
  fetcher: () => Promise<T>,
  setter?: (data: T) => () => O
): Query<T> | Query<O> {
  const subscriptions = new Set<() => void>();
  let internalState: InternalState = { current: "IDLE" };
  const state = reactive<QueryState<T>>({
    error: null,
    value: null,
    isRevalidating: false,
    isFetching: true,
    // This will be set when any of the state is accessed
    promise: null as unknown as SuspensePromise<T>,
  });

  const queryState = reactive({
    get error() {
      if (internalState.current !== "ACTIVE") {
        fetch();
      }

      return state.error;
    },
    get value() {
      if (internalState.current !== "ACTIVE") {
        fetch();
      }

      return state.value;
    },
    get isFetching() {
      if (internalState.current !== "ACTIVE") {
        fetch();
      }

      return state.isFetching;
    },
    get isRevalidating() {
      if (internalState.current !== "ACTIVE") {
        fetch();
      }

      return state.isRevalidating;
    },
    get promise() {
      if (internalState.current !== "ACTIVE") {
        fetch();
      }

      if (!setter) {
        return state.promise;
      }

      switch (state.promise.status) {
        case "fulfilled":
          return createFulfilledPromise(
            state.promise.then(unwrapGetter),
            unwrapGetter(state.promise.value)
          );
        case "pending": {
          return createPendingPromise(state.promise.then(unwrapGetter));
        }
        case "rejected": {
          return state.promise;
        }
      }
    },
    fetch,
    revalidate,
    subscribe,
  });

  return queryState as Query<T>;

  function subscribe(subscription: () => void) {
    if (internalState.current === "IDLE") {
      throw new Error("You can not subscribe to a state is not active");
    }

    internalState.current = "ACTIVE";

    subscriptions.add(subscription);

    return () => {
      subscriptions.delete(subscription);

      if (subscriptions.size === 0) {
        internalState.current = "EXPIRED";
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
      fetcher().then((data) => (setter ? setter(data) : data)),
      abortController,
      (promise) => {
        if (promise.status === "fulfilled") {
          const value = promise.value;
          transaction(() => {
            Object.assign(state, {
              error: null,
              isFetching: false,
              promise,
              get value() {
                return unwrapGetter(value);
              },
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

  function fetch() {
    const promise = executeQuery();

    transaction(() => {
      Object.assign(state, {
        isFetching: true,
        isRevalidating: false,
        promise,
        value: null,
      });
    });

    return promise;
  }

  function revalidate(): Promise<T> {
    if (internalState.current !== "ACTIVE") {
      return fetch();
    }

    return executeQuery();
  }
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
    get value() {
      return unwrapGetter(value);
    },
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
