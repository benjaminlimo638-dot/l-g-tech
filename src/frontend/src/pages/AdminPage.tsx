import type { AdminRepairView } from "@/backend";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";
import { AdminOrderForm } from "@/components/admin/AdminOrderForm";
import { AdminOrderList } from "@/components/admin/AdminOrderList";
import { useIsCallerAdmin } from "@/hooks/useRepairApi";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useState } from "react";

type AdminView =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "detail"; order: AdminRepairView }
  | { kind: "edit"; order: AdminRepairView };

/**
 * Private administrative panel for L&G TECH. Gated behind Internet Identity and
 * admin authorization; authorized administrators get the dense order console
 * with intake, editing, detail and status management.
 */
export function AdminPage() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();
  const isAdminQuery = useIsCallerAdmin();
  const [view, setView] = useState<AdminView>({ kind: "list" });

  const isCheckingAccess =
    isInitializing || (isAuthenticated && isAdminQuery.isLoading);
  const isAdmin = isAdminQuery.data === true;

  if (!isAuthenticated || !isAdmin) {
    return <AdminLogin isCheckingAccess={isCheckingAccess} isAdmin={isAdmin} />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-1 border-b border-border pb-4">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent">
          L&amp;G TECH · Taller
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Panel administrativo
        </h1>
        <p className="text-sm text-muted-foreground">
          Recepción de equipos, seguimiento de reparaciones y control de saldos.
        </p>
      </header>

      {view.kind === "list" && (
        <AdminOrderList
          onSelect={(order) => setView({ kind: "detail", order })}
          onCreate={() => setView({ kind: "create" })}
        />
      )}

      {view.kind === "create" && (
        <AdminOrderForm
          onSaved={(order) => setView({ kind: "detail", order })}
          onCancel={() => setView({ kind: "list" })}
        />
      )}

      {view.kind === "edit" && (
        <AdminOrderForm
          order={view.order}
          onSaved={(order) => setView({ kind: "detail", order })}
          onCancel={() => setView({ kind: "detail", order: view.order })}
        />
      )}

      {view.kind === "detail" && (
        <AdminOrderDetail
          order={view.order}
          onBack={() => setView({ kind: "list" })}
          onEdit={(order) => setView({ kind: "edit", order })}
        />
      )}
    </div>
  );
}
