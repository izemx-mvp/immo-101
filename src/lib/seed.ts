import {
  LEAD_TYPES, QUAL_FIELDS, QUARTIERS, SCORE_CRITERIA, DOC_LIST, tempOf,
  type LeadType, type Source, type Status, type Temp,
} from "./domain";

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rnd = mulberry32(101);
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rep = <T,>(pairs: [T, number][]) => pairs.flatMap(([v, n]) => Array(n).fill(v) as T[]);

export interface Advisor { id: string; name: string; role: "Admin" | "Conseiller"; email: string; phone: string; initials: string; active: boolean; createdAt: number; lastLogin: number; access: string[]; types: LeadType[] }
export interface Activity { id: string; at: number; kind: "message" | "statut" | "rdv" | "relance" | "note" | "crm"; author: string; channel?: Source; text: string; dir?: "in" | "out" }
export interface Note { id: string; at: number; author: string; text: string; pinned: boolean }
export interface DocItem { name: string; status: "Reçu" | "Manquant" | "À vérifier" }
export interface ProposedProp { propId: string; status: "Proposé" | "Vu" | "Visité" | "Intéressé" | "Refusé"; match: number; reasons: string }
export interface Rdv { id: string; at: number; kind: string; advisor: string; place: string; duration: number; notes?: string }
export interface Lead {
  id: string; name: string; phone: string; email: string; lang: "FR" | "AR" | "EN"; city: string; abroad: boolean;
  type: LeadType; source: Source; estimationForm: boolean; status: Status; statusSub?: string; amount?: number; lostReason?: string;
  score: number; temp: Temp; advisor: string | null; reprendre: boolean; receivedAt: number; message: string;
  qual: Record<string, unknown>; qualBy: Record<string, "IA" | "Conseiller">; activities: Activity[]; notes: Note[]; docs: DocItem[];
  proposed: ProposedProp[]; rdvs: Rdv[]; crmSyncedAt: number | null; ownerPropId?: string; quartier: string;
}
export interface Property { id: string; ref: string; title: string; type: string; mode: "Vente" | "Location"; quartier: string; surface: number; rooms: number; price: number; status: "Disponible" | "Sous offre" | "Vendu/Loué"; floor: number; year: number; etat: string; listing: string }
export interface Campaign { id: string; name: string; cible: LeadType; channel: "WhatsApp" | "Email" | "WhatsApp + Email"; status: "Active" | "En pause" | "Terminée"; createdAt: number; steps: string[] }
export interface Relance { id: string; leadId: string; campaignId: string; channel: "WhatsApp" | "Email"; step: "Envoyé" | "Relance 1" | "Relance 2" | "Relance 3" | "Répondu"; classification: "Intéressé" | "Refusé" | "Ambigu" | "En attente"; confidence: number; reason: string; reply?: string; lastAt: number; paused: boolean; stopped: boolean; history: { at: number; label: string; channel: string; state: "envoyé" | "lu" | "répondu" }[]; subject: string }
export interface Post { id: string; title: string; text: string; kind: "Annonce de bien" | "Conseil" | "Témoignage" | "Actualité marché"; media: "Image" | "Vidéo"; ai: number; platforms: ("Instagram" | "LinkedIn" | "Site web")[]; status: "Idée" | "Brouillon" | "Planifié" | "Publié"; date: number; hashtags: string; cta: string; tone: string; lang: "FR" | "EN" | "AR"; propId?: string; stats: { vues: number; likes: number; clics: number; leads: number } }
export interface Faq { id: string; q: string; a: string; cat: string; status: "Actif" | "Brouillon"; used: number; updatedAt: number; types: LeadType[]; langs: string[] }
export interface ServiceSheet { id: string; title: string; desc: string; benefits: string[]; steps: string[]; docs: string[]; conditions: string; types: LeadType[] }
export interface KbDoc { id: string; name: string; cat: string; date: number; size: string }
export interface KbContact { id: string; name: string; specialty: "Location" | "Vente" | "Investissement" | "Administratif"; phone: string; email: string; role: string }
export interface Notif { id: string; at: number; kind: string; text: string; read: boolean; link: { to: string; id?: string } }
export interface FeedEvent { id: string; at: number; kind: "new" | "qualified" | "rdv" | "property" | "relance" | "post"; text: string; leadId?: string }

export interface State {
  leads: Lead[]; properties: Property[]; campaigns: Campaign[]; relances: Relance[]; posts: Post[]; users: Advisor[];
  faqs: Faq[]; services: ServiceSheet[]; kbDocs: KbDoc[]; kbContacts: KbContact[]; notifs: Notif[]; feed: FeedEvent[];
  objectives: string[];
}

const DAY = 86400000;
export const NOW = Date.now();

