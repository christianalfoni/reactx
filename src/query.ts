import { transaction } from "mobx";
import { reactive } from ".";

type IdleInternalState<T> = {
  current: "IDLE";
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

type ActiveInternalState<T> = {
  current: "ACTIVE";
  abortController: AbortController;
  promise: Promise<T>;
  status: State<T>;
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
  promise: Promise<T>;
  revalidate: () => Promise<T>;
  fetch: () => Promise<T>;
};

export function query<T>(fetcher: () => Promise<T>) {
  const idlePromise = createBlockingPromise<T>();

  let internalState: InternalState<T> = {
    current: "IDLE",
    promise: idlePromise.promise,
    resolve: idlePromise.resolve,
    reject: idlePromise.reject,
  };

  const state = reactive<State<T>>({
    isRevalidating: false,
    status: "PENDING",
  });

  const queryState = reactive<Query<T>>({
    state,
    get promise() {
      return internalState.promise;
    },
    revalidate,
    fetch: executeQuery,
  });

  return queryState;

  function updateStatus(prev: State<T>, next: State<T>): State<T> {
    transaction(() => {
      // @ts-expect-error
      delete prev.error;
      // @ts-expect-error
      delete prev.value;
      Object.assign(prev, next);
    });

    return prev;
  }

  function executeQuery(): ActiveInternalState<T> {
    if (internalState.current === "ACTIVE") {
      internalState.abortController.abort();
    }

    const abortController = new AbortController();

    const promise = fetcher()
      .then((value) => {
        if (abortController.signal.aborted) {
          // We return the stale value
          return value;
        }

        updateStatus(newInternalState.status, {
          status: "RESOLVED",
          value,
          promise,
          isRevalidating: false,
        });

        return value;
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          throw error;
        }

        updateStatus(newInternalState.status, {
          status: "REJECTED",
          error,
          promise,
          isRevalidating: false,
        });

        throw error;
      });

    promise.catch(() => {
      // Just to ensure browser does not throw unhandled promise rejection
    });

    const newInternalState: ActiveInternalState<T> = {
      current: "ACTIVE",
      abortController,
      promise,
      status:
        internalState.current === "IDLE"
          ? reactive<State<T>>({
              status: "PENDING",
              promise,
              isRevalidating: true,
            })
          : updateStatus(
              internalState.status,
              internalState.status.status === "REJECTED"
                ? {
                    status: "PENDING",
                    isRevalidating: true,
                    promise,
                  }
                : {
                    ...internalState.status,
                    promise,
                    isRevalidating: true,
                  }
            ),
    };

    return newInternalState;
  }

  function fetch(): Promise<T> {
    internalState = executeQuery();

    return internalState.promise;
  }

  function revalidate(): Promise<T> {
    if (internalState.current === "IDLE") {
      return fetch();
    }

    internalState = executeQuery();

    return internalState.promise;
  }
}

function createBlockingPromise<T>() {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;

  const promise = new Promise<T>((r, r2) => {
    resolve = r;
    reject = r2;
  });

  // @ts-expect-error
  return { promise, resolve, reject };
}
