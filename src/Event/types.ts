import { JobEventType } from "./JobEvent";
import { QcEventType } from "./QcEvent";
import { RtgEventType } from "./RtgEvent";
import { TruckEventType } from "./TruckEvent";

export type EventType =
  | "undefined"
  | "animate"
  | `physicsstatechange${string}`
  | QcEventType
  | RtgEventType
  | TruckEventType
  | JobEventType;

export abstract class EventBase {
  readonly type: EventType;

  constructor(type: EventType = "undefined") {
    this.type = type;
  }
}
export class AnimateEvent extends EventBase {
  deltaTime: number;

  constructor() {
    super("animate");
  }
}
