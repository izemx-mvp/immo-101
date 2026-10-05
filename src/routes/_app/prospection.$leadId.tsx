import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MoreHorizontal, Phone, Mail, Globe2, MapPin, Sparkles, Send, Pin, Trash2, Pencil, Upload, FileText, Pause, Square, RefreshCw, CalendarPlus, MessageCircle, Calculator, Wand2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, Panel, PanelTitle, Pill, Progress, ScoreRing, SourceIcon, StatusBadge, TempBadge, TypeBadge, AiNote, Empty, fmtDate, fmtDateTime, ago, SOURCE_ICON } from "@/components/kit";
import { usePageMeta } from "@/components/AppShell";
import { Crumbs } from "@/components/PageAction";
import { AssignDialog, Confirm, MergeDialog, PropertyPicker, PropThumb, RdvDialog, SendDialog, StatusDialog } from "@/components/lead/LeadDialogs";
import { breakdown, completion, estimate, keyFacts, missing, nextAction, projectSummary } from "@/components/lead/helpers";
import { actions, useStore } from "@/lib/store";
import { ADVISORS, type Lead } from "@/lib/seed";
import { DOC_LIST, LEAD_TYPES, QUAL_FIELDS, SCORE_CRITERIA, STATUSES, STATUS_LABEL, TYPE_LABEL, fmtM, type FieldDef, type LeadType, type Status } from "@/lib/domain";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NewPostDialog } from "@/components/NewPostDialog";

export const Route = createFileRoute("/_app/prospection/$leadId")({
  head: () => ({ meta: [{ title: "Fiche lead — Immo101 Backoffice IA" }, { name: "description", content: "Fiche détaillée d'un lead qualifié par l'agent IA d'Immo101." }, { property: "og:title", content: "Fiche lead — Immo101" }, { property: "og:description", content: "Qualification, biens, activité et relances d'un lead." }] }),
  component: LeadPage,
});

