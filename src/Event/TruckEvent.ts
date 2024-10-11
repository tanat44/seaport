import { TruckJob } from "../Job/Definition/TruckJob";
import { EventBase } from "./types";

export type TruckEventType = "truckdriveend" | "truckrelease";

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
