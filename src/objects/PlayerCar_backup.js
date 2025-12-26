/**
 * PlayerCar - Player-controlled vehicle
 * Responsibility: Handle player movement, physics, boost mechanic, and visual representation
 * Encapsulates all player-specific behavior and state
 */

import * as THREE from "three";
import { PLAYER_CONFIG, COLORS } from "../utils/constants.js";
import { clamp } from "../utils/helpers.js";

export class PlayerCar {
  constructor(scene) {
    this.scene = scene;

    // Physics state
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, z: 0 };
    this.speed = 0;
    this.steering = 0;

    // Health system
    this.health = PLAYER_CONFIG.MAX_HEALTH;
    this.isAlive = true;

    // Boost system
    this.boostActive = false;
    this.boostCooldownRemaining = 0;
    this.boostTimeRemaining = 0;

    // Input state (set by InputManager)
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      boost: false,
    };

    // Distance traveled (for scoring)
    this.distanceTraveled = 0;

    // Three.js mesh
    this.mesh = null;
    this._createMesh();
  }

  /**
   * Create the visual representation of the car
   * @private
   */
  _createMesh() {
    // Main car body
    const bodyGeometry = new THREE.BoxGeometry(
      PLAYER_CONFIG.WIDTH,
      PLAYER_CONFIG.HEIGHT,
      PLAYER_CONFIG.LENGTH
    );
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.PLAYER_CAR,
      metalness: 0.6,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;

    // Car cabin (roof)
    const cabinGeometry = new THREE.BoxGeometry(
      PLAYER_CONFIG.WIDTH * 0.8,
      PLAYER_CONFIG.HEIGHT * 0.6,
      PLAYER_CONFIG.LENGTH * 0.5
    );
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0x880000,
      metalness: 0.4,
      roughness: 0.6,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = PLAYER_CONFIG.HEIGHT * 0.7;
    cabin.position.z = -0.3;
    cabin.castShadow = true;

    // Create group to hold all parts
    this.mesh = new THREE.Group();
    this.mesh.add(body);
    this.mesh.add(cabin);

    // Position car
    this.mesh.position.set(
      this.position.x,
      PLAYER_CONFIG.HEIGHT / 2,
      this.position.z
    );

    this.scene.add(this.mesh);
  }

  /**
   * Update player physics and state
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    if (!this.isAlive) return;

    // Update boost timers
    this._updateBoost(deltaTime);

    // Apply input to physics
    this._applyInput(deltaTime);

    // Update position
    this._updatePosition(deltaTime);

    // Update mesh to match physics
    this._updateMesh();

    // Track distance
    this.distanceTraveled += Math.abs(this.velocity.z * deltaTime);
  }

  /**
   * Apply player input to physics
   * @private
   */
  _applyInput(deltaTime) {
    const config = PLAYER_CONFIG;

    // Determine max speed (with boost)
    const maxSpeed = this.boostActive
      ? config.MAX_SPEED * config.BOOST_MULTIPLIER
      : config.MAX_SPEED;

    // Forward/backward acceleration
    if (this.input.forward) {
      this.speed += config.ACCELERATION * deltaTime * 60;
    } else if (this.input.backward) {
      this.speed -= config.DECELERATION * deltaTime * 60;
    } else {
      // Natural deceleration when no input
      this.speed *= 1 - config.DECELERATION * deltaTime;
    }

    // Clamp speed
    this.speed = clamp(this.speed, 0, maxSpeed);

    // Steering
    if (this.input.left) {
      this.steering = Math.max(
        this.steering - config.STEERING_SPEED,
        -config.MAX_STEERING
      );
    } else if (this.input.right) {
      this.steering = Math.min(
        this.steering + config.STEERING_SPEED,
        config.MAX_STEERING
      );
    } else {
      // Return to center
      this.steering *= 0.9;
    }

    // Apply steering to velocity
    this.velocity.x = this.steering * this.speed;
    this.velocity.z = -this.speed; // Negative Z is forward
  }

  /**
   * Update position based on velocity
   * @private
   */
  _updatePosition(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Keep player within road bounds (handled by collision system later)
    // For now, simple clamping
    const maxX = 8; // Rough road width
    this.position.x = clamp(this.position.x, -maxX, maxX);
  }

  /**
   * Update Three.js mesh position and rotation
   * @private
   */
  _updateMesh() {
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;

    // Rotate car based on steering
    this.mesh.rotation.y = this.steering * 0.5;
  }

  /**
   * Update boost state
   * @private
   */
  _updateBoost(deltaTime) {
    // Update cooldown
    if (this.boostCooldownRemaining > 0) {
      this.boostCooldownRemaining -= deltaTime * 1000;
    }

    // Activate boost
    if (
      this.input.boost &&
      this.boostCooldownRemaining <= 0 &&
      !this.boostActive
    ) {
      this.activateBoost();
    }

    // Update active boost
    if (this.boostActive) {
      this.boostTimeRemaining -= deltaTime * 1000;
      if (this.boostTimeRemaining <= 0) {
        this.deactivateBoost();
      }
    }
  }

  /**
   * Activate boost ability
   */
  activateBoost() {
    this.boostActive = true;
    this.boostTimeRemaining = PLAYER_CONFIG.BOOST_DURATION;

    // Visual feedback: change color
    this.mesh.children[0].material.emissive = new THREE.Color(0xff6600);
    this.mesh.children[0].material.emissiveIntensity = 0.5;
  }

  /**
   * Deactivate boost and start cooldown
   */
  deactivateBoost() {
    this.boostActive = false;
    this.boostCooldownRemaining = PLAYER_CONFIG.BOOST_COOLDOWN;

    // Reset visual
    this.mesh.children[0].material.emissive = new THREE.Color(0x000000);
    this.mesh.children[0].material.emissiveIntensity = 0;
  }

  /**
   * Take damage from collision
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Handle player death
   */
  die() {
    this.isAlive = false;
    this.speed = 0;

    // Visual feedback: tilt and fade
    // TODO: Add death animation
  }

  /**
   * Get bounding box for collision detection
   */
  getBoundingBox() {
    return {
      min: {
        x: this.position.x - PLAYER_CONFIG.WIDTH / 2,
        y: 0,
        z: this.position.z - PLAYER_CONFIG.LENGTH / 2,
      },
      max: {
        x: this.position.x + PLAYER_CONFIG.WIDTH / 2,
        y: PLAYER_CONFIG.HEIGHT,
        z: this.position.z + PLAYER_CONFIG.LENGTH / 2,
      },
    };
  }

  /**
   * Set input state (called by InputManager)
   */
  setInput(input) {
    this.input = { ...input };
  }

  /**
   * Get current position
   */
  getPosition() {
    return { ...this.position };
  }

  /**
   * Get current speed
   */
  getSpeed() {
    return this.speed;
  }

  /**
   * Get health percentage
   */
  getHealthPercent() {
    return (this.health / PLAYER_CONFIG.MAX_HEALTH) * 100;
  }

  /**
   * Check if boost is available
   */
  canBoost() {
    return this.boostCooldownRemaining <= 0;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }
}

