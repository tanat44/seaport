import { Box2 } from "three";
import { CellType, Grid } from "./types";
import { Visualizer } from "../Visualizer/Visualizer";
import { QcGantryEvent } from "../Event/QcEvent";
import { TruckMoveEvent } from "../Event/TruckEvent";
import { EquipmentId } from "../Event/EquipmentEvent";
import { OccupySpace } from "./OccupySpace";

export class OccupySpaces {
  private visualizer: Visualizer;
  private grid: Grid;
  private spaces: Map<string, OccupySpace>;

  constructor(visualizer: Visualizer, grid: Grid) {
    this.visualizer = visualizer;
    this.grid = grid;
    this.spaces = new Map();

    // register to events
    this.visualizer.onEvent<QcGantryEvent>("qcgantry", (e) => {
      this.updateSpace(e.footprint, e.qcId);
    });
    this.visualizer.onEvent<TruckMoveEvent>("truckmove", (e) => {
      this.updateSpace(e.footprint, e.truckId);
    });
  }

  isDrivableCellType(type: CellType) {
    return type.startsWith("QC") || type.startsWith("Truck");
  }

  private updateSpace(box: Box2, id: EquipmentId) {
    if (!this.spaces.has(id)) {
      this.spaces.set(id, new OccupySpace(this.visualizer));
    }

    const space = this.spaces.get(id);
    space.updateGrid(id, box, this.grid);
  }
}
