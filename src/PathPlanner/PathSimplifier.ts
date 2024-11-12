import { Vector2 } from "three";
import { PathUtility } from "../Generic/PathUtility";
import { Grid } from "../GridPlanner/Grid";
import { GridCoordinate } from "../GridPlanner/GridCoordinate";
import { TruckId } from "../Truck/Truck";
import { intraCombination } from "./Combination";

/**
 * This simplification algorithm try to reduce number of control points of the original path by picking some of the control points. First, it calculates all possible set of combinations. Secondly, check if the result combination is drivable grid.
 */
export class PathSimplifier {
  grid: Grid;

  constructor(grid: Grid) {
    this.grid = grid;
  }

  simplify(
    controlPoints: Vector2[],
    truckId: TruckId,
    fromDir: Vector2,
    toDir: Vector2
  ): Vector2[] {
    if (controlPoints.length < 2) return [...controlPoints];

    // find all simplify path combinations
    const combinations: Vector2[][] = [];
    intraCombination<Vector2>(controlPoints, combinations);

    // check if control points is drivable and has least number of points
    let bestControlPoints: Vector2[] = [...controlPoints];
    for (const cps of combinations) {
      const path = PathUtility.createCurve(cps, fromDir, toDir);
      const drivable = this.isDrivablePath(path, truckId);
      if (drivable && cps.length < bestControlPoints.length) {
        bestControlPoints = cps;
      }
    }

    return bestControlPoints;
  }

  private isDrivablePath(path: Vector2[], truckId: TruckId): boolean {
    const newPath = PathUtility.resample(path, 1);
    for (const pos of newPath) {
      if (!this.grid.isDrivable(pos, truckId)) {
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
