import { Visualizer } from "../Visualizer/Visualizer";

export abstract class UiBase {
  visualizer: Visualizer;
  canvasElement: HTMLElement;

  constructor(visualizer: Visualizer, canvasElement: HTMLElement) {
    this.visualizer = visualizer;
    this.canvasElement = canvasElement;
  }
}
