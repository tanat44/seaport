import { Visualizer } from "../Visualizer/Visualizer";
import { UiBase } from "./UiBase";

export class JobDisplay extends UiBase {
  constructor(visualizer: Visualizer, canvasElement: HTMLElement) {
    super(visualizer, canvasElement);
  }
}
