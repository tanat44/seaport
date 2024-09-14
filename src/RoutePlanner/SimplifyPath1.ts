import { GridCoordinate } from "./GridCoordinate";

enum Direction {
  Up = "Up",
  Down = "Down",
  Left = "Left",
  Right = "Right",
  Others = "Others",
}

export class SimplifyPath1 {
  static simplify(path: GridCoordinate[]): GridCoordinate[] {
    if (path.length < 2) return [...path];

    const simplePath: GridCoordinate[] = [path[0]];
    let lastDirection = SimplifyPath1.getDirection(path[0], path[1]);
    for (let i = 1; i < path.length - 1; ++i) {
      const currentDirection = SimplifyPath1.getDirection(path[i], path[i + 1]);
      if (currentDirection !== lastDirection) {
        lastDirection = currentDirection;
        simplePath.push(path[i]);
      }
    }
    simplePath.push(path[path.length - 1]);
    return simplePath;
  }

  private static getDirection(
    from: GridCoordinate,
    to: GridCoordinate
  ): Direction {
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
