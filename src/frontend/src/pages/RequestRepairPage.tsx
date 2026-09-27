import {
  type PhotoItem,
  PhotoUploader,
  uploadDamagePhoto,
} from "@/components/PhotoUploader";
import { Button } from "@/components/ui/button";
import { useSubmitRepairRequest } from "@/hooks/useRepairApi";
import { WORKSHOP, whatsAppLink } from "@/lib/repair";
import { Link, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ClipboardCheck,
  Copy,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";
import { useState } from "react";

type RequestSearch = {
  focus?: string;
};

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  brand: string;
  model: string;
  reportedIssue: string;
  additionalDescription: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  fullName: "",
  phone: "",
  email: "",
  brand: "",
  model: "",
  reportedIssue: "",
  additionalDescription: "",
};

/** Loose email check: only validates when the optional field is filled. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accepts 9–15 digits, optionally prefixed with + and separators. */
const PHONE_PATTERN = /^\+?[\d\s().-]{9,20}$/;

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.fullName.trim()) {
    errors.fullName = "Ingresa tu nombre completo.";
  }
  const phone = form.phone.trim();
  if (!phone) {
    errors.phone = "Ingresa tu número de teléfono.";
  } else if (
    !PHONE_PATTERN.test(phone) ||
    phone.replace(/\D/g, "").length < 9
  ) {
    errors.phone = "Ingresa un teléfono válido (mínimo 9 dígitos).";
  }
  if (!form.brand.trim()) {
    errors.brand = "Indica la marca del celular.";
  }
  if (!form.model.trim()) {
    errors.model = "Indica el modelo del celular.";
  }
  if (!form.reportedIssue.trim()) {
    errors.reportedIssue = "Describe el problema o daño del equipo.";
  }
  const email = form.email.trim();
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "Ingresa un correo electrónico válido.";
  }
  return errors;
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

/**
 * Customer repair intake. Collects the device details and damage photos,
 * uploads the photos through the object-storage extension, submits the request
 * to the backend and reveals the generated repair code on success.
 */
