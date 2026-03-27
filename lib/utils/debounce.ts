type Callback<TArgs extends unknown[]> = (...args: TArgs) => void;

type Debounced<TArgs extends unknown[]> = Callback<TArgs> & {
  cancel: () => void;
};

export function debounce<TArgs extends unknown[]>(
  callback: Callback<TArgs>,
  delay: number,
): Debounced<TArgs> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: TArgs) => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      callback(...args);
    }, delay);
  }) as Debounced<TArgs>;

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
    }
  };

  return debounced;
}
