import { tryCatch, tryCatchAll, type Result } from "../../core/try-catch";
import { betterFetch } from "../better-fetch";
import { createSignal, getMergedOptions } from "./utils";

type Fetcher = <T>(url: string, options?: RequestInit) => Promise<T>;

export type Config = {
  baseUrl: string;
  authHeaders: Record<string, string>;
  fetcher: Fetcher;
};

export type QueryOptions = {
  cacheTime?: number;
  timeout?: number;
} & RequestInit;

export type QueryClient = {
  query: <T>(key: string, endpoint: string, options?: QueryOptions) => Promise<T>;
  queries: <T>(
    queries: Array<{ key: string; endpoint: string; options?: QueryOptions }>,
  ) => Promise<Array<T>>;
  tryQuery: <T>(key: string, endpoint: string, options?: QueryOptions) => Promise<Result<T>>;
  tryQueries: <T>(
    queries: Array<{ key: string; endpoint: string; options?: QueryOptions }>,
  ) => Promise<Array<Result<T>>>;
  abort: (key: string) => boolean;
  abortAll: () => void;
  clearCached: (key?: string) => void;
};

const defaultConfig: Config = {
  baseUrl: "",
  authHeaders: {},
  fetcher: betterFetch,
};

let queryClient: QueryClient | undefined;

export const createQueryClient = (options?: Partial<Config>) => {
  if (queryClient) throw new Error("Query client already exists.");

  const config = { ...defaultConfig, ...options };
  const abortControllers: Map<string, AbortController> = new Map();
  const cache: Map<string, [number, unknown]> = new Map();

  const getCachedData = <T>(key: string): T | undefined => {
    const cached = cache.get(key);
    if (!cached) return;
    const [expireTime, data] = cached;
    if (Date.now() < expireTime) return data as T;
    cache.delete(key);
  };

  const query = async <T>(key: string, endpoint: string, options?: QueryOptions): Promise<T> => {
    abort(key);
    const cached = getCachedData<T>(key);
    if (cached) return cached;
    const { controller, signal } = createSignal(options?.timeout);
    abortControllers.set(key, controller);
    const url = `${config.baseUrl}${endpoint}`;
    const response = await config.fetcher<T>(url, getMergedOptions(config, options, signal));
    if (options?.cacheTime) cache.set(key, [Date.now() + options.cacheTime, response]);
    return response;
  };

  const queries = async <T>(
    queries: Array<{ key: string; endpoint: string; options?: QueryOptions }>,
  ): Promise<Array<T>> => {
    const promises = queries.map(({ key, endpoint, options }) => query<T>(key, endpoint, options));
    return Promise.all(promises);
  };

  const tryQuery = async <T>(
    key: string,
    endpoint: string,
    options?: QueryOptions,
  ): Promise<Result<T>> => {
    return await tryCatch(query<T>(key, endpoint, options));
  };

  const tryQueries = async <T>(
    queries: Array<{ key: string; endpoint: string; options?: QueryOptions }>,
  ): Promise<Array<Result<T>>> => {
    return await tryCatchAll(
      queries.map(({ key, endpoint, options }) => query<T>(key, endpoint, options)),
    );
  };

  const abort = (key: string) => {
    const existing = abortControllers.get(key);
    if (!existing) return false;
    existing.abort();
    abortControllers.delete(key);
    return true;
  };

  const abortAll = () => {
    abortControllers.forEach((controller) => controller.abort());
    abortControllers.clear();
  };

  const clearCached = (key?: string) => {
    if (key) return cache.delete(key);
    cache.clear();
  };

  const destroy = () => {
    abortAll();
    clearCached();
    queryClient = undefined;
  };

  window.addEventListener("unload", destroy);

  const client = { query, queries, tryQuery, tryQueries, abort, abortAll, clearCached };
  queryClient = client;
  return client;
};

export const getQueryClient = (): QueryClient => {
  if (!queryClient) throw new Error("Query client not created.");
  return queryClient;
};
