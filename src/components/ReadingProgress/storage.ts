// 阅读进度的 localStorage 读写层。
// 全部操作 SSR 安全：服务端渲染阶段不访问 window / localStorage。
// 只操作本项目自有的键，绝不调用 localStorage.clear()。

import type {DocumentProgress, DocumentProgressMap} from './types';

const PREFIX = 'neoforge-reader:v1:';
export const KEY_LAST_DOCUMENT = `${PREFIX}last-document`;
export const KEY_SIDEBAR_SCROLL = `${PREFIX}sidebar-scroll`;
export const KEY_DOCUMENTS = `${PREFIX}documents`;

/** 本项目使用的全部 localStorage 键，供“清除阅读记录”精确删除。 */
export const ALL_KEYS = [KEY_LAST_DOCUMENT, KEY_SIDEBAR_SCROLL, KEY_DOCUMENTS];

/** 达到该阅读比例即视为“已读完”。 */
export const COMPLETION_THRESHOLD = 0.9;

/** 保留的最近文档条数上限，防止 localStorage 无限增长。 */
const MAX_DOCUMENTS = 200;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeGet(key: string): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 忽略配额或隐私模式异常 */
  }
}

function safeRemove(key: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* 忽略 */
  }
}

export function readDocuments(): DocumentProgressMap {
  const raw = safeGet(KEY_DOCUMENTS);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as DocumentProgressMap) : {};
  } catch {
    return {};
  }
}

function writeDocuments(map: DocumentProgressMap): void {
  // 超出上限时，保留最近阅读的条目。
  const entries = Object.values(map);
  if (entries.length > MAX_DOCUMENTS) {
    entries.sort((a, b) => b.lastReadAt - a.lastReadAt);
    const trimmed: DocumentProgressMap = {};
    for (const e of entries.slice(0, MAX_DOCUMENTS)) trimmed[e.pathname] = e;
    map = trimmed;
  }
  safeSet(KEY_DOCUMENTS, JSON.stringify(map));
}

export function getDocumentProgress(pathname: string): DocumentProgress | undefined {
  return readDocuments()[pathname];
}

/** 写入/更新单篇文档进度，并同步“最后阅读”指针。 */
export function saveDocumentProgress(entry: DocumentProgress): void {
  const map = readDocuments();
  const prev = map[entry.pathname];
  map[entry.pathname] = {
    ...entry,
    // completed 一旦为真则保持为真。
    completed: entry.completed || (prev?.completed ?? false),
  };
  writeDocuments(map);
  safeSet(KEY_LAST_DOCUMENT, entry.pathname);
}

export function getLastDocumentPathname(): string | null {
  return safeGet(KEY_LAST_DOCUMENT);
}

export function getLastDocument(): DocumentProgress | undefined {
  const pathname = getLastDocumentPathname();
  if (!pathname) return undefined;
  return readDocuments()[pathname];
}

export function saveSidebarScroll(scrollTop: number): void {
  safeSet(KEY_SIDEBAR_SCROLL, String(Math.round(scrollTop)));
}

export function getSidebarScroll(): number | null {
  const raw = safeGet(KEY_SIDEBAR_SCROLL);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** 仅清除本项目相关键，不影响主题选择等其他存储。 */
export function clearAllReadingData(): void {
  for (const key of ALL_KEYS) safeRemove(key);
}
