export type Mode = "focus" | "short" | "long";

export type Status = "idle" | "running" | "paused";

export interface Settings {
  /** 专注时长（分钟） */
  focus: number;
  /** 短休息时长（分钟） */
  short: number;
  /** 长休息时长（分钟） */
  long: number;
  /** 每完成多少个番茄进入长休息 */
  longEvery: number;
  /** 阶段结束后自动开始下一阶段 */
  autoStart: boolean;
}

export interface DayStats {
  /** 完成的番茄数 */
  count: number;
  /** 专注秒数 */
  seconds: number;
}

/** 以 YYYY-MM-DD 为键的每日统计 */
export type StatsMap = Record<string, DayStats>;
