import type { RepairRequestInput } from "@/backend";
import { RequestRepairPage } from "@/pages/RequestRepairPage";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();

vi.mock("@/hooks/useRepairApi", () => ({
  useSubmitRepairRequest: () => ({
    mutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/components/PhotoUploader", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/PhotoUploader")
  >("@/components/PhotoUploader");
  return {
    ...actual,
    uploadDamagePhoto: vi.fn(async () => "hash-photo"),
  };
});

function renderPage(initialPath = "/solicitar") {
  const rootRoute = createRootRoute();
  // Pathless layout route: the page reads `useSearch({ from: "/layout/solicitar" })`,
  // so this parent must exist with id "layout" but must only render its child.
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "layout",
    component: () => <Outlet />,
  });
  const requestRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "/solicitar",
    validateSearch: (search: Record<string, unknown>) => ({
      focus: typeof search.focus === "string" ? search.focus : undefined,
    }),
    component: () => <RequestRepairPage />,
  });
  const lookupRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "/consultar",
    component: () => <div>Consultar</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([requestRoute, lookupRoute]),
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(<RouterProvider router={router} />);
}

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(
    await screen.findByTestId("request.fullName.input"),
    "María González",
  );
  await user.type(screen.getByTestId("request.phone.input"), "+34600123456");
  await user.type(screen.getByTestId("request.brand.input"), "Samsung");
  await user.type(screen.getByTestId("request.model.input"), "Galaxy S23");
  await user.type(
    screen.getByTestId("request.reportedIssue.textarea"),
    "Pantalla rota",
  );
  return user;
}

describe("RequestRepairPage", () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it("shows validation errors and does not submit an empty form", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId("request.submit_button"));

    expect(
      await screen.findByTestId("request.fullName.error"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("request.phone.error")).toBeInTheDocument();
    expect(screen.getByTestId("request.brand.error")).toBeInTheDocument();
    expect(screen.getByTestId("request.model.error")).toBeInTheDocument();
    expect(
      screen.getByTestId("request.reportedIssue.error"),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("submits valid data and reveals the generated repair code", async () => {
    mutate.mockImplementation(
      (
        _input: RepairRequestInput,
        options: { onSuccess: (code: string) => void },
      ) => {
        options.onSuccess("LG-ABC123");
      },
    );
    renderPage();
    const user = await fillValidForm();
    await user.click(screen.getByTestId("request.submit_button"));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    const [input] = mutate.mock.calls[0] as [RepairRequestInput];
    expect(input).toMatchObject({
      fullName: "María González",
      phone: "+34600123456",
      brand: "Samsung",
      model: "Galaxy S23",
      reportedIssue: "Pantalla rota",
      damagePhotoFileIds: [],
    });

    expect(await screen.findByTestId("request.code")).toHaveTextContent(
      "LG-ABC123",
    );
    expect(screen.getByTestId("request.success_state")).toBeInTheDocument();
  });

  it("rejects an invalid phone number", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByTestId("request.fullName.input"), "Ana");
    await user.type(screen.getByTestId("request.phone.input"), "123");
    await user.type(screen.getByTestId("request.brand.input"), "Xiaomi");
    await user.type(screen.getByTestId("request.model.input"), "Redmi");
    await user.type(
      screen.getByTestId("request.reportedIssue.textarea"),
      "No carga",
    );
    await user.click(screen.getByTestId("request.submit_button"));

    expect(
      await screen.findByTestId("request.phone.error"),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });
});
