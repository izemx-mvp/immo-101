import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Bot, Pencil, Copy, Trash2, Upload, FileText, Phone, Mail, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, useUrlState, type Col } from "@/components/DataTable";
import { Avatar, Highlight, Panel, PanelTitle, Pill, Typing, fmtDate, norm } from "@/components/kit";
import { usePageMeta } from "@/components/AppShell";
import { PageAction } from "@/components/PageAction";
import { Confirm } from "@/components/lead/LeadDialogs";
import { mutate, useStore } from "@/lib/store";
import type { Faq, KbContact, KbDoc, ServiceSheet } from "@/lib/seed";
import { LEAD_TYPES, TYPE_LABEL, type LeadType } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/connaissances")({
  head: () => ({ meta: [{ title: "Base de connaissances — Immo101 Backoffice IA" }, { name: "description", content: "FAQ, fiches services, documents et contacts qui alimentent l'agent IA d'Immo101." }, { property: "og:title", content: "Base de connaissances — Immo101" }, { property: "og:description", content: "Sources de l'agent IA." }] }),
  component: KB,
});

const CATS = ["Achat", "Location", "Vendeurs", "Investissement", "Financement", "Général"];
const TypeChips = ({ value, onChange }: { value: LeadType[]; onChange: (v: LeadType[]) => void }) => <div className="flex flex-wrap gap-1">{LEAD_TYPES.map((t) => <button key={t} type="button" onClick={() => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t])} className={cn("rounded-full border px-2 py-0.5 text-xs", value.includes(t) && "border-primary bg-primary-soft text-primary")}>{TYPE_LABEL[t]}</button>)}</div>;

function KB() {
  usePageMeta("Base de connaissances", "Sources qui alimentent l'agent IA d'Immo101");
  const [sp, setSp] = useUrlState();
  const tab = (sp.tab as string) ?? "faq";
  const [test, setTest] = React.useState(false);
  const [adding, setAdding] = React.useState(0);
  return (
    <div>
      <PageAction><Button variant="outline" onClick={() => setTest(true)}><Bot />Tester l'agent</Button><Button onClick={() => setAdding((n) => n + 1)}><Plus />{tab === "faq" ? "Ajouter" : tab === "fiches" ? "Nouvelle fiche" : tab === "docs" ? "Uploader" : "Nouveau contact"}</Button></PageAction>
      <Tabs value={tab} onValueChange={(v) => setSp({ tab: v })}>
        <TabsList className="rounded-2xl bg-card p-1">{[["faq", "FAQ"], ["fiches", "Fiches services"], ["docs", "Documents"], ["contacts", "Contacts"]].map(([v, l]) => <TabsTrigger key={v} value={v} className="rounded-xl">{l}</TabsTrigger>)}</TabsList>
        <TabsContent value="faq"><FaqTab add={tab === "faq" ? adding : 0} /></TabsContent>
        <TabsContent value="fiches"><Fiches add={tab === "fiches" ? adding : 0} /></TabsContent>
        <TabsContent value="docs"><Docs add={tab === "docs" ? adding : 0} /></TabsContent>
        <TabsContent value="contacts"><Contacts add={tab === "contacts" ? adding : 0} /></TabsContent>
      </Tabs>
      <TestAgent open={test} onOpenChange={setTest} />
    </div>
  );
}

