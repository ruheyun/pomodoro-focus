import type { Settings } from "../types";

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  className?: string;
}

type NumKey = "focus" | "short" | "long" | "longEvery";

const ROWS: { key: NumKey; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "focus", label: "专注时长", min: 5, max: 90, step: 5, unit: "分钟" },
  { key: "short", label: "短休息时长", min: 1, max: 30, step: 1, unit: "分钟" },
  { key: "long", label: "长休息时长", min: 5, max: 60, step: 5, unit: "分钟" },
  { key: "longEvery", label: "长休息间隔", min: 2, max: 8, step: 1, unit: "个番茄" },
];

/** 自定义时长与偏好设置 */
export default function SettingsPanel({ settings, onChange, className = "" }: Props) {
  return (
    <section className={`rounded-[26px] border border-white/[0.07] bg-white/[0.035] p-6 sm:p-7 ${className}`}>
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-colors duration-500">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
        </svg>
        <h2 className="font-display text-lg font-bold tracking-tight text-[#fff4ea]">偏好设置</h2>
      </div>

      <div className="mt-3">
        {ROWS.map((row) => {
          const value = settings[row.key];
          const atMin = value <= row.min;
          const atMax = value >= row.max;
          return (
            <div
              key={row.key}
              className="flex items-center justify-between border-b border-white/[0.06] py-3.5 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-white/75">{row.label}</p>
                <p className="mt-0.5 text-[11px] text-white/30">
                  {row.min}–{row.max} {row.unit}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => !atMin && onChange({ [row.key]: value - row.step } as Partial<Settings>)}
                  disabled={atMin}
                  aria-label={`减少${row.label}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/55 transition-all duration-200 hover:border-white/30 hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-25"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span className="font-timer w-[4.6rem] text-center text-sm font-semibold text-[#fff4ea]">
                  {value}
                  <span className="ml-1 text-[11px] font-medium text-white/35">{row.unit}</span>
                </span>
                <button
                  onClick={() => !atMax && onChange({ [row.key]: value + row.step } as Partial<Settings>)}
                  disabled={atMax}
                  aria-label={`增加${row.label}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/55 transition-all duration-200 hover:border-white/30 hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-25"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {/* 自动开始 */}
        <div className="flex items-center justify-between py-3.5">
          <div>
            <p className="text-sm font-medium text-white/75">自动开始下一阶段</p>
            <p className="mt-0.5 text-[11px] text-white/30">阶段结束后无缝衔接下一个计时</p>
          </div>
          <button
            role="switch"
            aria-checked={settings.autoStart}
            aria-label="自动开始下一阶段"
            onClick={() => onChange({ autoStart: !settings.autoStart })}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300"
            style={{ background: settings.autoStart ? "var(--accent)" : "rgba(255,244,234,0.14)" }}
          >
            <span
              className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[#fff4ea] shadow transition-transform duration-300"
              style={{ transform: settings.autoStart ? "translateX(20px)" : "none" }}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
