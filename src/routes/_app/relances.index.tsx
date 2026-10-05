import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Info, Pause, Square, Send, UserCheck, ThumbsUp, Wand2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, DrawerNav, useUrlState, type Col } from "@/components/DataTable";
import { Avatar, Highlight, Panel, PanelTitle, Pill, StatusBadge, TypeBadge, ago, fmtDateTime, AiNote } from "@/components/kit";
import { usePageMeta } from "@/components/AppShell";
import { PageAction } from "@/components/PageAction";
import { AssignDialog } from "@/components/lead/LeadDialogs";
import { projectSummary } from "@/components/lead/helpers";
import { actions, mutate, useStore } from "@/lib/store";
import type { Campaign, Relance } from "@/lib/seed";
import { LEAD_TYPES, QUARTIERS, STATUSES, STATUS_LABEL, TYPE_LABEL, TYPE_PLURAL, type LeadType } from "@/lib/domain";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/relances/")({
  head: () => ({ meta: [{ title: "Relances — Immo101 Backoffice IA" }, { name: "description", content: "Relances automatiques WhatsApp et email classées par l'IA." }, { property: "og:title", content: "Relances — Immo101" }, { property: "og:description", content: "Messagerie automatique multi-canal." }] }),
  component: Relances,
});

const CLS_TONE = { Intéressé: "success", Refusé: "danger", Ambigu: "warning", "En attente": "neutral" } as const;
export const CAMP_TONE = { Active: "success", "En pause": "warning", Terminée: "neutral" } as const;

export function campStats(c: Campaign, rels: Relance[]) {
  const r = rels.filter((x) => x.campaignId === c.id);
  const sent = r.reduce((a, x) => a + x.history.filter((h) => h.state !== "répondu").length, 0);
  const read = Math.round(sent * 0.78);
  const replied = r.filter((x) => x.step === "Répondu").length;
  const interested = r.filter((x) => x.classification === "Intéressé").length;
  return { contacts: r.length, sent, read, replied, interested, rate: r.length ? Math.round((replied / r.length) * 100) : 0 };
}

function Relances() {
  usePageMeta("Relances", "Messagerie automatique multi-canal : WhatsApp et email");
  const [sp, setSp] = useUrlState();
  const [wiz, setWiz] = React.useState(false);
  return (
    <div className="space-y-4">
      <PageAction><Button onClick={() => setWiz(true)}><Plus />Nouvelle campagne</Button></PageAction>
      <div className="flex items-start gap-3 rounded-2xl border border-info/30 bg-info-soft p-4 text-sm text-info"><Info className="mt-0.5 size-4 shrink-0" />Les relances démarrent automatiquement quand un conseiller propose un bien ou un créneau de visite, ou quand un lead passe en RDV planifié. L'IA classe chaque réponse en Intéressé, Refusé ou Ambigu.</div>
      <Tabs value={(sp.tab as string) ?? "contacts"} onValueChange={(v) => setSp({ tab: v })}>
        <TabsList className="rounded-2xl bg-card p-1"><TabsTrigger value="contacts" className="rounded-xl">Contacts</TabsTrigger><TabsTrigger value="campagnes" className="rounded-xl">Campagnes</TabsTrigger><TabsTrigger value="config" className="rounded-xl">Configuration</TabsTrigger></TabsList>
        <TabsContent value="contacts"><Contacts /></TabsContent>
        <TabsContent value="campagnes"><Campagnes /></TabsContent>
        <TabsContent value="config"><RConfig /></TabsContent>
      </Tabs>
      <Wizard open={wiz} onOpenChange={setWiz} />
    </div>
  );
}

