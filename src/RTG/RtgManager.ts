import { Vector3 } from "three";
import { SequenceId } from "../Job/Definition/JobSequence";
import { RtgEmptyMoveJob, RtgJob } from "../Job/Definition/RtgJob";
import { CONTAINER_SIZE_Y, CONTAINER_SIZE_Z } from "../Terminal/const";
import { Terminal } from "../Terminal/Terminal";
import { YardBlock } from "../Yard/YardBlock";
import { Rtg } from "./Rtg";

type RtgId = string;
export class RtgManager {
  private terminal: Terminal;
  private rtgs: Map<RtgId, Rtg>;
  private rtgYardAssignment: Map<Rtg, YardBlock>;

  private activeSequences: Map<RtgId, SequenceId | undefined>;

  constructor(terminal: Terminal, yards: YardBlock[]) {
    this.terminal = terminal;
    this.rtgs = new Map();
    this.rtgYardAssignment = new Map();
    this.activeSequences = new Map();

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
      this.rtgYardAssignment.set(rtg, yard);
      this.activeSequences.set(rtg.id, undefined);

      // move to yard origin
      const job = new RtgEmptyMoveJob([]);
      job.position = new Vector3(0, 0, rtg.height);
      rtg.execute(job);
    }
  }

  execute(job: RtgJob): boolean {
    const activeSequenceId = this.activeSequences.get(job.rtgId);
    if (activeSequenceId !== undefined && activeSequenceId !== job.sequenceId)
      return false;

    const rtg = this.getRtg(job.rtgId);
    if (rtg.idle) {
      this.activeSequences.set(job.rtgId, job.sequenceId);
      rtg.execute(job);
      return true;
    }

    return false;
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

  releaseRtg(rtgId: string) {
    this.activeSequences.set(rtgId, undefined);
  }
}
