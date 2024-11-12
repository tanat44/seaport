import { Vector2 } from "three";
import { Grid } from "../GridPlanner/Grid";
import { TruckId } from "../Truck/Truck";

export class Simplifier {
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
    return [];
  }
}
