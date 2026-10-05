import * as React from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Columns3, Download, RefreshCw, Rows3, Search, X, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Empty, norm } from "@/components/kit";
import { toast } from "sonner";

export function useUrlState() {
  const search = useRouterState({ select: (s) => s.location.search }) as Record<string, unknown>;
  const navigate = useNavigate();
  const set = React.useCallback((patch: Record<string, unknown>) => {
    navigate({ to: ".", search: ((prev: Record<string, unknown>) => { const n = { ...prev, ...patch }; Object.keys(n).forEach((k) => (n[k] === undefined || n[k] === "" || n[k] === null) && delete n[k]); return n; }) as never, replace: true });
  }, [navigate]);
  return [search, set] as const;
}

export interface Col<T> { key: string; label: string; render: (r: T, q: string) => React.ReactNode; sort?: (r: T) => string | number; csv?: (r: T) => string | number; className?: string; hideable?: boolean; sticky?: boolean }
export interface Chip { key: string; label: string; onRemove: () => void }

interface Props<T> {
  id: string; rows: T[]; cols: Col<T>[]; rowKey: (r: T) => string; search?: (r: T) => string; placeholder?: string;
  toolbar?: React.ReactNode; chips?: Chip[]; onClearAll?: () => void; filterCount?: number; filterButton?: React.ReactNode;
  onOpen?: (r: T, list: T[]) => void; bulk?: (ids: string[], clear: () => void) => React.ReactNode; rowMenu?: (r: T) => React.ReactNode;
  empty?: React.ReactNode; selectable?: boolean; defaultSize?: number;
}

