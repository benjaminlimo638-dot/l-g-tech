import { RepairStatus } from "@/backend";

/** The six repair stages in operational order. */
export const REPAIR_STAGES: RepairStatus[] = [
  RepairStatus.Recibido,
  RepairStatus.Diagnosticando,
  RepairStatus.EnReparacion,
  RepairStatus.Probando,
  RepairStatus.ListoParaEntregar,
  RepairStatus.Entregado,
];

/** Human-readable Spanish label for each stage. */
export const STAGE_LABELS: Record<RepairStatus, string> = {
  [RepairStatus.Recibido]: "Recibido",
  [RepairStatus.Diagnosticando]: "Diagnosticando",
  [RepairStatus.EnReparacion]: "En reparación",
  [RepairStatus.Probando]: "Probando",
  [RepairStatus.ListoParaEntregar]: "Listo para entregar",
  [RepairStatus.Entregado]: "Entregado",
};

/** Short description shown under each stage in the progress trace. */
export const STAGE_DESCRIPTIONS: Record<RepairStatus, string> = {
  [RepairStatus.Recibido]: "Equipo ingresado al taller",
  [RepairStatus.Diagnosticando]: "Evaluación técnica en curso",
  [RepairStatus.EnReparacion]: "Intervención sobre el equipo",
  [RepairStatus.Probando]: "Control de calidad y pruebas",
  [RepairStatus.ListoParaEntregar]: "Puede retirarse en el local",
  [RepairStatus.Entregado]: "Equipo entregado al cliente",
};

/** Zero-based index of a stage inside the six-step trace. */
export function stageIndex(status: RepairStatus): number {
  const index = REPAIR_STAGES.indexOf(status);
  return index === -1 ? 0 : index;
}

/** Spanish label for a stage, with a safe fallback. */
export function stageLabel(status: RepairStatus): string {
  return STAGE_LABELS[status] ?? "Estado desconocido";
}

/** Tailwind background tint class for a stage badge. */
export function stageBadgeClass(status: RepairStatus): string {
  switch (status) {
    case RepairStatus.ListoParaEntregar:
    case RepairStatus.Entregado:
      return "bg-success/15 text-success";
    case RepairStatus.EnReparacion:
      return "bg-warning/15 text-warning";
    default:
      return "bg-accent/15 text-accent";
  }
}

/** Convert a Motoko nanosecond timestamp into a Date, or null when invalid. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Whether an optional backend timestamp holds a real date. Treats `undefined`
 * and the epoch (`0n`) as absent, so a legacy bogus `?0` never renders as
 * "01 ene 1970".
 */
export function hasValidTimestamp(timestamp?: bigint): timestamp is bigint {
  return timestamp !== undefined && timestamp > 0n;
}

/** Format a backend timestamp as a short Spanish date. */
export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format a backend timestamp as a Spanish date and time. */
export function formatDateTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a whole-currency amount (backend stores integer units). */
export function formatMoney(amount: bigint): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/** Normalize a phone number into a wa.me-compatible digits-only string. */
export function toWhatsAppNumber(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** Build a wa.me deep link with an optional prefilled message. */
export function whatsAppLink(phone: string, message?: string): string {
  const base = `https://wa.me/${toWhatsAppNumber(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Public contact details for the workshop. */
export const WORKSHOP = {
  name: "L&G TECH",
  tagline: "Servicio Técnico de Celulares",
  phone: "+34 600 123 456",
  email: "soporte@lgtech.es",
  address: "Av. Huamachuco #736 Lambayeque",
  hours: "Lun a Vie · 09:00 – 19:00 · Sáb 10:00 – 14:00",
} as const;

/** Default WhatsApp message used by the floating action button. */
export const WHATSAPP_DEFAULT_MESSAGE =
  "Hola L&G TECH, quiero consultar por una reparación de mi celular.";
