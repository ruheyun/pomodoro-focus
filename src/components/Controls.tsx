import type { Mode, Status } from "../types";

interface Props {
  status: Status;
  mode: Mode;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 2.8-6.5" />
      <path d="M3 3v5.5h5.5" />
    </svg>
  );
}

function IconSkip() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
      <path d="M6 5.5v13a.6.6 0 0 0 .93.5l9.07-6.5a.6.6 0 0 0 0-1L6.93 5a.6.6 0 0 0-.93.5Z" />
      <rect x="17.4" y="5" width="2.4" height="14" rx="1.1" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M8 5.6v12.8a.6.6 0 0 0 .92.51l10.2-6.4a.6.6 0 0 0 0-1.02L8.92 5.1A.6.6 0 0 0 8 5.6Z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" />
    </svg>
  );
}

/** 开始 / 暂停 / 继续 主按钮 + 重置、跳过 */
export default function Controls({ status, mode, onStart, onPause, onReset, onSkip }: Props) {
  const running = status === "running";
  const label = running ? "暂停" : status === "paused" ? "继续" : mode === "focus" ? "开始专注" : "开始休息";

  return (
    <div className="mt-9 flex items-center gap-4 sm:mt-10">
      <button
        onClick={onReset}
        title="重置"
        aria-label="重置计时"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition-all duration-200 hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-90"
      >
        <IconReset />
      </button>

      <button
        onClick={running ? onPause : onStart}
        className="flex h-14 min-w-[196px] items-center justify-center gap-2.5 rounded-full px-10 text-lg font-bold tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.97]"
        style={{
          background: "var(--accent)",
          color: "var(--accent-ink)",
          boxShadow: "0 14px 44px -10px var(--glow-strong)",
        }}
      >
        {running ? <IconPause /> : <IconPlay />}
        {label}
      </button>

      <button
        onClick={onSkip}
        title="跳过当前阶段"
        aria-label="跳过当前阶段"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition-all duration-200 hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-90"
      >
        <IconSkip />
      </button>
    </div>
  );
}
