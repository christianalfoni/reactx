import { reactive } from ".";

type IdleInternalState<T> = {
  current: "IDLE";
};

type ActiveInternalState<T> = {
  current: "ACTIVE";
  abortController: AbortController;
  promise: SuspensePromise<T>;
};

type InternalState<T> = ActiveInternalState<T> | IdleInternalState<T>;

type State<T> = {
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
  state: State<T>;
  promise: SuspensePromise<T>;
  revalidate: () => Promise<T>;
  fetch: () => Promise<T>;
};

export function query<T>(fetcher: () => Promise<T>) {
  const state = reactive<{ query: State<T>; internal: InternalState<T> }>({
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
      if (state.internal.current === "IDLE") {
        // This changes internal state to "ACTIVE"
        fetch();
      }

      return (state.internal as ActiveInternalState<T>).promise;
    },
    set promise(newPromise) {
      (state.internal as ActiveInternalState<T>).promise = newPromise;
    },
    revalidate,
    fetch,
  });

  return queryState;

  function executeQuery(): ActiveInternalState<T> {
    if (state.internal.current === "ACTIVE") {
      state.internal.abortController.abort();
    }

    const abortController = new AbortController();

    state.query.isRevalidating = true;

    const observablePromise = createObservablePromise<T>(
      fetcher(),
      abortController,
      (promise) => {
        newInternalState.promise = promise;
        queryState.promise = promise;

        if (promise.status === "fulfilled") {
          queryState.state = {
            status: "RESOLVED",
            value: promise.value,
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

  function fetch(): Promise<T> {
    state.internal = executeQuery();

    queryState.state = {
      status: "PENDING",
      isRevalidating: true,
    };
    queryState.promise = state.internal.promise;

    return state.internal.promise;
  }

  function revalidate(): Promise<T> {
    if (state.internal.current === "IDLE") {
      return fetch();
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
