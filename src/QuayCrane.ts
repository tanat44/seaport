import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { Manager } from "./Manager";

const LEG_SIZE = 0.3;
const SPREADER_THICKNESS = 0.6;

export class QuayCrane {
  manager: Manager;
  width: number;
  height: number;
  legSpan: number;
  outReach: number;

  // mesh
  model: Object3D; // root mesh
  static: Mesh[];
  trolley: Mesh;
  spreader: Mesh;

  constructor(
    manager: Manager,
    width: number = 10,
    height: number = 20,
    legSpan: number = 10,
    outReach: number = 10
  ) {
    this.manager = manager;
    this.width = width;
    this.height = height;
    this.legSpan = legSpan;
    this.outReach = outReach;

    this.buildModel();
  }

  buildModel() {
    this.model = new Object3D();

    // leg
    const heightTopLevel = this.height + SPREADER_THICKNESS;
    this.static = [];
    const legGeometry = new BoxGeometry(LEG_SIZE, LEG_SIZE, heightTopLevel);
    const legMaterial = new MeshBasicMaterial({ color: "#3b4452" });

    // legBL
    const legBL = new Mesh(legGeometry, legMaterial);
    legBL.position.set(-this.width / 2, -this.legSpan / 2, heightTopLevel / 2);

    // legBR
    const legBR = new Mesh(legGeometry, legMaterial);
    legBR.position.set(this.width / 2, -this.legSpan / 2, heightTopLevel / 2);

    // legTL
    const legTL = new Mesh(legGeometry, legMaterial);
    legTL.position.set(-this.width / 2, this.legSpan / 2, heightTopLevel / 2);

    // legTR
    const legTR = new Mesh(legGeometry, legMaterial);
    legTR.position.set(this.width / 2, this.legSpan / 2, heightTopLevel / 2);
    this.model.add(legBL, legBR, legTL, legTR);
    this.static.push(legBL, legBR, legTL, legTR);

    // rail
    const railL = new Mesh(
      new BoxGeometry(LEG_SIZE, this.legSpan + this.outReach, LEG_SIZE),
      legMaterial
    );
    railL.position.set(-this.width / 4, this.outReach / 2, heightTopLevel);
    const railR = new Mesh(
      new BoxGeometry(LEG_SIZE, this.legSpan + this.outReach, LEG_SIZE),
      legMaterial
    );
    railR.position.set(this.width / 4, this.outReach / 2, heightTopLevel);
    this.model.add(railL, railR);
    this.static.push(railL, railR);

    // machine room
    const machineH = this.width / 5;
    const machineRoom = new Mesh(
      new BoxGeometry(this.width / 3, this.legSpan / 3, machineH),
      legMaterial
    );
    machineRoom.position.set(
      0,
      -this.legSpan / 4,
      heightTopLevel + machineH / 2
    );
    this.model.add(machineRoom);
    this.static.push(machineRoom);

    // trolley
    const trolleyGeometry = new BoxGeometry(
      this.width / 2,
      this.width / 4,
      SPREADER_THICKNESS
    );
    this.trolley = new Mesh(
      trolleyGeometry,
      new MeshBasicMaterial({ color: "#f54b42" })
    );
    this.trolley.position.set(0, this.legSpan + this.outReach / 2, this.height);
    this.model.add(this.trolley);

    // spreader
    this.spreader = new Mesh(
      trolleyGeometry,
      new MeshBasicMaterial({ color: "#b1ff14" })
    );
    this.spreader.position.set(0, 0, this.height * -0.2);
    this.trolley.add(this.spreader);

    this.manager.scene.add(this.model);
  }

  move(position: Vector3) {}
}
