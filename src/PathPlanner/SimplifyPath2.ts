import { intraCombination } from "./Combination";
import { GridCoordinate } from "./GridCoordinate";
import { GridPlanner } from "./GridPlanner";
import { Grid } from "./types";

type GridCoordinatePath = GridCoordinate[];
export class SimplifyPath2 {
  map: Grid;

  constructor(map: Grid) {
    this.map = map;
  }

  simplify(originalPath: GridCoordinatePath): GridCoordinatePath {
    if (originalPath.length < 2) return [...originalPath];

    // find all simplify path combinations
    const combinations: GridCoordinatePath[] = [];
    intraCombination<GridCoordinate>(originalPath, combinations);

    // console.log(
    //   this.drivablePath([
    //     new GridCoordinate(37, 20),
    //     new GridCoordinate(21, 20),
    //   ])
    // );
    // return originalPath;

    // check if path is drivable and has least control points
    let simplestPath: GridCoordinatePath = [...originalPath];
    for (const newPath of combinations) {
      const drivable = this.drivablePath(newPath);
      if (drivable && newPath.length < simplestPath.length) {
        simplestPath = newPath;
      }
    }

    return simplestPath;
  }

  private drivablePath(path: GridCoordinatePath): boolean {
    if (path.length < 2)
      throw new Error(
        "Invalid path because path has control points less than 2"
      );

    if (path.length == 2) {
      return this.drivable(path[0], path[1]);
    }

    for (let i = 0; i < path.length - 1; ++i) {
      const from = path[i];
      const to = path[i + 1];

      const segmentDrivable = this.drivable(from, to);
      if (!segmentDrivable) return false;
    }

    return true;
  }

  private drivable(from: GridCoordinate, to: GridCoordinate): boolean {
    const positions = SimplifyPath2.getPassingGrid(from, to);
    for (const pos of positions) {
      if (!GridPlanner.isDrivableCell(this.map[pos.y][pos.x])) {
        return false;
      }
    }
    return true;
  }

  private static getPassingGrid(
    from: GridCoordinate,
    to: GridCoordinate
  ): GridCoordinate[] {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const stepX = dx / steps;
    const stepY = dy / steps;

    const positions: GridCoordinate[] = [];
    for (let i = 0; i < steps; ++i) {
      const x = from.x + i * stepX;
      const y = from.y + i * stepY;

      const xFloor = Math.floor(x);
      const xCeil = Math.ceil(x);
      const yFloor = Math.floor(y);
      const yCeil = Math.ceil(y);
      positions.push(new GridCoordinate(xFloor, yFloor));
      if (xFloor === xCeil) {
        if (yFloor === yCeil) {
          continue;
        } else {
          positions.push(new GridCoordinate(xFloor, yCeil));
        }
      } else {
        if (yFloor === yCeil) {
          positions.push(new GridCoordinate(xCeil, yFloor));
        } else {
          positions.push(new GridCoordinate(xCeil, yCeil));
        }
      }
    }

    return positions;
  }
}
