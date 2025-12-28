/**
 * WantedSystem - GTA-style wanted level system
 * Responsibility: Manage wanted level (stars) and dynamic police spawning
 * More stars = more aggressive police pursuit
 */

import { EnemyChaser } from "../objects/EnemyChaser.js";

export class WantedSystem {
  constructor(scene, playerRef, enemiesArrayRef, wantedConfig, cityRef = null) {
    this.scene = scene;
    this.playerRef = playerRef;
    this.enemiesArrayRef = enemiesArrayRef; // Reference to main enemies array
    this.config = wantedConfig;
    this.cityRef = cityRef; // Reference to city for building collision

    // Wanted level state
    this.currentWantedLevel = 1; // Start at 1 star
    this.survivalTime = 0;
    this.lastSpawnTime = 0;

    // Track spawned police for cleanup
    this.spawnedPolice = [];
  }

  /**
   * Update wanted level based on survival time
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    this.survivalTime += deltaTime;

    // Update wanted level based on survival time
    this._updateWantedLevel();

    // Spawn police based on wanted level
    this._spawnPoliceForWantedLevel(deltaTime);
  }

  /**
   * Calculate wanted level based on survival time
   * @private
   */
  _updateWantedLevel() {
    const thresholds = this.config.WANTED_THRESHOLDS;
    let newLevel = 1;

    // Determine wanted level based on survival time
    for (let i = 0; i < thresholds.length; i++) {
      if (this.survivalTime >= thresholds[i]) {
        newLevel = i + 1;
      }
    }

    // Cap at max stars
    newLevel = Math.min(newLevel, this.config.MAX_WANTED_LEVEL);

    // If level increased, trigger event
    if (newLevel > this.currentWantedLevel) {
      this.currentWantedLevel = newLevel;
      console.log(`⭐ Wanted level increased to ${newLevel} stars!`);
    }
  }

  /**
   * Spawn police based on current wanted level
   * @private
   */
  _spawnPoliceForWantedLevel(deltaTime) {
    this.lastSpawnTime += deltaTime;

    // Get spawn interval for current wanted level
    const spawnInterval = this._getSpawnInterval();

    // Check if it's time to spawn new police
    if (this.lastSpawnTime >= spawnInterval) {
      // Spawn multiple police at higher wanted levels
      const spawnCount = Math.min(this.currentWantedLevel, 3); // Spawn 1-3 at once
      for (let i = 0; i < spawnCount; i++) {
        this._spawnPolice();
      }
      this.lastSpawnTime = 0;
    }
  }

  /**
   * Get spawn interval based on wanted level
   * Higher wanted level = more frequent spawns
   * @private
   */
  _getSpawnInterval() {
    // Base interval decreases with wanted level
    const baseInterval = this.config.BASE_SPAWN_INTERVAL;
    const intervalReduction =
      (this.currentWantedLevel - 1) * this.config.SPAWN_INTERVAL_REDUCTION;
    return Math.max(
      baseInterval - intervalReduction,
      this.config.MIN_SPAWN_INTERVAL
    );
  }

  /**
   * Spawn a police car
   * @private
   */
  _spawnPolice() {
    // Check if we're at max police count
    const maxPolice = this._getMaxPoliceCount();
    if (this.enemiesArrayRef.length >= maxPolice) {
      return; // Don't spawn if at max
    }

    // Calculate spawn position - different strategies based on wanted level
    const playerPos = this.playerRef.getPosition();
    let spawnPos;

    // At higher wanted levels, spawn from multiple directions
    if (this.currentWantedLevel >= 3) {
      // Spawn from all sides (behind, sides, front)
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 30;
      spawnPos = {
        x: playerPos.x + Math.cos(angle) * distance,
        z: playerPos.z + Math.sin(angle) * distance,
      };
    } else {
      // Lower levels: spawn behind player
      const spawnDistance = 40 + Math.random() * 20;
      const lateralOffset = (Math.random() - 0.5) * 60;
      spawnPos = {
        x: playerPos.x + lateralOffset,
        z: playerPos.z + spawnDistance,
      };
    }

    // Create new police car
    const newPolice = new EnemyChaser(
      this.scene,
      this.playerRef,
      spawnPos,
      this.cityRef,
      this.enemiesArrayRef
    );

    // Add to main enemies array
    this.enemiesArrayRef.push(newPolice);
    this.spawnedPolice.push(newPolice);

    console.log(
      `🚔 Spawned police car at (${spawnPos.x.toFixed(1)}, ${spawnPos.z.toFixed(
        1
      )})`
    );
  }

  /**
   * Get maximum police count for current wanted level
   * @private
   */
  _getMaxPoliceCount() {
    // Base count + additional police per star
    return (
      this.config.BASE_POLICE_COUNT +
      (this.currentWantedLevel - 1) * this.config.POLICE_PER_STAR
    );
  }

  /**
   * Get current wanted level (number of stars)
   */
  getWantedLevel() {
    return this.currentWantedLevel;
  }

  /**
   * Get survival time in seconds
   */
  getSurvivalTime() {
    return this.survivalTime;
  }

  /**
   * Set wanted level manually (for testing or special events)
   */
  setWantedLevel(level) {
    this.currentWantedLevel = Math.max(
      1,
      Math.min(level, this.config.MAX_WANTED_LEVEL)
    );
    console.log(`⭐ Wanted level set to ${this.currentWantedLevel} stars`);
  }

  /**
   * Reset wanted system (for new game)
   */
  reset() {
    this.currentWantedLevel = 1;
    this.survivalTime = 0;
    this.lastSpawnTime = 0;
    this.spawnedPolice = [];
  }

  /**
   * Cleanup spawned police
   */
  dispose() {
    // Note: Police are managed by main game, just clear references
    this.spawnedPolice = [];
  }
}
