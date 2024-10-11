import { Box2 } from "three";
import { QcJob } from "../Job/Definition/QcJob";
import { EventBase } from "./types";

export type QcEventType = "qcmoveend" | "qcgantry";

export class QcMoveEndEvent extends EventBase {
  qcId: string;
  job: QcJob;

  constructor() {
    super("qcmoveend");
  }
}

export class QcGantryEvent extends EventBase {
  qcId: string;
  absoluteSpace: Box2;

  constructor() {
    super("qcgantry");
  }
}
