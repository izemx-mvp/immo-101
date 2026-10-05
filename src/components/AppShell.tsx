import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpen, ChevronsLeft, LayoutDashboard, LogOut, Megaphone, Moon, Repeat, Sun, Target, Users, Sparkles, Keyboard, PlayCircle, UserCircle, Zap, X, Send, ArrowUp, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImmoScene } from "@/components/ImmoScene";
import { Avatar, Seg, Typing, ago } from "@/components/kit";
import { useStore, sel, startTicker, actions } from "@/lib/store";
import { setUI, useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { checkConsistency } from "@/lib/consistency";
import { getState } from "@/lib/store";

export const NAV = [
  { to: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard, tour: "Le tableau de bord résume toute l'activité de l'agence et de l'agent IA." },
  { to: "/utilisateurs", label: "Gestion des utilisateurs", icon: Users, tour: "Gérez l'équipe, les rôles et les accès par interface." },
  { to: "/prospection", label: "Prospection", icon: Target, tour: "Tous les leads entrants, qualifiés par l'IA selon leur type." },
  { to: "/annonces", label: "Annonces & publications", icon: Megaphone, tour: "Générez, planifiez et publiez vos posts multi-plateformes." },
  { to: "/relances", label: "Relances", icon: Repeat, tour: "Les relances automatiques WhatsApp et email, classées par l'IA." },
  { to: "/connaissances", label: "Base de connaissances", icon: BookOpen, tour: "Les sources qui alimentent les réponses de l'agent IA." },
] as const;

export function usePageMeta(title: string, subtitle: string) {
  React.useEffect(() => { setUI({ title, subtitle }); }, [title, subtitle]);
}

const DENSE = ["/utilisateurs", "/connaissances"];

export function AppShell({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { collapsed, title, subtitle, reduceAnim, dark } = useUI((u) => u);
  const counts = useStore(sel.counts);
  const navigate = useNavigate();
  const [top, setTop] = React.useState(false);
  const mainRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    startTicker();
    if (import.meta.env.DEV) { const e = checkConsistency(getState()); if (e.length) console.warn("[immo101] consistency", e); }
    if (!sessionStorage.getItem("immo-tour")) { sessionStorage.setItem("immo-tour", "1"); setTimeout(() => setUI({ tour: true }), 900); }
    const h = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setUI({ palette: true }); }
      else if (e.altKey && e.key.toLowerCase() === "t") { e.preventDefault(); setUI({ notifs: true }); }
      else if (!typing && e.key === "?") setUI({ shortcuts: true });
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  React.useEffect(() => { const el = mainRef.current; if (!el) return; const f = () => setTop(el.scrollTop > 600); el.addEventListener("scroll", f); return () => el.removeEventListener("scroll", f); }, []);

  const level = reduceAnim ? "off" : DENSE.some((d) => path.startsWith(d)) ? "off" : "ambient";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex h-screen overflow-hidden bg-background">
        <ImmoScene level={level} />
        {/* Sidebar */}
        <motion.aside animate={{ width: collapsed ? 76 : 264 }} transition={{ type: "spring", bounce: 0, duration: 0.35 }} className="relative z-20 flex shrink-0 flex-col bg-ink text-ink-foreground">
          <div className="flex h-20 items-center px-5">
            {collapsed ? <img src="/favicon.svg" alt="Immo101" className="mx-auto h-8" /> : <img src="/immo101--w.svg" alt="Immo101" className="h-10" />}
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navigation principale">
            {NAV.map((n) => {
              const active = path.startsWith(n.to);
              const item = (
                <Link key={n.to} to={n.to} data-tour={n.to} className={cn("relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "text-ink-foreground" : "text-ink-muted hover:bg-ink-line hover:text-ink-foreground")}>
                  {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-ink-line" />}
                  {active && <motion.span layoutId="nav-bar" className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-primary" />}
                  <n.icon className="relative size-[18px] shrink-0" />
                  {!collapsed && <span className="relative flex-1 truncate">{n.label}</span>}
                  {n.to === "/prospection" && counts.nouveaux > 0 && <span className={cn("relative rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground tnum", collapsed && "absolute right-1 top-1")}>{counts.nouveaux}</span>}
                </Link>
              );
              return collapsed ? <Tooltip key={n.to}><TooltipTrigger asChild>{item}</TooltipTrigger><TooltipContent side="right">{n.label}</TooltipContent></Tooltip> : item;
            })}
          </nav>
          <div className="space-y-2 p-3">
            <button onClick={() => setUI({ collapsed: !collapsed })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-muted hover:bg-ink-line hover:text-ink-foreground" aria-label="Réduire la barre latérale">
              <ChevronsLeft className={cn("size-[18px] transition-transform", collapsed && "rotate-180")} />{!collapsed && "Réduire"}
            </button>
            <UserMenu collapsed={collapsed} />
          </div>
        </motion.aside>

        {/* Main */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 shrink-0 items-center justify-between gap-4 px-8">
            <div className="min-w-0">
              <h1 className="truncate font-display text-[28px] leading-tight">{title}</h1>
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <div id="page-action" className="flex items-center gap-2">{action}</div>
              <Button variant="outline" size="icon" aria-label="Basculer le thème" onClick={() => setUI({ dark: !dark })}>{dark ? <Sun /> : <Moon />}</Button>
              <Button variant="outline" size="icon" aria-label="Notifications (Alt+T)" className="relative" onClick={() => setUI({ notifs: true })} data-tour="notifs">
                <Bell /><NotifDot />
              </Button>
            </div>
          </header>
          <main ref={mainRef} className="flex-1 overflow-y-auto px-8 pb-24">
            <AnimatePresence mode="wait">
              <motion.div key={path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>{children}</motion.div>
            </AnimatePresence>
          </main>
          {top && <Button size="icon" variant="outline" aria-label="Retour en haut" className="absolute bottom-6 right-24 z-30 rounded-full" onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp /></Button>}
        </div>

        <AssistantFab />
        <NotifPanel onOpen={(to, id) => { setUI({ notifs: false }); if (to === "lead") navigate({ to: "/prospection/$leadId", params: { leadId: id! } }); else if (to === "relance") navigate({ to: "/relances", search: { rel: id } as never }); else if (to === "post") navigate({ to: "/annonces", search: { tab: "idees", post: id } as never }); else navigate({ to: "/utilisateurs", search: { user: id } as never }); }} />
        <Palette />
        <Shortcuts />
        <Tour />
        <ProfileDialog />
      </div>
    </TooltipProvider>
  );
}

function NotifDot() {
  const n = useStore((s) => s.notifs.filter((x) => !x.read).length);
  return n ? <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground tnum">{n}</span> : null;
}

function UserMenu({ collapsed }: { collapsed: boolean }) {
  const reduce = useUI((u) => u.reduceAnim);
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-2xl bg-ink-line/60 p-2.5 text-left hover:bg-ink-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Menu utilisateur">
          <Avatar name="Zoubida Labdi" size={36} />
          {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium">Zoubida Labdi</p><p className="truncate text-xs text-ink-muted">Admin · Immo101</p></div>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuItem onClick={() => setUI({ profile: true })}><UserCircle />Mon profil</DropdownMenuItem>
        <DropdownMenuCheckboxItem checked={reduce} onCheckedChange={(v) => setUI({ reduceAnim: !!v })}><Zap className="mr-2 size-4" />Réduire les animations</DropdownMenuCheckboxItem>
        <DropdownMenuItem onClick={() => setUI({ tour: true })}><PlayCircle />Rejouer la visite guidée</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setUI({ shortcuts: true })}><Keyboard />Raccourcis clavier</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { navigate({ to: "/" }); toast("Vous êtes déconnectée"); }}><LogOut />Déconnexion</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotifPanel({ onOpen }: { onOpen: (to: string, id?: string) => void }) {
  const open = useUI((u) => u.notifs);
  const notifs = useStore((s) => s.notifs);
  const [tab, setTab] = React.useState<"all" | "unread">("all");
  const list = tab === "all" ? notifs : notifs.filter((n) => !n.read);
  return (
    <Sheet open={open} onOpenChange={(v) => setUI({ notifs: v })}>
      <SheetContent className="w-[420px] sm:max-w-[420px]">
        <SheetHeader><SheetTitle className="font-display text-xl">Notifications</SheetTitle><SheetDescription>Alt+T pour ouvrir ce panneau</SheetDescription></SheetHeader>
        <div className="mt-4 flex items-center justify-between">
          <Seg value={tab} onChange={setTab} options={[{ value: "all", label: "Toutes" }, { value: "unread", label: `Non lues (${notifs.filter((n) => !n.read).length})` }]} />
          <Button variant="link" size="sm" onClick={() => actions.readNotif("all")}>Tout marquer comme lu</Button>
        </div>
        <div className="mt-4 -mx-2 max-h-[calc(100vh-180px)] space-y-1 overflow-y-auto px-2">
          {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Aucune notification non lue.</p>}
          {list.map((n) => (
            <button key={n.id} onClick={() => { actions.readNotif(n.id); onOpen(n.link.to, n.link.id); }} className="flex w-full gap-3 rounded-xl p-3 text-left hover:bg-muted">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
              <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-primary">{n.kind}</p><p className="text-sm">{n.text}</p><p className="text-xs text-muted-foreground">{ago(n.at)}</p></div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Palette() {
  const open = useUI((u) => u.palette);
  const leads = useStore((s) => s.leads);
  const props = useStore((s) => s.properties);
  const navigate = useNavigate();
  const go = (fn: () => void) => { setUI({ palette: false }); fn(); };
  return (
    <CommandDialog open={open} onOpenChange={(v) => setUI({ palette: v })}>
      <CommandInput placeholder="Aller à une page, un lead, un bien…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Pages">{NAV.map((n) => <CommandItem key={n.to} onSelect={() => go(() => navigate({ to: n.to }))}><n.icon className="mr-2 size-4" />{n.label}</CommandItem>)}</CommandGroup>
        <CommandGroup heading="Leads">{leads.slice(0, 120).map((l) => <CommandItem key={l.id} value={`${l.name} ${l.id} ${l.quartier}`} onSelect={() => go(() => navigate({ to: "/prospection/$leadId", params: { leadId: l.id } }))}>{l.name}<span className="ml-auto text-xs text-muted-foreground">{l.quartier}</span></CommandItem>)}</CommandGroup>
        <CommandGroup heading="Biens">{props.map((p) => <CommandItem key={p.id} value={`${p.ref} ${p.title} ${p.quartier}`} onSelect={() => go(() => { navigate({ to: "/prospection" }); toast(`${p.ref} · ${p.title}, ${p.quartier}`, { description: `${p.mode} · ${p.price.toLocaleString("fr-FR")} MAD · ${p.status}` }); })}>{p.ref} · {p.title}<span className="ml-auto text-xs text-muted-foreground">{p.quartier}</span></CommandItem>)}</CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function Shortcuts() {
  const open = useUI((u) => u.shortcuts);
  const rows = [["Ctrl/Cmd + K", "Palette de commandes"], ["Alt + T", "Notifications"], ["/", "Rechercher dans le tableau"], ["?", "Afficher les raccourcis"], ["Échap", "Fermer une fenêtre"]];
  return (
    <Dialog open={open} onOpenChange={(v) => setUI({ shortcuts: v })}>
      <DialogContent><DialogHeader><DialogTitle className="font-display">Raccourcis clavier</DialogTitle><DialogDescription>Gagnez du temps au quotidien.</DialogDescription></DialogHeader>
        <div className="divide-y">{rows.map(([k, v]) => <div key={k} className="flex justify-between py-2.5 text-sm"><span>{v}</span><kbd className="rounded-md border bg-muted px-2 py-0.5 text-xs">{k}</kbd></div>)}</div>
      </DialogContent>
    </Dialog>
  );
}

function Tour() {
  const open = useUI((u) => u.tour);
  const [i, setI] = React.useState(0);
  const steps = [{ title: "Bienvenue Zoubida", text: "Voici votre backoffice IA Immo101. Six étapes pour faire le tour." }, ...NAV.slice(0, 3).map((n) => ({ title: n.label, text: n.tour })), { title: "Notifications", text: "Leads à reprendre, RDV de demain, relances répondues : tout arrive ici (Alt+T)." }, { title: "Assistant IA", text: "Le bouton en bas à droite répond à vos questions à partir des données de l'agence." }];
  React.useEffect(() => { if (open) setI(0); }, [open]);
  return (
    <Dialog open={open} onOpenChange={(v) => setUI({ tour: v })}>
      <DialogContent className="max-w-md">
        <DialogHeader><p className="text-xs font-medium text-primary tnum">Étape {i + 1} / {steps.length}</p><DialogTitle className="font-display text-2xl">{steps[i].title}</DialogTitle><DialogDescription>{steps[i].text}</DialogDescription></DialogHeader>
        <div className="flex gap-1">{steps.map((_, k) => <span key={k} className={cn("h-1 flex-1 rounded-full", k <= i ? "bg-primary" : "bg-muted")} />)}</div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setUI({ tour: false })}>Passer</Button>
          {i > 0 && <Button variant="outline" onClick={() => setI(i - 1)}>Précédent</Button>}
          <Button onClick={() => (i < steps.length - 1 ? setI(i + 1) : setUI({ tour: false }))}>{i < steps.length - 1 ? "Suivant" : "Terminer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProfileDialog() {
  const open = useUI((u) => u.profile);
  const [name, setName] = React.useState("Zoubida Labdi");
  const [pwd, setPwd] = React.useState("");
  const err = pwd && pwd.length < 8 ? "Le mot de passe doit contenir au moins 8 caractères." : "";
  return (
    <Dialog open={open} onOpenChange={(v) => setUI({ profile: v })}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Mon profil</DialogTitle><DialogDescription>Vos informations personnelles</DialogDescription></DialogHeader>
        <div className="flex items-center gap-4"><Avatar name={name} size={64} /><Button variant="outline" size="sm" onClick={() => toast.success("Photo mise à jour")}>Changer la photo</Button></div>
        <div className="grid gap-3">
          <div><Label htmlFor="pn">Nom</Label><Input id="pn" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label htmlFor="pe">Email</Label><Input id="pe" defaultValue="zoubida@immo101-demo.ma" /></div>
          <div><Label>Langue</Label><Select defaultValue="fr"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fr">Français</SelectItem><SelectItem value="ar">العربية</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></div>
          <div><Label htmlFor="pp">Nouveau mot de passe</Label><Input id="pp" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} aria-invalid={!!err} />{err && <p className="mt-1 text-xs text-danger">{err}</p>}</div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setUI({ profile: false })}>Annuler</Button><Button disabled={!!err || !name} onClick={() => { setUI({ profile: false }); toast.success("Profil enregistré"); }}>Enregistrer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssistantFab() {
  const open = useUI((u) => u.assistant);
  const navigate = useNavigate();
  const [msgs, setMsgs] = React.useState<{ role: "u" | "a"; text: string; link?: { label: string; go: () => void }; done?: boolean }[]>([]);
  const [q, setQ] = React.useState("");
  const SUG = ["Combien de leads chauds aujourd'hui ?", "Quels propriétaires vendeurs n'ont pas de RDV ?", "Quels investisseurs sont sans conseiller ?"];
  const answer = (question: string) => {
    const s = getState(); const n = question.toLowerCase();
    let text = "", link: { label: string; go: () => void } | undefined;
    if (n.includes("chaud")) {
      const today = s.leads.filter((l) => l.temp === "chaud" && Date.now() - l.receivedAt < 86400000);
      const all = s.leads.filter((l) => l.temp === "chaud").length;
      text = `Aujourd'hui, ${today.length} lead${today.length > 1 ? "s" : ""} chaud${today.length > 1 ? "s" : ""} ${today.length ? "(" + today.slice(0, 3).map((l) => l.name).join(", ") + ")" : ""}. Au total, ${all} leads chauds sur 30 jours.`;
      link = { label: "Ouvrir les leads chauds", go: () => navigate({ to: "/prospection", search: { temp: "chaud" } as never }) };
    } else if (n.includes("vendeur")) {
      const v = s.leads.filter((l) => l.type === "vendeur" && !l.rdvs.length && l.status !== "perdu" && l.status !== "client");
      text = `${v.length} propriétaires vendeurs n'ont pas encore de RDV d'estimation : ${v.slice(0, 4).map((l) => l.name).join(", ")}${v.length > 4 ? "…" : "."}`;
      link = { label: "Ouvrir les vendeurs", go: () => navigate({ to: "/prospection", search: { type: "vendeur" } as never }) };
    } else if (n.includes("investisseur")) {
      const v = s.leads.filter((l) => l.type === "investisseur" && !l.advisor);
      text = v.length ? `${v.length} investisseur${v.length > 1 ? "s" : ""} sans conseiller : ${v.map((l) => l.name).join(", ")}.` : "Tous les investisseurs ont un conseiller assigné.";
      link = { label: "Ouvrir dans l'application", go: () => navigate({ to: "/prospection", search: { type: "investisseur", sans: "1" } as never }) };
    } else {
      const c = sel.counts(s);
      text = `Sur 30 jours : ${c.total} leads reçus, ${c.qualified} qualifiés par l'IA, ${c.rdv} RDV planifiés et ${c.reprendre} leads à reprendre.`;
      link = { label: "Ouvrir le tableau de bord", go: () => navigate({ to: "/tableau-de-bord" }) };
    }
    setMsgs((m) => [...m, { role: "u", text: question }, { role: "a", text, link }]);
  };
  return (
    <>
      <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} onClick={() => setUI({ assistant: true })} aria-label="Assistant IA"
        className="fixed bottom-6 right-6 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-6px_var(--glow)]">
        <Sparkles className="size-6" /><span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20" />
      </motion.button>
      <Sheet open={open} onOpenChange={(v) => setUI({ assistant: v })}>
        <SheetContent className="flex w-[440px] flex-col sm:max-w-[440px]">
          <SheetHeader><SheetTitle className="flex items-center gap-2 font-display text-xl"><Bot className="size-5 text-primary" />Assistant IA</SheetTitle><SheetDescription>Posez une question sur l'activité de l'agence.</SheetDescription></SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto py-4">
            {msgs.length === 0 && <div className="space-y-2"><p className="text-xs text-muted-foreground">Suggestions</p>{SUG.map((s) => <button key={s} onClick={() => answer(s)} className="block w-full rounded-xl border bg-card p-3 text-left text-sm hover:border-primary">{s}</button>)}</div>}
            {msgs.map((m, i) => (
              <div key={i} className={cn("max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm", m.role === "u" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                {m.role === "a" ? <Typing text={m.text} onDone={() => !m.done && setMsgs((x) => x.map((y, k) => (k === i ? { ...y, done: true } : y)))} /> : m.text}
                {m.role === "a" && m.done && m.link && <Button size="sm" variant="outline" className="mt-2" onClick={() => { setUI({ assistant: false }); m.link!.go(); }}>{m.link.label}</Button>}
              </div>
            ))}
          </div>
          {msgs.length > 0 && <div className="flex flex-wrap gap-1">{SUG.map((s) => <button key={s} onClick={() => answer(s)} className="rounded-full border px-2.5 py-1 text-[11px] hover:border-primary">{s}</button>)}</div>}
          <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { answer(q); setQ(""); } }} className="flex gap-2 pt-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Votre question…" aria-label="Votre question" />
            <Button size="icon" aria-label="Envoyer"><Send /></Button>
          </form>
          <p className="text-[11px] text-muted-foreground">L'IA peut se tromper. Vérifiez les informations importantes.</p>
          <button className="sr-only" onClick={() => setUI({ assistant: false })}><X />Fermer</button>
        </SheetContent>
      </Sheet>
    </>
  );
}
