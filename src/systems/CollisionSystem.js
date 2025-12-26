/**
 * CollisionSystem - Handles collision detection and response
 * Responsibility: Detect collisions between player, obstacles, and enemy
 * Uses AABB (Axis-Aligned Bounding Box) collision detection
 */

import { checkAABBCollision, distance2D } from "../utils/helpers.js";
import { PLAYER_CONFIG, SCORING_CONFIG } from "../utils/constants.js";

export class CollisionSystem {
  constructor(
    playerRef,
    enemiesRef,
    obstacleSpawnerRef,
    cityRef = null,
    effectsSystem = null,
    soundSystem = null,
    trafficManagerRef = null
  ) {
    this.playerRef = playerRef;
    this.enemiesRef = enemiesRef; // Array of enemies
    this.obstacleSpawnerRef = obstacleSpawnerRef;
    this.cityRef = cityRef;
    this.effectsSystem = effectsSystem;
    this.soundSystem = soundSystem;
    this.trafficManagerRef = trafficManagerRef;

    // Collision cooldown to prevent multiple hits
    this.collisionCooldown = 0;
    this.cooldownDuration = 300; // ms

    // Callbacks for collision events
    this.onPlayerHitObstacle = null;
    this.onPlayerHitEnemy = null;
    this.onNearMiss = null;
  }

  /**
   * Update collision detection
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Update cooldown
    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= deltaTime * 1000;
    }

    // Check player vs obstacles
    this._checkPlayerObstacleCollisions();

    // Check player vs enemy
    this._checkPlayerEnemyCollision();

    // Check player vs traffic cars
    if (this.trafficManagerRef) {
      this._checkPlayerTrafficCollisions();
    }

    // Check player vs buildings
    if (this.cityRef) {
      this._checkPlayerBuildingCollisions();
      this._checkPlayerCityObstacleCollisions();
      this._checkHazards();
    }

    // Check near misses for bonus points
    this._checkNearMisses();
  }

  /**
   * Check collisions between player and obstacles
   * @private
   */
  _checkPlayerObstacleCollisions() {
    if (this.collisionCooldown > 0) return;

    const playerBox = this.playerRef.getBoundingBox();
    const obstacles = this.obstacleSpawnerRef.getObstacles();

    for (const obstacle of obstacles) {
      const obstacleBox = obstacle.getBoundingBox();

      if (checkAABBCollision(playerBox, obstacleBox)) {
        this._handlePlayerObstacleCollision(obstacle);
        break; // One collision per frame
      }
    }
  }

  _handlePlayerObstacleCollision(obstacle) {
    const playerPos = this.playerRef.getPosition();
    const obstaclePos = obstacle.getPosition();
    const collisionPos = {
      x: (playerPos.x + obstaclePos.x) / 2,
      y: 1,
      z: (playerPos.z + obstaclePos.z) / 2,
    };

    this.playerRef.takeDamage(PLAYER_CONFIG.COLLISION_DAMAGE);
    this.collisionCooldown = this.cooldownDuration;

    if (this.effectsSystem) {
      this.effectsSystem.createCollisionEffect(collisionPos, 0.8);
      this.effectsSystem.createSparks?.(collisionPos, {
        x: playerPos.x - obstaclePos.x,
        z: playerPos.z - obstaclePos.z,
      });
      this.effectsSystem.createDamageIndicator?.(
        collisionPos,
        PLAYER_CONFIG.COLLISION_DAMAGE
      );
    }

    if (this.soundSystem) {
      this.soundSystem.playCollisionSound(0.7);
    }

    const pushDirection = {
      x: playerPos.x - obstaclePos.x,
      z: playerPos.z - obstaclePos.z,
    };
    const pushMagnitude = Math.sqrt(
      pushDirection.x ** 2 + pushDirection.z ** 2
    );
    if (pushMagnitude > 0) {
      this.playerRef.velocity.x += (pushDirection.x / pushMagnitude) * 5;
      this.playerRef.velocity.z += (pushDirection.z / pushMagnitude) * 5;
    }

    obstacle.markedForRemoval = true;

    if (this.onPlayerHitObstacle) {
      this.onPlayerHitObstacle();
    }
  }

  /**
   * Check collision between player and buildings
   * @private
   */
  _checkPlayerBuildingCollisions() {
    if (this.collisionCooldown > 0) return;

    const playerBox = this.playerRef.getBoundingBox();
    const buildings = this.cityRef.getBuildings();

    for (const building of buildings) {
      const halfWidth = building.geometry.parameters.width / 2;
      const halfDepth = building.geometry.parameters.depth / 2;

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

      if (checkAABBCollision(playerBox, buildingBox)) {
        this._handlePlayerBuildingCollision(building, buildingBox);
        break;
      }
    }
  }

