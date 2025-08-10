import { Object3D, Vector2 } from "three";
import { JobStatusChangeEvent } from "../Event/JobEvent";
import { TruckDriveEndEvent } from "../Event/TruckEvent";
import { JobStatus } from "../Job/Definition/JobBase";
import { QcStandbyOverTruckJob } from "../Job/Definition/QcJob";
import { TruckMoveToQcStandby } from "../Job/Definition/TruckJob";
import { Truck } from "../Truck/Truck";
import { Visualizer } from "../Visualizer/Visualizer";
import { TrafficManager } from "./TrafficManager";

export class StandbyPoint {
  visualizer: Visualizer;
  truckManager: TrafficManager;
  queue: Truck[];
  maxQueueLength: number;
  position: Vector2;

  banner: Object3D;

  constructor(
    visualizer: Visualizer,
    truckManager: TrafficManager,
    maxQueueLength: number
  ) {
    this.queue = [];
    this.visualizer = visualizer;
    this.truckManager = truckManager;
    this.maxQueueLength = maxQueueLength;
    this.position = new Vector2(30, 138);

    // banner
    this.banner = visualizer.text.createTextMesh("standby");
    this.banner.position.set(this.position.x, this.position.y, 5);
    this.visualizer.scene.add(this.banner);

    // events
    this.visualizer.onEvent<TruckDriveEndEvent>(`truckdriveend`, (e) =>
      this.onDriveEnd(e)
    );
    this.visualizer.onEvent<JobStatusChangeEvent>("jobstatuschange", (e) =>
      this.onJobStatusChange(e)
    );
  }

  private updateStatusBanner() {
    let text = "empty standby";
    for (let i = 0; i < this.queue.length; ++i) {
      if (i == 0) {
        text = "claim: ";
      }
      text += this.queue[i].id + " ";
      if (i === this.maxQueueLength - 1) {
        text += "\nnext: ";
      }
    }
    this.visualizer.text.updateText(this.banner, text);
  }

  // if queue is not full, truck can proceed to standby point
  addJob(job: TruckMoveToQcStandby) {
    const truck = this.truckManager.getTruck(job.truckId);

    this.queue.push(truck);
    if (this.queue.length <= this.maxQueueLength) {
      truck.resume();
    } else {
      truck.flagDown();
    }
    this.updateStatusBanner();
  }

  onJobStatusChange(e: JobStatusChangeEvent) {
    const job = e.job as QcStandbyOverTruckJob;
    if (
      job.reason !== "qcstandbyovertruck" ||
      job.status !== JobStatus.Completed
    )
      return;

    const trucks = this.queue.filter((truck) => {
      const driveToStandbyJob = truck.currentJob as TruckMoveToQcStandby;
      return driveToStandbyJob && driveToStandbyJob.qcId === job.qcId;
    });

    if (trucks.length > 1) {
      console.warn(
        `Something strange. Many trucks are waiting for the same QC: ${job.qcId}`
      );
      return;
    }
    const truck = trucks[0];
    this.queue.splice(this.queue.indexOf(truck), 1); // remove truck from queue
    truck.resume();
    this.updateStatusBanner();
  }

  onDriveEnd(e: any) {
    // truck arrive at standby point before qc is ready
    // wait for qc to be ready (job = QcStandbyOverTruckJob)
  }
}
