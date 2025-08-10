import { Box2, Box3, Object3D, Quaternion, Vector2, Vector3 } from "three";
import { AnimateEvent } from "../Event/types";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { TrafficManager } from "./TrafficManager";
import { TRACTOR_LENGTH, Truck, TRUCK_WIDTH } from "./Truck";

const STEERING_FACTOR = 10;
const MAX_STEERING_ANGLE = Math.PI / 6; // 30 degrees
export class SafetyField {
  visualizer: Visualizer;
  truckManager: TrafficManager;
  truck: Truck;
  fieldModel: Object3D;

  constructor(
    truck: Truck,
    truckManager: TrafficManager,
    visualizer: Visualizer
  ) {
    this.visualizer = visualizer;
    this.truckManager = truckManager;
    this.truck = truck;

    // create 3d Object
    const fieldShape = Render.createBox(
      new Vector3(1, TRUCK_WIDTH, 0.5),
      Render.safetyFieldMaterial,
      0.5
    );
    fieldShape.position.x = 0.5;
    this.fieldModel = new Object3D();
    this.fieldModel.add(fieldShape);
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
    let fieldWidth = 1;
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
      (fieldWidth / 2 - 1 / 2) * (steerDirection ? 1 : -1) * TRUCK_WIDTH;

    // apply position / rotation in global coordinate
    const fieldOffset = new Vector3(TRACTOR_LENGTH, yOffset, 0);
    const tractorMat = this.truck.tractorModel.matrixWorld;
    const tractorPosition = fieldOffset.applyMatrix4(tractorMat);
    const tractorRot = new Quaternion();
    this.truck.tractorModel.getWorldQuaternion(tractorRot);
    this.fieldModel.position.copy(tractorPosition);
    this.fieldModel.quaternion.copy(tractorRot);

    // field box
    const box3 = new Box3().setFromObject(this.fieldModel);
    const safetyField = new Box2(
      new Vector2(box3.min.x, box3.min.y),
      new Vector2(box3.max.x, box3.max.y)
    );

    // const detection = this.truckManager.isSafetyFieldIntersectOtherTrucks(
    //   this.truck.id,
    //   safetyField
    // );

    // let trigger = false;
    // if (detection) {
    //   trigger = true;
    //   this.visualizer.emit(
    //     new TruckQueuingTrafficEvent(
    //       this.truck.id,
    //       detection,
    //       this.truck.currentJob
    //     )
    //   );
    // }
    // this.truck.pathPhysics.setSafetyFieldDetection(trigger);
  }
}
