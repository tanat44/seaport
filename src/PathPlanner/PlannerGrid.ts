import { Vector2 } from "three";
import { QuayCraneGantryEvent } from "../Event/types";
import { Terminal } from "../Terminal/Terminal";
import { Visualizer } from "../Visualizer/Visualizer";
import { AStar } from "./AStar";
import { GridCoordinate } from "./GridCoordinate";
import { PathPlanner } from "./PathPlanner";
import { QuayCraneSpace } from "./QuayCraneSpace";
import { SimplifyPath1 } from "./SimplifyPath1";
import { SimplifyPath2 } from "./SimplifyPath2";
import { CellType, Grid, Layout } from "./types";

export const GRID_SIZE = 5;

export class PlannerGrid {
  terminal: Terminal;
  visualizer: Visualizer;
  layout: Layout;
  grid: Grid;
  quayCraneSpaces: Map<number, QuayCraneSpace>;

  constructor(terminal: Terminal, visualizer: Visualizer, layout: Layout) {
    this.terminal = terminal;
    this.visualizer = visualizer;
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
    this.visualizer.onEvent<QuayCraneGantryEvent>("quaycranegantry", (e) => {
      this.onQuayCraneGantry(e.quayCraneId);
    });

    // install path planner
    const planner = new PathPlanner(visualizer, this);
  }

  findPath(from: Vector2, to: Vector2) {
    if (!this.drivable(from))
      throw new Error("Cannot find path from non drivable point");

    if (!this.drivable(to))
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

  drivable(pos: Vector2): boolean {
    const coordinate = GridCoordinate.fromVector2(pos, GRID_SIZE);
    return this.grid[coordinate.y][coordinate.x] === CellType.Drivable;
  }

  private isInYardBlock(pos: Vector2): boolean {
    for (const yard of this.layout.yardSpaces) {
      if (yard.containsPoint(pos)) return true;
    }
    return false;
  }

  private onQuayCraneGantry(quayCraneId: number) {
    if (!this.grid) return;

    const qc = this.terminal.getQuayCrane(quayCraneId);
    if (!this.quayCraneSpaces.has(quayCraneId)) {
      this.quayCraneSpaces.set(
        quayCraneId,
        new QuayCraneSpace(this.visualizer)
      );
    }

    const space = this.quayCraneSpaces.get(quayCraneId);
    space.updateGrid(qc.absoluteSpace, this.grid);
  }
}
