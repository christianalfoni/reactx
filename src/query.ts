import { transaction } from "mobx";
import { reactive } from ".";

type IdleInternalState = {
  current: "IDLE";
};

type ActiveInternalState<T> = {
  current: "ACTIVE";
  abortController: AbortController;
  promise: Promise<T>;
  status: Status<T>;
};

type InternalState<T> = ActiveInternalState<T> | IdleInternalState;

type Status<T> = {
  promise: Promise<T>;
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
  read: () => Status<T>;
  revalidate: () => Status<T>;
};

export function query<T>(fetcher: () => Promise<T>) {
  let internalState: InternalState<T> = {
    current: "IDLE",
  };

  const queryState = reactive<Query<T>>({
    read,
    revalidate,
  });

  return queryState;

  function updateStatus(prev: Status<T>, update: Status<T>): Status<T> {
    // Just for typing
    const anyPrev: any = prev;

    transaction(() => {
      delete anyPrev.error;
      delete anyPrev.value;
      Object.assign(anyPrev, update);
    });

    return anyPrev;
  }

  function fetch(): ActiveInternalState<T> {
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
          ? reactive<Status<T>>({
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

  function read(): Status<T> {
    if (internalState.current === "ACTIVE") {
      return internalState.status;
    }

    internalState = fetch();

    return internalState.status;
  }

  function revalidate(): Status<T> {
    if (internalState.current === "IDLE") {
      return read();
    }

    internalState = fetch();

    return internalState.status;
  }
}