function Contacts() {
  const rels = useStore((s) => s.relances);
  const leads = useStore((s) => s.leads);
  const camps = useStore((s) => s.campaigns);
  const [sp, setSp] = useUrlState();
  const [list, setList] = React.useState<Relance[]>([]);
  const lead = (r: Relance) => leads.find((l) => l.id === r.leadId)!;
  const f = { camp: sp.camp as string, ch: sp.ch as string, rep: sp.rep as string, lt: sp.lt as string };
  const rows = rels.filter((r) => lead(r) && (!f.camp || r.campaignId === f.camp) && (!f.ch || r.channel === f.ch) && (!f.rep || r.classification === f.rep) && (!f.lt || lead(r).type === f.lt));
  const cols: Col<Relance>[] = [
    { key: "c", label: "Contact", sort: (r) => lead(r).name, csv: (r) => lead(r).name, render: (r, q) => <div className="flex items-center gap-2"><Avatar name={lead(r).name} size={28} /><span className="font-medium"><Highlight text={lead(r).name} q={q} /></span>{r.paused && <Pill tone="warning">En pause</Pill>}{r.stopped && <Pill tone="neutral">Arrêtée</Pill>}</div> },
    { key: "t", label: "Type de lead", csv: (r) => lead(r).type, render: (r) => <TypeBadge t={lead(r).type} short /> },
    { key: "b", label: "Bien ou projet lié", csv: (r) => r.subject, render: (r, q) => <span className="text-xs"><Highlight text={r.subject} q={q} /></span> },
    { key: "camp", label: "Campagne", csv: (r) => camps.find((c) => c.id === r.campaignId)!.name, render: (r) => <span className="block max-w-[200px] truncate text-xs">{camps.find((c) => c.id === r.campaignId)?.name}</span> },
    { key: "ch", label: "Canal", csv: (r) => r.channel, render: (r) => <Pill tone={r.channel === "WhatsApp" ? "success" : "info"} dot={false}>{r.channel}</Pill> },
    { key: "st", label: "Étape", sort: (r) => ["Envoyé", "Relance 1", "Relance 2", "Relance 3", "Répondu"].indexOf(r.step), csv: (r) => r.step, render: (r) => <span className="text-sm">{r.step}</span> },
    { key: "cl", label: "Classification IA", sort: (r) => r.classification, csv: (r) => r.classification, render: (r) => <Pill tone={CLS_TONE[r.classification]}>{r.classification}</Pill> },
    { key: "d", label: "Dernière activité", sort: (r) => r.lastAt, csv: (r) => new Date(r.lastAt).toISOString(), render: (r) => <span className="text-xs text-muted-foreground">{ago(r.lastAt)}</span> },
  ];
  const cur = rels.find((r) => r.id === sp.rel);
  const sel = (k: string, v: string | undefined, all: string, opts: [string, string][]) => <Select value={v ?? "all"} onValueChange={(x) => setSp({ [k]: x === "all" ? undefined : x, rc_page: undefined })}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{all}</SelectItem>{opts.map(([a, b]) => <SelectItem key={a} value={a}>{b}</SelectItem>)}</SelectContent></Select>;
  return (
    <Panel spotlight={false} className="p-4">
      <DataTable id="rc" rows={rows} cols={cols} rowKey={(r) => r.id} search={(r) => `${lead(r).name} ${r.subject}`} placeholder="Rechercher un contact, un bien…" onOpen={(r, l) => { setList(l); setSp({ rel: r.id }); }}
        toolbar={<>{sel("camp", f.camp, "Toutes campagnes", camps.map((c) => [c.id, c.name]))}{sel("ch", f.ch, "Tous canaux", [["WhatsApp", "WhatsApp"], ["Email", "Email"]])}{sel("rep", f.rep, "Toutes réponses", [["Intéressé", "Intéressé"], ["Refusé", "Refusé"], ["Ambigu", "Ambigu"], ["En attente", "En attente"]])}{sel("lt", f.lt, "Tous types de lead", LEAD_TYPES.map((t) => [t, TYPE_PLURAL[t]]))}</>}
        chips={Object.entries(f).filter(([, v]) => v).map(([k, v]) => ({ key: k, label: k === "camp" ? camps.find((c) => c.id === v)!.name : k === "lt" ? TYPE_PLURAL[v as LeadType] : v, onRemove: () => setSp({ [k]: undefined }) }))} onClearAll={() => setSp({ camp: undefined, ch: undefined, rep: undefined, lt: undefined })} />
      <Sheet open={!!cur} onOpenChange={(v) => !v && setSp({ rel: undefined })}>
        <SheetContent className="w-[520px] overflow-y-auto sm:max-w-[520px]">{cur && <RelDrawer r={cur} list={list.length ? list : rows} onGo={(r) => setSp({ rel: r.id })} />}</SheetContent>
      </Sheet>
    </Panel>
  );
}

