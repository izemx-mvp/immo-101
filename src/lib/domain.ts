// Domain constants & types for the Immo101 AI backoffice (mock).
export type LeadType = "acheteur" | "locataire" | "vendeur" | "bailleur" | "investisseur" | "autre";
export type Source = "whatsapp" | "email" | "site" | "instagram";
export type Temp = "chaud" | "tiede" | "froid";
export type Status = "nouveau" | "qualifie" | "contacte" | "rdv" | "negociation" | "client" | "perdu";

export const LEAD_TYPES: LeadType[] = ["acheteur", "locataire", "vendeur", "bailleur", "investisseur", "autre"];
export const TYPE_LABEL: Record<LeadType, string> = {
  acheteur: "Acheteur", locataire: "Locataire", vendeur: "Propriétaire vendeur",
  bailleur: "Propriétaire bailleur", investisseur: "Investisseur", autre: "Autre",
};
export const TYPE_PLURAL: Record<LeadType, string> = {
  acheteur: "Acheteurs", locataire: "Locataires", vendeur: "Vendeurs",
  bailleur: "Bailleurs", investisseur: "Investisseurs", autre: "Autres",
};
export const STATUSES: Status[] = ["nouveau", "qualifie", "contacte", "rdv", "negociation", "client", "perdu"];
export const STATUS_LABEL: Record<Status, string> = {
  nouveau: "Nouveau", qualifie: "Qualifié IA", contacte: "Contacté", rdv: "RDV planifié",
  negociation: "En négociation", client: "Client", perdu: "Perdu",
};
export const STATUS_TONE: Record<Status, Tone> = {
  nouveau: "info", qualifie: "primary", contacte: "neutral", rdv: "warning",
  negociation: "warning", client: "success", perdu: "danger",
};
export const SOURCES: Source[] = ["whatsapp", "email", "site", "instagram"];
export const SOURCE_LABEL: Record<Source, string> = { whatsapp: "WhatsApp", email: "Email", site: "Site web", instagram: "Instagram" };
export const TEMP_LABEL: Record<Temp, string> = { chaud: "Chaud", tiede: "Tiède", froid: "Froid" };
export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary" | "cold";

export const tempOf = (score: number): Temp => (score >= 70 ? "chaud" : score >= 40 ? "tiede" : "froid");

export function rdvKind(t: LeadType) {
  if (t === "acheteur" || t === "locataire") return "Visite";
  if (t === "vendeur" || t === "bailleur") return "Estimation sur place";
  if (t === "investisseur") return "RDV conseil";
  return "RDV";
}
export function clientResult(t: LeadType) {
  if (t === "acheteur") return "Vente conclue";
  if (t === "locataire") return "Location signée";
  if (t === "vendeur" || t === "bailleur") return "Mandat signé";
  if (t === "investisseur") return "Investissement conclu";
  return "Conclu";
}
export const LOST_REASONS = ["Budget insuffisant", "A trouvé ailleurs", "Prix trop élevé", "Mandat chez un concurrent", "Ne répond plus", "Projet abandonné"];
export const QUARTIERS = ["Hassan", "Agdal", "Souissi", "Hay Riad", "Océan", "Orangers", "Témara", "Harhoura", "Skhirat", "Salé"];
export const INTERFACES = ["Tableau de bord", "Prospection", "Annonces & publications", "Relances", "Base de connaissances"];

export type FieldKind = "select" | "multi" | "number" | "toggle" | "text" | "date";
export interface FieldDef { key: string; label: string; kind: FieldKind; options?: string[]; unit?: string }

