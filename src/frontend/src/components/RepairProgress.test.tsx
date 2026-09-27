import { RepairStatus } from "@/backend";
import { RepairProgress } from "@/components/RepairProgress";
import { REPAIR_STAGES, STAGE_LABELS } from "@/lib/repair";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("RepairProgress", () => {
  it("renders all six stages", () => {
    render(<RepairProgress status={RepairStatus.Recibido} />);
    for (const stage of REPAIR_STAGES) {
      // Each stage label appears in both the desktop and mobile traces.
      expect(screen.getAllByText(STAGE_LABELS[stage]).length).toBeGreaterThan(
        0,
      );
    }
  });

  it("announces the current stage for assistive technology", () => {
    render(<RepairProgress status={RepairStatus.EnReparacion} />);
    expect(
      screen.getByLabelText("Etapa actual: En reparación"),
    ).toBeInTheDocument();
  });

  it("marks the current stage and leaves future stages unmarked", () => {
    render(<RepairProgress status={RepairStatus.Probando} />);
    // Probando is index 3, so stages 1-3 are done and stage 4 is current.
    const current = screen.getAllByTestId("repair.progress.stage.4");
    expect(current.length).toBeGreaterThan(0);
    for (const node of current) {
      expect(node).toHaveAttribute("data-ocid", "repair.progress.stage.4");
    }
  });
});
