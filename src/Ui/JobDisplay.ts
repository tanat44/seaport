import {
  JobSequenceStatusChangeEvent,
  JobStatusChangeEvent,
} from "../Event/JobEvent";
import { JobBase, JobStatus } from "../Job/Definition/JobBase";
import { SequenceStatus } from "../Job/Definition/JobSequence";
import { QcJob } from "../Job/Definition/QcJob";
import { RtgJob } from "../Job/Definition/RtgJob";
import { TruckJob } from "../Job/Definition/TruckJob";
import { Visualizer } from "../Visualizer/Visualizer";
import { UiBase } from "./UiBase";

export class JobDisplay extends UiBase {
  sequenceCard: Map<number, HTMLElement>;
  jobCard: Map<number, HTMLElement>;

  constructor(visualizer: Visualizer, canvasElement: HTMLElement) {
    super(visualizer, canvasElement);
    this.sequenceCard = new Map();
    this.jobCard = new Map();

    // register job event
    this.visualizer.onEvent<JobSequenceStatusChangeEvent>(
      "jobsequencestatuschange",
      (e) => this.onSequenceStatusChange(e)
    );
    this.visualizer.onEvent<JobStatusChangeEvent>("jobstatuschange", (e) =>
      this.onJobStatusChange(e)
    );
  }

  private createSequenceCard(sequenceId: number) {
    const card = document.createElement("div");
    card.innerHTML = sequenceId.toFixed(0);
    card.className = "elementSmall center row";
    const panel = document.getElementById("sequencePanel");
    panel.appendChild(card);
    this.sequenceCard.set(sequenceId, card);
  }

  private createJobCard(job: JobBase) {
    if (!job.sequenceId) return;

    if (!this.sequenceCard.has(job.sequenceId))
      this.createSequenceCard(job.sequenceId);

    const sequenceCard = this.sequenceCard.get(job.sequenceId);

    let equipmentId: string = undefined;
    if (QcJob.prototype.isPrototypeOf(job)) {
      equipmentId = (job as QcJob).qcId;
    } else if (RtgJob.prototype.isPrototypeOf(job)) {
      equipmentId = (job as RtgJob).rtgId;
    } else if (TruckJob.prototype.isPrototypeOf(job)) {
      equipmentId = (job as TruckJob).truckId;
    } else {
      return;
    }

    const card = document.createElement("div");
    card.innerHTML = `${equipmentId}: ${job.reason}`;
    card.className = "elementSmall jobCard center";
    this.jobCard.set(job.id, card);

    // append to sequence card
    sequenceCard.appendChild(card);
  }

  private onSequenceStatusChange(e: JobSequenceStatusChangeEvent) {
    const sequence = e.sequence;
    if (!this.sequenceCard.has(sequence.id))
      this.createSequenceCard(sequence.id);

    const card = this.sequenceCard.get(sequence.id);
    if (sequence.status === SequenceStatus.Complete) {
      const panel = document.getElementById("sequencePanel");
      panel.removeChild(card);
      this.sequenceCard.delete(sequence.id);
    }
  }

  private onJobStatusChange(e: JobStatusChangeEvent) {
    const job = e.job;

    if (!this.jobCard.has(job.id)) this.createJobCard(job);

    // update job card
    const card = this.jobCard.get(job.id);
    if (!card) return;

    if (job.status === JobStatus.Working) {
      card.className = "elementSmall jobCard center workingStatus";
    } else if (job.status === JobStatus.WaitForRelease) {
      card.className = "elementSmall jobCard center blockingStatus";
    } else if (job.status === JobStatus.Completed) {
      const sequenceCard = this.sequenceCard.get(job.sequenceId);
      sequenceCard.removeChild(card);
      this.jobCard.delete(job.id);
    }
  }
}
