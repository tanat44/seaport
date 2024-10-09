import { Vector2, Vector3 } from "three";
import { Qc } from "../QC/Qc";
import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { Terminal } from "../Terminal/Terminal";
import { Truck } from "../Truck/Truck";
import { TruckManager } from "../Truck/TruckManager";
import { CargoOrder } from "../Vessel/types";
import { Vessel } from "../Vessel/Vessel";
import { YardManager } from "../Yard/YardManager";
import { JobSequence } from "./Definition/JobSequence";
import {
  QcDropContainerToTruckJob,
  QcPickContainerFromVesselJob,
} from "./Definition/QcJob";
import {
  RtgDropContainerInYardJob,
  RtgPickContainerFromTruckJob,
} from "./Definition/RtgJob";
import {
  TruckContainerMoveToYardJob,
  TruckEmptyMoveJob,
} from "./Definition/TruckJob";

export class JobPlanner {
  terminal: Terminal;
  qcManager: QcManager;
  rtgManager: RtgManager;
  truckManager: TruckManager;
  yardManager: YardManager;

  constructor(
    terminal: Terminal,
    qcManager: QcManager,
    rtgManager: RtgManager,
    truckManager: TruckManager,
    yardManager: YardManager
  ) {
    this.terminal = terminal;
    this.qcManager = qcManager;
    this.rtgManager = rtgManager;
    this.truckManager = truckManager;
    this.yardManager = yardManager;
  }

  planUnloadJob(unloadPlan: CargoOrder, qc: Qc, vessel: Vessel): JobSequence[] {
    const jobs: JobSequence[] = [];
    for (const cargo of unloadPlan) {
      const containerJob = new JobSequence(cargo.containerId);

      // qc pick container
      const containerPosition = cargo.coordinate.relativePosition.add(
        vessel.position
      );
      const qcPickJob = new QcPickContainerFromVesselJob([]);
      qcPickJob.qcId = qc.id;
      qcPickJob.position = new Vector3(
        containerPosition.x,
        containerPosition.y - qc.position.y,
        containerPosition.z
      );
      qcPickJob.cargoCoordinate = cargo.coordinate;
      containerJob.addJob(qcPickJob);

      // qc drop off container
      const qcDropJob = new QcDropContainerToTruckJob([qcPickJob.id]);
      qcDropJob.qcId = qc.id;
      const qcDropPosition = new Vector3(
        containerPosition.x,
        0,
        Truck.containerLoadHeight()
      );
      qcDropJob.position = qcDropPosition;
      containerJob.addJob(qcDropJob);

      // truck standby under qc
      const truckEmptyMoveJob = new TruckEmptyMoveJob([]);
      truckEmptyMoveJob.to = new Vector2(qcDropPosition.x, qc.position.y);
      containerJob.addJob(truckEmptyMoveJob);

      // truck drive container to yard
      const storageCoor = this.yardManager.findStorage();
      const handlingPos =
        this.yardManager.getContainerHandlingPoint(storageCoor);
      const truckMoveContainerJob = new TruckContainerMoveToYardJob([
        qcDropJob.id,
        truckEmptyMoveJob.id,
      ]);
      truckMoveContainerJob.to = handlingPos.clone();
      containerJob.addJob(truckMoveContainerJob);

      // rtg move to standby position
      const rtgPickContainerJob = new RtgPickContainerFromTruckJob([
        qcDropJob.id,
      ]);
      const rtgId = this.rtgManager.findRtg(storageCoor.yardId);
      rtgPickContainerJob.rtgId = rtgId;
      rtgPickContainerJob.position = new Vector3(handlingPos.x, handlingPos.y);
      rtgPickContainerJob.yardCoordinate = storageCoor;
      containerJob.addJob(rtgPickContainerJob);

      // rtg store container in yard
      const yard = this.yardManager.getYard(storageCoor.yardId);
      const rtgStorageJob = new RtgDropContainerInYardJob([
        rtgPickContainerJob.id,
        truckMoveContainerJob.id,
      ]);
      rtgStorageJob.rtgId = rtgId;
      rtgStorageJob.position = yard.coordinateToRtgPosition(storageCoor);
      containerJob.addJob(rtgStorageJob);

      jobs.push(containerJob);
    }

    return jobs;
  }
}
