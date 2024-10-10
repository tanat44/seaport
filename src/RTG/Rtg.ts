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
  AnimateEvent,
  RtgMoveEndEvent,
  RtgMoveStartEvent,
} from "../Event/types";
import { JobStatus } from "../Job/Definition/JobBase";
import { RtgJob } from "../Job/Definition/RtgJob";
import { Container } from "../StorageBlock/StorageBlock";
import { CONTAINER_SIZE_Z } from "../Terminal/const";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { RtgControl } from "./RtgControl";

const LEG_SIZE = 0.3;
const SPREADER_THICKNESS = 0.6;

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
  }

  public execute(job: RtgJob) {
    console.log("Rtg: execute", job.toString());
    if (this.currentJob) throw new Error("Cannot assign job to busy rtg");

    // check if it's a valid job
    if (job.position.y < 0)
      throw new Error(`Cannot move trolley too far back ${this.id}`);
    if (job.position.y > this.legSpan)
      throw new Error("Cannot move trolley too far forward");
    if (job.position.z < 0)
      throw new Error("Cannot move spreader under ground");
    if (job.position.z > this.height)
      throw new Error("Cannot move spreader above height");

    job.status = JobStatus.Working;

    const trajectory = this.control.planTrajectory(job.position);
    this.control.execute(trajectory);
    this.visualizer.emit<RtgMoveStartEvent>({
      type: "rtgmovestart",
      rtgId: this.id,
      job,
    });
    this.currentJob = job;
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
    return this.currentJob && true;
  }

  public pickContainer(container: Container) {
    this.container = container;
    this.containerPlaceholder.add(this.container.mesh);
    this.container.mesh.position.set(0, 0, 0);
    this.container.mesh.material = Render.containerTransitMaterial;

    this.currentJob.status = JobStatus.Completed;
    this.currentJob = null;
  }

  public dropContainer(): Container {
    const container = this.container;
    this.container = null;
    this.containerPlaceholder.remove(container.mesh);

    this.currentJob.status = JobStatus.Completed;
    this.currentJob = null;

    return container;
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
    this.visualizer.emit<RtgMoveEndEvent>({
      type: "rtgmoveend",
      rtgId: this.id,
      job: this.currentJob,
    });
    if (this.currentJob.reason === "rtgemptymove") {
      this.currentJob.status = JobStatus.Completed;
      this.currentJob = null;
    }
  }

  private animate(deltaTime: number) {
    this.updateModelState();
  }
}
