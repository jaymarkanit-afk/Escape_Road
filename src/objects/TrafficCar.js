/**
 * TrafficCar - AI-controlled civilian traffic
 * Responsibility: Create realistic traffic that follows roads
 * Adds life to the city environment
 */

import * as THREE from "three";
import { random, randomInt } from "../utils/helpers.js";

export class TrafficCar {
  constructor(scene, startPosition, lane = 0) {
    this.scene = scene;
    this.position = { ...startPosition };
    this.lane = lane; // 0 = forward, 1 = backward, 2 = left, 3 = right
    this.speed = random(8, 15);
    this.rotation = 0;
    this.mesh = null;
    this.isActive = true;
    // Collision and reverse state
    this.isColliding = false;
    this.collisionReverseTimer = 0;
    this.collisionReverseDirection = { x: 0, z: 0 };
    this.originalSpeed = this.speed;
    this.originalDirection = { x: 0, z: 0 };

    this._setLaneDirection();
    this._createMesh();
  }

  /**
   * Set movement direction based on lane
   * @private
   */
  _setLaneDirection() {
    switch (this.lane) {
      case 0: // Forward (negative Z)
        this.rotation = Math.PI;
        this.direction = { x: 0, z: -1 };
        break;
      case 1: // Backward (positive Z)
        this.rotation = 0;
        this.direction = { x: 0, z: 1 };
        break;
      case 2: // Left (negative X)
        this.rotation = Math.PI / 2;
        this.direction = { x: -1, z: 0 };
        break;
      case 3: // Right (positive X)
        this.rotation = -Math.PI / 2;
        this.direction = { x: 1, z: 0 };
        break;
    }
    this.originalDirection = { ...this.direction };
  }

  /**
   * Create traffic car mesh
   * @private
   */
  _createMesh() {
    const carColors = [
      0x3366cc, 0xff6600, 0x00cc66, 0xffff00, 0xcc33cc, 0x999999,
    ];
    const color = carColors[randomInt(0, carColors.length - 1)];

    const group = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(1.8, 1, 3.2);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: color,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Car cabin
    const cabinGeometry = new THREE.BoxGeometry(1.6, 0.7, 1.8);
    const cabinMaterial = new THREE.MeshLambertMaterial({
      color: 0x222222,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = 1.2;
    cabin.position.z = -0.3;
    cabin.castShadow = true;
    group.add(cabin);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({
      color: 0x111111,
    });

    const wheelPositions = [
      [-1, 0.35, 1.2],
      [1, 0.35, 1.2],
      [-1, 0.35, -1.2],
      [1, 0.35, -1.2],
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      group.add(wheel);
    });

    // Headlights
    const lightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffcc,
    });

    const light1 = new THREE.Mesh(lightGeometry, lightMaterial);
    light1.position.set(-0.6, 0.5, 1.65);
    group.add(light1);

    const light2 = new THREE.Mesh(lightGeometry, lightMaterial);
    light2.position.set(0.6, 0.5, 1.65);
    group.add(light2);

