import type { AdminRepairView } from "@/backend";
import { RepairStatus } from "@/backend";
import { AdminPage } from "@/pages/AdminPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The admin panel is the app's private surface. These tests pin the access
 * gate — signed-out and non-admin callers must never reach the order console —
 * and the search journey an authorized administrator relies on.
 */

const identityState: {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
} = { isAuthenticated: false, isInitializing: false, isLoggingIn: false };

const adminState: { data: boolean | undefined; isLoading: boolean } = {
  data: undefined,
  isLoading: false,
};

const pendingState: {
  data: AdminRepairView[] | undefined;
  isLoading: boolean;
  isError: boolean;
} = { data: [], isLoading: false, isError: false };

const completedState: {
  data: AdminRepairView[] | undefined;
  isLoading: boolean;
  isError: boolean;
} = { data: [], isLoading: false, isError: false };

const searchState: {
  data: AdminRepairView[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
} = { data: [], isLoading: false, isError: false, isFetching: false };

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    login: vi.fn(),
    clear: vi.fn(),
    isAuthenticated: identityState.isAuthenticated,
    isInitializing: identityState.isInitializing,
    isLoggingIn: identityState.isLoggingIn,
  }),
}));

vi.mock("@/hooks/useRepairApi", () => ({
  useIsCallerAdmin: () => adminState,
  usePendingRepairs: () => pendingState,
  useCompletedRepairs: () => completedState,
  useSearchRepairs: () => searchState,
}));

/** `AdminLogin` reads the query client, so every render needs a provider. */
function renderPage(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

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

describe("AdminPage access gate", () => {
  beforeEach(() => {
    identityState.isAuthenticated = false;
    identityState.isInitializing = false;
    identityState.isLoggingIn = false;
    adminState.data = undefined;
    adminState.isLoading = false;
    pendingState.data = [];
    pendingState.isLoading = false;
    pendingState.isError = false;
    completedState.data = [];
    completedState.isLoading = false;
    completedState.isError = false;
    searchState.data = [];
    searchState.isLoading = false;
    searchState.isError = false;
    searchState.isFetching = false;
  });

  it("shows the sign-in card and no order console to a signed-out visitor", () => {
    renderPage(<AdminPage />);

    expect(screen.getByTestId("admin.login_button")).toBeInTheDocument();
    expect(screen.getByText(/Panel administrativo/i)).toBeInTheDocument();
    expect(screen.queryByTestId("admin.order.section")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("admin.order.search_input"),
    ).not.toBeInTheDocument();
  });

  it("denies a signed-in caller who is not an administrator", () => {
    identityState.isAuthenticated = true;
    adminState.data = false;
    renderPage(<AdminPage />);

    expect(screen.getByTestId("admin.access_denied_state")).toBeInTheDocument();
    expect(screen.getByText(/Acceso denegado/i)).toBeInTheDocument();
    expect(screen.queryByTestId("admin.order.section")).not.toBeInTheDocument();
  });

  it("shows the order console to an authorized administrator", () => {
    identityState.isAuthenticated = true;
    adminState.data = true;
    renderPage(<AdminPage />);

    expect(screen.getByTestId("admin.order.section")).toBeInTheDocument();
    expect(screen.getByTestId("admin.order.search_input")).toBeInTheDocument();
    expect(screen.getByTestId("admin.order.pending_tab")).toBeInTheDocument();
    expect(screen.getByTestId("admin.order.completed_tab")).toBeInTheDocument();
    expect(screen.queryByTestId("admin.login_button")).not.toBeInTheDocument();
  });

  it("lists the orders returned by the admin search", async () => {
    identityState.isAuthenticated = true;
    adminState.data = true;
    searchState.data = [adminView()];
    const user = userEvent.setup();
    renderPage(<AdminPage />);

    await user.type(screen.getByTestId("admin.order.search_input"), "María");

    expect(await screen.findByTestId("admin.order.item.1")).toBeInTheDocument();
    expect(screen.getByText("LG-ABC123")).toBeInTheDocument();
    expect(screen.getByText("María González")).toBeInTheDocument();
  });
});
