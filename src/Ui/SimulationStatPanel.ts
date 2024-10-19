import {
  JobSequenceStatusChangeEvent,
  JobStatusChangeEvent,
} from "../Event/JobEvent";
import { SimulationTimeUpdateEvent } from "../Event/SimulationEvent";
import { SequenceStatus } from "../Job/Definition/JobSequence";
import { Visualizer } from "../Visualizer/Visualizer";
import { UiBase } from "./UiBase";

export class SimulationStatPanel extends UiBase {
  private completeContainers: number;
  private countEvents: number;

  constructor(visualizer: Visualizer, canvasElement: HTMLElement) {
    super(visualizer, canvasElement);

    this.completeContainers = 0;
    this.countEvents = 0;

    // register equipment event
    this.visualizer.onEvent<SimulationTimeUpdateEvent>(
      "simulationtimeupdate",
      (e) => this.onSimulationTimeUpdate(e)
    );
    this.visualizer.onEvent<JobSequenceStatusChangeEvent>(
      "jobsequencestatuschange",
      (e) => this.onJobSequenceStatusChange(e)
    );
    this.visualizer.onEvent<JobStatusChangeEvent>("jobstatuschange", (e) =>
      this.onJobStatusChange(e)
    );
  }

  private onSimulationTimeUpdate(e: SimulationTimeUpdateEvent) {
    const element = document.getElementById("simulationTime");
    const time = new Date(0);
    time.setMilliseconds(e.time * 1000);
    const timeString = time.toISOString().split("T")[1].replace("Z", "");
    element.innerHTML = timeString;
  }

  private onJobSequenceStatusChange(e: JobSequenceStatusChangeEvent) {
    if (e.sequence.status === SequenceStatus.Complete)
      ++this.completeContainers;

    const element = document.getElementById("simulationContainers");
    element.innerHTML = this.completeContainers.toFixed(0);
  }

  private onJobStatusChange(e: JobStatusChangeEvent) {
    ++this.countEvents;

    const element = document.getElementById("simulationEvents");
    element.innerHTML = this.countEvents.toFixed(0);
  }
}
