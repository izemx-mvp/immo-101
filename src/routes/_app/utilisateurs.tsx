import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserPlus, KeyRound, LogOut, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, DrawerNav, useUrlState, type Col } from "@/components/DataTable";
import { Avatar, Highlight, Panel, Pill, StatusBadge, TypeBadge, ago, fmtDate } from "@/components/kit";
import { usePageMeta } from "@/components/AppShell";
import { PageAction } from "@/components/PageAction";
import { AssignDialog, Confirm } from "@/components/lead/LeadDialogs";
import { mutate, useStore } from "@/lib/store";
import { INTERFACES, LEAD_TYPES, TYPE_LABEL, type LeadType } from "@/lib/domain";
import type { Advisor } from "@/lib/seed";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/utilisateurs")({
  head: () => ({ meta: [{ title: "Utilisateurs — Immo101 Backoffice IA" }, { name: "description", content: "Gestion de l'équipe Immo101 : rôles, accès et leads assignés." }, { property: "og:title", content: "Utilisateurs — Immo101" }, { property: "og:description", content: "Rôles et accès de l'équipe." }] }),
  component: Users,
});

function Users() {
  const users = useStore((s) => s.users);
  const leads = useStore((s) => s.leads);
  usePageMeta("Gestion des utilisateurs", `${users.length} utilisateurs`);
  const [sp, setSp] = useUrlState();
  const [invite, setInvite] = React.useState(false);
  const [del, setDel] = React.useState<Advisor | null>(null);
  const [list, setList] = React.useState<Advisor[]>(users);
  const cur = users.find((u) => u.id === sp.user);
  const count = (u: Advisor) => leads.filter((l) => l.advisor === u.name).length;
  const cols: Col<Advisor>[] = [
    { key: "u", label: "Utilisateur", sort: (u) => u.name, csv: (u) => u.name, render: (u, q) => <div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-medium"><Highlight text={u.name} q={q} /></p>{!u.active && <Pill tone="danger">Désactivé</Pill>}</div></div> },
    { key: "email", label: "Email", csv: (u) => u.email, render: (u, q) => <span className="text-muted-foreground"><Highlight text={u.email} q={q} /></span> },
    { key: "role", label: "Rôle", sort: (u) => u.role, csv: (u) => u.role, render: (u) => <Pill tone={u.role === "Admin" ? "primary" : "neutral"}>{u.role}</Pill> },
    { key: "acces", label: "Accès", csv: (u) => `${u.access.length}/5`, render: (u) => <span className="tnum">{u.access.length} / 5 interfaces</span> },
    { key: "leads", label: "Leads assignés", sort: count, csv: count, render: (u) => <span className="font-semibold tnum">{count(u)}</span> },
    { key: "created", label: "Créé le", sort: (u) => u.createdAt, csv: (u) => fmtDate(u.createdAt), render: (u) => <span className="text-xs text-muted-foreground">{fmtDate(u.createdAt)}</span> },
    { key: "login", label: "Dernière connexion", sort: (u) => u.lastLogin, csv: (u) => fmtDate(u.lastLogin), render: (u) => <span className="text-xs text-muted-foreground">{ago(u.lastLogin)}</span> },
  ];
  const patch = (id: string, p: Partial<Advisor>, msg?: string) => mutate((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...p } : u)) }), msg);
  return (
    <Panel spotlight={false} className="p-4">
      <PageAction><Button onClick={() => setInvite(true)}><UserPlus />Nouvel utilisateur</Button></PageAction>
      <DataTable id="us" rows={users} cols={cols} rowKey={(u) => u.id} search={(u) => `${u.name} ${u.email} ${u.role}`} placeholder="Rechercher un utilisateur…" onOpen={(u, l) => { setList(l); setSp({ user: u.id }); }}
        rowMenu={(u) => <>
          <DropdownMenuItem onClick={() => setSp({ user: u.id })}>Modifier</DropdownMenuItem>
          <DropdownMenuItem onClick={() => patch(u.id, { active: !u.active }, u.active ? "Utilisateur désactivé" : "Utilisateur réactivé")}>{u.active ? "Désactiver" : "Réactiver"}</DropdownMenuItem>
          <DropdownMenuItem className="text-danger" disabled={u.role === "Admin"} onClick={() => setDel(u)}>Supprimer</DropdownMenuItem>
        </>} />
      <InviteDialog open={invite} onOpenChange={setInvite} />
      <Confirm open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Supprimer ${del?.name} ?`} text="Ses leads assignés devront être réassignés." onConfirm={() => { mutate((s) => ({ ...s, users: s.users.filter((u) => u.id !== del!.id) }), "Utilisateur supprimé"); setDel(null); }} />
      <Sheet open={!!cur} onOpenChange={(v) => !v && setSp({ user: undefined })}>
        <SheetContent className="w-[560px] overflow-y-auto sm:max-w-[560px]">
          {cur && <UserDrawer u={cur} list={list} onGo={(u) => setSp({ user: u.id })} patch={(p, m) => patch(cur.id, p, m)} />}
        </SheetContent>
      </Sheet>
    </Panel>
  );
}

function UserDrawer({ u, list, onGo, patch }: { u: Advisor; list: Advisor[]; onGo: (u: Advisor) => void; patch: (p: Partial<Advisor>, m?: string) => void }) {
  const leads = useStore((s) => s.leads.filter((l) => l.advisor === u.name));
  const [f, setF] = React.useState({ name: u.name, email: u.email, phone: u.phone, role: u.role });
  const [page, setPage] = React.useState(1);
  const [reassign, setReassign] = React.useState<string[] | null>(null);
  const [perm, setPerm] = React.useState<Record<string, [boolean, boolean, boolean]>>(() => Object.fromEntries(INTERFACES.map((i) => [i, [u.access.includes(i), u.role === "Admin" || u.access.includes(i), u.role === "Admin"]])));
  const navigate = useNavigate();
  React.useEffect(() => setF({ name: u.name, email: u.email, phone: u.phone, role: u.role }), [u.id]);
  const pages = Math.max(1, Math.ceil(leads.length / 8));
  return (
    <>
      <SheetHeader><DrawerNav list={list} current={u.id} rowKey={(x) => x.id} onGo={onGo} />
        <div className="flex items-center gap-3"><Avatar name={u.name} size={56} /><div><SheetTitle className="font-display text-2xl">{u.name}</SheetTitle><SheetDescription>{u.role} · {u.email}</SheetDescription></div></div>
      </SheetHeader>
      <Tabs defaultValue="profil" className="mt-4">
        <TabsList>{["Profil", "Accès", "Leads assignés", "Activité", "Sécurité"].map((t) => <TabsTrigger key={t} value={t.toLowerCase()}>{t}</TabsTrigger>)}</TabsList>
        <TabsContent value="profil" className="space-y-3">
          {(["name", "email", "phone"] as const).map((k) => <div key={k} className="space-y-1"><Label>{{ name: "Nom", email: "Email", phone: "Téléphone" }[k]}</Label><Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />{k === "email" && !/^\S+@\S+\.\S+$/.test(f.email) && <p className="text-xs text-danger">Adresse email invalide.</p>}</div>)}
          <div className="space-y-1"><Label>Rôle</Label><Select value={f.role} onValueChange={(v) => setF({ ...f, role: v as Advisor["role"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Conseiller">Conseiller</SelectItem></SelectContent></Select></div>
          <div className="flex flex-wrap gap-1">{u.types.map((t) => <TypeBadge key={t} t={t} short />)}</div>
          <Button disabled={!/^\S+@\S+\.\S+$/.test(f.email)} onClick={() => patch(f, "Profil enregistré")}>Enregistrer</Button>
        </TabsContent>
        <TabsContent value="accès">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2">Interface</th><th>Voir</th><th>Modifier</th><th>Supprimer</th></tr></thead>
            <tbody>{INTERFACES.map((i) => <tr key={i} className="border-t"><td className="py-2.5">{i}</td>{[0, 1, 2].map((k) => <td key={k}><Switch checked={perm[i][k]} aria-label={`${i} ${["voir", "modifier", "supprimer"][k]}`} onCheckedChange={(v) => setPerm((p) => { const n = [...p[i]] as [boolean, boolean, boolean]; n[k] = v; if (k === 0 && !v) { n[1] = false; n[2] = false; } return { ...p, [i]: n }; })} /></td>)}</tr>)}</tbody></table>
          <Button className="mt-3" onClick={() => patch({ access: INTERFACES.filter((i) => perm[i][0]) }, "Accès mis à jour")}>Enregistrer les accès</Button>
        </TabsContent>
        <TabsContent value="leads assignés">
          <div className="space-y-1">{leads.slice((page - 1) * 8, page * 8).map((l) => <div key={l.id} className="flex items-center gap-3 rounded-xl border p-2 text-sm"><button className="flex-1 text-left font-medium hover:underline" onClick={() => navigate({ to: "/prospection/$leadId", params: { leadId: l.id } })}>{l.name}</button><TypeBadge t={l.type} short /><StatusBadge s={l.status} /><Button size="sm" variant="ghost" onClick={() => setReassign([l.id])}>Réassigner</Button></div>)}
            {!leads.length && <p className="py-6 text-center text-sm text-muted-foreground">Aucun lead assigné.</p>}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span className="tnum">Affichage {leads.length ? (page - 1) * 8 + 1 : 0}–{Math.min(page * 8, leads.length)} sur {leads.length}</span><div className="flex gap-1"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button><Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage(page + 1)}>Suivant</Button></div></div>
          {leads.length > 0 && <Button variant="outline" className="mt-2" onClick={() => setReassign(leads.map((l) => l.id))}>Réassigner tous les leads</Button>}
        </TabsContent>
        <TabsContent value="activité"><ul className="space-y-2 text-sm">{["S'est connecté(e)", "A pris en charge un lead", "A planifié une visite", "A modifié une qualification", "A envoyé un bien par WhatsApp"].map((a, i) => <li key={a} className="flex justify-between rounded-xl border p-2.5"><span>{a}</span><span className="text-xs text-muted-foreground">{ago(u.lastLogin - i * 7200000)}</span></li>)}</ul></TabsContent>
        <TabsContent value="sécurité" className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => toast.success("Lien de réinitialisation envoyé", { description: u.email })}><KeyRound />Réinitialiser le mot de passe</Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => toast.success("Toutes les sessions ont été déconnectées")}><LogOut />Déconnecter les sessions</Button>
          <Button variant="destructive" className="w-full justify-start" disabled={u.role === "Admin"} onClick={() => patch({ active: false }, "Compte désactivé")}><Ban />Désactiver le compte</Button>
        </TabsContent>
      </Tabs>
      {reassign && <AssignDialog ids={reassign} open onOpenChange={(v) => !v && setReassign(null)} />}
    </>
  );
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [f, setF] = React.useState({ name: "", email: "", phone: "", role: "Conseiller" as Advisor["role"] });
  const [acc, setAcc] = React.useState<string[]>(INTERFACES.slice(0, 4));
  const [types, setTypes] = React.useState<LeadType[]>([]);
  const [t, setT] = React.useState(false);
  React.useEffect(() => { if (open) { setF({ name: "", email: "", phone: "", role: "Conseiller" }); setT(false); setTypes([]); } }, [open]);
  const err = { name: !f.name.trim() ? "Le nom est obligatoire." : "", email: !/^\S+@\S+\.\S+$/.test(f.email) ? "Saisissez une adresse email valide." : "" };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-display">Nouvel utilisateur</DialogTitle><DialogDescription>Une invitation sera envoyée par email.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label htmlFor="iv-n">Nom</Label><Input id="iv-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />{t && err.name && <p className="text-xs text-danger">{err.name}</p>}</div>
          <div className="space-y-1"><Label htmlFor="iv-e">Email</Label><Input id="iv-e" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />{t && err.email && <p className="text-xs text-danger">{err.email}</p>}</div>
          <div className="space-y-1"><Label htmlFor="iv-p">Téléphone</Label><Input id="iv-p" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div className="space-y-1"><Label>Rôle</Label><Select value={f.role} onValueChange={(v) => setF({ ...f, role: v as Advisor["role"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Conseiller">Conseiller</SelectItem></SelectContent></Select></div>
        </div>
        <div><Label>Accès par interface</Label><div className="mt-2 grid grid-cols-2 gap-2">{INTERFACES.map((i) => <label key={i} className="flex items-center gap-2 text-sm"><Checkbox checked={acc.includes(i)} onCheckedChange={(v) => setAcc((a) => (v ? [...a, i] : a.filter((x) => x !== i)))} />{i}</label>)}</div></div>
        <div><Label>Types de leads gérés</Label><div className="mt-2 flex flex-wrap gap-1.5">{LEAD_TYPES.map((x) => <button key={x} type="button" onClick={() => setTypes((a) => (a.includes(x) ? a.filter((y) => y !== x) : [...a, x]))} className={cn("rounded-full border px-2.5 py-1 text-xs", types.includes(x) && "border-primary bg-primary-soft text-primary")}>{TYPE_LABEL[x]}</button>)}</div></div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={() => { setT(true); if (err.name || err.email) return; mutate((s) => ({ ...s, users: [...s.users, { id: "u" + (s.users.length + 10), name: f.name, initials: "", role: f.role, email: f.email, phone: f.phone, active: true, createdAt: Date.now(), lastLogin: Date.now(), access: acc, types }], notifs: [{ id: Math.random().toString(36), at: Date.now(), kind: "Utilisateur ajouté", text: `${f.name} a été invité(e)`, read: false, link: { to: "user", id: "u" + (s.users.length + 10) } }, ...s.notifs] }), "Invitation envoyée", `Email envoyé à ${f.email}`); onOpenChange(false); }}>Inviter</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
