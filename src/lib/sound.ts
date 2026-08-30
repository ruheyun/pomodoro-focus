let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean): void {
  muted = m;
}

/** 在用户手势中调用，确保 AudioContext 可用 */
export function ensureAudio(): void {
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, at: number, dur: number, vol: number): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

/** 阶段完成的提示音：专注结束上行，休息结束下行 */
export function playComplete(kind: "focus" | "break"): void {
  if (muted || !ctx) return;
  const t = ctx.currentTime + 0.03;
  if (kind === "focus") {
    tone(659.25, t, 0.3, 0.16);
    tone(880, t + 0.16, 0.34, 0.15);
    tone(1318.5, t + 0.32, 0.45, 0.09);
  } else {
    tone(880, t, 0.28, 0.15);
    tone(659.25, t + 0.15, 0.32, 0.13);
    tone(440, t + 0.3, 0.45, 0.11);
  }
}
