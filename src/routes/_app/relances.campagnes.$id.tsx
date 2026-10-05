import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, PanelTitle, Pill, Empty, Avatar, ago } from "@/components/kit";
import { usePageMeta } from "@/components/AppShell";
import { Crumbs, PageAction } from "@/components/PageAction";
import { mutate, useStore } from "@/lib/store";
import { LEAD_TYPES, TYPE_LABEL, TYPE_PLURAL, type LeadType } from "@/lib/domain";
import { CAMP_TONE, campStats } from "./relances.index";

export const Route = createFileRoute("/_app/relances/campagnes/$id")({
  head: () => ({ meta: [{ title: "Campagne de relance — Immo101 Backoffice IA" }, { name: "description", content: "Détail d'une campagne de relance automatique Immo101." }, { property: "og:title", content: "Campagne — Immo101" }, { property: "og:description", content: "Entonnoir, contacts et messages d'une campagne." }] }),
  component: CampaignPage,
});

function CampaignPage() {
  const { id } = Route.useParams();
  const c = useStore((s) => s.campaigns.find((x) => x.id === id));
  const rels = useStore((s) => s.relances);
  const leads = useStore((s) => s.leads);
  const navigate = useNavigate();
  usePageMeta(c?.name ?? "Campagne introuvable", c ? `Cible : ${TYPE_PLURAL[c.cible]} · ${c.channel}` : "");
  const [variant, setVariant] = React.useState<LeadType>(c?.cible ?? "acheteur");
  if (!c) return <Panel><Empty title="Campagne introuvable" action={<Button onClick={() => navigate({ to: "/relances" })}>Retour aux relances</Button>} /></Panel>;
  const st = campStats(c, rels);
  const funnel = [["Envoyés", st.sent], ["Lus", st.read], ["Répondus", st.replied], ["Intéressés", st.interested]] as const;
  const mine = rels.filter((r) => r.campaignId === c.id);
  const setStatus = (s: typeof c.status) => mutate((x) => ({ ...x, campaigns: x.campaigns.map((k) => (k.id === c.id ? { ...k, status: s } : k)) }), `Campagne : ${s}`);
  return (
    <div className="space-y-4">
      <Crumbs items={[{ label: "Relances", onClick: () => navigate({ to: "/relances" }) }, { label: "Campagnes", onClick: () => navigate({ to: "/relances", search: { tab: "campagnes" } as never }) }, { label: c.name }]} />
      <PageAction>
        {c.status === "Active" ? <Button variant="outline" onClick={() => setStatus("En pause")}><Pause />Mettre en pause</Button> : c.status === "En pause" ? <Button variant="outline" onClick={() => setStatus("Active")}><Play />Reprendre</Button> : null}
        {c.status !== "Terminée" && <Button variant="outline" onClick={() => setStatus("Terminée")}><Square />Terminer</Button>}
      </PageAction>
      <Tabs defaultValue="apercu">
        <TabsList className="rounded-2xl bg-card p-1">{[["apercu", "Aperçu"], ["contacts", `Contacts (${mine.length})`], ["messages", "Messages"], ["reglages", "Réglages"]].map(([v, l]) => <TabsTrigger key={v} value={v} className="rounded-xl">{l}</TabsTrigger>)}</TabsList>
        <TabsContent value="apercu">
          <Panel>
            <PanelTitle right={<Pill tone={CAMP_TONE[c.status]}>{c.status}</Pill>} sub={`Taux de réponse ${st.rate} %`}>Entonnoir</PanelTitle>
            <div className="space-y-3">{funnel.map(([k, v], i) => (
              <div key={k} className="flex items-center gap-4"><span className="w-24 text-sm">{k}</span>
                <div className="h-10 flex-1 overflow-hidden rounded-xl bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(4, (v / Math.max(1, st.sent)) * 100)}%` }} transition={{ delay: i * 0.15, duration: 0.8 }} className="flex h-full items-center justify-end rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground tnum" style={{ opacity: 1 - i * 0.18 }}>{v}</motion.div></div>
              </div>))}</div>
          </Panel>
        </TabsContent>
        <TabsContent value="contacts">
          <Panel>{mine.length ? <ul className="divide-y">{mine.map((r) => { const l = leads.find((x) => x.id === r.leadId)!; return <li key={r.id}><button onClick={() => navigate({ to: "/relances", search: { rel: r.id } as never })} className="flex w-full items-center gap-3 py-2.5 text-left text-sm hover:bg-muted/50"><Avatar name={l.name} size={28} /><span className="flex-1 font-medium">{l.name}</span><span>{r.step}</span><Pill tone={r.classification === "Intéressé" ? "success" : r.classification === "Refusé" ? "danger" : r.classification === "Ambigu" ? "warning" : "neutral"}>{r.classification}</Pill><span className="w-24 text-right text-xs text-muted-foreground">{ago(r.lastAt)}</span></button></li>; })}</ul> : <Empty title="Aucun contact pour l'instant" text="Les contacts s'ajoutent quand un bien est envoyé ou un RDV planifié." />}</Panel>
        </TabsContent>
        <TabsContent value="messages">
          <Panel>
            <PanelTitle right={<Select value={variant} onValueChange={(v) => setVariant(v as LeadType)}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent>{LEAD_TYPES.map((t) => <SelectItem key={t} value={t}>Variante {TYPE_LABEL[t]}</SelectItem>)}</SelectContent></Select>}>Modèles par étape</PanelTitle>
            <div className="space-y-3">{c.steps.map((s, i) => <div key={variant + i} className="space-y-1"><Label>{i === 0 ? "Message initial" : `Relance ${i}`}</Label><Textarea defaultValue={variant === c.cible ? s : s.replace("{bien}", variant === "vendeur" || variant === "bailleur" ? "l'estimation de votre bien" : "{bien}")} /></div>)}</div>
            <Button className="mt-3" onClick={() => mutate((x) => x, "Modèles enregistrés")}>Enregistrer</Button>
          </Panel>
        </TabsContent>
        <TabsContent value="reglages">
          <Panel className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label>Nom</Label><Input defaultValue={c.name} /></div>
            <div className="space-y-1"><Label>Canal</Label><Input defaultValue={c.channel} /></div>
            <div className="space-y-1"><Label>Délai entre relances</Label><Input defaultValue="3 jours ouvrés" /></div>
            <Button className="w-fit" onClick={() => mutate((x) => x, "Réglages enregistrés")}>Enregistrer</Button>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
