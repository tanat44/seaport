import { Vector2 } from "three";
import { Layout } from "../Layout/types";
import { TruckId } from "../Truck/Truck";
import { Visualizer } from "../Visualizer/Visualizer";
import { AStar } from "./AStar";
import { GridCoordinate } from "./GridCoordinate";
import { GridPose } from "./GridPose";
import { GridSimplifier } from "./GridSimplifier";
import { OccupySpaces } from "./OccupySpaces";
import { CellType, GridMap, GridPath } from "./types";

export const GRID_SIZE = 5;

export class Grid {
  visualizer: Visualizer;
  layout: Layout;
  grid: GridMap;
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
    truckId: TruckId,
    ignoreTraffic: boolean
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

    let path: GridPath;
    const tempGrid = Grid.copyGrid(this.grid);
    try {
      path = AStar.search(
        afterStartGrid,
        beforeEndGrid,
        tempGrid,
        truckId,
        ignoreTraffic
      );

      path.unshift(fromGrid); // insert original 'from' at index 0
      path.push(toGrid); // add original 'to' at last index
    } catch (error) {
      this.printGrid(tempGrid);
      throw error;
    }

    // simplify grid space
    const simplePath1 = GridSimplifier.simplify(path);
    const simplifiedPath = simplePath1.map((pos) => pos.toVector2(GRID_SIZE));

    // replace first and last with exact from and to position
    simplifiedPath[0].copy(from);
    simplifiedPath[simplifiedPath.length - 1].copy(to);

    return simplifiedPath;
  }

  isDrivable(pos: Vector2, truckId: TruckId): boolean {
    const coordinate = GridCoordinate.fromVector2(pos, GRID_SIZE);
    const type = this.grid[coordinate.y][coordinate.x];
    return Grid.isDrivableCell(type, truckId);
  }

  static isDrivableCell(
    type: CellType,
    TruckId: TruckId,
    ignoreTraffic: boolean = true
  ): boolean {
    if (type === "yard") return false;
    if (ignoreTraffic || type === "road") return true;
    return type === TruckId;
  }

  private isInYardBlock(pos: Vector2): boolean {
    for (const yard of this.layout.yardSpaces) {
      if (yard.containsPoint(pos)) return true;
    }
    return false;
  }

  private printGrid(grid: GridMap) {
    let text = "";
    for (let i = grid.length - 1; i >= 0; --i) {
      const row = grid[i];
      for (const type of row) {
        if (type === "road") text += "o";
        else if (type === "yard") text += "x";
        else {
          text += type[type.length - 1];
        }
      }
      text += "\n";
    }
    console.log(text);
  }

  private static copyGrid(grid: GridMap): GridMap {
    const newGrid: GridMap = grid.map((row) => {
      const newRow = row.map((cell) => cell);
      return newRow;
    });
    return newGrid;
  }
}
