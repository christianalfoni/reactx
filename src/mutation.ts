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

type State<P extends Params, T> =
  | {
      status: "IDLE";
    }
  | {
      status: "PENDING";
      params: P;
    }
  | {
      status: "RESOLVED";
      value: T;
    }
  | {
      status: "REJECTED";
      error: Error;
      params: P;
    };

// Modified MutationWithParams for cases with parameters
type MutationWithParams<T, P extends Params> = {
  state: State<P, T>;
  mutate(params: P): Promise<T>;
};

// Added MutationWithoutParams for cases without parameters
type MutationWithoutParams<T> = {
  state: State<{}, T>;
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
    state: {
      status: "IDLE",
    },
    mutate,
  });

  return mutationState;

  function mutate(params?: P) {
    // Cancel any ongoing request
    if (internalState.current === "ACTIVE") {
      internalState.abortController.abort();
    }

    const abortController = new AbortController();

    mutationState.state = { status: "PENDING", params: params as P };

    const promise = mutator(params)
      .then((value) => {
        if (abortController.signal.aborted) {
          return value;
        }

        mutationState.state = { status: "RESOLVED", value };
        internalState = { current: "IDLE" };

        return value;
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          throw error;
        }

        mutationState.state = {
          status: "REJECTED",
          error,
          params: params as P,
        };
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
