import { Object3D, Vector2 } from "three";
import { Manager } from "../Manager";
import { Render } from "../Render";
import { PlannerGrid } from "./PlannerGrid";

const PLAN_INTERVAL = 1000;

type Plan = {
  from: Vector2;
  to: Vector2;
};

export class PathPlanner {
  manager: Manager;
  plannerGrid: PlannerGrid;
  timer: NodeJS.Timer;
  pathMesh: Object3D[];

  constructor(manager: Manager, plannerGrid: PlannerGrid) {
    this.manager = manager;
    this.plannerGrid = plannerGrid;
    this.timer = setInterval(() => this.tick(), PLAN_INTERVAL);
    this.pathMesh = [];
    this.tick();
  }

  tick() {
    if (this.pathMesh.length > 0) {
      this.pathMesh.forEach((mesh) => mesh.removeFromParent());
      this.pathMesh = [];
    }

    for (let i = 0; i < 2; ++i) {
      const plan = this.randomPlan();
      const path = this.plannerGrid.findPath(plan.from, plan.to);
      const mesh = Render.createPath2D(path, 1, 0x0000a0 + i * 16);
      this.manager.scene.add(mesh);
      this.pathMesh.push(mesh);
    }
  }

  private randomPlan(): Plan {
    const from = this.randomDrivablePosition();
    const to = this.randomDrivablePosition();
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
