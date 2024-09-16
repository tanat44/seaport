import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector2,
} from "three";
import { Terminal } from "../Terminal/Terminal";
import { CONTAINER_SIZE_X, CONTAINER_SIZE_Y } from "../Terminal/const";
import { PathPhysics } from "./PathPhysics";

const WHEEL_DIAMETER = 0.8;
const WHEEL_MATERIAL = new MeshBasicMaterial({ color: 0x333333 });
const TRUCK_MATERIAL = new MeshBasicMaterial({ color: 0x7f86e3 });
const TRUCK_WIDTH = CONTAINER_SIZE_Y * 1.1;
const WHEEL_BASE = 7;
const MAX_VELOCITY = 13.8; // 50 kph
const MAX_ACCELERATION = 3;

export class Truck {
  static count = 0;

  terminal: Terminal;

  id: number;
  model: Object3D;
  pathPhysics?: PathPhysics;

  constructor(terminal: Terminal) {
    this.terminal = terminal;
    this.id = Truck.count++;
    this.createModel();
  }

  drive(path: Vector2[]) {
    if (this.pathPhysics) {
      console.warn("Abort driving on the current path to drive new path");
    }

    this.pathPhysics = new PathPhysics(
      this.terminal.visualizer,
      path,
      MAX_VELOCITY,
      MAX_ACCELERATION,
      (position: Vector2, rotation: number) => this.update(position, rotation)
    );
  }

  update(position: Vector2, rotation: number) {
    this.model.position.set(position.x, position.y, 0);
    this.model.rotation.set(0, 0, rotation);
  }

  private createModel() {
    this.model = new Object3D();

    // wheel
    const wheelGeometry = new CylinderGeometry(
      WHEEL_DIAMETER / 2,
      WHEEL_DIAMETER / 2,
      0.2
    );
    const wheel = new Mesh(wheelGeometry, WHEEL_MATERIAL);
    const rearWheelX = -CONTAINER_SIZE_X / 2 + 1;
    const frontWheelX = WHEEL_BASE + rearWheelX;
    const halfWidth = TRUCK_WIDTH / 2;

    // wheel RR
    const wheelRR = wheel.clone();
    wheelRR.position.set(rearWheelX, -halfWidth, 0);
    this.model.add(wheelRR);
    // wheel RL
    const wheelRL = wheel.clone();
    wheelRL.position.set(rearWheelX, halfWidth, 0);
    this.model.add(wheelRL);
    // wheel FR
    const wheelFR = wheel.clone();
    wheelFR.position.set(frontWheelX, -halfWidth, 0);
    this.model.add(wheelFR);
    // wheel FL
    const wheelFL = wheel.clone();
    wheelFL.position.set(frontWheelX, halfWidth, 0);
    this.model.add(wheelFL);

    // truck bed
    const bedLength = CONTAINER_SIZE_X;
    const truckBedGeometry = new BoxGeometry(bedLength, TRUCK_WIDTH, 0.2);
    const truckBed = new Mesh(truckBedGeometry, TRUCK_MATERIAL);
    truckBed.position.set(0, 0, WHEEL_DIAMETER);
    this.model.add(truckBed);

    // cabin
    const cabinLength = 3;
    const cabinHeight = 3;
    const cabinGeometry = new BoxGeometry(
      cabinHeight,
      TRUCK_WIDTH,
      cabinLength
    );
    const cabin = new Mesh(cabinGeometry, TRUCK_MATERIAL);
    cabin.position.set(
      (bedLength + cabinLength) / 2 + 0.5,
      0,
      WHEEL_DIAMETER + cabinHeight / 2
    );
    this.model.add(cabin);

    this.model.position.set(20, 20, 0);
    this.terminal.visualizer.scene.add(this.model);
  }
}
