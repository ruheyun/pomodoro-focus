import { useEffect, useRef, useState } from "react";
import type { Settings, StatsMap } from "../types";
import {
  downloadText,
  parseData,
  pickLocalFile,
  serializeData,
  supportsFilePicker,
  writeToFile,
  type LocalFileHandle,
  type PomodoroData,
} from "../lib/data";
import { todayKey } from "../lib/date";

interface Props {
  settings: Settings;
  stats: StatsMap;
  onImported: (data: PomodoroData) => void;
  notify: (msg: string) => void;
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4 17v2.2A1.8 1.8 0 0 0 5.8 21h12.4a1.8 1.8 0 0 0 1.8-1.8V17" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 14V3" />
      <path d="m7.5 7.5 4.5-4.5L16.5 7.5" />
      <path d="M4 17v2.2A1.8 1.8 0 0 0 5.8 21h12.4a1.8 1.8 0 0 0 1.8-1.8V17" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12h6" />
      <path d="M15 7h2a4 4 0 0 1 0 8h-2" />
      <path d="M9 15H7a4 4 0 0 1 0-8h2" />
    </svg>
  );
}

/**
 * 数据管理：导出 / 导入 JSON 文件；
 * 在支持的浏览器（Chrome / Edge）中可关联一个本地文件实现自动保存，
 * 换电脑时带上该文件即可。
 */
export default function DataPanel({ settings, stats, onImported, notify }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleRef = useRef<LocalFileHandle | null>(null);
  const [linkedName, setLinkedName] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const pickerSupported = supportsFilePicker();

  /* 关联文件后，数据每次变化自动写入本地文件 */
  useEffect(() => {
    if (!handleRef.current) return;
    const id = window.setTimeout(async () => {
      const ok = await writeToFile(handleRef.current!, serializeData(settings, stats));
      if (ok) {
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 1200);
      } else {
        handleRef.current = null;
        setLinkedName(null);
        notify("本地文件写入失败，可能需要重新关联");
      }
    }, 400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, stats]);

  const handleExport = () => {
    downloadText(`tomato-focus-data-${todayKey()}.json`, serializeData(settings, stats));
    notify("已导出 JSON 数据文件");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = parseData(text);
      if (!data) {
        notify("文件无效，导入失败");
        return;
      }
      onImported(data);
    } catch {
      notify("文件读取失败");
    }
  };

  const handleLink = async () => {
    const handle = await pickLocalFile("tomato-focus-data.json");
    if (!handle) return;
    handleRef.current = handle;
    setLinkedName(handle.name);
    const ok = await writeToFile(handle, serializeData(settings, stats));
    notify(ok ? "已关联本地文件，将自动保存" : "关联成功，但首次写入失败");
  };

  const handleUnlink = () => {
    handleRef.current = null;
    setLinkedName(null);
    notify("已断开本地文件关联");
  };

  return (
    <section className="rounded-[26px] border border-white/[0.07] bg-white/[0.035] p-6 sm:p-7">
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-colors duration-500">
          <path d="M12 21c4.8 0 8.5-3.6 8.5-8.2 0-3-1.6-5.4-3.4-7.2C15.4 4 13.5 3 12 3S8.6 4 6.9 5.6c-1.8 1.8-3.4 4.2-3.4 7.2C3.5 17.4 7.2 21 12 21Z" />
          <path d="M12 21v-6M12 15l-2.6-2.4M12 15l2.6-2.4" />
        </svg>
        <h2 className="font-display text-lg font-bold tracking-tight text-[#fff4ea]">数据管理</h2>
      </div>

      {/* 导出 / 导入 */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.97]"
          style={{ background: "var(--accent)", color: "var(--accent-ink)", boxShadow: "0 10px 30px -10px var(--glow-strong)" }}
        >
          <IconDownload />
          导出 JSON
        </button>
        <button
          onClick={handleImportClick}
          className="flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white active:translate-y-0 active:scale-[0.97]"
        >
          <IconUpload />
          导入 JSON
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChosen} />

      {/* 本地文件自动同步 */}
      {pickerSupported && (
        <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          {linkedName ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-white/85">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--accent)" }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
                  </span>
                  <span className="truncate">{linkedName}</span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/35">
                  {savedFlash ? "刚刚已自动保存" : "已连接 · 数据变化时自动写入该文件"}
                </p>
              </div>
              <button
                onClick={handleUnlink}
                className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/50 transition-all duration-200 hover:border-white/30 hover:text-white active:scale-95"
              >
                断开
              </button>
            </div>
          ) : (
            <button
              onClick={handleLink}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-white/20 px-4 py-2.5 text-sm font-semibold text-white/60 transition-all duration-200 hover:border-white/40 hover:bg-white/[0.05] hover:text-white active:scale-[0.98]"
            >
              <IconLink />
              关联本地文件 · 自动保存
            </button>
          )}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-white/30">
        换电脑使用：在旧电脑「导出 JSON」，把文件带到新电脑「导入」即可。
        同一天数据取较大值，重复导入不会重复累加。
        {pickerSupported ? "" : "当前浏览器不支持文件自动同步，可使用导出 / 导入。"}
      </p>
    </section>
  );
}
