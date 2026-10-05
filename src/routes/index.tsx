import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImmoScene } from "@/components/ImmoScene";

const Villa3D = React.lazy(() => import("@/components/Villa3D"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — Immo101 Backoffice IA" },
      { name: "description", content: "Connexion au backoffice IA d'Immo101 : leads qualifiés, relances et publications." },
      { property: "og:title", content: "Connexion — Immo101 Backoffice IA" },
      { property: "og:description", content: "Backoffice IA de l'agence immobilière Immo101 à Rabat." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("zoubida@immo101-demo.ma");
  const [pwd, setPwd] = React.useState("Demo2026!");
  const [forgot, setForgot] = React.useState(false);
  const [fEmail, setFEmail] = React.useState("zoubida@immo101-demo.ma");
  const [sent, setSent] = React.useState(false);
  const emailErr = email && !/^\S+@\S+\.\S+$/.test(email) ? "Adresse email invalide." : "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (emailErr || !pwd) return;
    setLoading(true); setTimeout(() => navigate({ to: "/tableau-de-bord" }), 1100);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <ImmoScene level="hero" />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass mx-auto w-full max-w-md rounded-[2rem] border p-10">
          <img src="/immo101-logo.svg" alt="Immo101" className="h-14 dark:hidden" />
          <img src="/immo101--w.svg" alt="Immo101" className="hidden h-14 dark:block" />
          <h1 className="mt-8 font-display text-4xl">Backoffice IA</h1>
          <p className="mt-1 text-sm text-muted-foreground">Leads WhatsApp et email, qualifiés par votre agent IA.</p>
          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <div><Label htmlFor="em">Email</Label><Input id="em" className="mt-1 h-11" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailErr} />{emailErr && <p className="mt-1 text-xs text-danger">{emailErr}</p>}</div>
            <div>
              <div className="flex items-center justify-between"><Label htmlFor="pw">Mot de passe</Label><button type="button" onClick={() => { setSent(false); setForgot(true); }} className="text-xs text-primary hover:underline">Mot de passe oublié ?</button></div>
              <div className="relative mt-1"><Input id="pw" className="h-11 pr-10" type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} />
                <button type="button" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
              {!pwd && <p className="mt-1 text-xs text-danger">Le mot de passe est requis.</p>}
            </div>
            <Button size="lg" className="w-full" disabled={loading}>{loading ? <><Loader2 className="animate-spin" />Connexion…</> : "Se connecter"}</Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">Environnement de démonstration</p>
        </motion.div>
        <div className="hidden h-[560px] lg:block">
          <React.Suspense fallback={null}><Villa3D /></React.Suspense>
        </div>
      </div>
      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Mot de passe oublié</DialogTitle><DialogDescription>Recevez un lien de réinitialisation par email.</DialogDescription></DialogHeader>
          {sent ? <p className="flex items-center gap-2 rounded-xl bg-success-soft p-3 text-sm text-success"><CheckCircle2 className="size-4" />Lien envoyé à {fEmail}. Pensez à vérifier vos spams.</p> : <div><Label htmlFor="fe">Email</Label><Input id="fe" value={fEmail} onChange={(e) => setFEmail(e.target.value)} /></div>}
          <DialogFooter>{sent ? <Button onClick={() => setForgot(false)}>Fermer</Button> : <Button disabled={!/^\S+@\S+\.\S+$/.test(fEmail)} onClick={() => setSent(true)}>Envoyer le lien</Button>}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
