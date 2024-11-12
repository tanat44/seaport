import { Vector2 } from "three";
import { TruckId } from "../Truck/Truck";
import { intraCombination } from "./Combination";
import { Simplifier } from "./Simplifier";

const SAMPLING_DISTANCE = 0.5;

/**
 * Simplify control points by searching for direct connection.
 */
export class SimplifyDirectConnection extends Simplifier {
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
      const drivable = this.isDrivableStraight(cps, truckId);
      if (drivable && cps.length < bestControlPoints.length) {
        bestControlPoints = cps;
      }
    }

    return bestControlPoints;
  }

  private isDrivableStraight(path: Vector2[], truckId: TruckId): boolean {
    for (let i = 0; i < path.length - 1; ++i) {
      const from = path[i];
      const to = path[i + 1];
      const u = to.clone().sub(from).normalize();
      const length = from.distanceTo(to);
      for (let t = 0; t < length; t += SAMPLING_DISTANCE) {
        const pos = from.clone().add(u.clone().multiplyScalar(t));
        if (!this.grid.isDrivable(pos, truckId)) return false;
      }
    }

    return true;
  }
}
