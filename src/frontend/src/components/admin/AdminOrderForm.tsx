import type { AdminRepairView, FileId, IntakeInput } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateRepairOrder,
  useUpdateRepairOrder,
} from "@/hooks/useRepairApi";
import { formatMoney } from "@/lib/repair";
import { uploadFile } from "@/lib/storage";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

type AdminOrderFormProps = {
  /** When present, the form edits this order instead of creating a new one. */
  order?: AdminRepairView;
  /** Called after a successful create or update. */
  onSaved: (order: AdminRepairView) => void;
  /** Called when the user cancels the form. */
  onCancel: () => void;
};

type PhotoUpload = {
  fileId: FileId;
  name: string;
  url: string;
};

/** Parse a currency-ish text field into a non-negative integer amount. */
function parseAmount(value: string): bigint {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length === 0) return 0n;
  return BigInt(digits);
}

/** Convert a backend nanosecond timestamp into a `yyyy-mm-dd` input value. */
function toDateInput(timestamp?: bigint): string {
  if (timestamp === undefined) return "";
  const date = new Date(Number(timestamp / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Convert a `yyyy-mm-dd` input value into a backend nanosecond timestamp. */
function fromDateInput(value: string): bigint | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return BigInt(date.getTime()) * 1_000_000n;
}

/**
 * Photo picker that uploads each selected image to object storage and keeps the
 * resulting file ids. Used for the private DNI photo and the device photos.
 */
function PhotoField({
  label,
  hint,
  photos,
  onAdd,
  onRemove,
  ocid,
  privateBadge,
}: {
  label: string;
  hint: string;
  photos: PhotoUpload[];
  onAdd: (photo: PhotoUpload) => void;
  onRemove: (fileId: FileId) => void;
  ocid: string;
  privateBadge?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileId = await uploadFile(file);
        onAdd({ fileId, name: file.name, url: URL.createObjectURL(file) });
      }
    } catch {
      setError("No se pudo subir la imagen. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </Label>
        {privateBadge && (
          <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-warning">
            Privado
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>

      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <div
            key={photo.fileId}
            className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img
              src={photo.url}
              alt={photo.name}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              data-ocid={`${ocid}.remove_button`}
              onClick={() => onRemove(photo.fileId)}
              aria-label={`Quitar ${photo.name}`}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-background/80 text-destructive opacity-0 transition-smooth hover:bg-background focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}

        <button
          type="button"
          data-ocid={ocid}
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card text-muted-foreground transition-smooth hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="text-[0.6rem] font-semibold uppercase tracking-wide">
            {isUploading ? "Subiendo" : "Añadir"}
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {error && (
        <p
          data-ocid={`${ocid}.error_state`}
          className="flex items-center gap-1.5 text-xs text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Admin intake and edit form. Creates a new repair order with the full
 * reception data, or edits an existing order's diagnosis, pricing, estimate and
 * observations. The pending balance is always computed live as price − deposit.
 */
export function AdminOrderForm({
  order,
  onSaved,
  onCancel,
}: AdminOrderFormProps) {
  const isEditing = order !== undefined;
  const createOrder = useCreateRepairOrder();
  const updateOrder = useUpdateRepairOrder();

  // Intake fields (create only)
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [imei, setImei] = useState("");
  const [reportedIssue, setReportedIssue] = useState("");
  const [physicalCondition, setPhysicalCondition] = useState("");
  const [dniPhotos, setDniPhotos] = useState<PhotoUpload[]>([]);
  const [devicePhotos, setDevicePhotos] = useState<PhotoUpload[]>([]);

  // Shared pricing fields
  const [totalPrice, setTotalPrice] = useState(
    isEditing ? order.totalPrice.toString() : "",
  );
  const [deposit, setDeposit] = useState(
    isEditing ? order.deposit.toString() : "",
  );

  // Edit-only fields
  const [diagnosis, setDiagnosis] = useState(isEditing ? order.diagnosis : "");
  const [estimatedTime, setEstimatedTime] = useState(
    isEditing ? order.estimatedTime : "",
  );
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    isEditing ? toDateInput(order.estimatedDeliveryDate) : "",
  );
  const [observations, setObservations] = useState(
    isEditing ? order.observations : "",
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const priceValue = parseAmount(totalPrice);
  const depositValue = parseAmount(deposit);
  const balance = priceValue > depositValue ? priceValue - depositValue : 0n;
  const isPending = createOrder.isPending || updateOrder.isPending;

  const canSubmit = isEditing
    ? true
    : fullName.trim().length > 0 &&
      dni.trim().length > 0 &&
      phone.trim().length > 0 &&
      brand.trim().length > 0 &&
      model.trim().length > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (isEditing) {
      // The backend treats an absent `estimatedDeliveryDate` as "leave
      // unchanged" and has no clear signal, so the field is set-only: only
      // include it when the input holds a real date. Never send 0n, which the
      // backend would store as a bogus epoch date.
      const parsedDeliveryDate = fromDateInput(estimatedDeliveryDate);
      updateOrder.mutate(
        {
          id: order.id,
          update: {
            diagnosis: diagnosis.trim(),
            totalPrice: priceValue,
            deposit: depositValue,
            estimatedTime: estimatedTime.trim(),
            ...(parsedDeliveryDate !== undefined
              ? { estimatedDeliveryDate: parsedDeliveryDate }
              : {}),
            observations: observations.trim(),
          },
        },
        {
          onSuccess: (updated) => {
            setSuccess("Orden actualizada correctamente.");
            onSaved(updated);
          },
          onError: () =>
            setError("No se pudo guardar la orden. Inténtalo de nuevo."),
        },
      );
      return;
    }

    const input: IntakeInput = {
      fullName: fullName.trim(),
      dni: dni.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      brand: brand.trim(),
      model: model.trim(),
      imei: imei.trim() || undefined,
      reportedIssue: reportedIssue.trim(),
      physicalCondition: physicalCondition.trim(),
      totalPrice: priceValue,
      deposit: depositValue,
      dniPhotoFileId: dniPhotos[0]?.fileId,
      devicePhotoFileIds: devicePhotos.map((photo) => photo.fileId),
    };

    createOrder.mutate(input, {
      onSuccess: (created) => {
        setSuccess(`Orden ${created.code} registrada correctamente.`);
        onSaved(created);
      },
      onError: () =>
        setError(
          "No se pudo registrar la orden. Revisa los datos e inténtalo de nuevo.",
        ),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-ocid="admin.order.form"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          {isEditing
            ? `Editar orden ${order.code}`
            : "Nueva recepción de equipo"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? "Actualiza el diagnóstico, los importes y la estimación de entrega."
            : "Registra al cliente, el equipo y las condiciones de ingreso al taller."}
        </p>
      </div>

      {!isEditing && (
        <>
          <fieldset className="space-y-4 rounded-xl border border-border bg-card p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-accent">
              Datos del propietario
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="intake-name">Nombre completo</Label>
                <Input
                  id="intake-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  data-ocid="admin.order.name_input"
                  placeholder="Ej. María Fernández Ruiz"
                  required
                  className="rounded-lg border-input bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intake-dni">DNI</Label>
                <Input
                  id="intake-dni"
                  value={dni}
                  onChange={(event) => setDni(event.target.value)}
                  data-ocid="admin.order.dni_input"
                  placeholder="Ej. 12345678A"
                  required
                  className="rounded-lg border-input bg-background font-mono"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="intake-phone">Teléfono</Label>
                <Input
                  id="intake-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  data-ocid="admin.order.phone_input"
                  placeholder="Ej. +34 600 123 456"
                  required
                  className="rounded-lg border-input bg-background font-mono"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="intake-email">
                  Correo electrónico (para notificaciones){" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="intake-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  data-ocid="admin.order.email_input"
                  placeholder="Ej. cliente@correo.com"
                  className="rounded-lg border-input bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Se usará para avisar al cliente cuando cambie el estado de la
                  reparación.
                </p>
              </div>
            </div>

            <PhotoField
              label="Foto del DNI"
              hint="Documento de identidad del propietario. Solo visible en este panel administrativo."
              photos={dniPhotos}
              onAdd={(photo) => setDniPhotos((current) => [...current, photo])}
              onRemove={(fileId) =>
                setDniPhotos((current) =>
                  current.filter((p) => p.fileId !== fileId),
                )
              }
              ocid="admin.order.dni_upload_button"
              privateBadge
            />
          </fieldset>

          <fieldset className="space-y-4 rounded-xl border border-border bg-card p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-accent">
              Datos del equipo
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="intake-brand">Marca</Label>
                <Input
                  id="intake-brand"
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  data-ocid="admin.order.brand_input"
                  placeholder="Ej. Samsung"
                  required
                  className="rounded-lg border-input bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intake-model">Modelo</Label>
                <Input
                  id="intake-model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  data-ocid="admin.order.model_input"
                  placeholder="Ej. Galaxy S23"
                  required
                  className="rounded-lg border-input bg-background"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="intake-imei">
                  IMEI{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="intake-imei"
                  value={imei}
                  onChange={(event) => setImei(event.target.value)}
                  data-ocid="admin.order.imei_input"
                  placeholder="15 dígitos"
                  className="rounded-lg border-input bg-background font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intake-issue">Daño reportado</Label>
                <Textarea
                  id="intake-issue"
                  value={reportedIssue}
                  onChange={(event) => setReportedIssue(event.target.value)}
                  data-ocid="admin.order.issue_textarea"
                  placeholder="Ej. Pantalla rota y no enciende tras caída."
                  rows={3}
                  className="rounded-lg border-input bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intake-condition">Estado físico</Label>
                <Textarea
                  id="intake-condition"
                  value={physicalCondition}
                  onChange={(event) => setPhysicalCondition(event.target.value)}
                  data-ocid="admin.order.condition_textarea"
                  placeholder="Ej. Marco con golpes leves, tapa trasera rayada."
                  rows={3}
                  className="rounded-lg border-input bg-background"
                />
              </div>
            </div>

            <PhotoField
              label="Fotos del equipo al recibirlo"
              hint="Captura el estado del celular en el momento del ingreso."
              photos={devicePhotos}
              onAdd={(photo) =>
                setDevicePhotos((current) => [...current, photo])
              }
              onRemove={(fileId) =>
                setDevicePhotos((current) =>
                  current.filter((p) => p.fileId !== fileId),
                )
              }
              ocid="admin.order.device_upload_button"
            />
          </fieldset>
        </>
      )}

      {isEditing && (
        <fieldset className="space-y-4 rounded-xl border border-border bg-card p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-accent">
            Diagnóstico y seguimiento
          </legend>
          <div className="space-y-2">
            <Label htmlFor="edit-diagnosis">Diagnóstico técnico</Label>
            <Textarea
              id="edit-diagnosis"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              data-ocid="admin.order.diagnosis_textarea"
              placeholder="Describe la falla detectada y la intervención necesaria."
              rows={3}
              className="rounded-lg border-input bg-background"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-time">Tiempo estimado</Label>
              <Input
                id="edit-time"
                value={estimatedTime}
                onChange={(event) => setEstimatedTime(event.target.value)}
                data-ocid="admin.order.estimated_time_input"
                placeholder="Ej. 3 días hábiles"
                className="rounded-lg border-input bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Fecha estimada de entrega</Label>
              <Input
                id="edit-date"
                type="date"
                value={estimatedDeliveryDate}
                onChange={(event) =>
                  setEstimatedDeliveryDate(event.target.value)
                }
                data-ocid="admin.order.delivery_date_input"
                className="rounded-lg border-input bg-background font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Déjala vacía para no modificar la fecha ya registrada.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-observations">Observaciones</Label>
            <Textarea
              id="edit-observations"
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
              data-ocid="admin.order.observations_textarea"
              placeholder="Notas internas, repuestos pedidos, acuerdos con el cliente…"
              rows={3}
              className="rounded-lg border-input bg-background"
            />
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-4 rounded-xl border border-border bg-card p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-accent">
          Importes
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="price">Precio de reparación</Label>
            <Input
              id="price"
              inputMode="numeric"
              value={totalPrice}
              onChange={(event) => setTotalPrice(event.target.value)}
              data-ocid="admin.order.price_input"
              placeholder="0"
              className="rounded-lg border-input bg-background font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit">Adelanto</Label>
            <Input
              id="deposit"
              inputMode="numeric"
              value={deposit}
              onChange={(event) => setDeposit(event.target.value)}
              data-ocid="admin.order.deposit_input"
              placeholder="0"
              className="rounded-lg border-input bg-background font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Saldo pendiente</Label>
            <div
              id="balance"
              data-ocid="admin.order.balance_display"
              aria-live="polite"
              className="flex h-9 items-center rounded-lg border border-accent/40 bg-accent/10 px-3 font-mono text-sm font-bold text-accent"
            >
              {formatMoney(balance)}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          El saldo se calcula automáticamente como precio total − adelanto.
        </p>
      </fieldset>

      {error && (
        <p
          data-ocid="admin.order.form.error_state"
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {success && (
        <p
          data-ocid="admin.order.form.success_state"
          className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {success}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          data-ocid="admin.order.cancel_button"
          onClick={onCancel}
          className="rounded-lg border-border font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          data-ocid="admin.order.submit_button"
          disabled={isPending || !canSubmit}
          className="rounded-lg gradient-primary font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Guardando…
            </>
          ) : (
            <>
              {isEditing ? (
                <Save className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              {isEditing ? "Guardar cambios" : "Registrar recepción"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
