import { GridCoordinate } from "./GridCoordinate";
import { GridPlanner } from "./GridPlanner";
import { MinGridHeap } from "./MinGridHeap";
import { Grid, GridPath } from "./types";

export class AStar {
  public static search(
    start: GridCoordinate,
    goal: GridCoordinate,
    map: Grid
  ): GridPath {
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

  private static reconstructPath(
    cameFrom: Map<string, string>,
    current: GridCoordinate
  ): GridPath {
    const reverse_path: GridPath = [current];
    while (cameFrom.has(current.hash())) {
      current = GridCoordinate.fromHash(cameFrom.get(current.hash()));
      reverse_path.push(current);
    }

    const forward_path: GridPath = [];
    for (let i = reverse_path.length - 1; i >= 0; --i) {
      forward_path.push(reverse_path[i]);
    }
    return forward_path;
  }

  private static neighbors(pos: GridCoordinate, map: Grid): GridCoordinate[] {
    const neighbors: GridCoordinate[] = [];
    let x = pos.x;
    let y = pos.y;

    // top
    const height = map.length;
    const top = new GridCoordinate(pos.x, pos.y + 1);
    if (top.y < height && GridPlanner.isDrivableCell(map[top.y][top.x]))
      neighbors.push(top);

    // bottom
    const bottom = new GridCoordinate(pos.x, pos.y - 1);
    if (bottom.y >= 0 && GridPlanner.isDrivableCell(map[bottom.y][bottom.x]))
      neighbors.push(bottom);

    // right
    const width = map[0].length;
    const right = new GridCoordinate(pos.x + 1, pos.y);
    if (right.x < width && GridPlanner.isDrivableCell(map[right.y][right.x]))
      neighbors.push(right);

    // left
    const left = new GridCoordinate(pos.x - 1, pos.y);
    if (left.x >= 0 && GridPlanner.isDrivableCell(map[left.y][left.x]))
      neighbors.push(left);

    return neighbors;
  }
}
