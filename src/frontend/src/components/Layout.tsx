import { WhatsAppButton } from "@/components/WhatsAppButton";
import { WORKSHOP, whatsAppLink } from "@/lib/repair";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/solicitar", label: "Solicitar reparación" },
  { to: "/consultar", label: "Consultar reparación" },
] as const;

/**
 * Shared shell for the public customer experience: sticky header with the
 * brand mark, routed content area, contact footer and floating WhatsApp action.
 */
export function Layout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link
            to="/"
            data-ocid="nav.home_link"
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src="/assets/images/lgtech-logo.png"
              alt="L&G TECH — Servicio Técnico de Celulares"
              className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
            />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                L&amp;G TECH
              </span>
              <span className="truncate text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Servicio Técnico
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navegación principal"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                data-ocid={`nav.${link.to === "/" ? "home" : link.to.slice(1)}_link`}
                activeOptions={{ exact: link.to === "/" }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                activeProps={{ className: "text-foreground" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <a
            href={whatsAppLink(
              WORKSHOP.phone,
              "Hola L&G TECH, quiero consultar por una reparación.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="nav.whatsapp_link"
            className="hidden items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition-smooth hover:border-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Contactar
          </a>
        </div>
      </header>

      <main className="flex-1 bg-background">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/images/lgtech-logo.png"
                alt=""
                aria-hidden="true"
                className="h-10 w-10 rounded-lg border border-border object-cover"
              />
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                L&amp;G TECH
              </span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Taller especializado en diagnóstico, reparación y mantenimiento de
              celulares. Repuestos originales y garantía por escrito.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Contacto
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`tel:${WORKSHOP.phone.replace(/\s/g, "")}`}
                  data-ocid="footer.phone_link"
                  className="flex items-center gap-2 text-foreground transition-smooth hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
                  <span className="font-mono">{WORKSHOP.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${WORKSHOP.email}`}
                  data-ocid="footer.email_link"
                  className="flex items-center gap-2 text-foreground transition-smooth hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                  {WORKSHOP.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                {WORKSHOP.address}
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Horario
            </h2>
            <p className="text-sm text-muted-foreground">{WORKSHOP.hours}</p>
            <Link
              to="/admin"
              data-ocid="footer.admin_link"
              className="inline-block text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-smooth hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Acceso administrador
            </Link>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
            <span>
              © {new Date().getFullYear()} L&amp;G TECH. Todos los derechos
              reservados.
            </span>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-smooth hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Built with love using caffeine.ai
            </a>
          </div>
        </div>
      </footer>

      {!isAdmin && <WhatsAppButton />}
    </div>
  );
}