const FIRST_M = ["Youssef", "Omar", "Mehdi", "Hamza", "Karim", "Anas", "Rachid", "Amine", "Hicham", "Said", "Adil", "Ilyas", "Nabil", "Driss", "Reda", "Tarik", "Othmane", "Jamal"];
const FIRST_F = ["Salma", "Imane", "Khadija", "Fatima Zahra", "Nadia", "Sara", "Houda", "Leila", "Meryem", "Ghita", "Asmae", "Hajar", "Zineb", "Kenza", "Latifa", "Soukaina", "Nour"];
const LAST = ["Bennani", "Alaoui", "El Idrissi", "Tazi", "Berrada", "Chraibi", "Fassi", "Amrani", "Benjelloun", "Lahlou", "Sqalli", "Kettani", "Ouazzani", "Bouzidi", "El Mansouri", "Naciri", "Belkadi", "Zniber", "Hajji", "Rami", "Skalli", "Tahiri"];

export const ADVISORS = [
  { id: "u1", name: "Zoubida Labdi", initials: "ZL" },
  { id: "u2", name: "Youssef Alaoui", initials: "YA" },
  { id: "u3", name: "Salma Bennani", initials: "SB" },
  { id: "u4", name: "Karim Tazi", initials: "KT" },
];

const MSG: Record<LeadType, { FR: string[]; AR: string[]; EN: string[] }> = {
  acheteur: {
    FR: ["Bonjour, je cherche un appartement 3 pièces à Agdal, budget autour de 1,8 M. Vous avez quelque chose ?", "Bonsoir, nous cherchons une villa à Souissi avec jardin pour notre famille.", "Bonjour, premier achat, je vise un 2 pièces à Hay Riad, crédit en cours."],
    AR: ["Salam, bghit chi appartement f Hay Riad, 3 chambres, budget 2 M. Kayn chi haja ?", "Salam alikoum, kan9elleb 3la villa f Souissi, wach kayna chi wa7da m3a piscine ?"],
    EN: ["Hello, I live in Paris and I'm looking to buy an apartment in Rabat Océan for my retirement.", "Hi, MRE based in Montreal, looking for a 3-bedroom in Agdal, cash buyer."],
  },
  locataire: {
    FR: ["Bonjour, je cherche un meublé à Hay Riad pour 14 000 MAD/mois à partir du mois prochain.", "Bonjour, location d'un bureau 120 m² à Agdal pour notre société.", "Bonjour, appartement 2 chambres non meublé à Orangers, max 8 000 MAD."],
    AR: ["Salam, bghit nkri appartement meublé f Agdal, 2 chambres, 10 000 dh.", "Salam, kayn chi studio l kra f Hassan ?"],
    EN: ["Hi, I'm relocating to Rabat for an embassy post, need a furnished villa in Souissi.", "Hello, expat family looking to rent a 3-bedroom near the American school."],
  },
  vendeur: {
    FR: ["Bonjour, je souhaite vendre ma villa de 480 m² à Souissi, pouvez-vous l'estimer ?", "Bonjour, demande d'estimation pour un appartement à Agdal, 3e étage, 120 m².", "Je veux vendre un terrain à Harhoura, titre foncier en main."],
    AR: ["Salam, bghit nbi3 dar dyali f Témara, ch7al t9der tswa ?", "Salam, 3andi appartement f Salé bghit nbi3o."],
    EN: ["Hello, I inherited an apartment in Hassan and would like to sell it, I live in London."],
  },
  bailleur: {
    FR: ["Bonjour, je souhaite mettre en location mon appartement à Océan, loyer souhaité 9 500 MAD.", "Bonjour, j'ai une villa meublée à Harhoura à louer à l'année.", "Mise en location d'un local commercial à Hassan, vous gérez ?"],
    AR: ["Salam, 3andi appartement f Hay Riad bghit nkrih, wach t9edro t3awnouni ?"],
    EN: ["Hi, I own a flat in Agdal and want to rent it out while I'm abroad. Can you manage it?"],
  },
  investisseur: {
    FR: ["Bonjour, je cherche un investissement locatif à Rabat, budget 4 M, rendement visé 7 %.", "Nous cherchons un immeuble de rapport à Hassan ou Océan.", "Intéressé par des bureaux à Hay Riad pour location, ticket 6 à 10 M."],
    AR: ["Salam, bghit nstathmer f chi appartements l kra, budget 3 M."],
    EN: ["Hello, investor from Dubai, looking for yield properties in Rabat, 8M+ budget."],
  },
  autre: {
    FR: ["Bonjour, quels sont vos honoraires pour une estimation ?", "Bonjour, je souhaite postuler comme conseiller immobilier.", "Proposition de partenariat avec notre agence d'architecture."],
    AR: ["Salam, wach katkhdmo nhar sebt ?"],
    EN: ["Hello, do you offer property management services?"],
  },
};

