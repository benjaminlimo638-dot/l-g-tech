import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Generated components use `data-ocid` as their stable test hook.
configure({ testIdAttribute: "data-ocid" });

// Vitest runs without `globals: true`, so React Testing Library cannot
// auto-register its cleanup hook. Without this, each `render` appends to the
// same document and queries match elements from earlier tests.
afterEach(() => {
  cleanup();
});
