import { JobRunner } from "../Job/JobRunner";
import { LayoutManager } from "../Layout/LayoutManager";
import { TruckManager } from "../Truck/TruckManager";
import { Visualizer } from "../Visualizer/Visualizer";

export class Terminal {
  visualizer: Visualizer;

  // equipment
  truckManager: TruckManager;

  // operation
  jobRunner: JobRunner;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.init();
  }

  private async init() {
    // wait for layout to load
    const layoutManager = new LayoutManager(this.visualizer);
    const layout = await layoutManager.load();

    // init truckplanner
    this.truckManager = new TruckManager(this.visualizer, layout);
  }
}
