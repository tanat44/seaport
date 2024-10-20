import { JobRunner } from "../Job/JobRunner";
import { LayoutManager } from "../Layout/LayoutManager";
import { TruckManager } from "../Truck/TruckManager";
import { Visualizer } from "../Visualizer/Visualizer";

export class Traffic {
  visualizer: Visualizer;
  truckManager: TruckManager;

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

    // run operation
    const jobRunner = new JobRunner(
      this.visualizer,
      null,
      null,
      this.truckManager,
      null
    );
    jobRunner.run([]);
  }
}
