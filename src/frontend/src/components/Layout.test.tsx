import { Layout } from "@/components/Layout";
import { WORKSHOP } from "@/lib/repair";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Render the shared shell with a trivial child route so the footer is mounted
 * without depending on any page's own data fetching.
 */
function renderLayout() {
  const rootRoute = createRootRoute({ component: Layout });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <div>Contenido</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("Layout footer", () => {
  it("shows the accepted workshop address", async () => {
    renderLayout();
    // Pin the accepted literal so a wrong constant cannot pass by matching
    // itself; the constant is also asserted directly in repair.test.ts.
    expect(
      await screen.findByText("Av. Huamachuco #736 Lambayeque"),
    ).toBeInTheDocument();
    expect(WORKSHOP.address).toBe("Av. Huamachuco #736 Lambayeque");
  });

  it("keeps the other footer contact details intact", async () => {
    renderLayout();
    expect(await screen.findByTestId("footer.phone_link")).toHaveTextContent(
      WORKSHOP.phone,
    );
    expect(screen.getByTestId("footer.email_link")).toHaveTextContent(
      WORKSHOP.email,
    );
    expect(screen.getByText(WORKSHOP.hours)).toBeInTheDocument();
  });
});
