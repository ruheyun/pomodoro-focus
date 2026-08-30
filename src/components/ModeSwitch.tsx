import type { Mode } from "../types";

const MODES: { id: Mode; label: string }[] = [
  { id: "focus", label: "专注" },
  { id: "short", label: "短休息" },
  { id: "long", label: "长休息" },
];

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

/** 专注 / 短休息 / 长休息 分段切换，滑块跟随当前模式 */
export default function ModeSwitch({ mode, onChange }: Props) {
  const index = MODES.findIndex((m) => m.id === mode);

  return (
    <div
      role="tablist"
      aria-label="计时模式"
      className="relative grid w-full max-w-sm grid-cols-3 rounded-full border border-white/[0.07] bg-white/[0.05] p-1"
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1 top-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full transition-transform duration-300 ease-out"
        style={{
          background: "var(--accent)",
          transform: `translateX(${index * 100}%)`,
          boxShadow: "0 6px 24px -6px var(--glow-strong)",
        }}
      />
      {MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className={`relative z-10 rounded-full py-2 text-sm font-bold tracking-wide transition-colors duration-300 ${
              active ? "" : "text-white/50 hover:text-white"
            }`}
            style={active ? { color: "var(--accent-ink)", mixBlendMode: "normal" } : undefined}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
