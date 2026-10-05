import { useRef, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { generate, makeLead, agentReply, scoreFor, NOW, type State, type Lead, type Rdv, type Activity, type Relance } from "./seed";
import { clientResult, rdvKind, tempOf, LEAD_TYPES, STATUS_LABEL, type LeadType, type Source, type Status, type Temp } from "./domain";

let state: State = generate();
const listeners = new Set<() => void>();
let history: State[] = [];
const emit = () => listeners.forEach((l) => l());

export function getState() { return state; }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useStore<T>(sel: (s: State) => T): T {
  const cache = useRef<{ s: State; v: T } | null>(null);
  const get = () => { if (!cache.current || cache.current.s !== state) cache.current = { s: state, v: sel(state) }; return cache.current.v; };
  return useSyncExternalStore(subscribe, get, get);
}
export const CURRENT_USER = "Zoubida Labdi";

function set(fn: (s: State) => State, toastMsg?: string, desc?: string) {
  history.push(state); if (history.length > 30) history.shift();
  state = fn(state); emit();
  if (toastMsg) {
    const snap = history.length;
    toast.success(toastMsg, { description: desc, duration: 6000, action: { label: "Annuler", onClick: () => undoTo(snap) } });
  }
}
function undoTo(len: number) { if (history.length >= len) { state = history[len - 1]; history = history.slice(0, len - 1); emit(); toast("Action annulée"); } }
export function mutate(fn: (s: State) => State, toastMsg?: string, desc?: string) { set(fn, toastMsg, desc); }

const uid = () => Math.random().toString(36).slice(2, 9);
const act = (kind: Activity["kind"], text: string, author = CURRENT_USER, extra: Partial<Activity> = {}): Activity => ({ id: uid(), at: Date.now(), kind, text, author, ...extra });
function upd(s: State, id: string, fn: (l: Lead) => Lead): State { return { ...s, leads: s.leads.map((l) => (l.id === id ? fn(l) : l)) }; }
const feedPush = (s: State, kind: State["feed"][number]["kind"], text: string, leadId?: string): State => ({ ...s, feed: [{ id: uid(), at: Date.now(), kind, text, leadId }, ...s.feed] });

function ensureRelance(s: State, lead: Lead, subject: string): State {
  if (s.relances.some((r) => r.leadId === lead.id && !r.stopped)) return s;
  const camp = s.campaigns.find((c) => c.cible === lead.type && c.status === "Active") ?? s.campaigns[0];
  const r: Relance = { id: "R" + (s.relances.length + 1), leadId: lead.id, campaignId: camp.id, channel: lead.source === "email" ? "Email" : "WhatsApp", step: "Envoyé", classification: "En attente", confidence: 0, reason: "Pas encore de réponse", lastAt: Date.now(), paused: false, stopped: false, subject, history: [{ at: Date.now(), label: "Envoyé", channel: lead.source === "email" ? "Email" : "WhatsApp", state: "envoyé" }] };
  return { ...s, relances: [r, ...s.relances] };
}

export const actions = {
  changeStatus(id: string, status: Status, opts: { reason?: string; result?: string; amount?: number } = {}) {
    const l = state.leads.find((x) => x.id === id)!;
    set((s) => {
      let n = upd(s, id, (l) => ({ ...l, status, statusSub: status === "rdv" ? rdvKind(l.type) : status === "client" ? opts.result ?? clientResult(l.type) : undefined, lostReason: opts.reason, amount: opts.amount, reprendre: status === "client" || status === "perdu" ? false : l.reprendre, activities: [act("statut", `Statut : ${STATUS_LABEL[l.status]} → ${STATUS_LABEL[status]}${opts.reason ? " (" + opts.reason + ")" : ""}${opts.result ? " · " + opts.result : ""}`), ...l.activities] }));
      if (status === "perdu") n = { ...n, relances: n.relances.map((r) => (r.leadId === id ? { ...r, stopped: true } : r)) };
      return feedPush(n, status === "client" ? "qualified" : "qualified", `${l.name} : ${STATUS_LABEL[status]}`, id);
    }, `Statut mis à jour : ${STATUS_LABEL[status]}`, "Tableau de bord, prospection et relances synchronisés.");
  },
  assign(ids: string[], advisor: string) {
    set((s) => ({ ...s, leads: s.leads.map((l) => (ids.includes(l.id) ? { ...l, advisor, status: l.status === "nouveau" ? "qualifie" : l.status, activities: [act("statut", `Assigné à ${advisor}`), ...l.activities] } : l)) }), `${ids.length} lead${ids.length > 1 ? "s" : ""} assigné${ids.length > 1 ? "s" : ""} à ${advisor}`);
  },
  takeOver(id: string) {
    set((s) => upd(s, id, (l) => ({ ...l, advisor: CURRENT_USER, reprendre: false, activities: [act("statut", "Pris en charge par Zoubida Labdi"), ...l.activities] })), "Lead pris en charge", "Assigné à vous, drapeau « À reprendre » retiré.");
  },
  planRdv(id: string, rdv: Omit<Rdv, "id">) {
    const l = state.leads.find((x) => x.id === id)!;
    set((s) => {
      let n = upd(s, id, (l) => ({ ...l, status: l.status === "client" ? l.status : "rdv", statusSub: rdv.kind, rdvs: [...l.rdvs, { ...rdv, id: uid() }], activities: [act("rdv", `${rdv.kind} planifié(e) le ${new Date(rdv.at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}`), ...l.activities] }));
      n = ensureRelance(n, l, rdv.kind + " · " + l.quartier);
      return feedPush(n, "rdv", `${rdv.kind} réservé(e) avec ${l.name}`, id);
    }, `${rdv.kind} planifié(e)`, "Statut RDV planifié, relance de confirmation créée, KPI mis à jour.");
  },
  sendProperty(id: string, propIds: string[], channel: "WhatsApp" | "Email", text: string) {
    const l = state.leads.find((x) => x.id === id)!;
    set((s) => {
      const props = s.properties.filter((p) => propIds.includes(p.id));
      let n = upd(s, id, (l) => ({ ...l, proposed: [...l.proposed.filter((p) => !propIds.includes(p.propId)), ...props.map((p) => ({ propId: p.id, status: "Proposé" as const, match: 80, reasons: "Ajouté par un conseiller" }))], activities: [act("message", text, CURRENT_USER, { channel: channel === "Email" ? "email" : "whatsapp", dir: "out" }), ...l.activities] }));
      n = ensureRelance(n, l, props.map((p) => p.ref).join(", ") || "Fiche");
      return feedPush(n, "property", `Bien envoyé à ${l.name} par ${channel}`, id);
    }, `Envoyé par ${channel}`, "Activité ajoutée et relance démarrée.");
  },
  addActivity(id: string, a: Partial<Activity> & { text: string; kind: Activity["kind"] }, msg?: string) {
    set((s) => upd(s, id, (l) => ({ ...l, activities: [act(a.kind, a.text, a.author ?? CURRENT_USER, a), ...l.activities] })), msg);
  },
  setQual(id: string, key: string, value: unknown) {
    state = upd(state, id, (l) => ({ ...l, qual: { ...l.qual, [key]: value }, qualBy: { ...l.qualBy, [key]: "Conseiller" } })); emit();
  },
  recalc(id: string) {
    set((s) => upd(s, id, (l) => { const sc = Math.min(98, Math.max(10, Math.round(l.score * 0.6 + completeness(l) * 0.45))); return { ...l, score: sc, temp: tempOf(sc) }; }), "Score recalculé");
  },
  changeType(id: string, type: LeadType) {
    set((s) => upd(s, id, (l) => ({ ...l, type, qual: {}, qualBy: {}, proposed: [], statusSub: l.status === "rdv" ? rdvKind(type) : l.statusSub, docs: [], activities: [act("statut", `Type changé : ${type}`), ...l.activities] })), "Type de lead modifié", "Formulaire, critères de score, documents et biens adaptés.");
    // rebuild docs
    import("./domain").then(({ DOC_LIST }) => { state = upd(state, id, (l) => ({ ...l, docs: DOC_LIST[type].map((d) => ({ name: d, status: "Manquant" as const })) })); emit(); });
  },
  note(id: string, text: string) { set((s) => upd(s, id, (l) => ({ ...l, notes: [{ id: uid(), at: Date.now(), author: CURRENT_USER, text, pinned: false }, ...l.notes] })), "Note ajoutée"); },
  updateNote(id: string, nid: string, patch: Partial<Lead["notes"][number]> | null) {
    set((s) => upd(s, id, (l) => ({ ...l, notes: patch ? l.notes.map((n) => (n.id === nid ? { ...n, ...patch } : n)) : l.notes.filter((n) => n.id !== nid) })), patch ? undefined : "Note supprimée");
  },
  crm(id: string) { set((s) => upd(s, id, (l) => ({ ...l, crmSyncedAt: Date.now(), activities: [act("crm", "Envoyé au CRM"), ...l.activities] })), "Synchronisé au CRM"); },
  deleteLeads(ids: string[]) { set((s) => ({ ...s, leads: s.leads.filter((l) => !ids.includes(l.id)), relances: s.relances.filter((r) => !ids.includes(r.leadId)) }), `${ids.length} lead(s) supprimé(s)`); },
  merge(keep: string, drop: string) {
    set((s) => { const d = s.leads.find((l) => l.id === drop)!; return { ...upd(s, keep, (l) => ({ ...l, activities: [...d.activities, act("statut", `Fusionné avec ${d.name} (${d.id})`), ...l.activities].sort((a, b) => b.at - a.at), notes: [...l.notes, ...d.notes] })), leads: s.leads.filter((l) => l.id !== drop).map((l) => (l.id === keep ? { ...l, activities: [...d.activities, ...l.activities].sort((a, b) => b.at - a.at) } : l)) }; }, "Doublon fusionné");
  },
  addLead(type: LeadType, data: { name: string; phone: string; email: string; source: Source; message: string; qual: Record<string, unknown> }) {
    const l = makeLead(state.leads.length + 500 + Math.floor(Math.random() * 9999), type, { receivedAt: Date.now(), source: data.source, status: "nouveau" });
    const lead: Lead = { ...l, name: data.name, phone: data.phone || l.phone, email: data.email || l.email, message: data.message || "Lead saisi manuellement", qual: { ...l.qual, ...data.qual }, score: 45, temp: "tiede", activities: [act("statut", "Lead créé manuellement")] };
    set((s) => feedPush({ ...s, leads: [lead, ...s.leads] }, "new", `Nouveau lead ${lead.name} (manuel)`, lead.id), "Lead créé", "Visible dans Prospection et le tableau de bord.");
    return lead.id;
  },
  simulate(type: LeadType, channel: "whatsapp" | "email", score: number, qual: Record<string, unknown>, message: string, lang: "FR" | "AR" | "EN") {
    const base = makeLead(state.leads.length + 2000 + Math.floor(Math.random() * 9999), type, { receivedAt: Date.now(), source: channel, status: "qualifie" });
    const handover = score >= 80;
    const lead: Lead = { ...base, lang, message, qual, qualBy: Object.fromEntries(Object.keys(qual).map((k) => [k, "IA" as const])), score, temp: tempOf(score), advisor: null, reprendre: handover, status: handover ? "qualifie" : "nouveau",
      activities: [
        ...(handover ? [act("statut", "L'agent IA a passé la main à un conseiller", "Agent IA")] : []),
        act("statut", `Qualifié par l'agent IA (score ${score})`, "Agent IA"),
        act("message", agentReply(type, lang), "Agent IA", { channel, dir: "out" }),
        act("message", message, base.name, { channel, dir: "in" }),
      ] };
    set((s) => ({ ...feedPush(feedPush({ ...s, leads: [lead, ...s.leads] }, "new", `Nouveau lead ${lead.name} via ${channel === "email" ? "Email" : "WhatsApp"}`, lead.id), "qualified", `${lead.name} qualifié par l'agent IA (score ${score})`, lead.id), notifs: [{ id: uid(), at: Date.now(), kind: "Nouveau lead", text: `${lead.name} vient d'écrire`, read: false, link: { to: "lead", id: lead.id } }, ...s.notifs] }), "Nouveau lead simulé", "Compteurs, tableau de bord et badge mis à jour.");
    return lead;
  },
  readNotif(id: string | "all") { state = { ...state, notifs: state.notifs.map((n) => (id === "all" || n.id === id ? { ...n, read: true } : n)) }; emit(); },
  relance(id: string, patch: Partial<Relance>, msg?: string) { set((s) => ({ ...s, relances: s.relances.map((r) => (r.id === id ? { ...r, ...patch } : r)) }), msg); },
};

export function completeness(l: Lead) {
  const { QUAL_FIELDS } = DOMAIN;
  const f = QUAL_FIELDS[l.type];
  const filled = f.filter((x) => { const v = l.qual[x.key]; return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0); }).length;
  return Math.round((filled / f.length) * 100);
}
import * as DOMAIN from "./domain";

