import { Vector3 } from "three";
import { PhysicsState3D } from "../Physics/PhysicsState3D";
import { Trajectory } from "../Physics/types";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { Rtg } from "./Rtg";

const Z_OVERSHOOT = 2;

const SPREADER_MAX_ACCEL = 2;
const TROLLY_MAX_ACCEL = 1;
const GANTRY_MAX_ACCEL = 0.5;

export class RtgControl extends PhysicsState3D {
  rtg: Rtg;
  onArrive: () => void;

  constructor(visualizer: Visualizer, rtg: Rtg, initialPosition: Vector3) {
    super(
      visualizer,
      undefined,
      new Vector3(GANTRY_MAX_ACCEL, TROLLY_MAX_ACCEL, SPREADER_MAX_ACCEL),
      initialPosition,
      rtg.id.toString()
    );
    this.visualizer = visualizer;
    this.rtg = rtg;
  }

  planTrajectory(target: Vector3): Trajectory {
    const trajectory: Trajectory = [];

    // 0 move spreader up to max height
    trajectory.push(
      new Vector3(this.position.x, this.position.y, this.rtg.height)
    );

    // 1 gantry to target
    trajectory.push(new Vector3(target.x, this.position.y, this.rtg.height));

    // 2 trolley to target
    const HEIGHT_ABOVE = 3;
    let overTargetHeight = target.z + HEIGHT_ABOVE;
    if (overTargetHeight > this.rtg.height) overTargetHeight = this.rtg.height;
    trajectory.push(new Vector3(target.x, target.y, overTargetHeight));

    // 3 lower down to target
    trajectory.push(new Vector3(target.x, target.y, target.z));

    return trajectory;
  }

  protected override drawTrajectory(): void {
    const points = [this.position, ...this.trajectory].map((point) =>
      point.clone().add(this.rtg.origin)
    );
    this.trajectoryMesh = Render.createPath(points, 0xe100ff);
    this.visualizer.scene.add(this.trajectoryMesh);
  }

  protected override afterArrive(): void {
    if (this.onArrive) this.onArrive();
  }
}
