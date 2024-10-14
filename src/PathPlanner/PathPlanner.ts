import {
  MeshBasicMaterial,
  Object3D,
  QuadraticBezierCurve,
  Vector2,
} from "three";
import {
  TruckJob,
  TruckMoveContainerToYardJob,
  TruckMoveToUnderQcJob,
} from "../Job/Definition/TruckJob";
import { Terminal } from "../Terminal/Terminal";
import { Render } from "../Visualizer/Render";
import { GridPlanner } from "./GridPlanner";
import { Layout } from "./types";

const PLAN_INTERVAL = 1000;

type Plan = {
  from: Vector2;
  to: Vector2;
};

export class PathPlanner {
  terminal: Terminal;
  gridPlanner: GridPlanner;
  timer: NodeJS.Timer;
  pathMesh: Object3D[];

  constructor(terminal: Terminal, layout: Layout) {
    this.terminal = terminal;
    this.gridPlanner = new GridPlanner(terminal, layout);
    this.timer = setInterval(() => this.tick(), PLAN_INTERVAL);
    this.pathMesh = [];
  }

  plan(from: Vector2, job: TruckJob): Vector2[] {
    // delete old path
    if (this.pathMesh.length > 0) {
      this.pathMesh.forEach((mesh) => mesh.removeFromParent());
      this.pathMesh = [];
    }

    // console.log("PathPlanner: from", from, "to", to);
    let controlPoints: Vector2[];
    if (job instanceof TruckMoveToUnderQcJob) {
      const standbyPos: Vector2 = new Vector2(5, job.to.y);
      controlPoints = [...this.gridPlanner.findPath(from, standbyPos), job.to];
    } else if (job instanceof TruckMoveContainerToYardJob) {
      const qcExitPos: Vector2 = new Vector2(
        this.terminal.layoutManager.layout.terminalSize.x - 5,
        from.y
      );

      // find yard bottom right position
      // const storeJob = job as TruckMoveContainerToYardJob;
      // const yard = this.terminal.yardManager.getYard(
      //   storeJob.yardCoordinate.yardId
      // );
      // const yardBox = yard.absoluteSpace;
      // const yardEntryPos = new Vector2(yardBox.max.x, yardBox.min.y);

      controlPoints = [from, ...this.gridPlanner.findPath(qcExitPos, job.to)];
    }
    const path = this.makeCurve(controlPoints);
    this.renderPath(controlPoints, path);

    return path;
  }

  randomDrivablePosition(): Vector2 {
    const { x: width, y: height } = this.gridPlanner.layout.terminalSize;
    for (let i = 0; i < 100; ++i) {
      const pos = this.randomVector(width, height);
      if (this.gridPlanner.isDrivable(pos)) return pos;
    }
    throw new Error("Tried 100 randoms but cannot find a viable plan target");
  }

  private makeCurve(path: Vector2[]): Vector2[] {
    const newControlPoints: Vector2[] = [];
    const GAP = 5;

    for (let i = 0; i < path.length; ++i) {
      if (i === 0 || i === path.length - 1) {
        newControlPoints.push(path[i]);
        continue;
      }

      // add point before control point
      const before = path[i - 1].clone().sub(path[i]).normalize();
      const p1 = path[i].clone().add(before.multiplyScalar(GAP));

      // add point after control point
      const after = path[i + 1].clone().sub(path[i]).normalize();
      const p3 = path[i].clone().add(after.multiplyScalar(GAP));

      // create curve
      const curve = new QuadraticBezierCurve(p1, path[i], p3);
      const points = curve.getPoints(10);
      newControlPoints.push(...points);
    }

    return newControlPoints;
  }

  private tick() {}

  private renderPath(controlPoints: Vector2[], path: Vector2[]) {
    // mesh container
    const mesh = new Object3D();
    const Z = 0.1;

    // render curve
    const curveMesh = Render.createPath2D(path, Z, 0x0000a0);
    mesh.add(curveMesh);

    // render control points
    const startMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const innerMaterial = new MeshBasicMaterial({ color: 0x888888 });
    const endMaterial = new MeshBasicMaterial({ color: 0x0000a0 });
    const controlPointMeshes = controlPoints.map((point, index) => {
      let material = innerMaterial;
      if (index === 0) material = startMaterial;
      else if (index === controlPoints.length - 1) material = endMaterial;

      return Render.createSphere(point, Z, 0.5, material);
    });
    mesh.add(...controlPointMeshes);

    this.terminal.visualizer.scene.add(mesh);
    this.pathMesh.push(mesh);
  }

  private randomPlan(): Plan {
    const from = this.randomDrivablePosition();
    const to = this.randomDrivablePosition();

    if (
      Math.floor(from.x) === Math.floor(to.x) &&
      Math.floor(from.y) === Math.floor(to.y)
    )
      return this.randomPlan();

    return { from, to };
  }

  private randomVector(xRange: number, yRange: number): Vector2 {
    return new Vector2(Math.random() * xRange, Math.random() * yRange);
  }
}
