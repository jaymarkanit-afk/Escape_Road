/**
 * InputManager - Handles keyboard input
 * Responsibility: Capture keyboard events and provide input state to player
 * Decouples input handling from player logic
 */

import { INPUT_KEYS } from "../utils/constants.js";

export class InputManager {
  constructor() {
    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      boost: false,
      pause: false,
    };

    // Track key press for toggle actions
    this.lastPauseState = false;

    // Bind event handlers
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    // Attach listeners
    this._attachListeners();
  }

  /**
   * Attach keyboard event listeners
   * @private
   */
  _attachListeners() {
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  /**
   * Handle keydown events
   * @private
   */
  _onKeyDown(event) {
    const key = event.key;

    // Prevent default for game keys
    if (this._isGameKey(key)) {
      event.preventDefault();
    }

    // Update input state
    if (INPUT_KEYS.FORWARD.includes(key)) {
      this.keys.forward = true;
    }
    if (INPUT_KEYS.BACKWARD.includes(key)) {
      this.keys.backward = true;
    }
    if (INPUT_KEYS.LEFT.includes(key)) {
      this.keys.left = true;
    }
    if (INPUT_KEYS.RIGHT.includes(key)) {
      this.keys.right = true;
    }
    if (INPUT_KEYS.BOOST.includes(key)) {
      this.keys.boost = true;
    }
    if (INPUT_KEYS.PAUSE.includes(key)) {
      this.keys.pause = true;
    }
  }

  /**
   * Handle keyup events
   * @private
   */
  _onKeyUp(event) {
    const key = event.key;

    // Update input state
    if (INPUT_KEYS.FORWARD.includes(key)) {
      this.keys.forward = false;
    }
    if (INPUT_KEYS.BACKWARD.includes(key)) {
      this.keys.backward = false;
    }
    if (INPUT_KEYS.LEFT.includes(key)) {
      this.keys.left = false;
    }
    if (INPUT_KEYS.RIGHT.includes(key)) {
      this.keys.right = false;
    }
    if (INPUT_KEYS.BOOST.includes(key)) {
      this.keys.boost = false;
    }
    if (INPUT_KEYS.PAUSE.includes(key)) {
      this.keys.pause = false;
    }
  }

  /**
   * Check if key is a game control key
   * @private
   */
  _isGameKey(key) {
    return (
      INPUT_KEYS.FORWARD.includes(key) ||
      INPUT_KEYS.BACKWARD.includes(key) ||
      INPUT_KEYS.LEFT.includes(key) ||
      INPUT_KEYS.RIGHT.includes(key) ||
      INPUT_KEYS.BOOST.includes(key) ||
      INPUT_KEYS.PAUSE.includes(key)
    );
  }

  /**
   * Get current input state
   */
  getInput() {
    return { ...this.keys };
  }

  /**
   * Check if pause was just pressed (for toggle behavior)
   */
  getPausePressed() {
    const pressed = this.keys.pause && !this.lastPauseState;
    this.lastPauseState = this.keys.pause;
    return pressed;
  }

  /**
   * Reset input state
   */
  reset() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      boost: false,
      pause: false,
    };
    this.lastPauseState = false;
  }

  /**
   * Cleanup event listeners
   */
  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }
}
