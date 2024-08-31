import { Vector3 } from "three";
import { Manager } from "./Manager";
import { QuayCrane } from "./QuayCrane";
import { QuayCraneMoveEndEvent } from "./Event/types";

export class Terminal {
  manager: Manager;
  quayCranes: Map<number, QuayCrane>;

  constructor(manager: Manager) {
    this.manager = manager;
    this.quayCranes = new Map();
    this.moveQuayCrane(this.addQuayCrane(new Vector3(-30, 0, 0)));
    this.moveQuayCrane(this.addQuayCrane(new Vector3(0, 0, 0)));
    this.moveQuayCrane(this.addQuayCrane(new Vector3(30, 0, 0)));
    this.moveQuayCrane(this.addQuayCrane(new Vector3(60, 0, 0)));

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