// Ambient feed ticker: adds non-count-changing events.
let ticker: ReturnType<typeof setInterval> | null = null;
export function startTicker() {
  if (ticker || typeof window === "undefined") return;
  const lines = ["L'agent IA a répondu à", "Relance lue par", "Fiche consultée par", "Message de confirmation envoyé à"];
  ticker = setInterval(() => {
    const ls = state.leads.filter((l) => l.status !== "perdu");
    const l = ls[Math.floor(Math.random() * ls.length)];
    const t = lines[Math.floor(Math.random() * lines.length)];
    state = { ...state, feed: [{ id: uid(), at: Date.now(), kind: (t.startsWith("Relance") ? "relance" : t.startsWith("Fiche") ? "property" : "qualified") as State["feed"][number]["kind"], text: `${t} ${l.name}`, leadId: l.id }, ...state.feed].slice(0, 300) };
    emit();
  }, 9000);
}

export const sel = {
  counts(s: State) {
    const by = <K extends string>(f: (l: Lead) => K) => s.leads.reduce((a, l) => ((a[f(l)] = (a[f(l)] ?? 0) + 1), a), {} as Record<K, number>);
    return {
      total: s.leads.length, byType: by((l) => l.type), byStatus: by((l) => l.status), bySource: by((l) => l.source), byTemp: by((l) => l.temp),
      qualified: s.leads.filter((l) => l.status !== "nouveau" && l.status !== "perdu").length,
      rdv: s.leads.filter((l) => l.status === "rdv").length,
      nouveaux: s.leads.filter((l) => l.status === "nouveau").length,
      unassigned: s.leads.filter((l) => !l.advisor).length,
      reprendre: s.leads.filter((l) => l.reprendre).length,
      clientsByType: Object.fromEntries(LEAD_TYPES.map((t) => [t, s.leads.filter((l) => l.type === t && l.status === "client").length])) as Record<LeadType, number>,
      postsMonth: s.posts.filter((p) => p.status === "Publié" && new Date(p.date).getMonth() === new Date(NOW).getMonth()).length,
    };
  },
};

export type { Temp };
export { scoreFor };
