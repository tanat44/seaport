import { Line, Vector2, Vector3 } from "three";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { PhysicsState } from "./PhysicsState";
import { PhysicsState2D } from "./PhysicsState2D";
import { Trajectory } from "./types";

export class PhysicsCrane {
  visualizer: Visualizer;

  gantryState: PhysicsState;
  trolleySpreaderState: PhysicsState2D;

  // motion
  trajectory: Trajectory;
  lastTargetIndex: number;
  trajectoryMesh: Line | undefined;

  constructor(
    visualizer: Visualizer,
    maxVelocity: Vector3 | undefined,
    maxAcceleration: Vector3,
    initialPosition: Vector3 | undefined,
    name: string
  ) {
    this.visualizer = visualizer;
    this.gantryState = new PhysicsState(
      `${name}.gantry`,
      visualizer,
      maxVelocity?.x,
      maxAcceleration?.x,
      initialPosition?.x
    );
    this.trolleySpreaderState = new PhysicsState2D(
      `${name}.trolleyspreader`,
      visualizer,
      maxVelocity ? new Vector2(maxVelocity.y, maxVelocity.z) : undefined,
      new Vector2(maxAcceleration.y, maxAcceleration.z),
      new Vector2(initialPosition?.y, initialPosition?.z)
    );
  }

  get position(): Vector3 {
    return new Vector3(
      this.gantryState.position,
      this.trolleySpreaderState.position.x,
      this.trolleySpreaderState.position.y
    );
  }

  execute(trajectory: Trajectory) {
    this.lastTargetIndex = 0;
    this.trajectory = trajectory;
    this.updateAxisTarget();
    this.drawTrajectory();
    // console.log(trajectory);
  }

  private updateAxisTarget() {
    this.gantryState.setTarget(
      this.trajectory[this.lastTargetIndex].x,
      true,
      (state) => this.onAxisArrive(this.gantryState.name)
    );

    const trolleySpreaderTarget = new Vector2(
      this.trajectory[this.lastTargetIndex].y,
      this.trajectory[this.lastTargetIndex].z
    );
    this.trolleySpreaderState.setTarget(trolleySpreaderTarget, true, (state) =>
      this.onAxisArrive(this.trolleySpreaderState.name)
    );
  }

  onAxisArrive(axisName: string) {
    // console.log(`Axis ${axisName} arrived.`);
    if (!this.allArrived()) {
      return;
    }

    ++this.lastTargetIndex;
    if (this.lastTargetIndex === this.trajectory.length) {
      console.log("Trajectory execution complete");
      this.visualizer.scene.remove(this.trajectoryMesh);
      this.trajectoryMesh = undefined;
      this.afterArrive();
    } else {
      this.updateAxisTarget();
    }
  }

  protected drawTrajectory() {
    this.trajectoryMesh = Render.createPath(
      [this.position, ...this.trajectory],
      0xe100ff
    );
    this.visualizer.scene.add(this.trajectoryMesh);
  }

  protected afterArrive() {}

  private allArrived(): boolean {
    return this.gantryState.arrived && this.trolleySpreaderState.arrived;
  }
}
