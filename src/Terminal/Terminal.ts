import { Vector2, Vector3 } from "three";
import { QuayCraneMoveEndEvent } from "../Event/types";
import { PlannerGrid } from "../PathPlanner/PlannerGrid";
import { QuayCrane } from "../QuayCrane/QuayCrane";
import { QuayCraneJob, QuayCranePickContainerJob } from "../QuayCrane/types";
import { Visualizer } from "../Visualizer/Visualizer";
import { LayoutManager } from "./LayoutManager";
import { Vessel } from "./Vessel";

const VESSEL_NAME = "tennis";
export class Terminal {
  visualizer: Visualizer;
  layoutManager: LayoutManager;
  plannerGrid: PlannerGrid;

  // equipment
  vessels: Map<string, Vessel>;
  quayCranes: Map<number, QuayCrane>;

  // operation
  quayCraneVesselAssignment: Map<QuayCrane, Vessel>;
  quayCraneJobs: Map<QuayCrane, QuayCraneJob[]>;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.layoutManager = new LayoutManager(visualizer);
    this.quayCraneVesselAssignment = new Map();
    this.quayCraneJobs = new Map();
    this.init();
  }

  private async init() {
    // wait for layout to load
    const layout = await this.layoutManager.load();

    // init planner
    this.plannerGrid = new PlannerGrid(this, this.visualizer, layout);

    // init vessel
    this.vessels = new Map();
    this.vessels.set(
      VESSEL_NAME,
      new Vessel(this, VESSEL_NAME, 10, 50, 12, 70, layout)
    );

    // init quay cranes
    this.quayCranes = new Map();
    for (const qcOrigin of layout.quayCraneOrigins) {
      const qc = this.addQuayCrane(qcOrigin);
    }
    this.visualizer.onEvent<QuayCraneMoveEndEvent>("quaycranemoveend", (e) =>
      this.quayCraneMoveEnd(e)
    );

    // start operation
    this.operate();
  }

  getQuayCrane(id: number) {
    return this.quayCranes.get(id);
  }

  private operate() {
    const vessel = this.vessels.get(VESSEL_NAME);
    const quayCrane = this.findQuayCraneForVessel(vessel);
    this.quayCraneVesselAssignment.set(quayCrane, vessel);

    // generate qc jobs
    const unloadPlan = vessel.planUnload();
    const qcY = quayCrane.position.y;
    const qcJobs: QuayCraneJob[] = [];
    for (const cargoCoordinate of unloadPlan) {
      const jobPosition = cargoCoordinate.relativePosition.add(vessel.position);

      // pick container
      const pickPosition = new Vector3(
        jobPosition.x,
        jobPosition.y - qcY,
        jobPosition.z
      );
      const pickJob: QuayCranePickContainerJob = {
        position: pickPosition,
        reason: "pickcontainerfromvessel",
        cargoCoordinate,
      };
      qcJobs.push(pickJob);

      // drop off container
      const dropPosition = new Vector3(jobPosition.x, 0, 0);
      qcJobs.push({
        position: dropPosition,
        reason: "unloadcontaineronground",
      });
    }

    this.quayCraneJobs.set(quayCrane, qcJobs);
    this.executeNextQuayCraneJob(quayCrane);
  }

  private findQuayCraneForVessel(vessel: Vessel): QuayCrane {
    const vesselSpace = vessel.absoluteSpace;
    const vesselCenter = new Vector2();
    vesselSpace.getCenter(vesselCenter);

    let minDistance = Infinity;
    let bestQc: QuayCrane = null;

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

  private executeNextQuayCraneJob(quayCrane: QuayCrane) {
    const jobs = this.quayCraneJobs.get(quayCrane);

    if (jobs === undefined || jobs.length === 0) {
      console.log("No more job for quaycrane", quayCrane.id);
      return;
    }

    const vessel = this.quayCraneVesselAssignment.get(quayCrane);
    if (!vessel)
      throw new Error("No vessel assign for this quay crane to work on");

    // do the first job in queue
    const job = jobs.shift();
    quayCrane.executeJob(job);
  }

  private addQuayCrane(position: Vector3): QuayCrane {
    const qc = new QuayCrane(this.visualizer, position);
    this.quayCranes.set(qc.id, qc);
    return qc;
  }

  private quayCraneMoveEnd(e: QuayCraneMoveEndEvent) {
    const qc = this.quayCranes.get(e.quayCraneId);
    if (!qc) throw new Error("Cannot move unknown quay crane");

    console.log(`QC#${e.quayCraneId} - Finished <${e.job.reason}>`);
    if (e.job.reason === "pickcontainerfromvessel") {
      const job = e.job as QuayCranePickContainerJob;
      const vessel = this.quayCraneVesselAssignment.get(qc);
      vessel.unload(job.cargoCoordinate);
    }

    this.executeNextQuayCraneJob(qc);
  }
}