import { Vector2 } from "three";
import { QuayCraneGantryEvent } from "../Event/types";
import { QuayCraneSpace } from "../QuayCrane/QuayCraneSpace";
import { Terminal } from "../Terminal/Terminal";
import { AStar } from "./AStar";
import { GridCoordinate } from "./GridCoordinate";
import { SimplifyPath1 } from "./SimplifyPath1";
import { SimplifyPath2 } from "./SimplifyPath2";
import { CellType, Grid, Layout } from "./types";

export const GRID_SIZE = 5;

export class GridPlanner {
  terminal: Terminal;
  layout: Layout;
  grid: Grid;
  quayCraneSpaces: Map<string, QuayCraneSpace>;

  constructor(terminal: Terminal, layout: Layout) {
    this.terminal = terminal;
    this.layout = layout;

    // initialize grid
    this.grid = [];
    for (let y = 0; y < Math.floor(layout.terminalSize.y); y += GRID_SIZE) {
      const row: CellType[] = [];
      for (let x = 0; x < Math.floor(layout.terminalSize.x); x += GRID_SIZE) {
        const pos = new Vector2(x, y);
        row.push(this.isInYardBlock(pos) ? CellType.Yard : CellType.Road);
      }
      this.grid.push(row);
    }

    this.quayCraneSpaces = new Map();
    this.terminal.visualizer.onEvent<QuayCraneGantryEvent>(
      "quaycranegantry",
      (e) => {
        this.onQuayCraneGantry(e);
      }
    );
  }

  findPath(from: Vector2, to: Vector2) {
    if (!this.isDrivable(from))
      throw new Error("Cannot find path from non drivable point");

    if (!this.isDrivable(to))
      throw new Error("Cannot find path to non drivable point");

    // find path
    const fromGrid = GridCoordinate.fromVector2(from, GRID_SIZE);
    const toGrid = GridCoordinate.fromVector2(to, GRID_SIZE);
    const path = AStar.search(fromGrid, toGrid, this.grid);
    // return path.map((pos) => pos.toVector2(GRID_SIZE));

    // simplify1
    const simplePath1 = SimplifyPath1.simplify(path);
    // return simplePath1.map((pos) => pos.toVector2(GRID_SIZE));

    // simplify2
    const simplify = new SimplifyPath2(this.grid);
    const simplePath2 = simplify.simplify(simplePath1);
    return simplePath2.map((pos) => pos.toVector2(GRID_SIZE));
  }

  isDrivable(pos: Vector2): boolean {
    const coordinate = GridCoordinate.fromVector2(pos, GRID_SIZE);
    const type = this.grid[coordinate.y][coordinate.x];
    return GridPlanner.isDrivableCell(type);
  }

  static isDrivableCell(type: CellType): boolean {
    return type === CellType.Road || type === CellType.UnderQuayCrane;
  }

  private isInYardBlock(pos: Vector2): boolean {
    for (const yard of this.layout.yardSpaces) {
      if (yard.containsPoint(pos)) return true;
    }
    return false;
  }

  private onQuayCraneGantry(e: QuayCraneGantryEvent) {
    if (!this.grid) return;

    const quayCraneId = e.quayCraneId;
    if (!this.quayCraneSpaces.has(quayCraneId)) {
      this.quayCraneSpaces.set(
        quayCraneId,
        new QuayCraneSpace(this.terminal.visualizer)
      );
    }

    const space = this.quayCraneSpaces.get(quayCraneId);
    space.updateGrid(e.absoluteSpace, this.grid);
  }
}