function FaqTab({ add }: { add: number }) {
  const faqs = useStore((s) => s.faqs);
  const [cat, setCat] = React.useState("all"); const [st, setSt] = React.useState("all");
  const [edit, setEdit] = React.useState<Faq | null>(null);
  const [del, setDel] = React.useState<string | null>(null);
  React.useEffect(() => { if (add) setEdit({ id: "F" + Date.now(), q: "", a: "", cat: "Général", status: "Brouillon", used: 0, updatedAt: Date.now(), types: [], langs: ["FR"] }); }, [add]);
  const rows = faqs.filter((f) => (cat === "all" || f.cat === cat) && (st === "all" || f.status === st));
  const cols: Col<Faq>[] = [
    { key: "q", label: "Question", sort: (f) => f.q, csv: (f) => f.q, render: (f, q) => <span className="font-medium"><Highlight text={f.q} q={q} /></span> },
    { key: "c", label: "Catégorie", sort: (f) => f.cat, csv: (f) => f.cat, render: (f) => <Pill tone="neutral" dot={false}>{f.cat}</Pill> },
    { key: "s", label: "Statut", csv: (f) => f.status, render: (f) => <Pill tone={f.status === "Actif" ? "success" : "warning"}>{f.status}</Pill> },
    { key: "a", label: "", hideable: false, render: (f) => <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}><Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => setEdit(f)}><Pencil /></Button><Button size="icon" variant="ghost" aria-label="Dupliquer" onClick={() => mutate((s) => ({ ...s, faqs: [{ ...f, id: f.id + "c" + Date.now(), q: f.q + " (copie)", status: "Brouillon" }, ...s.faqs] }), "FAQ dupliquée")}><Copy /></Button><Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => setDel(f.id)}><Trash2 /></Button></div> },
  ];
  return (
    <Panel spotlight={false} className="p-4">
      <DataTable id="faq" rows={rows} cols={cols} rowKey={(f) => f.id} search={(f) => f.q + " " + f.a} placeholder="Rechercher une question…" onOpen={(f) => setEdit(f)}
        toolbar={<><Select value={cat} onValueChange={setCat}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes catégories</SelectItem>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><Select value={st} onValueChange={setSt}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem><SelectItem value="Actif">Actif</SelectItem><SelectItem value="Brouillon">Brouillon</SelectItem></SelectContent></Select></>} />
      <Sheet open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <SheetContent className="w-[520px] overflow-y-auto sm:max-w-[520px]">{edit && <FaqEdit f={edit} onClose={() => setEdit(null)} />}</SheetContent>
      </Sheet>
      <Confirm open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Supprimer cette FAQ ?" text="L'agent IA ne pourra plus l'utiliser." onConfirm={() => { mutate((s) => ({ ...s, faqs: s.faqs.filter((x) => x.id !== del) }), "FAQ supprimée"); setDel(null); }} />
    </Panel>
  );
}
function FaqEdit({ f, onClose }: { f: Faq; onClose: () => void }) {
  const [x, setX] = React.useState(f);
  const exists = useStore((s) => s.faqs.some((y) => y.id === f.id));
  const err = !x.q.trim() ? "La question est obligatoire." : !x.a.trim() ? "La réponse est obligatoire." : "";
  return (
    <>
      <SheetHeader><SheetTitle className="font-display text-xl">{exists ? "Modifier la FAQ" : "Nouvelle FAQ"}</SheetTitle><SheetDescription>Utilisée {x.used} fois par l'agent · mise à jour {fmtDate(x.updatedAt)}</SheetDescription></SheetHeader>
      <div className="mt-4 space-y-3">
        <div className="space-y-1"><Label>Question</Label><Input value={x.q} onChange={(e) => setX({ ...x, q: e.target.value })} /></div>
        <div className="space-y-1"><Label>Réponse</Label><Textarea rows={5} value={x.a} onChange={(e) => setX({ ...x, a: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-2"><div className="space-y-1"><Label>Catégorie</Label><Select value={x.cat} onValueChange={(v) => setX({ ...x, cat: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Statut</Label><Select value={x.status} onValueChange={(v) => setX({ ...x, status: v as Faq["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Actif">Actif</SelectItem><SelectItem value="Brouillon">Brouillon</SelectItem></SelectContent></Select></div></div>
        <div className="space-y-1"><Label>Types de leads concernés</Label><TypeChips value={x.types} onChange={(t) => setX({ ...x, types: t })} /></div>
        <div className="space-y-1"><Label>Langues</Label><div className="flex gap-1">{["FR", "AR", "EN"].map((l) => <button key={l} type="button" onClick={() => setX({ ...x, langs: x.langs.includes(l) ? x.langs.filter((y) => y !== l) : [...x.langs, l] })} className={cn("rounded-full border px-3 py-0.5 text-xs", x.langs.includes(l) && "border-primary bg-primary-soft text-primary")}>{l}</button>)}</div></div>
        {err && <p className="text-xs text-danger">{err}</p>}
        <Button disabled={!!err} onClick={() => { mutate((s) => ({ ...s, faqs: exists ? s.faqs.map((y) => (y.id === x.id ? { ...x, updatedAt: Date.now() } : y)) : [{ ...x, updatedAt: Date.now() }, ...s.faqs] }), "FAQ enregistrée"); onClose(); }}>Enregistrer</Button>
      </div>
    </>
  );
}

function Fiches({ add }: { add: number }) {
  const services = useStore((s) => s.services);
  const [edit, setEdit] = React.useState<ServiceSheet | null>(null);
  React.useEffect(() => { if (add) setEdit({ id: "S" + Date.now(), title: "", desc: "", benefits: [], steps: [], docs: [], conditions: "", types: [] }); }, [add]);
  const exists = edit && services.some((s) => s.id === edit.id);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map((s) => (
        <Panel key={s.id}><PanelTitle right={<Button size="sm" variant="outline" onClick={() => setEdit(s)}><Pencil />Modifier</Button>}>{s.title}</PanelTitle><p className="text-sm text-muted-foreground">{s.desc}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bénéfices</p><ul className="mt-1 space-y-1">{s.benefits.map((b) => <li key={b} className="flex items-center gap-2 text-sm"><Check className="size-3.5 text-success" />{b}</li>)}</ul></Panel>))}</div>
      <Sheet open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <SheetContent className="w-[520px] overflow-y-auto sm:max-w-[520px]">{edit && <>
          <SheetHeader><SheetTitle className="font-display text-xl">{exists ? "Modifier la fiche" : "Nouvelle fiche"}</SheetTitle><SheetDescription>Fiche service utilisée par l'agent IA</SheetDescription></SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1"><Label>Titre</Label><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />{!edit.title && <p className="text-xs text-danger">Le titre est obligatoire.</p>}</div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={edit.desc} onChange={(e) => setEdit({ ...edit, desc: e.target.value })} /></div>
            {(["benefits", "steps", "docs"] as const).map((k) => <div key={k} className="space-y-1"><Label>{{ benefits: "Bénéfices", steps: "Étapes du processus", docs: "Documents requis" }[k]} (une ligne par élément)</Label><Textarea value={edit[k].join("\n")} onChange={(e) => setEdit({ ...edit, [k]: e.target.value.split("\n") })} /></div>)}
            <div className="space-y-1"><Label>Conditions</Label><Textarea value={edit.conditions} onChange={(e) => setEdit({ ...edit, conditions: e.target.value })} /></div>
            <div className="space-y-1"><Label>Types de leads concernés</Label><TypeChips value={edit.types} onChange={(t) => setEdit({ ...edit, types: t })} /></div>
            <Button disabled={!edit.title} onClick={() => { const e = { ...edit, benefits: edit.benefits.filter(Boolean), steps: edit.steps.filter(Boolean), docs: edit.docs.filter(Boolean) }; mutate((s) => ({ ...s, services: exists ? s.services.map((x) => (x.id === e.id ? e : x)) : [...s.services, e] }), "Fiche enregistrée"); setEdit(null); }}>Enregistrer</Button>
          </div></>}</SheetContent>
      </Sheet>
    </>
  );
}

function Docs({ add }: { add: number }) {
  const docs = useStore((s) => s.kbDocs);
  const [prev, setPrev] = React.useState<KbDoc | null>(null);
  const [del, setDel] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (add) fileRef.current?.click(); }, [add]);
  const cols: Col<KbDoc>[] = [
    { key: "n", label: "Nom", sort: (d) => d.name, csv: (d) => d.name, render: (d, q) => <span className="flex items-center gap-2 font-medium"><FileText className="size-4 text-primary" /><Highlight text={d.name} q={q} /></span> },
    { key: "c", label: "Catégorie", sort: (d) => d.cat, csv: (d) => d.cat, render: (d) => <Pill tone="neutral" dot={false}>{d.cat}</Pill> },
    { key: "d", label: "Date", sort: (d) => d.date, csv: (d) => fmtDate(d.date), render: (d) => <span className="text-xs text-muted-foreground">{fmtDate(d.date)}</span> },
    { key: "s", label: "Taille", csv: (d) => d.size, render: (d) => <span className="text-xs tnum">{d.size}</span> },
    { key: "a", label: "", hideable: false, render: (d) => <div onClick={(e) => e.stopPropagation()} className="flex justify-end"><Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => setDel(d.id)}><Trash2 /></Button></div> },
  ];
  return (
    <Panel spotlight={false} className="p-4">
      <input ref={fileRef} type="file" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) mutate((s) => ({ ...s, kbDocs: [{ id: "D" + Date.now(), name: f.name, cat: "Divers", date: Date.now(), size: Math.max(1, Math.round(f.size / 1024)) + " Ko" }, ...s.kbDocs] }), "Document uploadé"); e.target.value = ""; }} />
      <DataTable id="doc" rows={docs} cols={cols} rowKey={(d) => d.id} search={(d) => d.name + " " + d.cat} placeholder="Rechercher un document…" onOpen={setPrev} toolbar={<Button variant="outline" onClick={() => fileRef.current?.click()}><Upload />Uploader</Button>} />
      <Sheet open={!!prev} onOpenChange={(v) => !v && setPrev(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px]">{prev && <><SheetHeader><SheetTitle className="font-display text-xl">{prev.name}</SheetTitle><SheetDescription>{prev.cat} · {prev.size} · {fmtDate(prev.date)}</SheetDescription></SheetHeader>
          <div className="mt-4 aspect-[3/4] rounded-2xl border bg-card p-8"><img src="/immo101-logo.svg" alt="" className="h-8" /><div className="mt-6 space-y-2">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-2 rounded bg-muted" style={{ width: `${60 + ((i * 37) % 40)}%` }} />)}</div></div>
          <Button variant="destructive" className="mt-4" onClick={() => { setDel(prev.id); setPrev(null); }}><Trash2 />Supprimer</Button></>}</SheetContent>
      </Sheet>
      <Confirm open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Supprimer ce document ?" text="Il ne sera plus utilisé par l'agent IA." onConfirm={() => { mutate((s) => ({ ...s, kbDocs: s.kbDocs.filter((x) => x.id !== del) }), "Document supprimé"); setDel(null); }} />
    </Panel>
  );
}

