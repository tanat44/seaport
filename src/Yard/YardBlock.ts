import { Box2, Vector2, Vector3 } from "three";
import { StorageBlock } from "../StorageBlock/StorageBlock";
import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";
import { Terminal } from "../Terminal/Terminal";
import { CONTAINER_SIZE_Y } from "../Terminal/const";

const HANDLING_POINT_ROW_OFFSET = -1; // handling at same bay, row -1, tier 0

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
    const rtgOffset = new Vector3(0, -CONTAINER_SIZE_Y, 0);
    const rtgOrigin = this.position.clone().add(rtgOffset);
    return global.clone().sub(rtgOrigin);
  }

  coordinateToRtgPosition(coordinate: StorageCoordinate): Vector3 {
    const rtgOffset = new Vector3(0, -CONTAINER_SIZE_Y, 0);
    return coordinate.relativePosition.add(rtgOffset);
  }
}
