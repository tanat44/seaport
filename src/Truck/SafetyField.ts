import { Mesh, Object3D, Quaternion, Vector3 } from "three";
import { OBB } from "three/examples/jsm/math/OBB.js";
import {
  TruckSafetyFieldResetEvent,
  TruckSafetyFieldTriggerEvent,
} from "../Event/TruckEvent";
import { AnimateEvent } from "../Event/types";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { TrafficManager } from "./TrafficManager";
import { TRACTOR_LENGTH, Truck, TRUCK_WIDTH } from "./Truck";

const STEERING_FACTOR = 10;
const MAX_STEERING_ANGLE = Math.PI / 6; // 30 degrees
const FIELD_NOMINAL_WIDTH = 2;
export class SafetyField {
  visualizer: Visualizer;
  truckManager: TrafficManager;
  truck: Truck;

  // state
  triggered: boolean;

  // visual model
  fieldModel: Object3D; // parent mesh container (provide scaling behavior)
  fieldShape: Mesh; // actual shape of the safety field

  constructor(
    truck: Truck,
    truckManager: TrafficManager,
    visualizer: Visualizer
  ) {
    this.visualizer = visualizer;
    this.truckManager = truckManager;
    this.truck = truck;

    this.triggered = false;

    // create 3d Object
    this.fieldShape = Render.createBox(
      new Vector3(1, TRUCK_WIDTH, 0.5),
      Render.safetyFieldMaterial,
      0.5
    );
    this.fieldShape.position.x = 0.5;
    this.fieldModel = new Object3D();
    this.fieldModel.add(this.fieldShape);
    this.visualizer.scene.add(this.fieldModel);
    this.visualizer.onEvent<AnimateEvent>("animate", (e) => this.animate(e));
  }

  animate(e: AnimateEvent) {
    let stoppingDistance = this.truck.pathPhysics?.stoppingDistance;
    if (!stoppingDistance) stoppingDistance = 0;

    // update field size
    const baseLength = TRACTOR_LENGTH - 1;
    const fieldLength = baseLength * 2 + stoppingDistance;

    // calculate field width
    let fieldWidth = FIELD_NOMINAL_WIDTH;
    const steerDirection = this.truck.steeringAngle > 0;
    if (this.truck.velocity.length() > 0) {
      let capSteering = this.truck.steeringAngle;
      if (capSteering > MAX_STEERING_ANGLE) {
        capSteering = MAX_STEERING_ANGLE;
      } else if (capSteering < -MAX_STEERING_ANGLE) {
        capSteering = -MAX_STEERING_ANGLE;
      }
      fieldWidth += Math.abs(capSteering) * STEERING_FACTOR;
    }

    this.fieldModel.scale.x = fieldLength;
    this.fieldModel.scale.y = fieldWidth;
    const yOffset =
      (fieldWidth / 2 - FIELD_NOMINAL_WIDTH / 2) *
      (steerDirection ? 1 : -1) *
      TRUCK_WIDTH;

    // apply position / rotation in global coordinate
    const fieldOffset = new Vector3(TRACTOR_LENGTH, yOffset, 0);
    const tractorMat = this.truck.tractorModel.matrixWorld;
    const tractorPosition = fieldOffset.applyMatrix4(tractorMat);
    const tractorRot = new Quaternion();
    this.truck.tractorModel.getWorldQuaternion(tractorRot);
    this.fieldModel.position.copy(tractorPosition);
    this.fieldModel.quaternion.copy(tractorRot);

    // field box

    const fieldBox = new OBB();
    fieldBox.applyMatrix4(this.fieldShape.matrixWorld);
    fieldBox.halfSize.copy(this.fieldModel.scale);

    const detection = this.truckManager.isSafetyFieldIntersectOtherTrucks(
      this.truck.id,
      fieldBox
    );
    this.fieldShape.material = detection
      ? Render.safetyFieldDetectMaterial
      : Render.safetyFieldMaterial;

    if (detection && !this.triggered) {
      this.triggered = true;
      this.visualizer.emit(
        new TruckSafetyFieldTriggerEvent(this.truck.id, detection)
      );
    } else if (!detection) {
      this.triggered = false;
      this.visualizer.emit(new TruckSafetyFieldResetEvent(this.truck.id));
    }
  }

  async waitForSafetyFieldReset() {
    return new Promise<void>((resolve, reject) => {
      if (!this.triggered) {
        resolve();
        return;
      }

      const onReset = (e: TruckSafetyFieldResetEvent) => {
        if (e.truckId === this.truck.id) {
          resolve();
          this.visualizer.offEvent("trucksafetyfieldreset", onReset);
        }
      };

      this.visualizer.onEvent<TruckSafetyFieldResetEvent>(
        "trucksafetyfieldreset",
        onReset
      );
    });
  }
}
