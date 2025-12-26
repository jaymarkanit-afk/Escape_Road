/**
 * Utility Helper Functions
 * Reusable functions for common operations
 */

/**
 * Clamps a value between min and max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

/**
 * Maps a value from one range to another
 */
export function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Returns a random number between min and max
 */
export function random(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random element from an array
 */
export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Calculates distance between two 3D points
 */
export function distance3D(x1, y1, z1, x2, y2, z2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates 2D distance (ignoring Y axis)
 */
export function distance2D(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Checks if two bounding boxes intersect
 * Each box: { min: {x, y, z}, max: {x, y, z} }
 */
export function checkAABBCollision(box1, box2) {
  return (
    box1.min.x <= box2.max.x &&
    box1.max.x >= box2.min.x &&
    box1.min.y <= box2.max.y &&
    box1.max.y >= box2.min.y &&
    box1.min.z <= box2.max.z &&
    box1.max.z >= box2.min.z
  );
}

/**
 * Formats time in seconds to MM:SS
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Formats score with commas
 */
export function formatScore(score) {
  return Math.floor(score).toLocaleString();
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a simple event emitter for pub/sub pattern
 */
export class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(
      (listener) => listener !== listenerToRemove
    );
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach((listener) => {
      listener(...args);
    });
  }
}

/**
 * Simple pooling system for object reuse
 */
export class ObjectPool {
  constructor(factory, initialSize = 10) {
    this.factory = factory;
    this.pool = [];
    this.active = [];

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire() {
    const obj = this.pool.length > 0 ? this.pool.pop() : this.factory();
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    const index = this.active.indexOf(obj);
    if (index > -1) {
      this.active.splice(index, 1);
      this.pool.push(obj);
    }
  }

  clear() {
    this.pool = [];
    this.active = [];
  }
}