export function RequestRepairPage() {
  const search = useSearch({ from: "/layout/solicitar" }) as RequestSearch;
  const submit = useSubmitRepairRequest();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [repairCode, setRepairCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const setField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const uploading = photos.some(
    (photo) => photo.status === "uploading" || photo.status === "pending",
  );
  const failedPhotos = photos.filter((photo) => photo.status === "error");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (uploading) return;
    if (failedPhotos.length > 0) return;

    const damagePhotoFileIds = photos
      .map((photo) => photo.fileId)
      .filter((id): id is string => Boolean(id));

    submit.mutate(
      {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        brand: form.brand.trim(),
        model: form.model.trim(),
        reportedIssue: form.reportedIssue.trim(),
        additionalDescription: form.additionalDescription.trim(),
        damagePhotoFileIds,
      },
      {
        onSuccess: (code) => {
          setRepairCode(code);
          setForm(EMPTY_FORM);
          setPhotos([]);
          setErrors({});
        },
      },
    );
  };

  const handleCopy = async () => {
    if (!repairCode) return;
    try {
      await navigator.clipboard.writeText(repairCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleNewRequest = () => {
    setRepairCode(null);
    setCopied(false);
    setForm(EMPTY_FORM);
    setPhotos([]);
    setErrors({});
  };

  if (repairCode) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12 md:py-16">
        <div
          data-ocid="request.success_state"
          className="overflow-hidden rounded-2xl border border-success/40 bg-card shadow-elevated"
        >
          <div className="flex flex-col items-center gap-3 border-b border-border bg-success/10 px-6 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/20 text-success">
              <ClipboardCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Solicitud registrada
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">
              Guarda este código. Lo necesitarás para consultar el estado de tu
              reparación en cualquier momento.
            </p>
          </div>

          <div className="space-y-6 px-6 py-8">
            <div className="rounded-xl border border-accent/40 bg-background px-4 py-6 text-center shadow-glow">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Código de reparación
              </span>
              <p
                data-ocid="request.code"
                className="mt-2 break-all font-mono text-3xl font-bold tracking-[0.15em] text-accent md:text-4xl"
              >
                {repairCode}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                data-ocid="request.copy_button"
                onClick={() => void handleCopy()}
                className="h-11 flex-1 rounded-lg gradient-primary text-sm font-semibold text-primary-foreground shadow-elevated transition-smooth hover:-translate-y-0.5 hover:shadow-glow"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? "Código copiado" : "Copiar código"}
              </Button>
              <Link
                to="/consultar"
                search={{
                  code: repairCode,
                  phone: undefined,
                  focus: undefined,
                }}
                data-ocid="request.lookup_link"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-6 text-sm font-semibold text-secondary-foreground transition-smooth hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Consultar estado
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">
                Recibirás novedades del taller en {WORKSHOP.name}. Si necesitas
                ayuda inmediata, escríbenos por WhatsApp al {WORKSHOP.phone}.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsAppLink(WORKSHOP.phone)}
                target="_blank"
                rel="noreferrer"
                data-ocid="request.whatsapp_link"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-success px-6 text-sm font-semibold text-success-foreground transition-smooth hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Escribir por WhatsApp
              </a>
              <Button
                type="button"
                variant="outline"
                data-ocid="request.new_button"
                onClick={handleNewRequest}
                className="h-11 flex-1 rounded-lg border-border text-sm font-semibold"
              >
                Nueva solicitud
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <header className="mb-8 space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
          Nueva reparación
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Solicitar <span className="text-gradient">reparación</span>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Cuéntanos qué le pasa a tu celular y adjunta fotos del daño. Al enviar
          recibirás un código único para seguir el estado del trabajo.
        </p>
      </header>

      <form
        data-ocid="request.form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        <section className="rounded-2xl border border-border bg-card p-5 shadow-elevated md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Smartphone className="h-4 w-4 text-accent" aria-hidden="true" />
            Datos de contacto
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className={labelClass}>
                Nombre completo
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                data-ocid="request.fullName.input"
                value={form.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                placeholder="Ej. María González"
                aria-invalid={Boolean(errors.fullName)}
                className={inputClass}
              />
              {errors.fullName && (
                <p
                  data-ocid="request.fullName.error"
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="phone" className={labelClass}>
                Número de teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                data-ocid="request.phone.input"
                value={form.phone}
                onChange={(event) => setField("phone", event.target.value)}
                placeholder="Ej. +34 600 123 456"
                aria-invalid={Boolean(errors.phone)}
                className={inputClass}
              />
              {errors.phone && (
                <p
                  data-ocid="request.phone.error"
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="email" className={labelClass}>
                Correo electrónico{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                data-ocid="request.email.input"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="Ej. cliente@correo.com"
                aria-invalid={Boolean(errors.email)}
                className={inputClass}
              />
              {errors.email ? (
                <p
                  data-ocid="request.email.error"
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {errors.email}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Te avisaremos por correo cuando cambie el estado de tu
                  reparación.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-elevated md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Smartphone className="h-4 w-4 text-accent" aria-hidden="true" />
            Datos del celular
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="brand" className={labelClass}>
                Marca
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                data-ocid="request.brand.input"
                value={form.brand}
                onChange={(event) => setField("brand", event.target.value)}
                placeholder="Ej. Samsung"
                aria-invalid={Boolean(errors.brand)}
                className={inputClass}
              />
              {errors.brand && (
                <p
                  data-ocid="request.brand.error"
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {errors.brand}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="model" className={labelClass}>
                Modelo
              </label>
              <input
                id="model"
                name="model"
                type="text"
                data-ocid="request.model.input"
                value={form.model}
                onChange={(event) => setField("model", event.target.value)}
                placeholder="Ej. Galaxy S23"
                aria-invalid={Boolean(errors.model)}
                className={inputClass}
              />
              {errors.model && (
                <p
                  data-ocid="request.model.error"
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {errors.model}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="reportedIssue" className={labelClass}>
                Problema o daño
              </label>
              <textarea
                id="reportedIssue"
                name="reportedIssue"
                rows={3}
                data-ocid="request.reportedIssue.textarea"
                value={form.reportedIssue}
                onChange={(event) =>
                  setField("reportedIssue", event.target.value)
                }
                placeholder="Ej. La pantalla está rota y no responde al tacto."
                aria-invalid={Boolean(errors.reportedIssue)}
                className={`${inputClass} resize-y`}
              />
              {errors.reportedIssue && (
                <p
                  data-ocid="request.reportedIssue.error"
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {errors.reportedIssue}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-elevated md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Wrench className="h-4 w-4 text-accent" aria-hidden="true" />
            Fotos y detalles
          </h2>

          <PhotoUploader
            photos={photos}
            onPhotosChange={setPhotos}
            uploadFile={uploadDamagePhoto}
            disabled={submit.isPending}
          />

          <div className="mt-5">
            <label htmlFor="additionalDescription" className={labelClass}>
              Descripción adicional{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <textarea
              id="additionalDescription"
              name="additionalDescription"
              rows={3}
              data-ocid="request.additionalDescription.textarea"
              value={form.additionalDescription}
              onChange={(event) =>
                setField("additionalDescription", event.target.value)
              }
              placeholder="Ej. Se mojó hace dos días y dejó de cargar."
              className={`${inputClass} resize-y`}
            />
          </div>
        </section>

        {failedPhotos.length > 0 && (
          <p
            data-ocid="request.photos.error"
            className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Hay {failedPhotos.length} foto(s) que no se pudieron subir.
            Reinténtalas o quítalas antes de enviar.
          </p>
        )}

        {submit.isError && (
          <p
            data-ocid="request.error_state"
            className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {submit.error instanceof Error
              ? submit.error.message
              : "No se pudo enviar la solicitud. Inténtalo de nuevo."}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="order-2 text-xs text-muted-foreground sm:order-1">
            {search.focus === "photos"
              ? "Adjunta fotos del daño para un diagnóstico más rápido."
              : "Revisaremos tu equipo y te contactaremos por teléfono."}
          </p>
          <Button
            type="submit"
            data-ocid="request.submit_button"
            disabled={submit.isPending || uploading}
            className="order-1 h-12 w-full rounded-lg gradient-primary text-sm font-semibold text-primary-foreground shadow-elevated transition-smooth hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:order-2 sm:w-auto sm:px-8"
          >
            {submit.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Wrench className="h-4 w-4" aria-hidden="true" />
            )}
            {submit.isPending
              ? "Enviando solicitud…"
              : uploading
                ? "Subiendo fotos…"
                : "Enviar solicitud"}
          </Button>
        </div>
      </form>
    </div>
  );
}
