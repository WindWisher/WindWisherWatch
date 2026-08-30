export class FixedRingBuffer {
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity < 1)
      throw new Error("Ring capacity must be a positive integer");
    this.capacity = capacity;
    this.values = new Array(capacity);
    this.start = 0;
    this.length = 0;
  }

  push(value) {
    const index = (this.start + this.length) % this.capacity;
    this.values[index] = value;
    if (this.length < this.capacity) this.length += 1;
    else this.start = (this.start + 1) % this.capacity;
  }

  snapshot() {
    return Array.from({ length: this.length }, (_, index) =>
      structuredClone(this.values[(this.start + index) % this.capacity]),
    );
  }
}
