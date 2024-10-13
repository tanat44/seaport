import {
  Box2,
  Box3,
  BoxGeometry,
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
import { AnimateEvent } from "../Event/types";
import { JobStatus } from "../Job/Definition/JobBase";
import { QcJob } from "../Job/Definition/QcJob";
import { Container } from "../StorageBlock/StorageBlock";
import { CONTAINER_SIZE_Z } from "../Terminal/const";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { QcControl } from "./QcControl";

const LEG_SIZE = 0.3;
const SPREADER_THICKNESS = 0.6;

export type QcId = string;

export class Qc {
  static count = 0;

  visualizer: Visualizer;
  id: QcId;

  // physics
  width: number;
  height: number;
  legSpan: number;
  outReach: number;
  control: QcControl;

  // mesh
  model: Object3D; // root mesh
  trolley: Mesh;
  spreader: Mesh;
  containerPlaceholder: Object3D;

  // operation
  currentJob: QcJob | null;
  container: Container | null;

  constructor(
    visualizer: Visualizer,
    initialPosition: Vector3,
    width: number = 10,
    height: number = 20,
    legSpan: number = 10,
    outReach: number = 20
  ) {
    this.visualizer = visualizer;
    this.id = `QC.${++Qc.count}`;
    this.width = width;
    this.height = height;
    this.legSpan = legSpan;
    this.outReach = outReach;
    this.control = new QcControl(
      visualizer,
      this,
      new Vector3(initialPosition.x, 0, height / 2)
    );
    this.control.onArrive = () => this.onArrive();
    this.currentJob = null;
    this.container = null;

    this.buildModel(initialPosition);
    this.listenToEvents();
    this.visualizer.emit(new EquipmentCreateEvent(this.id, EquipmentType.Qc));
  }

  public execute(job: QcJob) {
    console.log(job.toString(), "Execute");
    if (this.currentJob)
      throw new Error("Cannot assign job to busy quay crane");

    // check if it's a valid job
    if (job.position.y < -(this.legSpan / 2))
      throw new Error("Cannot move trolley too far back");
    if (job.position.y > this.legSpan / 2 + this.outReach)
      throw new Error("Cannot move trolley too far forward");
    if (job.position.z < 0)
      throw new Error("Cannot move spreader under ground");
    if (job.position.z > this.height)
      throw new Error("Cannot move spreader above height");

    // change job status
    this.currentJob = job;
    this.currentJob.status = JobStatus.Working;
    const jobEvent = new JobStatusChangeEvent(this.currentJob);
    this.visualizer.emit(jobEvent);

    // execute move
    const trajectory = this.control.planTrajectory(job.position);
    this.control.execute(trajectory);
    this.visualizer.emit(
      new EquipmentMoveStartEvent(this.id, EquipmentType.Qc)
    );
  }

  public get absoluteSpace(): Box2 {
    const box3 = new Box3().setFromObject(this.model);

    return new Box2(
      new Vector2(box3.min.x, box3.min.y),
      new Vector2(box3.max.x, box3.max.y)
    );
  }

  public get position(): Vector3 {
    return this.model.position.clone();
  }

  public pickContainer(container: Container) {
    this.container = container;
    this.containerPlaceholder.add(this.container.mesh);
    this.container.mesh.position.set(0, 0, 0);
    this.container.mesh.material = Render.containerTransitMaterial;
    this.currentJob.updateStatus(JobStatus.Completed, this.visualizer);
    this.currentJob = null;
  }

  public dropContainer(): Container {
    const container = this.container;
    this.container = null;
    this.containerPlaceholder.remove(container.mesh);
    this.currentJob.updateStatus(JobStatus.Completed, this.visualizer);
    this.currentJob = null;

    return container;
  }

  public get idle(): boolean {
    return this.currentJob !== undefined;
  }

  private buildModel(initialPosition: Vector3) {
    this.model = new Object3D();
    this.model.position.copy(initialPosition);

    // leg
    const heightTopLevel = this.height + SPREADER_THICKNESS;
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

    // machine room
    const machineH = this.width / 5;
    const machineRoom = new Mesh(
      new BoxGeometry(this.width / 3, this.legSpan / 3, machineH),
      legMaterial
    );
    machineRoom.position.set(
      0,
      -this.legSpan / 4,
      heightTopLevel + machineH / 1.5
    );
    this.model.add(machineRoom);

    // text label
    const text = this.visualizer.text.createTextMesh(this.id);
    text.translateZ(machineH * 2);
    machineRoom.add(text);

    // trolley
    const trolleyGeometry = new BoxGeometry(
      this.width / 2,
      this.width / 4,
      SPREADER_THICKNESS
    );
    this.trolley = new Mesh(trolleyGeometry, Render.trolleyMaterial);
    this.trolley.position.set(
      0,
      this.legSpan + this.outReach / 2,
      this.height + SPREADER_THICKNESS
    );
    this.model.add(this.trolley);

    // spreader
    this.spreader = new Mesh(trolleyGeometry, Render.spreaderMaterial);
    this.spreader.position.set(0, 0, 0);
    this.trolley.add(this.spreader);

    // container placeholder
    this.containerPlaceholder = new Object3D();
    this.containerPlaceholder.position.set(0, 0, -CONTAINER_SIZE_Z / 2);
    this.spreader.add(this.containerPlaceholder);

    this.visualizer.scene.add(this.model);
  }

  private updateModelState() {
    this.model.position.setX(this.control.position.x);
    this.spreader.position.setZ(
      this.control.position.z - this.height - SPREADER_THICKNESS / 2
    );
    this.trolley.position.setY(this.control.position.y);
  }

  private listenToEvents() {
    this.visualizer.onEvent<AnimateEvent>("animate", (e) => {
      this.animate(e.deltaTime);
    });
  }

  private onArrive() {
    // move event
    this.visualizer.emit(new EquipmentMoveEndEvent(this.id, EquipmentType.Qc));

    // job event
    this.currentJob.updateStatus(JobStatus.WaitForRelease, this.visualizer);
  }

  private animate(deltaTime: number) {
    this.updateModelState();
  }
}
