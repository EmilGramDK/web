import { betterFetch } from "./better-fetch";

type Fetcher = <T>(url: string, options?: RequestInit) => Promise<T>;

type Config = {
  baseUrl: string;
  authHeaders: Record<string, string>;
  fetcher: Fetcher;
};

type QueryOptions = {
  cacheTime?: number;
  timeout?: number;
} & RequestInit;

const config: Config = {
  baseUrl: "",
  authHeaders: {},
  fetcher: betterFetch,
};

const abortControllers: Map<string, AbortController> = new Map();
const cache: Map<string, [number, unknown]> = new Map();

export const setQueryConfig = (options: Partial<Config>) => Object.assign(config, options);
export const setQueryFetcher = (fetcher: Fetcher) => {
  config.fetcher = fetcher;
};

/**
 * Fetch data from an API endpoint.
 * @param key - The unique key for the query.
 * @param endpoint - The API endpoint to fetch data from.
 * @param options - Additional options for the fetch request.
 * @param options.cacheTime - The time in milliseconds to cache the response.
 * - If cacheTime is provided, and the query is repeated within that time, the cached response will be returned.
 * - Defaults to no caching.
 * @returns A promise that resolves to the fetched data.
 */
export const query = async <T>(
  key: string,
  endpoint: string,
  options?: QueryOptions,
): Promise<T> => {
  abortQuery(key);

  const cached = getCachedData<T>(key);
  if (cached) return cached;

  const signal = createSignal(key, options?.timeout);
  const url = `${config.baseUrl}${endpoint}`;
  const response = await config.fetcher<T>(url, getMergedOptions(options, signal));

  if (options?.cacheTime) cacheData(key, response, options.cacheTime);

  return response;
};

/**
 * Fetch data from multiple API endpoints.
 * @param queries - An array of query objects, each containing a key, endpoint, and optional options.
 * @returns A promise that resolves to an array of fetched data.
 */
export const queries = async <T>(
  queries: Array<{ key: string; endpoint: string; options?: QueryOptions }>,
): Promise<Array<T>> => {
  const promises = queries.map(({ key, endpoint, options }) => query<T>(key, endpoint, options));
  return Promise.all(promises);
};

/**
 * Abort an ongoing query.
 * @param key - The unique key for the query.
 * @returns A boolean indicating whether the query was aborted.
 */
export const abortQuery = (key: string): boolean => {
  const existing = abortControllers.get(key);
  if (!existing) return false;
  existing.abort();
  abortControllers.delete(key);
  return true;
};

/**
 * Abort all ongoing queries.
 */
export const abortAllQueries = (): void => {
  abortControllers.forEach((controller) => controller.abort());
  abortControllers.clear();
};

const createSignal = (key: string, timeout?: number): AbortSignal => {
  const controller = new AbortController();
  abortControllers.set(key, controller);
  let signal = controller.signal;

  if (timeout) {
    const timeoutSignal = AbortSignal.timeout(timeout);
    signal = AbortSignal.any([controller.signal, timeoutSignal]);
  }

  return signal;
};

const getMergedOptions = (options?: RequestInit, signal?: AbortSignal): RequestInit => ({
  ...options,
  headers: {
    ...config.authHeaders,
    ...options?.headers,
  },
  signal,
});

const getCachedData = <T>(key: string): T | undefined => {
  const cached = cache.get(key);
  if (!cached) return;
  const [expireTime, data] = cached;
  if (Date.now() < expireTime) return data as T;
  cache.delete(key);
};

const cacheData = <T>(key: string, data: T, ttl: number) => {
  cache.set(key, [Date.now() + ttl, data]);
};
