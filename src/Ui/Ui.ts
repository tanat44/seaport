import { Visualizer } from "../Visualizer/Visualizer";
import { MessageBox } from "./MessageBox";

export class Ui {
  visualizer: Visualizer;
  canvasElement: HTMLElement;
  messageBox: MessageBox;

  constructor(visualizer: Visualizer, canvasElement: HTMLElement) {
    this.visualizer = visualizer;
    this.canvasElement = canvasElement;
    this.messageBox = new MessageBox(this.canvasElement);

    document.getElementById("speedMinus").onclick = () => this.onSpeedMinus();
  }

  onSpeedMinus() {
    console.log(this.visualizer);
  }
}
