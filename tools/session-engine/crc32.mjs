const table = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1)
    value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  table[index] = value >>> 0;
}

export function crc32(bytes) {
  const accumulator = new Crc32Accumulator();
  accumulator.update(bytes);
  return accumulator.digest();
}

export class Crc32Accumulator {
  constructor() {
    this.value = 0xffffffff;
  }

  update(bytes) {
    for (const byte of bytes)
      this.value = table[(this.value ^ byte) & 0xff] ^ (this.value >>> 8);
    return this;
  }

  digest() {
    return (this.value ^ 0xffffffff) >>> 0;
  }

  hex() {
    return this.digest().toString(16).padStart(8, "0");
  }
}
