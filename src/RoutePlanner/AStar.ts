import { CellType, Grid } from "../types";
import { GridCoordinate } from "./GridCoordinate";
import { MinGridHeap } from "./MinGridHeap";

export class AStar {
  static reconstructPath(
    cameFrom: Map<string, string>,
    current: GridCoordinate
  ): GridCoordinate[] {
    const total_path: GridCoordinate[] = [current];
    while (cameFrom.has(current.hash())) {
      current = GridCoordinate.fromHash(cameFrom.get(current.hash()));
      total_path.push(current);
    }
    return total_path;
  }

  static neighbors(pos: GridCoordinate, map: Grid): GridCoordinate[] {
    const neighbors: GridCoordinate[] = [];
    let x = pos.x;
    let y = pos.y;

    // top
    const height = map.length;
    x = pos.x;
    y = pos.y + 1;
    if (y < height && map[y][x] === CellType.Drivable)
      neighbors.push(new GridCoordinate(x, y));

    // bottom
    x = pos.x;
    y = pos.y - 1;
    if (y >= 0 && map[y][x] === CellType.Drivable)
      neighbors.push(new GridCoordinate(x, y));

    // right
    const width = map[0].length;
    x = pos.x + 1;
    y = pos.y;
    if (x < width && map[y][x] === CellType.Drivable)
      neighbors.push(new GridCoordinate(x, y));

    // bottom
    x = pos.x - 1;
    y = pos.y;
    if (x >= 0 && map[y][x] === CellType.Drivable)
      neighbors.push(new GridCoordinate(x, y));
    return neighbors;
  }

  static search(
    start: GridCoordinate,
    goal: GridCoordinate,
    map: Grid
  ): GridCoordinate[] {
    const openSet = new MinGridHeap();
    openSet.add(start.distanceTo(goal), start);

    const cameFrom = new Map<string, string>(); // map hash of grid coordinate

    // For node n, gScore[n] is the cost of the cheapest path from start to n currently known.
    const gScore = new Map<string, number>();
    gScore.set(start.hash(), 0);

    // For node n, fScore[n] := gScore[n] + h(n). fScore[n] represents our current best guess as to
    // how cheap a path could be from start to finish if it goes through n.
    const fScore = new Map<string, number>();
    fScore.set(start.hash(), start.distanceTo(goal));

    while (!openSet.empty) {
      // This operation can occur in O(Log(N)) time if openSet is a min-heap or a priority queue
      const current = openSet.remove();
      if (current.equalTo(goal))
        return AStar.reconstructPath(cameFrom, current);

      const neighbors = this.neighbors(current, map);
      for (const neighbor of neighbors) {
        const score = gScore.get(current.hash()) ?? Infinity;
        const tentative_gScore = score + 1;
        const neighborHash = neighbor.hash();
        const scoreNeighbor = gScore.get(neighborHash) ?? Infinity;
        if (tentative_gScore < scoreNeighbor) {
          cameFrom.set(neighborHash, current.hash());
          gScore.set(neighborHash, tentative_gScore);
          const nScore = tentative_gScore + neighbor.distanceTo(goal);
          fScore.set(neighborHash, nScore);
          if (!openSet.has(neighbor)) {
            openSet.add(nScore, neighbor);
          }
        }
      }
    }

    throw new Error("No solution found");
  }
}
