import { Box2, Mesh, Vector2 } from "three";
import { GridBox } from "./GridBox";
import { GridCoordinate } from "./GridCoordinate";
import { GRID_SIZE } from "./GridPlanner";
import { CellType } from "./types";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";

const HIGHLIGHT_MESH_HEIGHT = 0.5;

export class OccupySpace {
  private visualizer: Visualizer;
  private occupyCells: Set<string>;
  private gridBox: GridBox;
  private highlightMesh: Mesh;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.occupyCells = new Set();
    this.gridBox = new GridBox(0, 0, 0, 0);

    this.highlightMesh = Render.createPlane(
      new Box2(new Vector2(-0.5, -0.5), new Vector2(0.5, 0.5)),
      Render.createBasicMaterial(0x333333, 0.2),
      HIGHLIGHT_MESH_HEIGHT
    );
    this.visualizer.scene.add(this.highlightMesh);
  }

  updateGrid(equipmentId: string, newBox: Box2, grid: CellType[][]) {
    const newGridBox: GridBox = new GridBox(
      Math.floor(newBox.min.x / GRID_SIZE),
      Math.floor(newBox.min.y / GRID_SIZE),
      Math.ceil(newBox.max.x / GRID_SIZE),
      Math.ceil(newBox.max.y / GRID_SIZE)
    );

    // clamp new grid box value
    if (newGridBox.minx < 0) newGridBox.minx = 0;
    if (newGridBox.miny < 0) newGridBox.miny = 0;
    if (newGridBox.maxx > grid[0].length - 1)
      newGridBox.maxx = grid[0].length - 1;
    if (newGridBox.maxy > grid.length - 1) newGridBox.maxy = grid.length - 1;

    if (this.gridBox.equal(newGridBox)) return;

    const toClearCells = new Set<string>(this.occupyCells);

    for (let y = newGridBox.miny; y < newGridBox.maxy; y += 1) {
      for (let x = newGridBox.minx; x < newGridBox.maxx; x += 1) {
        const hash = new GridCoordinate(x, y).hash;
        if (this.occupyCells.has(hash)) {
          toClearCells.delete(hash);
          continue;
        } else if (grid[y][x] === "road") {
          grid[y][x] = equipmentId;
          this.occupyCells.add(hash);
        }
      }
    }

    // clear cells
    for (const cell of Array.from(toClearCells)) {
      const pos = GridCoordinate.fromHash(cell);
      grid[pos.y][pos.x] = "road";
    }

    // cache gridbox
    this.gridBox = newGridBox;

    // update highlight mesh
    const highlightBox = newGridBox.toBox2(GRID_SIZE);
    const scale = new Vector2();
    highlightBox.getSize(scale);
    const center = new Vector2();
    highlightBox.getCenter(center);
    this.highlightMesh.position.set(center.x, center.y, HIGHLIGHT_MESH_HEIGHT);
    this.highlightMesh.scale.set(scale.x, scale.y, 1);
  }
}
