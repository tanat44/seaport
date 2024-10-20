import { QcId } from "../QC/Qc";
import { RtgId } from "../RTG/Rtg";
import { TruckId } from "../Truck/Truck";
import { EventBase } from "./types";

export enum EquipmentType {
  Qc,
  Rtg,
  Truck,
}

export type EquipmentId = QcId | RtgId | TruckId;

export type EquipmentEventType =
  | "equipmentcreate"
  | "equipmentmovestart"
  | "equipmentmoveend";

export abstract class EquipmentBaseEvent extends EventBase {
  id: string;
  equipmentType: EquipmentType;
  constructor(
    type: EquipmentEventType,
    id: EquipmentId,
    equipmentType: EquipmentType
  ) {
    super(type);
    this.id = id;
    this.equipmentType = equipmentType;
  }
}

export class EquipmentCreateEvent extends EquipmentBaseEvent {
  constructor(id: string, equipmentType: EquipmentType) {
    super("equipmentcreate", id, equipmentType);
  }
}

export class EquipmentMoveStartEvent extends EquipmentBaseEvent {
  constructor(id: string, equipmentType: EquipmentType) {
    super("equipmentmovestart", id, equipmentType);
  }
}

export class EquipmentMoveEndEvent extends EquipmentBaseEvent {
  constructor(id: string, equipmentType: EquipmentType) {
    super("equipmentmoveend", id, equipmentType);
  }
}
