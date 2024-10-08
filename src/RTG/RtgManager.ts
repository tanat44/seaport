import { Vector3 } from "three";
import { RtgMoveEndEvent } from "../Event/types";
import { CONTAINER_SIZE_Y, CONTAINER_SIZE_Z } from "../Terminal/const";
import { Terminal } from "../Terminal/Terminal";
import { YardBlock } from "../Yard/YardBlock";
import { Rtg } from "./Rtg";
import { RtgEmptyMoveJob, RtgJob } from "./types";

type RtgId = string;

export class RtgManager {
  private terminal: Terminal;
  private rtgs: Map<RtgId, Rtg>;
  private rtgYardAssignment: Map<Rtg, YardBlock>;
  private jobQueues: Map<Rtg, RtgJob[]>;

  constructor(terminal: Terminal, yards: YardBlock[]) {
    this.terminal = terminal;
    this.rtgs = new Map();
    this.rtgYardAssignment = new Map();
    this.jobQueues = new Map();

    // create one rtg per yard
    for (const yard of yards) {
      const truckLaneSize = CONTAINER_SIZE_Y * 2;
      const origin = yard.position;
      origin.y -= truckLaneSize;
      const rtg = new Rtg(
        this.terminal.visualizer,
        origin,
        7,
        yard.height + CONTAINER_SIZE_Z,
        yard.depth + truckLaneSize
      );
      this.rtgs.set(rtg.id, rtg);

      // assign rtg to yard
      this.rtgYardAssignment.set(rtg, yard);

      // init job queue
      this.jobQueues.set(rtg, []);

      // move to yard origin
      const job: RtgEmptyMoveJob = {
        reason: "rtgemptymove",
        rtgId: rtg.id,
        position: new Vector3(0, 0, rtg.height),
      };
      rtg.execute(job);
    }

    this.terminal.visualizer.onEvent<RtgMoveEndEvent>("rtgmoveend", (e) =>
      this.onMoveEnd(e)
    );
  }

  queueRtgJob(job: RtgJob) {
    const rtg = this.rtgs.get(job.rtgId);
    const jobQueue = this.jobQueues.get(rtg);
    if (!jobQueue) throw new Error("No job queue for rtg id: " + job.rtgId);

    // execute immediately if rtg is idle
    if (!rtg.busy) {
      rtg.execute(job);
    } else {
      jobQueue.push(job);
    }
  }

  findRtg(yardId: string): string | undefined {
    for (const [rtg, yard] of this.rtgYardAssignment) {
      if (yard.id === yardId) return rtg.id;
    }
    return undefined;
  }

  findYard(rtgId: string): YardBlock {
    const rtg = this.rtgs.get(rtgId);
    const yard = this.rtgYardAssignment.get(rtg);

    if (!rtg || !yard) throw new Error("Unable to find yard for rtg id");

    return yard;
  }

  getRtg(rtgId: string): Rtg {
    return this.rtgs.get(rtgId);
  }

  private onMoveEnd(e: RtgMoveEndEvent) {
    const rtg = this.rtgs.get(e.rtgId);
    const jobQueue = this.jobQueues.get(rtg);

    // do next job
    if (jobQueue.length > 0) {
      const nextJob = jobQueue.shift();
      rtg.execute(nextJob);
    }
  }
}
