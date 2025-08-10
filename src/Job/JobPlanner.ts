import { Vector2, Vector3 } from "three";
import { TerminalManager } from "../Terminal/TerminalManager";
import { UnloadPlan } from "../Terminal/type";
import { Truck } from "../Truck/Truck";
import {
  HandoverQcToTruckJob,
  HandoverRtgToYardJob,
  HandoverTruckToRtgJob,
  HandoverVesselToQcJob,
} from "./Definition/HanoverJob";
import { JobSequence } from "./Definition/JobSequence";
import {
  QcDropContainerToTruckJob,
  QcPickContainerFromVesselJob,
  QcStandbyOverTruckJob,
} from "./Definition/QcJob";
import {
  RtgDropContainerInYardJob,
  RtgPickContainerFromTruckJob,
} from "./Definition/RtgJob";
import {
  TruckMoveContainerToYardJob,
  TruckMoveToQcStandby,
  TruckMoveToUnderQcJob,
} from "./Definition/TruckJob";

export class JobPlanner extends TerminalManager {
  planUnloadJob(plan: UnloadPlan): JobSequence {
    const cargo = plan.cargo;
    const sequence = new JobSequence(cargo.containerId);

    // qc pick container
    const qc = this.qcManager.getQuayCrane(plan.qcId);
    const containerPosition = cargo.coordinate.relativePosition.add(
      cargo.storage.position
    );
    const qcPickPosition = new Vector3(
      containerPosition.x,
      containerPosition.y - qc.position.y,
      containerPosition.z
    );
    const qcPickJob = new QcPickContainerFromVesselJob(
      [],
      qc.id,
      qcPickPosition,
      cargo.coordinate
    );
    sequence.addJob(qcPickJob);

    // truck move to standby
    const truckStandbyJob = new TruckMoveToQcStandby(
      [],
      this.trafficManager.standbyPoint.position.clone(),
      qc.id
    );
    sequence.addJob(truckStandbyJob);

    // handover vessel to qc
    const handoverVessel = new HandoverVesselToQcJob([qcPickJob.id]);
    handoverVessel.cargoCoordinate = cargo.coordinate;
    handoverVessel.qcId = qc.id;
    sequence.addJob(handoverVessel);

    // qc standby above drop off
    const qcStandbyJob = new QcStandbyOverTruckJob(
      [handoverVessel.id],
      qc.id,
      new Vector3(containerPosition.x, 0, 10)
    );
    sequence.addJob(qcStandbyJob);

    // truck move under qc
    const qcDropPosition = new Vector3(
      containerPosition.x,
      0,
      Truck.containerLoadHeight()
    );
    const truckMoveUnderQc = new TruckMoveToUnderQcJob(
      [qcStandbyJob.id, truckStandbyJob.id],
      new Vector2(qcDropPosition.x, qc.position.y)
    );
    sequence.addJob(truckMoveUnderQc);

    // qc drop off container
    const qcDropJob = new QcDropContainerToTruckJob(
      [truckMoveUnderQc.id],
      qc.id,
      qcDropPosition
    );
    sequence.addJob(qcDropJob);

    // handover qc unload truck load
    const handoverQcJob = new HandoverQcToTruckJob([qcDropJob.id]);
    handoverQcJob.qcId = qc.id;
    sequence.addJob(handoverQcJob);

    // truck drive container to yard
    const storageCoor = this.yardManager.findStorage();
    const handlingPos = this.yardManager.getContainerHandlingPoint(storageCoor);
    const truckDriveToRtgJob = new TruckMoveContainerToYardJob(
      [handoverQcJob.id],
      handlingPos.clone(),
      qc.id,
      storageCoor
    );
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
    const rtgStorageJob = new RtgDropContainerInYardJob([handoverTruckJob.id]);
    rtgStorageJob.rtgId = rtgId;
    rtgStorageJob.position = yard.coordinateToRtgPosition(storageCoor);
    sequence.addJob(rtgStorageJob);

    // handover rtg to yard
    const handoverRtgJob = new HandoverRtgToYardJob([rtgStorageJob.id]);
    handoverRtgJob.rtgId = rtgId;
    handoverRtgJob.yardId = yard.id;
    handoverRtgJob.yardCoordinate = storageCoor;
    sequence.addJob(handoverRtgJob);

    return sequence;
  }
}
