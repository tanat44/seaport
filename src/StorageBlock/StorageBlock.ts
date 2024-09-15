import { Box2, Object3D, Vector2, Vector3 } from "three";
import { Terminal } from "../Terminal/Terminal";
import {
  CONTAINER_SIZE_X,
  CONTAINER_SIZE_Y,
  CONTAINER_SIZE_Z,
} from "../Terminal/const";
import { CargoCoordinate } from "../Vessel/CargoCoordinate";
import { CargoOrder } from "../Vessel/types";
import { Render } from "../Visualizer/Render";

export type Container = {
  id: string;
  mesh: Object3D;
};

export type Row = Container[]; // [a, b, ... , c]  a is at the bottom of the vessel, c is at the top
export type Bay = Row[];

export class StorageBlock {
  static containerCount = 0;
  terminal: Terminal;

  // property
  id: string;
  length: number;
  depth: number;
  height: number;
  origin: Vector2;
  maxTiers: number;
  bays: Bay[];

  // render
  mesh: Object3D;

  constructor(
    terminal: Terminal,
    id: string,
    length: number,
    depth: number,
    height: number,
    origin: Vector2
  ) {
    this.terminal = terminal;
    this.id = id;
    this.length = length;
    this.depth = depth;
    this.height = height;
    this.origin = origin.clone();
    this.maxTiers = Math.floor(height / CONTAINER_SIZE_Z);
    this.bays = [];

    // init empty cargo
    const noBay = Math.floor(length / CONTAINER_SIZE_X);
    const noRow = Math.floor(depth / CONTAINER_SIZE_Y);
    for (let i = 0; i < noBay; ++i) {
      const bay: Bay = [];
      for (let j = 0; j < noRow; ++j) {
        const row: Row = [];
        bay.push(row);
      }
      this.bays.push(bay);
    }

    // render
    this.mesh = new Object3D();
    this.mesh.position.set(origin.x, origin.y, 0);
    this.terminal.visualizer.scene.add(this.mesh);
  }

  unload(coordinate: CargoCoordinate): Container {
    const bay = this.bays[coordinate.bay];
    const row = bay[coordinate.row];

    if (coordinate.tier !== row.length - 1) {
      throw new Error(
        "Unable to unload container because there are other containers on the top"
      );
    }
    const container = row.pop();
    this.mesh.remove(container.mesh);
    return container;
  }

  planFullUnload(): CargoOrder {
    const plan: CargoOrder = [];

    // unload bay by bay, take the highest container off
    for (let i = 0; i < this.bays.length; ++i) {
      const bay = this.bays[i];

      // get all containers of this bay
      let allCoordinates: CargoCoordinate[] = [];
      for (let j = 0; j < bay.length; ++j) {
        const row = bay[j];
        for (let k = 0; k < row.length; ++k) {
          allCoordinates.push(new CargoCoordinate(i, j, k));
        }
      }

      // sort operation by height
      allCoordinates = allCoordinates.sort((a, b) => b.tier - a.tier);
      plan.push(...allCoordinates);
    }

    return plan;
  }

  get relativeSpace(): Box2 {
    return new Box2(
      new Vector2(0, 0),
      new Vector2(
        this.bays.length * CONTAINER_SIZE_X,
        this.bays[0].length * CONTAINER_SIZE_Y
      )
    );
  }

  get absoluteSpace(): Box2 {
    const box = this.relativeSpace;
    const pos = new Vector2(this.mesh.position.x, this.mesh.position.y);
    return new Box2(box.min.add(pos), box.max.add(pos));
  }

  get position(): Vector3 {
    return this.mesh.position.clone();
  }

  addRandomCargo() {
    for (let i = 0; i < this.bays.length; ++i) {
      const bay: Bay = this.bays[i];
      for (let j = 0; j < bay.length; ++j) {
        const row: Row = bay[j];
        const cargoCount = Math.random() * this.maxTiers;
        for (let k = 0; k < cargoCount; ++k) {
          const id = (StorageBlock.containerCount++).toFixed(0);

          // render container
          const coordinate = new CargoCoordinate(i, j, k);
          const containerMesh = Render.createContainer(
            coordinate.relativePosition
          );
          this.mesh.add(containerMesh);

          row.push({
            id,
            mesh: containerMesh,
          });
        }
      }
    }
  }
}
