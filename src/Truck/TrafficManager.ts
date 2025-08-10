import { Box2, Box3, Vector2, Vector3 } from "three";
import { OBB } from "three/examples/jsm/math/OBB";
import {
  TruckMoveEvent,
  TruckSafetyFieldTriggerEvent,
} from "../Event/TruckEvent";
import { SequenceId } from "../Job/Definition/JobSequence";
import { TruckJob, TruckMoveToQcStandby } from "../Job/Definition/TruckJob";
import { Layout } from "../Layout/types";
import { PathPlanner } from "../PathPlanner/PathPlanner";
import { Visualizer } from "../Visualizer/Visualizer";
import { StandbyPoint } from "./StandbyPoint";
import { Truck, TruckId } from "./Truck";
import { SafetyFieldDetection, TrafficType } from "./types";

const STANDBY_QUEUE_LENGTH = 2;
export class TrafficManager {
  private visualizer: Visualizer;
  pathPlanner: PathPlanner;
  private trucks: Map<string, Truck>;
  standbyPoint: StandbyPoint;

  // operation
  private activeSequences: Map<TruckId, SequenceId | undefined>;
  private footprints: Map<TruckId, Box2>;

  constructor(visualizer: Visualizer, layout: Layout, numberOfTrucks: number) {
    this.visualizer = visualizer;
    this.pathPlanner = new PathPlanner(this.visualizer, layout);
    this.trucks = new Map();
    this.standbyPoint = new StandbyPoint(
      this.visualizer,
      this,
      STANDBY_QUEUE_LENGTH
    );
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
    this.visualizer.onEvent<TruckSafetyFieldTriggerEvent>(
      "trucksafetyfieldtrigger",
      this.onSafetyFieldTrigger.bind(this)
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
    if (TruckMoveToQcStandby.prototype.isPrototypeOf(job)) {
      this.standbyPoint.addJob(job as TruckMoveToQcStandby);
    }
    this.activeSequences.set(job.truckId, job.sequenceId);

    return true;
  }

  releaseTruck(truckId: string) {
    this.activeSequences.set(truckId, undefined);
  }

  isSafetyFieldIntersectOtherTrucks(
    myTruckId: string,
    mySafetyField: OBB
  ): SafetyFieldDetection | null {
    for (const [thatTruckId, footprint] of this.footprints) {
      if (thatTruckId === myTruckId) continue;
      const thatBox3 = new Box3(
        new Vector3(footprint.min.x, footprint.min.y, 0),
        new Vector3(footprint.max.x, footprint.max.y, 10)
      );
      if (mySafetyField.intersectsBox3(thatBox3)) {
        const myTruck = this.trucks.get(myTruckId);
        const anotherTruck = this.trucks.get(thatTruckId);
        const trafficType =
          myTruck.direction.dot(anotherTruck.direction) > 0
            ? TrafficType.Queuing
            : TrafficType.Opposing;
        return {
          theOtherTruckId: thatTruckId,
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

  private async onSafetyFieldTrigger(e: TruckSafetyFieldTriggerEvent) {
    const thisTruck = this.getTruck(e.truckId);
    const thatTruck = this.getTruck(e.detection.theOtherTruckId);
    if (!thisTruck.currentJob) {
      console.log(
        `cannot handle safety field trigger because ${thisTruck.id} has no current job`
      );
      return;
    }
    if (!thatTruck.currentJob) {
      console.log(
        `cannot handle safety field trigger because ${thatTruck.id} has no current job`
      );
      return;
    }

    // this has priority over that
    if (thisTruck.currentJob.id < thatTruck.currentJob.id) {
      // truck1 resume -> truck2 flagdown -> truck2 wait for truck1 to pass -> truck2 resume
      thisTruck.resume();
      thatTruck.flagDown(); // let truck1 proceed and flag down truck2
      await thisTruck.safetyField.waitForSafetyFieldReset(); // wait for truck1 to pass by, then resume truck2
      thatTruck.resume();
    } else {
      // that truck has more priority
      thisTruck.flagDown(); // let truck2 proceed and flag down truck1
      await thisTruck.safetyField.waitForSafetyFieldReset(); // wait for truck2 to pass by, then resume truck1
      thisTruck.resume();
    }
  }
}
