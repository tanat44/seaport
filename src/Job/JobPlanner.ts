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
import { HandoverContainerQcUnloadTruckLoad } from "./Definition/HanoverJob";
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
    const sequences: JobSequence[] = [];
    for (const cargo of unloadPlan) {
      const sequence = new JobSequence(cargo.containerId);

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
      sequence.addJob(qcPickJob);

      // qc drop off container
      const qcDropJob = new QcDropContainerToTruckJob([qcPickJob.id]);
      qcDropJob.qcId = qc.id;
      const qcDropPosition = new Vector3(
        containerPosition.x,
        0,
        Truck.containerLoadHeight()
      );
      qcDropJob.position = qcDropPosition;
      sequence.addJob(qcDropJob);

      // truck standby under qc
      const truckEmptyMoveJob = new TruckEmptyMoveJob([]);
      truckEmptyMoveJob.to = new Vector2(qcDropPosition.x, qc.position.y);
      sequence.addJob(truckEmptyMoveJob);

      // handover qc unload truck load
      const handoverJob = new HandoverContainerQcUnloadTruckLoad([
        qcDropJob.id,
        truckEmptyMoveJob.id,
      ]);
      handoverJob.qcId = qc.id;
      sequence.addJob(handoverJob);

      // truck drive container to yard
      const storageCoor = this.yardManager.findStorage();
      const handlingPos =
        this.yardManager.getContainerHandlingPoint(storageCoor);
      const truckMoveContainerJob = new TruckContainerMoveToYardJob([
        handoverJob.id,
      ]);
      truckMoveContainerJob.qcId = qc.id;
      truckMoveContainerJob.to = handlingPos.clone();
      sequence.addJob(truckMoveContainerJob);

      // rtg move to standby position
      const rtgPickContainerJob = new RtgPickContainerFromTruckJob([
        qcDropJob.id,
      ]);
      const rtgId = this.rtgManager.findRtg(storageCoor.yardId);
      rtgPickContainerJob.rtgId = rtgId;
      rtgPickContainerJob.position = new Vector3(handlingPos.x, handlingPos.y);
      rtgPickContainerJob.yardCoordinate = storageCoor;
      sequence.addJob(rtgPickContainerJob);

      // rtg store container in yard
      const yard = this.yardManager.getYard(storageCoor.yardId);
      const rtgStorageJob = new RtgDropContainerInYardJob([
        rtgPickContainerJob.id,
        truckMoveContainerJob.id,
      ]);
      rtgStorageJob.rtgId = rtgId;
      rtgStorageJob.position = yard.coordinateToRtgPosition(storageCoor);
      sequence.addJob(rtgStorageJob);

      // add to sequences
      sequences.push(sequence);
    }

    return sequences;
  }
}
