import { observable, transaction } from "mobx";

type IdleInternalState = {
  current: "IDLE";
};

type ActiveInternalState<T> = {
  current: "ACTIVE";
  abortController: AbortController;
  promise: Promise<T>;
};

type InternalState<T> = ActiveInternalState<T> | IdleInternalState;

type State<T, P> =
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

const PRIVATE = Symbol("PRIVATE");

export class Mutation<T, P extends any[]> {
  private [PRIVATE]: {
    mutator: (...args: P) => Promise<T>;
    subscriptionCount: number;
    internalState: InternalState<T>;
  };
  error: Error | null = null;
  isPending: boolean = false;
  pendingParams: P | null = null;
  value: T | null = null;
  constructor(mutator: (...args: P) => Promise<T>) {
    this[PRIVATE] = {
      mutator,
      subscriptionCount: 0,
      internalState: {
        current: "IDLE",
      },
    };
  }
  subscribe() {
    this[PRIVATE].subscriptionCount++;

    return () => {
      this[PRIVATE].subscriptionCount--;

      if (
        this[PRIVATE].subscriptionCount === 0 &&
        this[PRIVATE].internalState.current !== "IDLE"
      ) {
        this[PRIVATE].internalState.abortController.abort();
        this[PRIVATE].internalState = { current: "IDLE" };
        Object.assign(this, {
          error: null,
          isPending: false,
          pendingParams: null,
          value: null,
        });
      }
    };
  }

  mutate(...params: P): Promise<T> {
    // Cancel any ongoing request
    if (this[PRIVATE].internalState.current !== "IDLE") {
      this[PRIVATE].internalState.abortController.abort();
    }

    const abortController = new AbortController();

    transaction(() => {
      Object.assign(this, {
        error: null,
        isPending: true,
        pendingParams: params,
        value: null,
      });
    });

    const promise = this[PRIVATE].mutator(...params)
      .then((value) => {
        if (abortController.signal.aborted) {
          return value;
        }

        transaction(() => {
          Object.assign(this, {
            error: null,
            isPending: false,
            pendingParams: null,
            value,
          });
        });

        return value;
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          throw error;
        }

        transaction(() => {
          Object.assign(this, {
            error,
            isPending: false,
            pendingParams: params as P,
            value: null,
          });
        });
        this[PRIVATE].internalState = { current: "IDLE" };

        throw error;
      });

    this[PRIVATE].internalState = {
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

export function mutation<T, P extends any[]>(
  mutator: (...args: P) => Promise<T>
) {
  return new Mutation(mutator) as Omit<
    Mutation<T, P>,
    "error" | "value" | "isPending" | "pendingParams"
  > &
    State<T, P>;
}
