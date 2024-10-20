import { Box2 } from "three";
import { EventBase } from "./types";

export type QcEventType = "qcgantry";

export abstract class QcBaseEvent extends EventBase {
  qcId: string;

  constructor(type: QcEventType, qcId: string) {
    super(type);
    this.qcId = qcId;
  }
}

export class QcGantryEvent extends QcBaseEvent {
  footprint: Box2;

  constructor(qcId: string, footprint: Box2) {
    super("qcgantry", qcId);
    this.footprint = footprint;
  }
}
