import type { AdminRepairView, PublicRepairView } from "@/backend";
import { RepairStatus } from "@/backend";
import { RepairDetailCard } from "@/components/RepairDetailCard";
import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * The DNI photo is the app's most sensitive field: it must be visible in the
 * authorized admin panel and must never appear in the public customer record.
 * These tests pin both sides of that boundary.
 */

const dniState: { data: string | null; isLoading: boolean } = {
  data: null,
  isLoading: false,
};

vi.mock("@/hooks/useRepairApi", () => ({
  useDniPhoto: () => dniState,
  useChangeRepairStatus: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/lib/storage", () => ({
  resolveFileUrl: vi.fn(async (hash: string) => `https://cdn.test/${hash}`),
}));

function adminView(overrides: Partial<AdminRepairView> = {}): AdminRepairView {
  return {
    id: 1n,
    status: RepairStatus.EnReparacion,
    devicePhotoFileIds: [],
    client: {
      id: 1n,
      dni: "12345678Z",
      createdAt: 1_700_000_000_000_000_000n,
      fullName: "María González",
      email: "maria@example.com",
      phone: "+34600123456",
    },
    additionalDescription: "",
    deliveredAt: undefined,
    balance: 70n,
    code: "LG-ABC123",
    createdAt: 1_700_000_000_000_000_000n,
    intakeDate: 1_700_000_000_000_000_000n,
    reportedIssue: "Pantalla rota",
    hasDniPhoto: true,
    estimatedDeliveryDate: undefined,
    damagePhotoFileIds: [],
    deposit: 50n,
    diagnosis: "Cambio de pantalla",
    device: {
      id: 1n,
      model: "Galaxy S23",
      imei: "356789012345678",
      physicalCondition: "Bueno",
      brand: "Samsung",
    },
    updatedAt: 1_700_000_000_000_000_000n,
    totalPrice: 120n,
    estimatedTime: "3 días",
    observations: "",
    ...overrides,
  };
}

function publicView(
  overrides: Partial<PublicRepairView> = {},
): PublicRepairView {
  return {
    status: RepairStatus.EnReparacion,
    devicePhotoFileIds: [],
    model: "Galaxy S23",
    balance: 70n,
    code: "LG-ABC123",
    intakeDate: 1_700_000_000_000_000_000n,
    reportedIssue: "Pantalla rota",
    estimatedDeliveryDate: undefined,
    fullName: "María González",
    damagePhotoFileIds: [],
    deposit: 50n,
    diagnosis: "Cambio de pantalla",
    brand: "Samsung",
    totalPrice: 120n,
    estimatedTime: "3 días",
    observations: "",
    ...overrides,
  };
}

describe("DNI photo privacy boundary", () => {
  it("shows the private DNI photo in the admin order detail", async () => {
    dniState.data = "hash-dni-private";
    dniState.isLoading = false;
    render(
      <AdminOrderDetail
        order={adminView()}
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("img", { name: /DNI de María González/i }),
    ).toHaveAttribute("src", "https://cdn.test/hash-dni-private");
    expect(screen.getByText(/Foto del DNI · Privada/i)).toBeInTheDocument();
  });

  it("shows an empty state in the admin panel when no DNI photo exists", async () => {
    dniState.data = null;
    dniState.isLoading = false;
    render(
      <AdminOrderDetail
        order={adminView()}
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      await screen.findByTestId("admin.order.dni.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /DNI de/i }),
    ).not.toBeInTheDocument();
  });

  it("never renders a DNI section in the public repair record", async () => {
    render(<RepairDetailCard repair={publicView()} />);

    expect(await screen.findByTestId("repair.detail_card")).toBeInTheDocument();
    expect(screen.queryByText(/DNI/i)).not.toBeInTheDocument();
    expect(screen.queryByText("12345678Z")).not.toBeInTheDocument();
  });
});

describe("AdminOrderDetail order fields", () => {
  it("renders the customer's additional description", async () => {
    dniState.data = null;
    dniState.isLoading = false;
    render(
      <AdminOrderDetail
        order={adminView({
          additionalDescription: "El equipo se mojó y no enciende.",
        })}
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      await screen.findByText("Descripción adicional"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("El equipo se mojó y no enciende."),
    ).toBeInTheDocument();
  });

  it("treats an epoch estimated delivery date as absent", async () => {
    dniState.data = null;
    dniState.isLoading = false;
    render(
      <AdminOrderDetail
        order={adminView({ estimatedDeliveryDate: 0n })}
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(await screen.findByText("Entrega estimada")).toBeInTheDocument();
    // The DetailField falls back to an em dash for an absent value.
    expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
  });
});
