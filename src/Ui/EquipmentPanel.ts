import {
  EquipmentCreateEvent,
  EquipmentMoveEndEvent,
  EquipmentMoveStartEvent,
} from "../Event/EquipmentEvent";
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
    this.visualizer.onEvent<EquipmentMoveStartEvent>(
      "equipmentmovestart",
      (e) => this.onEquipmentMoveStart(e)
    );
    this.visualizer.onEvent<EquipmentMoveEndEvent>("equipmentmoveend", (e) =>
      this.onEquipmentMoveEnd(e)
    );

    // register job event
    this.visualizer.onEvent<JobStatusChangeEvent>("jobstatuschange", (e) =>
      this.onJobStatusChange(e)
    );
  }

  private createEquipmentCard(id: string) {
    // create card
    const card = document.createElement("div");
    card.innerHTML = id;
    card.className = "element center";
    const panel = document.getElementById("equipmentPanel");
    panel.appendChild(card);
    this.equipmentCard.set(id, card);

    // job
    const jobDom = document.createElement("div");
    jobDom.innerHTML = "-";
    jobDom.className = "element job";
    card.appendChild(jobDom);
    this.jobCard.set(id, jobDom);
  }

  private onEquipmentCreate(e: EquipmentCreateEvent) {
    this.createEquipmentCard(e.id);
  }

  private onEquipmentMoveStart(e: EquipmentMoveStartEvent) {
    if (!this.equipmentCard.has(e.id)) this.createEquipmentCard(e.id);

    const card = this.equipmentCard.get(e.id);
    card.className = "element center equipmentMoving";
  }

  private onEquipmentMoveEnd(e: EquipmentMoveEndEvent) {
    if (!this.equipmentCard.has(e.id)) this.createEquipmentCard(e.id);

    const card = this.equipmentCard.get(e.id);
    card.className = "element center equipmentIdling";
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

    if (!this.equipmentCard.has(equipmentId))
      this.createEquipmentCard(equipmentId);

    // update job reason
    const jobDom = this.jobCard.get(equipmentId);
    jobDom.innerHTML = job.reason;

    // update card on waiting
    if (job.status === JobStatus.WaitForRelease) {
      const card = this.equipmentCard.get(equipmentId);
      card.className = "element center equipmentWaiting";
    } else if (job.status === JobStatus.Completed) {
      jobDom.innerHTML = "-";
    }
  }
}