function Contacts({ add }: { add: number }) {
  const contacts = useStore((s) => s.kbContacts);
  const [edit, setEdit] = React.useState<KbContact | null>(null);
  React.useEffect(() => { if (add) setEdit({ id: "K" + Date.now(), name: "", specialty: "Vente", phone: "", email: "", role: "" }); }, [add]);
  const exists = edit && contacts.some((c) => c.id === edit.id);
  const SPEC = ["Location", "Vente", "Investissement", "Administratif"] as const;
  const errEmail = edit && edit.email && !/^\S+@\S+\.\S+$/.test(edit.email);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{SPEC.map((sp) => (
        <div key={sp} className="space-y-3"><h3 className="font-display text-lg">{sp}</h3>
          {contacts.filter((c) => c.specialty === sp).map((c) => (
            <Panel key={c.id} className="cursor-pointer p-4" onClick={() => setEdit(c)}><div className="flex items-center gap-3"><Avatar name={c.name} size={40} /><div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.role}</p></div></div>
              <p className="mt-3 flex items-center gap-2 text-sm"><Phone className="size-3.5 text-muted-foreground" />{c.phone}</p><p className="flex items-center gap-2 text-sm"><Mail className="size-3.5 text-muted-foreground" />{c.email}</p></Panel>))}
        </div>))}</div>
      <Sheet open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <SheetContent>{edit && <><SheetHeader><SheetTitle className="font-display text-xl">{exists ? "Modifier le contact" : "Nouveau contact"}</SheetTitle><SheetDescription>Contact transmis par l'agent IA</SheetDescription></SheetHeader>
          <div className="mt-4 space-y-3">
            {(["name", "role", "phone", "email"] as const).map((k) => <div key={k} className="space-y-1"><Label>{{ name: "Nom", role: "Fonction", phone: "Téléphone", email: "Email" }[k]}</Label><Input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>)}
            {errEmail && <p className="text-xs text-danger">Adresse email invalide.</p>}
            <div className="space-y-1"><Label>Spécialité</Label><Select value={edit.specialty} onValueChange={(v) => setEdit({ ...edit, specialty: v as KbContact["specialty"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SPEC.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <Button disabled={!edit.name || !!errEmail} onClick={() => { mutate((s) => ({ ...s, kbContacts: exists ? s.kbContacts.map((x) => (x.id === edit.id ? edit : x)) : [...s.kbContacts, edit] }), "Contact enregistré"); setEdit(null); }}>Enregistrer</Button>
          </div></>}</SheetContent>
      </Sheet>
    </>
  );
}

function TestAgent({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const faqs = useStore((s) => s.faqs);
  const services = useStore((s) => s.services);
  const [q, setQ] = React.useState("");
  const [ans, setAns] = React.useState<{ text: string; src: string } | null>(null);
  const ask = () => {
    const words = norm(q).split(/\W+/).filter((w) => w.length > 3);
    const best = faqs.map((f) => ({ f, s: words.filter((w) => norm(f.q + f.a).includes(w)).length })).sort((a, b) => b.s - a.s)[0];
    const svc = services.find((s) => words.some((w) => norm(s.title).includes(w)));
    if (best && best.s > 0) setAns({ text: best.f.a.replace("Réponse type validée par l'agence pour : ", "Bonne question ! Concernant « ") + " ». Un conseiller Immo101 peut vous en dire plus.", src: `FAQ · ${best.f.q}` });
    else if (svc) setAns({ text: `${svc.desc} Les étapes : ${svc.steps.join(", ")}.`, src: `Fiche service · ${svc.title}` });
    else setAns({ text: "Je n'ai pas trouvé d'information précise. Je transmets votre question à un conseiller Immo101.", src: "Aucune source : passage à un conseiller" });
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setQ(""); setAns(null); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-display">Tester l'agent</DialogTitle><DialogDescription>Posez une question comme le ferait un client.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(); }} className="flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex. Quels documents pour louer ?" /><Button size="icon" aria-label="Envoyer"><Send /></Button></form>
        {ans && <div className="space-y-2"><div className="rounded-2xl bg-muted p-3 text-sm"><Typing text={ans.text} /></div><p className="text-xs text-muted-foreground">Source utilisée : <span className="font-medium text-foreground">{ans.src}</span></p></div>}
        <p className="text-[11px] text-muted-foreground">L'IA peut se tromper. Vérifiez les informations importantes.</p>
      </DialogContent>
    </Dialog>
  );
}
