import { Box2, Object3D, Vector2, Vector3 } from "three";
import { Layout } from "../PathPlanner/types";
import { Terminal } from "../Terminal/Terminal";
import {
  CONTAINER_SIZE_X,
  CONTAINER_SIZE_Y,
  CONTAINER_SIZE_Z,
} from "../Terminal/const";
import { Render } from "../Visualizer/Render";
import { CargoCoordinate } from "./CargoCoordinate";
import { VesselCargoOrder } from "./types";

let containerCount = 0;

type Container = {
  id: string;
  mesh: Object3D;
};
type Column = Container[]; // [a, b, ... , c]  a is at the bottom of the vessel, c is at the top
type Bay = Column[];
type Cargo = Bay[];

export class Vessel {
  terminal: Terminal;

  // property
  name: string;
  maxHeight: number;
  cargos: Cargo;

  // visualization
  mesh: Object3D;

  constructor(
    terminal: Terminal,
    name: string,
    beam: number,
    length: number,
    height: number,
    quayPosition: number,
    layout: Layout
  ) {
    this.terminal = terminal;
    this.name = name;
    this.maxHeight = Math.floor(height / CONTAINER_SIZE_Z);

    // init empty cargo
    const noBay = Math.floor(length / CONTAINER_SIZE_X);
    const noColumn = Math.floor(beam / CONTAINER_SIZE_Y);
    this.cargos = [];
    for (let i = 0; i < noBay; ++i) {
      const bay: Bay = [];
      for (let j = 0; j < noColumn; ++j) {
        const column: Column = [];
        bay.push(column);
      }
      this.cargos.push(bay);
    }

    // render
    this.mesh = new Object3D();
    this.mesh.position.set(quayPosition, layout.terminalSize.y, 0);

    // render foot print
    const PADDING = 5;
    const space = this.relativeSpace;
    const footPrint = Render.createPlane(
      new Box2(
        space.min.add(new Vector2(-PADDING, 0)),
        space.max.add(new Vector2(PADDING, 0))
      ),
      Render.createBasicMaterial(0xd5c9ff),
      -0.5
    );
    this.mesh.add(footPrint);
    this.terminal.visualizer.scene.add(this.mesh);

    // add cargo
    this.randomCargo();
  }

  unload(coordinate: CargoCoordinate): Container {
    const bay = this.cargos[coordinate.bay];
    const column = bay[coordinate.column];

    if (coordinate.height !== column.length - 1) {
      throw new Error(
        "Unable to unload container because there are other containers on the top"
      );
    }
    const container = column.pop();
    this.mesh.remove(container.mesh);
    return container;
  }

  planUnload(): VesselCargoOrder {
    const plan: VesselCargoOrder = [];

    // unload bay by bay, take the highest container off
    for (let i = 0; i < this.cargos.length; ++i) {
      const bay = this.cargos[i];

      // get all containers of this bay
      let allCoordinates: CargoCoordinate[] = [];
      for (let j = 0; j < bay.length; ++j) {
        const column = bay[j];
        for (let k = 0; k < column.length; ++k) {
          allCoordinates.push(new CargoCoordinate(i, j, k));
        }
      }

      // sort operation by height
      allCoordinates = allCoordinates.sort((a, b) => b.height - a.height);
      plan.push(...allCoordinates);
    }

    return plan;
  }

  get relativeSpace(): Box2 {
    return new Box2(
      new Vector2(0, 0),
      new Vector2(
        this.cargos.length * CONTAINER_SIZE_X,
        this.cargos[0].length * CONTAINER_SIZE_Y
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

  private randomCargo() {
    for (let i = 0; i < this.cargos.length; ++i) {
      const bay: Bay = this.cargos[i];
      for (let j = 0; j < bay.length; ++j) {
        const column: Column = bay[j];
        const cargoCount = Math.random() * this.maxHeight;
        for (let k = 0; k < cargoCount; ++k) {
          const id = (containerCount++).toFixed(0);

          // render container
          const coordinate = new CargoCoordinate(i, j, k);
          const containerMesh = Render.createContainer(
            coordinate.relativePosition
          );
          this.mesh.add(containerMesh);

          column.push({
            id,
            mesh: containerMesh,
          });
        }
      }
    }
  }
}
