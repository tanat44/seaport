import { Line, Vector3 } from "three";
import { Render } from "../../Visualizer/Render";
import { Visualizer } from "../../Visualizer/Visualizer";
import { PhysicsState } from "./PhysicsState";
import { Trajectory } from "./types";

export class PhysicsState3D {
  visualizer: Visualizer;

  x: PhysicsState;
  y: PhysicsState;
  z: PhysicsState;

  // motion
  trajectory: Trajectory;
  lastTargetIndex: number;
  trajectoryMesh: Line | undefined;

  constructor(
    visualizer: Visualizer,
    maxVelocity: Vector3 | undefined,
    maxAcceleration: Vector3 | undefined,
    initialPosition: Vector3 | undefined,
    name: string
  ) {
    this.visualizer = visualizer;
    this.x = new PhysicsState(
      `${name}.x`,
      visualizer,
      maxVelocity?.x,
      maxAcceleration?.x,
      initialPosition?.x
    );
    this.y = new PhysicsState(
      `${name}.y`,
      visualizer,
      maxVelocity?.y,
      maxAcceleration?.y,
      initialPosition?.y
    );
    this.z = new PhysicsState(
      `${name}.z`,
      visualizer,
      maxVelocity?.z,
      maxAcceleration?.z,
      initialPosition?.z
    );
  }

  get position(): Vector3 {
    return new Vector3(this.x.position, this.y.position, this.z.position);
  }

  execute(trajectory: Trajectory) {
    this.lastTargetIndex = 0;
    this.trajectory = trajectory;
    this.updateAxisTarget();
    this.trajectoryMesh = Render.createPath(
      [this.position, ...trajectory],
      0xeeff00
    );
    this.visualizer.scene.add(this.trajectoryMesh);
  }

  private updateAxisTarget() {
    this.x.setTarget(this.trajectory[this.lastTargetIndex].x, true, (state) =>
      this.onAxisArrive(state)
    );
    this.y.setTarget(this.trajectory[this.lastTargetIndex].y, true, (state) =>
      this.onAxisArrive(state)
    );
    this.z.setTarget(this.trajectory[this.lastTargetIndex].z, true, (state) =>
      this.onAxisArrive(state)
    );
  }

  onAxisArrive(state: PhysicsState) {
    if (!this.allArrived()) {
      return;
    }

    // console.log("Arrived at trajectory index", this.lastTargetIndex);
    ++this.lastTargetIndex;
    if (this.lastTargetIndex === this.trajectory.length) {
      // console.log("Trajectory execution complete");
      this.visualizer.scene.remove(this.trajectoryMesh);
      this.trajectoryMesh = undefined;
      this.afterArrive();
    } else {
      this.updateAxisTarget();
    }
  }

  protected afterArrive() {}

  private allArrived(): boolean {
    return this.x.arrived && this.y.arrived && this.z.arrived;
  }
}