const PROP_TITLES: Record<string, string[]> = {
  Villa: ["Villa contemporaine avec piscine", "Villa familiale avec jardin", "Villa d'architecte"],
  Appartement: ["Appartement lumineux 3 pièces", "Appartement avec terrasse", "Appartement standing vue mer", "Duplex moderne"],
  Terrain: ["Terrain villa titré", "Terrain constructible R+4"],
  Bureau: ["Plateau de bureaux", "Bureau équipé"],
  "Local commercial": ["Local commercial angle", "Local vitrine"],
  Riad: ["Riad restauré médina"],
  Immeuble: ["Immeuble de rapport", "Immeuble R+3 loué"],
};

function genProperties(): Property[] {
  const types = rep<string>([["Appartement", 14], ["Villa", 10], ["Terrain", 4], ["Bureau", 4], ["Local commercial", 3], ["Riad", 2], ["Immeuble", 3]]);
  shuffle(types);
  return types.map((type, i) => {
    const mode: "Vente" | "Location" = type === "Terrain" || type === "Immeuble" || type === "Riad" ? "Vente" : rnd() < 0.55 ? "Vente" : "Location";
    const q = pick(QUARTIERS);
    const surface = type === "Villa" ? int(250, 900) : type === "Terrain" ? int(300, 2500) : type === "Immeuble" ? int(600, 1500) : type === "Bureau" ? int(60, 400) : int(60, 220);
    const base = { Villa: 9_000, Appartement: 14_000, Terrain: 4_500, Bureau: 13_000, "Local commercial": 16_000, Riad: 10_000, Immeuble: 15_000 }[type]!;
    const price = mode === "Vente"
      ? Math.min(45_000_000, Math.max(800_000, Math.round((surface * base * (0.8 + rnd() * 0.6)) / 10_000) * 10_000))
      : Math.min(80_000, Math.max(5_000, Math.round((surface * (type === "Villa" ? 70 : 90) * (0.7 + rnd() * 0.6)) / 500) * 500));
    const pre = { Villa: "ZLV", Appartement: "SIAP", Terrain: "TRN", Bureau: "BUR", "Local commercial": "LCM", Riad: "RIA", Immeuble: "SILAM" }[type]!;
    return {
      id: "p" + i, ref: pre + (2501 + i * 7 + int(0, 5)), title: pick(PROP_TITLES[type]), type, mode, quartier: q, surface,
      rooms: type === "Terrain" ? 0 : int(2, 8), price, status: pick(["Disponible", "Disponible", "Disponible", "Sous offre", "Vendu/Loué"] as const),
      floor: type === "Appartement" || type === "Bureau" ? int(0, 8) : 0, year: int(1985, 2024), etat: pick(["Neuf", "Très bon", "Bon", "À rafraîchir"]),
      listing: pick(["Publié sur le site", "Publié sur le site", "En préparation"]),
    };
  });
}

function genQual(type: LeadType, msgQ: string, abroad: boolean, completeness: number) {
  const q: Record<string, unknown> = {};
  const by: Record<string, "IA" | "Conseiller"> = {};
  for (const f of QUAL_FIELDS[type]) {
    if (rnd() > completeness) continue;
    let v: unknown;
    if (f.key === "quartiers" || f.key === "zones") v = [msgQ, pick(QUARTIERS)].filter((x, i, a) => a.indexOf(x) === i);
    else if (f.key === "quartier") v = msgQ;
    else if (f.key === "etranger") v = abroad;
    else if (f.key === "budget") v = type === "locataire" ? int(5, 40) * 1000 : type === "investisseur" ? int(3, 15) * 1_000_000 : int(9, 60) * 100_000;
    else if (f.key === "prix") v = int(12, 140) * 100_000;
    else if (f.key === "loyer") v = int(6, 35) * 500;
    else if (f.key === "rendement") v = int(5, 9);
    else if (f.kind === "select") v = pick(f.options!);
    else if (f.kind === "multi") v = shuffle([...f.options!]).slice(0, int(1, 3));
    else if (f.kind === "toggle") v = rnd() < 0.5;
    else if (f.kind === "number") v = f.key.includes("surface") ? int(70, 450) : f.key === "annee" ? int(1990, 2022) : f.key === "ticketMin" ? int(1, 3) * 1_000_000 : int(1, 5);
    else if (f.kind === "date") v = new Date(NOW + int(10, 90) * DAY).toISOString().slice(0, 10);
    else v = f.key === "documents" ? "Titre foncier, plans" : f.key === "detail" ? "Demande générale" : "Couple sans enfants, CDI";
    q[f.key] = v; by[f.key] = rnd() < 0.82 ? "IA" : "Conseiller";
  }
  return { q, by };
}

