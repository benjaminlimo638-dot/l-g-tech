import type { RepairStatus } from "@/backend";
import {
  REPAIR_STAGES,
  STAGE_DESCRIPTIONS,
  STAGE_LABELS,
  stageIndex,
} from "@/lib/repair";
import { Check } from "lucide-react";

/** Per-stage accent token declared in index.css (`--stage-1` … `--stage-6`). */
const STAGE_COLORS = [
  "var(--stage-1)",
  "var(--stage-2)",
  "var(--stage-3)",
  "var(--stage-4)",
  "var(--stage-5)",
  "var(--stage-6)",
] as const;

type RepairProgressProps = {
  /** Current stage of the repair order. */
  status: RepairStatus;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
};

/**
 * Six-stage repair trace: Recibido → Diagnosticando → En reparación → Probando
 * → Listo para entregar → Entregado. Completed stages are filled, the current
 * stage is highlighted with its own accent token, and future stages stay muted.
 */
export function RepairProgress({ status, className }: RepairProgressProps) {
  const current = stageIndex(status);

  return (
    <div
      data-ocid="repair.progress"
      className={className}
      aria-label={`Etapa actual: ${STAGE_LABELS[status]}`}
    >
      {/* Horizontal trace — tablet and up */}
      <ol className="hidden items-start md:flex">
        {REPAIR_STAGES.map((stage, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const color = STAGE_COLORS[index];
          return (
            <li
              key={stage}
              data-ocid={`repair.progress.stage.${index + 1}`}
              className="relative flex flex-1 flex-col items-center gap-2 px-1 text-center"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[-50%] top-4 h-0.5 w-full"
                  style={{
                    backgroundColor: isDone || isCurrent ? color : undefined,
                    opacity: isDone || isCurrent ? 0.9 : 0.25,
                  }}
                />
              )}
              <span
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-smooth"
                style={{
                  borderColor: isDone || isCurrent ? color : "var(--border)",
                  backgroundColor: isDone
                    ? color
                    : isCurrent
                      ? "var(--card)"
                      : "var(--muted)",
                  color: isDone
                    ? "var(--background)"
                    : isCurrent
                      ? color
                      : "var(--muted-foreground)",
                  boxShadow: isCurrent
                    ? `0 0 0 4px color-mix(in oklch, ${color} 22%, transparent)`
                    : undefined,
                }}
              >
                {isDone ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className="text-xs font-semibold leading-tight"
                style={{
                  color: isCurrent
                    ? color
                    : isDone
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                }}
              >
                {STAGE_LABELS[stage]}
              </span>
              <span className="text-[0.65rem] leading-tight text-muted-foreground">
                {STAGE_DESCRIPTIONS[stage]}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Vertical trace — mobile */}
      <ol className="flex flex-col gap-0 md:hidden">
        {REPAIR_STAGES.map((stage, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const color = STAGE_COLORS[index];
          const isLast = index === REPAIR_STAGES.length - 1;
          return (
            <li
              key={stage}
              data-ocid={`repair.progress.stage.${index + 1}`}
              className="flex gap-3"
            >
              <div className="flex flex-col items-center">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[0.65rem] font-bold"
                  style={{
                    borderColor: isDone || isCurrent ? color : "var(--border)",
                    backgroundColor: isDone
                      ? color
                      : isCurrent
                        ? "var(--card)"
                        : "var(--muted)",
                    color: isDone
                      ? "var(--background)"
                      : isCurrent
                        ? color
                        : "var(--muted-foreground)",
                    boxShadow: isCurrent
                      ? `0 0 0 4px color-mix(in oklch, ${color} 22%, transparent)`
                      : undefined,
                  }}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="my-1 w-0.5 flex-1"
                    style={{
                      backgroundColor:
                        isDone || isCurrent ? color : "var(--border)",
                      opacity: isDone || isCurrent ? 0.9 : 0.4,
                    }}
                  />
                )}
              </div>
              <div className="min-w-0 pb-4">
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{
                    color: isCurrent
                      ? color
                      : isDone
                        ? "var(--foreground)"
                        : "var(--muted-foreground)",
                  }}
                >
                  {STAGE_LABELS[stage]}
                </p>
                <p className="text-xs leading-tight text-muted-foreground">
                  {STAGE_DESCRIPTIONS[stage]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
