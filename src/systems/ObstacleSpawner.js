/**
 * ObstacleSpawner - Manages obstacle lifecycle
 * Responsibility: Spawn obstacles at intervals, manage object pool, difficulty scaling
 * Uses object pooling pattern for performance
 */

import { Obstacle } from "../objects/Obstacle.js";
import { OBSTACLE_CONFIG } from "../utils/constants.js";
import {
  randomChoice,
  randomInt,
  random,
  ObjectPool,
} from "../utils/helpers.js";

export class ObstacleSpawner {
  constructor(scene, cityRef) {
    this.scene = scene;
    this.cityRef = cityRef;

    // Active obstacles
    this.obstacles = [];

    // Spawning state
    this.spawnRate = OBSTACLE_CONFIG.INITIAL_SPAWN_RATE;
    this.timeSinceLastSpawn = 0;

    // Object pool for each obstacle type
    this.pools = {
      static: new ObjectPool(() => new Obstacle(scene, "static"), 5),
      moving: new ObjectPool(() => new Obstacle(scene, "moving"), 3),
      barrel: new ObjectPool(() => new Obstacle(scene, "barrel"), 5),
      cone: new ObjectPool(() => new Obstacle(scene, "cone"), 5),
    };
  }

  /**
   * Update spawner - handle spawning and obstacle updates
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {number} playerZ - Player's Z position
   */
  update(deltaTime, playerZ) {
    this.timeSinceLastSpawn += deltaTime * 1000; // Convert to ms

    // Spawn new obstacle if interval reached
    if (this.timeSinceLastSpawn >= this.spawnRate) {
      this._spawnObstacle(playerZ);
      this.timeSinceLastSpawn = 0;
    }

    // Update all active obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update(deltaTime, playerZ);

      // Remove obstacles that are behind player
      if (obstacle.shouldRemove()) {
        this._removeObstacle(i);
      }
    }
  }

  /**
   * Spawn a new obstacle ahead of the player
   * @private
   */
  _spawnObstacle(playerZ) {
    // Determine obstacle type
    const isMoving = Math.random() < OBSTACLE_CONFIG.MOVING_OBSTACLE_CHANCE;
    const obstacleType = isMoving
      ? "moving"
      : randomChoice(["static", "barrel", "cone"]);

    // Get obstacle from pool
    const obstacle = this.pools[obstacleType].acquire();

    // Choose random spawn position in the world
    const spawnX = random(-80, 80);
    const spawnZ = playerZ - 80; // Spawn ahead of player

    // Set velocity for moving obstacles
    const velocityX = isMoving
      ? random(
          OBSTACLE_CONFIG.SPEED_RANGE.min,
          OBSTACLE_CONFIG.SPEED_RANGE.max
        ) * (Math.random() > 0.5 ? 1 : -1)
      : 0;

    // Activate obstacle
    obstacle.activate(spawnX, spawnZ, velocityX);
    this.obstacles.push(obstacle);
  }

  /**
   * Remove obstacle and return to pool
   * @private
   */
  _removeObstacle(index) {
    const obstacle = this.obstacles[index];
    obstacle.deactivate();

    // Return to appropriate pool
    this.pools[obstacle.type].release(obstacle);

    // Remove from active list
    this.obstacles.splice(index, 1);
  }

  /**
   * Increase difficulty by speeding up spawn rate
   * @param {number} difficultyLevel - Current difficulty level
   */
  scaleDifficulty(difficultyLevel) {
    const decrease = OBSTACLE_CONFIG.SPAWN_RATE_DECREASE * difficultyLevel;
    this.spawnRate = Math.max(
      OBSTACLE_CONFIG.MIN_SPAWN_RATE,
      OBSTACLE_CONFIG.INITIAL_SPAWN_RATE - decrease
    );
  }

  /**
   * Get all active obstacles (for collision detection)
   */
  getObstacles() {
    return this.obstacles.filter((obs) => obs.isActive);
  }

  /**
   * Clear all obstacles
   */
  clear() {
    this.obstacles.forEach((obstacle) => {
      obstacle.deactivate();
      this.pools[obstacle.type].release(obstacle);
    });
    this.obstacles = [];
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.clear();

    // Dispose all pools
    Object.values(this.pools).forEach((pool) => {
      [...pool.pool, ...pool.active].forEach((obstacle) => obstacle.dispose());
      pool.clear();
    });
  }
}
