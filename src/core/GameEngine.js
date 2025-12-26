/**
 * GameEngine - Core Three.js Setup
 * Responsibility: Initialize renderer, handle window resize, provide scene access
 * Single responsibility: Rendering infrastructure only
 */

import * as THREE from "three";
import { GAME_CONFIG, COLORS } from "../utils/constants.js";

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;

    this._initRenderer();
    this._initCamera();
    this._initLighting();
    this._setupResizeHandler();
  }

  /**
   * Initialize the WebGL renderer
   */
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });

    // Fullscreen canvas
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // DISABLED for performance

    this.scene.background = new THREE.Color(COLORS.SKY);
    this.scene.fog = new THREE.Fog(COLORS.SKY, 50, 150);
  }

  /**
   * Initialize the perspective camera
   */
  _initCamera() {
    const aspect = window.innerWidth / window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.FOV,
      aspect,
      GAME_CONFIG.NEAR_PLANE,
      GAME_CONFIG.FAR_PLANE
    );

    // Initial camera position (isometric view)
    this.camera.position.set(
      GAME_CONFIG.CAMERA_OFFSET.x,
      GAME_CONFIG.CAMERA_OFFSET.y,
      GAME_CONFIG.CAMERA_OFFSET.z
    );
  }

  /**
   * Setup scene lighting
   */
  _initLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Directional light (sun) for proper shading - NO SHADOWS for performance
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = false; // Disabled for performance
    this.scene.add(directionalLight);

    // Hemisphere light for sky/ground color variation
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x5a7a4a, 0.3);
    this.scene.add(hemisphereLight);
  }

  /**
   * Handle window resize events
   */
  _setupResizeHandler() {
    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  /**
   * Render the current frame
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get the scene (for adding/removing objects)
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get the camera (for external manipulation)
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.renderer.dispose();
    window.removeEventListener("resize", this._setupResizeHandler);
  }
}
