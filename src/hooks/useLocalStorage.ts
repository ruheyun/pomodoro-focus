import { useEffect, useState } from "react";

/** 与 localStorage 同步的 state；解析失败时回退到初始值 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 存储不可用时静默忽略 */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
