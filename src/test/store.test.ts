import { describe, expect, it } from "vitest";
import { generate } from "@/lib/seed";
import { checkConsistency } from "@/lib/consistency";

const s = generate();
const count = (f: (l: (typeof s.leads)[number]) => boolean) => s.leads.filter(f).length;

describe("Mock store matches the brief", () => {
  it("passes the consistency check", () => expect(checkConsistency(s)).toEqual([]));
  it("sources: WhatsApp 52, Email 31, Site 22 (9 estimation), Instagram 15", () => {
    expect([count((l) => l.source === "whatsapp"), count((l) => l.source === "email"), count((l) => l.source === "site"), count((l) => l.source === "instagram")]).toEqual([52, 31, 22, 15]);
    expect(count((l) => l.estimationForm && l.type === "vendeur")).toBe(9);
  });
  it("types 34/31/19/17/12/7", () => {
    expect(["acheteur", "locataire", "vendeur", "bailleur", "investisseur", "autre"].map((t) => count((l) => l.type === t))).toEqual([34, 31, 19, 17, 12, 7]);
  });
  it("temperatures 28/47/45 and scores match thresholds", () => {
    expect([count((l) => l.temp === "chaud"), count((l) => l.temp === "tiede"), count((l) => l.temp === "froid")]).toEqual([28, 47, 45]);
    expect(s.leads.every((l) => (l.temp === "chaud" ? l.score >= 70 : l.temp === "tiede" ? l.score >= 40 && l.score < 70 : l.score < 40))).toBe(true);
  });
  it("clients by type 3/4/2/2/1", () => {
    expect(["acheteur", "locataire", "vendeur", "bailleur", "investisseur"].map((t) => count((l) => l.type === t && l.status === "client"))).toEqual([3, 4, 2, 2, 1]);
  });
  it("advisors: Nouveau unassigned, 20/31/28/23", () => {
    expect(count((l) => l.status === "nouveau" && !!l.advisor)).toBe(0);
    expect(["Zoubida Labdi", "Youssef Alaoui", "Salma Bennani", "Karim Tazi"].map((a) => count((l) => l.advisor === a))).toEqual([20, 31, 28, 23]);
  });
  it("À reprendre never on Client or Perdu", () => expect(count((l) => l.reprendre && (l.status === "client" || l.status === "perdu"))).toBe(0));
  it("other datasets", () => {
    expect(s.properties.length).toBe(40);
    expect(s.relances.length).toBe(60);
    expect(s.campaigns.length).toBe(8);
    expect(s.posts.filter((p) => p.status === "Publié").length).toBe(14);
    expect(s.posts.filter((p) => p.status === "Idée").length).toBe(12);
    expect([s.users.length, s.faqs.length, s.services.length, s.kbDocs.length, s.kbContacts.length]).toEqual([4, 20, 5, 6, 6]);
  });
});
