import { Box2, Vector2, Vector3 } from "three";
import { TruckMoveEvent, TruckQueuingTrafficEvent } from "../Event/TruckEvent";
import { SequenceId } from "../Job/Definition/JobSequence";
import { TruckJob } from "../Job/Definition/TruckJob";
import { Layout } from "../Layout/types";
import { PathPlanner } from "../PathPlanner/PathPlanner";
import { Visualizer } from "../Visualizer/Visualizer";
import { Truck, TruckId } from "./Truck";
import { SafetyFieldDetection, TrafficType } from "./types";

export class TruckManager {
  private visualizer: Visualizer;
  pathPlanner: PathPlanner;
  private trucks: Map<string, Truck>;

  // operation
  private activeSequences: Map<TruckId, SequenceId | undefined>;
  private footprints: Map<TruckId, Box2>;

  constructor(visualizer: Visualizer, layout: Layout, numberOfTrucks: number) {
    this.visualizer = visualizer;
    this.pathPlanner = new PathPlanner(this.visualizer, layout);
    this.trucks = new Map();
    this.activeSequences = new Map();
    this.footprints = new Map();

    for (let i = 0; i < numberOfTrucks; ++i) {
      const initialPosition = new Vector3(20, 3 + 7 * i, 0);
      const truck = new Truck(this.visualizer, this, initialPosition);
      this.trucks.set(truck.id, truck);
      this.activeSequences.set(truck.id, undefined);
    }

    // register event handler
    this.visualizer.onEvent<TruckMoveEvent>("truckmove", (e) =>
      this.onTruckMove(e)
    );
    this.visualizer.onEvent<TruckQueuingTrafficEvent>(
      "truckqueuingtraffic",
      (e) => this.onTruckQueuingTraffic(e)
    );
  }

  getTruck(truckId: string): Truck {
    return this.trucks.get(truckId);
  }

  getTruckForSequence(sequenceId: number): Truck | null {
    for (const [truckId, sequence] of this.activeSequences) {
      if (sequenceId === sequence) return this.trucks.get(truckId);
    }
    return null;
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

  isSafetyFieldIntersectOtherTrucks(
    myTruckId: string,
    mySafetyField: Box2
  ): SafetyFieldDetection | null {
    for (const [thatTruckId, footprint] of this.footprints) {
      if (thatTruckId === myTruckId) continue;
      if (mySafetyField.intersectsBox(footprint)) {
        const myTruck = this.trucks.get(myTruckId);
        const anotherTruck = this.trucks.get(thatTruckId);
        const trafficType =
          myTruck.direction.dot(anotherTruck.direction) > 0
            ? TrafficType.Queuing
            : TrafficType.Opposing;
        return {
          anotherTruckId: thatTruckId,
          trafficType,
        };
      }
    }

    return null;
  }

  isMyTruckOnTheRight(myTruckId: string, thatTruckId: string): boolean {
    const myTruck = this.getTruck(myTruckId);
    const thatTruck = this.getTruck(thatTruckId);

    const cross = myTruck.forward.clone().cross(thatTruck.forward);
    return cross.z > 0;
  }

  private getClosestTruck(jobPosition: Vector2): Truck | null {
    let bestTruck: Truck = null;
    const closestDistance = Infinity;
    for (const [truckId, truck] of this.trucks) {
      if (this.activeSequences.get(truckId) !== undefined) {
        continue;
      }
      const pos = truck.position;
      const distance = new Vector2(pos.x, pos.y).distanceTo(jobPosition);
      if (distance < closestDistance) {
        bestTruck = truck;
      }
    }
    // console.log("closest truck: ", bestTruck?.id ?? "-");
    return bestTruck;
  }

  private onTruckMove(e: TruckMoveEvent) {
    this.footprints.set(e.truckId, e.footprint);
  }

  private onTruckQueuingTraffic(e: TruckQueuingTrafficEvent) {
    const truck = this.getTruck(e.truckId);
    if (e.detection.trafficType === TrafficType.Opposing) truck.replan();
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
