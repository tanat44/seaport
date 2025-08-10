import { Box2 } from "three";
import { TruckJob } from "../Job/Definition/TruckJob";
import { SafetyFieldDetection } from "../Truck/types";
import { EventBase } from "./types";

export type TruckEventType =
  | "truckdriveend"
  | "truckrelease"
  | "truckmove"
  | "trucksafetyfieldtrigger"
  | "trucksafetyfieldreset";

export abstract class TruckBaseEvent extends EventBase {
  truckId: string;
  constructor(type: TruckEventType, truckId: string) {
    super(type);
    this.truckId = truckId;
  }
}

export class TruckDriveEndEvent extends TruckBaseEvent {
  job: TruckJob;

  constructor(truckId: string, job: TruckJob) {
    super("truckdriveend", truckId);
    this.job = job;
  }
}

export class TruckReleaseEvent extends TruckBaseEvent {
  constructor(truckId: string) {
    super("truckrelease", truckId);
  }
}

export class TruckMoveEvent extends TruckBaseEvent {
  footprint: Box2;

  constructor(truckId: string, footprint: Box2) {
    super("truckmove", truckId);
    this.footprint = footprint;
  }
}

export class TruckSafetyFieldTriggerEvent extends TruckBaseEvent {
  detection: SafetyFieldDetection;

  constructor(truckId: string, detection: SafetyFieldDetection) {
    super("trucksafetyfieldtrigger", truckId);
    this.detection = detection;
  }
}

export class TruckSafetyFieldResetEvent extends TruckBaseEvent {
  constructor(truckId: string) {
    super("trucksafetyfieldreset", truckId);
  }
}
