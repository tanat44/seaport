import { Vector2, Vector3 } from "three";
import { QcJob } from "../Job/Definition/QcJob";
import { Terminal } from "../Terminal/Terminal";
import { Vessel } from "../Vessel/Vessel";
import { Qc } from "./Qc";

export class QcManager {
  private terminal: Terminal;
  private quayCranes: Map<string, Qc>;

  // operation
  private vessels: Map<Qc, Vessel>;

  constructor(terminal: Terminal, origins: Vector3[]) {
    this.terminal = terminal;
    this.quayCranes = new Map();
    for (const qcOrigin of origins) {
      const qc = this.addQuayCrane(qcOrigin);
      this.quayCranes.set(qc.id, qc);
    }

    this.vessels = new Map();
  }

  getQuayCrane(id: string) {
    return this.quayCranes.get(id);
  }

  assignQuayCrane(vessel: Vessel): Qc {
    const qc = this.findQuayCraneForVessel(vessel);
    this.vessels.set(qc, vessel);
    return qc;
  }

  getAssignedVessel(quayCraneId: string): Vessel {
    const qc = this.getQuayCrane(quayCraneId);
    if (!qc) throw new Error("Cannot get vessel of undefined quay crane");

    return this.vessels.get(qc);
  }

  execute(job: QcJob): boolean {
    const qc = this.getQuayCrane(job.qcId);
    if (qc.idle) {
      qc.execute(job);
      return true;
    }

    return false;
  }

  private addQuayCrane(position: Vector3): Qc {
    const qc = new Qc(this.terminal.visualizer, position);
    this.quayCranes.set(qc.id, qc);
    return qc;
  }

  private findQuayCraneForVessel(vessel: Vessel): Qc {
    const vesselSpace = vessel.absoluteSpace;
    const vesselCenter = new Vector2();
    vesselSpace.getCenter(vesselCenter);

    let minDistance = Infinity;
    let bestQc: Qc = null;

    for (const [_, qc] of this.quayCranes) {
      const qcSpace = qc.absoluteSpace;
      const center = new Vector2();
      qcSpace.getCenter(center);

      const distance = Math.abs(vesselCenter.x - center.x);
      if (distance < minDistance) {
        minDistance = distance;
        bestQc = qc;
      }
    }
    return bestQc;
  }
}