    group.position.set(this.position.x, 0.5, this.position.z);
    group.rotation.y = this.rotation;
    this.scene.add(group);
    this.mesh = group;
  }

  /**
   * Update traffic car movement
   */
  update(deltaTime, cityRef = null) {
    if (!this.isActive) return;

    // Handle collision reverse behavior
    if (this.isColliding && this.collisionReverseTimer > 0) {
      // Apply reverse movement
      this.direction.x = this.collisionReverseDirection.x;
      this.direction.z = this.collisionReverseDirection.z;
      this.speed = 6; // Reverse speed

      // Decrement timer
      this.collisionReverseTimer -= deltaTime;

      // Clear collision state when timer expires
      if (this.collisionReverseTimer <= 0) {
        this.isColliding = false;
        this.direction = { ...this.originalDirection };
        this.speed = this.originalSpeed;
      }
    }

    // Move in lane direction
    this.position.x += this.direction.x * this.speed * deltaTime;
    this.position.z += this.direction.z * this.speed * deltaTime;

    // Check for building collisions and avoid them
    if (cityRef) {
      this._checkBuildingCollision(cityRef);
    }

    // Update mesh position
    if (this.mesh) {
      this.mesh.position.set(this.position.x, 0.5, this.position.z);
    }

    // Check if car is too far from origin (despawn)
    const distanceFromOrigin = Math.sqrt(
      this.position.x ** 2 + this.position.z ** 2
    );
    if (distanceFromOrigin > 150) {
      this.isActive = false;
    }
  }

  /**
   * Check and handle collision with buildings
   * @private
   */
  _checkBuildingCollision(cityRef) {
    const carBox = this.getBoundingBox();
    const buildings = cityRef.getBuildings();

    for (const building of buildings) {
      const halfWidth = building.geometry.parameters.width / 2 + 1;
      const halfDepth = building.geometry.parameters.depth / 2 + 1;

      const buildingBox = {
        min: {
          x: building.position.x - halfWidth,
          y: 0,
          z: building.position.z - halfDepth,
        },
        max: {
          x: building.position.x + halfWidth,
          y: building.geometry.parameters.height,
          z: building.position.z + halfDepth,
        },
      };

      // Check AABB collision
      if (
        carBox.min.x < buildingBox.max.x &&
        carBox.max.x > buildingBox.min.x &&
        carBox.min.z < buildingBox.max.z &&
        carBox.max.z > buildingBox.min.z
      ) {
        // Collision detected - push car out
        const carCenter = {
          x: this.position.x,
          z: this.position.z,
        };
        const buildingCenter = {
          x: (buildingBox.min.x + buildingBox.max.x) / 2,
          z: (buildingBox.min.z + buildingBox.max.z) / 2,
        };

        // Calculate push direction
        const dx = carCenter.x - buildingCenter.x;
        const dz = carCenter.z - buildingCenter.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 0) {
          // Normalize push direction
          const normalizedDx = dx / distance;
          const normalizedDz = dz / distance;

          // Push car away from building
          const pushDistance = 2;
          this.position.x = buildingCenter.x + normalizedDx * pushDistance;
          this.position.z = buildingCenter.z + normalizedDz * pushDistance;

          // Stop and reverse like player car
          this.isColliding = true;
          this.collisionReverseTimer = 0.2; // 200ms reverse
          this.collisionReverseDirection = {
            x: normalizedDx,
            z: normalizedDz,
          };
        }
      }
    }
  }

  /**
   * Get bounding box for collision detection
   */
  getBoundingBox() {
    return {
      min: {
        x: this.position.x - 0.9,
        y: 0,
        z: this.position.z - 1.6,
      },
      max: {
        x: this.position.x + 0.9,
        y: 1.5,
        z: this.position.z + 1.6,
      },
    };
  }

  /**
   * Get current position
   */
  getPosition() {
    return { ...this.position };
  }

  /**
   * Check if car is active
   */
  isActiveVehicle() {
    return this.isActive;
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
    this.isActive = false;
  }
}

/**
 * TrafficManager - Manages all traffic cars
 */
export class TrafficManager {
  constructor(scene, cityRef = null) {
    this.scene = scene;
    this.cityRef = cityRef; // Reference to city for building collision
    this.trafficCars = [];
    this.spawnTimer = 0;
    this.spawnInterval = 3; // Spawn every 3 seconds
  }

  /**
   * Update traffic system
   */
  update(deltaTime) {
    this.spawnTimer += deltaTime;

    // Spawn new traffic cars periodically
    if (this.spawnTimer >= this.spawnInterval) {
      this._spawnTrafficCar();
      this.spawnTimer = 0;
    }

    // Update existing traffic cars and check building collisions
    this.trafficCars.forEach((car) => {
      car.update(deltaTime, this.cityRef);
    });

    // Remove inactive cars
    this.trafficCars = this.trafficCars.filter((car) => {
      if (!car.isActiveVehicle()) {
        car.dispose();
        return false;
      }
      return true;
    });
  }

  /**
   * Spawn a new traffic car on a random road
   * @private
   */
  _spawnTrafficCar() {
    // Limit number of traffic cars
    if (this.trafficCars.length >= 20) return;

    // Choose random lane and section
    const lane = randomInt(0, 3);
    const section = randomInt(0, 2); // 0=near, 1=mid, 2=far

    // Calculate spawn position based on lane and section
    let spawnPosition;

    switch (lane) {
      case 0: // Forward lane (travels south, spawns north)
        spawnPosition = {
          x: random(-60, 60), // Anywhere along the horizontal road
          y: 0,
          z: random(80, 100), // Spawn far north
        };
        break;
      case 1: // Backward lane (travels north, spawns south)
        spawnPosition = {
          x: random(-60, 60),
          y: 0,
          z: random(-80, -100), // Spawn far south
        };
        break;
      case 2: // Left lane (travels west, spawns east)
        spawnPosition = {
          x: random(-80, -100), // Spawn far west
          y: 0,
          z: random(-60, 60), // Anywhere along the vertical road
        };
        break;
      case 3: // Right lane (travels east, spawns west)
        spawnPosition = {
          x: random(80, 100), // Spawn far east
          y: 0,
          z: random(-60, 60),
        };
        break;
    }

    const car = new TrafficCar(this.scene, spawnPosition, lane);
    this.trafficCars.push(car);
  }

  /**
   * Get all active traffic cars
   */
  getTrafficCars() {
    return this.trafficCars.filter((car) => car.isActiveVehicle());
  }

  /**
   * Cleanup all traffic
   */
  dispose() {
    this.trafficCars.forEach((car) => car.dispose());
    this.trafficCars = [];
  }
}
