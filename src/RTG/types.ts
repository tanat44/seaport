import { Vector3 } from "three";

export interface RtgJob {
  position: Vector3;
  reason: "storecontainer" | "retrievecontainer" | "move";
}
