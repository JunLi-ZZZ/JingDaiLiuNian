import type { PortraitGroup } from './portrait-workshop';

export const PORTRAIT_REVISION = 'jdnl_portrait_revision_v1';
export const PORTRAIT_GROUPS = 'jdnl_portrait_groups_v1';
export const PORTRAIT_ACTIVE_GROUP = 'jdnl_portrait_active_group_v1';
export const PORTRAIT_ENABLED = 'jdnl_portrait_enabled_v1';
const LEGACY = 'jdnl_portrait_library_v1';
const DATABASE = 'jdnl_portraits_v1';

function host(): Window {
  try { return window.parent?.indexedDB ? window.parent : window; }
  catch { return window; }
}

export function portraitSettings(): Storage { return host().localStorage; }

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = host().indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('library');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('无法打开本地图库'));
  });
}

async function readSaved(): Promise<PortraitGroup[] | undefined> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('library').objectStore('library').get('groups');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('读取图库失败'));
    });
  } finally { db.close(); }
}

export async function savePortraitGroups(groups: PortraitGroup[]): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('library', 'readwrite');
      tx.objectStore('library').put(groups.map(group => ({ ...group, items: group.items.map(({ open, ...item }) => item) })), 'groups');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('保存图库失败'));
      tx.onabort = () => reject(tx.error || new Error('保存图库失败'));
    });
    try { portraitSettings().setItem(PORTRAIT_REVISION, String(Date.now()) + Math.random()); }
    catch { /* IndexedDB is authoritative; polling still refreshes other frames. */ }
  } finally { db.close(); }
}

export async function loadPortraitGroups(): Promise<PortraitGroup[]> {
  const saved = await readSaved();
  if (saved) return saved;
  const settings = portraitSettings();
  let old: PortraitGroup[] | undefined;
  try {
    const groups = JSON.parse(settings.getItem(PORTRAIT_GROUPS) || 'null');
    if (Array.isArray(groups) && groups.every(x => x && typeof x.id === 'string' && Array.isArray(x.items))) old = groups;
    else {
      const legacy = JSON.parse(settings.getItem(LEGACY) || '[]');
      old = [{ id: 'default', name: '默认组', items: Array.isArray(legacy) ? legacy : [] }];
    }
  } catch { old = [{ id: 'default', name: '默认组', items: [] }]; }
  await savePortraitGroups(old);
  // Only discard the quota-limited copy after the IndexedDB transaction commits.
  settings.removeItem(PORTRAIT_GROUPS);
  settings.removeItem(LEGACY);
  return old;
}
