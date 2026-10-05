import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Wand2, Loader2, Instagram, Linkedin, Globe, Copy, Pencil, Trash2, CalendarPlus, Send, ChevronLeft, ChevronRight, X, Search, GripVertical, Upload, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Panel, PanelTitle, Pill, Seg, Empty, fmtDate, fmtDateTime, norm } from "@/components/kit";
import { usePageMeta } from "@/components/AppShell";
import { PageAction } from "@/components/PageAction";
import { NewPostDialog } from "@/components/NewPostDialog";
import { PropThumb, Confirm } from "@/components/lead/LeadDialogs";
import { useUrlState } from "@/components/DataTable";
import { mutate, useStore } from "@/lib/store";
import type { Post } from "@/lib/seed";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/annonces")({
  head: () => ({ meta: [{ title: "Annonces & publications — Immo101 Backoffice IA" }, { name: "description", content: "Génération, planification et publication multi-plateformes des annonces Immo101." }, { property: "og:title", content: "Annonces & publications — Immo101" }, { property: "og:description", content: "Posts Instagram, LinkedIn et site web." }] }),
  component: Annonces,
});

const PI = { Instagram, LinkedIn: Linkedin, "Site web": Globe } as const;
const PCOL: Record<string, string> = { Instagram: "bg-primary-soft text-primary border-primary/30", LinkedIn: "bg-info-soft text-info border-info/30", "Site web": "bg-success-soft text-success border-success/30" };
const ST_TONE = { Idée: "neutral", Brouillon: "warning", Planifié: "info", Publié: "success" } as const;
const patchPost = (id: string, p: Partial<Post>, msg?: string) => mutate((s) => ({ ...s, posts: s.posts.map((x) => (x.id === id ? { ...x, ...p } : x)) }), msg);

function Annonces() {
  usePageMeta("Annonces & publications", "Génération, planification et publication multi-plateformes");
  const [sp, setSp] = useUrlState();
  const tab = (sp.tab as string) ?? "idees";
  const [np, setNp] = React.useState<{ date?: number } | null>(null);
  return (
    <div>
      <PageAction><Button onClick={() => setNp({})}><Plus />Nouveau post</Button></PageAction>
      <Tabs value={tab} onValueChange={(v) => setSp({ tab: v })}>
        <TabsList className="rounded-2xl bg-card p-1"><TabsTrigger value="config" className="rounded-xl">Configuration</TabsTrigger><TabsTrigger value="idees" className="rounded-xl">Idées</TabsTrigger><TabsTrigger value="calendrier" className="rounded-xl">Calendrier</TabsTrigger></TabsList>
        <TabsContent value="config"><Config /></TabsContent>
        <TabsContent value="idees"><Idees /></TabsContent>
        <TabsContent value="calendrier"><Calendar onCreate={(d) => setNp({ date: d })} /></TabsContent>
      </Tabs>
      <NewPostDialog open={!!np} onOpenChange={(v) => !v && setNp(null)} prefill={np ?? undefined} />
    </div>
  );
}

