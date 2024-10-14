import { Box2 } from "three";
import { TruckJob } from "../Job/Definition/TruckJob";
import { EventBase } from "./types";

export type TruckEventType = "truckdriveend" | "truckrelease" | "truckmove";

export class TruckDriveEndEvent extends EventBase {
  truckId: string;
  job: TruckJob;

  constructor() {
    super("truckdriveend");
  }
}

export class TruckReleaseEvent extends EventBase {
  truckId: string;

  constructor() {
    super("truckrelease");
  }
}

export class TruckMoveEvent extends EventBase {
  truckId: string;
  footprint: Box2;

  constructor(truckId: string, footprint: Box2) {
    super("truckmove");
    this.truckId = truckId;
    this.footprint = footprint;
  }
}
