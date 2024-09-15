import {
  MeshBasicMaterial,
  Object3D,
  QuadraticBezierCurve,
  Vector2,
} from "three";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { PlannerGrid } from "./PlannerGrid";

const PLAN_INTERVAL = 1000;

type Plan = {
  from: Vector2;
  to: Vector2;
};

export class PathPlanner {
  visualizer: Visualizer;
  plannerGrid: PlannerGrid;
  timer: NodeJS.Timer;
  pathMesh: Object3D[];

  constructor(visualizer: Visualizer, plannerGrid: PlannerGrid) {
    this.visualizer = visualizer;
    this.plannerGrid = plannerGrid;
    this.timer = setInterval(() => this.tick(), PLAN_INTERVAL);
    this.pathMesh = [];
    this.tick();
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

  private tick() {
    if (this.pathMesh.length > 0) {
      this.pathMesh.forEach((mesh) => mesh.removeFromParent());
      this.pathMesh = [];
    }

    // plan & render
    let plan = this.randomPlan();
    const path = this.plannerGrid.findPath(plan.from, plan.to);
    console.log("from", plan.from, "to", plan.to);
    this.renderPath(path);
  }

  private renderPath(path: Vector2[]) {
    // mesh container
    const mesh = new Object3D();

    // render curve
    const Z = 0.1;
    const curvePoints = this.makeCurve(path);
    const curveMesh = Render.createPath2D(curvePoints, Z, 0x0000a0);
    mesh.add(curveMesh);

    // render control points
    const startMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const innerMaterial = new MeshBasicMaterial({ color: 0x888888 });
    const endMaterial = new MeshBasicMaterial({ color: 0x0000a0 });
    const controlPointMeshes = path.map((point, index) => {
      let material = innerMaterial;
      if (index === 0) material = startMaterial;
      else if (index === path.length - 1) material = endMaterial;

      return Render.createSphere(point, Z, 0.5, material);
    });
    mesh.add(...controlPointMeshes);

    this.visualizer.scene.add(mesh);
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

  private randomDrivablePosition(): Vector2 {
    const { x: width, y: height } = this.plannerGrid.layout.terminalSize;
    for (let i = 0; i < 100; ++i) {
      const pos = this.randomVector(width, height);
      if (this.plannerGrid.drivable(pos)) return pos;
    }
    throw new Error("Tried 100 randoms but cannot find a viable plan target");
  }

  private randomVector(xRange: number, yRange: number): Vector2 {
    return new Vector2(Math.random() * xRange, Math.random() * yRange);
  }
}
