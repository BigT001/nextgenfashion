// Simple client-side cache for lightweight lists (categories, warehouses)
const TTL = 1000 * 60 * 5; // 5 minutes

function readCache(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.ts || (Date.now() - parsed.ts) > TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function writeCache(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {
    // ignore
  }
}

export async function getCachedCategories(fetcher: () => Promise<any>) {
  if (typeof window === "undefined") return fetcher();
  const key = "cache:categories";
  const cached = readCache(key);
  if (cached) return { success: true, data: cached };
  const res = await fetcher();
  if (res && res.success) {
    writeCache(key, res.data || []);
  }
  return res;
}

export async function getCachedWarehouses(fetcher: () => Promise<any>) {
  if (typeof window === "undefined") return fetcher();
  const key = "cache:warehouses";
  const cached = readCache(key);
  if (cached) return { success: true, data: cached };
  const res = await fetcher();
  if (res && res.success) {
    writeCache(key, res.data || []);
  }
  return res;
}

export function invalidateCache(key: "categories" | "warehouses") {
  try {
    localStorage.removeItem(`cache:${key}`);
  } catch (e) {}
}

export default { getCachedCategories, getCachedWarehouses, invalidateCache };
