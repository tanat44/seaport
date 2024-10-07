// Event generic

import { Box2 } from "three";
import { QuayCraneJob } from "../QuayCrane/types";
import { RtgJob } from "../RTG/types";
import { TruckJob } from "../Truck/types";

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
