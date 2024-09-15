import { Vector3 } from "three";
import { QuayCrane } from "../Equipment/QuayCrane";
import { QuayCraneMoveEndEvent } from "../Event/types";
import { PlannerGrid } from "../RoutePlanner/PlannerGrid";
import { Visualizer } from "../Visualizer/Visualizer";
import { LayoutManager } from "./LayoutManager";

export class Terminal {
  visualizer: Visualizer;
  layoutManager: LayoutManager;
  quayCranes: Map<number, QuayCrane>;
  plannerGrid: PlannerGrid;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;

    this.layoutManager = new LayoutManager(visualizer);

    // init quay cranes on layout spot
    this.quayCranes = new Map();
    this.layoutManager.load().then((layout) => {
      this.plannerGrid = new PlannerGrid(this, visualizer, layout);

      for (const qcOrigin of layout.quayCraneOrigins) {
        this.moveQuayCrane(this.addQuayCrane(qcOrigin));
      }
    });

    this.visualizer.onEvent<QuayCraneMoveEndEvent>("quaycranemoveend", (e) =>
      this.quayCraneMoveEnd(e.quayCraneId)
    );
  }

  addQuayCrane(position: Vector3): number {
    const qc = new QuayCrane(this.visualizer, position);
    this.quayCranes.set(qc.id, qc);
    return qc.id;
  }

  getQuayCrane(id: number) {
    return this.quayCranes.get(id);
  }

  moveQuayCrane(quayCraneId: number) {
    const qc = this.quayCranes.get(quayCraneId);
    if (!qc) throw new Error("Cannot move unknown quay crane");

    const GANTRY_RANGE = 20;
    const gantryDistance = Math.random() * GANTRY_RANGE - GANTRY_RANGE / 2;
    const trolleyDistance =
      Math.random() * (qc.legSpan + qc.outReach) - qc.legSpan / 2;
    const liftDistance = Math.random() * qc.height;

    qc.moveTo(
      new Vector3(
        gantryDistance + qc.control.position.x,
        trolleyDistance,
        liftDistance
      )
    );
  }

  quayCraneMoveEnd(quayCraneId: number) {
    this.moveQuayCrane(quayCraneId);
  }
}
