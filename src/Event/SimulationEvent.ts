import { EventBase } from "./types";

export type SimulationEventType =
  | "speedchange"
  | "simulationtimeupdate"
  | `physicsstatechange${string}`;

export class SpeedChangeEvent extends EventBase {
  speed: number;
  constructor() {
    super("speedchange");
  }
}

export class SimulationTimeUpdateEvent extends EventBase {
  time: number;
  constructor(time: number) {
    super("simulationtimeupdate");
    this.time = time;
  }
}
