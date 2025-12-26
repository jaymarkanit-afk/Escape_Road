# Chase Escape - Project Structure

This document explains the modular architecture of the game.

## 📁 Project Structure

```
/Project
├── index.html              # Entry HTML file
├── package.json            # Dependencies and scripts
├── README.md               # Project documentation
└── src/
    ├── main.js             # Main entry point - orchestrates all systems
    ├── core/               # Core engine components
    │   ├── GameEngine.js   # Three.js setup, renderer, scene, lighting
    │   └── GameLoop.js     # Fixed timestep game loop
    ├── objects/            # Game entities
    │   ├── PlayerCar.js    # Player vehicle with physics and boost
    │   ├── EnemyChaser.js  # AI-controlled police car
    │   ├── Road.js         # Infinite scrolling road system
    │   └── Obstacle.js     # Obstacle entities (static/moving)
    ├── systems/            # Game logic systems
    │   ├── ObstacleSpawner.js   # Manages obstacle lifecycle with pooling
    │   ├── CollisionSystem.js   # AABB collision detection
    │   ├── ScoreSystem.js       # Scoring and statistics tracking
    │   └── DifficultyManager.js # Progressive difficulty scaling
    ├── controls/           # Input and camera
    │   ├── InputManager.js      # Keyboard input handling
    │   └── CameraController.js  # Smooth camera following
    ├── ui/                 # User interface
    │   ├── HUD.js          # Heads-up display overlay
    │   └── MenuSystem.js   # Main menu, pause, game over screens
    └── utils/              # Shared utilities
        ├── constants.js    # Game configuration constants
        └── helpers.js      # Utility functions and helpers
```

## 🧩 Module Responsibilities

### Core (`/src/core/`)

**GameEngine.js**

- Initializes Three.js renderer, camera, and scene
- Sets up lighting (ambient, directional, hemisphere)
- Handles window resize events
- Provides clean interfaces to scene and camera

**GameLoop.js**

- Manages requestAnimationFrame loop
- Fixed timestep for physics stability
- Registers update and render callbacks
- Handles pause/resume functionality
- FPS tracking

### Objects (`/src/objects/`)

**PlayerCar.js**

- Player physics (speed, steering, acceleration)
- Boost mechanic with cooldown
- Health system
- Input state management
- Bounding box collision interface

**EnemyChaser.js**

- Pursuit AI that adapts to player position
- Dynamic speed based on distance
- Lane following behavior
- Difficulty scaling support

**Road.js**

- Infinite scrolling road segments
- Object pooling for performance
- Lane marker generation
- Ground plane management
- Segment recycling system

**Obstacle.js**

- Poolable obstacle entities
- Multiple types (barrel, cone, static, moving)
- Active/inactive state management
- Bounding box collision interface

### Systems (`/src/systems/`)

**ObstacleSpawner.js**

- Manages obstacle lifecycle
- Object pooling for each obstacle type
- Difficulty-based spawn rate
- Automatic cleanup of off-screen obstacles

**CollisionSystem.js**

- AABB collision detection
- Player vs obstacle detection
- Player vs enemy detection
- Near-miss detection for bonuses
- Collision callbacks for game events

**ScoreSystem.js**

- Distance-based scoring
- Survival time tracking
- Bonus point management
- Statistics aggregation

**DifficultyManager.js**

- Time-based difficulty progression
- Coordinates difficulty across systems
- Enemy speed scaling
- Obstacle spawn rate adjustment

### Controls (`/src/controls/`)

**InputManager.js**

- Keyboard event handling
- Input state management
- Decouples input from game logic
- Configurable key bindings

**CameraController.js**

- Smooth camera following
- Configurable offset and look-ahead
- Interpolated position updates
- Independent of player logic

### UI (`/src/ui/`)

**HUD.js**

- Score, time, health display
- Boost indicator
- Speed and difficulty level
- Dynamic DOM element creation
- Health bar with color coding

**MenuSystem.js**

- Main menu screen
- Pause menu
- Game over screen with statistics
- Menu navigation callbacks
- Styled UI components

### Utils (`/src/utils/`)

**constants.js**

- Centralized configuration
- Game balance parameters
- Visual settings (colors, camera)
- Input key mappings
- Easy tuning without code changes

**helpers.js**

- Math utilities (clamp, lerp, map, random)
- Collision detection (AABB)
- Formatting functions (score, time)
- EventEmitter for pub/sub
- ObjectPool for performance

## 🔄 Data Flow

```
Input → InputManager → PlayerCar → Physics Update
                                ↓
                         CameraController
                                ↓
                         GameEngine.render()

Spawner → Obstacles → CollisionSystem → Events → ScoreSystem
                                              ↓
                                         DifficultyManager
```

## 🎯 Design Patterns Used

1. **Module Pattern** - Each file is a self-contained module
2. **Observer Pattern** - Callbacks for events (collisions, scoring)
3. **Object Pooling** - Reuse obstacles instead of creating/destroying
4. **Strategy Pattern** - Different obstacle behaviors
5. **Singleton-like** - Game instance orchestrates all systems
6. **Composition** - Systems composed rather than inherited

## 🔧 Extension Points

### Adding New Features

**New Game Object:**

1. Create class in `/src/objects/`
2. Add to scene in `main.js`
3. Register update in game loop

**New System:**

1. Create class in `/src/systems/`
2. Initialize in `main.js`
3. Register callbacks if needed

**New UI Element:**

1. Add to `HUD.js` or create new UI module
2. Update in main game loop

**Configuration Change:**

1. Edit values in `constants.js`
2. No code changes needed

## 📊 Performance Considerations

- **Object Pooling** reduces garbage collection
- **Fixed Timestep** ensures consistent physics
- **Segment Recycling** for infinite road
- **Bounding Box** instead of mesh-level collision
- **Minimal DOM updates** in HUD

## 🧪 Testing Strategy

Each module can be tested independently:

```javascript
// Test PlayerCar physics
const player = new PlayerCar(scene);
player.setInput({ forward: true });
player.update(0.016);
console.log(player.speed); // Should increase

// Test collision detection
const box1 = player.getBoundingBox();
const box2 = obstacle.getBoundingBox();
const collision = checkAABBCollision(box1, box2);
```

## 🎓 Learning Path

For new developers joining the project:

1. Start with `constants.js` - understand configuration
2. Read `helpers.js` - learn utility functions
3. Study `GameEngine.js` - see Three.js setup
4. Examine `PlayerCar.js` - game object pattern
5. Review `main.js` - see how systems connect

---

**This architecture ensures maintainability, extensibility, and team collaboration.**
