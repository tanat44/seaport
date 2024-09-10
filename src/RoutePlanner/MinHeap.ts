type Item<T> = {
  value: number;
  data: T;
};

export class MinHeap<T> {
  heap: Item<T>[];

  constructor() {
    this.heap = [];
  }

  private getLeftChildIndex(parentIndex: number) {
    return 2 * parentIndex + 1;
  }
  private getRightChildIndex(parentIndex: number) {
    return 2 * parentIndex + 2;
  }
  private getParentIndex(childIndex: number) {
    return Math.floor((childIndex - 1) / 2);
  }
  private hasLeftChild(index: number) {
    return this.getLeftChildIndex(index) < this.heap.length;
  }
  private hasRightChild(index: number) {
    return this.getRightChildIndex(index) < this.heap.length;
  }
  private hasParent(index: number) {
    return this.getParentIndex(index) >= 0;
  }
  private leftChild(index: number) {
    return this.heap[this.getLeftChildIndex(index)];
  }
  private rightChild(index: number) {
    return this.heap[this.getRightChildIndex(index)];
  }
  private parent(index: number) {
    return this.heap[this.getParentIndex(index)];
  }

  private swap(indexOne: number, indexTwo: number) {
    const temp = this.heap[indexOne];
    this.heap[indexOne] = { ...this.heap[indexTwo] };
    this.heap[indexTwo] = { ...temp };
  }

  peek(): Item<T> {
    if (this.heap.length === 0) {
      return null;
    }
    return this.heap[0];
  }

  // Removing an element will remove the
  // top element with highest priority then
  // heapifyDown will be called
  remove(): Item<T> {
    if (this.heap.length === 0) {
      return null;
    }
    const item = this.heap[0];
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();
    this.heapifyDown();
    return item;
  }

  add(value: number, item: T) {
    this.heap.push({ value, data: item });
    this.heapifyUp();
  }

  private heapifyUp() {
    let index = this.heap.length - 1;
    while (
      this.hasParent(index) &&
      this.parent(index).value > this.heap[index].value
    ) {
      this.swap(this.getParentIndex(index), index);
      index = this.getParentIndex(index);
    }
  }

  private heapifyDown() {
    let index = 0;
    while (this.hasLeftChild(index)) {
      let smallerChildIndex = this.getLeftChildIndex(index);
      if (
        this.hasRightChild(index) &&
        this.rightChild(index).value < this.leftChild(index).value
      ) {
        smallerChildIndex = this.getRightChildIndex(index);
      }
      if (this.heap[index].value < this.heap[smallerChildIndex].value) {
        break;
      } else {
        this.swap(index, smallerChildIndex);
      }
      index = smallerChildIndex;
    }
  }

  printHeap() {
    var heap = ` ${this.heap[0]} `;
    for (var i = 1; i < this.heap.length; i++) {
      heap += ` ${this.heap[i]} `;
    }
    console.log(heap);
  }
}
