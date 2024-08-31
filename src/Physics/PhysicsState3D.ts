import { BufferGeometry, Line, LineBasicMaterial, Vector3 } from "three";
import { Manager } from "../Manager";
import { PhysicsState } from "./PhysicsState";
import { Trajectory } from "./types";

export class PhysicsState3D {
  manager: Manager;

  x: PhysicsState;
  y: PhysicsState;
  z: PhysicsState;

  // motion
  trajectory: Trajectory;
  lastTargetIndex: number;
  trajectoryMesh: Line | undefined;

  constructor(
    manager: Manager,
    maxVelocity: Vector3 | undefined,
    maxAcceleration: Vector3 | undefined,
    initialPosition: Vector3 | undefined
  ) {
    this.manager = manager;
    this.x = new PhysicsState(
      "x",
      manager,
      maxVelocity?.x,
      maxAcceleration?.x,
      initialPosition?.x
    );
    this.y = new PhysicsState(
      "y",
      manager,
      maxVelocity?.y,
      maxAcceleration?.y,
      initialPosition?.y
    );
    this.z = new PhysicsState(
      "z",
      manager,
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
    this.trajectoryMesh = this.drawTrajectory(trajectory);
    this.manager.scene.add(this.trajectoryMesh);
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
      this.manager.scene.remove(this.trajectoryMesh);
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

  private drawTrajectory(trajectory: Trajectory): Line {
    const material = new LineBasicMaterial({ color: 0x0000ff });
    const geometry = new BufferGeometry().setFromPoints([
      this.position,
      ...trajectory,
    ]);
    const line = new Line(geometry, material);
    return line;
  }
}
