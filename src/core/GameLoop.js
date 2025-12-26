/**
 * GameLoop - Main Update Loop
 * Responsibility: Coordinate frame updates across all game systems
 * Uses requestAnimationFrame for smooth 60fps gameplay
 */

import { GAME_CONFIG } from "../utils/constants.js";

export class GameLoop {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.accumulatedTime = 0;

    // Systems to update each frame (registered by main game)
    this.updateCallbacks = [];
    this.renderCallback = null;

    // Performance tracking
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateInterval = 1000; // ms
    this.lastFpsUpdate = 0;
  }

  /**
   * Register a system or object for updates
   * @param {Function} callback - Function to call each frame with deltaTime
   */
  registerUpdate(callback) {
    if (typeof callback !== "function") {
      console.error("Update callback must be a function");
      return;
    }
    this.updateCallbacks.push(callback);
  }

  /**
   * Register the render callback
   * @param {Function} callback - Render function to call each frame
   */
  registerRender(callback) {
    if (typeof callback !== "function") {
      console.error("Render callback must be a function");
      return;
    }
    this.renderCallback = callback;
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;

    this._loop();
  }

  /**
   * Pause the game loop
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume the game loop
   */
  resume() {
    if (!this.isRunning) return;

    this.isPaused = false;
    this.lastTime = performance.now(); // Reset to avoid large delta spike
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
  }

  /**
   * Main loop function
   * @private
   */
  _loop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Cap delta time to prevent large jumps (e.g., when tab is inactive)
    this.deltaTime = Math.min(this.deltaTime, 0.1);

    // Update FPS counter
    this._updateFPS(currentTime);

    // Only update game logic if not paused
    if (!this.isPaused) {
      this._update(this.deltaTime);
    }

    // Always render (even when paused)
    this._render();

    // Continue loop
    requestAnimationFrame(() => this._loop());
  }

  /**
   * Update all registered systems
   * @private
   */
  _update(deltaTime) {
    // Fixed timestep accumulator for physics stability
    this.accumulatedTime += deltaTime;

    const fixedDelta = GAME_CONFIG.PHYSICS_STEP;

    // Process physics in fixed steps
    while (this.accumulatedTime >= fixedDelta) {
      // Call all update callbacks
      for (const callback of this.updateCallbacks) {
        try {
          callback(fixedDelta);
        } catch (error) {
          console.error("Error in update callback:", error);
        }
      }

      this.accumulatedTime -= fixedDelta;
    }
  }

  /**
   * Render the current frame
   * @private
   */
  _render() {
    if (this.renderCallback) {
      try {
        this.renderCallback();
      } catch (error) {
        console.error("Error in render callback:", error);
      }
    }
  }

  /**
   * Update FPS counter
   * @private
   */
  _updateFPS(currentTime) {
    this.frameCount++;

    const elapsed = currentTime - this.lastFpsUpdate;
    if (elapsed >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
  }

  /**
   * Get current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Check if game is paused
   */
  getPaused() {
    return this.isPaused;
  }

  /**
   * Clear all callbacks (useful for scene transitions)
   */
  clearCallbacks() {
    this.updateCallbacks = [];
    this.renderCallback = null;
  }
}
