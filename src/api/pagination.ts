import { getApiClient } from "./client";

type Params = Record<string, string | number | boolean | undefined>;

export async function fetchAllPages<T>(
  path: string,
  dataKey: string,
  params?: Params,
  limit?: number,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const res = await getApiClient().get(path, {
      params: { ...params, page, per_page: 50 },
    });
    all.push(...(res.data[dataKey] as T[]));
    if (!res.data.meta?.pagination?.next_page) break;
    if (limit !== undefined && all.length >= limit) break;
    page++;
  }
  return all;
}
