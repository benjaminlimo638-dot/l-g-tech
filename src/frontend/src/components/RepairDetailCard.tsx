import type { PublicRepairView } from "@/backend";
import { RepairProgress } from "@/components/RepairProgress";
import {
  STAGE_LABELS,
  formatDate,
  formatMoney,
  hasValidTimestamp,
  stageBadgeClass,
} from "@/lib/repair";
import { resolveFileUrl } from "@/lib/storage";
import {
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  ImageOff,
  Info,
  Smartphone,
  Stethoscope,
  User,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

type RepairDetailCardProps = {
  repair: PublicRepairView;
};

/**
 * Resolve a list of storage hashes into displayable direct URLs. The backend
 * stores plain `FileId` hashes, so each one must go through the storage client
 * (same path the admin detail uses) before it can be rendered.
 */
function useResolvedPhotoUrls(fileIds: string[]): (string | null)[] {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const key = fileIds.join("|");

  useEffect(() => {
    let cancelled = false;
    const ids = key ? key.split("|") : [];
    if (ids.length === 0) {
      setUrls([]);
      return;
    }
    void Promise.all(
      ids.map(async (id) => {
        try {
          return await resolveFileUrl(id);
        } catch {
          return null;
        }
      }),
    ).then((resolved) => {
      if (!cancelled) setUrls(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return urls;
}

/** Grid of resolved device/damage photos with a graceful empty state. */
function PhotoGrid({
  fileIds,
  altPrefix,
  ocidPrefix,
  emptyMessage,
}: {
  fileIds: string[];
  altPrefix: string;
  ocidPrefix: string;
  emptyMessage: string;
}) {
  const urls = useResolvedPhotoUrls(fileIds);

  if (fileIds.length === 0) {
    return (
      <div
        data-ocid={`${ocidPrefix}.empty_state`}
        className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground"
      >
        <ImageOff
          className="h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {fileIds.map((fileId, index) => {
        const url = urls[index];
        return (
          <li
            key={fileId}
            data-ocid={`${ocidPrefix}.${index + 1}`}
            className="overflow-hidden rounded-lg border border-border bg-secondary/40"
          >
            {url ? (
              <img
                src={url}
                alt={`${altPrefix} ${index + 1}`}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-muted-foreground">
                <ImageOff className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type DetailItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
};

/** Public repair record. Never renders the DNI photo or admin-only fields. */
export function RepairDetailCard({ repair }: RepairDetailCardProps) {
  const damagePhotoFileIds = repair.damagePhotoFileIds;

  const details: DetailItem[] = [
    {
      icon: User,
      label: "Cliente",
      value: repair.fullName,
    },
    {
      icon: Smartphone,
      label: "Marca y modelo",
      value: `${repair.brand} ${repair.model}`.trim(),
    },
    {
      icon: CalendarDays,
      label: "Fecha de ingreso",
      value: formatDate(repair.intakeDate),
    },
    {
      icon: CalendarClock,
      label: "Fecha estimada de entrega",
      value: hasValidTimestamp(repair.estimatedDeliveryDate)
        ? formatDate(repair.estimatedDeliveryDate)
        : "Por confirmar",
    },
    {
      icon: ClipboardList,
      label: "Tiempo estimado",
      value: repair.estimatedTime || "Por confirmar",
    },
  ];

  return (
    <article
      data-ocid="repair.detail_card"
      className="overflow-hidden rounded-xl border border-border bg-card shadow-elevated"
    >
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border bg-gradient-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Código de reparación
          </p>
          <p
            data-ocid="repair.code"
            className="font-mono text-2xl font-bold tracking-tight text-foreground"
          >
            {repair.code}
          </p>
        </div>
        <span
          data-ocid="repair.status_badge"
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${stageBadgeClass(repair.status)}`}
        >
          <span
            className="h-2 w-2 rounded-full bg-current"
            aria-hidden="true"
          />
          {STAGE_LABELS[repair.status]}
        </span>
      </header>

      {/* Progress trace */}
      <section className="border-b border-border p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Estado del proceso
        </h2>
        <RepairProgress status={repair.status} />
      </section>

      {/* Device + issue */}
      <section className="grid gap-5 border-b border-border p-5 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClipboardList className="h-4 w-4 text-accent" aria-hidden="true" />
            Problema reportado
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {repair.reportedIssue || "Sin descripción registrada."}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Stethoscope className="h-4 w-4 text-accent" aria-hidden="true" />
            Diagnóstico técnico
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {repair.diagnosis || "Diagnóstico pendiente de emisión."}
          </p>
        </div>
      </section>

      {/* Key data */}
      <section className="border-b border-border p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Datos del equipo
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="break-words text-sm font-medium text-foreground">
                    {item.value}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>
      </section>

      {/* Pricing */}
      <section className="border-b border-border p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Presupuesto
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CircleDollarSign
                className="h-4 w-4 text-accent"
                aria-hidden="true"
              />
              Precio total
            </p>
            <p
              data-ocid="repair.total_price"
              className="mt-1 font-mono text-xl font-bold text-foreground"
            >
              {formatMoney(repair.totalPrice)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-4 w-4 text-accent" aria-hidden="true" />
              Adelanto pagado
            </p>
            <p
              data-ocid="repair.deposit"
              className="mt-1 font-mono text-xl font-bold text-foreground"
            >
              {formatMoney(repair.deposit)}
            </p>
          </div>
          <div className="rounded-lg border border-accent/40 bg-accent/10 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
              Saldo pendiente
            </p>
            <p
              data-ocid="repair.balance"
              className="mt-1 font-mono text-xl font-bold text-accent"
            >
              {formatMoney(repair.balance)}
            </p>
          </div>
        </div>
      </section>

      {/* Device photos */}
      <section className="border-b border-border p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Fotos del equipo
        </h2>
        <PhotoGrid
          fileIds={repair.devicePhotoFileIds}
          altPrefix={`Foto del equipo de la reparación ${repair.code}`}
          ocidPrefix="repair.photo"
          emptyMessage="Aún no hay fotos del equipo registradas para esta reparación."
        />
      </section>

      {/* Customer-uploaded damage photos (present only when the backend exposes them) */}
      {damagePhotoFileIds.length > 0 && (
        <section className="border-b border-border p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Fotos del daño reportado
          </h2>
          <PhotoGrid
            fileIds={damagePhotoFileIds}
            altPrefix={`Foto del daño reportado de la reparación ${repair.code}`}
            ocidPrefix="repair.damage_photo"
            emptyMessage="Aún no hay fotos del daño registradas para esta reparación."
          />
        </section>
      )}

      {/* Observations */}
      <section className="p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <Info className="h-4 w-4 text-accent" aria-hidden="true" />
          Observaciones
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {repair.observations || "Sin observaciones adicionales."}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Registrado el {formatDate(repair.intakeDate)}
        </p>
      </section>
    </article>
  );
}
