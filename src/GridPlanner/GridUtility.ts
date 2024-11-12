import { QC_ID_PREFIX } from "../QC/Qc";
import { GridCoordinate } from "./GridCoordinate";
import { CellType } from "./types";

export class GridUtility {
  static isDrivableCell(
    type: CellType,
    TruckId: string,
    ignoreTraffic: boolean = true
  ): boolean {
    if (type === "yard") return false;
    if (ignoreTraffic || type === "road" || type.startsWith(QC_ID_PREFIX))
      return true;
    return type === TruckId;
  }

  static getPassingGrid(
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
