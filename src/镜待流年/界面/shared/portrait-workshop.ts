export type Portrait = { id: string; name: string; tag: string; url: string; caption: string; open?: boolean };
export type PortraitGroup = { id: string; name: string; items: Portrait[] };
export type WorkshopSort = 'latest' | 'hot';
export type WorkshopGroup = {
  id: string; name: string; description: string; author_name: string; asset_count: number; cover_url: string | null;
  published_at: string | null; download_count: number; use_count: number; hot_score: number;
};
export const WORKSHOP_URL = 'https://jingdai-workshop-api.zhongyinglei377.workers.dev';

export function portraitUrl(value: unknown): string {
  if (typeof value !== 'string') throw new Error('图片地址无效');
  if (/^data:image\/(?:png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch { /* Report one consistent validation error. */ }
  throw new Error('图片需要有效直链或本地图片');
}

export function parsePortraitGroup(payload: unknown): PortraitGroup {
  if (!payload || typeof payload !== 'object') throw new Error('不是有效的立绘组包');
  const wrapper = payload as Record<string, unknown>;
  if ('format' in wrapper && (wrapper.format !== 'jdnl-portrait-group' || wrapper.version !== 1)) throw new Error('不支持的组包版本');
  const incoming = (wrapper.group || wrapper) as Record<string, unknown>;
  const field = (value: unknown, max: number, optional = false) => {
    if (optional && value === undefined) return '';
    if (typeof value !== 'string' || value.length > max || (!optional && !value.trim())) throw new Error('组包字段无效');
    return value.trim();
  };
  const name = field(incoming.name, 100);
  if (!Array.isArray(incoming.items) || incoming.items.length > 2000) throw new Error('立绘数量无效');
  const used = new Set<string>();
  const items = incoming.items.map((value: unknown): Portrait => {
    if (!value || typeof value !== 'object') throw new Error('立绘字段无效');
    const item = value as Record<string, unknown>;
    const id = field(item.id, 80);
    if (!/^[\p{L}\p{N}_-]+$/u.test(id) || used.has(id)) throw new Error('立绘 ID 重复或无效');
    used.add(id);
    return { id, name: field(item.name, 80), tag: field(item.tag, 120), caption: field(item.caption, 1000, true), url: portraitUrl(item.url), open: false };
  });
  return { id: typeof incoming.id === 'string' ? incoming.id : '', name, items };
}

export function mergePortraitItems(current: Portrait[], incoming: Portrait[]): Portrait[] {
  const merged = [...current];
  const positions = new Map(current.map((item, index) => [item.id, index]));
  for (const item of incoming) {
    const index = positions.get(item.id);
    if (index === undefined) { positions.set(item.id, merged.length); merged.push(item); }
    else merged[index] = item;
  }
  return merged;
}

export async function portablePortraitGroup(group: PortraitGroup): Promise<PortraitGroup> {
  const items: Portrait[] = [];
  for (const item of group.items) {
    if (item.url.startsWith('data:')) { items.push(item); continue; }
    let response: Response;
    try { response = await fetch(portraitUrl(item.url), { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(30000) }); }
    catch { throw new Error(`“${item.name} / ${item.tag}”无法下载图片；请检查直链、网络或跨域限制`); }
    if (!response.ok) throw new Error(`“${item.name} / ${item.tag}”的图片已失效（${response.status}）`);
    const type = response.headers.get('content-type')?.split(';')[0]?.trim();
    if (!type || !['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(type)) throw new Error(`“${item.name} / ${item.tag}”不是受支持的图片`);
    const blob = await response.blob();
    if (blob.size > 20 * 1024 * 1024) throw new Error(`“${item.name} / ${item.tag}”超过单张 20 MiB`);
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('图片读取失败')); reader.readAsDataURL(blob);
    });
    items.push({ ...item, url: portraitUrl(url) });
  }
  return { ...group, items };
}

export async function workshopRequest(path: string): Promise<unknown> {
  const response = await fetch(WORKSHOP_URL + path, {
    signal: AbortSignal.timeout(20000), credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
  });
  if (!response.ok) throw new Error(response.status === 404 ? '该组已撤回或不存在' : `工坊暂时不可用（${response.status}）`);
  return response.json();
}
