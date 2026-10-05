import { QUAL_FIELDS, SCORE_CRITERIA, fmtM, type LeadType } from "@/lib/domain";
import type { Lead, Property } from "@/lib/seed";

const n = (v: unknown) => (typeof v === "number" ? v : undefined);
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

export function projectSummary(l: Lead, props?: Property[]) {
  const q = l.qual;
  const own = props?.find((p) => p.id === l.ownerPropId);
  switch (l.type) {
    case "acheteur": return `Achat · ${q.typeBien ?? "Bien"}${n(q.chambres) ? ` ${n(q.chambres)! + 1} pièces` : ""} · ${arr(q.quartiers)[0] ?? l.quartier}${n(q.budget) ? " · " + fmtM(n(q.budget)!) : ""}`;
    case "locataire": return `Location · ${q.meuble === true ? "Meublé" : q.meuble === false ? "Non meublé" : q.typeBien ?? "Bien"} · ${arr(q.quartiers)[0] ?? l.quartier}${n(q.budget) ? ` · ${n(q.budget)!.toLocaleString("fr-FR")} MAD/mois` : ""}`;
    case "vendeur": return `Vente · ${q.typeBien ?? own?.type ?? "Bien"}${n(q.surface) ? ` ${n(q.surface)} m²` : ""} · ${q.quartier ?? l.quartier}${n(q.prix) ? " · souhaité " + fmtM(n(q.prix)!) : ""}`;
    case "bailleur": return `Mise en location · ${q.typeBien ?? own?.type ?? "Bien"} · ${q.quartier ?? l.quartier}${n(q.loyer) ? ` · souhaité ${n(q.loyer)!.toLocaleString("fr-FR")} MAD/mois` : ""}`;
    case "investisseur": return `Investissement · ${String(q.strategie ?? "Locatif").replace("Locatif résidentiel", "Locatif")}${n(q.budget) ? " · budget " + fmtM(n(q.budget)!) : ""}${n(q.rendement) ? ` · rendement visé ${n(q.rendement)} %` : ""}`;
    default: return `Demande d'information · ${q.objet ?? "Information"}`;
  }
}

export function filledKeys(l: Lead) {
  return QUAL_FIELDS[l.type].filter((f) => { const v = l.qual[f.key]; return v !== undefined && v !== "" && !(Array.isArray(v) && !v.length); });
}
export function missing(l: Lead) { const f = new Set(filledKeys(l).map((x) => x.key)); return QUAL_FIELDS[l.type].filter((x) => !f.has(x.key)); }
export function completion(l: Lead) { return Math.round((filledKeys(l).length / QUAL_FIELDS[l.type].length) * 100); }

export function breakdown(l: Lead) {
  const crit = SCORE_CRITERIA[l.type];
  const seed = [...l.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  let rem = l.score;
  return crit.map(([label, w], i) => {
    const ratio = Math.min(1, (l.score / 100) * (0.85 + ((seed * (i + 3)) % 30) / 100));
    let pts = i === crit.length - 1 ? Math.max(0, Math.min(w, rem)) : Math.min(w, Math.round(w * ratio));
    rem -= pts; if (rem < 0) { pts += rem; rem = 0; }
    return { label, w, pts };
  });
}

export function keyFacts(l: Lead, props: Property[]): [string, string][] {
  const q = l.qual, own = props.find((p) => p.id === l.ownerPropId);
  const v = (x: unknown) => (x === undefined || x === "" ? "À préciser" : Array.isArray(x) ? x.join(", ") : typeof x === "number" ? (x > 10000 ? fmtM(x) : String(x)) : typeof x === "boolean" ? (x ? "Oui" : "Non") : String(x));
  switch (l.type) {
    case "acheteur": return [["Budget", v(q.budget)], ["Zone", v(q.quartiers)], ["Financement", v(q.financement)], ["Délai", v(q.delai)]];
    case "locataire": return [["Loyer max", n(q.budget) ? n(q.budget)!.toLocaleString("fr-FR") + " MAD/mois" : "À préciser"], ["Zone", v(q.quartiers)], ["Date d'entrée", v(q.dateEntree)], ["Dossier", v(q.dossier)]];
    case "vendeur": { const est = estimate(l, props); return [["Bien", own ? `${own.type} · ${own.quartier}` : v(q.typeBien)], ["Prix souhaité vs estimation", n(q.prix) ? `${fmtM(n(q.prix)!)} / ${fmtM(est.mid)}` : `Estim. ${fmtM(est.mid)}`], ["Délai", v(q.delai)], ["Mandat", v(q.mandat)]]; }
    case "bailleur": return [["Bien", own ? `${own.type} · ${own.quartier}` : v(q.typeBien)], ["Loyer souhaité", n(q.loyer) ? n(q.loyer)!.toLocaleString("fr-FR") + " MAD/mois" : "À préciser"], ["Disponibilité", v(q.dispo)], ["Mandat", v(q.mandat)]];
    case "investisseur": return [["Budget", v(q.budget)], ["Rendement visé", n(q.rendement) ? n(q.rendement) + " %" : "À préciser"], ["Stratégie", v(q.strategie)], ["Horizon", n(q.horizon) ? n(q.horizon) + " ans" : "À préciser"]];
    default: return [["Objet", v(q.objet)], ["Détail", v(q.detail)], ["Rediriger vers", v(q.rediriger)], ["Langue", l.lang]];
  }
}

export function estimate(l: Lead, props: Property[]) {
  const own = props.find((p) => p.id === l.ownerPropId);
  const base = own?.price ?? (l.type === "bailleur" ? 9000 : 2_500_000);
  const comps = props.filter((p) => p.mode === (own?.mode ?? (l.type === "bailleur" ? "Location" : "Vente")) && p.id !== own?.id).sort((a, b) => Math.abs(a.price - base) - Math.abs(b.price - base)).slice(0, 3);
  const mid = Math.round(comps.reduce((a, p) => a + p.price, base) / (comps.length + 1) / 1000) * 1000;
  return { low: Math.round(mid * 0.92), mid, high: Math.round(mid * 1.08), comps };
}

export function nextAction(l: Lead): string {
  if (l.reprendre) return "Prendre en charge le lead et appeler le contact";
  if (l.status === "nouveau") return "Assigner un conseiller";
  if (l.status === "qualifie") return l.type === "vendeur" || l.type === "bailleur" ? "Planifier l'estimation sur place" : l.type === "autre" ? "Rediriger vers le bon conseiller" : "Envoyer une sélection de biens";
  if (l.status === "contacte") return "Planifier un RDV";
  if (l.status === "rdv") return "Préparer le RDV et confirmer la veille";
  if (l.status === "negociation") return "Relancer sur l'offre en cours";
  return "Aucune action urgente";
}

export function relevantType(t: LeadType) { return t; }
