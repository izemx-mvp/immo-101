import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Funnel, FunnelChart, LabelList } from "recharts";
import { Inbox, Sparkles, CalendarCheck, Megaphone, ArrowUpRight, Target, Repeat, AlertTriangle, UserPlus, MessageSquareReply, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Panel, PanelTitle, CountUp, Tilt, Seg, Pill, ago, TYPE_ICON } from "@/components/kit";
import { usePageMeta } from "@/components/AppShell";
import { PageAction } from "@/components/PageAction";
import { useStore, sel } from "@/lib/store";
import { ADVISORS, NOW, DAY_MS } from "@/lib/seed";
import { LEAD_TYPES, SOURCE_LABEL, STATUSES, STATUS_LABEL, TYPE_PLURAL, type LeadType } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/tableau-de-bord")({
  head: () => ({ meta: [{ title: "Tableau de bord — Immo101 Backoffice IA" }, { name: "description", content: "Vue d'ensemble des leads, qualifications IA, RDV et publications d'Immo101." }, { property: "og:title", content: "Tableau de bord — Immo101" }, { property: "og:description", content: "Vue d'ensemble de l'activité de l'agence." }] }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--muted-foreground)"];

function Dashboard() {
  usePageMeta("Vue d'ensemble, Immo101", "Activité de l'agence et de l'agent IA");
  const navigate = useNavigate();
  const [period, setPeriod] = React.useState("30");
  const [adv, setAdv] = React.useState("all");
  const [type, setType] = React.useState("all");
  const allLeads = useStore((s) => s.leads);
  const relances = useStore((s) => s.relances);
  const feed = useStore((s) => s.feed);
  const totalCounts = useStore(sel.counts);
  const days = period === "7" ? 7 : period === "90" ? 90 : 30;
  const leads = allLeads.filter((l) => (adv === "all" || l.advisor === adv) && (type === "all" || l.type === type) && NOW - l.receivedAt < days * DAY_MS + DAY_MS * 2);
  const qualified = leads.filter((l) => l.status !== "nouveau" && l.status !== "perdu").length;
  const rdv = leads.filter((l) => l.status === "rdv").length;
  const [mode, setMode] = React.useState<"source" | "type" | "statut">("source");
  const [hide, setHide] = React.useState<string[]>([]);
  const [all, setAll] = React.useState(false);

  const series = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d0 = NOW - (Math.min(days, 30) - 1 - i) * DAY_MS;
    const day = leads.filter((l) => Math.floor((NOW - l.receivedAt) / DAY_MS) === Math.floor((NOW - d0) / DAY_MS));
    return { d: new Date(d0).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), recus: day.length, qualifies: day.filter((l) => l.status !== "nouveau" && l.status !== "perdu").length };
  });
  const bySource = (["whatsapp", "email", "site", "instagram"] as const).map((s) => ({ name: SOURCE_LABEL[s], value: leads.filter((l) => l.source === s).length }));
  const byType = LEAD_TYPES.map((t) => ({ name: TYPE_PLURAL[t], value: leads.filter((l) => l.type === t).length }));
  const byStatus = STATUSES.map((s, i) => ({ name: STATUS_LABEL[s], value: leads.filter((l) => l.status === s).length, fill: COLORS[i] }));

  const kpis = [
    { label: "Leads reçus", value: leads.length, trend: "+18 %", icon: Inbox, go: () => navigate({ to: "/prospection" }) },
    { label: "Leads qualifiés par l'IA", value: qualified, trend: "+12 %", icon: Sparkles, go: () => navigate({ to: "/prospection", search: { qualified: "1" } as never }) },
    { label: "RDV planifiés", value: rdv, trend: "+9 %", icon: CalendarCheck, go: () => navigate({ to: "/prospection", search: { status: "rdv" } as never }) },
    { label: "Publications ce mois", value: totalCounts.postsMonth, trend: "+3", icon: Megaphone, go: () => navigate({ to: "/annonces", search: { tab: "idees", st: "Publié" } as never }) },
  ];
  const tomorrow = allLeads.filter((l) => l.rdvs.some((r) => new Date(r.at).toDateString() === new Date(NOW + DAY_MS).toDateString()));
  const noReply = relances.filter((r) => r.step !== "Répondu" && !r.stopped).length;
  const todo = [
    { icon: AlertTriangle, label: "Leads à reprendre", n: totalCounts.reprendre, tone: "danger" as const, go: () => navigate({ to: "/prospection", search: { reprendre: "1" } as never }) },
    { icon: UserPlus, label: "Nouveaux leads à assigner", n: totalCounts.unassigned, tone: "info" as const, go: () => navigate({ to: "/prospection", search: { sans: "1" } as never }) },
    { icon: MessageSquareReply, label: "Relances sans réponse", n: noReply, tone: "warning" as const, go: () => navigate({ to: "/relances", search: { rep: "En attente" } as never }) },
    { icon: CalendarClock, label: "RDV de demain", n: tomorrow.length, tone: "success" as const, go: () => navigate({ to: "/prospection", search: { status: "rdv" } as never }) },
  ];

  return (
    <div className="space-y-5">
      <PageAction>
        <Button variant="outline" onClick={() => navigate({ to: "/prospection" })}><Target />Prospection</Button>
        <Button onClick={() => navigate({ to: "/relances" })}><Repeat />Relances</Button>
      </PageAction>
      <div className="flex flex-wrap gap-2">
        <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 jours</SelectItem><SelectItem value="30">30 jours</SelectItem><SelectItem value="90">Trimestre</SelectItem></SelectContent></Select>
        <Select value={adv} onValueChange={setAdv}><SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les conseillers</SelectItem>{ADVISORS.map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent></Select>
        <Select value={type} onValueChange={setType}><SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les types</SelectItem>{LEAD_TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_PLURAL[t]}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Tilt onClick={k.go} className="cursor-pointer">
              <Panel className="group h-full" role="button" tabIndex={0} aria-label={`${k.label} : ${k.value}`} onKeyDown={(e) => e.key === "Enter" && k.go()}>
                <div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary"><k.icon className="size-5" /></span><ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" /></div>
                <p className="mt-4 text-sm text-muted-foreground">{k.label}</p>
                <div className="mt-1 flex items-end gap-2"><CountUp value={k.value} className="font-display text-4xl" /><Pill tone="success" dot={false} className="mb-1.5">{k.trend}</Pill></div>
              </Panel>
            </Tilt>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelTitle right={<Pill tone="success">Temps réel</Pill>} sub="Leads reçus et leads qualifiés par jour">Activité, 30 derniers jours</PanelTitle>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <defs>{["1", "2"].map((n) => <linearGradient key={n} id={"g" + n} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={`var(--chart-${n})`} stopOpacity={0.35} /><stop offset="100%" stopColor={`var(--chart-${n})`} stopOpacity={0} /></linearGradient>)}</defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={24} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Legend onClick={(e) => { const k = String(e.dataKey); setHide((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k])); }} wrapperStyle={{ fontSize: 12, cursor: "pointer" }} />
                <Area type="monotone" dataKey="recus" name="Leads reçus" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} hide={hide.includes("recus")} animationDuration={1200} />
                <Area type="monotone" dataKey="qualifies" name="Leads qualifiés" stroke="var(--chart-2)" fill="url(#g2)" strokeWidth={2} hide={hide.includes("qualifies")} animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <PanelTitle right={<Seg value={mode} onChange={setMode} options={[{ value: "source", label: "Par source" }, { value: "type", label: "Par type" }, { value: "statut", label: "Par statut" }]} />}>Répartition</PanelTitle>
          <div className="h-72">
            <ResponsiveContainer>
              {mode === "source" ? (
                <PieChart><Pie data={bySource} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>{bySource.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip contentStyle={{ background: "var(--popover)", borderRadius: 12, fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 12 }} /></PieChart>
              ) : mode === "type" ? (
                <BarChart data={byType} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--popover)", borderRadius: 12, fontSize: 12 }} /><Bar dataKey="value" name="Leads" radius={[0, 8, 8, 0]} fill="var(--chart-1)" /></BarChart>
              ) : (
                <FunnelChart><Tooltip contentStyle={{ background: "var(--popover)", borderRadius: 12, fontSize: 12 }} /><Funnel dataKey="value" data={byStatus} isAnimationActive><LabelList position="right" fill="var(--foreground)" stroke="none" dataKey="name" fontSize={11} /></Funnel></FunnelChart>
              )}
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel>
          <PanelTitle sub="Leads et conversions par type">Répartition par type de client</PanelTitle>
          <div className="space-y-3">
            {LEAD_TYPES.map((t) => { const I = TYPE_ICON[t]; const n = leads.filter((l) => l.type === t).length; const c = leads.filter((l) => l.type === t && l.status === "client").length; const pct = n ? Math.round((c / n) * 100) : 0; return (
              <button key={t} onClick={() => navigate({ to: "/prospection", search: { type: t } as never })} className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left hover:bg-muted">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted"><I className="size-4" /></span>
                <div className="flex-1"><div className="flex justify-between text-sm"><span>{TYPE_PLURAL[t]}</span><span className="font-semibold tnum">{n}</span></div>
                  <div className="mt-1 flex items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded-full bg-muted"><motion.div className="h-full bg-success" initial={{ width: 0 }} animate={{ width: Math.max(pct, 2) * 3 + "%" }} /></div><span className="text-[11px] text-muted-foreground tnum">{c} clients · {pct} %</span></div></div>
              </button>); })}
          </div>
        </Panel>
        <Panel>
          <PanelTitle right={<Button variant="link" size="sm" onClick={() => setAll(true)}>Voir tout</Button>} sub="Mise à jour automatique">Activité récente</PanelTitle>
          <FeedList items={feed.slice(0, 7)} onLead={(id) => navigate({ to: "/prospection/$leadId", params: { leadId: id } })} />
        </Panel>
        <Panel>
          <PanelTitle sub="Ce qui demande votre attention">À traiter</PanelTitle>
          <div className="space-y-2">
            {todo.map((t) => (
              <button key={t.label} onClick={t.go} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition hover:border-primary">
                <span className={cn("flex size-9 items-center justify-center rounded-xl", t.tone === "danger" ? "bg-danger-soft text-danger" : t.tone === "info" ? "bg-info-soft text-info" : t.tone === "warning" ? "bg-warning-soft text-warning" : "bg-success-soft text-success")}><t.icon className="size-4" /></span>
                <span className="flex-1 text-sm">{t.label}</span><span className="font-display text-2xl tnum">{t.n}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <AllFeed open={all} onOpenChange={setAll} onLead={(id) => { setAll(false); navigate({ to: "/prospection/$leadId", params: { leadId: id } }); }} />
    </div>
  );
}

const KIND_LABEL: Record<string, string> = { new: "Nouveau lead", qualified: "Qualification IA", rdv: "RDV", property: "Bien envoyé", relance: "Relance", post: "Publication" };
const KIND_TONE: Record<string, "info" | "primary" | "warning" | "success" | "neutral"> = { new: "info", qualified: "primary", rdv: "warning", property: "neutral", relance: "success", post: "neutral" };

function FeedList({ items, onLead }: { items: ReturnType<typeof useStore<import("@/lib/seed").FeedEvent[]>>; onLead: (id: string) => void }) {
  return (
    <ul className="space-y-1">
      {items.map((e, i) => (
        <motion.li key={e.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
          <button disabled={!e.leadId} onClick={() => e.leadId && onLead(e.leadId)} className="flex w-full items-start gap-3 rounded-xl p-2 text-left hover:bg-muted disabled:cursor-default">
            <Pill tone={KIND_TONE[e.kind]} className="mt-0.5">{KIND_LABEL[e.kind]}</Pill>
            <span className="flex-1 text-sm">{e.text}</span><span className="shrink-0 text-[11px] text-muted-foreground">{ago(e.at)}</span>
          </button>
        </motion.li>
      ))}
    </ul>
  );
}

function AllFeed({ open, onOpenChange, onLead }: { open: boolean; onOpenChange: (v: boolean) => void; onLead: (id: string) => void }) {
  const feed = useStore((s) => s.feed);
  const [k, setK] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const list = feed.filter((e) => k === "all" || e.kind === k);
  const pages = Math.max(1, Math.ceil(list.length / 15));
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px]">
        <SheetHeader><SheetTitle className="font-display text-xl">Toute l'activité</SheetTitle><SheetDescription>{list.length} événements</SheetDescription></SheetHeader>
        <div className="mt-3 flex flex-wrap gap-1">{["all", ...Object.keys(KIND_LABEL)].map((x) => <Button key={x} size="sm" variant={k === x ? "default" : "outline"} onClick={() => { setK(x); setPage(1); }}>{x === "all" ? "Tous" : KIND_LABEL[x]}</Button>)}</div>
        <div className="mt-3 max-h-[calc(100vh-220px)] overflow-y-auto"><FeedList items={list.slice((page - 1) * 15, page * 15)} onLead={onLead} /></div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span className="tnum">Page {page} / {pages}</span><div className="flex gap-1"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button><Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage(page + 1)}>Suivant</Button></div></div>
      </SheetContent>
    </Sheet>
  );
}
export type { LeadType };
