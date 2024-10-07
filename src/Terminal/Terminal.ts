import { Vector2, Vector3 } from "three";
import {
  QuayCraneMoveEndEvent,
  RtgMoveEndEvent,
  TruckDriveEndEvent,
} from "../Event/types";
import { PathPlanner } from "../PathPlanner/PathPlanner";
import { QuayCrane } from "../QuayCrane/QuayCrane";
import { QuayCraneManager } from "../QuayCrane/QuayCraneManager";
import {
  QuayCraneDropContainerToTruckJob,
  QuayCraneJob,
  QuayCranePickContainerFromVesselJob,
} from "../QuayCrane/types";
import { RtgManager } from "../RTG/RtgManager";
import {
  RtgDropContainerInYardJob,
  RtgPickContainerFromTruckJob,
} from "../RTG/types";
import { Truck } from "../Truck/Truck";
import { TruckManager } from "../Truck/TruckManager";
import { TruckContainerMoveToYardJob, TruckEmptyMoveJob } from "../Truck/types";
import { Vessel } from "../Vessel/Vessel";
import { Visualizer } from "../Visualizer/Visualizer";
import { YardManager } from "../Yard/YardManager";
import { LayoutManager } from "./LayoutManager";

const VESSEL_NAME = "Vessel-Polo";
export class Terminal {
  visualizer: Visualizer;
  layoutManager: LayoutManager;
  pathPlanner: PathPlanner;

  // storage
  vessels: Map<string, Vessel>;
  yardManager: YardManager;

  // equipment
  quayCraneManager: QuayCraneManager;
  rtgManager: RtgManager;
  truckManager: TruckManager;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.layoutManager = new LayoutManager(visualizer);
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
    this.quayCraneManager = new QuayCraneManager(this, layout.quayCraneOrigins);
    this.visualizer.onEvent<QuayCraneMoveEndEvent>("quaycranemoveend", (e) =>
      this.onQuayCraneMoveEnd(e)
    );

    // init rtgs
    this.rtgManager = new RtgManager(this, this.yardManager.allYards);
    this.visualizer.onEvent<RtgMoveEndEvent>("rtgmoveend", (e) =>
      this.onRtgMoveEnd(e)
    );

    // init truck
    this.truckManager = new TruckManager(this);
    this.visualizer.onEvent<TruckDriveEndEvent>("truckdriveend", (e) =>
      this.onTruckDriveEnd(e)
    );

    // start operation
    this.operate();
  }

  private operate() {
    const vessel = this.vessels.get(VESSEL_NAME);
    const quayCrane = this.quayCraneManager.assignQuayCrane(vessel);

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
      const pickJob: QuayCranePickContainerFromVesselJob = {
        position: pickPosition,
        reason: "pickcontainerfromvessel",
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
      const dropJob: QuayCraneDropContainerToTruckJob = {
        reason: "dropcontainertotruck",
        position: dropPosition,
        container: undefined,
        truckId: undefined,
      };
      qcJobs.push(dropJob);
    }

    this.quayCraneManager.queueJobs(quayCrane.id, qcJobs);
    this.executeNextQuayCraneJob(quayCrane);
  }

  private executeNextQuayCraneJob(quayCrane: QuayCrane) {
    const job = this.quayCraneManager.nextJob(quayCrane.id);
    quayCrane.executeJob(job);

    // assign truck to qc when qc start moving to pick container
    if (job.reason === "pickcontainerfromvessel") {
      const pickJob = job as QuayCranePickContainerFromVesselJob;
      const underQcPosition = new Vector2(
        quayCrane.position.x,
        quayCrane.position.y
      );
      this.truckManager.getAvailableTruck(underQcPosition).then((truck) => {
        const drivePath = this.pathPlanner.plan(
          truck.position,
          underQcPosition
        );

        // create truck empty move job
        const truckJob: TruckEmptyMoveJob = {
          reason: "emptymove",
          truckId: truck.id,
          controlPoints: drivePath,
        };
        this.truckManager.execute(truckJob);
      });
    }
  }

  private onQuayCraneMoveEnd(e: QuayCraneMoveEndEvent) {
    // console.log(`QC#${e.quayCraneId} - Finished <${e.job.reason}>`);
    const qc = this.quayCraneManager.getQuayCrane(e.quayCraneId);
    if (!qc) throw new Error("Cannot move unknown quay crane");

    // qc moved to pick container position at vessel

    if (e.job.reason === "pickcontainerfromvessel") {
      const job = e.job as QuayCranePickContainerFromVesselJob;
      const vessel = this.quayCraneManager.getAssignedVessel(e.quayCraneId);
      const container = vessel.unload(job.cargoCoordinate);
      qc.pickContainer(container);

      // qc moved to drop position on truck
    } else if (e.job.reason === "dropcontainertotruck") {
      const job = e.job as QuayCraneDropContainerToTruckJob;
      const container = qc.dropContainer();

      // plan truck path
      const from = new Vector2(qc.position.x, qc.position.y);
      const yardCoordinate = this.yardManager.findStorage();
      const to = this.yardManager.getContainerHandlingPoint(yardCoordinate);
      const drivePath = this.pathPlanner.plan(from, to);

      // create truck job to deliver container to yard
      const truckJob: TruckContainerMoveToYardJob = {
        reason: "movecontainertoyard",
        controlPoints: drivePath,
        truckId: job.truckId,
        yardCoordinate,
        container,
      };
      this.truckManager.execute(truckJob);
    }

    this.executeNextQuayCraneJob(qc);
  }

  private onTruckDriveEnd(e: TruckDriveEndEvent) {
    const truck = this.truckManager.getTruck(e.truckId);

    // truck arrive at yard. ready to unload to rtg
    if (e.job.reason === "movecontainertoyard") {
      const job = e.job as TruckContainerMoveToYardJob;

      // create rtg job to prepare to pickup from truck
      const rtgJob: RtgPickContainerFromTruckJob = {
        reason: "pickcontainerfromtruck",
        rtgId: this.rtgManager.findRtg(job.yardCoordinate.yardId),
        position: new Vector3(truck.position.x, truck.position.y, 0),
        truckId: e.truckId,
        yardCoordinate: job.yardCoordinate,
      };
      this.rtgManager.queueRtgJob(rtgJob);
    }
  }

  private onRtgMoveEnd(e: RtgMoveEndEvent) {
    if (e.job.reason === "pickcontainerfromtruck") {
      const job = e.job as RtgPickContainerFromTruckJob;

      // unload container
      const truck = this.truckManager.getTruck(job.truckId);
      if (!truck) throw new Error("Rtg move to truck but cannot find truck");
      const container = truck.unload();
      this.truckManager.releaseTruck(job.truckId);

      // create storage job for rtg
      const yardId = this.rtgManager.findYard(job.rtgId);
      const position = job.yardCoordinate.relativePosition;
      const storageJob: RtgDropContainerInYardJob = {
        reason: "dropcontainerinyard",
        rtgId: job.rtgId,
        position,
        container,
      };
      this.rtgManager.queueRtgJob(storageJob);

      // release truck
      this.truckManager.releaseTruck(job.truckId);
    }
  }
}
