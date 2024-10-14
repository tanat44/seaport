import { Box2, Box3, Object3D, Vector2, Vector3 } from "three";
import { Terminal } from "../Terminal/Terminal";
import { Render } from "../Visualizer/Render";
import { TRACTOR_LENGTH, Truck, TRUCK_WIDTH } from "./Truck";

export class SafetyField {
  truck: Truck;
  terminal: Terminal;

  fieldModel: Object3D;

  constructor(truck: Truck, terminal: Terminal) {
    this.truck = truck;
    this.terminal = terminal;

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
    const stoppingDistance = this.truck.pathPhysics?.stoppingDistance;
    if (!stoppingDistance) return;

    // update field size
    const baseLength = TRACTOR_LENGTH - 1;
    const fieldLength = baseLength + stoppingDistance;
    this.fieldModel.scale.x = fieldLength;

    // field box
    const box3 = new Box3().setFromObject(this.fieldModel);
    const safetyField = new Box2(
      new Vector2(box3.min.x, box3.min.y),
      new Vector2(box3.max.x, box3.max.y)
    );

    const collideTruckId =
      this.terminal.truckManager.isSafetyFieldIntersectOtherTrucks(
        this.truck.id,
        safetyField
      );

    let detection = false;
    if (
      collideTruckId !== null &&
      this.terminal.truckManager.isMyTruckOnTheRight(
        this.truck.id,
        collideTruckId
      )
    ) {
      detection = true;
    }
    this.truck.pathPhysics.setSafetyFieldDetection(detection);
  }

  private boxToString(box: Box2) {
    return `${box.min.x} ${box.min.y} ${box.max.x} ${box.max.y}`;
  }
}
