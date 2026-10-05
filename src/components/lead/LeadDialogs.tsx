import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Mail, CheckCircle2, Upload, Shuffle, Search } from "lucide-react";
import { actions, getState, useStore } from "@/lib/store";
import { ADVISORS, type Lead, type Property } from "@/lib/seed";
import { LEAD_TYPES, LOST_REASONS, QUAL_FIELDS, STATUSES, STATUS_LABEL, TYPE_LABEL, clientResult, rdvKind, tempOf, fmtM, type LeadType, type Source, type Status } from "@/lib/domain";
import { AiNote, Avatar, ScoreRing, TempBadge, TypeBadge, Typing, norm } from "@/components/kit";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Field = ({ label, children, error, id }: { label: string; children: React.ReactNode; error?: string; id?: string }) => (
  <div className="space-y-1"><Label htmlFor={id}>{label}</Label>{children}{error && <p className="text-xs text-danger">{error}</p>}</div>
);

export function StatusDialog({ lead, open, onOpenChange, initial }: { lead: Lead; open: boolean; onOpenChange: (v: boolean) => void; initial?: Status }) {
  const [s, setS] = React.useState<Status>(initial ?? lead.status);
  const [reason, setReason] = React.useState("");
  const [result, setResult] = React.useState(clientResult(lead.type));
  const [amount, setAmount] = React.useState("");
  React.useEffect(() => { if (open) { setS(initial ?? lead.status); setReason(""); setAmount(""); setResult(clientResult(lead.type)); } }, [open]);
  const err = s === "perdu" && !reason ? "Le motif est obligatoire pour « Perdu »." : s === "client" && !amount ? "Indiquez le montant." : "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Changer le statut</DialogTitle><DialogDescription>{lead.name} · {TYPE_LABEL[lead.type]}</DialogDescription></DialogHeader>
        <Field label="Nouveau statut"><Select value={s} onValueChange={(v) => setS(v as Status)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{STATUS_LABEL[x]}{x === "rdv" ? ` (${rdvKind(lead.type)})` : ""}</SelectItem>)}</SelectContent></Select></Field>
        {s === "perdu" && <Field label="Motif (obligatoire)" error={!reason ? "Choisissez un motif." : undefined}><Select value={reason} onValueChange={setReason}><SelectTrigger><SelectValue placeholder="Choisir un motif" /></SelectTrigger><SelectContent>{LOST_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></Field>}
        {s === "client" && <div className="grid grid-cols-2 gap-3">
          <Field label="Résultat"><Select value={result} onValueChange={setResult}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Vente conclue", "Location signée", "Mandat signé", "Investissement conclu"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Montant (MAD)" id="amt" error={!amount ? "Montant requis." : undefined}><Input id="amt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} /></Field>
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button disabled={!!err || s === lead.status} onClick={() => { actions.changeStatus(lead.id, s, { reason: reason || undefined, result: s === "client" ? result : undefined, amount: amount ? Number(amount) : undefined }); onOpenChange(false); }}>Confirmer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssignDialog({ ids, open, onOpenChange, onDone }: { ids: string[]; open: boolean; onOpenChange: (v: boolean) => void; onDone?: () => void }) {
  const [a, setA] = React.useState(ADVISORS[1].name);
  const leads = useStore((s) => s.leads);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Assigner un conseiller</DialogTitle><DialogDescription>{ids.length} lead{ids.length > 1 ? "s" : ""} sélectionné{ids.length > 1 ? "s" : ""}</DialogDescription></DialogHeader>
        <div className="space-y-2">{ADVISORS.map((x) => (
          <button key={x.id} onClick={() => setA(x.name)} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left", a === x.name && "border-primary bg-primary-soft")}>
            <Avatar name={x.name} /><span className="flex-1 text-sm font-medium">{x.name}</span><span className="text-xs text-muted-foreground tnum">{leads.filter((l) => l.advisor === x.name).length} leads</span>
          </button>))}</div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={() => { actions.assign(ids, a); onOpenChange(false); onDone?.(); }}>Assigner</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RdvDialog({ lead, open, onOpenChange }: { lead: Lead; open: boolean; onOpenChange: (v: boolean) => void }) {
  const kinds = lead.type === "investisseur" ? ["RDV conseil", "Visite"] : lead.type === "vendeur" || lead.type === "bailleur" ? ["Estimation sur place", "RDV conseil"] : ["Visite", "RDV conseil"];
  const [f, setF] = React.useState({ kind: kinds[0], date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: "11:00", duration: "60", advisor: lead.advisor ?? "Zoubida Labdi", place: "Sur place", channel: "WhatsApp", r24: true, r2: true, notes: "" });
  const at = new Date(`${f.date}T${f.time}`).getTime();
  const conflict = useStore((s) => s.leads.some((l) => l.id !== lead.id && l.rdvs.some((r) => r.advisor === f.advisor && Math.abs(r.at - at) < Number(f.duration) * 60000)));
  const past = at < Date.now();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-display">Planifier un RDV</DialogTitle><DialogDescription>{lead.name}</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{kinds.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Conseiller"><Select value={f.advisor} onValueChange={(v) => setF({ ...f, advisor: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ADVISORS.map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Date" id="rd" error={past ? "La date doit être dans le futur." : undefined}><Input id="rd" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Heure" id="rh"><Input id="rh" type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
          <Field label="Durée"><Select value={f.duration} onValueChange={(v) => setF({ ...f, duration: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["30", "60", "90", "120"].map((d) => <SelectItem key={d} value={d}>{d} min</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Lieu"><Select value={f.place} onValueChange={(v) => setF({ ...f, place: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sur place">Au bien</SelectItem><SelectItem value="Agence Immo101 Agdal">Agence</SelectItem></SelectContent></Select></Field>
          <Field label="Confirmation"><Select value={f.channel} onValueChange={(v) => setF({ ...f, channel: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="Email">Email</SelectItem></SelectContent></Select></Field>
          <div className="space-y-2 pt-6 text-sm"><label className="flex items-center gap-2"><Checkbox checked={f.r24} onCheckedChange={(v) => setF({ ...f, r24: !!v })} />Rappel 24 h avant</label><label className="flex items-center gap-2"><Checkbox checked={f.r2} onCheckedChange={(v) => setF({ ...f, r2: !!v })} />Rappel 2 h avant</label></div>
        </div>
        {conflict && <p className="rounded-xl bg-warning-soft p-2.5 text-xs text-warning">Conflit : {f.advisor} a déjà un RDV sur ce créneau.</p>}
        <Field label="Notes"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button disabled={past} onClick={() => { actions.planRdv(lead.id, { at, kind: f.kind, advisor: f.advisor, place: f.place, duration: Number(f.duration), notes: f.notes }); onOpenChange(false); }}>Planifier</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PropertyPicker({ open, onOpenChange, onPick, mode, multi = true }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (ids: string[]) => void; mode?: "Vente" | "Location"; multi?: boolean }) {
  const props = useStore((s) => s.properties);
  const [q, setQ] = React.useState(""); const [type, setType] = React.useState("all"); const [m, setM] = React.useState<string>(mode ?? "all");
  const [sel, setSel] = React.useState<string[]>([]);
  React.useEffect(() => { if (open) setSel([]); }, [open]);
  const list = props.filter((p) => (type === "all" || p.type === type) && (m === "all" || p.mode === m) && norm(`${p.ref} ${p.title} ${p.quartier}`).includes(norm(q)));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="font-display">Choisir un bien</DialogTitle><DialogDescription>40 biens du portefeuille Immo101</DialogDescription></DialogHeader>
        <div className="flex gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Référence, quartier…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={type} onValueChange={setType}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous types</SelectItem>{["Villa", "Appartement", "Terrain", "Bureau", "Local commercial", "Riad", "Immeuble"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          <Select value={m} onValueChange={setM}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Vente et location</SelectItem><SelectItem value="Vente">Vente</SelectItem><SelectItem value="Location">Location</SelectItem></SelectContent></Select>
        </div>
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {list.map((p) => (
            <button key={p.id} onClick={() => setSel((s) => (multi ? (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]) : [p.id]))} className={cn("flex w-full items-center gap-3 rounded-xl border p-2.5 text-left text-sm", sel.includes(p.id) && "border-primary bg-primary-soft")}>
              <PropThumb p={p} className="h-12 w-16" />
              <div className="min-w-0 flex-1"><p className="font-medium">{p.ref} · {p.title}</p><p className="text-xs text-muted-foreground">{p.type} · {p.quartier} · {p.surface} m² · {p.status}</p></div>
              <span className="text-sm font-semibold tnum">{p.mode === "Location" ? p.price.toLocaleString("fr-FR") + " MAD/mois" : fmtM(p.price)}</span>
            </button>
          ))}
          {!list.length && <p className="py-8 text-center text-sm text-muted-foreground">Aucun bien ne correspond.</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button disabled={!sel.length} onClick={() => { onPick(sel); onOpenChange(false); }}>Ajouter {sel.length > 0 && `(${sel.length})`}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PropThumb({ p, className }: { p: Property; className?: string }) {
  const hue = (parseInt(p.ref.replace(/\D/g, "")) * 37) % 60;
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-lg", className)} style={{ background: `linear-gradient(135deg, oklch(0.85 0.06 ${20 + hue}), oklch(0.6 0.08 ${hue}))` }} aria-hidden>
      <svg viewBox="0 0 60 40" className="absolute inset-0 h-full w-full opacity-70"><path d="M8 34V20l12-8 12 8v14M32 34V14h18v20" stroke="white" strokeWidth="1.5" fill="none" /><path d="M0 34h60" stroke="white" strokeWidth="1" /></svg>
    </div>
  );
}

export function SendDialog({ lead, open, onOpenChange, propIds: init = [] }: { lead: Lead; open: boolean; onOpenChange: (v: boolean) => void; propIds?: string[] }) {
  const props = useStore((s) => s.properties);
  const [ch, setCh] = React.useState<"WhatsApp" | "Email">(lead.source === "email" ? "Email" : "WhatsApp");
  const [ids, setIds] = React.useState<string[]>(init);
  const [pick, setPick] = React.useState(false);
  React.useEffect(() => { if (open) setIds(init.length ? init : lead.proposed.slice(0, 1).map((p) => p.propId)); }, [open]);
  const chosen = props.filter((p) => ids.includes(p.id));
  const first = lead.name.split(" ")[0];
  const text = chosen.length ? `Bonjour ${first}, voici ${chosen.length > 1 ? "une sélection de biens" : "un bien"} qui correspond à votre recherche :\n${chosen.map((p) => `• ${p.ref} · ${p.title}, ${p.quartier}, ${p.surface} m², ${p.mode === "Location" ? p.price.toLocaleString("fr-FR") + " MAD/mois" : fmtM(p.price)}`).join("\n")}\nSouhaitez-vous organiser une visite ? Immo101` : `Bonjour ${first}, veuillez trouver ci-joint notre fiche de présentation. Immo101`;
  const [msg, setMsg] = React.useState(text);
  React.useEffect(() => setMsg(text), [ids.join(), open]);
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Envoyer un bien ou une fiche</DialogTitle><DialogDescription>{lead.name} · {ch === "WhatsApp" ? lead.phone : lead.email}</DialogDescription></DialogHeader>
          <div className="flex gap-2">{(["WhatsApp", "Email"] as const).map((c) => <Button key={c} variant={ch === c ? "default" : "outline"} size="sm" onClick={() => setCh(c)}>{c === "WhatsApp" ? <MessageCircle /> : <Mail />}{c}</Button>)}</div>
          <div className="flex flex-wrap items-center gap-2">{chosen.map((p) => <span key={p.id} className="rounded-full bg-muted px-2.5 py-1 text-xs">{p.ref}</span>)}<Button size="sm" variant="ghost" onClick={() => setPick(true)}>+ Ajouter un bien</Button></div>
          <Field label="Aperçu du message (modèle)"><Textarea rows={7} value={msg} onChange={(e) => setMsg(e.target.value)} /></Field>
          <p className="text-xs text-muted-foreground">Une relance démarrera automatiquement après l'envoi.</p>
          <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button disabled={!msg.trim()} onClick={() => { actions.sendProperty(lead.id, ids, ch, msg); onOpenChange(false); }}>Envoyer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <PropertyPicker open={pick} onOpenChange={setPick} onPick={(x) => setIds((s) => [...new Set([...s, ...x])])} mode={lead.type === "locataire" ? "Location" : lead.type === "acheteur" ? "Vente" : undefined} />
    </>
  );
}

export function MergeDialog({ lead, open, onOpenChange }: { lead: Lead; open: boolean; onOpenChange: (v: boolean) => void }) {
  const leads = useStore((s) => s.leads);
  const tail = lead.phone.slice(-5);
  const dup = leads.filter((l) => l.id !== lead.id && (l.phone.slice(-5) === tail || l.name === lead.name || (l.type === lead.type && l.quartier === lead.quartier && l.name.split(" ")[1] === lead.name.split(" ")[1])));
  const [pick, setPick] = React.useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Fusionner un doublon</DialogTitle><DialogDescription>Doublons potentiels détectés (même numéro, même nom).</DialogDescription></DialogHeader>
        {dup.length ? dup.slice(0, 5).map((d) => (
          <button key={d.id} onClick={() => setPick(d.id)} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm", pick === d.id && "border-primary bg-primary-soft")}>
            <Avatar name={d.name} /><div className="flex-1"><p className="font-medium">{d.name} <span className="text-xs text-muted-foreground">({d.id})</span></p><p className="text-xs text-muted-foreground">{d.phone} · {TYPE_LABEL[d.type]}</p></div>
          </button>)) : <p className="py-6 text-center text-sm text-muted-foreground">Aucun doublon détecté pour {lead.phone}.</p>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button disabled={!pick} onClick={() => { actions.merge(lead.id, pick!); onOpenChange(false); }}>Fusionner dans {lead.name}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Confirm({ open, onOpenChange, title, text, onConfirm, label = "Supprimer" }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; text: string; onConfirm: () => void; label?: string }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{text}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>{label}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function NewLeadDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (id: string) => void }) {
  const [type, setType] = React.useState<LeadType | null>(null);
  const [f, setF] = React.useState({ name: "", phone: "", email: "", source: "whatsapp" as Source, message: "" });
  const [q, setQ] = React.useState<Record<string, unknown>>({});
  const [touched, setTouched] = React.useState(false);
  const [leave, setLeave] = React.useState(false);
  React.useEffect(() => { if (open) { setType(null); setF({ name: "", phone: "", email: "", source: "whatsapp", message: "" }); setQ({}); setTouched(false); } }, [open]);
  const dirty = !!(f.name || f.phone || f.email || Object.keys(q).length);
  const errs = { name: !f.name.trim() ? "Le nom est obligatoire." : "", phone: f.phone && !/^\+?[\d\s]{9,}$/.test(f.phone) ? "Numéro invalide (ex. +212 6 12 34 56 78)." : "", email: f.email && !/^\S+@\S+\.\S+$/.test(f.email) ? "Adresse email invalide." : "" };
  const close = (v: boolean) => { if (!v && dirty) setLeave(true); else onOpenChange(v); };
  return (
    <>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Nouveau lead</DialogTitle><DialogDescription>{type ? `Type : ${TYPE_LABEL[type]}` : "Choisissez d'abord le type de lead."}{dirty && <span className="ml-2 text-success">· Brouillon enregistré automatiquement</span>}</DialogDescription></DialogHeader>
          {!type ? (
            <div className="grid grid-cols-3 gap-2">{LEAD_TYPES.map((t) => <button key={t} onClick={() => setType(t)} className="rounded-2xl border p-4 text-left hover:border-primary"><TypeBadge t={t} /></button>)}</div>
          ) : (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nom *" id="nl-n" error={touched ? errs.name : ""}><Input id="nl-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onBlur={() => setTouched(true)} /></Field>
                <Field label="Téléphone" id="nl-p" error={errs.phone}><Input id="nl-p" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+212 6…" /></Field>
                <Field label="Email" id="nl-e" error={errs.email}><Input id="nl-e" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
                <Field label="Source"><Select value={f.source} onValueChange={(v) => setF({ ...f, source: v as Source })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[["whatsapp", "WhatsApp"], ["email", "Email"], ["site", "Site web"], ["instagram", "Instagram"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></Field>
              </div>
              <Field label="Message / besoin"><Textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Champs spécifiques · {TYPE_LABEL[type]}</p>
              <div className="grid grid-cols-2 gap-3">{QUAL_FIELDS[type].slice(0, 8).map((fd) => (
                <Field key={fd.key} label={fd.label + (fd.unit ? ` (${fd.unit})` : "")}>
                  {fd.kind === "select" || fd.kind === "multi" ? <Select value={(Array.isArray(q[fd.key]) ? (q[fd.key] as string[])[0] : (q[fd.key] as string)) ?? ""} onValueChange={(v) => setQ({ ...q, [fd.key]: fd.kind === "multi" ? [v] : v })}><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{fd.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                    : fd.kind === "toggle" ? <label className="flex h-9 items-center gap-2 text-sm"><Checkbox checked={!!q[fd.key]} onCheckedChange={(v) => setQ({ ...q, [fd.key]: !!v })} />Oui</label>
                    : <Input type={fd.kind === "number" ? "number" : fd.kind === "date" ? "date" : "text"} value={(q[fd.key] as string) ?? ""} onChange={(e) => setQ({ ...q, [fd.key]: fd.kind === "number" ? Number(e.target.value) : e.target.value })} />}
                </Field>))}</div>
            </div>
          )}
          <DialogFooter>{type && <Button variant="ghost" onClick={() => setType(null)}>Changer de type</Button>}<Button variant="outline" onClick={() => close(false)}>Annuler</Button>{type && <Button disabled={!!(errs.name || errs.phone || errs.email)} onClick={() => { const id = actions.addLead(type, { ...f, qual: q }); onOpenChange(false); onCreated(id); }}>Créer le lead</Button>}</DialogFooter>
        </DialogContent>
      </Dialog>
      <Confirm open={leave} onOpenChange={setLeave} title="Quitter sans enregistrer ?" text="Les informations saisies seront perdues." label="Quitter" onConfirm={() => { setLeave(false); onOpenChange(false); }} />
    </>
  );
}

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => { if (open) setStep(0); }, [open]);
  const cols = ["Nom complet", "Téléphone", "Email", "Type", "Source", "Message"];
  const targets = ["Nom", "Téléphone", "Email", "Type de lead", "Source", "Message initial"];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-display">Importer des leads</DialogTitle><DialogDescription>Étape {step + 1} / 3 · {["Fichier", "Correspondance des colonnes", "Confirmation"][step]}</DialogDescription></DialogHeader>
        {step === 0 && <button onClick={() => setStep(1)} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-10 text-sm text-muted-foreground hover:border-primary"><Upload className="size-6 text-primary" />Déposez un fichier CSV ou cliquez pour choisir<span className="text-xs">leads-salon-immobilier.csv (simulation)</span></button>}
        {step === 1 && <div className="space-y-2">{cols.map((c, i) => <div key={c} className="grid grid-cols-2 items-center gap-3 text-sm"><span className="rounded-lg bg-muted px-3 py-2">{c}</span><Select defaultValue={targets[i]}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{targets.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}<SelectItem value="ignore">Ignorer</SelectItem></SelectContent></Select></div>)}</div>}
        {step === 2 && <p className="flex items-center gap-2 rounded-xl bg-success-soft p-3 text-sm text-success"><CheckCircle2 className="size-4" />24 lignes prêtes, 2 doublons ignorés (même téléphone).</p>}
        <DialogFooter>{step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Retour</Button>}{step < 2 ? <Button disabled={step === 0} onClick={() => setStep(step + 1)}>Suivant</Button> : <Button onClick={() => { onOpenChange(false); toast.success("Import simulé terminé", { description: "En démonstration, aucun lead n'est ajouté pour garder les compteurs cohérents." }); }}>Importer</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SIM_MSG: Record<LeadType, { text: string; lang: "FR" | "AR" | "EN"; fields: [string, unknown][]; score: number }> = {
  acheteur: { text: "Salam, je cherche un appartement 3 chambres à Agdal, budget 2,2 M, j'ai un accord de la banque. On peut visiter cette semaine ?", lang: "FR", score: 84, fields: [["typeBien", "Appartement"], ["chambres", 3], ["quartiers", ["Agdal"]], ["budget", 2200000], ["financement", "Crédit"], ["accord", true], ["delai", "Immédiat"], ["urgence", "Forte"]] },
  locataire: { text: "Bonjour, je cherche un meublé 2 chambres à Hay Riad, max 12 000 MAD, entrée le mois prochain, j'ai un garant.", lang: "FR", score: 72, fields: [["typeBien", "Appartement"], ["meuble", true], ["chambres", 2], ["quartiers", ["Hay Riad"]], ["budget", 12000], ["dossier", "Complet avec garant"]] },
  vendeur: { text: "Salam, bghit nbi3 villa dyali f Souissi, 450 m², titre foncier, prix 11 M.", lang: "AR", score: 66, fields: [["typeBien", "Villa"], ["quartier", "Souissi"], ["surface", 450], ["juridique", "Titre foncier"], ["prix", 11000000], ["delai", "3 à 6 mois"]] },
  bailleur: { text: "Bonjour, je souhaite louer mon appartement à Océan, 110 m², loyer 9 500 MAD, libre dès le 1er.", lang: "FR", score: 58, fields: [["typeBien", "Appartement"], ["quartier", "Océan"], ["surface", 110], ["loyer", 9500], ["occupe", false]] },
  investisseur: { text: "Hello, I'm based in Dubai and looking to invest 5M MAD in rental apartments in Rabat, targeting 7% yield.", lang: "EN", score: 88, fields: [["strategie", "Locatif résidentiel"], ["budget", 5000000], ["rendement", 7], ["horizon", 8], ["financement", "Comptant"], ["resident", "Non-résident"]] },
  autre: { text: "Bonjour, proposez-vous un service de gestion locative ?", lang: "FR", score: 31, fields: [["objet", "Information"], ["detail", "Gestion locative"]] },
};

export function SimulateDialog({ open, onOpenChange, onOpenLead }: { open: boolean; onOpenChange: (v: boolean) => void; onOpenLead: (id: string) => void }) {
  const [ch, setCh] = React.useState<"whatsapp" | "email">("whatsapp");
  const [t, setT] = React.useState<LeadType | "random">("random");
  const [phase, setPhase] = React.useState<"setup" | "in" | "reply" | "done">("setup");
  const [type, setType] = React.useState<LeadType>("acheteur");
  const [filled, setFilled] = React.useState(0);
  const [leadId, setLeadId] = React.useState<string | null>(null);
  React.useEffect(() => { if (open) { setPhase("setup"); setFilled(0); setLeadId(null); } }, [open]);
  const sim = SIM_MSG[type];
  React.useEffect(() => {
    if (phase !== "reply") return;
    if (filled < sim.fields.length) { const x = setTimeout(() => setFilled((f) => f + 1), 420); return () => clearTimeout(x); }
    return undefined;
  }, [phase, filled]);
  const start = () => {
    const ty = t === "random" ? LEAD_TYPES[Math.floor(Math.random() * 6)] : t;
    setType(ty); setPhase("in"); setFilled(0);
    setTimeout(() => setPhase("reply"), 1400);
  };
  const finish = () => {
    const l = actions.simulate(type, ch, sim.score, Object.fromEntries(sim.fields), sim.text, sim.lang);
    setLeadId(l.id); setPhase("done");
  };
  React.useEffect(() => { if (phase === "reply" && filled >= sim.fields.length) { const x = setTimeout(finish, 500); return () => clearTimeout(x); } return undefined; }, [filled, phase]);
  const score = Math.round((sim.score * filled) / sim.fields.length);
  const fieldLabel = (k: string) => QUAL_FIELDS[type].find((f) => f.key === k)?.label ?? k;
  const fmt = (v: unknown) => (Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Oui" : "Non") : typeof v === "number" && v > 10000 ? fmtM(v) : String(v));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle className="font-display">Message entrant (simulation)</DialogTitle><DialogDescription>L'agent IA répond et qualifie le lead en direct.</DialogDescription></DialogHeader>
        {phase === "setup" ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Canal"><div className="flex gap-2">{(["whatsapp", "email"] as const).map((c) => <Button key={c} variant={ch === c ? "default" : "outline"} onClick={() => setCh(c)}>{c === "whatsapp" ? <><MessageCircle />WhatsApp</> : <><Mail />Email</>}</Button>)}</div></Field>
            <Field label="Type de lead"><Select value={t} onValueChange={(v) => setT(v as LeadType | "random")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="random"><Shuffle className="mr-1 inline size-3" />Aléatoire</SelectItem>{LEAD_TYPES.map((x) => <SelectItem key={x} value={x}>{TYPE_LABEL[x]}</SelectItem>)}</SelectContent></Select></Field>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-[1fr_280px]">
            <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{ch === "whatsapp" ? <MessageCircle className="size-3.5 text-success" /> : <Mail className="size-3.5" />}{ch === "whatsapp" ? "WhatsApp" : "Email"} · à l'instant</p>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="max-w-[90%] rounded-2xl rounded-tl-sm bg-card p-3 text-sm shadow-sm">{sim.text}</motion.div>
              {phase !== "in" ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-primary p-3 text-sm text-primary-foreground"><Typing text={sim.lang === "EN" ? "Thank you! I'm Immo101's assistant. A 7% gross yield is realistic in Agdal and Hay Riad. Would you like an advisor to send you a shortlist?" : sim.lang === "AR" ? "Merci 3la message ! Ana l'assistant dyal Immo101. Wach 3andek les plans dyal villa ? Nqder nreserver lik estimation sur place." : "Merci pour votre message ! Je suis l'assistant d'Immo101. J'ai bien noté vos critères. Je vous propose un conseiller pour la suite."} /></motion.div>
                : <p className="ml-auto w-fit rounded-full bg-card px-3 py-1.5 text-xs text-muted-foreground">L'agent IA écrit…</p>}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3"><ScoreRing score={score} size={64} /><div><TypeBadge t={type} /><div className="mt-1"><TempBadge t={tempOf(score)} /></div></div></div>
              <div className="space-y-1.5">
                <AnimatePresence>{sim.fields.slice(0, filled).map(([k, v]) => (
                  <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-xs"><span className="text-muted-foreground">{fieldLabel(k)}</span><span className="font-medium">{fmt(v)}</span></motion.div>
                ))}</AnimatePresence>
              </div>
              {phase === "done" && <p className="rounded-xl bg-success-soft p-2 text-xs text-success">Lead créé{sim.score >= 80 ? " · l'agent a passé la main (À reprendre)" : ""}.</p>}
              <AiNote />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          {phase === "setup" && <Button onClick={start}>Simuler</Button>}
          {phase === "done" && leadId && <Button onClick={() => { onOpenChange(false); onOpenLead(leadId); }}>Voir le lead</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { Field };
export const _g = getState;
