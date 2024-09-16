import { Vector2 } from "three";
import { AnimateEvent } from "../Event/types";
import { Visualizer } from "../Visualizer/Visualizer";

const ARRIVE_THRESHOLD = 0.1;
type UpdateCallback = (position: Vector2, rotation: number) => void;

export class PathPhysics {
  // parameter
  controlPoints: Vector2[];
  controlPointDistances: number[];
  maxVelocity: number;
  maxAcceleration: number;
  updateCallback: UpdateCallback;

  // state
  distance: number;
  velocity: number;
  acceleration: number;

  // temporal
  lastIndex: number;

  constructor(
    visualizer: Visualizer,
    controlPoints: Vector2[],
    maxVelocity: number,
    maxAcceleration: number,
    onUpdate: UpdateCallback
  ) {
    this.controlPoints = controlPoints;
    this.maxVelocity = maxVelocity;
    this.maxAcceleration = maxAcceleration;
    this.updateCallback = onUpdate;

    // calculate control point distance
    let lastDistance = 0;
    this.controlPointDistances = [lastDistance];
    for (let i = 1; i < controlPoints.length; ++i) {
      const p0 = this.controlPoints[i - 1];
      const p1 = this.controlPoints[i];
      const distance = lastDistance + p0.distanceTo(p1);
      this.controlPointDistances.push(distance);
      lastDistance = distance;
    }

    this.distance = 0;
    this.velocity = 0;
    this.acceleration = 0;

    this.lastIndex = 0;

    // setup event listener
    visualizer.onEvent<AnimateEvent>("animate", (e) =>
      this.animate(e.deltaTime)
    );
  }

  get arrived(): boolean {
    return this.lastIndex === this.controlPoints.length - 1;
  }

  get totalDistance(): number {
    return this.controlPointDistances[this.controlPointDistances.length - 1];
  }

  private animate(deltaTime: number) {
    if (this.arrived) {
      this.distance = this.totalDistance;
      this.velocity = 0;
      this.acceleration = 0;
      return;
    }

    const brakeDistance =
      (this.velocity * this.velocity) / 2 / this.maxAcceleration;
    const remainDistance = this.totalDistance - this.distance;
    if (remainDistance < brakeDistance) {
      this.acceleration = -this.maxAcceleration;
    } else {
      this.acceleration = this.maxAcceleration;
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
    this.distance += this.velocity * deltaTime;

    // update last index
    let nextIndex = this.lastIndex + 1;
    while (
      nextIndex < this.controlPointDistances.length &&
      this.controlPointDistances[nextIndex] < this.distance
    ) {
      ++this.lastIndex;
      if (this.lastIndex > this.controlPointDistances.length - 1) {
        this.lastIndex = this.controlPointDistances.length - 1;
        break;
      } else nextIndex = this.lastIndex;
    }

    if (this.updateCallback) this.updateCallback(this.position, this.rotation);
  }

  private get position(): Vector2 {
    if (this.arrived) return this.controlPoints[this.controlPoints.length - 1];

    const lastDistance = this.controlPointDistances[this.lastIndex];
    const p0 = this.controlPoints[this.lastIndex];
    const p1 = this.controlPoints[this.lastIndex + 1];
    const v = p1.clone().sub(p0).normalize();

    return p0.clone().add(v.multiplyScalar(this.distance - lastDistance));
  }

  private get rotation(): number {
    let p0: Vector2;
    let p1: Vector2;
    if (this.lastIndex < this.controlPoints.length - 1) {
      p0 = this.controlPoints[this.lastIndex];
      p1 = this.controlPoints[this.lastIndex + 1];
    } else {
      p0 = this.controlPoints[this.lastIndex - 1];
      p1 = this.controlPoints[this.lastIndex];
    }
    const v = p1.clone().sub(p0);
    const theta = Math.atan2(v.y, v.x);
    return theta;
  }
}
