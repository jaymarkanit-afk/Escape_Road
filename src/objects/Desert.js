/**
 * Desert - Desert biome with realistic terrain
 * Responsibility: Create desert environment with sand dunes, rocks, and obstacles
 * Provides environmental diversity
 */

import * as THREE from "three";
import { random, randomInt } from "../utils/helpers.js";

export class Desert {
  constructor(scene, origin = { x: 300, z: 0 }) {
    this.scene = scene;
    this.origin = origin;
    this.obstacles = [];
    this.terrain = null;
    this.size = 200;

    this._createDesertTerrain();
    this._createSandDunes();
    this._createRocks();
    this._createCacti();
  }

  /**
   * Create desert sand terrain with texture
   * @private
   */
  _createDesertTerrain() {
    // Create terrain geometry with displacement for sand dunes effect
    const geometry = new THREE.PlaneGeometry(this.size, this.size, 20, 20);

    // Add random height variation for sand dunes
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] = random(-0.5, 1.5); // z is height in plane geometry
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
      color: 0xdaa520, // Golden sand color
    });

    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.position.set(this.origin.x, 0, this.origin.z);
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }

  /**
   * Create sand dunes
   * @private
   */
  _createSandDunes() {
    const duneCount = 8;
    for (let i = 0; i < duneCount; i++) {
      const width = random(15, 30);
      const height = random(3, 8);
      const depth = random(15, 30);

      // Create dune using sphere geometry, flattened
      const geometry = new THREE.SphereGeometry(width, 8, 8);
      geometry.scale(1, height / width, 1);

      const material = new THREE.MeshLambertMaterial({
        color: 0xc9a962,
      });

      const dune = new THREE.Mesh(geometry, material);
      dune.position.set(
        this.origin.x + random(-this.size / 2 + 20, this.size / 2 - 20),
        height / 2 - 1,
        this.origin.z + random(-this.size / 2 + 20, this.size / 2 - 20)
      );
      dune.castShadow = true;
      dune.receiveShadow = true;
      this.scene.add(dune);
    }
  }

  /**
   * Create desert rocks and boulders
   * @private
   */
  _createRocks() {
    const rockCount = 20;
    for (let i = 0; i < rockCount; i++) {
      const rockType = randomInt(0, 2);
      let geometry;

      if (rockType === 0) {
        // Boulder (dodecahedron for irregular shape)
        geometry = new THREE.DodecahedronGeometry(random(1, 3), 0);
      } else if (rockType === 1) {
        // Sharp rock (cone)
        geometry = new THREE.ConeGeometry(random(1, 2), random(2, 4), 6);
      } else {
        // Flat rock (cylinder)
        geometry = new THREE.CylinderGeometry(
          random(1.5, 3),
          random(1.5, 3),
          random(0.5, 1.5),
          8
        );
      }

      const material = new THREE.MeshLambertMaterial({
        color: randomInt(0, 1) === 0 ? 0x8b7355 : 0x696969,
      });

      const rock = new THREE.Mesh(geometry, material);
      const x = this.origin.x + random(-this.size / 2 + 10, this.size / 2 - 10);
      const z = this.origin.z + random(-this.size / 2 + 10, this.size / 2 - 10);

      rock.position.set(x, geometry.parameters.height / 2 || 1, z);
      rock.rotation.y = random(0, Math.PI * 2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);

      // Add to obstacles for collision
      const obstacle = {
        mesh: rock,
        type: "rock",
        bounds: {
          min: {
            x: x - (geometry.parameters.radius || 1.5),
            z: z - (geometry.parameters.radius || 1.5),
            y: 0,
          },
          max: {
            x: x + (geometry.parameters.radius || 1.5),
            z: z + (geometry.parameters.radius || 1.5),
            y: geometry.parameters.height || 2,
          },
        },
      };
      this.obstacles.push(obstacle);
    }
  }

  /**
   * Create desert cacti
   * @private
   */
  _createCacti() {
    const cactiCount = 15;
    for (let i = 0; i < cactiCount; i++) {
      const cactus = this._createSingleCactus();
      const x = this.origin.x + random(-this.size / 2 + 15, this.size / 2 - 15);
      const z = this.origin.z + random(-this.size / 2 + 15, this.size / 2 - 15);

      cactus.position.set(x, 0, z);
      this.scene.add(cactus);

      // Add to obstacles for collision
      const obstacle = {
        mesh: cactus,
        type: "cactus",
        bounds: {
          min: { x: x - 0.5, z: z - 0.5, y: 0 },
          max: { x: x + 0.5, z: z + 0.5, y: 4 },
        },
      };
      this.obstacles.push(obstacle);
    }
  }

  /**
   * Create a single cactus
   * @private
   */
  _createSingleCactus() {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({
      color: 0x2d5016,
    });

    // Main trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, random(3, 5), 8);
    const trunk = new THREE.Mesh(trunkGeometry, material);
    trunk.position.y = trunkGeometry.parameters.height / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Arms (random 1-3 arms)
    const armCount = randomInt(1, 3);
    for (let i = 0; i < armCount; i++) {
      const armHeight = random(1, 2);
      const armGeometry = new THREE.CylinderGeometry(0.3, 0.35, armHeight, 8);
      const arm = new THREE.Mesh(armGeometry, material);

      const yPos = random(1, 2.5);
      const side = i % 2 === 0 ? 1 : -1;

      // Horizontal part
      arm.rotation.z = (side * Math.PI) / 2;
      arm.position.set(side * 0.6, yPos, 0);
      arm.castShadow = true;
      group.add(arm);

      // Vertical part
      const armUpGeometry = new THREE.CylinderGeometry(
        0.25,
        0.3,
        random(1, 1.5),
        8
      );
      const armUp = new THREE.Mesh(armUpGeometry, material);
      armUp.position.set(
        side * (0.6 + armHeight / 2),
        yPos + armUpGeometry.parameters.height / 2,
        0
      );
      armUp.castShadow = true;
      group.add(armUp);
    }

    return group;
  }

  /**
   * Get all desert obstacles
   */
  getObstacles() {
    return this.obstacles;
  }

  /**
   * Check if position is in desert area
   */
  isInDesert(x, z) {
    return (
      x >= this.origin.x - this.size / 2 &&
      x <= this.origin.x + this.size / 2 &&
      z >= this.origin.z - this.size / 2 &&
      z <= this.origin.z + this.size / 2
    );
  }

  /**
   * Cleanup desert resources
   */
  dispose() {
    if (this.terrain) {
      this.scene.remove(this.terrain);
      if (this.terrain.geometry) this.terrain.geometry.dispose();
      if (this.terrain.material) this.terrain.material.dispose();
    }

    this.obstacles.forEach((obstacle) => {
      if (obstacle.mesh) {
        this.scene.remove(obstacle.mesh);
        obstacle.mesh.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
    });

    this.obstacles = [];
  }
}