  /**
   * Handle player hitting a building
   * @private
   */
  _handlePlayerBuildingCollision(building, buildingBox) {
    const playerPos = this.playerRef.getPosition();

    // Calculate collision normal (push direction)
    const buildingCenter = {
      x: (buildingBox.min.x + buildingBox.max.x) / 2,
      z: (buildingBox.min.z + buildingBox.max.z) / 2,
    };

    const dx = playerPos.x - buildingCenter.x;
    const dz = playerPos.z - buildingCenter.z;

    // Determine which face was hit
    const buildingWidth = buildingBox.max.x - buildingBox.min.x;
    const buildingDepth = buildingBox.max.z - buildingBox.min.z;

    const normalizedDx = dx / buildingWidth;
    const normalizedDz = dz / buildingDepth;

    // Push player out of building
    if (Math.abs(normalizedDx) > Math.abs(normalizedDz)) {
      // Hit left or right side
      this.playerRef.position.x =
        normalizedDx > 0 ? buildingBox.max.x + 1.5 : buildingBox.min.x - 1.5;
      this.playerRef.velocity.x = normalizedDx > 0 ? 5 : -5;
    } else {
      // Hit front or back
      this.playerRef.position.z =
        normalizedDz > 0 ? buildingBox.max.z + 1.5 : buildingBox.min.z - 1.5;
      this.playerRef.velocity.z = normalizedDz > 0 ? 5 : -5;
    }

    // Apply minor damage
    this.playerRef.takeDamage(PLAYER_CONFIG.COLLISION_DAMAGE / 2);

    // Set cooldown
    this.collisionCooldown = this.cooldownDuration;

    // Create visual effects
    if (this.effectsSystem) {
      this.effectsSystem.createCollisionEffect(playerPos, 0.5);
      this.effectsSystem.createSparks(playerPos, { x: dx, z: dz });
    }

    // Play sound
    if (this.soundSystem) {
      this.soundSystem.playCollisionSound(0.5);
    }
  }

  /**
   * Check collision between player and enemy
   * @private
   */
  _checkPlayerEnemyCollision() {
    if (this.collisionCooldown > 0) return;

    const playerBox = this.playerRef.getBoundingBox();

    // Check all enemies
    for (const enemy of this.enemiesRef) {
      const enemyBox = enemy.getBoundingBox();
      if (checkAABBCollision(playerBox, enemyBox)) {
        this._handlePlayerEnemyCollision();
        break; // One collision per frame
      }
    }
  }

  /**
   * Handle player being caught by enemy (GAME OVER!)
   * @private
   */
  _handlePlayerEnemyCollision() {
    const playerPos = this.playerRef.getPosition();

    // Police collision = instant game over
    // Set player health to 0 to trigger game over
    this.playerRef.die();

    // Set cooldown
    this.collisionCooldown = this.cooldownDuration;

    // Create visual effects
    if (this.effectsSystem) {
      this.effectsSystem.createCollisionEffect(playerPos, 1.2);
      this.effectsSystem.createDamageIndicator(playerPos, damage);
    }

    // Play sound
    if (this.soundSystem) {
      this.soundSystem.playCollisionSound(1.0);
      this.soundSystem.playSirenSound();
    }

    // Push player away from enemy
    const enemy = this.enemiesRef.find((e) => {
      const enemyBox = e.getBoundingBox();
      return checkAABBCollision(this.playerRef.getBoundingBox(), enemyBox);
    });

    if (enemy) {
      const enemyPos = enemy.getPosition();
      const pushDirection = {
        x: playerPos.x - enemyPos.x,
        z: playerPos.z - enemyPos.z,
      };
      const pushMagnitude = Math.sqrt(
        pushDirection.x ** 2 + pushDirection.z ** 2
      );
      if (pushMagnitude > 0) {
        this.playerRef.velocity.x += (pushDirection.x / pushMagnitude) * 8;
        this.playerRef.velocity.z += (pushDirection.z / pushMagnitude) * 8;
      }
    }

    // Trigger callback if set
    if (this.onPlayerHitEnemy) {
      this.onPlayerHitEnemy();
    }
  }

  /**
   * Check for near misses with obstacles for bonus points
   * @private
   */
  _checkNearMisses() {
    const playerPos = this.playerRef.getPosition();
    const obstacles = this.obstacleSpawnerRef.getObstacles();

    for (const obstacle of obstacles) {
      const obstaclePos = obstacle.getPosition();

      // Only check obstacles roughly alongside player
      if (Math.abs(obstaclePos.z - playerPos.z) < 2) {
        const dist = distance2D(
          playerPos.x,
          playerPos.z,
          obstaclePos.x,
          obstaclePos.z
        );

        if (
          dist < SCORING_CONFIG.NEAR_MISS_THRESHOLD &&
          !obstacle.nearMissRegistered
        ) {
          obstacle.nearMissRegistered = true;

          if (this.onNearMiss) {
            this.onNearMiss(obstacle);
          }
        }
      }
    }
  }

