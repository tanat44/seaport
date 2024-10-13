import { EquipmentCreateEvent } from "../Event/EquipmentEvent";
import { JobStatusChangeEvent } from "../Event/JobEvent";
import { JobStatus } from "../Job/Definition/JobBase";
import { QcJob } from "../Job/Definition/QcJob";
import { RtgJob } from "../Job/Definition/RtgJob";
import { TruckJob } from "../Job/Definition/TruckJob";
import { Visualizer } from "../Visualizer/Visualizer";
import { UiBase } from "./UiBase";

export class EquipmentPanel extends UiBase {
  equipmentCard: Map<string, HTMLElement>;
  jobCard: Map<string, HTMLElement>;

  constructor(visualizer: Visualizer, canvasElement: HTMLElement) {
    super(visualizer, canvasElement);
    this.equipmentCard = new Map();
    this.jobCard = new Map();

    // register equipment event
    this.visualizer.onEvent<EquipmentCreateEvent>("equipmentcreate", (e) =>
      this.onEquipmentCreate(e)
    );
    this.visualizer.onEvent<JobStatusChangeEvent>("jobstatuschange", (e) =>
      this.onJobStatusChange(e)
    );
  }

  private createEquipmentCard(id: string) {
    // create card
    const card = document.createElement("div");
    card.innerHTML = id;
    card.className = "elementSmall center";
    const panel = document.getElementById("equipmentPanel");
    panel.appendChild(card);
    this.equipmentCard.set(id, card);
  }

  private onEquipmentCreate(e: EquipmentCreateEvent) {
    this.createEquipmentCard(e.id);
  }

  private onJobStatusChange(e: JobStatusChangeEvent) {
    const job = e.job;
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

    if (!equipmentId) {
      console.trace(job);
      throw new Error("unknown equipment");
    }

    // update card on waiting
    const card = this.equipmentCard.get(equipmentId);
    if (job.status === JobStatus.Working) {
      card.className = "elementSmall center workingStatus";
    } else if (job.status === JobStatus.WaitForRelease) {
      card.className = "elementSmall center blockingStatus";
    } else if (job.status === JobStatus.Completed) {
      card.className = "elementSmall center idlingStatus";
    }
  }
}
