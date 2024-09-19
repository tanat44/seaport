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
  RtgMoveStartEndEvent,
  RtgMoveStartEvent,
} from "../Event/types";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { RtgControl } from "./RtgControl";
import { RtgJob } from "./types";

const LEG_SIZE = 0.3;
const SPREADER_THICKNESS = 0.6;

export class Rtg {
  static count = 0;

  visualizer: Visualizer;
  id: string;

  // physics
  width: number;
  height: number;
  legSpan: number;
  control: RtgControl;

  // mesh
  model: Object3D; // root mesh
  trolley: Mesh;
  spreader: Mesh;

  // operation
  currentJob: RtgJob | null;

  constructor(
    visualizer: Visualizer,
    initialPosition: Vector3,
    width: number,
    height: number,
    legSpan: number
  ) {
    this.visualizer = visualizer;
    this.id = `RTG.${++Rtg.count}`;
    this.width = width;
    this.height = height;
    this.legSpan = legSpan;
    this.control = new RtgControl(
      visualizer,
      this,
      new Vector3(initialPosition.x, this.width, height)
    );
    this.control.onArrive = () => this.onArrive();
    this.currentJob = null;

    this.buildModel(initialPosition);
    this.listenToEvents();
  }

  public randomMove() {
    const GANTRY_RANGE = 20;
    const gantryDistance = Math.random() * GANTRY_RANGE - GANTRY_RANGE / 2;
    const trolleyDistance = Math.random() * this.legSpan - this.legSpan / 2;
    const liftDistance = Math.random() * this.height;

    // this.moveTo(
    //   new Vector3(
    //     gantryDistance + this.control.position.x,
    //     trolleyDistance,
    //     liftDistance
    //   )
    // );
  }

  public executeJob(job: RtgJob) {
    if (this.currentJob)
      throw new Error("Cannot assign job to busy quay crane");

    // check if it's a valid job
    if (job.position.y < -(this.legSpan / 2))
      throw new Error("Cannot move trolley too far back");
    if (job.position.y > this.legSpan / 2)
      throw new Error("Cannot move trolley too far forward");
    if (job.position.z < 0)
      throw new Error("Cannot move spreader under ground");
    if (job.position.z > this.height)
      throw new Error("Cannot move spreader above height");

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
    this.trolley.position.set(
      0,
      this.legSpan,
      this.height + SPREADER_THICKNESS
    );
    this.model.add(this.trolley);

    // spreader
    this.spreader = new Mesh(trolleyGeometry, Render.spreaderMaterial);
    this.spreader.position.set(0, 0, 0);
    this.trolley.add(this.spreader);

    // text label
    const text = this.visualizer.text.createTextMesh(this.id);
    text.translateZ(3);
    this.trolley.add(text);

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
    const finishedJob = this.currentJob;
    this.currentJob = null;
    this.visualizer.emit<RtgMoveStartEndEvent>({
      type: "rtgmoveend",
      rtgId: this.id,
      job: finishedJob,
    });
  }

  private animate(deltaTime: number) {
    this.updateModelState();
  }
}
