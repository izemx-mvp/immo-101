import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Zap, Upload, Download, SlidersHorizontal, LayoutList, Columns3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { DataTable, DrawerNav, useUrlState, type Col, type Chip } from "@/components/DataTable";
import { Avatar, Highlight, Panel, Pill, Progress, ScoreRing, Seg, SourceIcon, StatusBadge, TempBadge, TypeBadge, ago, fmtDateTime, AiNote } from "@/components/kit";
import { usePageMeta } from "@/components/AppShell";
import { PageAction } from "@/components/PageAction";
import { AssignDialog, ImportDialog, NewLeadDialog, SimulateDialog, StatusDialog, Confirm } from "@/components/lead/LeadDialogs";
import { completion, projectSummary, keyFacts, nextAction } from "@/components/lead/helpers";
import { actions, useStore } from "@/lib/store";
import { ADVISORS, type Lead } from "@/lib/seed";
import { LEAD_TYPES, QUARTIERS, SOURCES, SOURCE_LABEL, STATUSES, STATUS_LABEL, TEMP_LABEL, TYPE_PLURAL, type Status } from "@/lib/domain";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/prospection/")({
  head: () => ({ meta: [{ title: "Prospection — Immo101 Backoffice IA" }, { name: "description", content: "Leads entrants WhatsApp, email, site web et Instagram, qualifiés par l'IA." }, { property: "og:title", content: "Prospection — Immo101" }, { property: "og:description", content: "Leads entrants qualifiés par l'agent IA." }] }),
  component: Prospection,
});

