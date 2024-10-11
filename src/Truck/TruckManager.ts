import { Vector2, Vector3 } from "three";
import { SequenceId } from "../Job/Definition/JobSequence";
import { TruckJob } from "../Job/Definition/TruckJob";
import { Terminal } from "../Terminal/Terminal";
import { Truck, TruckId } from "./Truck";

const TRUCK_COUNT = 5;

export class TruckManager {
  private terminal: Terminal;
  private trucks: Map<string, Truck>;

  private activeSequences: Map<TruckId, SequenceId | undefined>;

  constructor(terminal: Terminal) {
    this.terminal = terminal;
    this.trucks = new Map();
    this.activeSequences = new Map();
    for (let i = 0; i < TRUCK_COUNT; ++i) {
      const initialPosition = new Vector3(20, 3 + 4 * i, 0);
      const truck = new Truck(this.terminal, initialPosition);
      this.trucks.set(truck.id, truck);
      this.activeSequences.set(truck.id, undefined);
    }
  }

  getTruck(truckId: string): Truck {
    return this.trucks.get(truckId);
  }

  getAvailableTruck(jobPosition: Vector2): Truck | null {
    return this.getClosestTruck(jobPosition);
  }

  execute(job: TruckJob): boolean {
    const activeSequenceId = this.activeSequences.get(job.truckId);
    if (activeSequenceId !== undefined && activeSequenceId !== job.sequenceId)
      return false;

    const truck = this.getTruck(job.truckId);
    truck.execute(job);
    this.activeSequences.set(job.truckId, job.sequenceId);

    return true;
  }

  releaseTruck(truckId: string) {
    this.activeSequences.set(truckId, undefined);
  }

  private getClosestTruck(jobPosition: Vector2): Truck | null {
    let bestTruck: Truck = null;
    const closestDistance = Infinity;
    for (const [truckId, truck] of this.trucks) {
      if (this.activeSequences.get(truckId)) continue;
      const pos = truck.position;
      const distance = new Vector2(pos.x, pos.y).distanceTo(jobPosition);
      if (distance < closestDistance) {
        bestTruck = truck;
      }
    }

    // console.log("closest truck: ", bestTruck?.id ?? "-");
    return bestTruck;
  }

  private printAvailableTrucks() {
    let text = "Available: ";
    for (const [id, _] of this.trucks) {
      if (this.activeSequences.get(id)) continue;
      text += id + " ";
    }
    console.log(text);
  }
}

// getAvailableTruckAsync(jobPosition: Vector2): Promise<Truck> {
//   return new Promise((resolve, reject) => {
//     const truck = this.getClosestTruck(jobPosition);
//     if (truck) resolve(truck);

//     // no available truck .. wait for next available truck
//     this.terminal.visualizer.onEvent<TruckReleaseEvent>(
//       "truckrelease",
//       (e) => {
//         const truck = this.trucks.get(e.truckId);
//         resolve(truck);
//       }
//     );
//   });
// }
