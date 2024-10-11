import { Box2, Vector2, Vector3 } from "three";
import { StorageBlock } from "../StorageBlock/StorageBlock";
import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";
import { Terminal } from "../Terminal/Terminal";
import { CONTAINER_SIZE_Y } from "../Terminal/const";

const HANDLING_POINT_ROW_OFFSET = -1; // handling at same bay, row -1, tier 0
const RTG_OFFSET_Y = CONTAINER_SIZE_Y * 2;
export class YardBlock extends StorageBlock {
  static yardBlockCount = 0;

  constructor(terminal: Terminal, space: Box2, height: number) {
    const size = new Vector2();
    space.getSize(size);
    super(
      terminal,
      `Yard-${YardBlock.yardBlockCount++}`,
      size.x,
      size.y,
      height,
      space.min
    );
  }

  getContainerHandlingPoint(coordinate: StorageCoordinate): Vector2 {
    const handlingCoordinate = new StorageCoordinate(
      coordinate.bay,
      HANDLING_POINT_ROW_OFFSET,
      0
    );
    const pos = handlingCoordinate.relativePosition.add(this.position);
    return new Vector2(pos.x, pos.y);
  }

  globalPositionToRtgPosition(global: Vector3) {
    const global_origin = global.clone().sub(this.position);
    global_origin.y += RTG_OFFSET_Y;
    return global_origin;
  }

  coordinateToRtgPosition(coordinate: StorageCoordinate): Vector3 {
    const position = coordinate.relativePosition;
    position.y += RTG_OFFSET_Y;
    return position;
  }
}
