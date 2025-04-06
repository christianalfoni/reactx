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

type Params = Record<string, any>;

type BaseMutation<P extends Params, T> =
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

// Modified MutationWithParams for cases with parameters
type MutationWithParams<T, P extends Params> = BaseMutation<P, T> & {
  mutate(params: P): Promise<T>;
};

// Added MutationWithoutParams for cases without parameters
type MutationWithoutParams<T> = BaseMutation<{}, T> & {
  mutate(): Promise<T>;
};

// Export function overloads
export function mutation<T>(
  mutator: () => Promise<T>
): MutationWithoutParams<T>;
export function mutation<T, P extends Params>(
  mutator: (params: P) => Promise<T>
): MutationWithParams<T, P>;

// Implementation that handles both cases
export function mutation<T, P extends Params = {}>(
  mutator: (params?: P) => Promise<T>
): MutationWithParams<T, P> | MutationWithoutParams<T> {
  let internalState: InternalState<T> = { current: "IDLE" };

  const mutationState = reactive<
    MutationWithParams<T, P> | MutationWithoutParams<T>
  >({
    error: null,
    isPending: false,
    pendingParams: null,
    value: null,
    mutate,
  });

  return mutationState;

  function mutate(params?: P) {
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

    const promise = mutator(params)
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
