import { Vector2, Vector3 } from "three";
import { Terminal } from "../Terminal/Terminal";
import { Vessel } from "../Vessel/Vessel";
import { Qc } from "./Qc";
import { QcDropContainerToTruckJob, QcJob } from "./types";

export class QcManager {
  private terminal: Terminal;
  private quayCranes: Map<string, Qc>;

  // operation
  private vessels: Map<Qc, Vessel>;
  private jobQueues: Map<Qc, QcJob[]>;

  constructor(terminal: Terminal, origins: Vector3[]) {
    this.terminal = terminal;
    this.quayCranes = new Map();
    this.jobQueues = new Map();
    for (const qcOrigin of origins) {
      const qc = this.addQuayCrane(qcOrigin);
      this.quayCranes.set(qc.id, qc);
      this.jobQueues.set(qc, []);
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

  queueJobs(quayCraneId: string, jobs: QcJob[]) {
    const queue = this.jobQueues.get(this.getQuayCrane(quayCraneId));

    if (!queue)
      throw new Error("Unable to assign jobs to undefined quay crane queue");

    queue.push(...jobs);
  }

  getAssignedVessel(quayCraneId: string): Vessel {
    const qc = this.getQuayCrane(quayCraneId);
    if (!qc) throw new Error("Cannot get vessel of undefined quay crane");

    return this.vessels.get(qc);
  }

  nextJob(quayCraneId: string): QcJob {
    const qc = this.getQuayCrane(quayCraneId);
    const jobs = this.jobQueues.get(qc);

    if (!jobs || jobs.length === 0)
      throw new Error(`No more job for quay crane ${quayCraneId}`);
    return jobs.shift();
  }

  assignTruckIdToNextDropJob(quayCraneId: string, truckId: string) {
    const qc = this.getQuayCrane(quayCraneId);
    const jobs = this.jobQueues.get(qc);

    if (!qc || jobs.length === 0)
      throw new Error(`Cannot assign truck id to next drop job`);

    const firstJob = jobs[0];
    if (firstJob.reason !== "qcdropcontainertotruck")
      throw new Error(`Next quay crane job isn't a drop job`);

    const dropJob = firstJob as QcDropContainerToTruckJob;
    dropJob.truckId = truckId;
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
