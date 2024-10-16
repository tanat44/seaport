import { GridPlanner } from "./GridPlanner";
import { GridPose } from "./GridPose";
import { MinGridHeap } from "./MinGridHeap";
import { Grid, GridPath } from "./types";

export class AStar {
  public static search(start: GridPose, goal: GridPose, map: Grid): GridPath {
    const openSet = new MinGridHeap();
    openSet.add(start.distanceTo(goal), start);

    const cameFrom = new Map<string, string>(); // map (current) hash of grid coordinate to (previous) hash of grid coordinate

    // For node n, gScore[n] is the cost of the cheapest path from start to n currently known.
    const gScore = new Map<string, number>();
    gScore.set(start.hash, 0);

    // For node n, fScore[n] := gScore[n] + h(n). fScore[n] represents our current best guess as to
    // how cheap a path could be from start to finish if it goes through n.
    const fScore = new Map<string, number>();
    fScore.set(start.hash, start.distanceTo(goal));

    while (!openSet.empty) {
      // This operation can occur in O(Log(N)) time if openSet is a min-heap or a priority queue
      const current = openSet.remove();
      if (current.equalTo(goal))
        return AStar.reconstructPath(cameFrom, current);

      const neighbors = this.neighbors(current, map);

      for (const neighbor of neighbors) {
        const score = gScore.get(current.hash) ?? Infinity;
        const tentative_gScore = score + 1;
        const neighborHash = neighbor.hash;
        const scoreNeighbor = gScore.get(neighborHash) ?? Infinity;
        if (tentative_gScore < scoreNeighbor) {
          cameFrom.set(neighborHash, current.hash);
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
    current: GridPose
  ): GridPath {
    const reverse_path: GridPose[] = [current];
    while (cameFrom.has(current.hash)) {
      current = GridPose.hashToGridPose(cameFrom.get(current.hash));
      reverse_path.push(current);
    }

    const forward_path: GridPose[] = [];
    for (let i = reverse_path.length - 1; i >= 0; --i) {
      forward_path.push(reverse_path[i]);
    }
    return forward_path;
  }

  private static neighbors(current: GridPose, map: Grid): GridPose[] {
    const width = map[0].length;
    const height = map.length;

    const validNeighbors: GridPose[] = [];
    for (const pos of current.neighbors) {
      const outOfBound =
        pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height;
      if (outOfBound) continue;

      const drivable = GridPlanner.isDrivableCell(map[pos.y][pos.x]);
      if (!drivable) {
        continue;
      }

      validNeighbors.push(pos);
    }

    return validNeighbors;
  }
}
