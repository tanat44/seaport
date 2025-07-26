import { Vector2 } from "three";
import { JobSequence } from "../../Job/Definition/JobSequence";
import { TruckMoveJob } from "../../Job/Definition/TruckJob";
import { TerminalManager } from "../../Terminal/TerminalManager";

export class CityTrafficPlanner extends TerminalManager {
  plan(): JobSequence[] {
    const sequences: JobSequence[] = [];

    for (let i = 0; i < 3; ++i) {
      const sequence = new JobSequence(i.toFixed(0));

      // truck move1
      const move1 = new TruckMoveJob([], new Vector2(20, 30));
      sequence.addJob(move1);

      // truck move2
      const move2 = new TruckMoveJob([move1.id], new Vector2(90, 90));
      sequence.addJob(move2);
      // truck move3
      const move3 = new TruckMoveJob([move2.id], new Vector2(20, 20));
      sequence.addJob(move3);
      sequences.push(sequence);
    }
    return sequences;
  }
}
