// Hidden consistency check (not shown in UI): verifies the seeded store matches the brief.
import type { State } from "./seed";

export function checkConsistency(s: State): string[] {
  const errs: string[] = [];
  const n = s.leads.length;
  const sum = (f: (l: State["leads"][number]) => string) => Object.values(s.leads.reduce((a, l) => ((a[f(l)] = (a[f(l)] ?? 0) + 1), a), {} as Record<string, number>)).reduce((a, b) => a + b, 0);
  if (n !== 120) errs.push(`leads=${n}`);
  if (sum((l) => l.status) !== 120) errs.push("statuses");
  if (sum((l) => l.source) !== 120) errs.push("sources");
  if (sum((l) => l.type) !== 120) errs.push("types");
  if (s.leads.filter((l) => l.status === "client").length !== 12) errs.push("clients");
  if (s.leads.filter((l) => l.status !== "nouveau" && l.status !== "perdu").length !== 93) errs.push("qualified");
  if (s.leads.filter((l) => l.status === "rdv").length !== 16) errs.push("rdv");
  if (s.leads.filter((l) => l.advisor).length !== 102) errs.push("assigned");
  if (s.leads.filter((l) => l.reprendre).length !== 11) errs.push("reprendre");
  return errs;
}
