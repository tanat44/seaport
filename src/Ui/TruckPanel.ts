import { EquipmentCreateEvent, EquipmentType } from "../Event/EquipmentEvent";
import { TruckMoveEvent, TruckQueuingTrafficEvent } from "../Event/TruckEvent";
import { Visualizer } from "../Visualizer/Visualizer";
import { UiBase } from "./UiBase";

const CARD_CLASS = "elementSmall center";

export class TruckPanel extends UiBase {
  truckCard: Map<string, HTMLElement>;

  constructor(visualizer: Visualizer, canvasElement: HTMLElement) {
    super(visualizer, canvasElement);
    this.truckCard = new Map();

    // register equipment event
    this.visualizer.onEvent<EquipmentCreateEvent>("equipmentcreate", (e) =>
      this.onEquipmentCreate(e)
    );
    this.visualizer.onEvent<TruckMoveEvent>("truckmove", (e) =>
      this.onTruckMove(e)
    );
    this.visualizer.onEvent<TruckQueuingTrafficEvent>(
      "truckqueuingtraffic",
      (e) => this.onTruckQueuingTraffic(e)
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

  private onTruckQueuingTraffic(e: TruckQueuingTrafficEvent) {
    const card = this.truckCard.get(e.truckId);
    card.className = `${CARD_CLASS} blockingStatus`;
  }
}
