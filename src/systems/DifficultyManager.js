/**
 * DifficultyManager - Manages progressive difficulty scaling
 * Responsibility: Increase game difficulty over time across all systems
 * Coordinates difficulty changes across enemy, spawner, and other systems
 */

import { DIFFICULTY_CONFIG } from "../utils/constants.js";

export class DifficultyManager {
  constructor(enemiesRef, obstacleSpawnerRef) {
    this.enemiesRef = enemiesRef; // Array of enemies
    this.obstacleSpawnerRef = obstacleSpawnerRef;

    // Current difficulty state
    this.currentLevel = 1;
    this.difficultyMultiplier = 1.0;

    // Time tracking
    this.gameTime = 0;
    this.timeUntilNextIncrease = DIFFICULTY_CONFIG.INCREASE_INTERVAL;

    // Callbacks for difficulty events
    this.onDifficultyIncrease = null;
  }

  /**
   * Update difficulty based on game time
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    this.gameTime += deltaTime;
    this.timeUntilNextIncrease -= deltaTime * 1000; // Convert to ms

    // Check if it's time to increase difficulty
    if (this.timeUntilNextIncrease <= 0) {
      this._increaseDifficulty();
      this.timeUntilNextIncrease = DIFFICULTY_CONFIG.INCREASE_INTERVAL;
    }
  }

  /**
   * Increase difficulty level and apply changes
   * @private
   */
  _increaseDifficulty() {
    this.currentLevel++;
    this.difficultyMultiplier = 1 + (this.currentLevel - 1) * 0.2;

    // Apply difficulty to all enemies
    this.enemiesRef.forEach((enemy) => {
      enemy.scaleDifficulty(this.difficultyMultiplier);
    });

    // Apply difficulty to obstacle spawner
    this.obstacleSpawnerRef.scaleDifficulty(this.currentLevel);

    // Trigger callback if set
    if (this.onDifficultyIncrease) {
      this.onDifficultyIncrease(this.currentLevel, this.difficultyMultiplier);
    }

    console.log(`Difficulty increased to level ${this.currentLevel}`);
  }

  /**
   * Get current difficulty level
   */
  getDifficultyLevel() {
    return this.currentLevel;
  }

  /**
   * Get difficulty multiplier
   */
  getDifficultyMultiplier() {
    return this.difficultyMultiplier;
  }

  /**
   * Get time until next difficulty increase (in seconds)
   */
  getTimeUntilNextIncrease() {
    return this.timeUntilNextIncrease / 1000;
  }

  /**
   * Register callback for difficulty increase events
   * @param {Function} callback
   */
  setOnDifficultyIncrease(callback) {
    this.onDifficultyIncrease = callback;
  }

  /**
   * Reset difficulty (for new game)
   */
  reset() {
    this.currentLevel = 1;
    this.difficultyMultiplier = 1.0;
    this.gameTime = 0;
    this.timeUntilNextIncrease = DIFFICULTY_CONFIG.INCREASE_INTERVAL;
  }
}
