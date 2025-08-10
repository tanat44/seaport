import {
  Box2,
  Box3,
  BoxGeometry,
  CylinderGeometry,
  Mesh,
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
const ROPE_SIZE = 0.1;

export const QC_ID_PREFIX = "QC.";
export type QcId = string;
export const QC_WIDTH = 10;

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
  wirerope: Mesh;
  containerPlaceholder: Object3D;

  // operation
  currentJob: QcJob | null;
  container: Container | null;

  constructor(
    visualizer: Visualizer,
    initialPosition: Vector3,
    width: number = QC_WIDTH,
    height: number = 20,
    legSpan: number = 10,
    outReach: number = 20
  ) {
    this.visualizer = visualizer;
    this.id = `${QC_ID_PREFIX}${++Qc.count}`;
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
    // console.log(job.toString(), "Execute");
    if (this.currentJob) {
      console.error(job);
      throw new Error("Cannot assign job to busy quay crane");
    }
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
    const legMaterial = Render.legMaterial;

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
    const railGeometry = new BoxGeometry(
      LEG_SIZE,
      this.legSpan + this.outReach,
      LEG_SIZE
    );
    const RAIL_WIDTH = this.width / 2;
    const railL = new Mesh(railGeometry, legMaterial);
    railL.position.set(-RAIL_WIDTH / 2, this.outReach / 2, heightTopLevel);
    const railR = new Mesh(railGeometry, legMaterial);
    railR.position.set(RAIL_WIDTH / 2, this.outReach / 2, heightTopLevel);
    const railCap = new Mesh(
      new BoxGeometry(RAIL_WIDTH, LEG_SIZE, LEG_SIZE),
      legMaterial
    );
    railCap.position.set(0, this.legSpan / 2 + this.outReach, heightTopLevel);
    this.model.add(railL, railR, railCap);

    // across beam
    const acrossBeamGeometry = new BoxGeometry(this.width, LEG_SIZE, LEG_SIZE);
    const acrossBeamSea = new Mesh(acrossBeamGeometry, legMaterial);
    acrossBeamSea.position.set(0, this.legSpan / 2, heightTopLevel);
    const acrossBeamLand = acrossBeamSea.clone();
    acrossBeamLand.position.set(0, -this.legSpan / 2, heightTopLevel);
    this.model.add(acrossBeamSea, acrossBeamLand);

    // text label
    const text = this.visualizer.text.createTextMesh(this.id);
    text.translateZ(heightTopLevel);

    // trolley
    const trolleyGeometry = new BoxGeometry(
      this.width / 2,
      this.width / 4,
      SPREADER_THICKNESS
    );
    this.trolley = new Mesh(trolleyGeometry, Render.trolleyMaterial);
    const trolleyPosition = new Vector3(
      0,
      this.legSpan + this.outReach / 2,
      this.height + SPREADER_THICKNESS
    );
    this.trolley.position.copy(trolleyPosition);
    this.model.add(this.trolley);

    // wire rope
    const wireropeGeometry = new CylinderGeometry(ROPE_SIZE, ROPE_SIZE, 1);
    wireropeGeometry.rotateX(Math.PI / 2);
    wireropeGeometry.translate(0, 0, -0.5);
    this.wirerope = new Mesh(wireropeGeometry, Render.spreaderMaterial);
    this.trolley.add(this.wirerope);

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
    const spreaderZ =
      this.control.position.z - this.height - SPREADER_THICKNESS / 2;
    this.spreader.position.setZ(spreaderZ);
    this.trolley.position.setY(this.control.position.y);
    this.wirerope.scale.setZ(-spreaderZ);
  }

  private listenToEvents() {
    this.visualizer.onEvent<AnimateEvent>("animate", (e) => {
      this.animate(e.deltaTime);
    });
  }

  private onArrive() {
    // move event
    this.visualizer.emit(new EquipmentMoveEndEvent(this.id, EquipmentType.Qc));

    // update job status
    if (this.currentJob.reason === "qcstandbyovertruck") {
      const job = this.currentJob;
      this.currentJob = null;
      job.updateStatus(JobStatus.Completed, this.visualizer);
    } else {
      this.currentJob.updateStatus(JobStatus.WaitForRelease, this.visualizer);
    }
  }

  private animate(deltaTime: number) {
    this.updateModelState();
  }
}
