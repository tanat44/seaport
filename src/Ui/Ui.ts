import { SpeedChangeEvent } from "../Event/SimulationEvent";
import { Visualizer } from "../Visualizer/Visualizer";
import { EquipmentPanel } from "./EquipmentPanel";
import { JobDisplay } from "./JobDisplay";
import { MessageBox } from "./MessageBox";
import { TruckPanel } from "./TruckPanel";
import { UiBase } from "./UiBase";

export class Ui extends UiBase {
  equipmentPanel: EquipmentPanel;
  truckPanel: TruckPanel;
  jobDisplay: JobDisplay;
  messageBox: MessageBox;

  constructor(visualizer: Visualizer, canvasElement: HTMLElement) {
    super(visualizer, canvasElement);
    this.equipmentPanel = new EquipmentPanel(visualizer, canvasElement);
    this.truckPanel = new TruckPanel(visualizer, canvasElement);
    this.jobDisplay = new JobDisplay(visualizer, canvasElement);
    this.messageBox = new MessageBox(this.canvasElement);

    // handle user interaction
    document.getElementById("speedMinus").onclick = () =>
      this.visualizer.decreaseSpeed();
    document.getElementById("speedPlus").onclick = () =>
      this.visualizer.increaseSpeed();

    // handle internal event
    this.visualizer.onEvent<SpeedChangeEvent>("speedchange", (e) =>
      this.onSpeedChange(e)
    );
  }

  private onSpeedChange(e: SpeedChangeEvent) {
    this.messageBox.showMessage(`Simulation speed ${e.speed}x`);
    document.getElementById("speedValue").innerHTML = `${e.speed}x`;
  }
}
