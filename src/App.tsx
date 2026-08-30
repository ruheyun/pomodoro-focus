import { useCallback, useEffect, useRef, useState } from "react";
import type { Mode, Settings, StatsMap, Status } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { ensureAudio, playComplete, setMuted as setSoundMuted } from "./lib/sound";
import { formatClock, todayKey } from "./lib/date";
import ModeSwitch from "./components/ModeSwitch";
import TimerDial from "./components/TimerDial";
import Controls from "./components/Controls";
import StatsPanel from "./components/StatsPanel";
import SettingsPanel from "./components/SettingsPanel";
import Toast, { type ToastData } from "./components/Toast";
import TomatoGlyph from "./components/TomatoGlyph";

const DEFAULT_SETTINGS: Settings = {
  focus: 25,
  short: 5,
  long: 15,
  longEvery: 4,
  autoStart: false,
};

const MODE_LABEL: Record<Mode, string> = {
  focus: "专注",
  short: "短休息",
  long: "长休息",
};

export default function App() {
  const [settings, setSettings] = useLocalStorage<Settings>("tomato.settings.v1", DEFAULT_SETTINGS);
  const [stats, setStats] = useLocalStorage<StatsMap>("tomato.stats.v1", {});
  const [muted, setMuted] = useLocalStorage<boolean>("tomato.muted.v1", false);

  const [mode, setMode] = useState<Mode>("focus");
  const [status, setStatus] = useState<Status>("idle");
  /** 当前长休息周期内已完成的专注数 */
  const [cycle, setCycle] = useState(0);
  const [remaining, setRemaining] = useState(settings.focus * 60);
  const [toast, setToast] = useState<ToastData | null>(null);

  const endRef = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const cycleRef = useRef(cycle);
  cycleRef.current = cycle;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  /* 待机时让剩余时间跟随设置变化 */
  useEffect(() => {
    if (statusRef.current === "idle") setRemaining(settings[mode] * 60);
  }, [settings, mode]);

  useEffect(() => {
    setSoundMuted(muted);
  }, [muted]);

  /* 标签页标题实时显示倒计时 */
  useEffect(() => {
    document.title =
      status === "idle"
        ? "番茄专注 · Pomodoro Focus"
        : `${formatClock(remaining)} · ${MODE_LABEL[mode]}${status === "running" ? "中" : "（已暂停）"} — 番茄专注`;
  }, [remaining, status, mode]);

  const showToast = useCallback((msg: string) => {
    setToast({ id: Date.now(), msg });
  }, []);

  /* Toast 自动消失 */
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const switchMode = useCallback((m: Mode, auto: boolean) => {
    const t = settingsRef.current[m] * 60;
    modeRef.current = m;
    setMode(m);
    setRemaining(t);
    if (auto) {
      endRef.current = Date.now() + t * 1000;
      setStatus("running");
    } else {
      setStatus("idle");
    }
  }, []);

  /* 阶段完成的处理（在 interval 中经 ref 调用，避免闭包过期） */
  const completeRef = useRef<() => void>(() => {});
  completeRef.current = () => {
    const s = settingsRef.current;
    const m = modeRef.current;
    if (m === "focus") {
      const totalSec = s.focus * 60;
      setStats((prev) => {
        const k = todayKey();
        const d = prev[k] ?? { count: 0, seconds: 0 };
        return { ...prev, [k]: { count: d.count + 1, seconds: d.seconds + totalSec } };
      });
      const newCycle = cycleRef.current + 1;
      setCycle(newCycle);
      playComplete("focus");
      const next: Mode = newCycle % s.longEvery === 0 ? "long" : "short";
      switchMode(next, s.autoStart);
      showToast(next === "long" ? `第 ${newCycle} 个番茄达成，享受长休息` : "专注完成，短暂休息一下");
    } else {
      playComplete("break");
      switchMode("focus", s.autoStart);
      showToast("休息结束，回到专注");
    }
  };

  /* 计时主循环：基于时间戳，切后台也不会漂移 */
  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      const rem = Math.max(0, (endRef.current - Date.now()) / 1000);
      setRemaining(rem);
      if (rem <= 0) completeRef.current();
    }, 200);
    return () => window.clearInterval(id);
  }, [status]);

  const start = () => {
    ensureAudio();
    const base = remaining > 0 ? remaining : settingsRef.current[modeRef.current] * 60;
    endRef.current = Date.now() + base * 1000;
    setRemaining(base);
    setStatus("running");
  };

  const pause = () => {
    setRemaining(Math.max(0, (endRef.current - Date.now()) / 1000));
    setStatus("paused");
  };

  const reset = () => {
    setStatus("idle");
    setRemaining(settingsRef.current[modeRef.current] * 60);
  };

  const skip = () => {
    const next: Mode = modeRef.current === "focus" ? "short" : "focus";
    switchMode(next, false);
    showToast("已跳过当前阶段");
  };

  const handleModeChange = (m: Mode) => {
    if (m === modeRef.current) return;
    switchMode(m, false);
  };

  const updateSettings = (patch: Partial<Settings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const dateStr = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div data-mode={mode} className="relative min-h-screen overflow-x-hidden text-[#fff4ea]">
      {/* 环境背景层 */}
      <div className="glow glow-focus" aria-hidden="true" />
      <div className="glow glow-short" aria-hidden="true" />
      <div className="glow glow-long" aria-hidden="true" />
      <div className="ember" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-14 sm:px-8">
        {/* 页头 */}
        <header className="reveal flex items-center justify-between pt-7 sm:pt-9">
          <div className="flex items-center gap-3">
            <TomatoGlyph size={36} />
            <div>
              <h1 className="font-display text-xl font-bold leading-none tracking-tight">番茄专注</h1>
              <p className="mt-1.5 text-[10px] font-semibold tracking-[0.32em] text-white/35">
                POMODORO FOCUS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/45 sm:block">{dateStr}</span>
            <button
              onClick={() => setMuted((v) => !v)}
              aria-label={muted ? "开启提示音" : "关闭提示音"}
              title={muted ? "开启提示音" : "关闭提示音"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition-all duration-200 hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-90"
            >
              {muted ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                  <path d="m22 9-6 6M16 9l6 6" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* 主体 */}
        <main className="mt-6 grid items-start gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          {/* 计时区 */}
          <section className="reveal d1 flex flex-col items-center lg:pt-2">
            <ModeSwitch mode={mode} onChange={handleModeChange} />
            <TimerDial
              remaining={remaining}
              total={settings[mode] * 60}
              status={status}
              mode={mode}
              cycle={cycle}
              longEvery={settings.longEvery}
            />
            <Controls
              status={status}
              mode={mode}
              onStart={start}
              onPause={pause}
              onReset={reset}
              onSkip={skip}
            />
            <p className="mt-7 max-w-xs text-center text-xs leading-relaxed text-white/30">
              {mode === "focus"
                ? "保持专注，完成后自动进入休息；每 4 个番茄迎来一次长休息。"
                : "站起来走走，喝口水，让大脑放松一下。"}
            </p>
          </section>

          {/* 侧栏 */}
          <aside className="space-y-6">
            <div className="reveal d2">
              <StatsPanel stats={stats} onClear={() => setStats({})} />
            </div>
            <div className="reveal d3">
              <SettingsPanel settings={settings} onChange={updateSettings} />
            </div>
          </aside>
        </main>

        <footer className="reveal d4 mt-14 text-center text-xs text-white/25">
          所有数据仅保存在你的浏览器本地（localStorage），不会被上传。
        </footer>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