function Prospection() {
  const leads = useStore((s) => s.leads);
  const props = useStore((s) => s.properties);
  usePageMeta("Prospection", `${leads.length} leads entrants : WhatsApp, email, site web, Instagram`);
  const navigate = useNavigate();
  const [sp, setSp] = useUrlState();
  const f = { type: sp.type as string | undefined, source: sp.source as string | undefined, status: sp.status as string | undefined, temp: sp.temp as string | undefined, adv: sp.adv as string | undefined, sans: sp.sans === "1" || sp.sans === 1, reprendre: sp.reprendre === "1" || sp.reprendre === 1, abroad: sp.abroad === "1", quartier: sp.quartier as string | undefined, lang: sp.lang as string | undefined, qualified: sp.qualified === "1" || sp.qualified === 1, smin: Number(sp.smin ?? 0), smax: Number(sp.smax ?? 100) };
  const view = (sp.view as string) ?? "table";
  const [panel, setPanel] = React.useState(false);
  const [drawer, setDrawer] = React.useState<{ id: string; list: Lead[] } | null>(null);
  const [dlg, setDlg] = React.useState<"new" | "sim" | "import" | null>(null);
  const [bulk, setBulk] = React.useState<{ kind: "assign" | "status"; ids: string[]; clear: () => void } | null>(null);
  const [bulkStatus, setBulkStatus] = React.useState<Status>("contacte");
  const [kanbanDrop, setKanbanDrop] = React.useState<{ lead: Lead; s: Status } | null>(null);
  const [del, setDel] = React.useState<string | null>(null);
  const set = (p: Record<string, unknown>) => setSp({ ...p, lp_page: undefined });

  const rows = leads.filter((l) => (!f.type || l.type === f.type) && (!f.source || l.source === f.source) && (!f.status || l.status === f.status) && (!f.temp || l.temp === f.temp) && (!f.adv || l.advisor === f.adv) && (!f.sans || !l.advisor) && (!f.reprendre || l.reprendre) && (!f.abroad || l.abroad) && (!f.quartier || l.quartier === f.quartier) && (!f.lang || l.lang === f.lang) && (!f.qualified || (l.status !== "nouveau" && l.status !== "perdu")) && l.score >= f.smin && l.score <= f.smax);
  const typeBase = leads.filter((l) => true);

  const chips: Chip[] = [];
  const addChip = (k: string, label: string) => chips.push({ key: k, label, onRemove: () => set({ [k]: undefined }) });
  if (f.source) addChip("source", SOURCE_LABEL[f.source as keyof typeof SOURCE_LABEL]);
  if (f.status) addChip("status", STATUS_LABEL[f.status as Status]);
  if (f.temp) addChip("temp", TEMP_LABEL[f.temp as keyof typeof TEMP_LABEL]);
  if (f.adv) addChip("adv", f.adv);
  if (f.sans) addChip("sans", "Sans conseiller");
  if (f.reprendre) addChip("reprendre", "À reprendre");
  if (f.abroad) addChip("abroad", "Résident à l'étranger");
  if (f.quartier) addChip("quartier", f.quartier);
  if (f.lang) addChip("lang", "Langue " + f.lang);
  if (f.qualified) addChip("qualified", "Qualifiés IA");
  if (f.smin > 0 || f.smax < 100) chips.push({ key: "score", label: `Score ${f.smin}–${f.smax}`, onRemove: () => set({ smin: undefined, smax: undefined }) });
  const clearAll = () => set({ source: undefined, status: undefined, temp: undefined, adv: undefined, sans: undefined, reprendre: undefined, abroad: undefined, quartier: undefined, lang: undefined, qualified: undefined, smin: undefined, smax: undefined });

  const cols: Col<Lead>[] = [
    { key: "nom", label: "Nom", sticky: true, sort: (l) => l.name, csv: (l) => l.name, render: (l, q) => (
      <div className="flex min-w-[220px] items-center gap-3"><Avatar name={l.name} /><div className="min-w-0"><p className="flex items-center gap-1.5 font-medium"><Highlight text={l.name} q={q} />{l.reprendre && <span className="rounded-full bg-danger-soft px-1.5 py-0.5 text-[10px] font-semibold text-danger">À reprendre</span>}</p><p className="max-w-[260px] truncate text-xs text-muted-foreground">{l.message}</p></div></div>) },
    { key: "type", label: "Type", csv: (l) => l.type, render: (l) => <TypeBadge t={l.type} short /> },
    { key: "projet", label: "Projet", csv: (l) => projectSummary(l, props), render: (l, q) => <span className="block max-w-[280px] truncate text-xs"><Highlight text={projectSummary(l, props)} q={q} /></span> },
    { key: "source", label: "Source", csv: (l) => SOURCE_LABEL[l.source], render: (l) => <SourceIcon s={l.source} /> },
    { key: "conseiller", label: "Conseiller", csv: (l) => l.advisor ?? "", render: (l) => <Avatar name={l.advisor} size={28} /> },
    { key: "qualif", label: "Qualification", sort: completion, csv: completion, render: (l) => <div className="w-24"><Progress value={completion(l)} /><span className="text-[11px] text-muted-foreground tnum">{completion(l)} %</span></div> },
    { key: "score", label: "Score IA", sort: (l) => l.score, csv: (l) => l.score, render: (l) => <div className="flex items-center gap-2"><span className="w-6 font-semibold tnum">{l.score}</span><TempBadge t={l.temp} /></div> },
    { key: "statut", label: "Statut", sort: (l) => STATUSES.indexOf(l.status), csv: (l) => STATUS_LABEL[l.status], render: (l) => <StatusBadge s={l.status} sub={l.statusSub} /> },
    { key: "recu", label: "Reçu", sort: (l) => l.receivedAt, csv: (l) => new Date(l.receivedAt).toISOString(), render: (l) => <span className="whitespace-nowrap text-xs text-muted-foreground">{ago(l.receivedAt)}</span> },
  ];

  const tabs = [{ value: "all", label: `Tous ${typeBase.length}` }, ...LEAD_TYPES.map((t) => ({ value: t, label: `${TYPE_PLURAL[t]} ${typeBase.filter((l) => l.type === t).length}` }))];
  const quick = [
    { k: "status", v: "nouveau", label: "Nouveaux", n: leads.filter((l) => l.status === "nouveau").length },
    { k: "temp", v: "chaud", label: "Chauds", n: leads.filter((l) => l.temp === "chaud").length },
    { k: "sans", v: "1", label: "Sans conseiller", n: leads.filter((l) => !l.advisor).length },
    { k: "reprendre", v: "1", label: "À reprendre", n: leads.filter((l) => l.reprendre).length },
  ];
  const dl = drawer ? leads.find((l) => l.id === drawer.id) : null;
  const open = (id: string) => navigate({ to: "/prospection/$leadId", params: { leadId: id } });

  return (
    <div className="space-y-4">
      <PageAction>
        <Button variant="outline" onClick={() => setDlg("sim")}><Zap />Simuler un nouveau message</Button>
        <Button onClick={() => setDlg("new")}><Plus />Nouveau lead</Button>
      </PageAction>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Seg value={(f.type ?? "all") as string} onChange={(v) => set({ type: v === "all" ? undefined : v })} options={tabs} />
        <div className="flex gap-2">
          <Seg value={view} onChange={(v) => setSp({ view: v === "table" ? undefined : v })} options={[{ value: "table", label: <span className="flex items-center gap-1"><LayoutList className="size-3.5" />Tableau</span> }, { value: "kanban", label: <span className="flex items-center gap-1"><Columns3 className="size-3.5" />Kanban</span> }]} />
          <Button variant="outline" onClick={() => setDlg("import")}><Upload />Importer</Button>
          <Button variant="outline" onClick={() => { const csv = ["Nom;Type;Statut;Score", ...rows.map((l) => `${l.name};${l.type};${STATUS_LABEL[l.status]};${l.score}`)].join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv])); a.download = "leads-immo101.csv"; a.click(); toast.success(`${rows.length} leads exportés`); }}><Download />Exporter</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => { const on = String(sp[q.k] ?? "") === q.v; return <button key={q.label} onClick={() => set({ [q.k]: on ? undefined : q.v })} className={cn("rounded-full border px-3 py-1 text-xs font-medium transition", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary")}>{q.label} <span className="tnum opacity-70">{q.n}</span></button>; })}
      </div>

      <Panel spotlight={false} className="p-4">
        {view === "table" ? (
          <DataTable id="lp" rows={rows} cols={cols} rowKey={(l) => l.id} selectable placeholder="Rechercher un lead, un quartier, un bien…" search={(l) => `${l.name} ${l.quartier} ${l.message} ${projectSummary(l, props)} ${l.phone}`}
            chips={chips} onClearAll={clearAll} onOpen={(l, list) => setDrawer({ id: l.id, list })}
            toolbar={<>
              <Select value={f.source ?? "all"} onValueChange={(v) => set({ source: v === "all" ? undefined : v })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes sources</SelectItem>{SOURCES.map((s) => <SelectItem key={s} value={s}>{SOURCE_LABEL[s]}</SelectItem>)}</SelectContent></Select>
              <Select value={f.status ?? "all"} onValueChange={(v) => set({ status: v === "all" ? undefined : v })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select>
              <Select value={f.type ?? "all"} onValueChange={(v) => set({ type: v === "all" ? undefined : v })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous types</SelectItem>{LEAD_TYPES.map((s) => <SelectItem key={s} value={s}>{TYPE_PLURAL[s]}</SelectItem>)}</SelectContent></Select>
            </>}
            filterButton={<Button variant="outline" onClick={() => setPanel(true)} className="relative"><SlidersHorizontal />Filtres{chips.length > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground tnum">{chips.length}</span>}</Button>}
            rowMenu={(l) => <>
              <DropdownMenuItem onClick={() => open(l.id)}>Ouvrir la fiche</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulk({ kind: "assign", ids: [l.id], clear: () => {} })}>Assigner un conseiller</DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.crm(l.id)}>Envoyer au CRM</DropdownMenuItem>
              <DropdownMenuItem className="text-danger" onClick={() => setDel(l.id)}>Supprimer</DropdownMenuItem>
            </>}
            bulk={(ids, clear) => <>
              <Button size="sm" variant="ghost" className="text-ink-foreground hover:bg-ink-line hover:text-ink-foreground" onClick={() => setBulk({ kind: "assign", ids, clear })}>Assigner un conseiller</Button>
              <Button size="sm" variant="ghost" className="text-ink-foreground hover:bg-ink-line hover:text-ink-foreground" onClick={() => setBulk({ kind: "status", ids, clear })}>Changer le statut</Button>
              <Button size="sm" variant="ghost" className="text-ink-foreground hover:bg-ink-line hover:text-ink-foreground" onClick={() => { toast.success(`Relance lancée pour ${ids.length} leads`, { description: "Campagne « Suivi après visite »" }); clear(); }}>Lancer une relance</Button>
            </>}
          />
        ) : (
          <Kanban rows={rows} onOpen={(l) => setDrawer({ id: l.id, list: rows })} onDrop={(lead, s) => (s === "client" || s === "perdu" ? setKanbanDrop({ lead, s }) : actions.changeStatus(lead.id, s))} />
        )}
      </Panel>

      {/* Filter panel */}
      <Sheet open={panel} onOpenChange={setPanel}>
        <SheetContent className="w-[400px] overflow-y-auto">
          <SheetHeader><SheetTitle className="font-display text-xl">Filtres</SheetTitle><SheetDescription className="tnum">{rows.length} leads correspondent</SheetDescription></SheetHeader>
          <div className="mt-5 space-y-4">
            {[["temp", "Température", Object.entries(TEMP_LABEL)], ["adv", "Conseiller", ADVISORS.map((a) => [a.name, a.name])], ["quartier", "Quartier", QUARTIERS.map((q) => [q, q])], ["lang", "Langue", [["FR", "Français"], ["AR", "Arabe / darija"], ["EN", "Anglais"]]]].map(([k, label, opts]) => (
              <div key={k as string} className="space-y-1"><Label>{label as string}</Label><Select value={(sp[k as string] as string) ?? "all"} onValueChange={(v) => set({ [k as string]: v === "all" ? undefined : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem>{(opts as string[][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
            ))}
            <div className="space-y-2"><Label>Score IA : <span className="tnum">{f.smin}–{f.smax}</span></Label><Slider min={0} max={100} step={5} value={[f.smin, f.smax]} onValueChange={([a, b]) => set({ smin: a || undefined, smax: b === 100 ? undefined : b })} /></div>
            <div className="space-y-2">{[["sans", "Sans conseiller"], ["reprendre", "À reprendre"], ["abroad", "Résident à l'étranger"]].map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><Checkbox checked={String(sp[k] ?? "") === "1"} onCheckedChange={(v) => set({ [k]: v ? "1" : undefined })} />{l}</label>)}</div>
            <p className="text-xs text-muted-foreground">Plage de dates et budget : utilisez le tri « Reçu » et la recherche (ex. « 2 M »).</p>
            <div className="flex gap-2"><Button variant="outline" onClick={clearAll}>Tout effacer</Button><Button onClick={() => setPanel(false)}>Voir {rows.length} leads</Button></div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick view */}
      <Sheet open={!!dl} onOpenChange={(v) => !v && setDrawer(null)}>
        <SheetContent className="w-[480px] overflow-y-auto sm:max-w-[480px]">
          {dl && <>
            <SheetHeader><div className="flex items-center justify-between pr-8"><DrawerNav list={drawer!.list} current={dl.id} rowKey={(l) => l.id} onGo={(l) => setDrawer({ ...drawer!, id: l.id })} /></div>
              <div className="flex items-center gap-3"><ScoreRing score={dl.score} /><div><SheetTitle className="font-display text-2xl">{dl.name}</SheetTitle><SheetDescription>{dl.phone} · {dl.email}</SheetDescription></div></div>
            </SheetHeader>
            <div className="mt-4 flex flex-wrap gap-2"><TypeBadge t={dl.type} /><StatusBadge s={dl.status} sub={dl.statusSub} /><TempBadge t={dl.temp} /><SourceIcon s={dl.source} label /></div>
            {dl.reprendre && <div className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">L'agent IA a passé la main : ce lead attend un conseiller.<Button size="sm" className="ml-2" onClick={() => actions.takeOver(dl.id)}>Prendre en charge</Button></div>}
            <div className="mt-4 rounded-2xl bg-muted/60 p-3 text-sm"><p className="mb-1 text-xs text-muted-foreground">Message initial · {fmtDateTime(dl.receivedAt)}</p>{dl.message}</div>
            <p className="mt-4 text-sm font-medium">{projectSummary(dl, props)}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">{keyFacts(dl, props).map(([k, v]) => <div key={k} className="rounded-xl border p-2.5"><p className="text-[11px] text-muted-foreground">{k}</p><p className="text-sm font-medium">{v}</p></div>)}</div>
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary-soft p-3 text-sm"><p className="text-xs font-semibold text-primary">Prochaine meilleure action</p>{nextAction(dl)}</div>
            <AiNote className="mt-2" />
            <Button className="mt-5 w-full" onClick={() => open(dl.id)}><ExternalLink />Ouvrir la fiche complète</Button>
          </>}
        </SheetContent>
      </Sheet>

      <NewLeadDialog open={dlg === "new"} onOpenChange={(v) => setDlg(v ? "new" : null)} onCreated={open} />
      <SimulateDialog open={dlg === "sim"} onOpenChange={(v) => setDlg(v ? "sim" : null)} onOpenLead={open} />
      <ImportDialog open={dlg === "import"} onOpenChange={(v) => setDlg(v ? "import" : null)} />
      {bulk?.kind === "assign" && <AssignDialog ids={bulk.ids} open onOpenChange={(v) => !v && setBulk(null)} onDone={bulk.clear} />}
      {bulk?.kind === "status" && (
        <Confirm open onOpenChange={(v) => !v && setBulk(null)} title={`Changer le statut de ${bulk.ids.length} leads`} label="Appliquer"
          text="Les statuts Client et Perdu demandent une saisie individuelle (résultat ou motif) depuis la fiche. Statut appliqué : " onConfirm={() => { bulk.ids.forEach((id) => actions.changeStatus(id, bulkStatus)); bulk.clear(); setBulk(null); }} />
      )}
      {bulk?.kind === "status" && <div className="fixed left-1/2 top-[58%] z-[60] w-72 -translate-x-1/2"><Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as Status)}><SelectTrigger className="bg-card"><SelectValue /></SelectTrigger><SelectContent className="z-[70]">{STATUSES.filter((s) => s !== "client" && s !== "perdu").map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select></div>}
      {kanbanDrop && <StatusDialog lead={kanbanDrop.lead} initial={kanbanDrop.s} open onOpenChange={(v) => !v && setKanbanDrop(null)} />}
      <Confirm open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Supprimer ce lead ?" text="Le lead et ses relances seront supprimés. Vous pourrez annuler pendant 6 secondes." onConfirm={() => { actions.deleteLeads([del!]); setDel(null); }} />
    </div>
  );
}

function Kanban({ rows, onOpen, onDrop }: { rows: Lead[]; onOpen: (l: Lead) => void; onDrop: (l: Lead, s: Status) => void }) {
  const [drag, setDrag] = React.useState<Lead | null>(null);
  const [over, setOver] = React.useState<Status | null>(null);
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STATUSES.map((s) => { const col = rows.filter((l) => l.status === s); return (
        <div key={s} onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver(null)} onDrop={() => { if (drag && drag.status !== s) onDrop(drag, s); setDrag(null); setOver(null); }}
          className={cn("w-64 shrink-0 rounded-2xl bg-muted/50 p-2 transition", over === s && "bg-primary-soft ring-2 ring-primary")}>
          <div className="flex items-center justify-between px-2 py-1.5"><StatusBadge s={s} /><span className="text-xs text-muted-foreground tnum">{col.length}</span></div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto p-0.5">
            {col.slice(0, 40).map((l) => (
              <motion.div layout key={l.id} draggable onDragStart={() => setDrag(l)} onClick={() => onOpen(l)} className="cursor-grab rounded-xl border bg-card p-3 text-sm shadow-sm active:cursor-grabbing">
                <div className="flex items-center justify-between gap-2"><span className="truncate font-medium">{l.name}</span><span className="font-semibold tnum">{l.score}</span></div>
                <div className="mt-2 flex flex-wrap items-center gap-1"><TypeBadge t={l.type} short />{l.reprendre && <Pill tone="danger">À reprendre</Pill>}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><SourceIcon s={l.source} /><Avatar name={l.advisor} size={22} /></div>
              </motion.div>
            ))}
            {col.length > 40 && <p className="py-1 text-center text-xs text-muted-foreground">+ {col.length - 40} autres</p>}
          </div>
        </div>); })}
    </div>
  );
}