const AGENT_Q: Record<LeadType, string[]> = {
  acheteur: ["Quel est votre budget maximum ?", "Avez-vous un accord de principe bancaire ?", "Dans quel délai souhaitez-vous acheter ?"],
  locataire: ["Quelle est votre date d'entrée souhaitée ?", "Le bien doit-il être meublé ?", "Disposez-vous d'un garant ?"],
  vendeur: ["Quelle est la surface du bien ?", "Disposez-vous du titre foncier ?", "Souhaitez-vous un mandat exclusif ?"],
  bailleur: ["Quel loyer souhaitez-vous ?", "À partir de quelle date le bien est-il disponible ?", "Souhaitez-vous un suivi après location ?"],
  investisseur: ["Quel rendement visez-vous ?", "Quel est votre horizon d'investissement ?", "Financement comptant ou crédit ?"],
  autre: ["Pouvez-vous préciser votre demande ?"],
};

export function agentReply(type: LeadType, lang: string) {
  if (lang === "EN") return "Thank you for your message! I'm Immo101's assistant. " + (type === "vendeur" ? "Could you tell me the surface of your property?" : "Could you tell me your budget and preferred area?");
  if (lang === "AR") return "Merci 3la message dyalk ! Ana l'assistant dyal Immo101. " + AGENT_Q[type][0];
  return "Bonjour et merci pour votre message ! Je suis l'assistant d'Immo101. " + AGENT_Q[type][0];
}

