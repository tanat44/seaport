import { Vector2, Vector3 } from "three";
import { TruckReleaseEvent } from "../Event/types";
import { Terminal } from "../Terminal/Terminal";
import { Truck } from "./Truck";
import { TruckJob } from "./types";

const TRUCK_COUNT = 10;

export class TruckManager {
  private terminal: Terminal;
  private trucks: Map<string, Truck>;
  private availableTrucks: Truck[];

  constructor(terminal: Terminal) {
    this.terminal = terminal;
    this.trucks = new Map();
    this.availableTrucks = [];
    for (let i = 0; i < TRUCK_COUNT; ++i) {
      const initialPosition = new Vector3(20, 3 + 4 * i, 0);
      const truck = new Truck(this.terminal, initialPosition);
      this.trucks.set(truck.id, truck);
      this.availableTrucks.push(truck);
    }
  }

  getTruck(truckId: string): Truck {
    return this.trucks.get(truckId);
  }

  releaseTruck(truckId: string) {
    console.log("release truck: ", truckId);
    const truck = this.trucks.get(truckId);
    this.availableTrucks.push(truck);
  }

  getAvailableTruck(jobPosition: Vector2): Promise<Truck> {
    return new Promise((resolve, reject) => {
      const truck = this.getClosestTruck(jobPosition);
      if (truck) resolve(truck);

      // no available truck .. wait for next available truck
      this.terminal.visualizer.onEvent<TruckReleaseEvent>(
        "truckrelease",
        (e) => {
          const truck = this.trucks.get(e.truckId);
          resolve(truck);
        }
      );
    });
  }

  execute(job: TruckJob) {
    const truck = this.getTruck(job.truckId);

    console.log(job);
    truck.execute(job);
  }

  private isAvailable(truckId: string): boolean {
    return this.availableTrucks.findIndex((truck) => truck.id === truckId) > -1;
  }

  private getClosestTruck(jobPosition: Vector2): Truck | null {
    if (this.availableTrucks.length === 0) return null;

    let closestTruckIndex = 0;
    const closestDistance = Infinity;
    for (let i = 0; i < this.availableTrucks.length; ++i) {
      const pos = this.availableTrucks[i].position;
      const distance = new Vector2(pos.x, pos.y).distanceTo(jobPosition);
      if (distance < closestDistance) {
        closestTruckIndex = i;
      }
    }
    const trucks = this.availableTrucks.splice(closestTruckIndex, 1);

    // this.printAvailableTrucks();
    console.log("closest truck: ", trucks[0].id);
    return trucks[0];
  }

  private printAvailableTrucks() {
    let text = "Available: ";
    for (const truck of this.availableTrucks) {
      text += truck.id + " ";
    }
    console.log(text);
  }
}
