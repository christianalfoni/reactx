import { transaction } from "mobx";
import { reactive } from ".";

type IdleInternalState<T> = {
  current: "IDLE";
};

type ActiveInternalState<T> = {
  current: "ACTIVE";
  abortController: AbortController;
  promise: Promise<T>;
};

type InternalState<T> = ActiveInternalState<T> | IdleInternalState<T>;

type BaseMutation<T, P> =
  | {
      error: null;
      isPending: true;
      pendingParams: P;
      value: null;
    }
  | {
      error: Error;
      isPending: false;
      pendingParams: P;
      value: null;
    }
  | {
      error: null;
      isPending: false;
      pendingParams: null;
      value: null;
    }
  | {
      error: null;
      isPending: false;
      pendingParams: null;
      value: T;
    };

export type Mutation<T, P extends any[]> = BaseMutation<T, P> & {
  mutate: (...args: P) => Promise<T>;
  subscribe: () => () => void;
};

// Implementation that handles both cases
export function mutation<T, P extends any[]>(
  mutator: (...args: P) => Promise<T>
): Mutation<T, P> {
  let internalState: InternalState<T> = { current: "IDLE" };
  let subscriptionCount = 0;

  const mutationState = reactive<Mutation<T, P>>({
    error: null,
    isPending: false,
    pendingParams: null,
    value: null,
    mutate,
    subscribe,
  });

  return mutationState;

  function subscribe() {
    subscriptionCount++;

    return () => {
      subscriptionCount--;

      if (subscriptionCount === 0 && internalState.current !== "IDLE") {
        internalState.abortController.abort();
        internalState = { current: "IDLE" };
        Object.assign(mutationState, {
          error: null,
          isPending: false,
          pendingParams: null,
          value: null,
        });
      }
    };
  }

  function mutate(...params: P): Promise<T> {
    // Cancel any ongoing request
    if (internalState.current !== "IDLE") {
      internalState.abortController.abort();
    }

    const abortController = new AbortController();

    transaction(() => {
      Object.assign(mutationState, {
        error: null,
        isPending: true,
        pendingParams: params,
        value: null,
      });
    });

    const promise = mutator(...params)
      .then((value) => {
        if (abortController.signal.aborted) {
          return value;
        }

        transaction(() => {
          Object.assign(mutationState, {
            error: null,
            isPending: false,
            pendingParams: null,
            value,
          });
        });
        internalState = { current: "IDLE" };

        return value;
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          throw error;
        }

        transaction(() => {
          Object.assign(mutationState, {
            error,
            isPending: false,
            pendingParams: params as P,
            value: null,
          });
        });
        internalState = { current: "IDLE" };

        throw error;
      });

    internalState = {
      current: "ACTIVE",
      abortController,
      promise,
    };

    promise.catch(() => {
      // This is just to avoid browser throwing
      // unhandled promise rejection
    });

    return promise;
  }
}
