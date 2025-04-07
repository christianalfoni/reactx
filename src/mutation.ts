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

type BaseMutation<P, T> =
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

export type Mutation<T, P> = BaseMutation<P, T> & {
  mutate: (...args: P extends void ? [] : [P]) => Promise<T>;
};

// Implementation that handles both cases
export function mutation<T, P = void>(
  mutator: (...args: P extends void ? [] : [P]) => Promise<T>
): Mutation<T, P> {
  let internalState: InternalState<T> = { current: "IDLE" };

  const mutationState = reactive<Mutation<T, P>>({
    error: null,
    isPending: false,
    pendingParams: null,
    value: null,
    mutate,
  });

  return mutationState;

  function mutate(...args: P extends void ? [] : [P]): Promise<T> {
    const params = args[0] as P;

    // Cancel any ongoing request
    if (internalState.current === "ACTIVE") {
      internalState.abortController.abort();
    }

    const abortController = new AbortController();

    transaction(() => {
      Object.assign(mutationState, {
        error: null,
        isPending: true,
        pendingParams: params as P,
        value: null,
      });
    });

    const promise = mutator(...args)
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
