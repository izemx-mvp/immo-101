import { useSyncExternalStore } from "react";

interface UI { dark: boolean; reduceAnim: boolean; collapsed: boolean; tour: boolean; shortcuts: boolean; palette: boolean; profile: boolean; assistant: boolean; notifs: boolean; title: string; subtitle: string; simulate: boolean }
let ui: UI = { dark: false, reduceAnim: false, collapsed: false, tour: false, shortcuts: false, palette: false, profile: false, assistant: false, notifs: false, title: "", subtitle: "", simulate: false };
const ls = new Set<() => void>();
export const setUI = (p: Partial<UI>) => {
  ui = { ...ui, ...p };
  if ("dark" in p && typeof document !== "undefined") document.documentElement.classList.toggle("dark", ui.dark);
  ls.forEach((l) => l());
};
export const getUI = () => ui;
export function useUI<T>(sel: (u: UI) => T) {
  return useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l); }, () => sel(ui), () => sel(ui));
}
