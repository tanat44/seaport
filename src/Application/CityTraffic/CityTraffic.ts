import { JobRunner } from "../../Job/JobRunner";
import { LayoutManager } from "../../Layout/LayoutManager";
import { TrafficManager } from "../../Truck/TrafficManager";
import { Visualizer } from "../../Visualizer/Visualizer";
import { CityTrafficPlanner } from "./CityTrafficPlanner";

export class CityTraffic {
  visualizer: Visualizer;
  truckManager: TrafficManager;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.init();
  }

  private async init() {
    // wait for layout to load
    const layoutManager = new LayoutManager(this.visualizer);
    const layout = await layoutManager.load();

    // init truckplanner
    this.truckManager = new TrafficManager(this.visualizer, layout, 2);

    // plan
    const planner = new CityTrafficPlanner(
      this.visualizer,
      null,
      null,
      this.truckManager,
      null
    );
    const sequences = planner.plan();

    // run operation
    const jobRunner = new JobRunner(
      this.visualizer,
      null,
      null,
      this.truckManager,
      null
    );
    // jobRunner.run(sequences);
  }
}
