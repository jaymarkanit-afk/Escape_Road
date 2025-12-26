# Chase Escape 🚗💨

A 3D car-chase survival game built with **Three.js** using clean, modular architecture.

## 🎮 Game Overview

Outrun the police while avoiding obstacles on an infinite highway. Difficulty increases over time as enemy speed and obstacle frequency ramp up. Use your boost wisely to survive as long as possible!

## 🎯 Features

- **Infinite procedural road** with seamless segment recycling
- **Dynamic AI enemy** that adapts to player behavior
- **Obstacle system** with static and moving hazards
- **Progressive difficulty** scaling
- **Score system** with distance, survival time, and near-miss bonuses
- **Boost mechanic** with cooldown management
- **Smooth camera** following system
- **Responsive HUD** with health, score, and boost indicators

## 🏗️ Architecture

This project follows **clean software engineering principles**:

```
/src
├── core/               # Engine, rendering, game loop
│   ├── GameEngine.js
│   └── GameLoop.js
├── objects/            # Game entities (player, enemy, obstacles)
│   ├── PlayerCar.js
│   ├── EnemyChaser.js
│   ├── Road.js
│   └── Obstacle.js
├── systems/            # Game logic systems
│   ├── ObstacleSpawner.js
│   ├── CollisionSystem.js
│   ├── ScoreSystem.js
│   └── DifficultyManager.js
├── controls/           # Input and camera
│   ├── InputManager.js
│   └── CameraController.js
├── ui/                 # User interface
│   ├── HUD.js
│   └── MenuSystem.js
├── utils/              # Helpers and constants
│   ├── constants.js
│   └── helpers.js
└── main.js             # Entry point
```

### Key Design Principles

✅ **Separation of concerns** - Each module has a single responsibility  
✅ **Modular architecture** - Easy to extend and maintain  
✅ **No global state** - All state is encapsulated  
✅ **Object pooling** - Performance-optimized obstacle spawning  
✅ **Event-driven** - Callbacks for collision, scoring, and difficulty events  
✅ **Configurable** - All game parameters in `constants.js`

## 🚀 Getting Started

### Option 1: Simple HTTP Server

```bash
# Serve with Python
npm run serve
# Or use any HTTP server
python -m http.server 8000
```

Open `http://localhost:8000` in your browser.

### Option 2: Using Vite (Recommended)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🎮 Controls

| Key               | Action             |
| ----------------- | ------------------ |
| **↑ / W**         | Accelerate forward |
| **← / → / A / D** | Steer left/right   |
| **SPACE**         | Activate boost     |
| **ESC / P**       | Pause game         |

## 📦 Dependencies

- **Three.js** ^0.160.0 - 3D rendering engine
- **Vite** (dev) - Development server and build tool

## 🔧 Configuration

All game parameters are centralized in [src/utils/constants.js](src/utils/constants.js):

- Player speed, steering, boost settings
- Enemy AI behavior and aggression
- Obstacle spawn rates and types
- Difficulty progression
- Scoring multipliers
- Visual colors and camera settings

## 🎨 Extending the Game

### Adding New Obstacle Types

1. Add configuration to `OBSTACLE_CONFIG` in `constants.js`
2. Extend `Obstacle.js` with new geometry in `_createMesh()`
3. Update spawner logic in `ObstacleSpawner.js`

### Modifying Difficulty

Edit `DIFFICULTY_CONFIG.STAGES` in `constants.js` to customize:

- Enemy speed per level
- Obstacle spawn rate
- Difficulty increase intervals

### Adding Power-ups

1. Create new class in `/src/objects/PowerUp.js`
2. Add spawner in `/src/systems/PowerUpSpawner.js`
3. Handle collection in `CollisionSystem.js`

## 🐛 Debugging

The game instance is available globally as `window.game` for debugging:

```javascript
// In browser console:
window.game.player.speed = 100; // Super speed!
window.game.player.health = 100; // Full health
window.game.difficultyManager.currentLevel = 5; // Jump to level 5
```

## 📝 TODO / Future Enhancements

- [ ] Add power-ups (shield, invincibility, score multiplier)
- [ ] Implement leaderboard with localStorage
- [ ] Add sound effects and background music
- [ ] Particle effects for collisions and boosts
- [ ] Multiple vehicle options with different stats
- [ ] Day/night cycle with visual changes
- [ ] Mobile touch controls support
- [ ] Procedural building generation for scenery
- [ ] Custom shaders for road and effects

## 🤝 Contributing

This codebase is designed for team collaboration:

1. Each module is self-contained
2. Clear interfaces between systems
3. Comments explain design decisions
4. Easy to test individual components

## 📄 License

MIT License - feel free to use and modify!

---

**Built with ❤️ using Three.js and clean code principles**