function LeadPage() {
  const { leadId } = Route.useParams();
  const lead = useStore((s) => s.leads.find((l) => l.id === leadId));
  const navigate = useNavigate();
  usePageMeta(lead?.name ?? "Lead introuvable", lead ? `${TYPE_LABEL[lead.type]} · ${lead.id}` : "");
  const [dlg, setDlg] = React.useState<null | "status" | "assign" | "rdv" | "send" | "merge" | "lost" | "delete">(null);
  const [tab, setTab] = React.useState("apercu");
  if (!lead) return <Panel><Empty title="Ce lead n'existe plus" text="Il a peut-être été supprimé ou fusionné." action={<Button onClick={() => navigate({ to: "/prospection" })}>Retour à la prospection</Button>} /></Panel>;
  const tabs = [["apercu", "Aperçu"], ["qualification", "Qualification"], ...(lead.type !== "autre" ? [["biens", "Biens"]] : []), ["activite", "Activité"], ["notes", `Notes (${lead.notes.length})`], ...(lead.type !== "autre" ? [["documents", "Documents"]] : []), ["relances", "Relances"]];

  return (
    <div className="space-y-4">
      <Crumbs items={[{ label: "Prospection", onClick: () => navigate({ to: "/prospection" }) }, { label: TYPE_LABEL[lead.type] + "s", onClick: () => navigate({ to: "/prospection", search: { type: lead.type } as never }) }, { label: lead.name }]} />
      <Panel className="flex flex-wrap items-center gap-5">
        <Avatar name={lead.name} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-3xl">{lead.name}</h2><TypeBadge t={lead.type} /></div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <Select value={lead.status} onValueChange={(v) => { if (v === "client" || v === "perdu") setDlg("status"); else actions.changeStatus(lead.id, v as Status); }}>
              <SelectTrigger className="h-8 w-auto gap-2 rounded-full" aria-label="Statut"><StatusBadge s={lead.status} sub={lead.statusSub} /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
            </Select>
            <TempBadge t={lead.temp} /><SourceIcon s={lead.source} label />
            <span className="flex items-center gap-1.5 text-muted-foreground"><Avatar name={lead.advisor} size={22} />{lead.advisor ?? "Sans conseiller"}</span>
            {lead.crmSyncedAt ? <Pill tone="success">Synchronisé au CRM · {ago(lead.crmSyncedAt)}</Pill> : <Pill tone="neutral">Non synchronisé</Pill>}
          </div>
        </div>
        <ScoreRing score={lead.score} size={72} stroke={6} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline"><MoreHorizontal />Actions</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setDlg("status")}>Changer le statut</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDlg("assign")}>Assigner un conseiller</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDlg("rdv")}>Planifier un RDV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDlg("send")}>Envoyer un bien ou une fiche</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { actions.sendProperty(lead.id, [], lead.source === "email" ? "Email" : "WhatsApp", `Bonjour ${lead.name.split(" ")[0]}, je reviens vers vous concernant votre projet. Immo101`); }}>Lancer une relance</DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.crm(lead.id)}>Envoyer au CRM</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDlg("merge")}>Fusionner un doublon</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDlg("lost")}>Marquer comme perdu</DropdownMenuItem>
            <DropdownMenuItem className="text-danger" onClick={() => setDlg("delete")}>Supprimer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Panel>
      {lead.reprendre && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-5 py-3 text-sm text-danger">
          <span>L'agent IA a passé la main : ce lead attend un conseiller</span><Button size="sm" onClick={() => actions.takeOver(lead.id)}>Prendre en charge</Button>
        </motion.div>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap rounded-2xl bg-card p-1">{tabs.map(([v, l]) => <TabsTrigger key={v} value={v} className="rounded-xl">{l}</TabsTrigger>)}</TabsList>
        <TabsContent value="apercu"><Apercu lead={lead} onAction={() => { const a = nextAction(lead); if (a.startsWith("Prendre")) actions.takeOver(lead.id); else if (a.startsWith("Assigner")) setDlg("assign"); else if (a.includes("RDV") || a.includes("Planifier")) setDlg("rdv"); else if (a.includes("biens")) setDlg("send"); else toast("Action notée"); }} onTab={setTab} /></TabsContent>
        <TabsContent value="qualification"><Qualification lead={lead} /></TabsContent>
        <TabsContent value="biens"><Biens lead={lead} onSend={() => setDlg("send")} onRdv={() => setDlg("rdv")} /></TabsContent>
        <TabsContent value="activite"><Activite lead={lead} /></TabsContent>
        <TabsContent value="notes"><Notes lead={lead} /></TabsContent>
        <TabsContent value="documents"><Documents lead={lead} /></TabsContent>
        <TabsContent value="relances"><LeadRelances lead={lead} /></TabsContent>
      </Tabs>

      <StatusDialog lead={lead} open={dlg === "status"} onOpenChange={(v) => setDlg(v ? "status" : null)} />
      <StatusDialog lead={lead} initial="perdu" open={dlg === "lost"} onOpenChange={(v) => setDlg(v ? "lost" : null)} />
      <AssignDialog ids={[lead.id]} open={dlg === "assign"} onOpenChange={(v) => setDlg(v ? "assign" : null)} />
      <RdvDialog lead={lead} open={dlg === "rdv"} onOpenChange={(v) => setDlg(v ? "rdv" : null)} />
      <SendDialog lead={lead} open={dlg === "send"} onOpenChange={(v) => setDlg(v ? "send" : null)} />
      <MergeDialog lead={lead} open={dlg === "merge"} onOpenChange={(v) => setDlg(v ? "merge" : null)} />
      <Confirm open={dlg === "delete"} onOpenChange={(v) => setDlg(v ? "delete" : null)} title={`Supprimer ${lead.name} ?`} text="Le lead, ses notes et ses relances seront supprimés." onConfirm={() => { actions.deleteLeads([lead.id]); navigate({ to: "/prospection" }); }} />
    </div>
  );
}

function Apercu({ lead, onAction, onTab }: { lead: Lead; onAction: () => void; onTab: (t: string) => void }) {
  const props = useStore((s) => s.properties);
  const rel = useStore((s) => s.relances.find((r) => r.leadId === lead.id));
  const next = lead.rdvs.filter((r) => r.at > Date.now()).sort((a, b) => a.at - b.at)[0];
  const miss = missing(lead);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel>
        <PanelTitle>Contact</PanelTitle>
        <dl className="space-y-2.5 text-sm">
          {[[Phone, lead.phone], [Mail, lead.email], [Globe2, `Langue préférée : ${lead.lang === "AR" ? "Arabe / darija" : lead.lang === "EN" ? "Anglais" : "Français"}`], [MapPin, lead.city]].map(([I, v], i) => { const Ic = I as typeof Phone; return <div key={i} className="flex items-center gap-2"><Ic className="size-4 text-muted-foreground" />{v as string}</div>; })}
          <div className="flex items-center justify-between pt-1"><span className="text-muted-foreground">Résident à l'étranger</span><Pill tone={lead.abroad ? "info" : "neutral"}>{lead.abroad ? "Oui" : "Non"}</Pill></div>
        </dl>
      </Panel>
      <Panel className="lg:col-span-2">
        <PanelTitle sub={fmtDateTime(lead.receivedAt)}>Message initial</PanelTitle>
        <p className="rounded-2xl bg-muted/60 p-4 text-sm" dir="auto">{lead.message}</p>
        <div className="mt-4 rounded-2xl border p-4"><p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" />Résumé IA</p>
          <p className="text-sm">{TYPE_LABEL[lead.type]} {lead.abroad ? "résidant à l'étranger" : "à " + lead.city}, contact via {lead.source === "email" ? "email" : lead.source === "whatsapp" ? "WhatsApp" : lead.source}.<br />{projectSummary(lead, props)}.<br />Qualification à {completion(lead)} %, score {lead.score}/100.</p></div>
      </Panel>
      <Panel className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{keyFacts(lead, props).map(([k, v]) => <div key={k} className="rounded-2xl border bg-card p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 font-medium">{v}</p></div>)}</div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-4">
          <div><p className="text-xs font-semibold text-primary">Prochaine meilleure action</p><p className="text-sm">{nextAction(lead)}</p></div><Button onClick={onAction}>Faire</Button>
        </div>
        <AiNote className="mt-2" />
      </Panel>
      <Panel>
        <PanelTitle right={<span className="text-sm font-semibold tnum">{completion(lead)} %</span>}>Qualification</PanelTitle>
        <Progress value={completion(lead)} />
        <p className="mt-3 text-xs text-muted-foreground">Informations manquantes</p>
        <div className="mt-1 flex flex-wrap gap-1">{miss.slice(0, 8).map((m) => <span key={m.key} className="rounded-full bg-muted px-2 py-0.5 text-xs">{m.label}</span>)}{!miss.length && <span className="text-xs text-success">Complète</span>}</div>
        <Button variant="link" size="sm" className="mt-2 px-0" onClick={() => onTab("qualification")}>Compléter la qualification</Button>
      </Panel>
      <Panel>
        <PanelTitle>Prochain RDV</PanelTitle>
        {next ? <div className="text-sm"><p className="font-medium">{next.kind}</p><p className="text-muted-foreground">{fmtDateTime(next.at)} · {next.duration} min</p><p className="text-muted-foreground">{next.place} · {next.advisor}</p></div> : <p className="text-sm text-muted-foreground">Aucun RDV planifié.</p>}
      </Panel>
      <Panel>
        <PanelTitle right={<Button variant="link" size="sm" onClick={() => onTab("activite")}>Tout voir</Button>}>Derniers événements</PanelTitle>
        <ul className="space-y-2">{lead.activities.slice(0, 5).map((a) => <li key={a.id} className="text-sm"><p className="truncate">{a.text}</p><p className="text-[11px] text-muted-foreground">{a.author} · {ago(a.at)}</p></li>)}</ul>
      </Panel>
      <Panel>
        <PanelTitle>Relance liée</PanelTitle>
        {rel ? <div className="space-y-1 text-sm"><Pill tone={rel.stopped ? "neutral" : rel.paused ? "warning" : "success"}>{rel.stopped ? "Arrêtée" : rel.paused ? "En pause" : "Active"}</Pill><p>{rel.step} · {rel.channel}</p><p className="text-muted-foreground">Classification : {rel.classification}</p></div> : <p className="text-sm text-muted-foreground">Aucune relance en cours.</p>}
      </Panel>
    </div>
  );
}

