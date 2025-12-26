/**
 * Main Game Entry Point
 * Responsibility: Bootstrap and orchestrate all game systems
 * Coordinates initialization, game loop, and lifecycle management
 */

import { GameEngine } from "./core/GameEngine.js";
import { GameLoop } from "./core/GameLoop.js";
import { PlayerCar } from "./objects/PlayerCar.js";
import { EnemyChaser } from "./objects/EnemyChaser.js";
import { City } from "./objects/City.js";
import { Desert } from "./objects/Desert.js";
import { TrafficManager } from "./objects/TrafficCar.js";
import { ObstacleSpawner } from "./systems/ObstacleSpawner.js";
import { CollisionSystem } from "./systems/CollisionSystem.js";
import { ScoreSystem } from "./systems/ScoreSystem.js";
import { DifficultyManager } from "./systems/DifficultyManager.js";
import { EffectsSystem } from "./systems/EffectsSystem.js";
import { SoundSystem } from "./systems/SoundSystem.js";
import { WantedSystem } from "./systems/WantedSystem.js";
import { InputManager } from "./controls/InputManager.js";
import { CameraController } from "./controls/CameraController.js";
import { HUD } from "./ui/HUD.js";
import { MenuSystem } from "./ui/MenuSystem.js";
import { ENEMY_CONFIG, WANTED_CONFIG } from "./utils/constants.js";

/**
 * Main Game class - orchestrates all game systems
 */
class Game {
  constructor() {
    // Core systems
    this.engine = null;
    this.gameLoop = null;

    // Game objects
    this.player = null;
    this.enemies = []; // Multiple police cars
    this.city = null;
    this.desert = null;
    this.trafficManager = null;

    // Game systems
    this.obstacleSpawner = null;
    this.collisionSystem = null;
    this.scoreSystem = null;
    this.difficultyManager = null;
    this.effectsSystem = null;
    this.soundSystem = null;
    this.wantedSystem = null;

    // Controls
    this.inputManager = null;
    this.cameraController = null;

    // UI
    this.hud = null;
    this.menuSystem = null;

    // Game state
    this.isPlaying = false;
    this.isInitialized = false;
  }

  /**
   * Initialize the game
   */
  async init() {
    console.log("🎮 Initializing Chase Escape...");

    // Initialize core engine
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) {
      console.error("Canvas element not found!");
      return;
    }

    this.engine = new GameEngine(canvas);
    this.gameLoop = new GameLoop();

    // Initialize UI
    this.hud = new HUD();
    this.menuSystem = new MenuSystem();

    // Setup menu callbacks
    this.menuSystem.setOnStartGame(() => this.startGame());
    this.menuSystem.setOnResumeGame(() => this.resumeGame());
    this.menuSystem.setOnRestartGame(() => this.restartGame());

    // Initialize input
    this.inputManager = new InputManager();

    // Show main menu
    this.menuSystem.showMainMenu();
    this.hud.hide();

