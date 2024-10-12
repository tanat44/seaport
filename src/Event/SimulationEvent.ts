import { EventBase } from "./types";

export type SimulationEventType = "speedchange" | `physicsstatechange${string}`;

export class SpeedChangeEvent extends EventBase {
  speed: number;
  constructor() {
    super("speedchange");
  }
}
