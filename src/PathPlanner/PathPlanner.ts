import {
  CubicBezierCurve,
  MeshBasicMaterial,
  Object3D,
  QuadraticBezierCurve,
  Vector2,
} from "three";
import { TruckJob } from "../Job/Definition/TruckJob";
import { Render } from "../Visualizer/Render";
import { GridPlanner } from "./GridPlanner";
import { Visualizer } from "../Visualizer/Visualizer";
import { Layout } from "../Layout/types";

export class PathPlanner {
  visualizer: Visualizer;
  gridPlanner: GridPlanner;
  timer: NodeJS.Timer;
  pathMesh: Object3D[];

  constructor(visualizer: Visualizer, layout: Layout) {
    this.visualizer = visualizer;
    this.gridPlanner = new GridPlanner(this.visualizer, layout);
    this.pathMesh = [];
  }

  plan(from: Vector2, job: TruckJob): Vector2[] {
    // delete old path
    if (this.pathMesh.length > 0) {
      this.pathMesh.forEach((mesh) => mesh.removeFromParent());
      this.pathMesh = [];
    }

    // console.log("PathPlanner: from", from, "to", to);
    let fromDir = new Vector2(1, 0);
    let toDir = new Vector2(1, 0);
    if (job.reason === "truckmovecontainertoyard") {
      toDir = new Vector2(-1, 0);
    } else if (job.reason === "truckmove") {
      fromDir = new Vector2(-1, 0);
    }
    let controlPoints: Vector2[] = this.gridPlanner.findPath(
      from,
      fromDir,
      job.to,
      toDir
    );
    const path = this.makeCurve(controlPoints, fromDir, toDir);
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

  private makeCurve(
    path: Vector2[],
    fromDir: Vector2,
    toDir: Vector2
  ): Vector2[] {
    const newControlPoints: Vector2[] = [];
    const GAP = 2;
    for (let i = 0; i < path.length; ++i) {
      if (i === 0) {
        const dir = path[1].clone().sub(path[0]).normalize();
        const p = path[1].clone().sub(dir.multiplyScalar(GAP));
        const points = this.makeCurveWithDirection(
          path[0],
          fromDir,
          0.6,
          p,
          dir,
          0.2
        );
        newControlPoints.push(...points);
        continue;
      } else if (i === path.length - 1) {
        const dir = path[i]
          .clone()
          .sub(path[i - 1])
          .normalize();
        const p = path[i - 1].clone().add(dir.multiplyScalar(GAP));
        const points = this.makeCurveWithDirection(
          p,
          dir,
          0.2,
          path[i],
          toDir,
          0.6
        );
        newControlPoints.push(...points);
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

  private makeCurveWithDirection(
    from: Vector2,
    fromDir: Vector2,
    weightFrom: number,
    to: Vector2,
    toDir: Vector2,
    weightTo: number
  ): Vector2[] {
    const length = from.distanceTo(to);
    const a = from.clone().add(fromDir.multiplyScalar(length * weightFrom));
    const b = to.clone().sub(toDir.multiplyScalar(length * weightTo));
    // console.log(from, a, b, to);
    const curve = new CubicBezierCurve(from, a, b, to);
    return curve.getPoints(10);
  }

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

    this.visualizer.scene.add(mesh);
    this.pathMesh.push(mesh);
  }

  private randomVector(xRange: number, yRange: number): Vector2 {
    return new Vector2(Math.random() * xRange, Math.random() * yRange);
  }
}
