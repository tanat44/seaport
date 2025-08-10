import { EquipmentCreateEvent, EquipmentType } from "../Event/EquipmentEvent";
import {
  TruckMoveEvent,
  TruckSafetyFieldTriggerEvent,
} from "../Event/TruckEvent";
import { Visualizer } from "../Visualizer/Visualizer";
import { UiBase } from "./UiBase";

const CARD_CLASS = "elementSmall center";

export class TruckPanel extends UiBase {
  truckCard: Map<string, HTMLElement>;

  constructor(visualizer: Visualizer, canvasElement: HTMLElement) {
    super(visualizer, canvasElement);
    this.truckCard = new Map();

    // event handler
    this.visualizer.onEvent<EquipmentCreateEvent>(
      "equipmentcreate",
      this.onEquipmentCreate.bind(this)
    );
    this.visualizer.onEvent<TruckMoveEvent>(
      "truckmove",
      this.onTruckMove.bind(this)
    );
    this.visualizer.onEvent<TruckSafetyFieldTriggerEvent>(
      "trucksafetyfieldtrigger",
      this.onTruckSafetyFieldTrigger.bind(this)
    );
  }

  private createEquipmentCard(id: string) {
    // create card
    const card = document.createElement("div");
    card.innerHTML = id;
    card.className = CARD_CLASS;
    const panel = document.getElementById("truckPanel");
    panel.appendChild(card);
    this.truckCard.set(id, card);
  }

  private onEquipmentCreate(e: EquipmentCreateEvent) {
    if (e.equipmentType !== EquipmentType.Truck) return;
    this.createEquipmentCard(e.id);
  }

  private onTruckMove(e: TruckMoveEvent) {
    const card = this.truckCard.get(e.truckId);
    card.className = `${CARD_CLASS} workingStatus`;
  }

  private onTruckSafetyFieldTrigger(e: TruckSafetyFieldTriggerEvent) {
    const card = this.truckCard.get(e.truckId);
    card.className = `${CARD_CLASS} blockingStatus`;
  }
}
