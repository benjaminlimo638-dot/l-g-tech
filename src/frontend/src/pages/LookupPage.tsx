import { RepairDetailCard } from "@/components/RepairDetailCard";
import { useLookupRepair } from "@/hooks/useRepairApi";
import { WORKSHOP, whatsAppLink } from "@/lib/repair";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  SearchX,
  Ticket,
} from "lucide-react";
import { useState } from "react";

type LookupSearch = {
  code?: string;
  phone?: string;
  focus?: string;
};

/**
 * Public customer lookup. A visitor enters a repair code and/or phone number
 * and sees only the single matching order's public record — never the DNI
 * photo or any admin-only field.
 */
export function LookupPage() {
  const search = useSearch({ from: "/layout/consultar" }) as LookupSearch;
  const navigate = useNavigate();

  const [code, setCode] = useState(search.code ?? "");
  const [phone, setPhone] = useState(search.phone ?? "");
  const [submitted, setSubmitted] = useState<{
    code: string;
    phone: string;
  } | null>(
    search.code || search.phone
      ? { code: search.code ?? "", phone: search.phone ?? "" }
      : null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const lookup = useLookupRepair(
    submitted?.code.trim() ? submitted.code.trim() : null,
    submitted?.phone.trim() ? submitted.phone.trim() : null,
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedCode && !trimmedPhone) {
      setValidationError(
        "Ingresa tu código de reparación o tu número de teléfono para continuar.",
      );
      return;
    }

    setValidationError(null);
    setSubmitted({ code: trimmedCode, phone: trimmedPhone });
    void navigate({
      to: "/consultar",
      search: {
        code: trimmedCode || undefined,
        phone: trimmedPhone || undefined,
        focus: undefined,
      },
      replace: true,
    });
  };

  const handleReset = () => {
    setCode("");
    setPhone("");
    setSubmitted(null);
    setValidationError(null);
    void navigate({
      to: "/consultar",
      search: { code: undefined, phone: undefined, focus: undefined },
      replace: true,
    });
  };

  const result = lookup.data;
  const isFound = result?.__kind__ === "found";
  const isNotFound = result?.__kind__ === "notFound";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 md:py-14">
      {/* Heading */}
      <header className="mb-8 space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          Seguimiento
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Consultar <span className="text-gradient">reparación</span>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Ingresa el código que te entregamos al recibir tu equipo o el número
          de teléfono con el que registraste la solicitud. Verás el estado, el
          presupuesto y las fotos de tu reparación.
        </p>
      </header>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        data-ocid="lookup.form"
        className="rounded-xl border border-border bg-card p-5 shadow-elevated"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="lookup-code"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <Ticket className="h-4 w-4 text-accent" aria-hidden="true" />
              Código de reparación
            </label>
            <input
              id="lookup-code"
              name="code"
              type="text"
              autoComplete="off"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Ej. LG-2026-0042"
              data-ocid="lookup.code_input"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lookup-phone"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
              Número de teléfono
            </label>
            <input
              id="lookup-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ej. +34 600 123 456"
              data-ocid="lookup.phone_input"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Puedes usar uno de los dos campos o ambos para afinar la búsqueda.
        </p>

        {validationError && (
          <p
            role="alert"
            data-ocid="lookup.error_state"
            className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {validationError}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            data-ocid="lookup.submit_button"
            disabled={lookup.isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition-smooth hover:-translate-y-0.5 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {lookup.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            {lookup.isFetching ? "Buscando…" : "Buscar reparación"}
          </button>
          {submitted && (
            <button
              type="button"
              onClick={handleReset}
              data-ocid="lookup.cancel_button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground transition-smooth hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      {/* Results */}
      <div className="mt-8">
        {lookup.isFetching && (
          <div
            data-ocid="lookup.loading_state"
            className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-sm text-muted-foreground"
          >
            <Loader2
              className="h-5 w-5 animate-spin text-accent"
              aria-hidden="true"
            />
            Consultando tu reparación…
          </div>
        )}

        {!lookup.isFetching && lookup.isError && (
          <div
            data-ocid="lookup.error_state"
            className="flex flex-col items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-6"
          >
            <span className="flex items-center gap-2 font-semibold text-destructive">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
              No pudimos completar la consulta
            </span>
            <p className="text-sm text-muted-foreground">
              Revisa tu conexión e inténtalo de nuevo. Si el problema continúa,
              escríbenos por WhatsApp.
            </p>
            <a
              href={whatsAppLink(
                WORKSHOP.phone,
                "Hola L&G TECH, no puedo consultar el estado de mi reparación.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="lookup.whatsapp_button"
              className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground transition-smooth hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Contactar por WhatsApp
            </a>
          </div>
        )}

        {!lookup.isFetching && isNotFound && (
          <div
            data-ocid="lookup.empty_state"
            className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card p-10 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-semibold text-foreground">
              No encontramos esa reparación
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Verifica que el código o el teléfono coincidan exactamente con los
              datos de tu solicitud. Si acabas de registrar tu equipo, espera
              unos minutos e inténtalo otra vez.
            </p>
            <a
              href={whatsAppLink(
                WORKSHOP.phone,
                "Hola L&G TECH, no encuentro mi reparación en el seguimiento.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="lookup.whatsapp_button"
              className="mt-1 inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-smooth hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Escribir al taller
            </a>
          </div>
        )}

        {!lookup.isFetching && isFound && result.__kind__ === "found" && (
          <RepairDetailCard repair={result.found} />
        )}

        {!submitted && !lookup.isFetching && (
          <div
            data-ocid="lookup.initial_state"
            className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground"
          >
            <p className="font-semibold text-foreground">
              ¿Cómo encuentro mi código?
            </p>
            <p className="mt-1">
              Te lo enviamos por correo y aparece en el comprobante que
              recibiste al dejar tu equipo en el taller. También puedes buscar
              solo con tu número de teléfono.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
