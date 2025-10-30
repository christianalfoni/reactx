export function subscription(subscription: () => () => void) {
  let subscibersCount = 0;
  let disposer: (() => void) | undefined;

  return () => {
    subscibersCount++;

    if (subscibersCount === 1) {
      disposer = subscription();
    }

    return () => {
      subscibersCount--;

      if (subscibersCount === 0) {
        disposer?.();
      }
    };
  };
}
