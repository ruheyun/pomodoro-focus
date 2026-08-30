import TomatoGlyph from "./TomatoGlyph";

export interface ToastData {
  id: number;
  msg: string;
}

interface Props {
  toast: ToastData | null;
}

/** 底部浮层提示，随 key 重新播放入场动画 */
export default function Toast({ toast }: Props) {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="toast-in fixed bottom-8 left-1/2 z-50 flex items-center gap-2.5 rounded-full border px-5 py-3 text-sm font-medium text-[#fff4ea] shadow-2xl"
      style={{
        borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)",
        background: "rgba(30, 17, 12, 0.94)",
        boxShadow: "0 18px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,244,234,0.03)",
      }}
    >
      <TomatoGlyph size={20} />
      {toast.msg}
    </div>
  );
}
