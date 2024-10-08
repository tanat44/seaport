import { Vector2, Vector3 } from "three";
import {
  QcMoveEndEvent,
  RtgMoveEndEvent,
  TruckDriveEndEvent,
} from "../Event/types";
import { PathPlanner } from "../PathPlanner/PathPlanner";
import { Qc } from "../QC/Qc";
import { QcManager } from "../QC/QcManager";
import {
  QcDropContainerToTruckJob,
  QcJob,
  QcPickContainerFromVesselJob,
} from "../QC/types";
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
  qcManager: QcManager;
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
    this.qcManager = new QcManager(this, layout.quayCraneOrigins);
    this.visualizer.onEvent<QcMoveEndEvent>("qcmoveend", (e) =>
      this.onQcMoveEnd(e)
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
    const quayCrane = this.qcManager.assignQuayCrane(vessel);

    // generate qc jobs
    const unloadPlan = vessel.planFullUnload();
    const qcY = quayCrane.position.y;
    const qcJobs: QcJob[] = [];
    for (const cargoCoordinate of unloadPlan) {
      const jobPosition = cargoCoordinate.relativePosition.add(vessel.position);

      // pick container
      const pickPosition = new Vector3(
        jobPosition.x,
        jobPosition.y - qcY,
        jobPosition.z
      );
      const pickJob: QcPickContainerFromVesselJob = {
        position: pickPosition,
        reason: "qcpickcontainerfromvessel",
        cargoCoordinate,
        truckId: undefined,
      };
      qcJobs.push(pickJob);

      // drop off container
      const dropPosition = new Vector3(
        jobPosition.x,
        0,
        Truck.containerLoadHeight()
      );
      const dropJob: QcDropContainerToTruckJob = {
        reason: "qcdropcontainertotruck",
        position: dropPosition,
        truckId: undefined,
      };
      qcJobs.push(dropJob);
    }

    this.qcManager.queueJobs(quayCrane.id, qcJobs);
    this.executeNextQuayCraneJob(quayCrane);
  }

  private executeNextQuayCraneJob(quayCrane: Qc) {
    const job = this.qcManager.nextJob(quayCrane.id);
    quayCrane.executeJob(job);

    // assign truck to qc when qc start moving to pick container
    if (job.reason === "qcpickcontainerfromvessel") {
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
          reason: "truckemptymove",
          truckId: truck.id,
          controlPoints: drivePath,
        };
        this.truckManager.execute(truckJob);

        // update pick job
        const pickJob = job as QcPickContainerFromVesselJob;
        pickJob.truckId = truck.id;

        // update next drop job
        this.qcManager.assignTruckIdToNextDropJob(quayCrane.id, truck.id);
      });
    }
  }

  private onQcMoveEnd(e: QcMoveEndEvent) {
    // console.log(`QC#${e.quayCraneId} - Finished <${e.job.reason}>`);
    const qc = this.qcManager.getQuayCrane(e.quayCraneId);
    if (!qc) throw new Error("Cannot move unknown quay crane");

    // qc moved to pick container position at vessel

    if (e.job.reason === "qcpickcontainerfromvessel") {
      const job = e.job as QcPickContainerFromVesselJob;
      const vessel = this.qcManager.getAssignedVessel(e.quayCraneId);
      const container = vessel.unload(job.cargoCoordinate);
      qc.pickContainer(container);

      // qc moved to drop position on truck
    } else if (e.job.reason === "qcdropcontainertotruck") {
      const job = e.job as QcDropContainerToTruckJob;

      // load container on truck
      const container = qc.dropContainer();
      const truck = this.truckManager.getTruck(job.truckId);
      truck.load(container);

      // plan truck path
      const from = new Vector2(qc.position.x, qc.position.y);
      const yardCoordinate = this.yardManager.findStorage();
      const to = this.yardManager.getContainerHandlingPoint(yardCoordinate);
      const drivePath = this.pathPlanner.plan(from, to);

      // create truck job to deliver container to yard
      const truckJob: TruckContainerMoveToYardJob = {
        reason: "truckmovecontainertoyard",
        controlPoints: drivePath,
        truckId: job.truckId,
        yardCoordinate,
        container,
      };
      this.truckManager.execute(truckJob);

      // rtg job 1: move to container handling point
      const yard = this.yardManager.getYard(yardCoordinate.yardId);
      const handlingPosition = yard.getContainerHandlingPoint(yardCoordinate);

      const rtgId = this.rtgManager.findRtg(yard.id);
      const rtgJob: RtgPickContainerFromTruckJob = {
        reason: "rtgpickcontainerfromtruck",
        rtgId,
        position: yard.globalPositionToRtgPosition(
          new Vector3(handlingPosition.x, handlingPosition.y)
        ),
        truckId: job.truckId,
        yardCoordinate: yardCoordinate,
      };
      this.rtgManager.queueRtgJob(rtgJob);

      // rtg job 2: unload container to yard
      const storageJob: RtgDropContainerInYardJob = {
        reason: "rtgdropcontainerinyard",
        rtgId,
        position: yard.coordinateToRtgPosition(yardCoordinate),
        container,
      };
      this.rtgManager.queueRtgJob(storageJob);
    }

    this.executeNextQuayCraneJob(qc);
  }

  private onTruckDriveEnd(e: TruckDriveEndEvent) {
    // do nothing for now
  }

  private onRtgMoveEnd(e: RtgMoveEndEvent) {
    const rtg = this.rtgManager.getRtg(e.rtgId);
    if (e.job.reason === "rtgpickcontainerfromtruck") {
      const job = e.job as RtgPickContainerFromTruckJob;

      // unload container
      const truck = this.truckManager.getTruck(job.truckId);
      if (!truck) throw new Error("Rtg move to truck but cannot find truck");
      const container = truck.unload();
      rtg.pickContainer(container);

      // release truck
      this.truckManager.releaseTruck(job.truckId);
    } else if (e.job.reason === "rtgdropcontainerinyard") {
      const container = rtg.dropContainer();
    }
  }
}
