import { Box2 } from "three";
import { QcJob } from "../QC/QcJob";
import { RtgJob } from "../RTG/RtgJob";
import { TruckJob } from "../Truck/TruckJob";

export interface EventBase {
  type: EventType;
}

export abstract class JobBase {
  private static count = 0;
  id: number;
  dependencies: number[];

  constructor(dependencies: number[]) {
    this.id = JobBase.count++;
    this.dependencies = [...dependencies];
  }
}

export type EventType =
  | "animate"
  | "qcmoveend"
  | "qcgantry"
  | "rtgmovestart"
  | "rtgmoveend"
  | "truckdriveend"
  | "truckrelease"
  | `physicsstatechange${string}`;

export interface AnimateEvent extends EventBase {
  deltaTime: number;
}

export interface QcMoveEndEvent extends EventBase {
  quayCraneId: string;
  job: QcJob;
}

export interface QcGantryEvent extends EventBase {
  quayCraneId: string;
  absoluteSpace: Box2;
}

export interface RtgMoveStartEvent extends EventBase {
  rtgId: string;
  job: RtgJob;
}

export interface RtgMoveEndEvent extends EventBase {
  rtgId: string;
  job: RtgJob;
}

export interface TruckDriveEndEvent extends EventBase {
  truckId: string;
  job: TruckJob;
}

export interface TruckReleaseEvent extends EventBase {
  truckId: string;
}
