// Event generic

import { QuayCraneJob } from "../QuayCrane/types";
import { RtgJob } from "../RTG/types";

export interface EventBase {
  type: EventType;
}

export type EventType =
  | "animate"
  | "quaycranemovestart"
  | "quaycranemoveend"
  | "quaycranegantry"
  | "rtgmovestart"
  | "rtgmoveend"
  | `truckdriveend-${string}`
  | "truckdriveend"
  | "truckrelease"
  | `physicsstatechange${string}`;

export interface AnimateEvent extends EventBase {
  deltaTime: number;
}

export interface QuayCraneMoveStartEvent extends EventBase {
  quayCraneId: string;
  job: QuayCraneJob;
}

export interface QuayCraneMoveEndEvent extends EventBase {
  quayCraneId: string;
  job: QuayCraneJob;
}

export interface QuayCraneGantryEvent extends EventBase {
  quayCraneId: string;
}

export interface RtgMoveStartEvent extends EventBase {
  rtgId: string;
  job: RtgJob;
}

export interface RtgMoveStartEndEvent extends EventBase {
  rtgId: string;
  job: RtgJob;
}

export interface TruckDriveEndEvent extends EventBase {
  truckId: string;
}

export interface TruckReleaseEvent extends EventBase {
  truckId: string;
}
