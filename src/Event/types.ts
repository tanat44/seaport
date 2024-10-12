import { EquipmentEventType } from "./EquipmentEvent";
import { JobEventType } from "./JobEvent";
import { QcEventType } from "./QcEvent";
import { RtgEventType } from "./RtgEvent";
import { SimulationEventType } from "./SimulationEvent";
import { TruckEventType } from "./TruckEvent";

export type EventType =
  | "undefined"
  | "animate"
  | QcEventType
  | RtgEventType
  | TruckEventType
  | JobEventType
  | SimulationEventType
  | EquipmentEventType;

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
