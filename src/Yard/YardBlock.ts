import { Box2, Vector2 } from "three";
import { StorageBlock } from "../StorageBlock/StorageBlock";
import { Terminal } from "../Terminal/Terminal";

export class YardBlock extends StorageBlock {
  static yardBlockCount = 0;

  constructor(terminal: Terminal, space: Box2, height: number) {
    const size = new Vector2();
    space.getSize(size);
    super(
      terminal,
      `Yard-${YardBlock.yardBlockCount++}`,
      size.x,
      size.y,
      height,
      space.min
    );
  }
}
