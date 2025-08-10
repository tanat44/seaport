import { Object3D, Vector2 } from "three";
import { TruckDriveEndEvent } from "../Event/TruckEvent";
import { AnimateEvent } from "../Event/types";
import { PathUtility } from "../Generic/PathUtility";
import { MathUtility } from "../MathUtility";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { Truck } from "./Truck";
import { TruckStatus } from "./types";

type UpdateCallback = (
  positionTrailer: Vector2,
  directionTrailer: Vector2,
  directionTractor: Vector2
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
  maxDeceleration: number;
  updateCallback: UpdateCallback;

  // state
  distance: number;
  velocity: number;
  acceleration: number;
  status: TruckStatus;
  private animationCallback: (e: AnimateEvent) => void;
  private running: boolean;

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
    this.pathTrailer = PathUtility.resample(controlPoints);
    this.pathTractor = PathPhysics.pathKingPin(
      this.pathTrailer,
      trailerPivotDistance
    );
    this.maxVelocity = maxVelocity;
    this.maxAcceleration = maxAcceleration;
    this.maxDeceleration = -3 * maxAcceleration;
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
    this.status = TruckStatus.Idle;
    this.lastIndex = 0;
    this.arrived = false;
    this.running = true;

    // render
    const pathTractorMesh = Render.createPath2D(this.pathTractor, 0, 0xa600ff);
    visualizer.scene.add(pathTractorMesh);
    this.meshes = [pathTractorMesh];

    // setup event listener
    this.animationCallback = (e: AnimateEvent) => this.animate(e);
    this.visualizer.onEvent<AnimateEvent>("animate", this.animationCallback);
  }

  get totalDistance(): number {
    return this.pathTrailerDistances[this.pathTrailerDistances.length - 1];
  }

  get stoppingDistance(): number {
    return (this.velocity * this.velocity) / 2 / Math.abs(this.maxDeceleration);
  }

  get stopped(): boolean {
    return MathUtility.floatEqual(this.velocity, 0);
  }

  dispose(): void {
    this.visualizer.offEvent("animate", this.animationCallback);
    this.meshes.forEach((mesh) => {
      this.visualizer.scene.remove(mesh);
    });
  }

  flagDown() {
    this.running = false;
  }

  resume() {
    this.running = true;
  }

  private animate(e: AnimateEvent) {
    const deltaTime = e.deltaTime;
    if (this.arrived) return;

    if (!this.running) {
      if (this.velocity > 0) {
        this.acceleration = this.maxDeceleration;
      } else {
        this.acceleration = 0;
        this.velocity = 0;
        this.status = TruckStatus.QueueTraffic;
      }
    } else {
      const brakeDistance =
        (this.velocity * this.velocity) / 2 / this.maxAcceleration;
      const remainDistance = this.totalDistance - this.distance;
      if (remainDistance < brakeDistance) {
        this.acceleration = this.maxDeceleration;
      } else {
        this.acceleration = this.maxAcceleration;
      }

      // bound acceleration
      if (this.maxAcceleration) {
        if (this.acceleration > this.maxAcceleration)
          this.acceleration = this.maxAcceleration;
        else if (this.acceleration < this.maxDeceleration)
          this.acceleration = this.maxDeceleration;
      }
    }

    // update velocity
    this.velocity += this.acceleration * deltaTime;

    // bound velocity
    if (this.maxVelocity) {
      if (this.velocity > this.maxVelocity) this.velocity = this.maxVelocity;
      else if (this.velocity < -this.maxVelocity)
        this.velocity = -this.maxVelocity;
    }
    if (Math.abs(this.velocity) > 0) this.status = TruckStatus.Move;

    // update position
    this.distance += this.velocity * deltaTime;

    // update last index
    let nextIndex = this.lastIndex + 1;
    while (
      nextIndex < this.pathTrailerDistances.length &&
      this.pathTrailerDistances[nextIndex] < this.distance
    ) {
      if (nextIndex > this.pathTrailerDistances.length - 1) {
        nextIndex = this.pathTrailerDistances.length - 1;
        break;
      }
      this.lastIndex = nextIndex;
      ++nextIndex;
    }

    const tractorDirection = this.rotation(this.pathTractor, this.distance);

    if (this.updateCallback)
      this.updateCallback(
        this.positionTrailer,
        this.rotation(this.pathTrailer, this.distance),
        tractorDirection
      );

    if (this.lastIndex === this.pathTrailer.length - 1) {
      this.distance = this.totalDistance;
      this.velocity = 0;
      this.acceleration = 0;
      this.meshes.forEach((mesh) => mesh.removeFromParent());
      this.arrived = true;
      this.status = TruckStatus.Idle;

      // emit event
      this.visualizer.emit(
        new TruckDriveEndEvent(this.truck.id, this.truck.currentJob)
      );
    }
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

  private rotation(path: Vector2[], distance: number): Vector2 {
    if (this.lastIndex >= path.length - 2) {
      const p0 = path[this.lastIndex - 1];
      const p1 = path[this.lastIndex];
      const v = p1.clone().sub(p0);
      return v.normalize();
    }

    // interpolate between two angles
    const p0 = path[this.lastIndex];
    const p1 = path[this.lastIndex + 1];
    const p2 = path[this.lastIndex + 2];
    const v1 = p1.clone().sub(p0).normalize();
    const v2 = p2.clone().sub(p1).normalize();
    const deltaV = v2.clone().sub(v1);

    const lastDistance = this.pathTrailerDistances[this.lastIndex];
    const segmentDistance =
      this.pathTrailerDistances[this.lastIndex + 1] - lastDistance;
    return v1
      .add(deltaV.multiplyScalar((distance - lastDistance) / segmentDistance))
      .normalize();
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
    const p = p1.clone().add(v_norm.multiplyScalar(trailerPivotDistance));
    output.push(p);

    return output;
  }
}
