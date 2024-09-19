import { Vector2, Vector3 } from "three";
import { QuayCraneMoveEndEvent, TruckDriveEndEvent } from "../Event/types";
import { PathPlanner } from "../PathPlanner/PathPlanner";
import { QuayCrane } from "../QuayCrane/QuayCrane";
import { QuayCraneJob, QuayCranePickContainerJob } from "../QuayCrane/types";
import { Rtg } from "../RTG/Rtg";
import { Truck } from "../Truck/Truck";
import { TruckManager } from "../Truck/TruckManager";
import { Vessel } from "../Vessel/Vessel";
import { Visualizer } from "../Visualizer/Visualizer";
import { YardBlock } from "../Yard/YardBlock";
import { YardManager } from "../Yard/YardManager";
import { LayoutManager } from "./LayoutManager";
import { CONTAINER_SIZE_Y, CONTAINER_SIZE_Z } from "./const";

const VESSEL_NAME = "Vessel-Polo";
export class Terminal {
  visualizer: Visualizer;
  layoutManager: LayoutManager;
  pathPlanner: PathPlanner;

  // storage
  vessels: Map<string, Vessel>;
  yardManager: YardManager;

  // equipment
  quayCranes: Map<string, QuayCrane>;
  rtgs: Map<string, Rtg>;
  truckManager: TruckManager;

  // operation
  quayCraneVesselAssignment: Map<QuayCrane, Vessel>;
  quayCraneJobs: Map<QuayCrane, QuayCraneJob[]>;
  containerIdTruckAssignment: Map<string, Truck>;
  rtgYardAssignment: Map<Rtg, YardBlock>;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.layoutManager = new LayoutManager(visualizer);
    this.quayCraneVesselAssignment = new Map();
    this.quayCraneJobs = new Map();
    this.containerIdTruckAssignment = new Map();
    this.rtgYardAssignment = new Map();
    this.init();
  }

  private async init() {
    // wait for layout to load
    const layout = await this.layoutManager.load();

    // init planner
    this.pathPlanner = new PathPlanner(this, layout);

    // init vessel
    this.vessels = new Map();
    this.vessels.set(
      VESSEL_NAME,
      new Vessel(this, VESSEL_NAME, 10, 50, 12, 70, layout)
    );

    // init yard
    this.yardManager = new YardManager(this, layout);

    // init quay cranes
    this.quayCranes = new Map();
    for (const qcOrigin of layout.quayCraneOrigins) {
      const qc = this.addQuayCrane(qcOrigin);
    }
    this.visualizer.onEvent<QuayCraneMoveEndEvent>("quaycranemoveend", (e) =>
      this.onQuayCraneMoveEnd(e)
    );

    // init rtgs
    this.rtgs = new Map();
    for (const yard of this.yardManager.allYards) {
      const truckLaneSize = CONTAINER_SIZE_Y * 2;
      const initPosition = yard.position;
      initPosition.y -= truckLaneSize;
      const rtg = new Rtg(
        this.visualizer,
        initPosition,
        7,
        yard.height + CONTAINER_SIZE_Z,
        yard.depth + truckLaneSize
      );
      // rtg.executeJob({ position: new Vector3(0, 0, 0), reason: "move" });
      this.rtgs.set(rtg.id, rtg);
      this.rtgYardAssignment.set(rtg, yard);
    }

    // init truck
    this.truckManager = new TruckManager(this);
    this.visualizer.onEvent<TruckDriveEndEvent>("truckdriveend", (e) =>
      this.onTruckDriveEnd(e)
    );

    // start operation
    this.operate();
  }

  getQuayCrane(id: string) {
    return this.quayCranes.get(id);
  }

  private operate() {
    const vessel = this.vessels.get(VESSEL_NAME);
    const quayCrane = this.findQuayCraneForVessel(vessel);
    this.quayCraneVesselAssignment.set(quayCrane, vessel);

    // generate qc jobs
    const unloadPlan = vessel.planFullUnload();
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
        reason: "pickcontainer",
        cargoCoordinate,
        containerId: vessel.getContainerId(cargoCoordinate),
      };
      qcJobs.push(pickJob);

      // drop off container
      const dropPosition = new Vector3(
        jobPosition.x,
        0,
        Truck.containerLoadHeight()
      );
      qcJobs.push({
        position: dropPosition,
        reason: "dropcontainer",
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

    // assign truck to qc when qc start moving to pick container
    if (job.reason === "pickcontainer") {
      const pickJob = job as QuayCranePickContainerJob;
      const underQcPosition = new Vector2(
        quayCrane.position.x,
        quayCrane.position.y
      );
      this.truckManager.getAvailableTruck(underQcPosition).then((truck) => {
        const drivePath = this.pathPlanner.plan(
          truck.position,
          underQcPosition
        );
        truck.drive(drivePath);
        this.containerIdTruckAssignment.set(pickJob.containerId, truck);
      });
    }
  }

  private addQuayCrane(position: Vector3): QuayCrane {
    const qc = new QuayCrane(this.visualizer, position);
    this.quayCranes.set(qc.id, qc);
    return qc;
  }

  private onQuayCraneMoveEnd(e: QuayCraneMoveEndEvent) {
    const qc = this.quayCranes.get(e.quayCraneId);
    if (!qc) throw new Error("Cannot move unknown quay crane");

    // console.log(`QC#${e.quayCraneId} - Finished <${e.job.reason}>`);

    if (e.job.reason === "pickcontainer") {
      // pick container from vessel
      const job = e.job as QuayCranePickContainerJob;
      const vessel = this.quayCraneVesselAssignment.get(qc);
      const container = vessel.unload(job.cargoCoordinate);
      qc.pickContainer(container);
    } else if (e.job.reason === "dropcontainer") {
      // qc drop container
      const container = qc.dropContainer();

      // plan truck path
      const from = new Vector2(qc.position.x, qc.position.y);
      const yardCoordinate = this.yardManager.findStorage();
      const to = this.yardManager.getContainerHandlingPoint(yardCoordinate);
      const drivePath = this.pathPlanner.plan(from, to);

      const truck = this.containerIdTruckAssignment.get(container.id);
      if (!truck)
        throw new Error(
          "No truck is assign to this drop container from quay crane"
        );

      truck.load(container);
      truck.drive(drivePath);
      this.containerIdTruckAssignment.delete(container.id);
    }

    this.executeNextQuayCraneJob(qc);
  }

  private onTruckDriveEnd(e: TruckDriveEndEvent) {
    for (const [containerId, truck] of this.containerIdTruckAssignment) {
      if (truck.id === e.truckId) {
        // truck is waiting for container.
        return;
      }
    }

    // this truck doesn't wait for container, release it to available pool
    this.truckManager.releaseTruck(e.truckId);

    const truck = this.truckManager.getTruck(e.truckId);
    truck.unload();
  }
}
