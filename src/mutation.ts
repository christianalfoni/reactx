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

type Params = Record<string, any>;

export function mutation<P extends Params, T>(mutator: (params?: P) => T) {
  let internalState: InternalState<T> = {
    status: "IDLE",
  };
}
