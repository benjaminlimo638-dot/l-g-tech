import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ExternalBlob } from "@caffeineai/object-storage";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

/** A single damage photo tracked by the uploader. */
export type PhotoItem = {
  /** Stable client-side identity for React keys and removal. */
  id: string;
  file: File;
  /** Object URL used for the local preview. */
  previewUrl: string;
  /** 0–100 upload progress. */
  progress: number;
  /** Backend file id once the upload completes. */
  fileId: string | null;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type PhotoUploaderProps = {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  /** Uploads one file and resolves with the backend file id. */
  uploadFile: (
    file: File,
    onProgress: (pct: number) => void,
  ) => Promise<string>;
  maxPhotos?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
};

const ACCEPTED_TYPES = "image/*";

function createId(): string {
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Multi-file damage photo picker with drag-and-drop, live previews, per-file
 * upload progress and removal. Uploads run through the object-storage
 * extension and report the resulting backend file ids to the parent form.
 */
export function PhotoUploader({
  photos,
  onPhotosChange,
  uploadFile,
  maxPhotos = 6,
  disabled = false,
  label = "Fotos del daño",
  hint = "Hasta 6 imágenes. Toca para elegir o arrastra los archivos aquí.",
}: PhotoUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updatePhoto = useCallback(
    (id: string, patch: Partial<PhotoItem>) => {
      onPhotosChange(
        photos.map((photo) =>
          photo.id === id ? { ...photo, ...patch } : photo,
        ),
      );
    },
    [photos, onPhotosChange],
  );

  const startUpload = useCallback(
    async (photo: PhotoItem) => {
      updatePhoto(photo.id, {
        status: "uploading",
        progress: 0,
        error: undefined,
      });
      try {
        const fileId = await uploadFile(photo.file, (pct) => {
          updatePhoto(photo.id, { progress: Math.round(pct) });
        });
        updatePhoto(photo.id, { status: "done", progress: 100, fileId });
      } catch (error) {
        updatePhoto(photo.id, {
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "No se pudo subir la imagen",
        });
      }
    },
    [updatePhoto, uploadFile],
  );

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;
      const incoming = Array.from(fileList).filter((file) =>
        file.type.startsWith("image/"),
      );
      const room = Math.max(0, maxPhotos - photos.length);
      const accepted = incoming.slice(0, room);
      if (accepted.length === 0) return;

      const next: PhotoItem[] = accepted.map((file) => ({
        id: createId(),
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        fileId: null,
        status: "pending" as const,
      }));

      onPhotosChange([...photos, ...next]);
      for (const photo of next) {
        void startUpload(photo);
      }
    },
    [disabled, maxPhotos, onPhotosChange, photos, startUpload],
  );

  const removePhoto = useCallback(
    (id: string) => {
      const target = photos.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      onPhotosChange(photos.filter((photo) => photo.id !== id));
    },
    [onPhotosChange, photos],
  );

  const retryPhoto = useCallback(
    (id: string) => {
      const target = photos.find((photo) => photo.id === id);
      if (target) void startUpload(target);
    },
    [photos, startUpload],
  );

  const atCapacity = photos.length >= maxPhotos;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {photos.length}/{maxPhotos}
        </span>
      </div>

      <button
        type="button"
        data-ocid="request.photo.dropzone"
        disabled={disabled || atCapacity}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !atCapacity) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-secondary/40 px-4 py-8 text-center transition-smooth",
          "hover:border-accent/60 hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging && "border-accent bg-accent/10",
          (disabled || atCapacity) && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-foreground">
          {atCapacity ? "Límite de fotos alcanzado" : "Añadir fotos del daño"}
        </span>
        <span className="max-w-xs text-xs text-muted-foreground">{hint}</span>
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="sr-only"
        data-ocid="request.photo.input"
        disabled={disabled || atCapacity}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {photos.length > 0 && (
        <ul
          data-ocid="request.photo.list"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              data-ocid={`request.photo.item.${index + 1}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-subtle"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-muted">
                <img
                  src={photo.previewUrl}
                  alt={`Vista previa de la foto ${index + 1} del daño`}
                  className="h-full w-full object-cover"
                />
                {photo.status === "uploading" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <Loader2
                      className="h-6 w-6 animate-spin text-accent"
                      aria-hidden="true"
                    />
                  </span>
                )}
                {photo.status === "error" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-destructive/25 text-xs font-semibold text-destructive-foreground">
                    Error
                  </span>
                )}
              </div>

              <div className="space-y-2 p-2">
                {photo.status === "uploading" && (
                  <Progress
                    value={photo.progress}
                    data-ocid={`request.photo.progress.${index + 1}`}
                    className="h-1.5"
                  />
                )}
                {photo.status === "done" && (
                  <span className="block truncate text-[0.7rem] font-semibold text-success">
                    Subida completa
                  </span>
                )}
                {photo.status === "error" && (
                  <span className="block truncate text-[0.7rem] font-semibold text-destructive">
                    {photo.error ?? "Error al subir"}
                  </span>
                )}
                {photo.status === "pending" && (
                  <span className="block text-[0.7rem] font-semibold text-muted-foreground">
                    En cola…
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  {photo.status === "error" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-ocid={`request.photo.retry_button.${index + 1}`}
                      onClick={() => retryPhoto(photo.id)}
                      className="h-7 flex-1 rounded-md px-2 text-xs"
                    >
                      Reintentar
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Eliminar foto ${index + 1}`}
                    data-ocid={`request.photo.remove_button.${index + 1}`}
                    onClick={() => removePhoto(photo.id)}
                    className="h-7 rounded-md px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Quitar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {photos.length === 0 && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImagePlus className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          Las fotos ayudan a diagnosticar el daño más rápido.
        </p>
      )}
    </div>
  );
}

/**
 * Upload a browser File through the object-storage extension and resolve with
 * the backend file id (the storage hash prefixed with the Motoko dedup
 * sentinel, exactly as the generated actor expects).
 */
export async function uploadDamagePhoto(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const blob = ExternalBlob.fromBytes(
    bytes,
    file.type,
    file.name,
  ).withUploadProgress(onProgress);
  const encoded = await blob.getBytes();
  return new TextDecoder().decode(encoded);
}
