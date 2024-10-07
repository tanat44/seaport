import { Vector3 } from "three";
import { PhysicsState3D } from "../Physics/PhysicsState3D";
import { Trajectory } from "../Physics/types";
import { Visualizer } from "../Visualizer/Visualizer";
import { QuayCrane } from "./QuayCrane";

const Z_OVERSHOOT = 2;

const SPREADER_MAX_ACCEL = 2;
const TROLLY_MAX_ACCEL = 1;
const GANTRY_MAX_ACCEL = 0.5;

export class QuayCraneControl extends PhysicsState3D {
  crane: QuayCrane;
  onArrive: () => void;

  constructor(
    visualizer: Visualizer,
    quayCrane: QuayCrane,
    initialPosition: Vector3
  ) {
    super(
      visualizer,
      undefined,
      new Vector3(GANTRY_MAX_ACCEL, TROLLY_MAX_ACCEL, SPREADER_MAX_ACCEL),
      initialPosition,
      quayCrane.id.toString()
    );
    this.visualizer = visualizer;
    this.crane = quayCrane;
    const id = quayCrane.id;

    this.visualizer.onEvent(`physicsstatechange${id}.x`, () => {
      this.visualizer.emit({
        type: "quaycranegantry",
        quayCraneId: id,
        absoluteSpace: quayCrane.absoluteSpace,
      });
    });
  }

  planTrajectory(target: Vector3): Trajectory {
    const trajectory: Trajectory = [];

    // 0 plan gantry
    trajectory.push(new Vector3(target.x, this.position.y, this.position.z));

    let planLiftHeight = Math.max(this.position.z, target.z) + Z_OVERSHOOT;
    if (planLiftHeight > this.crane.height) {
      planLiftHeight = this.crane.height;
    }
    // 1 move spreader up to plan lift height
    const trolleyMove = target.y - this.position.y;
    trajectory.push(
      new Vector3(target.x, this.position.y + trolleyMove / 2, planLiftHeight)
    );

    // 2 trolley to above target
    const HEIGHT_ABOVE = 3;
    let overTargetHeight = target.z + HEIGHT_ABOVE;
    if (overTargetHeight > this.crane.height)
      overTargetHeight = this.crane.height;
    trajectory.push(new Vector3(target.x, target.y, overTargetHeight));

    // 3 lower down to target
    trajectory.push(new Vector3(target.x, target.y, target.z));
    return trajectory;
  }

  override execute(trajectory: Trajectory): void {
    super.execute(trajectory);
    this.trajectoryMesh.position.y += this.crane.model.position.y;
  }

  protected override afterArrive(): void {
    if (this.onArrive) this.onArrive();
  }
}
