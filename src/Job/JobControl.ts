import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { TruckManager } from "../Truck/TruckManager";
import { Visualizer } from "../Visualizer/Visualizer";
import { YardManager } from "../Yard/YardManager";

export abstract class JobControl {
  visualizer: Visualizer;
  qcManager: QcManager;
  rtgManager: RtgManager;
  truckManager: TruckManager;
  yardManager: YardManager;

  constructor(
    visualizer: Visualizer,
    qcManager: QcManager,
    rtgManager: RtgManager,
    truckManager: TruckManager,
    yardManager: YardManager
  ) {
    this.visualizer = visualizer;
    this.qcManager = qcManager;
    this.rtgManager = rtgManager;
    this.truckManager = truckManager;
    this.yardManager = yardManager;
  }
}
