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

    // Colorful building materials like in the reference image
    this.buildingColors = [
      0x6eb5e0, // Light blue
      0x4a9fd8, // Medium blue
      0xd47c7c, // Red/pink
      0xa85555, // Dark red
      0x5ec9bc, // Cyan/teal
      0x3eb0a0, // Dark teal
      0xd4c89a, // Beige/tan
      0xb8a878, // Dark beige
    ];

    // Ground material with grass texture
    this.groundMaterial = new THREE.MeshLambertMaterial({
      map: grassTexture,
    });

    // Road material with asphalt texture
    this.roadMaterial = new THREE.MeshLambertMaterial({
      map: asphaltTexture,
    });

    // Stripe material for buildings
    this.stripeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    // Rooftop material
    this.rooftopMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

    // Create window textures for building facades
    this._createBuildingTextures();
  }

  /**
   * Create reusable building facade textures with windows
   * @private
   */
  _createBuildingTextures() {
    this.buildingTextures = {};

    // Office building texture (grid of windows)
    const officeCanvas = document.createElement("canvas");
    officeCanvas.width = 256;
    officeCanvas.height = 256;
    const officeCtx = officeCanvas.getContext("2d");
    officeCtx.fillStyle = "#8b9a9e";
    officeCtx.fillRect(0, 0, 256, 256);
    // Draw windows
    const windowSize = 20;
    const spacing = 8;
    for (let x = 10; x < 256; x += windowSize + spacing) {
      for (let y = 10; y < 256; y += windowSize + spacing) {
        officeCtx.fillStyle = "#ffeb3b";
        officeCtx.fillRect(x, y, windowSize, windowSize);
        officeCtx.strokeStyle = "#333";
        officeCtx.lineWidth = 1;
        officeCtx.strokeRect(x, y, windowSize, windowSize);
      }
    }
    const officeTexture = new THREE.CanvasTexture(officeCanvas);
    officeTexture.magFilter = THREE.NearestFilter;
    this.buildingTextures.office = new THREE.MeshLambertMaterial({
      map: officeTexture,
    });

    // Residential building texture (different window pattern)
    const residentialCanvas = document.createElement("canvas");
    residentialCanvas.width = 256;
    residentialCanvas.height = 256;
    const resCtx = residentialCanvas.getContext("2d");
    resCtx.fillStyle = "#c9a574";
    resCtx.fillRect(0, 0, 256, 256);
    // Draw windows
    const windowSize2 = 18;
    const spacing2 = 10;
    for (let x = 15; x < 256; x += windowSize2 + spacing2) {
      for (let y = 15; y < 256; y += windowSize2 + spacing2) {
        resCtx.fillStyle = "#87ceeb";
        resCtx.fillRect(x, y, windowSize2, windowSize2);
        resCtx.fillStyle = "#444";
        resCtx.fillRect(x + 4, y + 4, windowSize2 - 8, windowSize2 - 8);
      }
    }
    const residentialTexture = new THREE.CanvasTexture(residentialCanvas);
    residentialTexture.magFilter = THREE.NearestFilter;
    this.buildingTextures.residential = new THREE.MeshLambertMaterial({
      map: residentialTexture,
    });

    // Shop/Commercial texture (larger windows)
    const shopCanvas = document.createElement("canvas");
    shopCanvas.width = 256;
    shopCanvas.height = 256;
    const shopCtx = shopCanvas.getContext("2d");
    shopCtx.fillStyle = "#d4464f";
    shopCtx.fillRect(0, 0, 256, 256);
    // Draw shop windows
    const windowSize3 = 35;
    const spacing3 = 15;
    for (let x = 10; x < 256; x += windowSize3 + spacing3) {
      for (let y = 10; y < 256; y += windowSize3 + spacing3) {
        shopCtx.fillStyle = "#ffd700";
        shopCtx.fillRect(x, y, windowSize3, windowSize3);
        shopCtx.strokeStyle = "#8b0000";
        shopCtx.lineWidth = 2;
        shopCtx.strokeRect(x, y, windowSize3, windowSize3);
      }
    }
    const shopTexture = new THREE.CanvasTexture(shopCanvas);
    shopTexture.magFilter = THREE.NearestFilter;
    this.buildingTextures.shop = new THREE.MeshLambertMaterial({
      map: shopTexture,
    });

    // Modern/Glass texture
    const modernCanvas = document.createElement("canvas");
    modernCanvas.width = 256;
    modernCanvas.height = 256;
    const modCtx = modernCanvas.getContext("2d");
    modCtx.fillStyle = "#4a5f6f";
    modCtx.fillRect(0, 0, 256, 256);
    // Draw glass panels
    const panelSize = 32;
    for (let x = 0; x < 256; x += panelSize) {
      for (let y = 0; y < 256; y += panelSize) {
        modCtx.fillStyle = "#87ceeb";
        modCtx.fillRect(x + 2, y + 2, panelSize - 4, panelSize - 4);
        modCtx.strokeStyle = "#333";
        modCtx.lineWidth = 2;
        modCtx.strokeRect(x + 2, y + 2, panelSize - 4, panelSize - 4);
      }
    }
    const modernTexture = new THREE.CanvasTexture(modernCanvas);
    modernTexture.magFilter = THREE.NearestFilter;
    this.buildingTextures.modern = new THREE.MeshLambertMaterial({
      map: modernTexture,
    });
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
    // Dual-carriageway setup
    const totalRoadWidth = 18; // entire road including both directions
    const medianWidth = 2;
    const laneWidth = 3.5;
    const lanesPerDirection = 2;
    const carriageWidth = lanesPerDirection * laneWidth; // width per direction
    const carriageOffset = medianWidth / 2 + carriageWidth / 2; // offset from center for each carriageway

    const roads = [];

    // Lane markers (white dashed)
    const laneMarkerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const laneMarkerLength = 3;
    const laneMarkerSpacing = 8;

    const addLaneMarkers = (length, isVertical, centerX, centerZ) => {
      const count = Math.floor(length / laneMarkerSpacing);
      const group = new THREE.Group();

      // Geometry orientation
      const laneGeo = isVertical
        ? new THREE.PlaneGeometry(0.25, laneMarkerLength)
        : new THREE.PlaneGeometry(laneMarkerLength, 0.25);

      // For each direction (-1 = left/down, +1 = right/up)
      [-1, 1].forEach((dir) => {
        const cx = dir * carriageOffset; // center of this carriageway

        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * laneMarkerSpacing;

          // Divider between the two lanes in this carriageway (sits at carriage center)
          const divider = new THREE.Mesh(laneGeo, laneMarkerMat);
          divider.rotation.x = -Math.PI / 2;
          if (isVertical) {
            divider.position.set(centerX + cx, 0.03, centerZ + offset);
          } else {
            divider.position.set(centerX + offset, 0.03, centerZ + cx);
          }
          group.add(divider);
        }
      });

      this.scene.add(group);
      roads.push(group);
    };

    // Main vertical road (center)
    const verticalRoad = new THREE.PlaneGeometry(totalRoadWidth, 200);
    const vRoad = new THREE.Mesh(verticalRoad, this.roadMaterial);
    vRoad.rotation.x = -Math.PI / 2;
    vRoad.position.set(origin.x, 0.02, origin.z);
    vRoad.receiveShadow = false;
    this.scene.add(vRoad);
    roads.push(vRoad);

    // Median strip
    const vMedianGeo = new THREE.PlaneGeometry(medianWidth, 200);
    const vMedian = new THREE.Mesh(
      vMedianGeo,
      new THREE.MeshLambertMaterial({ color: 0xc8ff80 })
    );
    vMedian.rotation.x = -Math.PI / 2;
    vMedian.position.set(origin.x, 0.021, origin.z);
    vMedian.receiveShadow = false;
    this.scene.add(vMedian);
    roads.push(vMedian);

    // Lane markers for vertical road
    addLaneMarkers(200, true, origin.x, origin.z);

    // Main horizontal road (center)
    const horizontalRoad = new THREE.PlaneGeometry(200, totalRoadWidth);
    const hRoad = new THREE.Mesh(horizontalRoad, this.roadMaterial);
    hRoad.rotation.x = -Math.PI / 2;
    hRoad.position.set(origin.x, 0.02, origin.z);
    hRoad.receiveShadow = false;
    this.scene.add(hRoad);
    roads.push(hRoad);

    // Median strip for horizontal road
    const hMedianGeo = new THREE.PlaneGeometry(200, medianWidth);
    const hMedian = new THREE.Mesh(
      hMedianGeo,
      new THREE.MeshLambertMaterial({ color: 0xc8ff80 })
    );
    hMedian.rotation.x = -Math.PI / 2;
    hMedian.position.set(origin.x, 0.021, origin.z);
    hMedian.receiveShadow = false;
    this.scene.add(hMedian);
    roads.push(hMedian);

    // Lane markers for horizontal road
    addLaneMarkers(200, false, origin.x, origin.z);

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

          // Randomize building type and size
          const buildingType = randomInt(0, 3); // 0: office, 1: residential, 2: shop, 3: modern
          const sizeVariation = randomInt(0, 2); // 0: small, 1: medium, 2: large

          let width, height, depth, building;

          if (sizeVariation === 0) {
            // Small buildings
            width = randomInt(8, 12);
            height = random(12, 22);
          } else if (sizeVariation === 1) {
            // Medium buildings
            width = randomInt(12, 16);
            height = random(20, 35);
          } else {
            // Large buildings
            width = randomInt(16, 22);
            height = random(28, 40);
          }
          depth = randomInt(8, 16);

          // Create building based on type
          if (buildingType === 0) {
            building = this._createOfficeBuilding(width, height, depth);
          } else if (buildingType === 1) {
            building = this._createResidentialBuilding(width, height, depth);
          } else if (buildingType === 2) {
            building = this._createShopBuilding(width, height, depth);
          } else {
            building = this._createModernBuilding(width, height, depth);
          }

          building.position.set(actualX, height / 2, actualZ);

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
   * Create office building with textured facade
   * @private
   */
  _createOfficeBuilding(width, height, depth) {
    const building = new THREE.Group();

    // Main body - uses textured facade material
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeometry, this.buildingTextures.office);
    building.add(body);

    // Small rooftop details
    const rooftopDetail1 = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.3, 1, depth * 0.3),
      this.rooftopMaterial
    );
    rooftopDetail1.position.set(width * 0.2, height / 2 + 0.5, depth * 0.2);
    building.add(rooftopDetail1);

    building.geometry = { parameters: { width, height, depth } };
    return building;
  }

  /**
   * Create residential building with warm colors
   * @private
   */
  _createResidentialBuilding(width, height, depth) {
    const building = new THREE.Group();

    // Main body with residential texture
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(
      bodyGeometry,
      this.buildingTextures.residential
    );
    building.add(body);

    // Add simple door detail at base
    const doorGeometry = new THREE.BoxGeometry(
      width * 0.15,
      height * 0.3,
      depth * 0.1
    );
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, height / 2 - height * 0.35, depth / 2 + 0.01);
    building.add(door);

    // Rooftop detail
    const rooftopDetail = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.4, 0.8, depth * 0.4),
      this.rooftopMaterial
    );
    rooftopDetail.position.set(-width * 0.15, height / 2 + 0.4, -depth * 0.15);
    building.add(rooftopDetail);

    building.geometry = { parameters: { width, height, depth } };
    return building;
  }

  /**
   * Create shop/commercial building with storefront
   * @private
   */
  _createShopBuilding(width, height, depth) {
    const building = new THREE.Group();

    // Main body with shop texture
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeometry, this.buildingTextures.shop);
    building.add(body);

    // Large storefront window
    const windowGeometry = new THREE.BoxGeometry(
      width * 0.7,
      height * 0.35,
      depth * 0.05
    );
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0xffeb3b });
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(0, height * 0.1, depth / 2 + 0.02);
    building.add(window);

    // Store sign frame
    const signGeometry = new THREE.BoxGeometry(
      width * 0.8,
      height * 0.15,
      depth * 0.1
    );
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, height / 2 + 0.3, depth / 2 + 0.05);
    building.add(sign);

    building.geometry = { parameters: { width, height, depth } };
    return building;
  }

  /**
   * Create modern glass-style building
   * @private
   */
  _createModernBuilding(width, height, depth) {
    const building = new THREE.Group();

    // Main body with modern glass texture
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeometry, this.buildingTextures.modern);
    building.add(body);

    // Glass reflection panels on sides (for depth effect)
    const panelMaterial = new THREE.MeshLambertMaterial({
      color: 0xcccccc,
      opacity: 0.8,
      transparent: true,
    });

    // Side panel 1
    const panel1Geometry = new THREE.PlaneGeometry(depth * 0.8, height * 0.9);
    const panel1 = new THREE.Mesh(panel1Geometry, panelMaterial);
    panel1.position.set(width / 2 + 0.01, 0, 0);
    panel1.rotation.y = -Math.PI / 2;
    building.add(panel1);

    // Side panel 2
    const panel2Geometry = new THREE.PlaneGeometry(depth * 0.8, height * 0.9);
    const panel2 = new THREE.Mesh(panel2Geometry, panelMaterial);
    panel2.position.set(-width / 2 - 0.01, 0, 0);
    panel2.rotation.y = Math.PI / 2;
    building.add(panel2);

    // Roof detail (modern style)
    const roofGeometry = new THREE.BoxGeometry(width * 1.05, 0.5, depth * 1.05);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, height / 2 + 0.25, 0);
    building.add(roof);

    building.geometry = { parameters: { width, height, depth } };
    return building;
  }

  /**
   * Create a colorful striped building like in the reference image
   * @private
   */
  _createStripedBuilding(width, height, depth) {
    const building = new THREE.Group();

    // Pick random color for this building
    const buildingColor =
      this.buildingColors[randomInt(0, this.buildingColors.length - 1)];
    const baseMaterial = new THREE.MeshLambertMaterial({
      color: buildingColor,
    });

    // Main building body
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeometry, baseMaterial);
    building.add(body);

    // Add horizontal black stripes (windows/floors)
    const stripeHeight = 1.2;
    const numStripes = Math.floor(height / 3);

    for (let i = 0; i < numStripes; i++) {
      const yPos = (i - numStripes / 2) * 3 + 1.5;

      // Front stripe
      const stripeFront = new THREE.Mesh(
        new THREE.PlaneGeometry(width + 0.1, stripeHeight),
        this.stripeMaterial
      );
      stripeFront.position.set(0, yPos, depth / 2 + 0.01);
      building.add(stripeFront);

      // Back stripe
      const stripeBack = new THREE.Mesh(
        new THREE.PlaneGeometry(width + 0.1, stripeHeight),
        this.stripeMaterial
      );
      stripeBack.position.set(0, yPos, -depth / 2 - 0.01);
      stripeBack.rotation.y = Math.PI;
      building.add(stripeBack);

      // Left stripe
      const stripeLeft = new THREE.Mesh(
        new THREE.PlaneGeometry(depth + 0.1, stripeHeight),
        this.stripeMaterial
      );
      stripeLeft.position.set(-width / 2 - 0.01, yPos, 0);
      stripeLeft.rotation.y = Math.PI / 2;
      building.add(stripeLeft);

      // Right stripe
      const stripeRight = new THREE.Mesh(
        new THREE.PlaneGeometry(depth + 0.1, stripeHeight),
        this.stripeMaterial
      );
      stripeRight.position.set(width / 2 + 0.01, yPos, 0);
      stripeRight.rotation.y = -Math.PI / 2;
      building.add(stripeRight);
    }

    // Add rooftop details (AC units, etc.)
    const rooftopDetail1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 2.5),
      this.rooftopMaterial
    );
    rooftopDetail1.position.set(-2, height / 2 + 0.5, -1);
    building.add(rooftopDetail1);

    const rooftopDetail2 = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1, 3),
      this.rooftopMaterial
    );
    rooftopDetail2.position.set(2, height / 2 + 0.5, 1.5);
    building.add(rooftopDetail2);

    // Store geometry parameters for collision detection
    building.geometry = { parameters: { width, height, depth } };

    return building;
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
