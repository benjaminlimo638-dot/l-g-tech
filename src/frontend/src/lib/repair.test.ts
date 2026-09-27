import { RepairStatus } from "@/backend";
import {
  REPAIR_STAGES,
  STAGE_LABELS,
  WORKSHOP,
  formatMoney,
  hasValidTimestamp,
  stageIndex,
  stageLabel,
  toWhatsAppNumber,
  whatsAppLink,
} from "@/lib/repair";
import { describe, expect, it } from "vitest";

describe("repair stage helpers", () => {
  it("orders the six stages from Recibido to Entregado", () => {
    expect(REPAIR_STAGES).toEqual([
      RepairStatus.Recibido,
      RepairStatus.Diagnosticando,
      RepairStatus.EnReparacion,
      RepairStatus.Probando,
      RepairStatus.ListoParaEntregar,
      RepairStatus.Entregado,
    ]);
  });

  it("maps each stage to a zero-based index", () => {
    expect(stageIndex(RepairStatus.Recibido)).toBe(0);
    expect(stageIndex(RepairStatus.EnReparacion)).toBe(2);
    expect(stageIndex(RepairStatus.Entregado)).toBe(5);
  });

  it("labels every stage in Spanish", () => {
    for (const stage of REPAIR_STAGES) {
      expect(stageLabel(stage)).toBe(STAGE_LABELS[stage]);
      expect(stageLabel(stage).length).toBeGreaterThan(0);
    }
  });
});

describe("hasValidTimestamp", () => {
  it("accepts a real positive timestamp", () => {
    expect(hasValidTimestamp(1_700_000_000_000_000_000n)).toBe(true);
  });

  it("treats undefined and the epoch as absent", () => {
    expect(hasValidTimestamp(undefined)).toBe(false);
    expect(hasValidTimestamp(0n)).toBe(false);
  });
});

describe("formatMoney", () => {
  it("formats whole-currency amounts as EUR", () => {
    expect(formatMoney(120n)).toContain("120");
    expect(formatMoney(0n)).toContain("0");
  });
});

describe("WORKSHOP contact details", () => {
  it("exposes the accepted business address", () => {
    expect(WORKSHOP.address).toBe("Av. Huamachuco #736 Lambayeque");
  });

  it("keeps the other contact details unchanged", () => {
    expect(WORKSHOP.name).toBe("L&G TECH");
    expect(WORKSHOP.tagline).toBe("Servicio Técnico de Celulares");
    expect(WORKSHOP.phone).toBe("+34 600 123 456");
    expect(WORKSHOP.email).toBe("soporte@lgtech.es");
    expect(WORKSHOP.hours).toBe(
      "Lun a Vie · 09:00 – 19:00 · Sáb 10:00 – 14:00",
    );
  });
});

describe("WhatsApp helpers", () => {
  it("normalizes a phone number to digits only", () => {
    expect(toWhatsAppNumber("+34 600 123 456")).toBe("34600123456");
  });

  it("builds a wa.me link with an encoded message", () => {
    const link = whatsAppLink("+34 600 123 456", "Hola L&G TECH");
    expect(link.startsWith("https://wa.me/34600123456?text=")).toBe(true);
    expect(link).toContain(encodeURIComponent("Hola L&G TECH"));
  });

  it("builds a bare wa.me link without a message", () => {
    expect(whatsAppLink("+34 600 123 456")).toBe("https://wa.me/34600123456");
  });
});
