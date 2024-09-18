import { AnimateEvent } from "../../Event/types";
import { Visualizer } from "../../Visualizer/Visualizer";

const BRAKE_SAFETY_FACTOR = 1.05;

export class PhysicsState {
  visualizer: Visualizer;
  name: string;

  // state
  position: number;
  velocity: number;
  acceleration: number;

  // constraint
  maxVelocity: number | undefined;
  maxAcceleration: number;

  // motion
  targetPosition: number | undefined;
  stopAtTarget: boolean;
  onArrive: (state: PhysicsState) => void | undefined;
  arrived: boolean;
  forwardMotion: boolean;

  constructor(
    name: string,
    visualizer: Visualizer,
    maxVelocity: number | undefined,
    maxAcceleration: number,
    initialPosition: number | undefined
  ) {
    this.name = name;
    this.visualizer = visualizer;
    this.position = initialPosition ?? 0;
    this.velocity = 0;
    this.acceleration = 0;
    this.maxVelocity = maxVelocity;
    this.maxAcceleration = maxAcceleration;
    this.arrived = true;
    this.forwardMotion = true;

    this.visualizer.onEvent<AnimateEvent>("animate", (e) =>
      this.animate(e.deltaTime)
    );
  }

  setTarget(
    position: number,
    stopAtTarget: boolean,
    onArrive: (state: PhysicsState) => void
  ) {
    this.targetPosition = position;
    this.stopAtTarget = stopAtTarget;
    this.forwardMotion = this.targetPosition > this.position;
    this.onArrive = onArrive;
    this.arrived = false;
  }

  private animate(deltaTime: number) {
    if (this.arrived) {
      return;
    }
    if (this.targetPosition !== undefined) {
      const remainDistance = this.targetPosition - this.position;
      this.arrived = this.forwardMotion
        ? remainDistance < 0
        : remainDistance > 0;
      if (this.arrived) {
        this.position = this.targetPosition;
        this.arrived = true;
        this.acceleration = 0;
        this.velocity = 0;
      } else {
        if (this.stopAtTarget) {
          const brakeDistance =
            ((this.velocity * this.velocity) / 2 / this.maxAcceleration) *
            BRAKE_SAFETY_FACTOR;

          if (Math.abs(remainDistance) < brakeDistance) {
            this.acceleration = this.forwardMotion
              ? -this.maxAcceleration
              : this.maxAcceleration;
          } else {
            this.acceleration = this.forwardMotion
              ? this.maxAcceleration
              : -this.maxAcceleration;
          }
        } else {
          this.acceleration = this.forwardMotion
            ? this.maxAcceleration
            : -this.maxAcceleration;
        }
      }
    }

    // bound acceleration
    if (this.maxAcceleration) {
      if (this.acceleration > this.maxAcceleration)
        this.acceleration = this.maxAcceleration;
      else if (this.acceleration < -this.maxAcceleration)
        this.acceleration = -this.maxAcceleration;
    }
    // update velocity
    this.velocity += this.acceleration * deltaTime;

    // bound velocity
    if (this.maxVelocity) {
      if (this.velocity > this.maxVelocity) this.velocity = this.maxVelocity;
      else if (this.velocity < -this.maxVelocity)
        this.velocity = -this.maxVelocity;
    }
    // update position
    this.position += this.velocity * deltaTime;
    this.visualizer.emit({
      type: `physicsstatechange${this.name}`,
    });

    if (this.arrived) {
      this.onArrive(this);
    }
  }
}
