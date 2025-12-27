/**
 * HUD - Heads-Up Display
 * Responsibility: Render game UI overlay (score, health, boost, etc.)
 * Updates DOM elements with game state information
 */

import { formatScore } from "../utils/helpers.js";

export class HUD {
  constructor() {
    // Create HUD container
    this.container = document.getElementById("hud");
    if (!this.container) {
      this._createHUDContainer();
    }

    // HUD elements (will be created in _createElements)
    this.elements = {};
    this._createElements();
  }

  /**
   * Create main HUD container
   * @private
   */
  _createHUDContainer() {
    this.container = document.createElement("div");
    this.container.id = "hud";
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: 'Arial', sans-serif;
      color: white;
      z-index: 100;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Create HUD UI elements
   * @private
   */
  _createElements() {
    // Score display (top center)
    this.elements.score = this._createElement(
      "div",
      `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 36px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      `,
      "SCORE: 0"
    );

    // Boost indicator (bottom center)
    this.elements.boost = this._createElement(
      "div",
      `
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 20px;
        padding: 10px 20px;
        background: rgba(0,0,0,0.6);
        border: 2px solid #FFD700;
        border-radius: 10px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      `,
      "⚡ BOOST READY"
    );

    // Wanted level stars (top left) - GTA style
    this.elements.wantedContainer = this._createElement(
      "div",
      `
        position: absolute;
        top: 20px;
        left: 20px;
        font-size: 16px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      `
    );

    this.elements.wantedLabel = this._createElement(
      "div",
      `
        font-size: 14px;
        margin-bottom: 5px;
        font-weight: bold;
      `,
      "WANTED LEVEL"
    );
    this.elements.wantedContainer.appendChild(this.elements.wantedLabel);

    this.elements.wantedStars = this._createElement(
      "div",
      `
        font-size: 28px;
        letter-spacing: 4px;
        color: #FFD700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.8),
                     2px 2px 4px rgba(0,0,0,0.8);
      `,
      "★"
    );
    this.elements.wantedContainer.appendChild(this.elements.wantedStars);

    // Controls hint (bottom center, fades out)
    this.elements.controls = this._createElement(
      "div",
      `
        position: absolute;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 14px;
        text-align: center;
        background: rgba(0,0,0,0.7);
        padding: 15px;
        border-radius: 8px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        opacity: 1;
        transition: opacity 2s ease;
      `,
      "↑/W: Forward | ←/→/A/D: Steer | SPACE: Boost | ESC: Pause"
    );

    // Fade out controls hint after 5 seconds
    setTimeout(() => {
      this.elements.controls.style.opacity = "0";
      setTimeout(() => {
        this.elements.controls.style.display = "none";
      }, 2000);
    }, 5000);
  }

  /**
   * Helper to create a DOM element
   * @private
   */
  _createElement(tag, styleString, innerHTML = "") {
    const element = document.createElement(tag);
    element.style.cssText = styleString;
    element.innerHTML = innerHTML;
    this.container.appendChild(element);
    return element;
  }

  /**
   * Update HUD with current game state
   * @param {Object} gameState - Object containing score, time, etc.
   */
  update(gameState) {
    // Update score
    if (gameState.score !== undefined) {
      this.elements.score.innerHTML = `SCORE: ${formatScore(gameState.score)}`;
    }

    // Update boost indicator
    if (gameState.boostReady !== undefined) {
      if (gameState.boostReady) {
        this.elements.boost.innerHTML = "⚡ BOOST READY";
        this.elements.boost.style.borderColor = "#FFD700";
        this.elements.boost.style.color = "#FFD700";
      } else {
        this.elements.boost.innerHTML = "⚡ BOOST COOLDOWN";
        this.elements.boost.style.borderColor = "#666";
        this.elements.boost.style.color = "#666";
      }
    }

    // Update wanted level stars (GTA-style)
    if (gameState.wantedLevel !== undefined) {
      const level = Math.max(1, Math.min(5, gameState.wantedLevel));
      const filledStars = "★".repeat(level);
      const emptyStars = "☆".repeat(5 - level);
      this.elements.wantedStars.innerHTML = filledStars + emptyStars;
    }
  }

  /**
   * Show HUD
   */
  show() {
    this.container.style.display = "block";
  }

  /**
   * Hide HUD
   */
  hide() {
    this.container.style.display = "none";
  }

  /**
   * Cleanup HUD
   */
  dispose() {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
