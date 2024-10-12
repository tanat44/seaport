import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector2,
  Vector3,
} from "three";
import {
  EquipmentCreateEvent,
  EquipmentMoveEndEvent,
  EquipmentMoveStartEvent,
  EquipmentType,
} from "../Event/EquipmentEvent";
import { JobStatusChangeEvent } from "../Event/JobEvent";
import { TruckDriveEndEvent } from "../Event/TruckEvent";
import { JobStatus } from "../Job/Definition/JobBase";
import { TruckJob } from "../Job/Definition/TruckJob";
import { Container } from "../StorageBlock/StorageBlock";
import { Terminal } from "../Terminal/Terminal";
import {
  CONTAINER_SIZE_X,
  CONTAINER_SIZE_Y,
  CONTAINER_SIZE_Z,
} from "../Terminal/const";
import { Render } from "../Visualizer/Render";
import { PathPhysics } from "./PathPhysics";
import { TEST_PATH } from "./TestPath";

const WHEEL_DIAMETER = 0.8;
const WHEEL_MATERIAL = new MeshBasicMaterial({ color: 0x2d2961 });
const TRAILER_MATERIAL = new MeshBasicMaterial({ color: 0x7f86e3 });
const TRACTOR_MATERIAL = new MeshBasicMaterial({ color: 0x544db0 });
const KINGPIN_MATERIAL = new MeshBasicMaterial({ color: 0x2d2961 });
const TRUCK_WIDTH = CONTAINER_SIZE_Y * 1.1;
const MAX_VELOCITY = 8.3; // 30 kph
const MAX_ACCELERATION = 2;

const TRAILER_REAR_AXLE_POSITION = -CONTAINER_SIZE_X / 2 + 1;
const TRAILER_KINGPIN_DISTANCE = CONTAINER_SIZE_X;
const TRACTOR_WHEEL_BASE = 3;

export type TruckId = string;
export class Truck {
  static count = 0;

  terminal: Terminal;

  id: TruckId;
  trailerModel: Object3D;
  tractorModel: Object3D;
  pathPhysics: PathPhysics | null;

  currentJob: TruckJob | null;
  container: Container | null;
  containerPlaceholder: Object3D;

  constructor(terminal: Terminal, initialPosition?: Vector3) {
    this.terminal = terminal;
    this.id = `Truck.${Truck.count++}`;
    this.pathPhysics = null;
    this.container = null;
    this.createModel();

    if (initialPosition) {
      this.trailerModel.position.copy(initialPosition);
    }
    this.terminal.visualizer.emit(
      new EquipmentCreateEvent(this.id, EquipmentType.Truck)
    );
    this.terminal.visualizer.onEvent<TruckDriveEndEvent>(`truckdriveend`, (e) =>
      this.onDriveEnd(e)
    );
  }

  execute(job: TruckJob) {
    console.log(job.toString(), "Execute");
    if (this.currentJob) {
      throw new Error(
        `Truck ${this.id} has ongoing job. Cannot execute duplicate job`
      );
    }

    // update job
    this.currentJob = job;
    this.currentJob.status = JobStatus.Working;
    this.terminal.visualizer.emit(new JobStatusChangeEvent(this.currentJob));

    // execute move
    const path = this.terminal.pathPlanner.plan(this.position, job.to);
    this.drive(path);
    this.terminal.visualizer.emit(
      new EquipmentMoveStartEvent(this.id, EquipmentType.Truck)
    );
  }

  drive(controlPoints: Vector2[]) {
    if (this.pathPhysics) {
      console.warn("Abort driving on the current path to drive new path");
    }

    this.pathPhysics = new PathPhysics(
      this.terminal.visualizer,
      this,
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

  private onDriveEnd(e: TruckDriveEndEvent) {
    if (e.truckId !== this.id) return;
    this.pathPhysics = null;

    // update job status
    const job = this.currentJob;
    if (job.reason === "truckemptymove") {
      job.status = JobStatus.Completed;
      this.currentJob = null;
    } else {
      job.status = JobStatus.WaitForRelease;
    }
    this.terminal.visualizer.emit(new JobStatusChangeEvent(job));

    this.terminal.visualizer.emit(
      new EquipmentMoveEndEvent(this.id, EquipmentType.Truck)
    );
  }

  private update(
    positionTrailer: Vector2,
    rotationTrailer: number,
    rotationTractor: number
  ) {
    this.trailerModel.position.set(positionTrailer.x, positionTrailer.y, 0);
    this.trailerModel.rotation.set(0, 0, rotationTrailer);
    this.tractorModel.rotation.set(0, 0, rotationTractor - rotationTrailer);
  }

  load(container: Container) {
    if (this.container)
      throw new Error("Unable to load container to non empty truck");

    this.container = container;
    this.containerPlaceholder.add(container.mesh);
    this.container.mesh.position.set(0, 0, 0);
    this.container.mesh.material = Render.containerTransitMaterial;
  }

  unload(): Container {
    if (!this.container) throw new Error("Unable to unload empty truck");

    const container = this.container;
    this.container = null;
    container.mesh.material = Render.containerMaterial;
    this.containerPlaceholder.remove(container.mesh);

    this.currentJob.status = JobStatus.Completed;
    this.terminal.visualizer.emit(new JobStatusChangeEvent(this.currentJob));
    this.currentJob = null;

    return container;
  }

  get position(): Vector2 {
    return new Vector2(
      this.trailerModel.position.x,
      this.trailerModel.position.y
    );
  }

  static containerLoadHeight(): number {
    return WHEEL_DIAMETER + CONTAINER_SIZE_Z / 2;
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

    // container placeholder
    this.containerPlaceholder = new Object3D();
    this.containerPlaceholder.position.set(0, 0, CONTAINER_SIZE_Z / 2);
    truckBed.add(this.containerPlaceholder);

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

    // text label
    const text = this.terminal.visualizer.text.createTextMesh(this.id);
    text.translateZ(3);
    cabin.add(text);

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

  private testDrive() {
    this.drive(TEST_PATH);
  }
}
