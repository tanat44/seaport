import { Vector2 } from "three";
import { QuayCraneGantryEvent } from "../Event/types";
import { Manager } from "../Manager";
import { CellType, Layout } from "../types";
import { QuayCraneSpace } from "./QuayCraneSpace";

export const GRID_SIZE = 5;

export class PlannerGrid {
  manager: Manager;
  layout: Layout;
  grid: CellType[][];
  quayCraneSpaces: Map<number, QuayCraneSpace>;

  constructor(manager: Manager, layout: Layout) {
    this.manager = manager;
    this.layout = layout;

    // initialize grid
    this.grid = [];
    for (let y = 0; y < Math.floor(layout.terminalSize.y); y += GRID_SIZE) {
      const row: CellType[] = [];
      for (let x = 0; x < Math.floor(layout.terminalSize.x); x += GRID_SIZE) {
        const pos = new Vector2(x, y);
        row.push(this.isInYardBlock(pos) ? CellType.Yard : CellType.Drivable);
      }
      this.grid.push(row);
    }

    this.quayCraneSpaces = new Map();
    this.manager.onEvent<QuayCraneGantryEvent>("quaycranegantry", (e) => {
      this.onQuayCraneGantry(e.quayCraneId);
    });
  }

  private isInYardBlock(pos: Vector2): boolean {
    for (const yard of this.layout.yardBlocks) {
      if (yard.containsPoint(pos)) return true;
    }
    return false;
  }

  private onQuayCraneGantry(quayCraneId: number) {
    if (!this.grid) return;

    const qc = this.manager.terminal.getQuayCrane(quayCraneId);
    if (!this.quayCraneSpaces.has(quayCraneId)) {
      this.quayCraneSpaces.set(quayCraneId, new QuayCraneSpace(this.manager));
    }

    const space = this.quayCraneSpaces.get(quayCraneId);
    space.updateGrid(qc.box2d, this.grid);
  }
}