function RelDrawer({ r, list, onGo }: { r: Relance; list: Relance[]; onGo: (r: Relance) => void }) {
  const lead = useStore((s) => s.leads.find((l) => l.id === r.leadId))!;
  const props = useStore((s) => s.properties);
  const camp = useStore((s) => s.campaigns.find((c) => c.id === r.campaignId))!;
  const navigate = useNavigate();
  const [fix, setFix] = React.useState(false);
  const [assign, setAssign] = React.useState(false);
  return (
    <>
      <SheetHeader><DrawerNav list={list} current={r.id} rowKey={(x) => x.id} onGo={onGo} /><SheetTitle className="font-display text-2xl">{lead.name}</SheetTitle><SheetDescription>{camp.name} · {r.channel}</SheetDescription></SheetHeader>
      <Tabs defaultValue="messages" className="mt-4">
        <TabsList>{["Messages", "Réponse", "Lead", "Actions"].map((t) => <TabsTrigger key={t} value={t.toLowerCase()}>{t}</TabsTrigger>)}</TabsList>
        <TabsContent value="messages"><ol className="relative space-y-3 border-l pl-5">{r.history.map((h, i) => <li key={i} className="relative"><span className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-primary" /><p className="text-sm font-medium">{h.label}</p><p className="text-xs text-muted-foreground">{fmtDateTime(h.at)} · {h.channel} · <Pill tone={h.state === "répondu" ? "success" : h.state === "lu" ? "info" : "neutral"}>{h.state}</Pill></p></li>)}</ol></TabsContent>
        <TabsContent value="réponse" className="space-y-3">
          {r.reply ? <p className="rounded-2xl bg-muted/60 p-3 text-sm">« {r.reply} »</p> : <p className="text-sm text-muted-foreground">Pas encore de réponse.</p>}
          <div className="rounded-2xl border p-3"><div className="flex items-center justify-between"><Pill tone={CLS_TONE[r.classification]}>{r.classification}</Pill>{r.confidence > 0 && <span className="text-xs text-muted-foreground tnum">Confiance {r.confidence} %</span>}</div><p className="mt-2 text-sm">{r.reason}</p></div>
          {fix ? <div className="flex flex-wrap gap-2">{(["Intéressé", "Refusé", "Ambigu"] as const).map((c) => <Button key={c} size="sm" variant="outline" onClick={() => { actions.relance(r.id, { classification: c, reason: "Corrigé par un conseiller", confidence: 100 }, "Classification corrigée"); setFix(false); }}>{c}</Button>)}</div> : <Button variant="outline" size="sm" onClick={() => setFix(true)}>Corriger la classification</Button>}
          <AiNote />
        </TabsContent>
        <TabsContent value="lead" className="space-y-3"><div className="flex items-center gap-2"><TypeBadge t={lead.type} /><StatusBadge s={lead.status} sub={lead.statusSub} /></div><p className="text-sm">{projectSummary(lead, props)}</p><p className="text-sm text-muted-foreground">Conseiller : {lead.advisor ?? "aucun"} · Score {lead.score}</p><Button onClick={() => navigate({ to: "/prospection/$leadId", params: { leadId: lead.id } })}>Ouvrir la fiche complète</Button></TabsContent>
        <TabsContent value="actions" className="grid gap-2">
          <Button disabled={r.stopped} onClick={() => actions.relance(r.id, { lastAt: Date.now(), history: [...r.history, { at: Date.now(), label: "Relance manuelle", channel: r.channel, state: "envoyé" }] }, "Relance envoyée")}><Send />Relancer maintenant</Button>
          <Button variant="outline" disabled={r.stopped} onClick={() => actions.relance(r.id, { paused: !r.paused }, r.paused ? "Relance reprise" : "Relance en pause")}><Pause />{r.paused ? "Reprendre" : "Mettre en pause"}</Button>
          <Button variant="outline" disabled={r.stopped} onClick={() => actions.relance(r.id, { stopped: true }, "Relance arrêtée")}><Square />Arrêter</Button>
          <Button variant="outline" onClick={() => setAssign(true)}><UserCheck />Passer à un conseiller</Button>
          <Button variant="outline" onClick={() => actions.relance(r.id, { classification: "Intéressé", reason: "Marqué intéressé par un conseiller", confidence: 100 }, "Marqué comme intéressé")}><ThumbsUp />Marquer comme intéressé</Button>
        </TabsContent>
      </Tabs>
      <AssignDialog ids={[lead.id]} open={assign} onOpenChange={setAssign} />
    </>
  );
}

function Campagnes() {
  const camps = useStore((s) => s.campaigns);
  const rels = useStore((s) => s.relances);
  const navigate = useNavigate();
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {camps.map((c) => { const st = campStats(c, rels); return (
        <Panel key={c.id} className="cursor-pointer" onClick={() => navigate({ to: "/relances/campagnes/$id", params: { id: c.id } })}>
          <div className="flex items-center justify-between"><Pill tone={CAMP_TONE[c.status]}>{c.status}</Pill><span className="text-xs text-muted-foreground">{c.channel}</span></div>
          <p className="mt-3 font-display text-lg leading-tight">{c.name}</p><p className="text-xs text-muted-foreground">Cible : {TYPE_PLURAL[c.cible]}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["Envoyés", st.sent], ["Réponse", st.rate + " %"], ["Intéressés", st.interested]].map(([k, v]) => <div key={k as string} className="rounded-xl bg-muted/60 p-2"><p className="font-semibold tnum">{v}</p><p className="text-[10px] text-muted-foreground">{k}</p></div>)}</div>
        </Panel>); })}
    </div>
  );
}