  _checkHazards() {
    const playerPos = this.playerRef.getPosition();
    if (this.cityRef.isHazard(playerPos.x, playerPos.z)) {
      this._handleFallHazard(playerPos);
    }
  }

  /**
   * Check collisions between player and traffic cars
   * @private
   */
  _checkPlayerTrafficCollisions() {
    if (this.collisionCooldown > 0) return;

    const playerBox = this.playerRef.getBoundingBox();
    const trafficCars = this.trafficManagerRef.getTrafficCars();

    for (const car of trafficCars) {
      const carBox = car.getBoundingBox();

      if (checkAABBCollision(playerBox, carBox)) {
        this._handlePlayerTrafficCollision(car);
        break;
      }
    }
  }

  /**
   * Handle player collision with traffic car
   * @private
   */
  _handlePlayerTrafficCollision(trafficCar) {
    const playerPos = this.playerRef.getPosition();
    const carPos = trafficCar.getPosition();

    // Light damage from traffic
    this.playerRef.takeDamage(PLAYER_CONFIG.COLLISION_DAMAGE / 3);
    this.collisionCooldown = this.cooldownDuration;

    if (this.effectsSystem) {
      this.effectsSystem.createCollisionEffect(playerPos, 0.5);
    }

    if (this.soundSystem) {
      this.soundSystem.playCollisionSound(0.4);
    }

    // Push player away from traffic car
    const pushDirection = {
      x: playerPos.x - carPos.x,
      z: playerPos.z - carPos.z,
    };
    const pushMagnitude = Math.sqrt(
      pushDirection.x ** 2 + pushDirection.z ** 2
    );
    if (pushMagnitude > 0) {
      this.playerRef.velocity.x += (pushDirection.x / pushMagnitude) * 6;
      this.playerRef.velocity.z += (pushDirection.z / pushMagnitude) * 6;
    }
  }

  /**
   * Check collisions between player and city obstacles
   * @private
   */
  _checkPlayerCityObstacleCollisions() {
    if (this.collisionCooldown > 0) return;

    const playerBox = this.playerRef.getBoundingBox();
    const cityObstacles = this.cityRef.getCityObstacles();

    for (const obstacle of cityObstacles) {
      if (checkAABBCollision(playerBox, obstacle.bounds)) {
        this._handlePlayerCityObstacleCollision(obstacle);
        break;
      }
    }
  }

  /**
   * Handle player collision with city obstacle
   * @private
   */
  _handlePlayerCityObstacleCollision(obstacle) {
    const playerPos = this.playerRef.getPosition();

    // Minor damage from hitting city obstacles
    this.playerRef.takeDamage(PLAYER_CONFIG.COLLISION_DAMAGE / 4);
    this.collisionCooldown = this.cooldownDuration;

    if (this.effectsSystem) {
      this.effectsSystem.createCollisionEffect(playerPos, 0.3);
    }

    if (this.soundSystem) {
      this.soundSystem.playCollisionSound(0.3);
    }

    // Push player back
    const obstacleCenterX = (obstacle.bounds.min.x + obstacle.bounds.max.x) / 2;
    const obstacleCenterZ = (obstacle.bounds.min.z + obstacle.bounds.max.z) / 2;

    const pushDirection = {
      x: playerPos.x - obstacleCenterX,
      z: playerPos.z - obstacleCenterZ,
    };
    const pushMagnitude = Math.sqrt(
      pushDirection.x ** 2 + pushDirection.z ** 2
    );
    if (pushMagnitude > 0) {
      this.playerRef.velocity.x += (pushDirection.x / pushMagnitude) * 4;
      this.playerRef.velocity.z += (pushDirection.z / pushMagnitude) * 4;
    }
  }

  _handleFallHazard(playerPos) {
    if (!this.playerRef.isAlive || this.playerRef.isFalling) return;

    // Trigger falling animation instead of instant death
    this.playerRef.startFalling();
    this.collisionCooldown = this.cooldownDuration;

    if (this.effectsSystem) {
      this.effectsSystem.createSplash?.(playerPos);
    }

    if (this.soundSystem) {
      this.soundSystem.playCollisionSound(0.8);
    }
  }

  /**
   * Register callback for player-obstacle collision
   * @param {Function} callback
   */
  setOnPlayerHitObstacle(callback) {
    this.onPlayerHitObstacle = callback;
  }

  /**
   * Register callback for player-enemy collision
   * @param {Function} callback
   */
  setOnPlayerHitEnemy(callback) {
    this.onPlayerHitEnemy = callback;
  }

  /**
   * Register callback for near miss
   * @param {Function} callback
   */
  setOnNearMiss(callback) {
    this.onNearMiss = callback;
  }
}
