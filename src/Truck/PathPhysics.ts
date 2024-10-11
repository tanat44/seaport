import { Object3D, Vector2 } from "three";
import { TruckDriveEndEvent } from "../Event/TruckEvent";
import { AnimateEvent } from "../Event/types";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { Truck } from "./Truck";

type UpdateCallback = (
  positionTrailer: Vector2,
  rotationTrailer: number,
  rotationTractor: number
) => void;

export class PathPhysics {
  visualizer: Visualizer;
  truck: Truck;

  // path trailer
  pathTrailer: Vector2[];
  pathTrailerDistances: number[];
  pathTractor: Vector2[];

  // parameters
  maxVelocity: number;
  maxAcceleration: number;
  updateCallback: UpdateCallback;

  // state
  distance: number;
  velocity: number;
  acceleration: number;

  // temporal
  lastIndex: number;
  arrived: boolean;

  // render
  meshes: Object3D[];

  constructor(
    visualizer: Visualizer,
    truck: Truck,
    controlPoints: Vector2[],
    trailerPivotDistance: number,
    maxVelocity: number,
    maxAcceleration: number,
    onUpdate: UpdateCallback
  ) {
    this.visualizer = visualizer;
    this.truck = truck;
    this.pathTrailer = PathPhysics.resampleEvenSpace(controlPoints);
    this.pathTractor = PathPhysics.pathKingPin(
      this.pathTrailer,
      trailerPivotDistance
    );
    this.maxVelocity = maxVelocity;
    this.maxAcceleration = maxAcceleration;
    this.updateCallback = onUpdate;

    // calculate control point distance
    let lastDistance = 0;
    this.pathTrailerDistances = [lastDistance];
    for (let i = 1; i < this.pathTrailer.length; ++i) {
      const p0 = this.pathTrailer[i - 1];
      const p1 = this.pathTrailer[i];
      const distance = lastDistance + p0.distanceTo(p1);
      this.pathTrailerDistances.push(distance);
      lastDistance = distance;
    }

    this.distance = 0;
    this.velocity = 0;
    this.acceleration = 0;
    this.lastIndex = 0;
    this.arrived = false;

    // render
    const pathTractorMesh = Render.createPath2D(this.pathTractor, 0, 0xa600ff);
    visualizer.scene.add(pathTractorMesh);
    this.meshes = [pathTractorMesh];

    // setup event listener
    this.visualizer.onEvent<AnimateEvent>("animate", (e) =>
      this.animate(e.deltaTime)
    );
  }

  get totalDistance(): number {
    return this.pathTrailerDistances[this.pathTrailerDistances.length - 1];
  }

  private animate(deltaTime: number) {
    if (this.arrived) return;

    if (this.lastIndex === this.pathTrailer.length - 1) {
      this.distance = this.totalDistance;
      this.velocity = 0;
      this.acceleration = 0;
      this.meshes.forEach((mesh) => mesh.removeFromParent());
      this.arrived = true;

      // emit event
      const event = new TruckDriveEndEvent();
      event.truckId = this.truck.id;
      event.job = this.truck.currentJob;
      this.visualizer.emit(event);

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
      nextIndex < this.pathTrailerDistances.length &&
      this.pathTrailerDistances[nextIndex] < this.distance
    ) {
      ++this.lastIndex;
      if (this.lastIndex > this.pathTrailerDistances.length - 1) {
        this.lastIndex = this.pathTrailerDistances.length - 1;
        break;
      } else nextIndex = this.lastIndex;
    }

    if (this.updateCallback)
      this.updateCallback(
        this.positionTrailer,
        this.rotation(this.pathTrailer),
        this.rotation(this.pathTractor)
      );
  }

  private get positionTrailer(): Vector2 {
    if (this.arrived || this.lastIndex === this.pathTrailer.length - 1)
      return this.pathTrailer[this.pathTrailer.length - 1];
    const lastDistance = this.pathTrailerDistances[this.lastIndex];
    const p0 = this.pathTrailer[this.lastIndex];
    const p1 = this.pathTrailer[this.lastIndex + 1];
    const v = p1.clone().sub(p0).normalize();

    return p0.clone().add(v.multiplyScalar(this.distance - lastDistance));
  }

  private rotation(path: Vector2[]): number {
    if (this.lastIndex >= path.length - 2) {
      const p0 = path[this.lastIndex - 1];
      const p1 = path[this.lastIndex];
      const v = p1.clone().sub(p0);
      return PathPhysics.vectorAngle(v);
    }

    // interpolate between two angles
    const p0 = path[this.lastIndex];
    const p1 = path[this.lastIndex + 1];
    const p2 = path[this.lastIndex + 2];
    const v1 = p1.clone().sub(p0);
    const v2 = p2.clone().sub(p1);
    const theta1 = PathPhysics.vectorAngle(v1);
    const theta2 = PathPhysics.vectorAngle(v2);

    const lastDistance = this.pathTrailerDistances[this.lastIndex];
    const segmentDistance =
      this.pathTrailerDistances[this.lastIndex + 1] - lastDistance;
    return (
      theta1 +
      ((theta2 - theta1) * (this.distance - lastDistance)) / segmentDistance
    );
  }

  private static vectorAngle(v: Vector2): number {
    return Math.atan2(v.y, v.x);
  }

  private static resampleEvenSpace(
    path: Vector2[],
    space: number = 1
  ): Vector2[] {
    const output: Vector2[] = [];

    let carryOver = 0;
    for (let i = 0; i < path.length - 1; ++i) {
      const p0 = path[i];
      const p1 = path[i + 1];
      const v = p1.clone().sub(p0);
      const v_norm = v.clone().normalize();
      const v_length = v.length();

      if (v_length > carryOver) {
        // add remaining points
        const remainDistance = v_length - carryOver;
        const count = Math.floor(remainDistance / space);
        let j = 0;
        do {
          output.push(
            p0.clone().add(v_norm.clone().multiplyScalar(carryOver + j * space))
          );
          ++j;
        } while (j <= count);
        carryOver = space - (v_length - carryOver - count * space);
      } else {
        carryOver -= v_length;
      }
    }
    return output;
  }

  private static pathKingPin(
    pathTrailerAxle: Vector2[],
    trailerPivotDistance: number
  ): Vector2[] {
    const output: Vector2[] = [];
    for (let i = 0; i < pathTrailerAxle.length - 1; ++i) {
      const p0 = pathTrailerAxle[i];
      const p1 = pathTrailerAxle[i + 1];
      const v_norm = p1.clone().sub(p0).normalize();
      const p = p0.clone().add(v_norm.multiplyScalar(trailerPivotDistance));
      output.push(p);
    }

    // add last point as the direction as one before last
    const p0 = pathTrailerAxle[pathTrailerAxle.length - 2];
    const p1 = pathTrailerAxle[pathTrailerAxle.length - 1];
    const v_norm = p1.clone().sub(p0).normalize();
    const p = p0.clone().add(v_norm.multiplyScalar(trailerPivotDistance));
    output.push(p);

    return output;
  }
}
