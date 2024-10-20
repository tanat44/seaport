import { Vector2 } from "three";
import { AStar } from "./AStar";
import { GridCoordinate } from "./GridCoordinate";
import { GridPose } from "./GridPose";
import { SimplifyPath1 } from "./SimplifyPath1";
import { CellType, Grid } from "./types";
import { Visualizer } from "../Visualizer/Visualizer";
import { Layout } from "../Layout/types";
import { OccupySpaces } from "./OccupySpaces";
import { TruckId } from "../Truck/Truck";

export const GRID_SIZE = 5;

export class GridPlanner {
  visualizer: Visualizer;
  layout: Layout;
  grid: Grid;
  occupySpaces: OccupySpaces;

  constructor(visualizer: Visualizer, layout: Layout) {
    this.visualizer = visualizer;
    this.layout = layout;

    // initialize grid
    this.grid = [];
    for (let y = 0; y < Math.floor(layout.terminalSize.y); y += GRID_SIZE) {
      const row: CellType[] = [];
      for (let x = 0; x < Math.floor(layout.terminalSize.x); x += GRID_SIZE) {
        const pos = new Vector2(x, y);
        row.push(this.isInYardBlock(pos) ? "yard" : "road");
      }
      this.grid.push(row);
    }
    console.log(`Grid size ${this.grid[0].length}x${this.grid.length}`);
    this.occupySpaces = new OccupySpaces(this.visualizer, this.grid);
  }

  findPath(
    from: Vector2,
    fromDir: Vector2,
    to: Vector2,
    toDir: Vector2,
    truckId: TruckId
  ): Vector2[] {
    if (!this.isDrivable(from, truckId)) {
      throw new Error("Cannot find path from non drivable point");
    }
    // find path
    const fromGridDir = GridPose.snapToGridDirection(fromDir);
    const fromGrid = GridPose.poseToGridPose(from, fromGridDir, GRID_SIZE);
    const afterStartGrid = fromGrid.nextGrid.nextGrid;

    const toGridDir = GridPose.snapToGridDirection(toDir);
    const toGrid = GridPose.poseToGridPose(to, toGridDir, GRID_SIZE);
    const beforeEndGrid = toGrid.beforeGrid.beforeGrid;

    const path = AStar.search(
      afterStartGrid,
      beforeEndGrid,
      this.grid,
      truckId,
      true
    );
    path.unshift(fromGrid); // insert original 'from' at index 0
    path.push(toGrid); // add original 'to' at last index

    // simplify1
    const simplePath1 = SimplifyPath1.simplify(path);
    // return simplePath1.map((pos) => pos.toVector2(GRID_SIZE));

    // simplify2
    // const simplify = new SimplifyPath2(this.grid);
    // const simplePath2 = simplify.simplify(simplePath1);

    // replace first and last with exact from and to position
    const simplifiedPath = simplePath1.map((pos) => pos.toVector2(GRID_SIZE));
    simplifiedPath[0].copy(from);
    simplifiedPath[simplifiedPath.length - 1].copy(to);
    return simplifiedPath;
  }

  isDrivable(pos: Vector2, truckId: TruckId): boolean {
    const coordinate = GridCoordinate.fromVector2(pos, GRID_SIZE);
    const type = this.grid[coordinate.y][coordinate.x];
    return GridPlanner.isDrivableCell(type, truckId);
  }

  static isDrivableCell(
    type: CellType,
    TruckId: TruckId,
    ignoreTraffic: boolean = true
  ): boolean {
    if (type === "yard") return false;
    if (ignoreTraffic) return true;
    return type === TruckId;
  }

  private isInYardBlock(pos: Vector2): boolean {
    for (const yard of this.layout.yardSpaces) {
      if (yard.containsPoint(pos)) return true;
    }
    return false;
  }
}
