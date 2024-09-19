import { Vector3 } from "three";
import { PhysicsState3D } from "../Physics/PhysicsState3D";
import { Trajectory } from "../Physics/types";
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

    // 0 plan gantry
    trajectory.push(new Vector3(target.x, this.position.y, this.position.z));

    let planLiftHeight = Math.max(this.position.z, target.z) + Z_OVERSHOOT;
    if (planLiftHeight > this.rtg.height) {
      planLiftHeight = this.rtg.height;
    }
    // 1 move spreader up to plan lift height
    const trolleyMove = target.y - this.position.y;
    trajectory.push(
      new Vector3(target.x, this.position.y + trolleyMove / 2, planLiftHeight)
    );

    // 2 trolley to above target
    const HEIGHT_ABOVE = 3;
    let overTargetHeight = target.z + HEIGHT_ABOVE;
    if (overTargetHeight > this.rtg.height) overTargetHeight = this.rtg.height;
    trajectory.push(new Vector3(target.x, target.y, overTargetHeight));

    // 3 lower down to target
    trajectory.push(new Vector3(target.x, target.y, target.z));
    return trajectory;
  }

  override execute(trajectory: Trajectory): void {
    super.execute(trajectory);
    this.trajectoryMesh.position.y += this.rtg.model.position.y;
    this.trajectoryMesh.position.x += this.rtg.model.position.x;
  }

  protected override afterArrive(): void {
    if (this.onArrive) this.onArrive();
  }
}
