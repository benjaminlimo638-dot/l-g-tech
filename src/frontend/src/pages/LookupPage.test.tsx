import type { LookupResult, PublicRepairView, RepairStatus } from "@/backend";
import { RepairStatus as Status } from "@/backend";
import { LookupPage } from "@/pages/LookupPage";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const lookupState: {
  data: LookupResult | undefined;
  isFetching: boolean;
  isError: boolean;
} = { data: undefined, isFetching: false, isError: false };

vi.mock("@/hooks/useRepairApi", () => ({
  useLookupRepair: () => lookupState,
}));

vi.mock("@/lib/storage", () => ({
  resolveFileUrl: vi.fn(async (hash: string) => `https://cdn.test/${hash}`),
}));

function publicView(
  overrides: Partial<PublicRepairView> = {},
): PublicRepairView {
  return {
    status: Status.EnReparacion,
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

function renderPage(initialPath = "/consultar") {
  const rootRoute = createRootRoute();
  // Pathless layout route: the page reads `useSearch({ from: "/layout/consultar" })`,
  // so this parent must exist with id "layout" but must only render its child.
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "layout",
    component: () => <Outlet />,
  });
  const lookupRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "/consultar",
    validateSearch: (search: Record<string, unknown>) => ({
      code: typeof search.code === "string" ? search.code : undefined,
      phone: typeof search.phone === "string" ? search.phone : undefined,
      focus: typeof search.focus === "string" ? search.focus : undefined,
    }),
    component: () => <LookupPage />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([lookupRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("LookupPage", () => {
  beforeEach(() => {
    lookupState.data = undefined;
    lookupState.isFetching = false;
    lookupState.isError = false;
  });

  it("asks for a code or phone before searching", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId("lookup.submit_button"));
    expect(await screen.findByTestId("lookup.error_state")).toHaveTextContent(
      /código de reparación o tu número de teléfono/i,
    );
  });

  it("shows the full record with the six-stage progress trace when found", async () => {
    lookupState.data = { __kind__: "found", found: publicView() };
    renderPage("/consultar?code=LG-ABC123");

    expect(await screen.findByTestId("repair.detail_card")).toBeInTheDocument();
    expect(screen.getByTestId("repair.code")).toHaveTextContent("LG-ABC123");
    expect(screen.getByTestId("repair.status_badge")).toHaveTextContent(
      "En reparación",
    );
    expect(screen.getByTestId("repair.total_price")).toHaveTextContent("120");
    expect(screen.getByTestId("repair.deposit")).toHaveTextContent("50");
    expect(screen.getByTestId("repair.balance")).toHaveTextContent("70");
    // Six stages, each rendered in the desktop and mobile traces.
    for (let i = 1; i <= 6; i += 1) {
      expect(
        screen.getAllByTestId(`repair.progress.stage.${i}`).length,
      ).toBeGreaterThan(0);
    }
  });

  it("shows a clear not-found message without other customers' data", async () => {
    lookupState.data = { __kind__: "notFound", notFound: null };
    renderPage("/consultar?code=LG-NOPE00");

    expect(await screen.findByTestId("lookup.empty_state")).toHaveTextContent(
      /No encontramos esa reparación/i,
    );
    expect(screen.queryByTestId("repair.detail_card")).not.toBeInTheDocument();
  });

  it("never renders the DNI photo in the public record", async () => {
    lookupState.data = { __kind__: "found", found: publicView() };
    renderPage("/consultar?code=LG-ABC123");
    await screen.findByTestId("repair.detail_card");
    expect(screen.queryByText(/DNI/i)).not.toBeInTheDocument();
  });

  it("shows 'Por confirmar' when the estimated delivery date is absent", async () => {
    lookupState.data = {
      __kind__: "found",
      found: publicView({ estimatedDeliveryDate: undefined }),
    };
    renderPage("/consultar?code=LG-ABC123");

    await screen.findByTestId("repair.detail_card");
    expect(screen.getByText("Por confirmar")).toBeInTheDocument();
  });

  it("treats an epoch estimated delivery date as absent", async () => {
    lookupState.data = {
      __kind__: "found",
      found: publicView({ estimatedDeliveryDate: 0n }),
    };
    renderPage("/consultar?code=LG-ABC123");

    await screen.findByTestId("repair.detail_card");
    expect(screen.getByText("Por confirmar")).toBeInTheDocument();
    expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
  });

  it("shows the formatted estimated delivery date when present", async () => {
    // A distinct date from the intake date so the assertion is unambiguous.
    lookupState.data = {
      __kind__: "found",
      found: publicView({ estimatedDeliveryDate: 1_800_000_000_000_000_000n }),
    };
    renderPage("/consultar?code=LG-ABC123");

    await screen.findByTestId("repair.detail_card");
    expect(screen.queryByText("Por confirmar")).not.toBeInTheDocument();
    expect(screen.getByText(/2027/)).toBeInTheDocument();
  });
});
