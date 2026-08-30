import { useEffect, useRef, useState } from "react";
import type { StatsMap } from "../types";
import { formatDuration, todayKey, weekdayLabel } from "../lib/date";

interface Props {
  stats: StatsMap;
  onClear: () => void;
}

/** 小番茄计数图标：已完成着色，未完成描边 */
function TomatoDot({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="19" height="19" aria-hidden="true">
      <path
        d="M10 5.2c-.3-1.4.1-2.6 1.2-3.7"
        fill="none"
        stroke={filled ? "#6fbf7f" : "rgba(255,244,234,0.22)"}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 5.4c-1.7-1.6-4-1.8-5.6-.9 1.2 1.4 3.2 1.9 5.6.9Zm0 0c1.7-1.6 4-1.8 5.6-.9-1.2 1.4-3.2 1.9-5.6.9Z"
        fill={filled ? "#5aa86b" : "rgba(255,244,234,0.22)"}
      />
      {filled ? (
        <circle cx="10" cy="12" r="6.4" fill="var(--accent)" />
      ) : (
        <circle cx="10" cy="12" r="6.4" fill="none" stroke="rgba(255,244,234,0.2)" strokeWidth="1.5" />
      )}
    </svg>
  );
}

/** 今日统计 + 最近 7 天柱状图 + 累计与清空 */
export default function StatsPanel({ stats, onClear }: Props) {
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    },
    []
  );

  const today = stats[todayKey()] ?? { count: 0, seconds: 0 };

  const days = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const key = todayKey(d);
    return {
      key,
      label: idx === 6 ? "今" : weekdayLabel(d),
      minutes: Math.round((stats[key]?.seconds ?? 0) / 60),
      count: stats[key]?.count ?? 0,
      isToday: idx === 6,
    };
  });
  const maxMin = Math.max(...days.map((d) => d.minutes), 1);

  const allCount = Object.values(stats).reduce((s, d) => s + d.count, 0);
  const allSeconds = Object.values(stats).reduce((s, d) => s + d.seconds, 0);
  const allHours = (allSeconds / 3600).toFixed(1);

  const handleClear = () => {
    if (!confirming) {
      setConfirming(true);
      confirmTimer.current = window.setTimeout(() => setConfirming(false), 2600);
      return;
    }
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    setConfirming(false);
    onClear();
  };

  const shown = Math.min(today.count, 12);

  return (
    <section className="rounded-[26px] border border-white/[0.07] bg-white/[0.035] p-6 sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-[#fff4ea]">今日专注</h2>
        <span className="font-timer text-[11px] text-white/35">{todayKey()}</span>
      </div>

      {/* 主数字 */}
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-white/45">完成番茄</p>
          <p
            className="font-timer mt-1.5 text-6xl font-semibold leading-none transition-colors duration-500"
            style={{ color: today.count > 0 ? "var(--accent)" : "rgba(255,244,234,0.28)" }}
          >
            {today.count}
          </p>
        </div>
        <div className="pb-1 text-right">
          <p className="text-xs text-white/45">专注时长</p>
          <p className="font-timer mt-1.5 text-2xl font-semibold text-[#fff4ea]">
            {formatDuration(today.seconds)}
          </p>
        </div>
      </div>

      {/* 番茄点阵 */}
      <div className="mt-4 flex min-h-[19px] flex-wrap items-center gap-1.5">
        {today.count === 0 ? (
          <span className="text-xs text-white/30">还没有记录，完成第一个番茄吧</span>
        ) : (
          <>
            {Array.from({ length: shown }, (_, i) => (
              <TomatoDot key={i} filled />
            ))}
            {today.count > shown && (
              <span className="font-timer ml-1 text-xs text-white/45">+{today.count - shown}</span>
            )}
          </>
        )}
      </div>

      {/* 最近 7 天 */}
      <div className="mt-7">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-bold text-white/70">最近 7 天</h3>
          <span className="text-[11px] text-white/30">分钟 / 天</span>
        </div>
        <div className="mt-3 flex h-24 items-end gap-2">
          {days.map((d) => (
            <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-black/75 px-2 py-0.5 text-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                role="tooltip"
              >
                <p className="font-timer text-[11px] leading-tight text-white">{d.minutes} 分钟</p>
                <p className="font-timer text-[10px] leading-tight text-white/50">{d.count} 个番茄</p>
              </div>
              <div
                className={`bar rounded-t-[5px] transition-colors duration-300 group-hover:brightness-125 ${
                  d.minutes === 0 ? "opacity-40" : ""
                }`}
                style={{
                  height: `${Math.max(5, (d.minutes / maxMin) * 100)}%`,
                  background: d.isToday ? "var(--accent)" : "rgba(255,244,234,0.14)",
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {days.map((d) => (
            <span
              key={d.key}
              className="flex-1 text-center text-[11px] font-medium"
              style={{ color: d.isToday ? "var(--accent)" : "rgba(255,244,234,0.35)" }}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* 累计 + 清空 */}
      <div className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-5">
        <p className="text-xs text-white/40">
          累计 <span className="font-timer font-semibold text-white/70">{allCount}</span> 个番茄 ·{" "}
          <span className="font-timer font-semibold text-white/70">{allHours}</span> 小时
        </p>
        <button
          onClick={handleClear}
          className="text-xs font-medium transition-colors duration-200"
          style={{ color: confirming ? "#ff8a70" : "rgba(255,244,234,0.35)" }}
          onMouseEnter={(e) => {
            if (!confirming) e.currentTarget.style.color = "rgba(255,244,234,0.7)";
          }}
          onMouseLeave={(e) => {
            if (!confirming) e.currentTarget.style.color = "rgba(255,244,234,0.35)";
          }}
        >
          {confirming ? "再点一次确认清空" : "清空数据"}
        </button>
      </div>
    </section>
  );
}
