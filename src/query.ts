import { transaction } from "mobx";
import { reactive } from ".";

type InternalState<T> =
  | {
      status: "IDLE";
    }
  | {
      status: "ACTIVE";
      abortController: AbortController;
      promise: Promise<T>;
    };

type Status<T> =
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
    };

type Query<T> = {
  fetch: () => Query<T>;
  promise: () => Promise<T>;
  revalidate: () => Query<T>;
  isRevalidating: boolean;
} & Status<T>;

export function query<T>(fetcher: () => Promise<T>) {
  let internalState: InternalState<T> = {
    status: "IDLE",
  };

  const state = reactive<Query<T>>({
    status: "PENDING",
    fetch,
    revalidate,
    promise,
    isRevalidating: true,
  });

  return state;

  function updateState(update: Partial<Query<T>>): Query<T> {
    // Just for typing
    const anyState: any = state;

    transaction(() => {
      delete anyState.error;
      delete anyState.value;
      Object.assign(anyState, update);
    });

    return anyState;
  }

  function run(): InternalState<T> {
    if (internalState.status === "ACTIVE") {
      internalState.abortController.abort();
    }

    const abortController = new AbortController();
    const promise = fetcher()
      .then((value) => {
        if (abortController.signal.aborted) {
          // We return the stale value
          return value;
        }

        updateState({ status: "RESOLVED", value });

        return value;
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          throw error;
        }

        updateState({ status: "REJECTED", error });

        throw error;
      });

    promise.catch(() => {
      // Just to ensure browser does not throw unhandled promise rejection
    });

    return {
      status: "ACTIVE",
      abortController,
      promise,
    };
  }

  function fetch(): Query<T> {
    if (internalState.status === "ACTIVE") {
      return state;
    }

    internalState = run();

    // Will always be "PENDING"
    return state;
  }

  function revalidate(): Query<T> {
    if (internalState.status === "IDLE") {
      return fetch();
    }

    internalState = run();

    return updateState({ status: state.status, isRevalidating: true });
  }

  function promise() {
    if (internalState.status === "IDLE") {
      return fetch().promise();
    }

    return internalState.promise;
  }
}
