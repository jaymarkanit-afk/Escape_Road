/**
 * City - Open world city environment with buildings
 * Responsibility: Generate and manage city buildings and ground
 * Creates an isometric city view with procedurally placed buildings
 */

import * as THREE from "three";
import { WORLD_CONFIG, COLORS, ROAD_CONFIG } from "../utils/constants.js";
import { random, randomInt } from "../utils/helpers.js";
import { CityObstacles } from "./CityObstacles.js";

export class City {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.hazards = [];
    this.tiles = [];
    this.tileSize = WORLD_CONFIG.SIZE;
    this.cityObstacles = new CityObstacles(scene);

    // Shared materials (reused across all objects to reduce texture/material count)
    this._initSharedMaterials();

    this._createTiles();
    this._spawnUrbanObstacles();
    // Walls removed
  }

  /**
   * Initialize shared materials to prevent texture limit issues
   */
  _initSharedMaterials() {
    // Create grass texture for green areas
    const grassCanvas = document.createElement("canvas");
    grassCanvas.width = 256;
    grassCanvas.height = 256;
    const grassCtx = grassCanvas.getContext("2d");
    grassCtx.fillStyle = "#4a7a3a";
    grassCtx.fillRect(0, 0, 256, 256);
    // Add grass texture pattern
    for (let i = 0; i < 5000; i++) {
      grassCtx.fillStyle = `rgba(${60 + Math.random() * 40}, ${
        90 + Math.random() * 40
      }, ${40 + Math.random() * 20}, 0.3)`;
      grassCtx.fillRect(
        Math.random() * 256,
        Math.random() * 256,
        1,
        Math.random() * 3
      );
    }
    const grassTexture = new THREE.CanvasTexture(grassCanvas);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(20, 20);

    // Create asphalt texture for roads
    const asphaltCanvas = document.createElement("canvas");
    asphaltCanvas.width = 256;
    asphaltCanvas.height = 256;
    const asphaltCtx = asphaltCanvas.getContext("2d");
    asphaltCtx.fillStyle = "#2a2a2a";
    asphaltCtx.fillRect(0, 0, 256, 256);
    // Add asphalt grain
    for (let i = 0; i < 3000; i++) {
      const brightness = Math.random() * 30;
      asphaltCtx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.2)`;
      asphaltCtx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }
    const asphaltTexture = new THREE.CanvasTexture(asphaltCanvas);
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(4, 4);

    // Modern building materials (glass, concrete, metal)
    this.buildingMaterials = [
      // Glass buildings
      new THREE.MeshLambertMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.7,
      }),
      new THREE.MeshLambertMaterial({
        color: 0x99ddff,
        transparent: true,
        opacity: 0.7,
      }),
      // Concrete buildings
      new THREE.MeshLambertMaterial({ color: 0xcccccc }),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa }),
      // Metal/modern buildings
      new THREE.MeshLambertMaterial({ color: 0x556677 }),
      new THREE.MeshLambertMaterial({ color: 0x667788 }),
    ];

    // Ground material with grass texture
    this.groundMaterial = new THREE.MeshLambertMaterial({
      map: grassTexture,
    });

    // Road material with asphalt texture
    this.roadMaterial = new THREE.MeshLambertMaterial({
      map: asphaltTexture,
    });

    // Window materials (shared across all buildings)
    this.windowGeometry = new THREE.PlaneGeometry(0.7, 0.7);
    this.litWindowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    this.unlitWindowMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
  }

  _createTiles() {
    // Build a 3x3 grid around origin to start, then recycle for endless effect
    for (let gx = -1; gx <= 1; gx++) {
      for (let gz = -1; gz <= 1; gz++) {
        this.tiles.push(this._createTile(gx, gz));
      }
    }
  }

  _createTile(gridX, gridZ) {
    const origin = {
      x: gridX * this.tileSize,
      z: gridZ * this.tileSize,
    };

    const tile = {
      gridX,
      gridZ,
      origin,
      ground: null,
      roads: [],
      buildings: [],
      hazards: [],
    };

    tile.ground = this._createGround(origin);
    tile.roads = this._createRoadPatches(origin);
    tile.buildings = this._createBuildingsForTile(origin);
    // Rivers removed

    return tile;
  }

  _createGround(origin) {
    const size = this.tileSize;
    const groundGeometry = new THREE.PlaneGeometry(size, size);

    const ground = new THREE.Mesh(groundGeometry, this.groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(origin.x, 0, origin.z);
    ground.receiveShadow = true;

    this.scene.add(ground);
    return ground;
  }

  _createRoadPatches(origin) {
    // Simple consistent road grid
    const roadWidth = 16;
    const roads = [];

    // Shared center-line assets for city roads
    const centerGeoV = new THREE.PlaneGeometry(
      ROAD_CONFIG.CENTER_LINE_WIDTH,
      ROAD_CONFIG.CENTER_LINE_LENGTH
    );
    const centerGeoH = new THREE.PlaneGeometry(
      ROAD_CONFIG.CENTER_LINE_LENGTH,
      ROAD_CONFIG.CENTER_LINE_WIDTH
    );
    const centerMat = new THREE.MeshBasicMaterial({
      color: ROAD_CONFIG.CENTER_LINE_COLOR,
    });

    const addCenterLines = (length, isVertical, centerX, centerZ) => {
      const spacing = ROAD_CONFIG.CENTER_LINE_SPACING;
      const count = Math.floor(length / spacing);
      const group = new THREE.Group();
      const geo = isVertical ? centerGeoV : centerGeoH;

      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * spacing; // symmetric placement
        const strip = new THREE.Mesh(geo, centerMat);
        strip.rotation.x = -Math.PI / 2;

        strip.position.set(
          isVertical ? centerX : centerX + offset,
          0.03,
          isVertical ? centerZ + offset : centerZ
        );
        group.add(strip);
      }

      this.scene.add(group);
      roads.push(group);
    };

    // Main vertical road (center)
    const verticalRoad = new THREE.PlaneGeometry(roadWidth, 200);
    const vRoad = new THREE.Mesh(verticalRoad, this.roadMaterial);
    vRoad.rotation.x = -Math.PI / 2;
    vRoad.position.set(origin.x, 0.02, origin.z);
    vRoad.receiveShadow = false;
    this.scene.add(vRoad);
    roads.push(vRoad);
    addCenterLines(200, true, origin.x, origin.z);

    // Main horizontal road (center)
    const horizontalRoad = new THREE.PlaneGeometry(200, roadWidth);
    const hRoad = new THREE.Mesh(horizontalRoad, this.roadMaterial);
    hRoad.rotation.x = -Math.PI / 2;
    hRoad.position.set(origin.x, 0.02, origin.z);
    hRoad.receiveShadow = false;
    this.scene.add(hRoad);
    roads.push(hRoad);
    addCenterLines(200, false, origin.x, origin.z);

    return roads;
  }

  _createBuildingsForTile(origin) {
    const config = WORLD_CONFIG;
    const buildings = [];
    const roadWidth = 16;
    const roadBuffer = 5; // Keep buildings away from roads

    // Define building zones - ONLY on green areas (all four quadrants)
    const buildingZones = [
      // Top-left (x negative, z negative)
      {
        xMin: -95,
        xMax: -roadWidth - roadBuffer,
        zMin: -95,
        zMax: -roadWidth - roadBuffer,
      },
      // Top-right (x positive, z negative)
      {
        xMin: roadWidth + roadBuffer,
        xMax: 95,
        zMin: -95,
        zMax: -roadWidth - roadBuffer,
      },
      // Bottom-left (x negative, z positive)
      {
        xMin: -95,
        xMax: -roadWidth - roadBuffer,
        zMin: roadWidth + roadBuffer,
        zMax: 95,
      },
      // Bottom-right (x positive, z positive)
      {
        xMin: roadWidth + roadBuffer,
        xMax: 95,
        zMin: roadWidth + roadBuffer,
        zMax: 95,
      },
    ];

    // PRECISE EQUAL SPACING - 25 units between building centers on all sides
    const spacing = 25;

    buildingZones.forEach((zone) => {
      for (let x = zone.xMin + spacing / 2; x < zone.xMax; x += spacing) {
        for (let z = zone.zMin + spacing / 2; z < zone.zMax; z += spacing) {
          const actualX = origin.x + x;
          const actualZ = origin.z + z;

          // Modern buildings: uniform size 12x12, varied height
          const width = 12;
          const height = random(15, 30); // Taller modern buildings
          const depth = 12;

          // Create building
          const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
          const buildingMaterial =
            this.buildingMaterials[
              randomInt(0, this.buildingMaterials.length - 1)
            ];

          const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
          building.position.set(actualX, height / 2, actualZ);
          building.castShadow = false;
          building.receiveShadow = false;

          // Add windows
          this._addWindows(building, width, height, depth);

          buildings.push(building);
          this.buildings.push(building);
          this.scene.add(building);
        }
      }
    });

    return buildings;
  }

  _createRivers(origin) {
    const rivers = [];

    // Small decorative rivers in far corners only
    const riverPositions = [
      // Top-left corner - small horizontal river
      { x: -70, z: -70, width: 25, length: 6, rotation: 0 },
      // Bottom-right corner - small vertical river
      { x: 70, z: 70, width: 6, length: 25, rotation: Math.PI / 2 },
    ];

    riverPositions.forEach((riverPos) => {
      const riverGeom = new THREE.PlaneGeometry(
        riverPos.width,
        riverPos.length
      );
      const river = new THREE.Mesh(riverGeom, this.riverMaterial);
      river.rotation.x = -Math.PI / 2;
      river.rotation.z = riverPos.rotation;
      river.position.set(origin.x + riverPos.x, -0.15, origin.z + riverPos.z);
      river.receiveShadow = false;
      river.castShadow = false;
      this.scene.add(river);

      // Calculate hazard bounds based on rotation
      let minX, maxX, minZ, maxZ;
      if (riverPos.rotation === 0) {
        // Horizontal river
        minX = origin.x + riverPos.x - riverPos.width / 2;
        maxX = origin.x + riverPos.x + riverPos.width / 2;
        minZ = origin.z + riverPos.z - riverPos.length / 2;
        maxZ = origin.z + riverPos.z + riverPos.length / 2;
      } else {
        // Vertical river (rotated)
        minX = origin.x + riverPos.x - riverPos.length / 2;
        maxX = origin.x + riverPos.x + riverPos.length / 2;
        minZ = origin.z + riverPos.z - riverPos.width / 2;
        maxZ = origin.z + riverPos.z + riverPos.width / 2;
      }

      const hazard = {
        mesh: river,
        min: { x: minX, z: minZ },
        max: { x: maxX, z: maxZ },
      };
      rivers.push(hazard);
      this.hazards.push(hazard);
    });

    return rivers;
  }

  /**
   * Spawn minimal urban obstacles (only in green areas, not on roads)
   * @private
   */
  _spawnUrbanObstacles() {
    // MODERN CLEAN CITY: No obstacles on roads
    // Only place decorative elements in green areas away from roads

    // Traffic signs only at intersections (on green areas near roads)
    const trafficSignPositions = [
      { x: 18, z: 18, type: "stop" },
      { x: -18, z: -18, type: "stop" },
      { x: 18, z: -18, type: "stop" },
      { x: -18, z: 18, type: "stop" },
    ];

    trafficSignPositions.forEach((pos) => {
      this.cityObstacles.createTrafficSign({ x: pos.x, z: pos.z }, pos.type);
    });
  }

  /**
   * Create boundary walls around the play area
   * @private
   */
  _createBoundaryWalls() {
    const wallHeight = 8;
    const wallThickness = 2;
    const worldSize = WORLD_CONFIG.SIZE / 2;
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    // North wall
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(
        WORLD_CONFIG.SIZE + wallThickness * 2,
        wallHeight,
        wallThickness
      ),
      wallMaterial
    );
    northWall.position.set(0, wallHeight / 2, -worldSize - wallThickness / 2);
    this.scene.add(northWall);

    // South wall
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(
        WORLD_CONFIG.SIZE + wallThickness * 2,
        wallHeight,
        wallThickness
      ),
      wallMaterial
    );
    southWall.position.set(0, wallHeight / 2, worldSize + wallThickness / 2);
    this.scene.add(southWall);

    // West wall
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, WORLD_CONFIG.SIZE),
      wallMaterial
    );
    westWall.position.set(-worldSize - wallThickness / 2, wallHeight / 2, 0);
    this.scene.add(westWall);

    // East wall
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, WORLD_CONFIG.SIZE),
      wallMaterial
    );
    eastWall.position.set(worldSize + wallThickness / 2, wallHeight / 2, 0);
    this.scene.add(eastWall);
  }

  /**
   * Check if position is on a road
   * @private
   */
  _isOnRoad(x, z) {
    const roadWidth = WORLD_CONFIG.ROAD_WIDTH;
    // Horizontal roads at z = 0
    if (Math.abs(z) < roadWidth / 2) return true;
    // Vertical roads at x = 0
    if (Math.abs(x) < roadWidth / 2) return true;
    return false;
  }

  /**
   * Check if building overlaps with existing buildings
   * @private
   */
  _checkBuildingCollision(x, z, width, depth, existingBuildings) {
    const spacing = WORLD_CONFIG.BUILDING_SPACING;
    for (const building of existingBuildings) {
      const bx = building.position.x;
      const bz = building.position.z;
      const bw = building.geometry.parameters.width;
      const bd = building.geometry.parameters.depth;

      // Check if bounding boxes overlap (with spacing)
      if (
        Math.abs(x - bx) < (width + bw) / 2 + spacing &&
        Math.abs(z - bz) < (depth + bd) / 2 + spacing
      ) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  }

  /**
   * Add windows to a building
   * @private
   */
  _addWindows(building, width, height, depth) {
    const windowSpacing = 2.2;

    // Front and back faces
    const numWindowsX = Math.floor((width - 2) / windowSpacing);
    const numWindowsY = Math.floor((height - 3) / windowSpacing);

    for (let iy = 0; iy < numWindowsY; iy++) {
      for (let ix = 0; ix < numWindowsX; ix++) {
        // Calculate position relative to building geometry center
        const x = (ix - (numWindowsX - 1) / 2) * windowSpacing;
        const y = (iy - (numWindowsY - 1) / 2) * windowSpacing;

        // Random lit/unlit windows - reuse materials
        const isLit = Math.random() > 0.3;
        const windowMaterial = isLit
          ? this.litWindowMaterial
          : this.unlitWindowMaterial;

        // Front face
        const windowFront = new THREE.Mesh(this.windowGeometry, windowMaterial);
        windowFront.position.set(x, y, depth / 2 + 0.01);
        building.add(windowFront);

        // Back face
        const windowBack = new THREE.Mesh(this.windowGeometry, windowMaterial);
        windowBack.position.set(x, y, -depth / 2 - 0.01);
        windowBack.rotation.y = Math.PI;
        building.add(windowBack);
      }
    }

    // Side faces
    const numWindowsZ = Math.floor((depth - 2) / windowSpacing);

    for (let iy = 0; iy < numWindowsY; iy++) {
      for (let iz = 0; iz < numWindowsZ; iz++) {
        const z = (iz - (numWindowsZ - 1) / 2) * windowSpacing;
        const y = (iy - (numWindowsY - 1) / 2) * windowSpacing;

        const isLit = Math.random() > 0.3;
        const windowMaterial = isLit
          ? this.litWindowMaterial
          : this.unlitWindowMaterial;

        // Left face
        const windowLeft = new THREE.Mesh(this.windowGeometry, windowMaterial);
        windowLeft.position.set(-width / 2 - 0.01, y, z);
        windowLeft.rotation.y = Math.PI / 2;
        building.add(windowLeft);

        // Right face
        const windowRight = new THREE.Mesh(this.windowGeometry, windowMaterial);
        windowRight.position.set(width / 2 + 0.01, y, z);
        windowRight.rotation.y = -Math.PI / 2;
        building.add(windowRight);
      }
    }
  }

  /**
   * Get all buildings for collision detection
   */
  getBuildings() {
    return this.buildings;
  }

  /**
   * Get city obstacles for collision detection
   */
  getCityObstacles() {
    return this.cityObstacles.getObstacles();
  }

  /**
   * Check if position collides with any building
   */
  checkBuildingCollision(x, z, radius = 2) {
    for (const building of this.buildings) {
      const bx = building.position.x;
      const bz = building.position.z;
      const halfWidth = building.geometry.parameters.width / 2 + radius;
      const halfDepth = building.geometry.parameters.depth / 2 + radius;

      if (
        x > bx - halfWidth &&
        x < bx + halfWidth &&
        z > bz - halfDepth &&
        z < bz + halfDepth
      ) {
        return true;
      }
    }
    return false;
  }

  isHazard(x, z) {
    return this.hazards.some((hazard) => {
      return (
        x >= hazard.min.x &&
        x <= hazard.max.x &&
        z >= hazard.min.z &&
        z <= hazard.max.z
      );
    });
  }

  update(playerPosition) {
    const currentGridX = Math.round(playerPosition.x / this.tileSize);
    const currentGridZ = Math.round(playerPosition.z / this.tileSize);

    this.tiles.forEach((tile) => {
      const dx = tile.gridX - currentGridX;
      const dz = tile.gridZ - currentGridZ;

      if (Math.abs(dx) > 1 || Math.abs(dz) > 1) {
        const newGridX = currentGridX + (dx > 0 ? -1 : 1);
        const newGridZ = currentGridZ + (dz > 0 ? -1 : 1);
        this._repositionTile(tile, newGridX, newGridZ);
      }
    });
  }

  _repositionTile(tile, newGridX, newGridZ) {
    const newOrigin = {
      x: newGridX * this.tileSize,
      z: newGridZ * this.tileSize,
    };

    const deltaX = newOrigin.x - tile.origin.x;
    const deltaZ = newOrigin.z - tile.origin.z;

    // Move ground
    tile.ground.position.x += deltaX;
    tile.ground.position.z += deltaZ;

    // Move roads
    tile.roads.forEach((road) => {
      road.position.x += deltaX;
      road.position.z += deltaZ;
    });

    // Move buildings
    tile.buildings.forEach((building) => {
      building.position.x += deltaX;
      building.position.z += deltaZ;
    });

    // Move hazards and bounding boxes
    tile.hazards.forEach((hazard) => {
      hazard.mesh.position.x += deltaX;
      hazard.mesh.position.z += deltaZ;
      hazard.min.x += deltaX;
      hazard.max.x += deltaX;
      hazard.min.z += deltaZ;
      hazard.max.z += deltaZ;
    });

    tile.gridX = newGridX;
    tile.gridZ = newGridZ;
    tile.origin = newOrigin;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.buildings.forEach((building) => {
      this.scene.remove(building);
      building.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });

    this.tiles.forEach((tile) => {
      if (tile.ground) {
        this.scene.remove(tile.ground);
        tile.ground.geometry.dispose();
        tile.ground.material.dispose();
      }
      tile.roads.forEach((road) => {
        this.scene.remove(road);
        road.geometry.dispose();
        road.material.dispose();
      });
      tile.hazards.forEach((hazard) => {
        this.scene.remove(hazard.mesh);
        hazard.mesh.geometry.dispose();
        hazard.mesh.material.dispose();
      });
    });

    // Cleanup city obstacles
    if (this.cityObstacles) {
      this.cityObstacles.dispose();
    }
  }
}
