import { WORKSHOP, whatsAppLink } from "@/lib/repair";
import { HomePage } from "@/pages/HomePage";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/** Escape a literal string for safe use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Render a page inside a minimal memory router so `Link`/`useSearch` resolve.
 * Only the page under test is mounted, keeping the journey focused on the
 * page's own behavior.
 */
function renderPage(component: () => React.ReactElement, initialPath = "/") {
  const rootRoute = createRootRoute();
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component,
  });
  const requestRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/solicitar",
    component: () => <div>Solicitar</div>,
  });
  const lookupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/consultar",
    component: () => <div>Consultar</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute, requestRoute, lookupRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("HomePage", () => {
  it("shows the brand logo and the service headline", async () => {
    renderPage(HomePage);
    expect(
      await screen.findByRole("img", {
        name: /Logotipo de L&G TECH/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Servicio Técnico de\s*Celulares/i }),
    ).toBeInTheDocument();
  });

  it("offers the main customer actions", async () => {
    renderPage(HomePage);
    expect(
      await screen.findByTestId("home.action.solicitar"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("home.action.consultar")).toBeInTheDocument();
    expect(screen.getByTestId("home.action.fotos")).toBeInTheDocument();
    expect(screen.getByTestId("home.action.precio")).toBeInTheDocument();
  });

  it("shows the accepted workshop address in the contact section", async () => {
    renderPage(HomePage);
    // The contact copy embeds WORKSHOP.address; pin the accepted literal so a
    // wrong constant cannot pass by matching itself.
    expect(
      await screen.findByText(
        new RegExp(escapeRegExp("Av. Huamachuco #736 Lambayeque")),
      ),
    ).toBeInTheDocument();
    expect(WORKSHOP.address).toBe("Av. Huamachuco #736 Lambayeque");
  });

  it("links the WhatsApp contact button to the workshop number", async () => {
    renderPage(HomePage);
    const link = await screen.findByTestId("home.whatsapp_button");
    expect(link).toHaveAttribute(
      "href",
      whatsAppLink(
        WORKSHOP.phone,
        "Hola L&G TECH, tengo una consulta sobre mi celular.",
      ),
    );
    expect(link.getAttribute("href")).toContain("wa.me/34600123456");
  });
});
