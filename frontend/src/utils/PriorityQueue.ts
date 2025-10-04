// src/utils/PriorityQueue.ts

type QueueItem<T> = {
    item: T;
    priority: number;
    timestamp: number;
  };
  
  export class PriorityQueue<T> {
    private heap: QueueItem<T>[];
  
    constructor() {
      this.heap = [];
    }
  
    private compare(a: QueueItem<T>, b: QueueItem<T>) {
      if (a.priority === b.priority) {
        // Tie-breaker: earlier timestamp wins
        return a.timestamp < b.timestamp;
      }
      return a.priority > b.priority; // Max-heap (higher priority first)
    }
  
    private swap(i: number, j: number) {
      [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
  
    private bubbleUp(index: number) {
      while (index > 0) {
        const parent = Math.floor((index - 1) / 2);
        if (this.compare(this.heap[index], this.heap[parent])) {
          this.swap(index, parent);
          index = parent;
        } else break;
      }
    }
  
    private bubbleDown(index: number) {
      const length = this.heap.length;
      while (true) {
        let largest = index;
        const left = 2 * index + 1;
        const right = 2 * index + 2;
  
        if (left < length && this.compare(this.heap[left], this.heap[largest])) {
          largest = left;
        }
        if (right < length && this.compare(this.heap[right], this.heap[largest])) {
          largest = right;
        }
        if (largest !== index) {
          this.swap(index, largest);
          index = largest;
        } else break;
      }
    }
  
    push(item: T, priority: number, timestamp: number) {
      const node = { item, priority, timestamp };
      this.heap.push(node);
      this.bubbleUp(this.heap.length - 1);
    }
  
    pop(): T | undefined {
      if (this.heap.length === 0) return undefined;
      this.swap(0, this.heap.length - 1);
      const node = this.heap.pop();
      if (this.heap.length > 0) {
        this.bubbleDown(0);
      }
      return node?.item;
    }
  
    // 👇 New helper: pop + snapshot
    allocate(): { patient: T | undefined; remainingQueue: T[] } {
      const patient = this.pop();
      return { patient, remainingQueue: this.toArray() };
    }
  
    peek(): T | undefined {
      return this.heap[0]?.item;
    }
  
    size(): number {
      return this.heap.length;
    }
  
    // 👇 Expose a snapshot of current queue items
    toArray(): T[] {
      return this.heap.map((node) => node.item);
    }
  }
  