import { Vector2 } from "three";
import { Layout } from "../PathPlanner/types";
import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";
import { CONTAINER_SIZE_Z, YARD_MAX_TIER } from "../Terminal/const";
import { Terminal } from "../Terminal/Terminal";
import { YardBlock } from "./YardBlock";
import { YardCoordinate } from "./YardCoordinate";

export class YardManager {
  terminal: Terminal;
  yardBlocks: Map<string, YardBlock>;

  constructor(terminal: Terminal, layout: Layout) {
    this.terminal = terminal;

    this.yardBlocks = new Map();
    for (const yardSpace of layout.yardSpaces) {
      const yard = new YardBlock(
        terminal,
        yardSpace,
        YARD_MAX_TIER * CONTAINER_SIZE_Z
      );
      yard.addRandomCargo();
      this.yardBlocks.set(yard.id, yard);
    }
  }

  findStorage(): YardCoordinate {
    // pick random yard
    const yardIndex = Math.floor(Math.random() * this.yardBlocks.size);
    const yardId = Array.from(this.yardBlocks.keys())[yardIndex];
    const yard = this.yardBlocks.get(yardId);

    const pos = yard.findStorage();
    return new YardCoordinate(yardId, pos.bay, pos.row, pos.tier);
  }

  getContainerHandlingPoint(coordinate: YardCoordinate): Vector2 {
    const yard = this.yardBlocks.get(coordinate.yardId);
    if (!yard) throw new Error("Yard doesn't exist");

    // handling at same bay, row -1, tier 0
    const handlingCoordinate = new StorageCoordinate(coordinate.bay, -1, 0);
    const pos = handlingCoordinate.relativePosition.add(yard.position);
    return new Vector2(pos.x, pos.y);
  }
}
