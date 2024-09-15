import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";

export class YardCoordinate extends StorageCoordinate {
  yardId: string;
  constructor(yardId: string, bay: number, row: number, tier: number) {
    super(bay, row, tier);

    this.yardId = yardId;
  }
}
