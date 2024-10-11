import { Vector2, Vector3 } from "three";
import { Qc } from "../QC/Qc";
import { Truck } from "../Truck/Truck";
import { CargoOrder } from "../Vessel/types";
import { Vessel } from "../Vessel/Vessel";
import {
  HandoverQcToTruckJob,
  HandoverRtgToYardJob,
  HandoverTruckToRtgJob,
} from "./Definition/HanoverJob";
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
import { TerminalControl } from "./TerminalControl";

export class JobPlanner extends TerminalControl {
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
      const handoverQcJob = new HandoverQcToTruckJob([
        qcDropJob.id,
        truckEmptyMoveJob.id,
      ]);
      handoverQcJob.qcId = qc.id;
      sequence.addJob(handoverQcJob);

      // truck drive container to yard
      const storageCoor = this.yardManager.findStorage();
      const handlingPos =
        this.yardManager.getContainerHandlingPoint(storageCoor);
      const truckDriveToRtgJob = new TruckContainerMoveToYardJob([
        handoverQcJob.id,
      ]);
      truckDriveToRtgJob.qcId = qc.id;
      truckDriveToRtgJob.to = handlingPos.clone();
      sequence.addJob(truckDriveToRtgJob);

      // rtg move to standby position
      const rtgPickContainerJob = new RtgPickContainerFromTruckJob([
        handoverQcJob.id,
      ]);
      const rtgId = this.rtgManager.findRtg(storageCoor.yardId);
      const yard = this.yardManager.getYard(storageCoor.yardId);
      const rtgPickPosition = yard.globalPositionToRtgPosition(
        new Vector3(handlingPos.x, handlingPos.y)
      );
      if (rtgPickPosition.y < 0) rtgPickPosition.y = 0;
      rtgPickContainerJob.rtgId = rtgId;
      rtgPickContainerJob.position = rtgPickPosition;
      rtgPickContainerJob.yardCoordinate = storageCoor;
      sequence.addJob(rtgPickContainerJob);

      // handover truck to rtg
      const handoverTruckJob = new HandoverTruckToRtgJob([
        rtgPickContainerJob.id,
        truckDriveToRtgJob.id,
      ]);
      handoverTruckJob.rtgId = rtgId;
      sequence.addJob(handoverTruckJob);

      // rtg store container in yard
      const rtgStorageJob = new RtgDropContainerInYardJob([
        handoverTruckJob.id,
      ]);
      rtgStorageJob.rtgId = rtgId;
      rtgStorageJob.position = yard.coordinateToRtgPosition(storageCoor);
      sequence.addJob(rtgStorageJob);

      // handover rtg to yard
      const handoverRtgJob = new HandoverRtgToYardJob([rtgStorageJob.id]);
      handoverRtgJob.rtgId = rtgId;
      handoverRtgJob.yardId = yard.id;
      handoverRtgJob.yardCoordinate = storageCoor;
      sequence.addJob(handoverRtgJob);

      // add to sequences
      sequences.push(sequence);
    }

    return sequences;
  }
}