export function DataTable<T>(p: Props<T>) {
  const [sp, setSp] = useUrlState();
  const pre = p.id + "_";
  const q = String(sp[pre + "q"] ?? "");
  const page = Number(sp[pre + "page"] ?? 1);
  const size = Number(sp[pre + "size"] ?? p.defaultSize ?? 10);
  const sortKey = String(sp[pre + "sort"] ?? "");
  const dir = String(sp[pre + "dir"] ?? "desc");
  const [qLocal, setQLocal] = React.useState(q);
  const [hidden, setHidden] = React.useState<string[]>([]);
  const [dense, setDense] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [sel, setSel] = React.useState<Set<string>>(new Set());
  const [goto, setGoto] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t); }, []);
  React.useEffect(() => { const t = setTimeout(() => { if (qLocal !== q) setSp({ [pre + "q"]: qLocal, [pre + "page"]: undefined }); }, 250); return () => clearTimeout(t); }, [qLocal]);
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const filtered = React.useMemo(() => {
    let r = p.rows;
    if (q && p.search) { const nq = norm(q); r = r.filter((x) => norm(p.search!(x)).includes(nq)); }
    const c = p.cols.find((c) => c.key === sortKey);
    if (c?.sort) r = [...r].sort((a, b) => { const va = c.sort!(a), vb = c.sort!(b); const v = va < vb ? -1 : va > vb ? 1 : 0; return dir === "asc" ? v : -v; });
    return r;
  }, [p.rows, q, sortKey, dir]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * size, cur * size);
  const cols = p.cols.filter((c) => !hidden.includes(c.key));
  const allPage = slice.length > 0 && slice.every((r) => sel.has(p.rowKey(r)));

  const go = (n: number) => setSp({ [pre + "page"]: Math.max(1, Math.min(pages, n)) === 1 ? undefined : Math.max(1, Math.min(pages, n)) });
  const sortBy = (k: string) => setSp({ [pre + "sort"]: k, [pre + "dir"]: sortKey === k && dir === "desc" ? "asc" : "desc" });
  const exportCsv = (rows: T[]) => {
    const head = p.cols.filter((c) => c.csv).map((c) => c.label);
    const body = rows.map((r) => p.cols.filter((c) => c.csv).map((c) => `"${String(c.csv!(r)).replace(/"/g, '""')}"`).join(";"));
    const blob = new Blob(["\ufeff" + [head.join(";"), ...body].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `immo101-${p.id}.csv`; a.click();
    toast.success(`${rows.length} lignes exportées en CSV`);
  };
  const nums = React.useMemo(() => {
    const out: (number | "…")[] = [];
    for (let i = 1; i <= pages; i++) { if (i === 1 || i === pages || Math.abs(i - cur) <= 1) out.push(i); else if (out[out.length - 1] !== "…") out.push("…"); }
    return out;
  }, [pages, cur]);
  const clear = () => setSel(new Set());

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input ref={inputRef} value={qLocal} onChange={(e) => setQLocal(e.target.value)} placeholder={p.placeholder ?? "Rechercher…"} aria-label="Rechercher"
            className="h-9 w-full rounded-xl border bg-card pl-9 pr-20 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {qLocal && <button aria-label="Effacer la recherche" onClick={() => setQLocal("")} className="rounded p-1 hover:bg-muted"><X className="size-3.5" /></button>}
            <kbd className="rounded border px-1.5 text-[10px] text-muted-foreground">/</kbd>
          </div>
        </div>
        {p.toolbar}
        {p.filterButton}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Vues enregistrées"><Bookmark /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuLabel>Vues enregistrées</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => { setSp({ [pre + "sort"]: "score", [pre + "dir"]: "desc" }); toast("Vue « Meilleurs scores » appliquée"); }}>Meilleurs scores</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSp({ [pre + "sort"]: "recu", [pre + "dir"]: "desc" }); toast("Vue « Plus récents » appliquée"); }}>Plus récents</DropdownMenuItem>
            <DropdownMenuSeparator /><DropdownMenuItem onClick={() => toast.success("Vue actuelle enregistrée")}>Enregistrer la vue actuelle</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Colonnes"><Columns3 /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
            {p.cols.filter((c) => c.hideable !== false && c.label).map((c) => (
              <DropdownMenuCheckboxItem key={c.key} checked={!hidden.includes(c.key)} onCheckedChange={(v) => setHidden((h) => (v ? h.filter((x) => x !== c.key) : [...h, c.key]))} onSelect={(e) => e.preventDefault()}>{c.label}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon" aria-label="Densité" aria-pressed={dense} onClick={() => setDense((d) => !d)}><Rows3 /></Button>
        <Button variant="outline" size="icon" aria-label="Exporter en CSV" onClick={() => exportCsv(filtered)}><Download /></Button>
        <Button variant="outline" size="icon" aria-label="Actualiser" onClick={() => { setLoading(true); setError(false); setTimeout(() => setLoading(false), 600); }}><RefreshCw className={cn(loading && "animate-spin")} /></Button>
      </div>
      {(p.chips?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {p.chips!.map((c) => <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary">{c.label}<button aria-label={`Retirer ${c.label}`} onClick={c.onRemove}><X className="size-3" /></button></span>)}
          <button className="text-xs text-muted-foreground underline" onClick={p.onClearAll}>Tout effacer</button>
        </div>
      )}
      <p className="text-xs text-muted-foreground tnum" aria-live="polite">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</p>

      {p.selectable && allPage && sel.size < filtered.length && (
        <div className="rounded-xl bg-primary-soft px-3 py-2 text-xs text-primary">{sel.size} sélectionnés sur cette page. <button className="font-semibold underline" onClick={() => setSel(new Set(filtered.map(p.rowKey)))}>Sélectionner les {filtered.length} résultats</button></div>
      )}

      <div className="relative max-h-[640px] overflow-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              {p.selectable && <th className="sticky left-0 z-20 w-10 bg-card px-3 py-3"><Checkbox aria-label="Sélectionner la page" checked={allPage} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); slice.forEach((r) => (v ? n.add(p.rowKey(r)) : n.delete(p.rowKey(r)))); return n; })} /></th>}
              {cols.map((c) => (
                <th key={c.key} className={cn("px-3 py-3 font-medium", c.sticky && "sticky left-10 z-20 bg-card", c.className)}>
                  {c.sort ? <button onClick={() => sortBy(c.key)} className="inline-flex items-center gap-1 hover:text-foreground">{c.label}{sortKey === c.key ? (dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}</button> : c.label}
                </th>
              ))}
              {p.rowMenu && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: Math.min(size, 8) }).map((_, i) => (
              <tr key={i} className="border-b"><td colSpan={cols.length + 2} className="px-3 py-3"><Skeleton className="h-6 w-full" /></td></tr>
            )) : error ? (
              <tr><td colSpan={cols.length + 2}><Empty title="Impossible de charger les données" action={<Button onClick={() => setError(false)}>Réessayer</Button>} /></td></tr>
            ) : slice.length === 0 ? (
              <tr><td colSpan={cols.length + 2}>{p.empty ?? <Empty title="Aucun résultat" text="Essayez d'élargir votre recherche ou de retirer des filtres." action={<Button variant="outline" onClick={() => { setQLocal(""); p.onClearAll?.(); }}>Effacer les filtres</Button>} />}</td></tr>
            ) : slice.map((r, i) => {
              const k = p.rowKey(r);
              return (
                <motion.tr key={k} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                  onClick={() => p.onOpen?.(r, filtered)} className={cn("group border-b last:border-0 hover:bg-muted/50", p.onOpen && "cursor-pointer", sel.has(k) && "bg-primary-soft")}>
                  {p.selectable && <td className="sticky left-0 z-[1] bg-card px-3 group-hover:bg-muted" onClick={(e) => e.stopPropagation()}><Checkbox aria-label="Sélectionner" checked={sel.has(k)} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); v ? n.add(k) : n.delete(k); return n; })} /></td>}
                  {cols.map((c) => <td key={c.key} className={cn("px-3", dense ? "py-1.5" : "py-3", c.sticky && "sticky left-10 z-[1] bg-card group-hover:bg-muted", c.className)}>{c.render(r, q)}</td>)}
                  {p.rowMenu && <td className="px-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Actions"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{p.rowMenu(r)}</DropdownMenuContent></DropdownMenu>
                  </td>}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="tnum">Affichage {filtered.length ? (cur - 1) * size + 1 : 0}–{Math.min(cur * size, filtered.length)} sur {filtered.length} résultats</span>
        <div className="flex flex-wrap items-center gap-1">
          <select aria-label="Résultats par page" value={size} onChange={(e) => setSp({ [pre + "size"]: e.target.value, [pre + "page"]: undefined })} className="h-8 rounded-lg border bg-card px-2">
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <Button variant="ghost" size="icon" aria-label="Première page" disabled={cur === 1} onClick={() => go(1)}><ChevronsLeft /></Button>
          <Button variant="ghost" size="icon" aria-label="Page précédente" disabled={cur === 1} onClick={() => go(cur - 1)}><ChevronLeft /></Button>
          {nums.map((n, i) => n === "…" ? <span key={"e" + i} className="px-1">…</span> : <Button key={n} size="sm" variant={n === cur ? "default" : "ghost"} className="tnum" aria-current={n === cur ? "page" : undefined} onClick={() => go(n)}>{n}</Button>)}
          <Button variant="ghost" size="icon" aria-label="Page suivante" disabled={cur === pages} onClick={() => go(cur + 1)}><ChevronRight /></Button>
          <Button variant="ghost" size="icon" aria-label="Dernière page" disabled={cur === pages} onClick={() => go(pages)}><ChevronsRight /></Button>
          <form onSubmit={(e) => { e.preventDefault(); go(Number(goto)); setGoto(""); }} className="ml-2 flex items-center gap-1">
            <label htmlFor={p.id + "goto"}>Aller à la page</label>
            <input id={p.id + "goto"} value={goto} onChange={(e) => setGoto(e.target.value.replace(/\D/g, ""))} className="h-8 w-12 rounded-lg border bg-card px-2 tnum" />
          </form>
        </div>
      </div>

      <AnimatePresence>
        {p.bulk && sel.size > 0 && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-ink-foreground shadow-2xl">
            <span className="text-sm tnum">{sel.size} sélectionné{sel.size > 1 ? "s" : ""}</span>
            <span className="mx-1 h-5 w-px bg-ink-line" />
            {p.bulk([...sel], clear)}
            <Button size="sm" variant="ghost" className="text-ink-foreground hover:bg-ink-line hover:text-ink-foreground" onClick={() => exportCsv(filtered.filter((r) => sel.has(p.rowKey(r))))}>Exporter</Button>
            <button aria-label="Annuler la sélection" onClick={clear} className="rounded p-1 hover:bg-ink-line"><X className="size-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DrawerNav<T>({ list, current, rowKey, onGo }: { list: T[]; current: string; rowKey: (r: T) => string; onGo: (r: T) => void }) {
  const i = list.findIndex((r) => rowKey(r) === current);
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Button variant="ghost" size="icon" aria-label="Précédent" disabled={i <= 0} onClick={() => onGo(list[i - 1])}><ChevronLeft /></Button>
      <span className="tnum">{i + 1} / {list.length}</span>
      <Button variant="ghost" size="icon" aria-label="Suivant" disabled={i < 0 || i >= list.length - 1} onClick={() => onGo(list[i + 1])}><ChevronRight /></Button>
    </div>
  );
}
