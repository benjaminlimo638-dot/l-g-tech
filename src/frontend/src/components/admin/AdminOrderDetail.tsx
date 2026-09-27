import type { AdminRepairView, RepairStatus } from "@/backend";
import { RepairProgress } from "@/components/RepairProgress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useChangeRepairStatus, useDniPhoto } from "@/hooks/useRepairApi";
import {
  REPAIR_STAGES,
  STAGE_LABELS,
  formatDate,
  formatDateTime,
  formatMoney,
  hasValidTimestamp,
  stageBadgeClass,
} from "@/lib/repair";
import { resolveFileUrl } from "@/lib/storage";
import {
  AlertCircle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ImageOff,
  Loader2,
  Mail,
  Pencil,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
type AdminOrderDetailProps = {
  order: AdminRepairView;
  onBack: () => void;
  onEdit: (order: AdminRepairView) => void;
};

/** A labelled read-only field in the detail grid. */
function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`break-words text-sm text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

/** Renders a stored photo by resolving its object-storage file id. */
function StoredPhoto({ fileId, alt }: { fileId: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    resolveFileUrl(fileId)
      .then((resolved) => {
        if (active) setUrl(resolved);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [fileId]);

  if (failed) {
    return (
      <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted text-muted-foreground">
        <ImageOff className="h-5 w-5" aria-hidden="true" />
        <span className="text-[0.6rem]">No disponible</span>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-border bg-muted">
        <Loader2
          className="h-5 w-5 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-24 w-24 rounded-lg border border-border object-cover"
    />
  );
}

/**
 * Full administrative view of a repair order: intake data, private DNI photo,
 * device photos, pricing, and the status changer with an optional client email
 * notification.
 */
export function AdminOrderDetail({
  order,
  onBack,
  onEdit,
}: AdminOrderDetailProps) {
  const [nextStatus, setNextStatus] = useState<RepairStatus>(order.status);
  const [notify, setNotify] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dniPhoto = useDniPhoto(order.id);
  const changeStatus = useChangeRepairStatus();

  const handleStatusChange = () => {
    setFeedback(null);
    setError(null);
    changeStatus.mutate(
      { id: order.id, status: nextStatus, notify },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            setFeedback(
              result.ok.notificationSent
                ? `Estado actualizado a “${STAGE_LABELS[nextStatus]}” y correo enviado al cliente.`
                : `Estado actualizado a “${STAGE_LABELS[nextStatus]}”.`,
            );
          } else {
            setError(
              "No se encontró la orden. Actualiza la lista e inténtalo de nuevo.",
            );
          }
        },
        onError: () =>
          setError("No se pudo cambiar el estado. Inténtalo de nuevo."),
      },
    );
  };

  return (
    <section
      data-ocid="admin.order.detail"
      className="flex flex-col gap-5"
      aria-label={`Detalle de la orden ${order.code}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            data-ocid="admin.order.back_button"
            onClick={onBack}
            aria-label="Volver a la lista de órdenes"
            className="rounded-lg border-border"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-lg font-bold text-accent">
                {order.code}
              </h2>
              <Badge
                variant="outline"
                className={`border-transparent px-2 py-0 text-[0.65rem] font-semibold uppercase tracking-wide ${stageBadgeClass(order.status)}`}
              >
                {STAGE_LABELS[order.status]}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {order.client.fullName} · {order.device.brand}{" "}
              {order.device.model}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          data-ocid="admin.order.edit_button"
          onClick={() => onEdit(order)}
          className="rounded-lg border-border font-semibold"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar orden
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
        <RepairProgress status={order.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
              Propietario
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField
                label="Nombre completo"
                value={order.client.fullName}
              />
              <DetailField label="DNI" value={order.client.dni} mono />
              <DetailField label="Teléfono" value={order.client.phone} mono />
              <DetailField
                label="Cliente desde"
                value={formatDate(order.client.createdAt)}
              />
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
              Equipo
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Marca" value={order.device.brand} />
              <DetailField label="Modelo" value={order.device.model} />
              <DetailField label="IMEI" value={order.device.imei ?? ""} mono />
              <DetailField
                label="Estado físico"
                value={order.device.physicalCondition}
              />
              <div className="sm:col-span-2">
                <DetailField
                  label="Daño reportado"
                  value={order.reportedIssue}
                />
              </div>
              <div className="sm:col-span-2">
                <DetailField
                  label="Descripción adicional"
                  value={order.additionalDescription}
                />
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
              Diagnóstico y seguimiento
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <DetailField label="Diagnóstico" value={order.diagnosis} />
              </div>
              <DetailField
                label="Tiempo estimado"
                value={order.estimatedTime}
              />
              <DetailField
                label="Entrega estimada"
                value={
                  hasValidTimestamp(order.estimatedDeliveryDate)
                    ? formatDate(order.estimatedDeliveryDate)
                    : ""
                }
              />
              <div className="sm:col-span-2">
                <DetailField label="Observaciones" value={order.observations} />
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
              Fotos del equipo al recibirlo
            </h3>
            {order.devicePhotoFileIds.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {order.devicePhotoFileIds.map((fileId, index) => (
                  <StoredPhoto
                    key={fileId}
                    fileId={fileId}
                    alt={`Foto del equipo ${index + 1} de la orden ${order.code}`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No se adjuntaron fotos del equipo.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
              Importes
            </h3>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Precio total</dt>
                <dd className="font-mono text-sm font-semibold text-foreground">
                  {formatMoney(order.totalPrice)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Adelanto</dt>
                <dd className="font-mono text-sm font-semibold text-foreground">
                  {formatMoney(order.deposit)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="text-sm font-semibold text-foreground">
                  Saldo pendiente
                </dt>
                <dd
                  data-ocid="admin.order.detail.balance"
                  className="font-mono text-base font-bold text-accent"
                >
                  {formatMoney(order.balance)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 shadow-subtle">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert
                className="h-4 w-4 text-warning"
                aria-hidden="true"
              />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-warning">
                Foto del DNI · Privada
              </h3>
            </div>
            {dniPhoto.isLoading ? (
              <div
                data-ocid="admin.order.dni.loading_state"
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Cargando documento…
              </div>
            ) : dniPhoto.data ? (
              <StoredPhoto
                fileId={dniPhoto.data}
                alt={`DNI de ${order.client.fullName}`}
              />
            ) : (
              <p
                data-ocid="admin.order.dni.empty_state"
                className="text-sm text-muted-foreground"
              >
                No se adjuntó foto del DNI para esta orden.
              </p>
            )}
            <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
              Documento visible únicamente en el panel administrativo
              autorizado.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
              Cambiar estado
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label
                  htmlFor="status-select"
                  className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Nueva etapa
                </Label>
                <select
                  id="status-select"
                  data-ocid="admin.order.status_select"
                  value={nextStatus}
                  onChange={(event) =>
                    setNextStatus(event.target.value as RepairStatus)
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {REPAIR_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {STAGE_LABELS[stage]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Mail
                    className="h-4 w-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <Label
                    htmlFor="notify-switch"
                    className="text-xs font-medium leading-tight text-foreground"
                  >
                    Notificar al cliente por correo
                  </Label>
                </div>
                <Switch
                  id="notify-switch"
                  data-ocid="admin.order.notify_switch"
                  checked={notify}
                  onCheckedChange={setNotify}
                />
              </div>

              <Button
                type="button"
                data-ocid="admin.order.status_submit_button"
                onClick={handleStatusChange}
                disabled={changeStatus.isPending || nextStatus === order.status}
                className="w-full rounded-lg gradient-primary font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
              >
                {changeStatus.isPending ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Actualizando…
                  </>
                ) : (
                  <>
                    <BellRing className="h-4 w-4" aria-hidden="true" />
                    Actualizar estado
                  </>
                )}
              </Button>

              {feedback && (
                <p
                  data-ocid="admin.order.status.success_state"
                  className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-xs text-success"
                >
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {feedback}
                </p>
              )}

              {error && (
                <p
                  data-ocid="admin.order.status.error_state"
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  <AlertCircle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-subtle">
            <div className="flex items-center justify-between">
              <span>Ingreso</span>
              <span className="font-mono">
                {formatDateTime(order.intakeDate)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Última actualización</span>
              <span className="font-mono">
                {formatDateTime(order.updatedAt)}
              </span>
            </div>
            {order.deliveredAt !== undefined && (
              <div className="mt-2 flex items-center justify-between">
                <span>Entregado</span>
                <span className="font-mono">
                  {formatDateTime(order.deliveredAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
