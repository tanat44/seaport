import { Vector2 } from "three";
import { AnimateEvent } from "../Event/types";
import { MathUtility } from "../MathUtility";
import { Visualizer } from "../Visualizer/Visualizer";

const BRAKE_SAFETY_FACTOR = 1.05;

export class PhysicsState2D {
  visualizer: Visualizer;
  name: string;

  // state
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2;

  // constraint
  maxVelocity: Vector2 | undefined;
  maxAcceleration: Vector2;

  // motion
  targetPosition: Vector2 | undefined;
  stopAtTarget: boolean;
  onArrive: (state: PhysicsState2D) => void | undefined;
  arrived: boolean;
  direction: Vector2;

  constructor(
    name: string,
    visualizer: Visualizer,
    maxVelocity: Vector2 | undefined,
    maxAcceleration: Vector2,
    initialPosition: Vector2 | undefined
  ) {
    this.name = name;
    this.visualizer = visualizer;
    this.position = initialPosition?.clone() ?? new Vector2();
    this.velocity = new Vector2();
    this.acceleration = new Vector2();
    this.maxVelocity = maxVelocity?.clone();
    this.maxAcceleration = maxAcceleration.clone();
    this.arrived = true;

    this.visualizer.onEvent<AnimateEvent>("animate", (e) =>
      this.animate(e.deltaTime)
    );
  }

  setTarget(
    target: Vector2,
    stopAtTarget: boolean,
    onArrive: (state: PhysicsState2D) => void
  ) {
    // console.log("new target:", target);
    this.targetPosition = target.clone();
    this.stopAtTarget = stopAtTarget;
    this.onArrive = onArrive;
    this.arrived = false;
    this.direction = target.clone().sub(this.position).normalize();
  }

  private animate(deltaTime: number) {
    if (this.arrived) {
      return;
    }
    if (this.targetPosition !== undefined) {
      const remainDistance = this.targetPosition.clone().sub(this.position);
      this.arrived = remainDistance.dot(this.direction) <= 0;

      if (this.arrived) {
        this.position = this.targetPosition.clone();
        this.arrived = true;
        this.acceleration = new Vector2(0, 0);
        this.velocity = new Vector2(0, 0);
      } else {
        const directionalMaxAcceleration = MathUtility.vector2Abs(
          this.maxAcceleration
        ).dot(MathUtility.vector2Abs(this.direction));

        this.acceleration = this.direction
          .clone()
          .multiplyScalar(directionalMaxAcceleration);
        if (this.stopAtTarget) {
          const brakeDistance =
            (this.velocity.length() / 2 / directionalMaxAcceleration) *
            BRAKE_SAFETY_FACTOR;

          // if the remaining distance is less than the brake distance,

          // start braking by reverse acceleration
          if (remainDistance.length() < brakeDistance) {
            this.acceleration = this.acceleration.negate();
          }
        }
      }
    }

    // update velocity
    this.velocity = this.velocity
      .clone()
      .add(this.acceleration.clone().multiplyScalar(deltaTime));

    // bound to max velocity
    if (this.maxVelocity) {
      const directionalMaxVelocity = MathUtility.vector2Abs(
        this.maxVelocity
      ).dot(MathUtility.vector2Abs(this.direction));

      if (this.velocity.length() > directionalMaxVelocity)
        this.velocity = this.direction
          .clone()
          .multiplyScalar(directionalMaxVelocity);
    }

    // update position
    this.position = this.position
      .clone()
      .add(this.velocity.clone().multiplyScalar(deltaTime));
    this.visualizer.emit({
      type: `physicsstatechange${this.name}`,
    });

    if (this.arrived) {
      this.onArrive(this);
    }
  }
}