    this.isInitialized = true;
    console.log("✅ Game initialized successfully");
  }

  /**
   * Start a new game
   */
  startGame() {
    console.log("🚀 Starting game...");

    // Clear any existing game objects
    this._cleanupGameObjects();

    // Get scene reference
    const scene = this.engine.getScene();

    // Create game objects
    this.player = new PlayerCar(scene);
    this.city = new City(scene);
    // OPTIMIZED: Desert disabled for performance
    // this.desert = new Desert(scene);
    this.trafficManager = new TrafficManager(scene, this.city); // Pass city reference for collision

    // Create multiple enemy police cars
    this.enemies = [];
    const enemySpawnPositions = [
      { x: -30, z: 40 },
      { x: 30, z: 40 },
      { x: 0, z: 50 },
    ];

    for (let i = 0; i < ENEMY_CONFIG.INITIAL_COUNT; i++) {
      const spawnPos = enemySpawnPositions[i] || {
        x: Math.random() * 60 - 30,
        z: 40 + Math.random() * 20,
      };
      const enemy = new EnemyChaser(scene, this.player, spawnPos, this.city);
      this.enemies.push(enemy);
    }

    // Create game systems (updated for multiple enemies)
    this.obstacleSpawner = new ObstacleSpawner(scene, this.city);
    this.effectsSystem = new EffectsSystem(scene);
    this.soundSystem = new SoundSystem();
    this.collisionSystem = new CollisionSystem(
      this.player,
      this.enemies,
      this.obstacleSpawner,
      this.city,
      this.effectsSystem,
      this.soundSystem,
      this.trafficManager // Pass traffic manager for collision detection
    );
    this.scoreSystem = new ScoreSystem(this.player);
    this.difficultyManager = new DifficultyManager(
      this.enemies,
      this.obstacleSpawner
    );

    // Create wanted system for dynamic police spawning
    this.wantedSystem = new WantedSystem(
      scene,
      this.player,
      this.enemies, // Pass enemies array reference so WantedSystem can add to it
      WANTED_CONFIG,
      this.city // Pass city reference for building collision
    );

    // Setup camera controller
    this.cameraController = new CameraController(
      this.engine.getCamera(),
      this.player
    );
    this.cameraController.reset();

    // Setup collision callbacks
    this.collisionSystem.setOnPlayerHitObstacle(() => {
      console.log("💥 Hit obstacle!");
    });

    this.collisionSystem.setOnPlayerHitEnemy(() => {
      console.log("🚔 Caught by police!");
    });

    this.collisionSystem.setOnNearMiss(() => {
      this.scoreSystem.addNearMissBonus();
      console.log("✨ Near miss bonus!");
    });

    // Setup difficulty increase callback
    this.difficultyManager.setOnDifficultyIncrease((level) => {
      console.log(`⬆️ Difficulty increased to level ${level}`);
    });

    // Register update callbacks with game loop
    this.gameLoop.clearCallbacks();
    this.gameLoop.registerUpdate((deltaTime) => this._update(deltaTime));
    this.gameLoop.registerRender(() => this._render());

    // Start game loop
    this.gameLoop.start();
    this.isPlaying = true;

    // Show HUD
    this.hud.show();

    console.log("✅ Game started");
  }

  /**
   * Main update function - called every frame
   * @private
   */
  _update(deltaTime) {
    // Check for pause input
    if (this.inputManager.getPausePressed()) {
      this.pauseGame();
      return;
    }

    // Update input state
    const input = this.inputManager.getInput();
    this.player.setInput(input);

    // Update game objects
    this.player.update(deltaTime);

    // Keep world tiling aligned to player for endless effect
    if (this.city) {
      this.city.update(this.player.getPosition());
    }

    // Update all enemies
    this.enemies.forEach((enemy) => enemy.update(deltaTime));

    // Update traffic system
    if (this.trafficManager) {
      this.trafficManager.update(deltaTime);
    }

    // Update systems
    this.obstacleSpawner.update(deltaTime, this.player.getPosition().z);
    this.collisionSystem.update(deltaTime);
    this.scoreSystem.update(deltaTime);
    this.difficultyManager.update(deltaTime);
    this.effectsSystem.update(deltaTime);
    this.wantedSystem.update(deltaTime); // Update wanted system for dynamic police spawning

    // Update camera
    this.cameraController.update(deltaTime);

    // Update HUD
    this._updateHUD();

    // Check for game over
    if (!this.player.isAlive) {
      this.gameOver();
    }
  }

  /**
   * Render function - called every frame
   * @private
   */
  _render() {
    this.engine.render();
  }

  /**
   * Update HUD with current game state
   * @private
   */
  _updateHUD() {
    this.hud.update({
      score: this.scoreSystem.getTotalScore(),
      health: this.player.getHealthPercent(),
      boostReady: this.player.canBoost(),
      wantedLevel: this.wantedSystem.getWantedLevel(), // Pass wanted level to HUD
    });
  }

  /**
   * Pause the game
   */
  pauseGame() {
    if (!this.isPlaying) return;

    this.gameLoop.pause();
    this.menuSystem.showPauseMenu();
    this.hud.hide();

    console.log("⏸️ Game paused");
  }

  /**
   * Resume the game
   */
  resumeGame() {
    this.gameLoop.resume();
    this.menuSystem.hidePauseMenu();
    this.hud.show();

    console.log("▶️ Game resumed");
  }

  /**
   * Handle game over
   */
  gameOver() {
    console.log("☠️ Game Over");

    this.isPlaying = false;
    this.gameLoop.stop();

    // Get final statistics
    const stats = this.scoreSystem.getStatistics();

    // Show game over menu with stats
    this.menuSystem.showGameOverMenu(stats);
    this.hud.hide();
  }

  /**
   * Restart the game
   */
  restartGame() {
    console.log("🔄 Restarting game...");
    this.startGame();
  }

  /**
   * Cleanup game objects
   * @private
   */
  _cleanupGameObjects() {
    if (this.player) this.player.dispose();

    // Cleanup all enemies
    if (this.enemies) {
      this.enemies.forEach((enemy) => enemy.dispose());
      this.enemies = [];
    }

    if (this.city) this.city.dispose();
    if (this.desert) this.desert.dispose();
    if (this.trafficManager) this.trafficManager.dispose();
    if (this.obstacleSpawner) this.obstacleSpawner.dispose();
  }

  /**
   * Cleanup and dispose of all resources
   */
  dispose() {
    console.log("🧹 Cleaning up game...");

    if (this.gameLoop) this.gameLoop.stop();

    this._cleanupGameObjects();

    if (this.inputManager) this.inputManager.dispose();
    if (this.hud) this.hud.dispose();
    if (this.menuSystem) this.menuSystem.dispose();
    if (this.engine) this.engine.dispose();

    console.log("✅ Game cleaned up");
  }
}

/**
 * Initialize and start the game when DOM is ready
 */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🎮 Chase Escape - Loading...");

  const game = new Game();
  await game.init();

  // Make game instance globally accessible for debugging
  window.game = game;
});

export default Game;
