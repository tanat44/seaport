import { GridCoordinate } from "./GridCoordinate";
import { MinHeap } from "./MinHeap";

export class MinGridHeap extends MinHeap<GridCoordinate> {
  set: Set<string>;

  constructor() {
    super();
    this.set = new Set();
  }

  has(item: GridCoordinate): boolean {
    return this.set.has(item.hash());
  }

  add(value: number, item: GridCoordinate): void {
    super.add(value, item);
    this.set.add(item.hash());
  }

  remove(): GridCoordinate {
    const item = super.remove();
    this.set.delete(item.hash());
    return item;
  }
}
