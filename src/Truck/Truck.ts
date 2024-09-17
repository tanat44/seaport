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
import { TEST_PATH } from "./TestPath";

const WHEEL_DIAMETER = 0.8;
const WHEEL_MATERIAL = new MeshBasicMaterial({ color: 0x2d2961 });
const TRAILER_MATERIAL = new MeshBasicMaterial({ color: 0x7f86e3 });
const TRACTOR_MATERIAL = new MeshBasicMaterial({ color: 0x544db0 });
const KINGPIN_MATERIAL = new MeshBasicMaterial({ color: 0x2d2961 });
const TRUCK_WIDTH = CONTAINER_SIZE_Y * 1.1;
const MAX_VELOCITY = 13.8; // 50 kph
const MAX_ACCELERATION = 3;

const TRAILER_REAR_AXLE_POSITION = -CONTAINER_SIZE_X / 2 + 1;
const TRAILER_KINGPIN_DISTANCE = CONTAINER_SIZE_X;
const TRACTOR_WHEEL_BASE = 3;

export class Truck {
  static count = 0;

  terminal: Terminal;

  id: number;
  trailerModel: Object3D;
  tractorModel: Object3D;
  pathPhysics?: PathPhysics;

  constructor(terminal: Terminal) {
    this.terminal = terminal;
    this.id = Truck.count++;
    this.createModel();
  }

  drive(controlPoints: Vector2[]) {
    if (this.pathPhysics) {
      console.warn("Abort driving on the current path to drive new path");
    }

    this.pathPhysics = new PathPhysics(
      this.terminal.visualizer,
      controlPoints,
      TRAILER_KINGPIN_DISTANCE,
      MAX_VELOCITY,
      MAX_ACCELERATION,
      (
        positionTrailer: Vector2,
        rotationTrailer: number,
        rotationTractor: number
      ) => this.update(positionTrailer, rotationTrailer, rotationTractor)
    );
  }

  update(
    positionTrailer: Vector2,
    rotationTrailer: number,
    rotationTractor: number
  ) {
    this.trailerModel.position.set(positionTrailer.x, positionTrailer.y, 0);
    this.trailerModel.rotation.set(0, 0, rotationTrailer);
    this.tractorModel.rotation.set(0, 0, rotationTractor - rotationTrailer);
  }

  testDrive() {
    this.drive(TEST_PATH);
  }

  private createModel() {
    // TRAILER
    this.trailerModel = new Object3D();
    this.terminal.visualizer.scene.add(this.trailerModel);

    // trailer bed
    const bedLength = TRAILER_KINGPIN_DISTANCE;
    const truckBedGeometry = new BoxGeometry(bedLength, TRUCK_WIDTH, 0.2);
    const truckBed = new Mesh(truckBedGeometry, TRAILER_MATERIAL);
    truckBed.position.set(0, 0, WHEEL_DIAMETER);
    this.trailerModel.add(truckBed);

    // wheel
    const wheelGeometry = new CylinderGeometry(
      WHEEL_DIAMETER / 2,
      WHEEL_DIAMETER / 2,
      0.2
    );
    const wheel = new Mesh(wheelGeometry, WHEEL_MATERIAL);
    const halfWidth = TRUCK_WIDTH / 2;

    // wheel R
    const wheelR = wheel.clone();
    wheelR.position.set(TRAILER_REAR_AXLE_POSITION, -halfWidth, 0);
    this.trailerModel.add(wheelR);
    // wheel L
    const wheelL = wheel.clone();
    wheelL.position.set(TRAILER_REAR_AXLE_POSITION, halfWidth, 0);
    this.trailerModel.add(wheelL);

    // kingpin
    const kingpin = new Object3D();
    kingpin.translateX(TRAILER_KINGPIN_DISTANCE);
    this.trailerModel.add(kingpin);

    // kingpin cylinder
    const kingpinGeometry = new CylinderGeometry(0.2, 0.2, 1);
    const kingpinCylinder = new Mesh(kingpinGeometry, KINGPIN_MATERIAL);
    kingpinCylinder.rotateX(Math.PI / 2);
    kingpinCylinder.translateY(1);
    kingpin.add(kingpinCylinder);

    // TRACTOR
    this.tractorModel = new Object3D();
    kingpin.add(this.tractorModel);

    // cabin
    const cabinLength = 3;
    const cabinHeight = 3;
    const cabinGeometry = new BoxGeometry(
      cabinLength,
      TRUCK_WIDTH,
      cabinHeight
    );
    const cabin = new Mesh(cabinGeometry, TRACTOR_MATERIAL);
    cabin.position.set(
      TRACTOR_WHEEL_BASE + 1 - cabinLength / 2,
      0,
      WHEEL_DIAMETER + cabinHeight / 2
    );
    this.tractorModel.add(cabin);

    // cabin base
    const cabinBaseLength = TRACTOR_WHEEL_BASE + 2;
    const cabinBaseGeometry = new BoxGeometry(
      cabinBaseLength,
      TRUCK_WIDTH,
      0.2
    );
    const cabinBase = new Mesh(cabinBaseGeometry, TRACTOR_MATERIAL);
    cabinBase.position.set(cabinBaseLength / 2 - 1, 0, WHEEL_DIAMETER);
    this.tractorModel.add(cabinBase);

    // wheel RR
    const wheelRR = wheel.clone();
    wheelRR.position.set(0, -halfWidth, 0);
    this.tractorModel.add(wheelRR);
    // wheel RL
    const wheelRL = wheel.clone();
    wheelRL.position.set(0, halfWidth, 0);
    this.tractorModel.add(wheelRL);
    // wheel FR
    const wheelFR = wheel.clone();
    wheelFR.position.set(TRACTOR_WHEEL_BASE, -halfWidth, 0);
    this.tractorModel.add(wheelFR);
    // wheel FL
    const wheelFL = wheel.clone();
    wheelFL.position.set(TRACTOR_WHEEL_BASE, halfWidth, 0);
    this.tractorModel.add(wheelFL);
  }
}
