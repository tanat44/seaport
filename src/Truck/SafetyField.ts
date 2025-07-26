import { Box2, Box3, Object3D, Quaternion, Vector2, Vector3 } from "three";
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
  previousSteeringAngle: number = 0;

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
  }

  update() {
    let stoppingDistance = this.truck.pathPhysics?.stoppingDistance;
    if (!stoppingDistance) stoppingDistance = 0;

    // update field size
    const baseLength = TRACTOR_LENGTH - 1;
    const fieldLength = baseLength * 2 + stoppingDistance;
    const steerDirection = this.truck.pathPhysics.steeringAngle > 0;
    let capSteering = this.truck.pathPhysics.steeringAngle;
    if (capSteering > MAX_STEERING_ANGLE) {
      capSteering = MAX_STEERING_ANGLE;
    } else if (capSteering < -MAX_STEERING_ANGLE) {
      capSteering = -MAX_STEERING_ANGLE;
    }
    let fieldWidth = 1 + Math.abs(capSteering) * STEERING_FACTOR;
    this.fieldModel.scale.x = fieldLength;
    this.fieldModel.scale.y = fieldWidth;
    let yOffset = steerDirection ? fieldWidth - 0.5 : -fieldWidth + 0.5;

    // apply position / rotation in global coordinate
    const tractorPosition = new Vector3();
    this.truck.tractorModel.getWorldPosition(tractorPosition);
    tractorPosition.y += yOffset;
    const tractorRot = new Quaternion();
    this.truck.tractorModel.getWorldQuaternion(tractorRot);
    this.fieldModel.position.copy(tractorPosition);
    this.fieldModel.quaternion.copy(tractorRot);
    this.previousSteeringAngle = capSteering;

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