const PT = ["Appartement", "Villa", "Terrain", "Bureau", "Local commercial", "Riad", "Immeuble"];
export const QUAL_FIELDS: Record<LeadType, FieldDef[]> = {
  acheteur: [
    { key: "objet", label: "Objet", kind: "select", options: ["Résidence principale", "Résidence secondaire", "Premier achat"] },
    { key: "typeBien", label: "Type de bien", kind: "select", options: PT },
    { key: "surfaceMin", label: "Surface minimum", kind: "number", unit: "m²" },
    { key: "chambres", label: "Nombre de chambres", kind: "number" },
    { key: "quartiers", label: "Quartiers souhaités", kind: "multi", options: QUARTIERS },
    { key: "neuf", label: "Neuf ou ancien", kind: "select", options: ["Neuf", "Ancien", "Indifférent"] },
    { key: "criteres", label: "Critères", kind: "multi", options: ["Parking", "Piscine", "Ascenseur", "Jardin", "Terrasse"] },
    { key: "budget", label: "Budget maximum", kind: "number", unit: "MAD" },
    { key: "apport", label: "Apport personnel", kind: "number", unit: "MAD" },
    { key: "financement", label: "Financement", kind: "select", options: ["Comptant", "Crédit", "Crédit en cours de demande"] },
    { key: "accord", label: "Accord de principe bancaire", kind: "toggle" },
    { key: "delai", label: "Délai d'achat", kind: "select", options: ["Immédiat", "Moins de 3 mois", "3 à 6 mois", "Plus de 6 mois"] },
    { key: "urgence", label: "Urgence", kind: "select", options: ["Faible", "Moyenne", "Forte"] },
    { key: "etranger", label: "Résident à l'étranger", kind: "toggle" },
  ],
  locataire: [
    { key: "typeBien", label: "Type de bien", kind: "select", options: PT },
    { key: "usage", label: "Usage", kind: "select", options: ["Habitation", "Bureau", "Local commercial"] },
    { key: "meuble", label: "Meublé", kind: "toggle" },
    { key: "budget", label: "Budget mensuel maximum", kind: "number", unit: "MAD/mois" },
    { key: "quartiers", label: "Quartiers", kind: "multi", options: QUARTIERS },
    { key: "chambres", label: "Nombre de chambres", kind: "number" },
    { key: "dateEntree", label: "Date d'entrée souhaitée", kind: "date" },
    { key: "duree", label: "Durée du bail", kind: "select", options: ["6 mois", "1 an", "2 ans", "3 ans et plus"] },
    { key: "occupants", label: "Nombre d'occupants", kind: "number" },
    { key: "animaux", label: "Animaux", kind: "toggle" },
    { key: "profil", label: "Profil", kind: "select", options: ["Particulier", "Entreprise", "Expatrié"] },
    { key: "dossier", label: "Dossier locataire", kind: "select", options: ["Complet avec garant", "Justificatifs sans garant", "Incomplet"] },
    { key: "parking", label: "Parking", kind: "toggle" },
  ],
  vendeur: [
    { key: "typeBien", label: "Type de bien", kind: "select", options: PT },
    { key: "quartier", label: "Adresse ou quartier", kind: "select", options: QUARTIERS },
    { key: "surface", label: "Surface", kind: "number", unit: "m²" },
    { key: "pieces", label: "Pièces", kind: "number" },
    { key: "etage", label: "Étage", kind: "number" },
    { key: "etat", label: "État", kind: "select", options: ["Neuf", "Très bon", "Bon", "À rafraîchir", "À rénover"] },
    { key: "annee", label: "Année de construction", kind: "number" },
    { key: "juridique", label: "Statut juridique", kind: "select", options: ["Titre foncier", "Certificat de propriété", "Autre"] },
    { key: "occupe", label: "Bien occupé", kind: "toggle" },
    { key: "prix", label: "Prix souhaité", kind: "number", unit: "MAD" },
    { key: "motif", label: "Motif de la vente", kind: "select", options: ["Succession", "Mutation", "Investissement", "Agrandissement", "Autre"] },
    { key: "delai", label: "Délai de vente", kind: "select", options: ["Immédiat", "Moins de 3 mois", "3 à 6 mois", "Pas pressé"] },
    { key: "mandat", label: "Mandat", kind: "select", options: ["Exclusif", "Simple", "Aucun"] },
    { key: "credit", label: "Crédit ou hypothèque en cours", kind: "toggle" },
    { key: "documents", label: "Documents disponibles", kind: "text" },
  ],
  bailleur: [
    { key: "typeBien", label: "Type de bien", kind: "select", options: PT },
    { key: "quartier", label: "Adresse ou quartier", kind: "select", options: QUARTIERS },
    { key: "surface", label: "Surface", kind: "number", unit: "m²" },
    { key: "pieces", label: "Pièces", kind: "number" },
    { key: "meuble", label: "Meublé", kind: "toggle" },
    { key: "loyer", label: "Loyer souhaité", kind: "number", unit: "MAD/mois" },
    { key: "charges", label: "Charges", kind: "number", unit: "MAD/mois" },
    { key: "caution", label: "Caution (mois)", kind: "number" },
    { key: "dispo", label: "Disponibilité", kind: "date" },
    { key: "occupe", label: "Bien occupé", kind: "toggle" },
    { key: "gestion", label: "Gestion souhaitée", kind: "select", options: ["Mise en location seule", "Suivi après location"] },
    { key: "profilLoc", label: "Profil de locataire souhaité", kind: "text" },
    { key: "mandat", label: "Mandat", kind: "select", options: ["Exclusif", "Simple", "Aucun"] },
    { key: "documents", label: "Documents disponibles", kind: "text" },
  ],
  investisseur: [
    { key: "strategie", label: "Stratégie", kind: "select", options: ["Locatif résidentiel", "Bureaux ou local commercial", "Terrain", "Immeuble", "Revente"] },
    { key: "ticketMin", label: "Ticket minimum", kind: "number", unit: "MAD" },
    { key: "budget", label: "Ticket maximum", kind: "number", unit: "MAD" },
    { key: "rendement", label: "Rendement attendu", kind: "number", unit: "%" },
    { key: "horizon", label: "Horizon", kind: "number", unit: "ans" },
    { key: "financement", label: "Financement", kind: "select", options: ["Comptant", "Crédit", "Mixte"] },
    { key: "zones", label: "Zones ou villes cibles", kind: "multi", options: QUARTIERS },
    { key: "nbBiens", label: "Nombre de biens recherchés", kind: "number" },
    { key: "experience", label: "Expérience en investissement", kind: "select", options: ["Débutant", "Intermédiaire", "Confirmé"] },
    { key: "resident", label: "Résident", kind: "select", options: ["Résident", "Non-résident"] },
  ],
  autre: [
    { key: "objet", label: "Objet de la demande", kind: "select", options: ["Information", "Estimation seule", "Partenariat", "Candidature", "Autre"] },
    { key: "detail", label: "Détail", kind: "text" },
    { key: "rediriger", label: "À rediriger vers", kind: "select", options: ["Zoubida Labdi", "Youssef Alaoui", "Salma Bennani", "Karim Tazi"] },
  ],
};

