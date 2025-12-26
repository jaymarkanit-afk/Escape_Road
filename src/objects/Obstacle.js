/**
 * Obstacle - Dynamic obstacle entity
 * Responsibility: Represent obstacles on the road with various behaviors
 * Supports static and moving obstacles
 */

import * as THREE from "three";
import { OBSTACLE_CONFIG, COLORS } from "../utils/constants.js";

export class Obstacle {
  constructor(scene, type = "static") {
    this.scene = scene;
    this.type = type;

    // Physics state
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, z: 0 };

    // Lifecycle
    this.isActive = false;
    this.markedForRemoval = false;

    // Dimensions
    this.width = 1.5;
    this.height = 1.5;
    this.depth = 1.5;

    // Three.js mesh
    this.mesh = null;
    this._createMesh();
  }

  /**
   * Create the visual representation based on type
   * @private
   */
  _createMesh() {
    let geometry, material;

    switch (this.type) {
      case OBSTACLE_CONFIG.TYPES.BARREL:
        geometry = new THREE.CylinderGeometry(0.6, 0.7, 1.5, 8);
        material = new THREE.MeshLambertMaterial({
          color: COLORS.OBSTACLE,
        });
        this.height = 1.5;
        break;

      case OBSTACLE_CONFIG.TYPES.TRAFFIC_CONE:
        geometry = new THREE.ConeGeometry(0.5, 1.2, 6);
        material = new THREE.MeshLambertMaterial({
          color: 0xff6600,
        });
        this.height = 1.2;
        break;

      case OBSTACLE_CONFIG.TYPES.MOVING:
        geometry = new THREE.BoxGeometry(1.8, 1.5, 3);
        material = new THREE.MeshLambertMaterial({
          color: 0x888888,
        });
        this.width = 1.8;
        this.height = 1.5;
        this.depth = 3;
        break;

      default: // STATIC
        geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        material = new THREE.MeshLambertMaterial({
          color: COLORS.OBSTACLE,
        });
        break;
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Initially hidden
    this.mesh.visible = false;
  }

  /**
   * Activate obstacle at a position
   * @param {number} x - X position
   * @param {number} z - Z position
   * @param {number} velocityX - Optional horizontal velocity for moving obstacles
   */
  activate(x, z, velocityX = 0) {
    this.position.x = x;
    this.position.z = z;
    this.position.y = this.height / 2;

    this.velocity.x = velocityX;
    this.velocity.z = 0;

    this.isActive = true;
    this.markedForRemoval = false;

    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.visible = true;

    if (!this.mesh.parent) {
      this.scene.add(this.mesh);
    }
  }

  /**
   * Update obstacle state
   * @param {number} deltaTime - Time since last frame
   * @param {number} playerZ - Player's Z position for culling
   */
  update(deltaTime, playerZ) {
    if (!this.isActive) return;

    // Update position for moving obstacles
    if (this.type === OBSTACLE_CONFIG.TYPES.MOVING) {
      this.position.x += this.velocity.x * deltaTime;

      // Bounce off road edges
      const roadHalfWidth = 8;
      if (Math.abs(this.position.x) > roadHalfWidth) {
        this.velocity.x *= -1;
      }
    }

    // Update mesh position
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;

    // Rotate for visual interest
    this.mesh.rotation.y += deltaTime * 0.5;

    // Mark for removal if far behind player
    if (this.position.z > playerZ + 20) {
      this.markedForRemoval = true;
    }
  }

  /**
   * Deactivate obstacle (return to pool)
   */
  deactivate() {
    this.isActive = false;
    this.mesh.visible = false;
    this.markedForRemoval = false;
  }

  /**
   * Get bounding box for collision detection
   */
  getBoundingBox() {
    return {
      min: {
        x: this.position.x - this.width / 2,
        y: 0,
        z: this.position.z - this.depth / 2,
      },
      max: {
        x: this.position.x + this.width / 2,
        y: this.height,
        z: this.position.z + this.depth / 2,
      },
    };
  }

  /**
   * Check if obstacle should be removed
   */
  shouldRemove() {
    return this.markedForRemoval;
  }

  /**
   * Get position
   */
  getPosition() {
    return { ...this.position };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) this.mesh.material.dispose();
    }
  }
}
