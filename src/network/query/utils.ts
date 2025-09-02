import type { Config } from "./client";

export const createSignal = (
  timeout?: number,
): {
  controller: AbortController;
  signal: AbortSignal;
} => {
  const controller = new AbortController();
  let signal = controller.signal;

  if (timeout) {
    const timeoutSignal = AbortSignal.timeout(timeout);
    signal = AbortSignal.any([controller.signal, timeoutSignal]);
  }

  return { controller, signal };
};

export const getMergedOptions = (
  config: Config,
  options?: RequestInit,
  signal?: AbortSignal,
): RequestInit => ({
  ...options,
  headers: {
    ...config.authHeaders,
    ...options?.headers,
  },
  signal,
});
