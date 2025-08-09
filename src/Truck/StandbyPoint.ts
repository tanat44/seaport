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
  queueLength: number;

  constructor(
    visualizer: Visualizer,
    truckManager: TrafficManager,
    queueLength: number
  ) {
    this.queue = [];
    this.visualizer = visualizer;
    this.truckManager = truckManager;
    this.queueLength = queueLength;

    this.visualizer.onEvent<TruckDriveEndEvent>(`truckdriveend`, (e) =>
      this.onDriveEnd(e)
    );
    this.visualizer.onEvent<JobStatusChangeEvent>("jobstatuschange", (e) =>
      this.onJobStatusChange(e)
    );
  }

  // if queue is not full, truck can proceed to standby point
  addJob(job: TruckMoveToQcStandby) {
    const truck = this.truckManager.getTruck(job.truckId);

    this.queue.push(truck);
    if (this.queue.length <= this.queueLength) {
      truck.resume();
    } else {
      truck.pause();
    }
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
  }

  onDriveEnd(e: any) {
    // truck arrive at standby point before qc is ready
    // wait for qc to be ready (job = QcStandbyOverTruckJob)
  }
}
