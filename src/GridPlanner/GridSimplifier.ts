import { GridPose } from "./GridPose";

enum Direction {
  Up = "Up",
  Down = "Down",
  Left = "Left",
  Right = "Right",
  Others = "Others",
}

/**
 * Simplify grid pose align in the same direction
 * P1 -> P2 -> P3 will results in P1 -> P3 when all GridPose.direction are the same
 */
export class GridSimplifier {
  static simplify(path: GridPose[]): GridPose[] {
    if (path.length < 2) return [...path];

    const simplePath: GridPose[] = [path[0]];
    let lastDirection = GridSimplifier.getDirection(path[0], path[1]);
    for (let i = 1; i < path.length - 1; ++i) {
      const currentDirection = GridSimplifier.getDirection(
        path[i],
        path[i + 1]
      );
      if (currentDirection !== lastDirection) {
        lastDirection = currentDirection;
        simplePath.push(path[i]);
      }
    }
    simplePath.push(path[path.length - 1]);
    return simplePath;
  }

  private static getDirection(from: GridPose, to: GridPose): Direction {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 0 && dy === 1) {
      return Direction.Up;
    } else if (dx === 0 && dy === -1) {
      return Direction.Down;
    } else if (dx === 1 && dy === 0) {
      return Direction.Right;
    } else if (dx === -1 && dy === 0) {
      return Direction.Left;
    }
    return Direction.Others;
  }
}
