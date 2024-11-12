import { MeshBasicMaterial, Object3D, Vector2 } from "three";
import { PathUtility } from "../Generic/PathUtility";
import { Grid } from "../GridPlanner/Grid";
import { TruckJob } from "../Job/Definition/TruckJob";
import { Layout } from "../Layout/types";
import { TruckId } from "../Truck/Truck";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { PathSimplifier } from "./PathSimplifier";

export class PathPlanner {
  visualizer: Visualizer;
  grid: Grid;
  simplifier: PathSimplifier;
  pathMesh: Object3D[];

  constructor(visualizer: Visualizer, layout: Layout) {
    this.visualizer = visualizer;
    this.grid = new Grid(this.visualizer, layout);
    this.simplifier = new PathSimplifier(this.grid);
    this.pathMesh = [];
  }

  plan(
    from: Vector2,
    fromDir: Vector2,
    job: TruckJob,
    ignoreTraffic: boolean
  ): Vector2[] {
    // console.log("PathPlanner: from", from, "to", to);
    // delete old path
    if (this.pathMesh.length > 0) {
      this.pathMesh.forEach((mesh) => mesh.removeFromParent());
      this.pathMesh = [];
    }

    let toDir = new Vector2(1, 0);
    if (job.reason === "truckmovecontainertoyard") {
      toDir = new Vector2(-1, 0);
    }
    let controlPoints: Vector2[] = this.grid.findPath(
      from,
      fromDir,
      job.to,
      toDir,
      job.truckId,
      ignoreTraffic
    );

    // simplify the control points
    const simplifiedControlPoints = this.simplifier.simplify(
      controlPoints,
      job.truckId,
      fromDir,
      toDir
    );
    // convert control points into drivable curve
    const path = PathUtility.createCurve(
      simplifiedControlPoints,
      fromDir,
      toDir
    );
    this.renderPath(simplifiedControlPoints, path);

    return path;
  }

  randomDrivablePosition(truckId: TruckId): Vector2 {
    const { x: width, y: height } = this.grid.layout.terminalSize;
    for (let i = 0; i < 100; ++i) {
      const pos = this.randomVector(width, height);
      if (this.grid.isDrivable(pos, truckId)) return pos;
    }
    throw new Error("Tried 100 randoms but cannot find a viable plan target");
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
    const innerMaterial = new MeshBasicMaterial({ color: 0x88ff00 });
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
