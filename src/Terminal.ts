import { Vector3 } from "three";
import { QuayCrane } from "./Equipment/QuayCrane";
import { QuayCraneMoveEndEvent } from "./Event/types";
import { LayoutManager } from "./LayoutManager";
import { Manager } from "./Manager";

export class Terminal {
  manager: Manager;
  layout: LayoutManager;
  quayCranes: Map<number, QuayCrane>;

  constructor(manager: Manager) {
    this.manager = manager;

    this.layout = new LayoutManager(manager);

    // init quay cranes on layout spot
    this.quayCranes = new Map();
    this.layout.load().then((layout) => {
      for (const qcOrigin of layout.quayCraneOrigins) {
        this.moveQuayCrane(this.addQuayCrane(qcOrigin));
      }
    });

    this.manager.onEvent<QuayCraneMoveEndEvent>("quaycranemoveend", (e) =>
      this.quayCraneMoveEnd(e.quayCraneId)
    );
  }

  addQuayCrane(position: Vector3): number {
    const qc = new QuayCrane(this.manager, position);
    this.quayCranes.set(qc.id, qc);
    return qc.id;
  }

  moveQuayCrane(quayCraneId: number) {
    const qc = this.quayCranes.get(quayCraneId);
    if (!qc) throw new Error("Cannot move unknown quay crane");

    const GANTRY_RANGE = 5;
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