function Idees() {
  const posts = useStore((s) => s.posts);
  const [sp, setSp] = useUrlState();
  const [q, setQ] = React.useState("");
  const st = (sp.st as string) ?? "all", kind = (sp.kind as string) ?? "all", pl = (sp.pl as string) ?? "all";
  const [size, setSize] = React.useState(10); const [page, setPage] = React.useState(1);
  const [gen, setGen] = React.useState(false);
  const [del, setDel] = React.useState<string | null>(null);
  const list = posts.filter((p) => (st === "all" || p.status === st) && (kind === "all" || p.kind === kind) && (pl === "all" || p.platforms.includes(pl as never)) && norm(p.title + p.text).includes(norm(q)));
  const pages = Math.max(1, Math.ceil(list.length / size));
  const cur = posts.find((p) => p.id === sp.post);
  const generate = () => { setGen(true); setTimeout(() => { mutate((s) => ({ ...s, posts: [...["Visite virtuelle d'un riad à Hassan", "3 erreurs à éviter en vendant", "Pourquoi investir à Témara en 2026"].map((t, i) => ({ id: "P" + (s.posts.length + 200 + i), title: "Idée : " + t, text: "Idée générée par l'IA à partir de vos objectifs et des quartiers mis en avant.", kind: (["Annonce de bien", "Conseil", "Actualité marché"] as const)[i], media: i === 0 ? "Vidéo" as const : "Image" as const, ai: 90 - i * 3, platforms: ["Instagram", "LinkedIn"] as Post["platforms"], status: "Idée" as const, date: Date.now() + (i + 3) * 86400000, hashtags: "#Immo101", cta: "En savoir plus", tone: "Chaleureux", lang: "FR" as const, stats: { vues: 0, likes: 0, clics: 0, leads: 0 } })), ...s.posts] }), "3 nouvelles idées générées"); setGen(false); setPage(1); }, 1400); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={gen}>{gen ? <Loader2 className="animate-spin" /> : <Wand2 />}Générer des idées</Button>
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="bg-card pl-9" placeholder="Rechercher une idée…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />{q && <button aria-label="Effacer" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setQ("")}><X className="size-4" /></button>}</div>
        {[["st", st, "Tous statuts", ["Idée", "Brouillon", "Planifié", "Publié"]], ["kind", kind, "Tous types", ["Annonce de bien", "Conseil", "Témoignage", "Actualité marché"]], ["pl", pl, "Toutes plateformes", ["Instagram", "LinkedIn", "Site web"]]].map(([k, v, all, opts]) => (
          <Select key={k as string} value={v as string} onValueChange={(x) => { setSp({ [k as string]: x === "all" ? undefined : x }); setPage(1); }}><SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{all as string}</SelectItem>{(opts as string[]).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
        ))}
      </div>
      <p className="text-xs text-muted-foreground tnum">{list.length} résultats</p>
      {list.length === 0 ? <Panel><Empty title="Aucune idée" text="Générez de nouvelles idées avec l'IA." action={<Button onClick={generate}>Générer des idées</Button>} /></Panel> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.slice((page - 1) * size, page * size).map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Panel className="flex h-full cursor-pointer flex-col p-3" onClick={() => setSp({ post: p.id })}>
                <div className="relative overflow-hidden rounded-2xl">
                  <PropThumb p={{ ref: p.id + "7" } as never} className="aspect-video w-full" />
                  <div className="absolute left-2 top-2 flex gap-1"><span className="flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[11px]">{p.media === "Vidéo" ? <Video className="size-3" /> : <ImageIcon className="size-3" />}{p.media}</span><span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">IA {p.ai} %</span></div>
                </div>
                <div className="mt-3 flex items-center gap-2"><Pill tone={ST_TONE[p.status]}>{p.status}</Pill><span className="text-[11px] text-muted-foreground">{p.kind}</span></div>
                <p className="mt-2 font-medium">{p.title}</p><p className="line-clamp-2 text-sm text-muted-foreground">{p.text}</p>
                <div className="mt-auto flex items-center justify-between pt-3"><div className="flex gap-1.5">{p.platforms.map((x) => { const I = PI[x]; return <I key={x} className="size-4 text-muted-foreground" aria-label={x} />; })}</div><span className="text-xs text-muted-foreground">{fmtDate(p.date)}</span></div>
                <div className="mt-3 flex flex-wrap gap-1 border-t pt-3" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => setSp({ post: p.id })}><Pencil />Modifier</Button>
                  <Button size="sm" variant="ghost" aria-label="Dupliquer" onClick={() => mutate((s) => ({ ...s, posts: [{ ...p, id: p.id + "c" + Date.now(), title: p.title + " (copie)", status: "Brouillon" }, ...s.posts] }), "Post dupliqué")}><Copy /></Button>
                  <Button size="sm" variant="ghost" aria-label="Supprimer" onClick={() => setDel(p.id)}><Trash2 /></Button>
                  <Button size="sm" variant="ghost" disabled={p.status === "Publié"} onClick={() => patchPost(p.id, { status: "Planifié", date: Math.max(p.date, Date.now() + 86400000) }, "Post planifié")}><CalendarPlus />Planifier</Button>
                  <Button size="sm" disabled={p.status === "Publié"} onClick={() => patchPost(p.id, { status: "Publié", date: Date.now() }, "Post publié")}><Send />Publier</Button>
                </div>
              </Panel>
            </motion.div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tnum">Affichage {list.length ? (page - 1) * size + 1 : 0}–{Math.min(page * size, list.length)} sur {list.length} résultats</span>
        <div className="flex items-center gap-1"><select aria-label="Par page" className="h-8 rounded-lg border bg-card px-2" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>{[10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}</select>
          <Button size="icon" variant="ghost" aria-label="Précédent" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft /></Button>{Array.from({ length: pages }, (_, i) => <Button key={i} size="sm" variant={page === i + 1 ? "default" : "ghost"} onClick={() => setPage(i + 1)}>{i + 1}</Button>)}<Button size="icon" variant="ghost" aria-label="Suivant" disabled={page === pages} onClick={() => setPage(page + 1)}><ChevronRight /></Button></div>
      </div>
      <Confirm open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Supprimer ce post ?" text="Cette action est annulable pendant 6 secondes." onConfirm={() => { mutate((s) => ({ ...s, posts: s.posts.filter((x) => x.id !== del) }), "Post supprimé"); setDel(null); }} />
      <Sheet open={!!cur} onOpenChange={(v) => !v && setSp({ post: undefined })}>
        <SheetContent className="w-[600px] overflow-y-auto sm:max-w-[600px]">{cur && <PostDrawer p={cur} />}</SheetContent>
      </Sheet>
    </div>
  );
}

function PostDrawer({ p }: { p: Post }) {
  const [f, setF] = React.useState(p);
  const [media, setMedia] = React.useState(["Façade principale", "Salon lumineux", "Terrasse"]);
  React.useEffect(() => setF(p), [p.id]);
  const save = () => patchPost(p.id, f, "Post enregistré");
  return (
    <>
      <SheetHeader><SheetTitle className="font-display text-2xl">{p.title}</SheetTitle><SheetDescription><Pill tone={ST_TONE[p.status]}>{p.status}</Pill> · {p.kind} · {fmtDateTime(p.date)}</SheetDescription></SheetHeader>
      <Tabs defaultValue="contenu" className="mt-4">
        <TabsList className="flex-wrap">{["Contenu", "Médias", "Plateformes", "Planification", "Performance", "Historique"].map((t) => <TabsTrigger key={t} value={t.toLowerCase()}>{t}</TabsTrigger>)}</TabsList>
        <TabsContent value="contenu" className="space-y-3">
          <div className="space-y-1"><Label>Titre</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="space-y-1"><Label>Texte</Label><Textarea rows={5} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></div>
          <div className="space-y-1"><Label>Hashtags</Label><Input value={f.hashtags} onChange={(e) => setF({ ...f, hashtags: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label>Appel à l'action</Label><Input value={f.cta} onChange={(e) => setF({ ...f, cta: e.target.value })} /></div>
            <div className="space-y-1"><Label>Tonalité</Label><Select value={f.tone} onValueChange={(v) => setF({ ...f, tone: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Chaleureux", "Premium", "Informatif", "Dynamique"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Langue</Label><Seg value={f.lang} onChange={(v) => setF({ ...f, lang: v })} options={[{ value: "FR", label: "FR" }, { value: "EN", label: "EN" }, { value: "AR", label: "AR" }]} /></div>
          </div>
          <Button onClick={save}>Enregistrer</Button>
        </TabsContent>
        <TabsContent value="médias" className="space-y-2">
          {media.map((m, i) => <div key={m} className="flex items-center gap-2 rounded-xl border p-2"><GripVertical className="size-4 text-muted-foreground" /><PropThumb p={{ ref: m } as never} className="h-10 w-14" /><Input defaultValue={m} className="flex-1" aria-label="Description" /><Button size="icon" variant="ghost" aria-label="Monter" disabled={i === 0} onClick={() => setMedia((a) => { const n = [...a]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}>↑</Button></div>)}
          <div className="flex gap-2"><Button variant="outline" onClick={() => { setMedia((a) => [...a, "Visuel généré " + (a.length + 1)]); toast.success("Média généré par l'IA"); }}><Wand2 />Générer</Button><label className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-xl border px-3 text-sm"><Upload className="size-4" />Importer<input type="file" className="sr-only" onChange={() => setMedia((a) => [...a, "Import " + (a.length + 1)])} /></label></div>
          <p className="text-xs text-muted-foreground">Source : portefeuille Immo101</p>
        </TabsContent>
        <TabsContent value="plateformes">
          <Tabs defaultValue="Instagram"><TabsList>{(["Instagram", "LinkedIn", "Site web"] as const).map((x) => <TabsTrigger key={x} value={x}>{x}</TabsTrigger>)}</TabsList>
            {(["Instagram", "LinkedIn", "Site web"] as const).map((x) => <TabsContent key={x} value={x} className="space-y-3">
              <label className="flex items-center justify-between text-sm">Publier sur {x}<Switch checked={f.platforms.includes(x)} onCheckedChange={(v) => setF({ ...f, platforms: v ? [...f.platforms, x] : f.platforms.filter((y) => y !== x) })} /></label>
              <div className="rounded-2xl border bg-card p-3"><PropThumb p={{ ref: p.id + "7" } as never} className={x === "Instagram" ? "aspect-square w-full" : "aspect-video w-full"} /><p className="mt-2 text-sm">{x === "LinkedIn" ? "📍 Rabat · " : ""}{f.text}</p>{x !== "Site web" && <p className="text-sm text-primary">{f.hashtags}</p>}</div>
              <Textarea placeholder={`Adaptation spécifique ${x}…`} />
            </TabsContent>)}
          </Tabs>
          <Button className="mt-3" onClick={save}>Enregistrer</Button>
        </TabsContent>
        <TabsContent value="planification" className="space-y-3">
          <div className="grid grid-cols-2 gap-2"><div className="space-y-1"><Label>Date</Label><Input type="date" value={new Date(f.date).toISOString().slice(0, 10)} onChange={(e) => setF({ ...f, date: new Date(e.target.value + "T" + new Date(f.date).toTimeString().slice(0, 5)).getTime() })} /></div><div className="space-y-1"><Label>Heure</Label><Input type="time" defaultValue={new Date(f.date).toTimeString().slice(0, 5)} /></div></div>
          <div className="space-y-1"><Label>Répétition</Label><Select defaultValue="none"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Aucune</SelectItem><SelectItem value="w">Chaque semaine</SelectItem><SelectItem value="m">Chaque mois</SelectItem></SelectContent></Select></div>
          <div className="rounded-xl bg-primary-soft p-3 text-sm text-primary">Meilleur moment suggéré par l'IA : <b>mardi 19:30</b> (Instagram), <b>jeudi 08:45</b> (LinkedIn)</div>
          <Button onClick={() => patchPost(p.id, { ...f, status: "Planifié" }, "Post planifié")}>Planifier</Button>
        </TabsContent>
        <TabsContent value="performance"><div className="grid grid-cols-2 gap-3">{[["Vues", p.stats.vues], ["Likes", p.stats.likes], ["Clics", p.stats.clics], ["Leads générés", p.stats.leads]].map(([k, v]) => <div key={k} className="rounded-2xl border p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="font-display text-3xl tnum">{(v as number).toLocaleString("fr-FR")}</p></div>)}</div>{p.status !== "Publié" && <p className="mt-2 text-xs text-muted-foreground">Les performances apparaîtront après publication.</p>}</TabsContent>
        <TabsContent value="historique"><ul className="space-y-2 text-sm">{[["Idée générée par l'IA", p.date - 5 * 86400000], ["Modifié par Zoubida Labdi", p.date - 2 * 86400000], [p.status === "Publié" ? "Publié" : "Statut : " + p.status, p.date]].map(([t, d]) => <li key={t as string} className="flex justify-between rounded-xl border p-2.5"><span>{t}</span><span className="text-xs text-muted-foreground">{fmtDateTime(d as number)}</span></li>)}</ul></TabsContent>
      </Tabs>
    </>
  );
}

function Calendar({ onCreate }: { onCreate: (d: number) => void }) {
  const posts = useStore((s) => s.posts.filter((p) => p.status !== "Idée"));
  const [view, setView] = React.useState<"mois" | "semaine" | "jour" | "agenda">("mois");
  const [ref, setRef] = React.useState(() => new Date());
  const [pf, setPf] = React.useState<string>("all");
  const [drag, setDrag] = React.useState<string | null>(null);
  const [, setSp] = useUrlState();
  const vis = posts.filter((p) => pf === "all" || p.platforms.includes(pf as never));
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const shift = (n: number) => { const d = new Date(ref); if (view === "mois") d.setMonth(d.getMonth() + n); else if (view === "semaine") d.setDate(d.getDate() + 7 * n); else d.setDate(d.getDate() + n); setRef(d); };
  let days: Date[] = [];
  if (view === "mois") { const f = new Date(ref.getFullYear(), ref.getMonth(), 1); const start = new Date(f); start.setDate(1 - ((f.getDay() + 6) % 7)); days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)); }
  else if (view === "semaine") { const s = new Date(ref); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); days = Array.from({ length: 7 }, (_, i) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + i)); }
  else if (view === "jour") days = [ref];
  const Ev = ({ p }: { p: Post }) => <button draggable onDragStart={() => setDrag(p.id)} onClick={(e) => { e.stopPropagation(); setSp({ tab: "idees", post: p.id }); }} className={cn("block w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px]", PCOL[p.platforms[0]])}>{new Date(p.date).toTimeString().slice(0, 5)} {p.title}</button>;
  return (
    <Panel spotlight={false}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setRef(new Date())}>Aujourd'hui</Button>
        <Button variant="ghost" size="icon" aria-label="Précédent" onClick={() => shift(-1)}><ChevronLeft /></Button><Button variant="ghost" size="icon" aria-label="Suivant" onClick={() => shift(1)}><ChevronRight /></Button>
        <h3 className="font-display text-xl capitalize">{ref.toLocaleDateString("fr-FR", view === "jour" ? { dateStyle: "full" } : { month: "long", year: "numeric" })}</h3>
        <div className="ml-auto flex gap-2"><Select value={pf} onValueChange={setPf}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes plateformes</SelectItem>{["Instagram", "LinkedIn", "Site web"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          <Seg value={view} onChange={setView} options={[{ value: "mois", label: "Mois" }, { value: "semaine", label: "Semaine" }, { value: "jour", label: "Jour" }, { value: "agenda", label: "Agenda" }]} /></div>
      </div>
      <div className="mb-3 flex gap-3 text-xs">{Object.keys(PCOL).map((k) => <span key={k} className={cn("rounded-md border px-2 py-0.5", PCOL[k])}>{k}</span>)}</div>
      {view === "agenda" ? (
        <ul className="divide-y">{[...vis].sort((a, b) => a.date - b.date).filter((p) => p.date > Date.now() - 7 * 86400000).map((p) => <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm"><span className="w-32 text-muted-foreground">{fmtDateTime(p.date)}</span><span className="flex-1">{p.title}</span><Pill tone={ST_TONE[p.status]}>{p.status}</Pill></li>)}</ul>
      ) : (
        <div className={cn("grid gap-px overflow-hidden rounded-2xl border bg-border", view === "jour" ? "grid-cols-1" : "grid-cols-7")}>
          {view !== "jour" && ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <div key={d} className="bg-card px-2 py-1.5 text-xs text-muted-foreground">{d}</div>)}
          {days.map((d) => { const ev = vis.filter((p) => same(new Date(p.date), d)); return (
            <div key={d.toISOString()} onClick={() => onCreate(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10).getTime())} onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag) { const p = posts.find((x) => x.id === drag)!; const o = new Date(p.date); patchPost(drag, { date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), o.getHours(), o.getMinutes()).getTime() }, "Post replanifié"); setDrag(null); } }}
              className={cn("cursor-pointer space-y-1 bg-card p-1.5 hover:bg-muted/50", view === "mois" ? "min-h-24" : "min-h-64", view === "mois" && d.getMonth() !== ref.getMonth() && "opacity-40")}>
              <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-xs tnum", same(d, new Date()) && "bg-primary text-primary-foreground")}>{d.getDate()}</span>
              {ev.slice(0, view === "mois" ? 3 : 20).map((p) => <Ev key={p.id} p={p} />)}{view === "mois" && ev.length > 3 && <span className="text-[10px] text-muted-foreground">+{ev.length - 3}</span>}
            </div>); })}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Glissez un post pour le replanifier. Cliquez sur un jour vide pour créer un post.</p>
    </Panel>
  );
}

function Config() {
  const objectives = useStore((s) => s.objectives);
  const [obj, setObj] = React.useState("");
  const [chips, setChips] = React.useState({ services: ["Achat", "Location", "Investissement", "Estimation", "Financement"], quartiers: ["Souissi", "Agdal", "Hay Riad", "Océan"], hashtags: ["#Immo101", "#Rabat", "#Immobilier", "#Maroc"], langs: ["FR", "AR", "EN"], use: ["accompagnement", "sur mesure", "confiance"], avoid: ["pas cher", "affaire du siècle"] });
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <Panel><PanelTitle right={<Button size="sm" onClick={() => toast.success(`${title} : enregistré`)}>Enregistrer</Button>}>{title}</PanelTitle>{children}</Panel>;
  const ChipEdit = ({ k }: { k: keyof typeof chips }) => { const [v, setV] = React.useState(""); return (
    <div className="flex flex-wrap items-center gap-1.5">{chips[k].map((c) => <span key={c} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">{c}<button aria-label={`Retirer ${c}`} onClick={() => setChips({ ...chips, [k]: chips[k].filter((x) => x !== c) })}><X className="size-3" /></button></span>)}
      <form onSubmit={(e) => { e.preventDefault(); if (v.trim()) { setChips({ ...chips, [k]: [...chips[k], v.trim()] }); setV(""); } }}><Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Ajouter…" className="h-7 w-28 text-xs" /></form></div>); };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Objectifs"><div className="flex flex-wrap gap-1.5">{objectives.map((o) => <span key={o} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary">{o}<button aria-label="Retirer" onClick={() => mutate((s) => ({ ...s, objectives: s.objectives.filter((x) => x !== o) }))}><X className="size-3" /></button></span>)}</div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (obj.trim()) { mutate((s) => ({ ...s, objectives: [...s.objectives, obj.trim()] })); setObj(""); } }}><Input value={obj} onChange={(e) => setObj(e.target.value)} placeholder="Nouvel objectif" /><Button variant="outline">Ajouter</Button></form></Section>
      <Section title="Logo"><label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4"><img src="/immo101-logo.svg" alt="Logo Immo101" className="h-12 dark:hidden" /><img src="/immo101--w.svg" alt="" className="hidden h-12 dark:block" /><span className="text-sm text-muted-foreground">Cliquez pour remplacer (SVG, PNG)</span><input type="file" className="sr-only" onChange={() => toast.success("Logo importé")} /></label></Section>
      <Section title="Tonalité et fréquence par plateforme">
        <div className="space-y-2">{["Instagram", "LinkedIn", "Site web"].map((x) => <div key={x} className="grid grid-cols-[1fr_auto_140px_140px] items-center gap-2 text-sm"><span>{x}</span><Switch defaultChecked aria-label={x} /><Select defaultValue="Chaleureux"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Chaleureux", "Premium", "Informatif"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><Select defaultValue="3"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["1", "2", "3", "5"].map((t) => <SelectItem key={t} value={t}>{t} / semaine</SelectItem>)}</SelectContent></Select></div>)}</div>
      </Section>
      <Section title="Services de l'agence"><ChipEdit k="services" /></Section>
      <Section title="Quartiers mis en avant"><ChipEdit k="quartiers" /></Section>
      <Section title="Hashtags par défaut"><ChipEdit k="hashtags" /></Section>
      <Section title="Langues"><ChipEdit k="langs" /></Section>
      <Section title="Mots à utiliser et à éviter"><p className="mb-1 text-xs text-muted-foreground">À utiliser</p><ChipEdit k="use" /><p className="mb-1 mt-3 text-xs text-muted-foreground">À éviter</p><ChipEdit k="avoid" /></Section>
    </div>
  );
}
