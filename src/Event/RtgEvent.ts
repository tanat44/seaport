import { RtgJob } from "../Job/Definition/RtgJob";
import { EventBase } from "./types";

export type RtgEventType = "rtgmovestart" | "rtgmoveend";

export class RtgMoveStartEvent extends EventBase {
  rtgId: string;
  job: RtgJob;

  constructor() {
    super("rtgmovestart");
  }
}

export class RtgMoveEndEvent extends EventBase {
  rtgId: string;
  job: RtgJob;

  constructor() {
    super("rtgmoveend");
  }
}
