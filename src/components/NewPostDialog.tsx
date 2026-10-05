import * as React from "react";
import { Loader2, Instagram, Linkedin, Globe, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyPicker, PropThumb } from "@/components/lead/LeadDialogs";
import { mutate, useStore } from "@/lib/store";
import { fmtM } from "@/lib/domain";
import type { Post } from "@/lib/seed";

export function NewPostDialog({ open, onOpenChange, prefill }: { open: boolean; onOpenChange: (v: boolean) => void; prefill?: { propId?: string; idea?: string; date?: number } }) {
  const props = useStore((s) => s.properties);
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [pick, setPick] = React.useState(false);
  const [f, setF] = React.useState({ idea: "", desc: "", tone: "Chaleureux", propId: "", kind: "Annonce de bien" as Post["kind"], media: "Image" as Post["media"], mediaDesc: "", ref: "" });
  React.useEffect(() => { if (open) { setStep(1); setF((x) => ({ ...x, idea: prefill?.idea ?? "", propId: prefill?.propId ?? "", desc: prefill?.idea ? "Mettre en valeur le bien, ses atouts et le quartier." : "", kind: prefill?.propId ? "Annonce de bien" : x.kind })); } }, [open]);
  const p = props.find((x) => x.id === f.propId);
  const text = `${f.idea || "Nouvelle opportunité Immo101"}${p ? ` · ${p.surface} m² à ${p.quartier}, ${p.mode === "Location" ? p.price.toLocaleString("fr-FR") + " MAD/mois" : fmtM(p.price)}` : ""}. ${f.desc} Contactez nos conseillers pour une visite.`;
  const save = (status: Post["status"]) => {
    const date = status === "Publié" ? Date.now() : prefill?.date ?? Date.now() + 2 * 86400000;
    mutate((s) => ({ ...s, posts: [{ id: "P" + (s.posts.length + 100), title: f.idea || "Nouveau post", text, kind: f.kind, media: f.media, ai: 88, platforms: ["Instagram", "LinkedIn", "Site web"], status, date, hashtags: "#Immo101 #Rabat", cta: "Prendre rendez-vous", tone: f.tone, lang: "FR", propId: f.propId || undefined, stats: { vues: 0, likes: 0, clics: 0, leads: 0 } }, ...s.posts], feed: status === "Publié" ? [{ id: Math.random().toString(36), at: Date.now(), kind: "post", text: `Publication « ${f.idea || "Nouveau post"} » publiée` }, ...s.feed] : s.feed }), status === "Publié" ? "Post publié" : "Post planifié", "Visible dans Idées et Calendrier.");
    onOpenChange(false);
  };
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Nouveau post</DialogTitle><DialogDescription>Étape {step} / 2 · {step === 1 ? "Configuration" : "Aperçu"}</DialogDescription></DialogHeader>
          {step === 1 ? (
            <div className="grid max-h-[60vh] gap-3 overflow-y-auto md:grid-cols-2">
              <div className="space-y-1 md:col-span-2"><Label htmlFor="np-i">Idée / angle *</Label><Input id="np-i" value={f.idea} onChange={(e) => setF({ ...f, idea: e.target.value })} />{!f.idea && <p className="text-xs text-danger">Indiquez une idée ou un angle.</p>}</div>
              <div className="space-y-1 md:col-span-2"><Label>Description du message</Label><Textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></div>
              <div className="space-y-1"><Label>Tonalité</Label><Select value={f.tone} onValueChange={(v) => setF({ ...f, tone: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Chaleureux", "Premium", "Informatif", "Dynamique"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Type de post</Label><Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v as Post["kind"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Annonce de bien", "Conseil", "Témoignage", "Actualité marché"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1 md:col-span-2"><Label>Bien lié</Label><div className="flex items-center gap-2">{p ? <span className="flex flex-1 items-center gap-2 rounded-xl border p-2 text-sm"><PropThumb p={p} className="h-8 w-10" />{p.ref} · {p.title}</span> : <span className="flex-1 text-sm text-muted-foreground">Aucun</span>}<Button variant="outline" size="sm" onClick={() => setPick(true)}>Choisir un bien</Button></div></div>
              <div className="space-y-1"><Label>Médias à générer</Label><Select value={f.media} onValueChange={(v) => setF({ ...f, media: v as Post["media"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Image">Image</SelectItem><SelectItem value="Vidéo">Vidéo</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Référence ou source</Label><Input value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder={p?.ref} /></div>
              <div className="space-y-1 md:col-span-2"><Label>Description du média</Label><div className="flex gap-2"><Input value={f.mediaDesc} onChange={(e) => setF({ ...f, mediaDesc: e.target.value })} placeholder="Façade au coucher du soleil…" /><label className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-xl border px-3 text-sm"><Upload className="size-4" />Importer<input type="file" className="sr-only" /></label></div></div>
            </div>
          ) : (
            <Tabs defaultValue="Instagram">
              <TabsList>{[["Instagram", Instagram], ["LinkedIn", Linkedin], ["Site web", Globe]].map(([n, I]) => { const Ic = I as typeof Globe; return <TabsTrigger key={n as string} value={n as string}><Ic className="mr-1 size-3.5" />{n as string}</TabsTrigger>; })}</TabsList>
              {["Instagram", "LinkedIn", "Site web"].map((pl) => (
                <TabsContent key={pl} value={pl}>
                  <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border bg-card">
                    <div className="flex items-center gap-2 p-3 text-sm font-medium"><img src="/favicon.svg" alt="" className="h-5" />immo101.ma</div>
                    {p ? <PropThumb p={p} className={pl === "Instagram" ? "aspect-square w-full" : "aspect-video w-full"} /> : <div className="aspect-video bg-gradient-to-br from-primary/30 to-muted" />}
                    <p className="p-3 text-sm">{pl === "LinkedIn" ? "Opportunité immobilière à Rabat. " : ""}{text}{pl !== "Site web" && <span className="block pt-1 text-primary">#Immo101 #Rabat #Immobilier</span>}</p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
          <DialogFooter>
            {step === 1 ? <Button disabled={!f.idea || loading} onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); setStep(2); }, 900); }}>{loading ? <Loader2 className="animate-spin" /> : <Wand2 />}Générer le preview</Button>
              : <><Button variant="ghost" onClick={() => setStep(1)}>Retour</Button><Button variant="outline" onClick={() => save("Planifié")}>Planifier</Button><Button onClick={() => save("Publié")}>Publier</Button></>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PropertyPicker open={pick} onOpenChange={setPick} multi={false} onPick={(ids) => setF({ ...f, propId: ids[0] })} />
    </>
  );
}
