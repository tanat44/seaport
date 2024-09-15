import { Box2, Vector2 } from "three";
import { Layout } from "../PathPlanner/types";
import { StorageBlock } from "../StorageBlock/StorageBlock";
import { Terminal } from "../Terminal/Terminal";
import { Render } from "../Visualizer/Render";

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
}
