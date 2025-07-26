import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { TrafficManager } from "../Truck/TrafficManager";
import { Visualizer } from "../Visualizer/Visualizer";
import { YardManager } from "../Yard/YardManager";

export abstract class TerminalManager {
  visualizer: Visualizer;
  qcManager: QcManager;
  rtgManager: RtgManager;
  truckManager: TrafficManager;
  yardManager: YardManager;

  constructor(
    visualizer: Visualizer,
    qcManager: QcManager,
    rtgManager: RtgManager,
    truckManager: TrafficManager,
    yardManager: YardManager
  ) {
    this.visualizer = visualizer;
    this.qcManager = qcManager;
    this.rtgManager = rtgManager;
    this.truckManager = truckManager;
    this.yardManager = yardManager;
  }
}
