import { Box2, Vector2 } from "three";
import { StorageBlock } from "../StorageBlock/StorageBlock";
import { Terminal } from "../Terminal/Terminal";
import { Render } from "../Visualizer/Render";
import { CargoOrder } from "./types";
import { Layout } from "../Layout/types";

export type QcPlan = CargoOrder[];
export class Vessel extends StorageBlock {
  constructor(
    terminal: Terminal,
    name: string,
    beam: number,
    length: number,
    height: number,
    quayMark: number,
    layout: Layout
  ) {
    const origin = new Vector2(quayMark, layout.terminalSize.y);
    super(terminal, name, length, beam, height, origin);

    // render vessel
    const PADDING = 5;
    const space = this.relativeSpace;
    const vessel = Render.createPlane(
      new Box2(
        space.min.add(new Vector2(-PADDING, 0)),
        space.max.add(new Vector2(PADDING, 0))
      ),
      Render.createBasicMaterial(0xd5c9ff),
      -0.5
    );
    this.mesh.add(vessel);

    // randomize cargo
    this.addRandomCargo();
  }

  planUnloadUsingQc(numberOfQc: number, qcWidth: number): QcPlan {
    // group plan into each bay
    const fullPlan = this.planFullUnload();
    const bayPlans = new Map<number, CargoOrder>();
    for (const cargo of fullPlan) {
      const bay = cargo.coordinate.bay;

      if (!bayPlans.has(bay)) bayPlans.set(bay, []);

      const order = bayPlans.get(bay);
      order.push(cargo);
    }

    // bays per qc
    const numberOfBays = this.bays.length;
    const baysPerQc = Math.ceil(numberOfBays / numberOfQc);

    // give plan to qc
    const qcPlans: QcPlan = [];
    for (let i = 0; i < numberOfQc; ++i) {
      qcPlans.push([]);
    }

    for (let i = 0; i < numberOfBays; ++i) {
      const bayPlan = bayPlans.get(i);
      const qcNumber = Math.floor(i / baysPerQc);
      qcPlans[qcNumber].push(...bayPlan);
    }

    return qcPlans;
  }
}
