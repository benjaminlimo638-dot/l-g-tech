import type { AdminRepairView, RepairOrderUpdate } from "@/backend";
import { RepairStatus } from "@/backend";
import { AdminOrderForm } from "@/components/admin/AdminOrderForm";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The edit form's estimated delivery date is set-only: the backend treats an
 * absent value as "leave unchanged" and has no clear signal, so the form must
 * omit the field entirely when the input is empty and never send `0n`.
 */

const updateMutate = vi.fn();
const createMutate = vi.fn();

vi.mock("@/hooks/useRepairApi", () => ({
  useCreateRepairOrder: () => ({ mutate: createMutate, isPending: false }),
  useUpdateRepairOrder: () => ({ mutate: updateMutate, isPending: false }),
}));

vi.mock("@/lib/storage", () => ({
  uploadFile: vi.fn(async () => "hash-uploaded"),
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

describe("AdminOrderForm edit mode", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    createMutate.mockReset();
  });

  it("computes the pending balance live as price minus deposit", async () => {
    const user = userEvent.setup();
    render(
      <AdminOrderForm
        order={adminView()}
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const price = screen.getByTestId("admin.order.price_input");
    const deposit = screen.getByTestId("admin.order.deposit_input");
    await user.clear(price);
    await user.type(price, "200");
    await user.clear(deposit);
    await user.type(deposit, "80");

    expect(screen.getByTestId("admin.order.balance_display")).toHaveTextContent(
      "120",
    );
  });

  it("omits the estimated delivery date when the input is left empty", async () => {
    const user = userEvent.setup();
    render(
      <AdminOrderForm
        order={adminView()}
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("admin.order.submit_button"));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const [payload] = updateMutate.mock.calls[0] as [
      { id: bigint; update: RepairOrderUpdate },
    ];
    expect(payload.id).toBe(1n);
    expect(payload.update).not.toHaveProperty("estimatedDeliveryDate");
  });

  it("sends the estimated delivery date when the input holds a real date", async () => {
    const user = userEvent.setup();
    render(
      <AdminOrderForm
        order={adminView()}
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const dateInput = screen.getByTestId("admin.order.delivery_date_input");
    await user.type(dateInput, "2026-03-15");
    await user.click(screen.getByTestId("admin.order.submit_button"));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const [payload] = updateMutate.mock.calls[0] as [
      { id: bigint; update: RepairOrderUpdate },
    ];
    expect(payload.update.estimatedDeliveryDate).toBeDefined();
    expect(payload.update.estimatedDeliveryDate).toBeGreaterThan(0n);
  });
});
