import { Vector2 } from "three";
import { PathUtility } from "../Generic/PathUtility";
import { TruckId } from "../Truck/Truck";
import { intraCombination } from "./Combination";
import { Simplifier } from "./Simplifier";

/**
 * Minimize control points path simplifier algorithm by picking set of control points. First, it calculates all possible set of combinations. Secondly, check if the result combination is drivable grid.
 */
export class MinimizeControlPoints extends Simplifier {
  override simplify(
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
      const path = PathUtility.createCurveControlPoints(cps, fromDir, toDir);
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
}
