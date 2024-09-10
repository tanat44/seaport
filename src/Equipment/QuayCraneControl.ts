import { Vector3 } from "three";
import { Manager } from "../Manager";
import { PhysicsState3D } from "../Physics/PhysicsState3D";
import { Trajectory } from "../Physics/types";
import { QuayCrane } from "./QuayCrane";

const Z_OVERSHOOT = 2;

const SPREADER_MAX_ACCEL = 2;
const TROLLY_MAX_ACCEL = 1;
const GANTRY_MAX_ACCEL = 0.5;

export class QuayCraneControl extends PhysicsState3D {
  manager: Manager;
  crane: QuayCrane;

  constructor(
    manager: Manager,
    quayCrane: QuayCrane,
    initialPosition: Vector3
  ) {
    super(
      manager,
      undefined,
      new Vector3(GANTRY_MAX_ACCEL, TROLLY_MAX_ACCEL, SPREADER_MAX_ACCEL),
      initialPosition,
      quayCrane.id.toString()
    );
    this.manager = manager;
    this.crane = quayCrane;
    const id = quayCrane.id;

    this.manager.onEvent(`physicsstatechange${id}.x`, () => {
      this.manager.emit({ type: "quaycranegantry", quayCraneId: id });
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

    // 2 lower spreader down to target
    trajectory.push(new Vector3(target.x, target.y, target.z));
    return trajectory;
  }

  override execute(trajectory: Trajectory): void {
    super.execute(trajectory);
    this.trajectoryMesh.position.y += this.crane.model.position.y;
  }

  protected override afterArrive(): void {
    this.manager.emit({
      type: "quaycranemoveend",
      quayCraneId: this.crane.id,
    });
  }
}
