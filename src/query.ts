import { reactive } from ".";

type IdleInternalState = {
  current: "IDLE";
};

type ActiveInternalState<T> = {
  current: "ACTIVE";
  abortController: AbortController;
  promise: SuspensePromise<T>;
};

type InternalState<T> = ActiveInternalState<T> | IdleInternalState;

function unwrapGetter(value: unknown) {
  return typeof value === "function" ? value() : value;
}

export type QueryState<T> = {
  isRevalidating: boolean;
} & (
  | {
      status: "PENDING";
    }
  | {
      status: "RESOLVED";
      value: T;
    }
  | {
      status: "REJECTED";
      error: Error;
    }
);

type Query<T> = {
  state: QueryState<T>;
  promise: SuspensePromise<T>;
  revalidate: () => Promise<T>;
  fetch: () => Promise<T>;
};

export function query<T>(fetcher: () => Promise<T>): Query<T>;
export function query<T, O>(
  fetcher: () => Promise<T>,
  setter: (data: T) => () => O
): Query<O>;
export function query<T, O>(
  fetcher: () => Promise<T>,
  setter?: (data: T) => () => O
): Query<T> | Query<O> {
  const state = reactive<{ query: QueryState<T>; internal: InternalState<T> }>({
    query: {
      isRevalidating: false,
      status: "PENDING",
    },
    internal: {
      current: "IDLE",
    },
  });

  const queryState = reactive<Query<T>>({
    get state() {
      if (state.internal.current === "IDLE") {
        fetch();
      }

      return state.query;
    },
    set state(newState) {
      state.query = newState;
    },
    get promise() {
      const internalState =
        state.internal.current === "IDLE" ? fetch() : state.internal;

      if (!setter) {
        return internalState.promise;
      }

      switch (internalState.promise.status) {
        case "fulfilled":
          return createFulfilledPromise(
            internalState.promise.then(unwrapGetter),
            unwrapGetter(internalState.promise.value)
          );
        case "pending": {
          return createPendingPromise(internalState.promise.then(unwrapGetter));
        }
        case "rejected": {
          return internalState.promise;
        }
      }
    },
    set promise(newPromise) {
      (state.internal as ActiveInternalState<T>).promise = newPromise;
    },
    revalidate,
    fetch() {
      return fetch().promise;
    },
  });

  return queryState;

  function executeQuery(): ActiveInternalState<T> {
    if (state.internal.current === "ACTIVE") {
      state.internal.abortController.abort();
    }

    const abortController = new AbortController();

    state.query.isRevalidating = true;

    const observablePromise = createObservablePromise<T>(
      fetcher().then((data) => (setter ? setter(data) : data)),
      abortController,
      (promise) => {
        newInternalState.promise = promise;
        queryState.promise = promise;

        if (promise.status === "fulfilled") {
          const value = promise.value;
          queryState.state = {
            status: "RESOLVED",
            get value() {
              return unwrapGetter(value);
            },
            isRevalidating: false,
          };
        } else {
          queryState.state = {
            status: "REJECTED",
            error: promise.reason,
            isRevalidating: false,
          };
        }
      }
    );

    const newInternalState: ActiveInternalState<T> = {
      current: "ACTIVE",
      abortController,
      promise: observablePromise,
    };

    return newInternalState;
  }

  function fetch(): ActiveInternalState<T> {
    const activeInternalState = (state.internal = executeQuery());

    queryState.state = {
      status: "PENDING",
      isRevalidating: true,
    };

    return activeInternalState;
  }

  function revalidate(): Promise<T> {
    if (state.internal.current === "IDLE") {
      return fetch().promise;
    }

    return executeQuery().promise;
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
