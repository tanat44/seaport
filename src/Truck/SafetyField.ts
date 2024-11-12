import { Box2, Box3, Object3D, Vector2, Vector3 } from "three";
import { TruckQueuingTrafficEvent } from "../Event/TruckEvent";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { TRACTOR_LENGTH, Truck, TRUCK_WIDTH } from "./Truck";
import { TruckManager } from "./TruckManager";

const STEERING_FACTOR = 0.3;
export class SafetyField {
  visualizer: Visualizer;
  truckManager: TruckManager;
  truck: Truck;
  fieldModel: Object3D;

  constructor(
    truck: Truck,
    truckManager: TruckManager,
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
    this.truck.tractorModel.add(this.fieldModel);
  }

  update() {
    let stoppingDistance = this.truck.pathPhysics?.stoppingDistance;
    if (!stoppingDistance) stoppingDistance = 0;

    // update field size
    const baseLength = TRACTOR_LENGTH - 1;
    const fieldLength = baseLength * 2 + stoppingDistance;
    let fieldWidth =
      1 + this.truck.pathPhysics.steeringVelocity * STEERING_FACTOR;
    this.fieldModel.scale.x = fieldLength;
    this.fieldModel.scale.y = fieldWidth;
    let yOffset = fieldWidth - 0.5;
    this.fieldModel.position.y = yOffset;

    // field box
    const box3 = new Box3().setFromObject(this.fieldModel);
    const safetyField = new Box2(
      new Vector2(box3.min.x, box3.min.y),
      new Vector2(box3.max.x, box3.max.y)
    );

    // console.log(this.truck.id);

    const detection = this.truckManager.isSafetyFieldIntersectOtherTrucks(
      this.truck.id,
      safetyField
    );

    let trigger = false;
    if (detection) {
      trigger = true;
      this.visualizer.emit(
        new TruckQueuingTrafficEvent(this.truck.id, detection)
      );
    }
    this.truck.pathPhysics.setSafetyFieldDetection(trigger);
  }
}
