/**
 * Fetch data from an API endpoint.
 * @param url - The API endpoint URL.
 * @param options - Additional options for the fetch request.
 * @param throwOnError - Whether to throw an error on a non-2xx response.
 */
export function betterFetch<T>(url: string, options?: RequestInit, throwOnError?: true): Promise<T>;
export function betterFetch<T>(
  url: string,
  options?: RequestInit,
  throwOnError?: false,
): Promise<T | undefined>;
export async function betterFetch<T>(
  url: string,
  options?: RequestInit,
  throwOnError: boolean = true,
): Promise<T | undefined> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("Content-Type") || "";

  if (!response.ok) return handleError(contentType, response, throwOnError);

  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as T;
}

const handleError = async (
  type: string,
  res: Response,
  throwErr: boolean,
): Promise<undefined | never> => {
  if (!throwErr) {
    return undefined;
  }
  const isJSON = type.includes("application/json");
  const errorBody = isJSON ? await res.json() : await res.text();
  throw new Error(typeof errorBody === "string" ? errorBody : errorBody.message || "Unknown error");
};
