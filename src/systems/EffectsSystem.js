/**
 * EffectsSystem - Visual effects and particle system
 * Responsibility: Manage collision effects, particle explosions, smoke trails
 */

import * as THREE from "three";

export class EffectsSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.activeEffects = [];
  }

  /**
   * Create collision explosion effect
   */
  createCollisionEffect(position, intensity = 1.0) {
    const particleCount = Math.floor(15 * intensity);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 1, 0.5),
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      // Random velocity
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 10
      );

      particle.life = 1.0;
      particle.decay = Math.random() * 0.5 + 0.5;

      this.scene.add(particle);
      particles.push(particle);
    }

    this.activeEffects.push({
      type: "explosion",
      particles,
      age: 0,
    });
  }

  /**
   * Create smoke trail effect
   */
  createSmokeTrail(position) {
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.4,
    });

    const smoke = new THREE.Mesh(geometry, material);
    smoke.position.copy(position);
    smoke.position.y += 0.5;

    smoke.life = 1.0;
    smoke.decay = 1.5;
    smoke.scale.set(1, 1, 1);

    this.scene.add(smoke);
    this.particles.push(smoke);
  }

  /**
   * Create sparks effect
   */
  createSparks(position, direction) {
    const sparkCount = 8;

    for (let i = 0; i < sparkCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 1,
      });

      const spark = new THREE.Mesh(geometry, material);
      spark.position.copy(position);

      const angle = (Math.PI * 2 * i) / sparkCount;
      spark.velocity = new THREE.Vector3(
        Math.cos(angle) * 5 + direction.x * 2,
        Math.random() * 3 + 1,
        Math.sin(angle) * 5 + direction.z * 2
      );

      spark.life = 0.6;
      spark.decay = 3;

      this.scene.add(spark);
      this.particles.push(spark);
    }
  }

  /**
   * Create damage indicator
   */
  createDamageIndicator(position, damage) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`-${damage}`, 64, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 2;
    sprite.scale.set(2, 1, 1);

    sprite.life = 1.0;
    sprite.decay = 1.0;
    sprite.velocity = new THREE.Vector3(0, 2, 0);

    this.scene.add(sprite);
    this.particles.push(sprite);
  }

  /**
   * Update all effects
   */
  update(deltaTime) {
    // Update explosion effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.age += deltaTime;

      let allDead = true;
      for (const particle of effect.particles) {
        if (particle.life > 0) {
          allDead = false;

          // Update position
          particle.position.add(
            particle.velocity.clone().multiplyScalar(deltaTime)
          );

          // Apply gravity
          particle.velocity.y -= 15 * deltaTime;

          // Fade out
          particle.life -= particle.decay * deltaTime;
          particle.material.opacity = Math.max(0, particle.life);

          // Scale down
          const scale = particle.life;
          particle.scale.set(scale, scale, scale);
        }
      }

      if (allDead || effect.age > 3) {
        effect.particles.forEach((p) => {
          this.scene.remove(p);
          p.geometry.dispose();
          p.material.dispose();
        });
        this.activeEffects.splice(i, 1);
      }
    }

    // Update individual particles (smoke, sparks, etc)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      if (particle.life <= 0) {
        this.scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      if (particle.velocity) {
        particle.position.add(
          particle.velocity.clone().multiplyScalar(deltaTime)
        );
        particle.velocity.y -= 10 * deltaTime; // Gravity
      } else {
        particle.position.y += deltaTime * 2;
      }

      // Fade out
      particle.life -= particle.decay * deltaTime;
      particle.material.opacity = Math.max(0, particle.life * 0.5);

      // Scale up smoke
      if (!particle.velocity) {
        const scale = 1 + (1 - particle.life) * 2;
        particle.scale.set(scale, scale, scale);
      }
    }
  }

  /**
   * Dispose all effects
   */
  dispose() {
    this.activeEffects.forEach((effect) => {
      effect.particles.forEach((p) => {
        this.scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
      });
    });

    this.particles.forEach((p) => {
      this.scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    });

    this.activeEffects = [];
    this.particles = [];
  }
}
