import { WHATSAPP_DEFAULT_MESSAGE, WORKSHOP, whatsAppLink } from "@/lib/repair";
import { SiWhatsapp } from "react-icons/si";

/**
 * Floating WhatsApp action, visible across all customer pages.
 * Renders as a fixed pill on desktop and a compact circle on mobile.
 */
export function WhatsAppButton() {
  return (
    <a
      href={whatsAppLink(WORKSHOP.phone, WHATSAPP_DEFAULT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      data-ocid="whatsapp.button"
      className="group fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-success px-4 py-3 text-success-foreground shadow-elevated transition-smooth hover:-translate-y-0.5 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6 sm:right-6"
    >
      <SiWhatsapp className="h-6 w-6 shrink-0" aria-hidden="true" />
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </a>
  );
}
