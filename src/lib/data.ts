import type { Settings, StatsMap } from "../types";

export interface PomodoroData {
  app: "tomato-focus";
  version: 1;
  exportedAt: string;
  settings: Settings;
  stats: StatsMap;
}

const SETTINGS_RANGE: { key: keyof Settings; min: number; max: number; fallback: number }[] = [
  { key: "focus", min: 5, max: 90, fallback: 25 },
  { key: "short", min: 1, max: 30, fallback: 5 },
  { key: "long", min: 5, max: 60, fallback: 15 },
  { key: "longEvery", min: 2, max: 8, fallback: 4 },
];

/** 打包为可移植的 JSON 文本 */
export function serializeData(settings: Settings, stats: StatsMap): string {
  const data: PomodoroData = {
    app: "tomato-focus",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    stats,
  };
  return JSON.stringify(data, null, 2);
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** 解析并校验导入的 JSON；非法内容返回 null */
export function parseData(text: string): PomodoroData | null {
  try {
    const raw = JSON.parse(text) as Partial<PomodoroData>;
    if (!raw || typeof raw !== "object" || raw.app !== "tomato-focus") return null;

    const rs = (raw.settings ?? {}) as Record<string, unknown>;
    const nums: Record<string, number> = {};
    for (const { key, min, max, fallback } of SETTINGS_RANGE) {
      const v = Number(rs[key]);
      nums[key] = Number.isFinite(v) ? Math.round(clamp(v, min, max)) : fallback;
    }
    const settings: Settings = {
      focus: nums.focus,
      short: nums.short,
      long: nums.long,
      longEvery: nums.longEvery,
      autoStart: typeof rs.autoStart === "boolean" ? rs.autoStart : false,
    };

    const stats: StatsMap = {};
    const rawStats = (raw.stats ?? {}) as Record<string, unknown>;
    for (const [day, value] of Object.entries(rawStats)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      const v = value as { count?: unknown; seconds?: unknown };
      const count = Number(v?.count);
      const seconds = Number(v?.seconds);
      if (!Number.isFinite(count) || !Number.isFinite(seconds)) continue;
      stats[day] = {
        count: Math.max(0, Math.round(count)),
        seconds: Math.max(0, Math.round(seconds)),
      };
    }

    return { app: "tomato-focus", version: 1, exportedAt: String(raw.exportedAt ?? ""), settings, stats };
  } catch {
    return null;
  }
}

/**
 * 合并每日统计：同一天取两边较大值，
 * 因此重复导入同一份文件不会重复累加。
 */
export function mergeStats(current: StatsMap, incoming: StatsMap): StatsMap {
  const stats: StatsMap = { ...current };
  for (const [day, v] of Object.entries(incoming)) {
    const cur = stats[day];
    stats[day] = cur
      ? { count: Math.max(cur.count, v.count), seconds: Math.max(cur.seconds, v.seconds) }
      : v;
  }
  return stats;
}

/** 触发浏览器下载 */
export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- File System Access API（Chrome / Edge 可将数据直接写入本地文件） ---------- */

export interface LocalFileHandle {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  /** 可选：请求读 / 读写权限（Chrome / Edge） */
  requestPermission?: (d: { mode: "read" | "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
  queryPermission?: (d: { mode: "read" | "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
}

interface PickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<LocalFileHandle>;
  showOpenFilePicker?: (options: {
    multiple?: boolean;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<LocalFileHandle[]>;
}

export function supportsFilePicker(): boolean {
  return typeof (window as PickerWindow).showSaveFilePicker === "function";
}

/** 弹出系统打开对话框选择 JSON 数据文件；用户取消或不支持时返回 null */
export async function pickImportFile(): Promise<LocalFileHandle | null> {
  const w = window as PickerWindow;
  if (!w.showOpenFilePicker) return null;
  try {
    const [handle] = await w.showOpenFilePicker({
      multiple: false,
      types: [{ description: "番茄专注数据", accept: { "application/json": [".json"] } }],
    });
    return handle ?? null;
  } catch {
    return null; // 用户取消选择
  }
}

/** 请求对文件的读写权限；成功（或浏览器默认放行）返回 true */
export async function requestReadWrite(handle: LocalFileHandle): Promise<boolean> {
  try {
    if (typeof handle.requestPermission === "function") {
      const perm = await handle.requestPermission({ mode: "readwrite" });
      return perm === "granted";
    }
    return true; // 无该方法的浏览器交由 createWritable 自行提示
  } catch {
    return false;
  }
}

/** 弹出系统保存对话框，返回文件句柄；用户取消返回 null */
export async function pickLocalFile(suggestedName: string): Promise<LocalFileHandle | null> {
  const w = window as PickerWindow;
  if (!w.showSaveFilePicker) return null;
  try {
    return await w.showSaveFilePicker({
      suggestedName,
      types: [{ description: "番茄专注数据", accept: { "application/json": [".json"] } }],
    });
  } catch {
    return null; // 用户取消选择
  }
}

export async function writeToFile(handle: LocalFileHandle, text: string): Promise<boolean> {
  try {
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    return true;
  } catch {
    return false; // 权限失效等情况
  }
}
