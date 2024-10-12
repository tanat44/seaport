import { JobStatusChangeEvent } from "../Event/JobEvent";
import {
  HandoverJob,
  HandoverQcToTruckJob,
  HandoverRtgToYardJob,
  HandoverTruckToRtgJob,
  HandoverVesselToQcJob,
} from "./Definition/HanoverJob";
import { JobStatus } from "./Definition/JobBase";
import { JobSequence } from "./Definition/JobSequence";
import { TerminalControl } from "./TerminalControl";

export class Handover extends TerminalControl {
  execute(job: HandoverJob, sequence: JobSequence) {
    console.log(job.toString(), "Execute");
    job.status = JobStatus.Working;

    if (job.reason === "handovervesseltoqc") {
      const handoverJob = job as HandoverVesselToQcJob;

      // vessel unload
      const vessel = this.qcManager.getAssignedVessel(handoverJob.qcId);
      const container = vessel.remove(handoverJob.cargoCoordinate);

      // qc pick container
      const qc = this.qcManager.getQuayCrane(handoverJob.qcId);
      qc.pickContainer(container);
    } else if (job.reason === "handoverqctotruck") {
      const handoverJob = job as HandoverQcToTruckJob;

      // qc drop container
      const qc = this.qcManager.getQuayCrane(handoverJob.qcId);
      const container = qc.dropContainer();
      this.qcManager.releaseQc(qc.id);

      // truck load container
      const truck = this.truckManager.getTruck(handoverJob.truckId);
      truck.load(container);
    } else if (job.reason === "handovertrucktortg") {
      const handoverJob = job as HandoverTruckToRtgJob;

      // truck unload container
      const truck = this.truckManager.getTruck(handoverJob.truckId);
      const container = truck.unload();
      this.truckManager.releaseTruck(handoverJob.truckId);

      // rtg pick container
      const rtg = this.rtgManager.getRtg(handoverJob.rtgId);
      rtg.pickContainer(container);
    } else if (job.reason === "handoverrtgtoyard") {
      const handoverJob = job as HandoverRtgToYardJob;

      // rtg drop container
      const rtg = this.rtgManager.getRtg(handoverJob.rtgId);
      const container = rtg.dropContainer();
      this.rtgManager.releaseRtg(handoverJob.rtgId);

      // store container in yard
      const yard = this.yardManager.getYard(handoverJob.yardId);
      yard.store(container, handoverJob.yardCoordinate);
    } else {
      throw new Error("Unhandle handover job");
    }

    job.status = JobStatus.Completed;
    sequence.completeParentJob(job);

    // emit event
    this.terminal.visualizer.emit(new JobStatusChangeEvent(job));
  }
}