export const SCORE_CRITERIA: Record<LeadType, [string, number][]> = {
  acheteur: [["Budget défini", 25], ["Financement", 25], ["Délai", 20], ["Précision des critères", 15], ["Réactivité", 15]],
  locataire: [["Budget vs loyers du marché", 25], ["Dossier et justificatifs", 25], ["Date d'entrée", 20], ["Précision des critères", 15], ["Réactivité", 15]],
  vendeur: [["Prix réaliste vs estimation", 25], ["Documents du bien", 20], ["Délai de vente", 20], ["Mandat", 20], ["Réactivité", 15]],
  bailleur: [["Loyer réaliste", 25], ["Disponibilité", 20], ["Documents", 20], ["Mandat", 20], ["Réactivité", 15]],
  investisseur: [["Budget et ticket", 30], ["Financement", 20], ["Clarté de la stratégie", 20], ["Expérience", 15], ["Réactivité", 15]],
  autre: [["Clarté de la demande", 50], ["Réactivité", 50]],
};

export const DOC_LIST: Record<LeadType, string[]> = {
  acheteur: ["Pièce d'identité", "Justificatif de financement ou accord de principe bancaire"],
  locataire: ["Pièce d'identité", "Justificatif d'emploi", "3 dernières fiches de paie", "Garant"],
  vendeur: ["Titre foncier ou certificat de propriété", "Pièce d'identité", "Plans", "Justificatif de charges"],
  bailleur: ["Titre ou certificat de propriété", "Pièce d'identité", "Règlement de copropriété"],
  investisseur: ["Pièce d'identité", "Justificatif de fonds (optionnel)"],
  autre: [],
};

export const fmtMAD = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " MAD";
export const fmtM = (n: number) => (n >= 1_000_000 ? (n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " M MAD" : new Intl.NumberFormat("fr-FR").format(n) + " MAD");
export const AI_DISCLAIMER = "L'IA aide à qualifier. La décision finale appartient à l'agence.";
