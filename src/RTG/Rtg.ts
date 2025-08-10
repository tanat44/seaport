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
import { AnimateEvent } from "../Event/types";
import { JobStatus } from "../Job/Definition/JobBase";
import { RtgJob } from "../Job/Definition/RtgJob";
import { Container } from "../StorageBlock/StorageBlock";
import { CONTAINER_SIZE_Z } from "../Terminal/const";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { RtgControl } from "./RtgControl";

const LEG_SIZE = 0.3;
const SPREADER_THICKNESS = 0.6;
const ROPE_SIZE = 0.1;

export type RtgId = string;
export class Rtg {
  static count = 0;

  visualizer: Visualizer;
  id: RtgId;

  // physics
  width: number;
  height: number;
  legSpan: number;
  origin: Vector3;
  control: RtgControl;

  // mesh
  model: Object3D; // root mesh
  trolley: Mesh;
  spreader: Mesh;
  wirerope: Mesh;
  containerPlaceholder: Object3D;

  // operation
  currentJob: RtgJob | null;
  container: Container | null;

  constructor(
    visualizer: Visualizer,
    origin: Vector3,
    width: number,
    height: number,
    legSpan: number
  ) {
    this.visualizer = visualizer;
    this.id = `RTG.${++Rtg.count}`;
    this.width = width;
    this.height = height;
    this.legSpan = legSpan;
    this.origin = origin.clone();
    this.control = new RtgControl(visualizer, this, new Vector3(0, 0, height));
    this.control.onArrive = () => this.onArrive();
    this.currentJob = null;

    this.buildModel(origin);
    this.listenToEvents();
    this.visualizer.emit(new EquipmentCreateEvent(this.id, EquipmentType.Rtg));
  }

  public execute(job: RtgJob) {
    // console.log(job.toString(), "Execute");
    if (this.currentJob) throw new Error("Cannot assign job to busy rtg");

    // check if it's a valid job
    try {
      if (job.position.y < 0)
        throw new Error(`Cannot move trolley too far back`);
      if (job.position.y > this.legSpan)
        throw new Error("Cannot move trolley too far forward");
      if (job.position.z < 0)
        throw new Error("Cannot move spreader under ground");
      if (job.position.z > this.height)
        throw new Error("Cannot move spreader above height");
    } catch (error) {
      console.error(error);
      console.log("Failed job", job);
      throw error;
    }

    // update job status
    this.currentJob = job;
    this.currentJob.updateStatus(JobStatus.Working, this.visualizer);

    // execute move
    const trajectory = this.control.planTrajectory(job.position);
    this.control.execute(trajectory);
    this.visualizer.emit(
      new EquipmentMoveStartEvent(this.id, EquipmentType.Rtg)
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

  get idle(): boolean {
    return !this.currentJob && true;
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
    container.mesh.material = Render.containerMaterial;
    this.container = null;
    this.containerPlaceholder.remove(container.mesh);

    this.currentJob.updateStatus(JobStatus.Completed, this.visualizer);
    this.currentJob = null;

    return container;
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
    legBL.position.set(-this.width / 2, 0, heightTopLevel / 2);

    // legBR
    const legBR = new Mesh(legGeometry, legMaterial);
    legBR.position.set(this.width / 2, 0, heightTopLevel / 2);

    // legTL
    const legTL = new Mesh(legGeometry, legMaterial);
    legTL.position.set(-this.width / 2, this.legSpan, heightTopLevel / 2);

    // legTR
    const legTR = new Mesh(legGeometry, legMaterial);
    legTR.position.set(this.width / 2, this.legSpan, heightTopLevel / 2);
    this.model.add(legBL, legBR, legTL, legTR);

    // across beam
    const acrossBeamGeometry = new BoxGeometry(this.width, LEG_SIZE, LEG_SIZE);
    const acrossBeam1 = new Mesh(acrossBeamGeometry, legMaterial);
    acrossBeam1.position.set(0, 0, heightTopLevel);
    const acrossBeam2 = acrossBeam1.clone();
    acrossBeam2.position.set(0, this.legSpan, heightTopLevel);
    this.model.add(acrossBeam1, acrossBeam2);

    // rail
    const railL = new Mesh(
      new BoxGeometry(LEG_SIZE, this.legSpan, LEG_SIZE),
      legMaterial
    );
    railL.position.set(-this.width / 2, this.legSpan / 2, heightTopLevel);
    const railR = new Mesh(
      new BoxGeometry(LEG_SIZE, this.legSpan, LEG_SIZE),
      legMaterial
    );
    railR.position.set(this.width / 2, this.legSpan / 2, heightTopLevel);
    this.model.add(railL, railR);

    // trolley
    const trolleyGeometry = new BoxGeometry(
      this.width / 2,
      this.width / 4,
      SPREADER_THICKNESS
    );
    this.trolley = new Mesh(trolleyGeometry, Render.trolleyMaterial);
    this.trolley.position.set(0, 0, this.height + SPREADER_THICKNESS);
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

    // text label
    const text = this.visualizer.text.createTextMesh(this.id);
    text.translateZ(3);
    this.trolley.add(text);

    this.visualizer.scene.add(this.model);
  }

  private updateModelState() {
    this.model.position.setX(this.control.position.x + this.origin.x);
    const spreaderZ =
      this.control.position.z - this.height - SPREADER_THICKNESS / 2;
    this.spreader.position.setZ(spreaderZ);
    this.wirerope.scale.setZ(-spreaderZ);
    this.trolley.position.setY(this.control.position.y);
  }

  private listenToEvents() {
    this.visualizer.onEvent<AnimateEvent>("animate", (e) => {
      this.animate(e.deltaTime);
    });
  }

  private onArrive() {
    // move event
    this.visualizer.emit(new EquipmentMoveEndEvent(this.id, EquipmentType.Rtg));

    // job event
    const job = this.currentJob;
    if (job.reason === "rtgemptymove") {
      this.currentJob.updateStatus(JobStatus.Completed, this.visualizer);
      this.currentJob = null;
    } else if (
      job.reason === "rtgpickcontainerfromtruck" ||
      job.reason === "rtgdropcontainerinyard"
    ) {
      this.currentJob.updateStatus(JobStatus.WaitForRelease, this.visualizer);
    } else {
      throw new Error("Rtg arrive but doesn't change job status");
    }
  }

  private animate(deltaTime: number) {
    this.updateModelState();
  }
}
