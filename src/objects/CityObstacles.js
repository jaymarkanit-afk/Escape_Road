/**
 * CityObstacles - Urban environment obstacles
 * Responsibility: Create and manage city obstacles like signs, lights, benches
 * Provides realistic urban environment elements
 */

import * as THREE from "three";
import { random, randomInt } from "../utils/helpers.js";

export class CityObstacles {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];

    // Shared materials to prevent texture limit issues
    this._initSharedMaterials();
  }

  /**
   * Initialize shared materials for all obstacles
   */
  _initSharedMaterials() {
    this.postMaterial = new THREE.MeshLambertMaterial({
      color: 0x808080,
    });

    this.poleMaterial = new THREE.MeshLambertMaterial({
      color: 0x2a2a2a,
    });

    this.fixtureMaterial = new THREE.MeshLambertMaterial({
      color: 0x1a1a1a,
    });

    this.bulbMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffcc,
    });

    this.woodMaterial = new THREE.MeshLambertMaterial({
      color: 0x8b4513,
    });

    this.metalMaterial = new THREE.MeshLambertMaterial({
      color: 0x555555,
    });

    this.redMaterial = new THREE.MeshLambertMaterial({
      color: 0xff0000,
    });

    // Sign materials
    this.stopSignMaterial = new THREE.MeshLambertMaterial({
      color: 0xff0000,
    });

    this.yieldSignMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff00,
    });

    this.infoSignMaterial = new THREE.MeshLambertMaterial({
      color: 0x3399ff,
    });

    // Barrier materials
    this.barrierOrangeMaterial = new THREE.MeshLambertMaterial({
      color: 0xff6600,
    });

    this.barrierWhiteMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
    });
  }

  /**
   * Create traffic sign
   */
  createTrafficSign(position, type = "stop") {
    const group = new THREE.Group();

    // Sign post
    const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const post = new THREE.Mesh(postGeometry, this.postMaterial);
    post.position.y = 1.5;
    post.castShadow = true;
    group.add(post);

    // Sign board
    let signGeometry, signMaterial;
    if (type === "stop") {
      signGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.1);
      signMaterial = this.stopSignMaterial;
    } else if (type === "yield") {
      signGeometry = new THREE.ConeGeometry(0.6, 1, 3);
      signMaterial = this.yieldSignMaterial;
    } else {
      signGeometry = new THREE.CircleGeometry(0.6, 8);
      signMaterial = this.infoSignMaterial;
    }

    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.y = 3.5;
    sign.castShadow = true;
    group.add(sign);

    group.position.set(position.x, 0, position.z);
    this.scene.add(group);

    const obstacle = {
      mesh: group,
      type: "traffic_sign",
      bounds: {
        min: { x: position.x - 0.6, z: position.z - 0.6, y: 0 },
        max: { x: position.x + 0.6, z: position.z + 0.6, y: 4 },
      },
    };

    this.obstacles.push(obstacle);
    return obstacle;
  }

  /**
   * Create street light
   */
  createStreetLight(position) {
    const group = new THREE.Group();

    // Light pole
    const poleGeometry = new THREE.CylinderGeometry(0.15, 0.2, 6, 8);
    const pole = new THREE.Mesh(poleGeometry, this.poleMaterial);
    pole.position.y = 3;
    pole.castShadow = true;
    group.add(pole);

    // Light fixture
    const fixtureGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
    const fixture = new THREE.Mesh(fixtureGeometry, this.fixtureMaterial);
    fixture.position.y = 6.5;
    fixture.castShadow = true;
    group.add(fixture);

    // Light bulb (emissive)
    const bulbGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const bulb = new THREE.Mesh(bulbGeometry, this.bulbMaterial);
    bulb.position.y = 6.5;
    group.add(bulb);

    // REMOVED PointLight to optimize performance

    group.position.set(position.x, 0, position.z);
    this.scene.add(group);

    const obstacle = {
      mesh: group,
      type: "street_light",
      bounds: {
        min: { x: position.x - 0.5, z: position.z - 0.5, y: 0 },
        max: { x: position.x + 0.5, z: position.z + 0.5, y: 7 },
      },
    };

    this.obstacles.push(obstacle);
    return obstacle;
  }

  /**
   * Create bench
   */
  createBench(position, rotation = 0) {
    const group = new THREE.Group();

    // Bench seat
    const seatGeometry = new THREE.BoxGeometry(2, 0.2, 0.6);
    const seat = new THREE.Mesh(seatGeometry, this.woodMaterial);
    seat.position.y = 0.5;
    seat.castShadow = true;
    group.add(seat);

    // Bench back
    const backGeometry = new THREE.BoxGeometry(2, 0.8, 0.1);
    const back = new THREE.Mesh(backGeometry, this.woodMaterial);
    back.position.set(0, 0.9, -0.25);
    back.castShadow = true;
    group.add(back);

    // Legs (4 metal legs)
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);

    const legPositions = [
      [-0.8, 0.25, 0.2],
      [0.8, 0.25, 0.2],
      [-0.8, 0.25, -0.2],
      [0.8, 0.25, -0.2],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeometry, this.metalMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      group.add(leg);
    });

    group.position.set(position.x, 0, position.z);
    group.rotation.y = rotation;
    this.scene.add(group);

    const obstacle = {
      mesh: group,
      type: "bench",
      bounds: {
        min: { x: position.x - 1, z: position.z - 0.3, y: 0 },
        max: { x: position.x + 1, z: position.z + 0.3, y: 1 },
      },
    };

    this.obstacles.push(obstacle);
    return obstacle;
  }

  /**
   * Create traffic barrier
   */
  createBarrier(position, length = 3, rotation = 0) {
    const group = new THREE.Group();

    // Barrier segments
    const segmentCount = Math.floor(length / 1.5);
    for (let i = 0; i < segmentCount; i++) {
      const barrierGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.2);
      const barrierMaterial =
        i % 2 === 0 ? this.barrierOrangeMaterial : this.barrierWhiteMaterial;
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
      barrier.position.set(i * 1.5 - length / 2, 0.5, 0);
      barrier.castShadow = true;
      group.add(barrier);
    }

    group.position.set(position.x, 0, position.z);
    group.rotation.y = rotation;
    this.scene.add(group);

    const obstacle = {
      mesh: group,
      type: "barrier",
      bounds: {
        min: { x: position.x - length / 2, z: position.z - 0.2, y: 0 },
        max: { x: position.x + length / 2, z: position.z + 0.2, y: 1 },
      },
    };

    this.obstacles.push(obstacle);
    return obstacle;
  }

  /**
   * Create fire hydrant
   */
  createFireHydrant(position) {
    const group = new THREE.Group();

    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.2, 8);
    const base = new THREE.Mesh(baseGeometry, this.redMaterial);
    base.position.y = 0.1;
    base.castShadow = true;
    group.add(base);

    // Main body
    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8);
    const body = new THREE.Mesh(bodyGeometry, this.redMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Top cap
    const capGeometry = new THREE.CylinderGeometry(0.28, 0.25, 0.15, 8);
    const cap = new THREE.Mesh(capGeometry, this.redMaterial);
    cap.position.y = 1.1;
    cap.castShadow = true;
    group.add(cap);

    // Side outlets
    const outletGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
    const outlet1 = new THREE.Mesh(outletGeometry, this.redMaterial);
    outlet1.rotation.z = Math.PI / 2;
    outlet1.position.set(0.25, 0.6, 0);
    group.add(outlet1);

    const outlet2 = new THREE.Mesh(outletGeometry, this.redMaterial);
    outlet2.rotation.z = Math.PI / 2;
    outlet2.position.set(-0.25, 0.6, 0);
    group.add(outlet2);

    group.position.set(position.x, 0, position.z);
    this.scene.add(group);

    const obstacle = {
      mesh: group,
      type: "fire_hydrant",
      bounds: {
        min: { x: position.x - 0.4, z: position.z - 0.4, y: 0 },
        max: { x: position.x + 0.4, z: position.z + 0.4, y: 1.2 },
      },
    };

    this.obstacles.push(obstacle);
    return obstacle;
  }

  /**
   * Get all obstacles
   */
  getObstacles() {
    return this.obstacles;
  }

  /**
   * Cleanup all obstacles
   */
  dispose() {
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