function FieldInput({ f, value, onChange }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  if (f.kind === "toggle") return <Switch checked={!!value} onCheckedChange={onChange} aria-label={f.label} />;
  if (f.kind === "select") return <Select value={(value as string) ?? ""} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="À préciser" /></SelectTrigger><SelectContent>{f.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>;
  if (f.kind === "multi") { const arr = (value as string[]) ?? []; return <div className="flex flex-wrap gap-1">{f.options!.map((o) => <button key={o} type="button" onClick={() => onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])} className={cn("rounded-full border px-2 py-0.5 text-xs", arr.includes(o) && "border-primary bg-primary-soft text-primary")}>{o}</button>)}</div>; }
  return <Input type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text"} value={(value as string | number) ?? ""} onChange={(e) => onChange(f.kind === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)} />;
}

function Qualification({ lead }: { lead: Lead }) {
  const [saved, setSaved] = React.useState<"idle" | "saving" | "saved">("idle");
  const [typeChange, setTypeChange] = React.useState<LeadType | null>(null);
  const miss = missing(lead);
  const bd = breakdown(lead);
  const nextQ = miss[0];
  const change = (k: string, v: unknown) => { actions.setQual(lead.id, k, v); setSaved("saving"); setTimeout(() => setSaved("saved"), 600); };
  const common: [string, string][] = [["Nom", lead.name], ["Téléphone", lead.phone], ["Email", lead.email], ["Langue", lead.lang], ["Source", lead.source], ["Première prise de contact", fmtDateTime(lead.receivedAt)], ["Consentement de contact", "Oui (message entrant)"]];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-2">
        <PanelTitle right={<span className="text-xs text-muted-foreground" aria-live="polite">{saved === "saving" ? "Enregistrement…" : saved === "saved" ? "✓ Enregistré automatiquement" : ""}</span>} sub={`Formulaire ${TYPE_LABEL[lead.type]} · ${completion(lead)} % complété`}>Qualification</PanelTitle>
        <div className="mb-4 flex items-center gap-2 text-sm"><span className="text-muted-foreground">Type de lead :</span>
          <Select value={lead.type} onValueChange={(v) => setTypeChange(v as LeadType)}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent>{LEAD_TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {QUAL_FIELDS[lead.type].map((f) => (
            <div key={f.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2"><label className="text-sm font-medium">{f.label}{f.unit && <span className="text-muted-foreground"> ({f.unit})</span>}</label>
                {lead.qual[f.key] !== undefined && <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", lead.qualBy[f.key] === "IA" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground")}>{lead.qualBy[f.key] === "IA" ? "Rempli par l'IA" : "Saisi par un conseiller"}</span>}</div>
              <FieldInput f={f} value={lead.qual[f.key]} onChange={(v) => change(f.key, v)} />
            </div>
          ))}
        </div>
        <div className="mt-6 border-t pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bloc commun</p><div className="grid gap-2 md:grid-cols-2">{common.map(([k, v]) => <div key={k} className="flex justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>)}</div></div>
        {lead.type === "investisseur" && <YieldSim />}
      </Panel>
      <div className="space-y-4">
        <Panel>
          <PanelTitle right={<ScoreRing score={lead.score} size={48} />}>Score IA</PanelTitle>
          <div className="space-y-2.5">{bd.map((c) => <div key={c.label}><div className="flex justify-between text-xs"><span>{c.label}</span><span className="tnum">{c.pts} / {c.w}</span></div><Progress value={(c.pts / c.w) * 100} /></div>)}</div>
          <p className="mt-3 text-xs text-muted-foreground">Critères {TYPE_LABEL[lead.type].toLowerCase()} : {SCORE_CRITERIA[lead.type].map(([l]) => l).join(", ")}. Seuils : Chaud ≥ 70, Tiède 40–69, Froid &lt; 40.</p>
          <Button variant="outline" className="mt-3 w-full" onClick={() => actions.recalc(lead.id)}><RefreshCw />Recalculer le score</Button>
        </Panel>
        <Panel>
          <PanelTitle>Informations manquantes</PanelTitle>
          <div className="flex flex-wrap gap-1">{miss.map((m) => <span key={m.key} className="rounded-full bg-warning-soft px-2 py-0.5 text-xs text-warning">{m.label}</span>)}{!miss.length && <span className="text-sm text-success">Qualification complète</span>}</div>
          {nextQ && <div className="mt-4 rounded-2xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Prochaine question de l'agent</p><p className="mt-1 text-sm">« {nextQ.label.endsWith("?") ? nextQ.label : `Pourriez-vous préciser : ${nextQ.label.toLowerCase()} ?`} »</p>
            <Button size="sm" className="mt-2" onClick={() => actions.addActivity(lead.id, { kind: "message", text: `Pourriez-vous préciser : ${nextQ.label.toLowerCase()} ?`, author: "Agent IA", channel: lead.source === "email" ? "email" : "whatsapp", dir: "out" }, "Question envoyée par l'agent IA")}><Send />Envoyer la question</Button></div>}
          <AiNote className="mt-3" />
        </Panel>
      </div>
      <Confirm open={!!typeChange} onOpenChange={(v) => !v && setTypeChange(null)} label="Changer le type" title={`Passer en ${typeChange ? TYPE_LABEL[typeChange] : ""} ?`} text="Le formulaire, les faits clés, les critères de score, la liste de documents et l'onglet Biens seront adaptés. Les champs communs sont conservés." onConfirm={() => { actions.changeType(lead.id, typeChange!); setTypeChange(null); }} />
    </div>
  );
}

