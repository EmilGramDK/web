type Success<T> = {
  data: T;
  error: undefined;
};

type Failure<E> = {
  data: undefined;
  error: E;
};

export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * A function that wraps a promise in a try-catch block.
 * @param promise The promise to wrap.
 * @returns A promise that resolves to a Result object.
 *
 * @example
 * const { error, data } = await tryCatch(fetch('https://jsonplaceholder.typicode.com/todos/1'));
 */
export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: undefined };
  } catch (error) {
    return { data: undefined, error: error as E };
  }
}

/**
 * A function that wraps an array of promises in try-catch blocks.
 * @param promises An array of promises to wrap.
 * @returns A promise that resolves to an array of Result objects.
 *
 * @example
 * const results = await tryCatchAll([
 *   fetch('https://jsonplaceholder.typicode.com/todos/1').then(res => res.json()),
 *   fetch('https://jsonplaceholder.typicode.com/todos/2').then(res => res.json())
 * ]);
 *
 * results.forEach(({ data, error }, index) => {
 *   if (error) {
 *     console.error(`Error in promise ${index}:`, error);
 *   } else {
 *     console.log(`Data from promise ${index}:`, data);
 *   }
 * });
 */
export async function tryCatchAll<T, E = Error>(
  promises: Array<Promise<T>>,
): Promise<Array<Result<T, E>>> {
  return Promise.all(
    promises.map((promise) =>
      promise
        .then((data) => ({ data, error: undefined }))
        .catch((error) => ({ data: undefined, error: error as E })),
    ),
  );
}
