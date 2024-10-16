import { GridPose } from "./GridPose";
import { MinHeap } from "./MinHeap";

export class MinGridHeap extends MinHeap<GridPose> {
  set: Set<string>;

  constructor() {
    super();
    this.set = new Set();
  }

  has(item: GridPose): boolean {
    return this.set.has(item.hash);
  }

  add(value: number, item: GridPose): void {
    super.add(value, item);
    this.set.add(item.hash);
  }

  remove(): GridPose {
    const item = super.remove();
    this.set.delete(item.hash);
    return item;
  }
}
