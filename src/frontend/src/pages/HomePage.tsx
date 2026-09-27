import { WORKSHOP, whatsAppLink } from "@/lib/repair";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Camera,
  ClipboardList,
  MessageCircle,
  Search,
  ShieldCheck,
  Stethoscope,
  Tag,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ActionCard = {
  to: "/solicitar" | "/consultar";
  search?: Record<string, string>;
  title: string;
  description: string;
  icon: LucideIcon;
  ocid: string;
};

const ACTION_CARDS: ActionCard[] = [
  {
    to: "/solicitar",
    title: "Solicitar reparación",
    description:
      "Registra tu equipo y cuéntanos qué falla. Te damos un código de seguimiento.",
    icon: ClipboardList,
    ocid: "home.action.solicitar",
  },
  {
    to: "/consultar",
    title: "Consultar reparación",
    description:
      "Ingresa tu código o teléfono y mira en qué etapa está tu equipo.",
    icon: Search,
    ocid: "home.action.consultar",
  },
  {
    to: "/solicitar",
    search: { focus: "photos" },
    title: "Enviar fotos",
    description:
      "Adjunta fotos del daño dentro de tu solicitud para un diagnóstico más rápido.",
    icon: Camera,
    ocid: "home.action.fotos",
  },
  {
    to: "/consultar",
    search: { focus: "price" },
    title: "Consultar precio",
    description:
      "Revisa el presupuesto y el saldo de tu reparación desde el seguimiento.",
    icon: Tag,
    ocid: "home.action.precio",
  },
];

const SERVICES = [
  {
    icon: Stethoscope,
    title: "Diagnóstico técnico",
    description:
      "Revisión completa de hardware y software. Te explicamos la falla real antes de tocar el equipo.",
  },
  {
    icon: Wrench,
    title: "Reparación especializada",
    description:
      "Cambio de pantalla, batería, puerto de carga y placa. Repuestos de calidad y pruebas de funcionamiento.",
  },
  {
    icon: ShieldCheck,
    title: "Garantía por escrito",
    description:
      "Cada reparación incluye garantía sobre el trabajo realizado y el repuesto instalado.",
  },
];

const BENEFITS = [
  { icon: BadgeCheck, label: "Técnicos certificados" },
  { icon: ShieldCheck, label: "Garantía en cada reparación" },
  { icon: MessageCircle, label: "Seguimiento por WhatsApp" },
];

export function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-grid">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-14 text-center md:py-20">
          <div className="relative animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-elevated">
              <img
                src="/assets/images/lgtech-logo.png"
                alt="Logotipo de L&G TECH, servicio técnico de celulares"
                className="h-40 w-40 rounded-xl object-cover md:h-52 md:w-52"
              />
              <span
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-scan-line bg-gradient-to-r from-transparent via-accent/25 to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="max-w-2xl space-y-4 animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-ring"
                aria-hidden="true"
              />
              Taller de reparación
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Servicio Técnico de{" "}
              <span className="text-gradient">Celulares</span>
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Diagnóstico, reparación y garantía para tu celular. Sigue cada
              etapa de tu equipo en tiempo real, desde que lo recibimos hasta
              que lo entregamos.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/solicitar"
              data-ocid="home.primary_button"
              className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition-smooth hover:-translate-y-0.5 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Solicitar reparación
            </Link>
            <Link
              to="/consultar"
              search={{}}
              data-ocid="home.secondary_button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground transition-smooth hover:-translate-y-0.5 hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Consultar reparación
            </Link>
          </div>
        </div>
      </section>

      {/* Action cards */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            ¿Qué necesitas hacer?
          </h2>
          <p className="text-sm text-muted-foreground">
            Elige una opción para empezar. Todo el proceso se gestiona desde
            aquí.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACTION_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.ocid}
                to={card.to}
                search={(card.search ?? {}) as never}
                data-ocid={card.ocid}
                style={{ animationDelay: `${index * 60}ms` }}
                className="group flex animate-fade-up items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated transition-smooth hover:-translate-y-0.5 hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition-smooth group-hover:bg-accent/15 group-hover:text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block font-display text-base font-semibold text-foreground">
                    {card.title}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {card.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Services */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Nuestro servicio
            </h2>
            <p className="text-sm text-muted-foreground">
              Un proceso claro y trazable en cada reparación.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {SERVICES.map((service, index) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="animate-fade-up rounded-xl border border-border bg-card p-5 shadow-elevated"
                >
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </article>
              );
            })}
          </div>

          <ul className="mt-6 flex flex-wrap gap-3">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li
                  key={benefit.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                  {benefit.label}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-border bg-card p-6 shadow-elevated md:flex-row md:items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              ¿Dudas antes de reparar?
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Escríbenos por WhatsApp y un técnico te responde. También puedes
              visitarnos en el taller: {WORKSHOP.address}.
            </p>
          </div>
          <a
            href={whatsAppLink(
              WORKSHOP.phone,
              "Hola L&G TECH, tengo una consulta sobre mi celular.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="home.whatsapp_button"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-success px-6 py-3 text-sm font-semibold text-success-foreground shadow-elevated transition-smooth hover:-translate-y-0.5 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Contactar por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