export function makeLead(i: number, type: LeadType, extra: Partial<Lead> = {}): Lead {
  const female = rnd() < 0.5;
  const name = `${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
  const lang = pick(["FR", "FR", "FR", "AR", "AR", "EN"] as const);
  const abroad = lang === "EN" ? rnd() < 0.8 : rnd() < 0.12;
  const msgQ = pick(QUARTIERS);
  const receivedAt = extra.receivedAt ?? NOW - int(0, 29) * DAY - int(0, 23) * 3600000 - int(0, 59) * 60000;
  const status = extra.status ?? "nouveau";
  const completeness = status === "nouveau" ? 0.3 : status === "qualifie" ? 0.7 : 0.85;
  const { q, by } = genQual(type, msgQ, abroad, completeness);
  const message = pick(MSG[type][lang]);
  const source = extra.source ?? "whatsapp";
  const ch = source === "email" ? "email" : "whatsapp";
  const acts: Activity[] = [
    { id: `a${i}0`, at: receivedAt, kind: "message", author: name, channel: source, text: message, dir: "in" },
    { id: `a${i}1`, at: receivedAt + 40000, kind: "message", author: "Agent IA", channel: ch as Source, text: agentReply(type, lang), dir: "out" },
  ];
  if (status !== "nouveau") {
    acts.push({ id: `a${i}2`, at: receivedAt + 600000, kind: "message", author: "Agent IA", channel: ch as Source, text: AGENT_Q[type][1] ?? AGENT_Q[type][0], dir: "out" });
    acts.push({ id: `a${i}3`, at: receivedAt + 900000, kind: "statut", author: "Agent IA", text: "Lead qualifié par l'agent IA" });
  }
  const docs = DOC_LIST[type].map((d) => ({ name: d, status: pick(["Reçu", "Manquant", "Manquant", "À vérifier"] as const) }));
  return {
    id: "L" + (1000 + i), name, phone: `+212 6${int(10, 99)} ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`,
    email: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".") + "@" + pick(["gmail.com", "outlook.fr", "yahoo.fr", "menara.ma"]),
    lang, city: abroad ? pick(["Paris", "Montréal", "Bruxelles", "Londres", "Dubaï", "Madrid"]) : pick(["Rabat", "Rabat", "Salé", "Témara"]),
    abroad, type, source, estimationForm: false, status, score: 50, temp: "tiede", advisor: null, reprendre: false, receivedAt, message,
    qual: q, qualBy: by, activities: acts, notes: [], docs, proposed: [], rdvs: [], crmSyncedAt: rnd() < 0.6 ? NOW - DAY + int(-3, 3) * 3600000 : null,
    quartier: msgQ, ...extra,
  };
}

export function scoreFor(t: Temp) { return t === "chaud" ? int(70, 98) : t === "tiede" ? int(40, 69) : int(8, 39); }

export function generate(): State {
  rnd = mulberry32(101);
  const properties = genProperties();
  const types = shuffle(rep<LeadType>([["acheteur", 34], ["locataire", 31], ["vendeur", 19], ["bailleur", 17], ["investisseur", 12], ["autre", 7]]));
  const statuses: (Status | null)[] = types.map(() => null);
  const clientQuota: Partial<Record<LeadType, number>> = { acheteur: 3, locataire: 4, vendeur: 2, bailleur: 2, investisseur: 1 };
  types.forEach((t, i) => { if ((clientQuota[t] ?? 0) > 0) { statuses[i] = "client"; clientQuota[t]!--; } });
  const rest = shuffle(rep<Status>([["nouveau", 18], ["qualifie", 34], ["contacte", 22], ["rdv", 16], ["negociation", 9], ["perdu", 9]]));
  let k = 0; statuses.forEach((s, i) => { if (!s) statuses[i] = rest[k++]; });

  const sources: (Source | null)[] = types.map(() => null);
  const estim = new Set<number>();
  types.forEach((t, i) => { if (t === "vendeur" && estim.size < 9) { sources[i] = "site"; estim.add(i); } });
  const srcRest = shuffle(rep<Source>([["whatsapp", 52], ["email", 31], ["site", 13], ["instagram", 15]]));
  k = 0; sources.forEach((s, i) => { if (!s) sources[i] = srcRest[k++]; });

  const temps = shuffle(rep<Temp>([["chaud", 28], ["tiede", 47], ["froid", 45]]));
  const advs = shuffle(rep<string>([["Zoubida Labdi", 20], ["Youssef Alaoui", 31], ["Salma Bennani", 28], ["Karim Tazi", 23]]));
  const eligible = shuffle(statuses.map((s, i) => [s, i] as const).filter(([s]) => s === "qualifie" || s === "contacte" || s === "rdv" || s === "negociation").map(([, i]) => i)).slice(0, 11);
  const reprendreSet = new Set(eligible);

  k = 0;
  const leads = types.map((type, i) => {
    const status = statuses[i]!;
    const temp = temps[i];
    const lead = makeLead(i, type, { status, source: sources[i]!, estimationForm: estim.has(i) });
    lead.temp = temp; lead.score = scoreFor(temp);
    lead.advisor = status === "nouveau" ? null : advs[k++];
    lead.reprendre = reprendreSet.has(i);
    if (status === "rdv") lead.statusSub = rdvKind(type);
    if (status === "client") { lead.statusSub = clientResult(type); lead.amount = type === "locataire" || type === "bailleur" ? int(6, 30) * 1000 : int(12, 80) * 100_000; }
    if (status === "perdu") lead.lostReason = pick(["Budget insuffisant", "A trouvé ailleurs", "Ne répond plus", "Projet abandonné"]);
    if (status === "rdv") {
      const at = NOW + int(0, 9) * DAY + int(9, 17) * 3600000 - (NOW % DAY);
      lead.rdvs.push({ id: "r" + i, at: i % 4 === 0 ? NOW - (NOW % DAY) + DAY + 11 * 3600000 : at, kind: rdvKind(type), advisor: lead.advisor!, place: type === "investisseur" ? "Agence Immo101 Agdal" : "Sur place", duration: 60 });
      lead.activities.push({ id: `a${i}r`, at: NOW - int(1, 4) * DAY, kind: "rdv", author: lead.advisor!, text: `${rdvKind(type)} planifié(e)` });
    }
    if (type === "vendeur" || type === "bailleur") {
      const p = properties.find((p) => p.mode === (type === "vendeur" ? "Vente" : "Location") && p.quartier === lead.quartier) ?? properties[i % 40];
      lead.ownerPropId = p.id;
    } else if (type !== "autre" && status !== "nouveau") {
      const cands = properties.filter((p) => (type === "locataire" ? p.mode === "Location" : p.mode === "Vente"));
      lead.proposed = shuffle([...cands]).slice(0, int(1, 4)).map((p) => ({ propId: p.id, status: pick(["Proposé", "Vu", "Visité", "Intéressé", "Refusé"] as const), match: int(62, 97), reasons: pick(["Budget ok, quartier ok, 1 critère manquant", "Budget ok, quartier proche", "Tous les critères correspondent", "Quartier ok, budget +8 %"]) }));
    }
    if (lead.reprendre) lead.activities.push({ id: `a${i}h`, at: lead.receivedAt + 1800000, kind: "statut", author: "Agent IA", text: "L'agent IA a passé la main à un conseiller" });
    if (status !== "nouveau" && i % 3 === 0) lead.notes.push({ id: "n" + i, at: lead.receivedAt + 2 * 3600000, author: lead.advisor ?? "Zoubida Labdi", text: "Client sérieux, rappeler en fin de journée. @Salma Bennani peux-tu préparer 2 biens ?", pinned: i % 2 === 0 });
    lead.activities.sort((a, b) => b.at - a.at);
    return lead;
  });

  const campaigns: Campaign[] = [
    ["Relance acheteurs, appartements Agdal", "acheteur", "WhatsApp", "Active"],
    ["Réactivation locataires Hay Riad", "locataire", "WhatsApp + Email", "Active"],
    ["Vendeurs en attente d'estimation", "vendeur", "WhatsApp", "Active"],
    ["Investisseurs, opportunités locatives", "investisseur", "Email", "Active"],
    ["Bailleurs, mise en location rapide", "bailleur", "WhatsApp", "En pause"],
    ["Acheteurs MRE, villas Souissi", "acheteur", "Email", "Active"],
    ["Locataires expatriés, meublés", "locataire", "Email", "Terminée"],
    ["Suivi après visite", "acheteur", "WhatsApp", "Active"],
  ].map(([name, cible, channel, status], i) => ({
    id: "c" + (i + 1), name, cible: cible as LeadType, channel: channel as Campaign["channel"], status: status as Campaign["status"], createdAt: NOW - int(5, 60) * DAY,
    steps: ["Bonjour {prénom}, suite à notre échange, voici {bien} à {quartier}. Qu'en pensez-vous ?", "Bonjour {prénom}, avez-vous eu le temps de regarder {bien} ? Je peux organiser une visite.", "Bonjour {prénom}, {bien} suscite de l'intérêt. Souhaitez-vous qu'on en parle ?", "Dernier message de notre part concernant {bien}. N'hésitez pas à revenir vers nous."],
  }));
  const relCands = shuffle(leads.filter((l) => l.status !== "nouveau" && l.type !== "autre")).slice(0, 60);
  const relances: Relance[] = relCands.map((l, i) => {
    const camp = campaigns.find((c) => c.cible === l.type && rnd() < 0.7) ?? campaigns[i % 8];
    const step = pick(["Envoyé", "Relance 1", "Relance 2", "Relance 3", "Répondu", "Répondu"] as const);
    const cls = step === "Répondu" ? pick(["Intéressé", "Intéressé", "Refusé", "Ambigu"] as const) : "En attente";
    const steps = ["Envoyé", "Relance 1", "Relance 2", "Relance 3"].slice(0, step === "Répondu" ? int(1, 3) : ["Envoyé", "Relance 1", "Relance 2", "Relance 3"].indexOf(step) + 1);
    const lastAt = NOW - int(0, 10) * DAY - int(0, 20) * 3600000;
    const prop = l.proposed[0] ? properties.find((p) => p.id === l.proposed[0].propId) : l.ownerPropId ? properties.find((p) => p.id === l.ownerPropId) : undefined;
    return {
      id: "R" + (i + 1), leadId: l.id, campaignId: camp.id, channel: camp.channel === "Email" ? "Email" : "WhatsApp", step, classification: cls,
      confidence: int(72, 97), reason: cls === "Intéressé" ? "Demande explicite de visite ou de rappel" : cls === "Refusé" ? "Le contact indique avoir trouvé ailleurs" : cls === "Ambigu" ? "Réponse courte sans intention claire" : "Pas encore de réponse",
      reply: step === "Répondu" ? (cls === "Intéressé" ? "Oui ça m'intéresse, on peut visiter samedi ?" : cls === "Refusé" ? "Merci mais j'ai déjà trouvé." : "Ok, je vais voir.") : undefined,
      lastAt, paused: false, stopped: false, subject: prop ? `${prop.ref} · ${prop.type} ${prop.quartier}` : l.quartier,
      history: steps.map((s, j) => ({ at: lastAt - (steps.length - j) * 3 * DAY, label: s, channel: camp.channel === "Email" ? "Email" : "WhatsApp", state: j < steps.length - 1 ? "lu" : "envoyé" as const })).concat(step === "Répondu" ? [{ at: lastAt, label: "Réponse reçue", channel: camp.channel === "Email" ? "Email" : "WhatsApp", state: "répondu" as const }] : []),
    };
  });

  const POST_T: [string, Post["kind"]][] = [["Villa d'exception à Souissi", "Annonce de bien"], ["5 conseils pour acheter sans stress", "Conseil"], ["Le marché locatif à Rabat en 2026", "Actualité marché"], ["Ils ont trouvé leur appartement à Agdal", "Témoignage"], ["Appartement vue mer à Océan", "Annonce de bien"], ["Investir à Hay Riad : rendements", "Actualité marché"], ["Estimer son bien : les étapes", "Conseil"], ["Duplex lumineux aux Orangers", "Annonce de bien"], ["Bureaux neufs à Hay Riad", "Annonce de bien"], ["Louer en tant qu'expatrié", "Conseil"], ["Témoignage d'un vendeur à Témara", "Témoignage"], ["Terrain titré à Harhoura", "Annonce de bien"], ["Prix au m² par quartier", "Actualité marché"], ["Préparer son dossier locataire", "Conseil"]];
  const monthStart = new Date(NOW); monthStart.setDate(1); monthStart.setHours(9, 0, 0, 0);
  const daysSoFar = Math.max(1, new Date(NOW).getDate());
  const posts: Post[] = [];
  const mk = (i: number, status: Post["status"], date: number): Post => {
    const [title, kind] = POST_T[i % POST_T.length];
    return { id: "P" + (posts.length + 1), title: status === "Idée" ? "Idée : " + title.toLowerCase() : title, text: "Découvrez avec Immo101 " + title.toLowerCase() + ". Contactez nos conseillers pour une visite.", kind, media: rnd() < 0.3 ? "Vidéo" : "Image", ai: int(72, 96), platforms: shuffle(["Instagram", "LinkedIn", "Site web"] as Post["platforms"]).slice(0, int(1, 3)), status, date, hashtags: "#Immo101 #Rabat #Immobilier", cta: "Prendre rendez-vous", tone: "Chaleureux", lang: "FR", propId: kind === "Annonce de bien" ? properties[i].id : undefined, stats: status === "Publié" ? { vues: int(800, 9000), likes: int(40, 600), clics: int(20, 300), leads: int(0, 6) } : { vues: 0, likes: 0, clics: 0, leads: 0 } };
  };
  for (let i = 0; i < 14; i++) posts.push(mk(i, "Publié", monthStart.getTime() + Math.floor((i / 14) * daysSoFar) * DAY + int(0, 8) * 3600000 > NOW ? NOW - (i + 1) * 3600000 : monthStart.getTime() + Math.floor((i / 14) * daysSoFar) * DAY + int(0, 8) * 3600000));
  for (let i = 0; i < 12; i++) posts.push(mk(i + 3, "Idée", NOW + int(2, 20) * DAY));
  for (let i = 0; i < 6; i++) posts.push(mk(i + 5, i < 2 ? "Brouillon" : "Planifié", NOW + int(1, 21) * DAY + int(9, 18) * 3600000));

  const all5 = ["Tableau de bord", "Prospection", "Annonces & publications", "Relances", "Base de connaissances"];
  const users: Advisor[] = ADVISORS.map((a, i) => ({ ...a, role: i === 0 ? "Admin" : "Conseiller", email: a.name.split(" ")[0].toLowerCase() + "@immo101-demo.ma", phone: `+212 6${61 + i} 22 33 4${i}`, active: true, createdAt: NOW - (300 - i * 40) * DAY, lastLogin: NOW - i * 5 * 3600000 - 600000, access: i === 0 ? all5 : all5.filter((x) => x !== "Base de connaissances"), types: i === 0 ? [...LEAD_TYPES] : [["acheteur", "investisseur"], ["locataire", "bailleur"], ["vendeur", "bailleur", "autre"]][i - 1] as LeadType[] }));

  const FAQ: [string, string][] = [["Quels sont vos honoraires à l'achat ?", "Achat"], ["Comment se passe une visite ?", "Achat"], ["Puis-je acheter depuis l'étranger ?", "Achat"], ["Quels documents pour louer ?", "Location"], ["Combien de mois de caution ?", "Location"], ["Louez-vous des biens meublés ?", "Location"], ["Le garant est-il obligatoire ?", "Location"], ["Comment estimez-vous mon bien ?", "Vendeurs"], ["Mandat exclusif ou simple ?", "Vendeurs"], ["Combien de temps pour vendre ?", "Vendeurs"], ["Quels frais pour le vendeur ?", "Vendeurs"], ["Quel rendement locatif à Rabat ?", "Investissement"], ["Accompagnez-vous les non-résidents ?", "Investissement"], ["Gérez-vous les biens après achat ?", "Investissement"], ["Aidez-vous à obtenir un crédit ?", "Financement"], ["Quel apport pour un crédit ?", "Financement"], ["Qu'est-ce qu'un accord de principe ?", "Financement"], ["Quels sont vos horaires ?", "Général"], ["Où se trouve l'agence ?", "Général"], ["Parlez-vous anglais et arabe ?", "Général"]];
  const faqs: Faq[] = FAQ.map(([q, cat], i) => ({ id: "F" + (i + 1), q, a: "Réponse type validée par l'agence pour : " + q.toLowerCase(), cat, status: i % 7 === 6 ? "Brouillon" : "Actif", used: int(3, 140), updatedAt: NOW - int(1, 90) * DAY, types: [], langs: ["FR", "AR", "EN"].slice(0, int(1, 3)) }));
  const services: ServiceSheet[] = [["Achat", "Trouver le bien qui correspond à votre projet, de la recherche à la signature."], ["Location", "Louer rapidement un bien adapté, avec un dossier solide."], ["Investissement", "Identifier des opportunités rentables à Rabat et alentours."], ["Estimation de bien", "Une estimation fiable fondée sur des ventes comparables."], ["Financement", "Être accompagné pour obtenir le meilleur crédit."]].map(([title, desc], i) => ({ id: "S" + (i + 1), title, desc, benefits: ["Conseiller dédié", "Sélection de biens vérifiés", "Accompagnement jusqu'à la signature"], steps: ["Premier échange", "Qualification", "Propositions", "Visites", "Signature"], docs: ["Pièce d'identité"], conditions: "Honoraires selon la grille en vigueur.", types: [LEAD_TYPES[i]] }));
  const kbDocs: KbDoc[] = [["Checklist locataire.pdf", "Checklist"], ["Checklist vendeur.pdf", "Checklist"], ["Guide d'achat.pdf", "Guide"], ["Conditions de mandat.pdf", "Juridique"], ["Grille d'honoraires.pdf", "Tarifs"], ["Guide investisseur.pdf", "Guide"]].map(([name, cat], i) => ({ id: "D" + (i + 1), name, cat, date: NOW - int(5, 120) * DAY, size: int(120, 2400) + " Ko" }));
  const kbContacts: KbContact[] = [["Salma Bennani", "Location", "Conseillère location"], ["Youssef Alaoui", "Vente", "Conseiller vente"], ["Karim Tazi", "Investissement", "Conseiller investissement"], ["Zoubida Labdi", "Vente", "Directrice"], ["Hajar El Amrani", "Administratif", "Assistante administrative"], ["Mehdi Kettani", "Location", "Gestion locative"]].map(([name, specialty, role], i) => ({ id: "K" + (i + 1), name, specialty: specialty as KbContact["specialty"], role, phone: `+212 537 ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`, email: name.split(" ")[0].toLowerCase() + "@immo101-demo.ma" }));

  const recent = [...leads].sort((a, b) => b.receivedAt - a.receivedAt);
  const feed: FeedEvent[] = [];
  recent.slice(0, 30).forEach((l, i) => {
    feed.push({ id: "e" + i, at: l.receivedAt, kind: "new", text: `Nouveau lead ${l.name} via ${l.source === "whatsapp" ? "WhatsApp" : l.source === "email" ? "Email" : l.source === "site" ? "Site web" : "Instagram"}`, leadId: l.id });
    if (l.status !== "nouveau") feed.push({ id: "eq" + i, at: l.receivedAt + 900000, kind: "qualified", text: `${l.name} qualifié par l'agent IA (score ${l.score})`, leadId: l.id });
  });
  leads.filter((l) => l.rdvs.length).slice(0, 8).forEach((l, i) => feed.push({ id: "er" + i, at: NOW - (i + 1) * 5 * 3600000, kind: "rdv", text: `${l.rdvs[0].kind} réservé(e) avec ${l.name}`, leadId: l.id }));
  relances.filter((r) => r.step === "Répondu").slice(0, 8).forEach((r, i) => feed.push({ id: "es" + i, at: r.lastAt, kind: "relance", text: `Relance répondue par ${leads.find((l) => l.id === r.leadId)!.name}`, leadId: r.leadId }));
  posts.filter((p) => p.status === "Publié").slice(0, 6).forEach((p, i) => feed.push({ id: "ep" + i, at: p.date, kind: "post", text: `Publication « ${p.title} » publiée` }));
  leads.filter((l) => l.proposed.length).slice(0, 8).forEach((l, i) => feed.push({ id: "eb" + i, at: NOW - (i + 2) * 7 * 3600000, kind: "property", text: `Bien envoyé à ${l.name}`, leadId: l.id }));
  feed.sort((a, b) => b.at - a.at);

  const newest = recent.find((l) => l.status === "nouveau")!;
  const qual = recent.find((l) => l.status === "qualifie")!;
  const rep1 = leads.find((l) => l.reprendre)!;
  const rdvT = leads.find((l) => l.rdvs.length)!;
  const relR = relances.find((r) => r.step === "Répondu")!;
  const notifs: Notif[] = [
    { id: "N1", at: NOW - 600000, kind: "Nouveau lead", text: `${newest.name} vient d'écrire`, read: false, link: { to: "lead", id: newest.id } },
    { id: "N2", at: NOW - 1800000, kind: "Lead qualifié", text: `${qual.name} qualifié (score ${qual.score})`, read: false, link: { to: "lead", id: qual.id } },
    { id: "N3", at: NOW - 3600000, kind: "Lead à reprendre", text: `${rep1.name} attend un conseiller`, read: false, link: { to: "lead", id: rep1.id } },
    { id: "N4", at: NOW - 5 * 3600000, kind: "RDV demain", text: `${rdvT.rdvs[0].kind} avec ${rdvT.name}`, read: false, link: { to: "lead", id: rdvT.id } },
    { id: "N5", at: NOW - 8 * 3600000, kind: "Relance répondue", text: `${leads.find((l) => l.id === relR.leadId)!.name} a répondu`, read: true, link: { to: "relance", id: relR.id } },
    { id: "N6", at: NOW - DAY, kind: "Post publié", text: `« ${posts[0].title} » est en ligne`, read: true, link: { to: "post", id: posts[0].id } },
    { id: "N7", at: NOW - 3 * DAY, kind: "Utilisateur ajouté", text: "Karim Tazi a rejoint l'équipe", read: true, link: { to: "user", id: "u4" } },
  ];

  return { leads, properties, campaigns, relances, posts, users, faqs, services, kbDocs, kbContacts, notifs, feed, objectives: ["Générer des leads vendeurs", "Valoriser les biens premium", "Attirer les investisseurs MRE"] };
}

export { SCORE_CRITERIA, DOC_LIST };
export const DAY_MS = DAY;
export const rand = () => rnd();
