import { LayoutManager } from "../Layout/LayoutManager";
import { QC_WIDTH } from "../QC/Qc";
import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { TrafficManager } from "../Truck/TrafficManager";
import { Vessel } from "../Vessel/Vessel";
import { Visualizer } from "../Visualizer/Visualizer";
import { YardManager } from "../Yard/YardManager";
import { TerminalRunner } from "./TerminalRunner";

const VESSEL_NAME = "Vessel-Polo";
const TRUCK_COUNT = 7;
export class Terminal {
  visualizer: Visualizer;
  layoutManager: LayoutManager;

  // storage
  vessels: Map<string, Vessel>;
  yardManager: YardManager;

  // equipment
  qcManager: QcManager;
  rtgManager: RtgManager;
  truckManager: TrafficManager;

  // operation
  terminalRunner: TerminalRunner;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.init();
  }

  private async init() {
    // wait for layout to load
    this.layoutManager = new LayoutManager(this.visualizer);
    const layout = await this.layoutManager.load();

    // init vessel
    this.vessels = new Map();
    this.vessels.set(
      VESSEL_NAME,
      new Vessel(this, VESSEL_NAME, 10, 50, 12, 70, layout)
    );

    // init yard, qc, rtg, truck
    this.yardManager = new YardManager(this, layout);
    this.qcManager = new QcManager(this, layout.quayCraneOrigins);
    this.rtgManager = new RtgManager(this, this.yardManager.allYards);
    this.truckManager = new TrafficManager(this.visualizer, layout, 6);

    // get vessel plan
    const vessel = this.vessels.get(VESSEL_NAME);
    const qcPlans = vessel.planUnloadUsingQc(3, QC_WIDTH);

    // execute the plan
    this.terminalRunner = new TerminalRunner(
      this.visualizer,
      this.qcManager,
      this.rtgManager,
      this.truckManager,
      this.yardManager
    );
    this.terminalRunner.run(qcPlans, vessel);
  }
}
