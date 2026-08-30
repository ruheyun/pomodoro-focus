import { useMemo } from "react";
import type { Mode, Status } from "../types";
import { formatClock } from "../lib/date";

interface Props {
  remaining: number;
  total: number;
  status: Status;
  mode: Mode;
  cycle: number;
  longEvery: number;
}

const R = 150;
const CIRC = 2 * Math.PI * R;

const STATUS_TEXT: Record<Status, string> = {
  idle: "准备就绪",
  running: "进行中",
  paused: "已暂停",
};

const MODE_TEXT: Record<Mode, string> = {
  focus: "专注时间",
  short: "短休息",
  long: "长休息",
};

/** 中央计时表盘：刻度环 + 进度弧 + 大号数字 */
export default function TimerDial({ remaining, total, status, mode, cycle, longEvery }: Props) {
  const frac = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;

  const ticks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const major = i % 5 === 0;
        const r1 = major ? 164 : 169;
        const r2 = 176;
        return {
          x1: 180 + Math.cos(a) * r1,
          y1: 180 + Math.sin(a) * r1,
          x2: 180 + Math.cos(a) * r2,
          y2: 180 + Math.sin(a) * r2,
          major,
        };
      }),
    []
  );

  const filledDots = mode === "long" ? longEvery : cycle % longEvery;

  return (
    <div className="relative mt-8 aspect-square w-[min(80vw,390px)] sm:mt-10">
      {/* 运行中的呼吸光晕 */}
      <div
        className={`absolute -inset-10 rounded-full blur-3xl transition-opacity duration-1000 ${
          status === "running" ? "breathe opacity-100" : "opacity-0"
        }`}
        style={{ background: "radial-gradient(circle, var(--glow-strong), transparent 68%)" }}
        aria-hidden="true"
      />

      <svg viewBox="0 0 360 360" className="h-full w-full">
        {/* 刻度 */}
        <g>
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.major ? "rgba(255,244,234,0.32)" : "rgba(255,244,234,0.12)"}
              strokeWidth={t.major ? 2.4 : 1.4}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* 内衬底盘 */}
        <circle cx="180" cy="180" r="132" fill="rgba(255,244,234,0.025)" />

        {/* 轨道 */}
        <circle
          cx="180"
          cy="180"
          r={R}
          fill="none"
          stroke="rgba(255,244,234,0.08)"
          strokeWidth="11"
        />

        {/* 进度弧 */}
        <circle
          cx="180"
          cy="180"
          r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - frac)}
          transform="rotate(-90 180 180)"
          style={{
            transition:
              "stroke-dashoffset 0.3s linear, stroke 0.6s ease",
            filter: "drop-shadow(0 0 10px var(--glow-strong))",
          }}
        />
      </svg>

      {/* 中央信息 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p
          className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase"
          style={{ color: status === "paused" ? "#f5b95c" : "rgba(255,244,234,0.55)" }}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${status === "running" ? "blink" : ""}`}
            style={{
              background:
                status === "running" ? "var(--accent)" : status === "paused" ? "#f5b95c" : "rgba(255,244,234,0.35)",
            }}
          />
          {STATUS_TEXT[status]}
        </p>

        <p className="font-timer mt-3 text-[clamp(3.6rem,17vw,5.6rem)] font-semibold leading-none tracking-tight text-[#fff4ea]">
          {formatClock(remaining)}
        </p>

        <p className="mt-3 text-sm font-medium text-white/50">{MODE_TEXT[mode]}</p>

        {/* 长休息周期进度点 */}
        <div className="mt-4 flex items-center gap-1.5" aria-label={`本轮已完成 ${filledDots}/${longEvery} 个番茄`}>
          {Array.from({ length: longEvery }, (_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full transition-colors duration-500"
              style={{
                background: i < filledDots ? "var(--accent)" : "rgba(255,244,234,0.16)",
              }}
            />
          ))}
          <span className="font-timer ml-2 text-[11px] text-white/35">
            {filledDots}/{longEvery}
          </span>
        </div>
      </div>
    </div>
  );
}
