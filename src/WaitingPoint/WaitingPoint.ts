import { TruckDriveEndEvent } from "../Event/TruckEvent";
import { TruckMoveToQcStandby } from "../Job/Definition/TruckJob";
import { Truck } from "../Truck/Truck";
import { TruckManager } from "../Truck/TruckManager";
import { Visualizer } from "../Visualizer/Visualizer";

export class WaitingPoint {
  visualizer: Visualizer;
  truckManager: TruckManager;
  queue: Truck[];

  constructor(visualizer: Visualizer, truckManager: TruckManager) {
    this.queue = [];
    this.visualizer = visualizer;
    this.truckManager = truckManager;
    this.visualizer.onEvent<TruckDriveEndEvent>(`truckdriveend`, (e) =>
      this.onDriveEnd(e)
    );
  }

  addJob(job: TruckMoveToQcStandby) {
    // truck at queue[0] is occupying, this truck must wait
    const truck = this.truckManager.getTruck(job.truckId);

    if (this.queue.length > 0) {
      truck.pause();
    } else {
      truck.resume();
    }
    this.queue.push(truck);
  }

  onDriveEnd(e: any) {
    if (TruckMoveToQcStandby.prototype.isPrototypeOf(e.job)) {
      const job = e.job as TruckMoveToQcStandby;
      const endTruckId = job.truckId;

      const currentTruck = this.queue.shift();
      if (currentTruck.id !== endTruckId) {
        console.error(e);
        throw new Error(`WaitingPoint: current truck is not the end truck`);
      }

      const nextTruck = this.queue[0];
      if (nextTruck) {
        nextTruck.resume();
      }
    }
  }
}
