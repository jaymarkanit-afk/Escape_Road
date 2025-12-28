/**
 * ScoreSystem - Manages scoring and survival tracking
 * Responsibility: Calculate score from distance, time, and bonuses
 * Provides score queries for HUD display
 */

import { SCORING_CONFIG } from "../utils/constants.js";

export class ScoreSystem {
  constructor(playerRef) {
    this.playerRef = playerRef;

    // Score components
    this.distanceScore = 0;
    this.survivalScore = 0;
    this.bonusScore = 0;

    // Time tracking
    this.survivalTime = 0; // seconds

    // Last recorded distance (to calculate delta)
    this.lastDistance = 0;
  }

  /**
   * Update score based on player progress
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Update survival time
    this.survivalTime += deltaTime;
    this.survivalScore = Math.floor(
      this.survivalTime * SCORING_CONFIG.SURVIVAL_BONUS
    );

    // Update distance score
    const currentDistance = this.playerRef.distanceTraveled;
    const distanceDelta = currentDistance - this.lastDistance;
    this.distanceScore += Math.floor(
      distanceDelta * SCORING_CONFIG.DISTANCE_MULTIPLIER
    );
    this.lastDistance = currentDistance;
  }

  /**
   * Get total score
   */
  getTotalScore() {
    return this.distanceScore + this.survivalScore + this.bonusScore;
  }

  /**
   * Get distance score component
   */
  getDistanceScore() {
    return this.distanceScore;
  }

  /**
   * Get survival time in seconds
   */
  getSurvivalTime() {
    return this.survivalTime;
  }

  /**
   * Get survival score component
   */
  getSurvivalScore() {
    return this.survivalScore;
  }

  /**
   * Get bonus score component
   */
  getBonusScore() {
    return this.bonusScore;
  }

  /**
   * Get statistics object
   */
  getStatistics() {
    return {
      totalScore: this.getTotalScore(),
      survivalTime: this.survivalTime,
      distance: this.playerRef.distanceTraveled,
    };
  }

  /**
   * Reset score (for new game)
   */
  reset() {
    this.distanceScore = 0;
    this.survivalScore = 0;
    this.bonusScore = 0;
    this.survivalTime = 0;
    this.lastDistance = 0;
  }
}
