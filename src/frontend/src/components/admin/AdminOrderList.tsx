import type { AdminRepairView } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCompletedRepairs,
  usePendingRepairs,
  useSearchRepairs,
} from "@/hooks/useRepairApi";
import {
  formatDate,
  formatMoney,
  stageBadgeClass,
  stageLabel,
} from "@/lib/repair";
import {
  ChevronRight,
  Inbox,
  Loader2,
  PackageCheck,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

type AdminOrderListProps = {
  /** Open the detail view for an order. */
  onSelect: (order: AdminRepairView) => void;
  /** Open the intake form to create a new order. */
  onCreate: () => void;
};

const SKELETON_IDS = Array.from({ length: 5 }, (_, i) => `order-skeleton-${i}`);

function OrderRow({
  order,
  index,
  onSelect,
}: {
  order: AdminRepairView;
  index: number;
  onSelect: (order: AdminRepairView) => void;
}) {
  return (
    <li>
      <button
        type="button"
        data-ocid={`admin.order.item.${index + 1}`}
        onClick={() => onSelect(order)}
        className="group flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-smooth hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent">
              {order.code}
            </span>
            <Badge
              variant="outline"
              className={`border-transparent px-2 py-0 text-[0.65rem] font-semibold uppercase tracking-wide ${stageBadgeClass(order.status)}`}
            >
              {stageLabel(order.status)}
            </Badge>
          </div>
          <span className="truncate text-sm font-semibold text-foreground">
            {order.client.fullName}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {order.device.brand} {order.device.model} ·{" "}
            <span className="font-mono">{order.client.phone}</span>
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-sm font-bold text-foreground">
            {formatMoney(order.balance)}
          </span>
          <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            Saldo
          </span>
          <span className="text-[0.65rem] text-muted-foreground">
            {formatDate(order.intakeDate)}
          </span>
        </div>

        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition-smooth group-hover:translate-x-0.5 group-hover:text-accent"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}

function OrderListBody({
  orders,
  isLoading,
  isError,
  emptyTitle,
  emptyHint,
  onSelect,
}: {
  orders: AdminRepairView[];
  isLoading: boolean;
  isError: boolean;
  emptyTitle: string;
  emptyHint: string;
  onSelect: (order: AdminRepairView) => void;
}) {
  if (isLoading) {
    return (
      <div data-ocid="admin.order.loading_state" className="space-y-2 p-3">
        {SKELETON_IDS.map((id) => (
          <Skeleton key={id} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="admin.order.error_state"
        className="flex flex-col items-center gap-2 px-4 py-12 text-center"
      >
        <p className="text-sm font-semibold text-foreground">
          No se pudieron cargar las órdenes
        </p>
        <p className="text-xs text-muted-foreground">
          Verifica tu conexión e inténtalo de nuevo.
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        data-ocid="admin.order.empty_state"
        className="flex flex-col items-center gap-2 px-4 py-12 text-center"
      >
        <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <ul data-ocid="admin.order.list" className="divide-y divide-border">
      {orders.map((order, index) => (
        <OrderRow
          key={order.id.toString()}
          order={order}
          index={index}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

/**
 * Dense admin order console: tabs for pending and completed repairs, a search
 * box matching name, phone, code or model, and a compact list of orders.
 */
export function AdminOrderList({ onSelect, onCreate }: AdminOrderListProps) {
  const [term, setTerm] = useState("");
  const trimmed = term.trim();
  const isSearching = trimmed.length > 0;

  const pending = usePendingRepairs();
  const completed = useCompletedRepairs();
  const search = useSearchRepairs(term);

  return (
    <section
      data-ocid="admin.order.section"
      className="flex flex-col gap-4"
      aria-label="Órdenes de reparación"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            data-ocid="admin.order.search_input"
            placeholder="Buscar por nombre, teléfono, código o modelo"
            aria-label="Buscar órdenes"
            className="rounded-lg border-input bg-card pl-9 pr-9"
          />
          {isSearching && (
            <button
              type="button"
              data-ocid="admin.order.search_clear_button"
              onClick={() => setTerm("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <Button
          type="button"
          data-ocid="admin.order.create_button"
          onClick={onCreate}
          className="rounded-lg gradient-primary font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          Nueva recepción
        </Button>
      </div>

      {isSearching ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Resultados
            </span>
            {search.isFetching && (
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-accent"
                aria-hidden="true"
              />
            )}
          </div>
          <OrderListBody
            orders={search.data ?? []}
            isLoading={search.isLoading}
            isError={search.isError}
            emptyTitle="Sin coincidencias"
            emptyHint={`No encontramos órdenes para “${trimmed}”. Prueba con otro nombre, teléfono, código o modelo.`}
            onSelect={onSelect}
          />
        </div>
      ) : (
        <Tabs defaultValue="pending" className="gap-3">
          <TabsList
            data-ocid="admin.order.tabs"
            className="h-10 w-full justify-start rounded-lg border border-border bg-card p-1 sm:w-fit"
          >
            <TabsTrigger
              value="pending"
              data-ocid="admin.order.pending_tab"
              className="rounded-md px-4 font-semibold data-[state=active]:bg-secondary data-[state=active]:text-foreground"
            >
              Pendientes
              {pending.data && (
                <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                  {pending.data.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              data-ocid="admin.order.completed_tab"
              className="rounded-md px-4 font-semibold data-[state=active]:bg-secondary data-[state=active]:text-foreground"
            >
              Terminadas
              {completed.data && (
                <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                  {completed.data.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
              <OrderListBody
                orders={pending.data ?? []}
                isLoading={pending.isLoading}
                isError={pending.isError}
                emptyTitle="No hay reparaciones pendientes"
                emptyHint="Registra una nueva recepción para comenzar a dar seguimiento."
                onSelect={onSelect}
              />
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                <PackageCheck
                  className="h-3.5 w-3.5 text-success"
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Equipos entregados
                </span>
              </div>
              <OrderListBody
                orders={completed.data ?? []}
                isLoading={completed.isLoading}
                isError={completed.isError}
                emptyTitle="Aún no hay reparaciones terminadas"
                emptyHint="Las órdenes entregadas aparecerán aquí como historial del taller."
                onSelect={onSelect}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}