function YieldSim() {
  const [p, setP] = React.useState(2_000_000), [r, setR] = React.useState(12_000), [c, setC] = React.useState(800);
  const y = p ? (((r - c) * 12) / p) * 100 : 0;
  return (
    <div className="mt-6 rounded-2xl border p-4"><p className="mb-3 flex items-center gap-2 font-medium"><Calculator className="size-4 text-primary" />Simulateur de rendement <span className="text-xs font-normal text-muted-foreground">(indicatif)</span></p>
      <div className="grid grid-cols-3 gap-3 text-sm">{[["Prix (MAD)", p, setP], ["Loyer mensuel", r, setR], ["Charges mensuelles", c, setC]].map(([l, v, s]) => <label key={l as string} className="space-y-1"><span className="text-xs text-muted-foreground">{l as string}</span><Input type="number" value={v as number} onChange={(e) => (s as (n: number) => void)(Number(e.target.value))} /></label>)}</div>
      <p className="mt-3 text-sm">Rendement brut estimé : <span className="font-display text-2xl text-primary tnum">{y.toFixed(1)} %</span></p>
    </div>
  );
}

function Biens({ lead, onSend, onRdv }: { lead: Lead; onSend: () => void; onRdv: () => void }) {
  const props = useStore((s) => s.properties);
  const [pick, setPick] = React.useState(false);
  const [post, setPost] = React.useState(false);
  const [estimated, setEstimated] = React.useState(false);
  if (lead.type === "vendeur" || lead.type === "bailleur") {
    const p = props.find((x) => x.id === lead.ownerPropId)!;
    const est = estimate(lead, props);
    const wanted = (lead.qual.prix as number) ?? (lead.qual.loyer as number) ?? p.price;
    const gap = Math.round(((wanted - est.mid) / est.mid) * 100);
    const money = (n: number) => (p.mode === "Location" ? n.toLocaleString("fr-FR") + " MAD/mois" : fmtM(n));
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelTitle right={<Pill tone={p.listing === "Publié sur le site" ? "success" : "warning"}>{p.listing}</Pill>} sub={`Référence ${p.ref}`}>Bien du propriétaire</PanelTitle>
          <div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map((i) => <PropThumb key={i} p={{ ...p, ref: p.ref + i }} className={cn("h-24 w-full", i === 0 && "col-span-2 row-span-2 h-full")} />)}</div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">{[["Type", p.type], ["Quartier", p.quartier], ["Surface", p.surface + " m²"], ["Pièces", p.rooms], ["Étage", p.floor], ["État", p.etat], ["Année", p.year], [lead.type === "vendeur" ? "Prix souhaité" : "Loyer souhaité", money(wanted)]].map(([k, v]) => <div key={k as string} className="rounded-xl bg-muted/50 p-2.5"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => { setEstimated(true); toast.success("Estimation IA générée", { description: `${money(est.low)} – ${money(est.high)}` }); }}><Wand2 />Générer l'estimation IA</Button>
            <Button variant="outline" onClick={() => setPost(true)}><ImagePlus />Créer l'annonce</Button>
            <Button variant="outline" onClick={onRdv}><CalendarPlus />Planifier l'estimation sur place</Button>
          </div>
        </Panel>
        <Panel>
          <PanelTitle>Estimation IA</PanelTitle>
          <motion.div key={String(estimated)} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
            <p className="font-display text-3xl tnum">{money(est.mid)}</p>
            <p className="text-sm text-muted-foreground tnum">Fourchette {money(est.low)} – {money(est.high)}</p>
            <p className="mt-2 text-sm">Écart avec le souhaité : <Pill tone={Math.abs(gap) <= 8 ? "success" : gap > 0 ? "warning" : "info"}>{gap > 0 ? "+" : ""}{gap} %</Pill></p>
          </motion.div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">3 comparables utilisés</p>
          <ul className="mt-2 space-y-2">{est.comps.map((c) => <li key={c.id} className="flex items-center gap-2 text-sm"><PropThumb p={c} className="h-9 w-12" /><span className="flex-1">{c.ref} · {c.type} {c.quartier}</span><span className="tnum">{money(c.price)}</span></li>)}</ul>
          <AiNote className="mt-3" />
        </Panel>
        <NewPostDialog open={post} onOpenChange={setPost} prefill={{ propId: p.id, idea: `${p.type} à ${lead.type === "vendeur" ? "vendre" : "louer"} à ${p.quartier}` }} />
      </div>
    );
  }
  const cands = props.filter((p) => (lead.type === "locataire" ? p.mode === "Location" : p.mode === "Vente") && !lead.proposed.some((x) => x.propId === p.id) && p.status !== "Vendu/Loué").slice(0, 5);
  return (
    <div className="space-y-4">
      <Panel>
        <PanelTitle sub="Top 5 des biens correspondant aux critères" right={<AiNote />}><Sparkles className="mr-1 inline size-4 text-primary" />Suggestions IA</PanelTitle>
        <div className="flex gap-3 overflow-x-auto pb-1">{cands.map((p, i) => (
          <button key={p.id} onClick={() => actions.sendProperty(lead.id, [p.id], lead.source === "email" ? "Email" : "WhatsApp", `Bonjour, je vous propose ${p.ref} · ${p.title}, ${p.quartier}.`)} className="w-56 shrink-0 rounded-2xl border bg-card p-2 text-left hover:border-primary">
            <PropThumb p={p} className="h-24 w-full" /><p className="mt-2 text-sm font-medium">{p.ref} · {p.quartier}</p><p className="text-xs text-muted-foreground">{p.surface} m² · {p.mode === "Location" ? p.price.toLocaleString("fr-FR") + " MAD/mois" : fmtM(p.price)}</p><Pill tone="success" dot={false} className="mt-1">Match {94 - i * 4} %</Pill>
          </button>))}</div>
      </Panel>
      <Panel>
        <PanelTitle right={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPick(true)}>Ajouter un bien</Button><Button variant="outline" size="sm" onClick={onSend}><MessageCircle />Envoyer par WhatsApp</Button><Button variant="outline" size="sm" onClick={onSend}><Mail />Envoyer par email</Button><Button size="sm" onClick={onRdv}>Planifier une visite</Button></div>}>Biens proposés</PanelTitle>
        {lead.proposed.length === 0 ? <Empty title="Aucun bien proposé" text="Ajoutez un bien ou utilisez les suggestions IA." action={<Button onClick={() => setPick(true)}>Ajouter un bien</Button>} /> : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{lead.proposed.map((pp) => { const p = props.find((x) => x.id === pp.propId)!; return (
            <div key={pp.propId} className="rounded-2xl border bg-card p-3">
              <PropThumb p={p} className="h-28 w-full" />
              <div className="mt-2 flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{p.title}</p><p className="text-xs text-muted-foreground">{p.ref} · {p.quartier} · {p.surface} m²</p></div><span className="text-sm font-semibold tnum">{p.mode === "Location" ? p.price.toLocaleString("fr-FR") + "/mois" : fmtM(p.price)}</span></div>
              <p className="mt-2 text-xs"><span className="font-semibold text-success tnum">Match {pp.match} %</span> · {pp.reasons}</p>
              <Select value={pp.status} onValueChange={(v) => { actions.addActivity(lead.id, { kind: "note", text: `${p.ref} : ${v}` }); useStorePatch(lead, pp.propId, v); }}><SelectTrigger className="mt-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{["Proposé", "Vu", "Visité", "Intéressé", "Refusé"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>); })}</div>
        )}
      </Panel>
      <PropertyPicker open={pick} onOpenChange={setPick} mode={lead.type === "locataire" ? "Location" : "Vente"} onPick={(ids) => actions.sendProperty(lead.id, ids, lead.source === "email" ? "Email" : "WhatsApp", `Bien(s) ajouté(s) à la sélection : ${ids.length}`)} />
    </div>
  );
}
import { mutate } from "@/lib/store";
function useStorePatch(lead: Lead, propId: string, status: string) {
  mutate((s) => ({ ...s, leads: s.leads.map((l) => (l.id === lead.id ? { ...l, proposed: l.proposed.map((p) => (p.propId === propId ? { ...p, status: status as never } : p)) } : l)) }));
}

const KINDS = [["all", "Tout"], ["message", "Messages"], ["statut", "Statut"], ["rdv", "RDV"], ["relance", "Relances"], ["note", "Notes"], ["crm", "CRM"]];
function Activite({ lead }: { lead: Lead }) {
  const [k, setK] = React.useState("all");
  const list = lead.activities.filter((a) => k === "all" || a.kind === k);
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap gap-1">{KINDS.map(([v, l]) => <Button key={v} size="sm" variant={k === v ? "default" : "outline"} onClick={() => setK(v)}>{l}</Button>)}</div>
      <ol className="relative space-y-4 border-l pl-6">
        {list.map((a, i) => { const I = a.channel ? SOURCE_ICON[a.channel] : a.kind === "rdv" ? CalendarPlus : a.kind === "note" ? Pencil : a.kind === "crm" ? RefreshCw : Sparkles; return (
          <motion.li key={a.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="relative">
            <span className="absolute -left-[33px] flex size-5 items-center justify-center rounded-full border bg-card"><I className="size-3 text-primary" /></span>
            <p className="text-sm" dir="auto">{a.kind === "message" && <span className="mr-1 text-xs text-muted-foreground">{a.dir === "in" ? "Reçu :" : "Envoyé :"}</span>}{a.text}</p>
            <p className="text-[11px] text-muted-foreground">{a.author} · {fmtDateTime(a.at)}</p>
          </motion.li>); })}
        {!list.length && <p className="text-sm text-muted-foreground">Aucun événement pour ce filtre.</p>}
      </ol>
    </Panel>
  );
}

function Notes({ lead }: { lead: Lead }) {
  const [t, setT] = React.useState("");
  const [edit, setEdit] = React.useState<{ id: string; text: string } | null>(null);
  const mention = t.match(/@(\w*)$/);
  const sorted = [...lead.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at - a.at);
  return (
    <Panel>
      <div className="relative">
        <Textarea placeholder="Ajouter une note privée… Utilisez @ pour mentionner un conseiller" value={t} onChange={(e) => setT(e.target.value)} />
        {mention && <div className="absolute left-2 top-full z-10 mt-1 rounded-xl border bg-popover p-1 shadow-lg">{ADVISORS.filter((a) => a.name.toLowerCase().startsWith(mention[1].toLowerCase())).map((a) => <button key={a.id} onClick={() => setT(t.replace(/@\w*$/, "@" + a.name + " "))} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"><Avatar name={a.name} size={20} />{a.name}</button>)}</div>}
      </div>
      <Button className="mt-2" disabled={!t.trim()} onClick={() => { actions.note(lead.id, t); setT(""); }}>Ajouter la note</Button>
      <div className="mt-5 space-y-3">
        {sorted.map((n) => (
          <div key={n.id} className={cn("rounded-2xl border p-3", n.pinned && "border-primary/40 bg-primary-soft")}>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Avatar name={n.author} size={20} />{n.author} · {ago(n.at)}{n.pinned && <Pin className="size-3 text-primary" />}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Épingler" onClick={() => actions.updateNote(lead.id, n.id, { pinned: !n.pinned })}><Pin /></Button>
                <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => setEdit({ id: n.id, text: n.text })}><Pencil /></Button>
                <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => actions.updateNote(lead.id, n.id, null)}><Trash2 /></Button>
              </div></div>
            {edit?.id === n.id ? <div className="mt-2 space-y-2"><Textarea value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} /><div className="flex gap-2"><Button size="sm" onClick={() => { actions.updateNote(lead.id, n.id, { text: edit.text }); setEdit(null); }}>Enregistrer</Button><Button size="sm" variant="outline" onClick={() => setEdit(null)}>Annuler</Button></div></div>
              : <p className="mt-1 text-sm">{n.text.split(/(@[A-ZÀ-ÿ][\wÀ-ÿ]+ [A-ZÀ-ÿ][\wÀ-ÿ]+)/).map((part, i) => part.startsWith("@") ? <span key={i} className="font-medium text-primary">{part}</span> : part)}</p>}
          </div>
        ))}
        {!lead.notes.length && <p className="text-sm text-muted-foreground">Aucune note pour l'instant.</p>}
      </div>
    </Panel>
  );
}

function Documents({ lead }: { lead: Lead }) {
  const docs = lead.docs.length ? lead.docs : DOC_LIST[lead.type].map((d) => ({ name: d, status: "Manquant" as const }));
  const [preview, setPreview] = React.useState<string | null>(null);
  const setDoc = (name: string, status: string) => mutate((s) => ({ ...s, leads: s.leads.map((l) => (l.id === lead.id ? { ...l, docs: docs.map((d) => (d.name === name ? { ...d, status: status as never } : d)) } : l)) }), "Document mis à jour");
  const missingDocs = docs.filter((d) => d.status !== "Reçu");
  return (
    <Panel>
      <PanelTitle sub={`Documents requis pour un ${TYPE_LABEL[lead.type].toLowerCase()}`} right={<Button disabled={!missingDocs.length} onClick={() => actions.addActivity(lead.id, { kind: "message", channel: lead.source === "email" ? "email" : "whatsapp", dir: "out", text: `Bonjour ${lead.name.split(" ")[0]}, pour avancer, pourriez-vous nous transmettre : ${missingDocs.map((d) => d.name.toLowerCase()).join(", ")} ? Merci, Immo101` }, "Demande de documents envoyée")}><Send />Demander les documents</Button>}>Documents</PanelTitle>
      <div className="space-y-2">{docs.map((d) => (
        <div key={d.name} className="flex items-center gap-3 rounded-2xl border p-3">
          <FileText className="size-5 text-muted-foreground" /><span className="flex-1 text-sm">{d.name}</span>
          <Pill tone={d.status === "Reçu" ? "success" : d.status === "À vérifier" ? "warning" : "danger"}>{d.status}</Pill>
          {d.status !== "Manquant" && <Button size="sm" variant="ghost" onClick={() => setPreview(d.name)}>Aperçu</Button>}
          <label className="cursor-pointer"><input type="file" className="sr-only" onChange={() => setDoc(d.name, "À vérifier")} /><span className="inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs hover:bg-muted"><Upload className="size-3.5" />Uploader</span></label>
          {d.status === "À vérifier" && <Button size="sm" onClick={() => setDoc(d.name, "Reçu")}>Valider</Button>}
        </div>))}</div>
      {preview && <div className="mt-4 rounded-2xl border bg-muted/40 p-6 text-center text-sm"><FileText className="mx-auto size-10 text-primary" /><p className="mt-2 font-medium">{preview}.pdf</p><p className="text-muted-foreground">Aperçu du document (démonstration)</p><Button size="sm" variant="outline" className="mt-2" onClick={() => setPreview(null)}>Fermer l'aperçu</Button></div>}
    </Panel>
  );
}

function LeadRelances({ lead }: { lead: Lead }) {
  const rels = useStore((s) => s.relances.filter((r) => r.leadId === lead.id));
  const camps = useStore((s) => s.campaigns);
  if (!rels.length) return <Panel><Empty title="Aucune relance" text="Une relance démarre automatiquement quand un bien est envoyé ou un RDV planifié." action={<Button onClick={() => actions.sendProperty(lead.id, [], lead.source === "email" ? "Email" : "WhatsApp", "Relance manuelle")}>Lancer une relance</Button>} /></Panel>;
  return (
    <div className="space-y-4">{rels.map((r) => { const c = camps.find((x) => x.id === r.campaignId)!; return (
      <Panel key={r.id}>
        <PanelTitle sub={`${r.channel} · ${r.subject}`} right={<Pill tone={r.stopped ? "neutral" : r.paused ? "warning" : "success"}>{r.stopped ? "Arrêtée" : r.paused ? "En pause" : "Active"}</Pill>}>{c.name}</PanelTitle>
        <p className="text-sm">Prochain message : <span className="font-medium">{r.stopped || r.step === "Répondu" ? "aucun" : `${r.step === "Envoyé" ? "Relance 1" : r.step === "Relance 1" ? "Relance 2" : "Relance 3"} · ${fmtDate(r.lastAt + 3 * 86400000)}`}</span></p>
        <ol className="mt-3 space-y-1.5">{r.history.map((h, i) => <li key={i} className="flex items-center gap-2 text-sm"><span className="size-1.5 rounded-full bg-primary" />{h.label} · {h.channel} · <span className="text-muted-foreground">{h.state} · {fmtDate(h.at)}</span></li>)}</ol>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" disabled={r.stopped} onClick={() => actions.relance(r.id, { paused: !r.paused }, r.paused ? "Relance reprise" : "Relance mise en pause")}><Pause />{r.paused ? "Reprendre" : "Mettre en pause"}</Button>
          <Button size="sm" variant="outline" disabled={r.stopped} onClick={() => actions.relance(r.id, { stopped: true }, "Relance arrêtée")}><Square />Arrêter</Button>
          <Button size="sm" disabled={r.stopped} onClick={() => actions.relance(r.id, { lastAt: Date.now(), history: [...r.history, { at: Date.now(), label: "Relance manuelle", channel: r.channel, state: "envoyé" }] }, "Relance envoyée maintenant")}><Send />Relancer maintenant</Button>
        </div>
      </Panel>); })}</div>
  );
}
