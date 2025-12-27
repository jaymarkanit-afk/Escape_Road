/**
 * CameraController - Isometric camera for free-roaming game
 * Responsibility: Fixed isometric angle that follows the player
 * Provides top-down city view
 */

import { GAME_CONFIG } from "../utils/constants.js";
import { lerp } from "../utils/helpers.js";

export class CameraController {
  constructor(camera, playerRef) {
    this.camera = camera;
    this.playerRef = playerRef;

    // Isometric camera settings
    this.offset = { ...GAME_CONFIG.CAMERA_OFFSET };
    this.smoothing = GAME_CONFIG.CAMERA_FOLLOW_SMOOTHING;

    // Target position
    this.targetPosition = { x: 0, y: 0, z: 0 };
  }

  /**
   * Update camera position to follow player (isometric view)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    const playerPos = this.playerRef.getPosition();
    const playerSpeed = this.playerRef.getSpeed();

    // Adjust camera offset based on movement direction
    let cameraOffset = { ...this.offset };

    // If player is moving backward (negative speed), flip camera offset
    if (playerSpeed < 0) {
      cameraOffset.z = -this.offset.z; // Move camera to front when reversing
    }

    // Calculate target camera position (isometric - behind and above)
    this.targetPosition.x = playerPos.x + cameraOffset.x;
    this.targetPosition.y = cameraOffset.y;
    this.targetPosition.z = playerPos.z + cameraOffset.z;

    // Smoothly interpolate camera position
    this.camera.position.x = lerp(
      this.camera.position.x,
      this.targetPosition.x,
      this.smoothing
    );
    this.camera.position.y = lerp(
      this.camera.position.y,
      this.targetPosition.y,
      this.smoothing
    );
    this.camera.position.z = lerp(
      this.camera.position.z,
      this.targetPosition.z,
      this.smoothing
    );

    // Look at player position
    this.camera.lookAt(playerPos.x, 0, playerPos.z);
  }

  /**
   * Reset camera to initial position
   */
  reset() {
    const playerPos = this.playerRef.getPosition();

    this.camera.position.set(
      playerPos.x + this.offset.x,
      this.offset.y,
      playerPos.z + this.offset.z
    );

    this.camera.lookAt(playerPos.x, 0, playerPos.z);
  }
}