function Wizard({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const leads = useStore((s) => s.leads);
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [f, setF] = React.useState({ name: "", type: "acheteur" as LeadType, status: "all", source: "all", period: "30", quartier: "all", budget: "", count: 3, delay: 3, wa: true, email: true, stop: true, steps: ["Bonjour {prénom}, suite à votre demande, voici {bien} à {quartier}. Qu'en pensez-vous ?", "Bonjour {prénom}, avez-vous pu regarder {bien} ? Je peux organiser une visite.", "Bonjour {prénom}, {bien} est toujours disponible. On en parle ?"] });
  React.useEffect(() => { if (open) setStep(1); }, [open]);
  const target = leads.filter((l) => l.type === f.type && (f.status === "all" || l.status === f.status) && (f.source === "all" || l.source === f.source) && (f.quartier === "all" || l.quartier === f.quartier));
  const launch = () => {
    const id = "c" + Date.now();
    mutate((s) => ({ ...s, campaigns: [...s.campaigns, { id, name: f.name || `Relance ${TYPE_PLURAL[f.type].toLowerCase()}`, cible: f.type, channel: f.wa && f.email ? "WhatsApp + Email" : f.wa ? "WhatsApp" : "Email", status: "Active", createdAt: Date.now(), steps: f.steps }] }), "Campagne lancée", `${target.length} contacts ciblés`);
    onOpenChange(false); navigate({ to: "/relances/campagnes/$id", params: { id } });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="font-display">Nouvelle campagne</DialogTitle><DialogDescription>Étape {step} / 4 · {["Cible", "Messages", "Cadence et canaux", "Récapitulatif"][step - 1]}</DialogDescription></DialogHeader>
        <div className="flex gap-1">{[1, 2, 3, 4].map((k) => <span key={k} className={cn("h-1 flex-1 rounded-full", k <= step ? "bg-primary" : "bg-muted")} />)}</div>
        <div className="max-h-[55vh] overflow-y-auto">
          {step === 1 && <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Nom de la campagne</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex. Relance acheteurs Souissi" /></div>
            {[["type", "Type de lead", LEAD_TYPES.map((t) => [t, TYPE_LABEL[t]])], ["status", "Statut", [["all", "Tous"], ...STATUSES.map((s) => [s, STATUS_LABEL[s]])]], ["source", "Source", [["all", "Toutes"], ["whatsapp", "WhatsApp"], ["email", "Email"], ["site", "Site web"], ["instagram", "Instagram"]]], ["period", "Période", [["7", "7 jours"], ["30", "30 jours"], ["90", "Trimestre"]]], ["quartier", "Quartier", [["all", "Tous"], ...QUARTIERS.map((q) => [q, q])]]].map(([k, l, o]) => (
              <div key={k as string} className="space-y-1"><Label>{l as string}</Label><Select value={(f as never)[k as string]} onValueChange={(v) => setF({ ...f, [k as string]: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(o as string[][]).map(([a, b]) => <SelectItem key={a} value={a}>{b}</SelectItem>)}</SelectContent></Select></div>))}
            <div className="space-y-1"><Label>Budget minimum (MAD)</Label><Input value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value.replace(/\D/g, "") })} /></div>
            <p className="col-span-2 rounded-xl bg-primary-soft p-3 text-sm text-primary"><b className="tnum">{target.length}</b> contacts correspondent à cette cible.</p>
          </div>}
          {step === 2 && <div className="space-y-3">{f.steps.map((s, i) => <div key={i} className="space-y-1"><Label>{i === 0 ? "Premier message" : `Relance ${i}`} · variante {TYPE_LABEL[f.type]}</Label><Textarea value={s} onChange={(e) => setF({ ...f, steps: f.steps.map((x, k) => (k === i ? e.target.value : x)) })} /></div>)}
            <p className="text-xs text-muted-foreground">Variables : {"{prénom}"} {"{bien}"} {"{quartier}"}</p><Button variant="outline" size="sm" onClick={() => { setF({ ...f, steps: f.steps.map((s) => s.replace("Bonjour", "Bonjour 👋")) }); toast.success("Messages réécrits par l'IA"); }}><Wand2 />Générer avec l'IA</Button></div>}
          {step === 3 && <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nombre de relances</Label><Input type="number" min={0} max={6} value={f.count} onChange={(e) => setF({ ...f, count: Math.min(6, Math.max(0, Number(e.target.value))) })} /></div>
            <div className="space-y-1"><Label>Délai (jours ouvrés)</Label><Input type="number" value={f.delay} onChange={(e) => setF({ ...f, delay: Number(e.target.value) })} /></div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.wa} onCheckedChange={(v) => setF({ ...f, wa: !!v })} />WhatsApp</label><label className="flex items-center gap-2 text-sm"><Checkbox checked={f.email} onCheckedChange={(v) => setF({ ...f, email: !!v })} />Email</label>
            <p className="col-span-2 text-sm text-muted-foreground">Créneaux : Lun–Ven 09:00–18:00, Sam 09:00–13:00</p>
            <label className="col-span-2 flex items-center gap-2 text-sm"><Switch checked={f.stop} onCheckedChange={(v) => setF({ ...f, stop: v })} />Arrêter dès qu'il répond</label>
            {!f.wa && !f.email && <p className="col-span-2 text-xs text-danger">Choisissez au moins un canal.</p>}
          </div>}
          {step === 4 && <dl className="space-y-2 text-sm">{[["Nom", f.name || `Relance ${TYPE_PLURAL[f.type].toLowerCase()}`], ["Cible", `${TYPE_PLURAL[f.type]} · ${target.length} contacts`], ["Messages", `${f.steps.length} modèles`], ["Cadence", `${f.count} relances, tous les ${f.delay} jours ouvrés`], ["Canaux", [f.wa && "WhatsApp", f.email && "Email"].filter(Boolean).join(" + ")]].map(([k, v]) => <div key={k} className="flex justify-between rounded-xl bg-muted/50 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>}
        </div>
        <DialogFooter>{step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Retour</Button>}{step < 4 ? <Button disabled={step === 3 && !f.wa && !f.email} onClick={() => setStep(step + 1)}>Suivant</Button> : <Button onClick={launch}><Check />Lancer</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RConfig() {
  const [count, setCount] = React.useState(3);
  const [tplType, setTplType] = React.useState<LeadType>("acheteur");
  const save = () => toast.success("Configuration enregistrée");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel><PanelTitle>Cadence</PanelTitle><div className="grid grid-cols-3 gap-3"><div className="space-y-1"><Label>Nombre de relances</Label><Input type="number" min={0} max={6} value={count} onChange={(e) => setCount(Math.min(6, Math.max(0, Number(e.target.value))))} /><p className="text-[11px] text-muted-foreground">Max 6, 0 = aucune</p></div><div className="space-y-1"><Label>Délai entre relances</Label><Input defaultValue="3 jours ouvrés" /></div><div className="space-y-1"><Label>Attente après l'envoi</Label><Input defaultValue="2 jours" /></div></div></Panel>
      <Panel><PanelTitle>Canaux autorisés</PanelTitle><div className="space-y-2">{["WhatsApp", "Email"].map((c) => <label key={c} className="flex items-center justify-between text-sm">{c}<Switch defaultChecked /></label>)}</div></Panel>
      <Panel><PanelTitle>Jours et créneaux autorisés</PanelTitle><div className="space-y-2 text-sm">{[["Lundi à Vendredi", "09:00", "18:00", true], ["Samedi", "09:00", "13:00", true], ["Dimanche", "", "", false]].map(([d, a, b, on]) => <div key={d as string} className="flex items-center gap-2"><Switch defaultChecked={on as boolean} /><span className="w-36">{d as string}</span>{on ? <><Input type="time" defaultValue={a as string} className="w-28" /><span>–</span><Input type="time" defaultValue={b as string} className="w-28" /></> : <span className="text-muted-foreground">Fermé</span>}</div>)}</div></Panel>
      <Panel><PanelTitle>Règles d'arrêt</PanelTitle><div className="space-y-2">{["Arrêter dès qu'il répond", "Arrêter si RDV planifié", "Arrêter si « Perdu »"].map((r) => <label key={r} className="flex items-center justify-between text-sm">{r}<Switch defaultChecked /></label>)}</div></Panel>
      <Panel className="lg:col-span-2"><PanelTitle right={<Select value={tplType} onValueChange={(v) => setTplType(v as LeadType)}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent>{LEAD_TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}</SelectContent></Select>}>Modèles par type de lead</PanelTitle>
        <div className="grid gap-3 md:grid-cols-3">{[1, 2, 3].map((i) => <div key={tplType + i} className="space-y-1"><Label>Étape {i}</Label><Textarea rows={4} defaultValue={`Bonjour {prénom}, ${tplType === "vendeur" ? "souhaitez-vous fixer la date de l'estimation de votre bien à {quartier} ?" : tplType === "bailleur" ? "nous avons des locataires intéressés par {quartier}. On en parle ?" : tplType === "investisseur" ? "une nouvelle opportunité locative correspond à votre stratégie : {bien}." : "avez-vous pu regarder {bien} à {quartier} ?"}${i > 1 ? " (relance " + (i - 1) + ")" : ""}`} /></div>)}</div></Panel>
      <Panel><PanelTitle>Signature</PanelTitle><Textarea defaultValue={"L'équipe Immo101\n+212 537 00 00 00 · immo101.ma"} /></Panel>
      <Panel><PanelTitle>Test</PanelTitle><p className="text-sm text-muted-foreground">Envoie le premier modèle à votre propre numéro.</p><Button variant="outline" className="mt-3" onClick={() => toast.success("Message test envoyé à zoubida@immo101-demo.ma")}>Envoyer un test</Button></Panel>
      <div className="lg:col-span-2"><Button onClick={save}>Enregistrer la configuration</Button></div>
    </div>
  );
}
