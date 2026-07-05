/* ==========================================================================
   Entités du Jeu — Joueur, Ennemis, Boss, Projectiles, Particules
   Physique, collisions, animations et comportements IA
   ========================================================================== */

// =====================================================================
//  CLASSE JOUEUR
// =====================================================================

class Player {
    constructor(x, y, name) {
        this.name = name || 'Héros';
        this.x = x;
        this.y = y;
        this.w = 14;   // Hitbox (un peu plus petite que le sprite 16px)
        this.h = 22;   // Hitbox (un peu plus petite que le sprite 24px)
        this.sprW = 16; // Taille du sprite
        this.sprH = 24;

        // Physique
        this.vx = 0;
        this.vy = 0;
        this.speed = 130;
        this.jumpForce = -340;
        this.gravity = 600;
        this.maxFallSpeed = 300;
        this.onGround = false;
        this.facingRight = true;

        // Stats
        this.maxHP = 5;
        this.hp = 5;
        this.score = 0;
        this.coins = 0;

        // Combat
        this.attackCooldown = 0;
        this.attackDuration = 0;
        this.attackRange = 18;
        this.attackDamage = 1;
        this.invincible = 0; // Temps d'invincibilité restant

        // Animation
        this.animation = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.12; // Secondes par frame
        this.deathTimer = 0;
        this.isDead = false;
    }

    /**
     * Mise à jour du joueur
     */
    update(dt, levelData) {
        if (this.isDead) {
            this.deathTimer += dt;
            this.animTimer += dt;
            if (this.animTimer >= 0.2) {
                this.animTimer = 0;
                this.animFrame = Math.min(this.animFrame + 1, 3);
            }
            return;
        }

        // Réduire les timers
        if (this.invincible > 0) this.invincible -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.attackDuration > 0) {
            this.attackDuration -= dt;
            if (this.attackDuration <= 0) {
                this.animation = 'idle';
            }
        }

        // --- Mouvement horizontal ---
        const prevVx = this.vx;
        this.vx = 0;
        if (this.attackDuration <= 0) {
            if (InputManager.left) {
                this.vx = -this.speed;
                this.facingRight = false;
            }
            if (InputManager.right) {
                this.vx = this.speed;
                this.facingRight = true;
            }
        }

        // --- Saut ---
        if (InputManager.jump && this.onGround && this.attackDuration <= 0) {
            this.vy = this.jumpForce;
            this.onGround = false;
            AudioManager.sfxJump();
        }

        // --- Attaque ---
        if (InputManager.attack && this.attackCooldown <= 0 && this.attackDuration <= 0) {
            this.attackDuration = 0.3;
            this.attackCooldown = 0.5;
            this.animation = 'attack';
            this.animFrame = 0;
            this.animTimer = 0;
            AudioManager.sfxAttack();
        }

        // --- Gravité ---
        this.vy += this.gravity * dt;
        if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;

        // --- Déplacement + collisions ---
        this.moveWithCollision(dt, levelData);

        // --- Animation ---
        this.updateAnimation(dt);

        // --- Vérifier les dangers (pics) ---
        this.checkDangers(levelData);

        // --- Chute dans le vide ---
        if (this.y > levelData.pixelHeight + 32) {
            if (!this.isDead) {
                this.hp = 0;
                this.isDead = true;
                this.animation = 'death';
                this.animFrame = 0;
                this.animTimer = 0;
                AudioManager.sfxDeath();
            }
        }
    }

    /**
     * Déplacement avec détection de collisions AABB
     */
    moveWithCollision(dt, levelData) {
        const ts = LevelManager.TILE_SIZE;
        const grid = levelData.grid;

        // Mouvement horizontal
        this.x += this.vx * dt;
        // Collision horizontale
        if (this.vx > 0) {
            const rightEdge = this.x + this.w;
            const tx = Math.floor(rightEdge / ts);
            const ty1 = Math.floor(this.y / ts);
            const ty2 = Math.floor((this.y + this.h - 1) / ts);
            for (let ty = ty1; ty <= ty2; ty++) {
                if (LevelManager.isSolid(grid, tx, ty)) {
                    this.x = tx * ts - this.w;
                    this.vx = 0;
                    break;
                }
            }
        } else if (this.vx < 0) {
            const leftEdge = this.x;
            const tx = Math.floor(leftEdge / ts);
            const ty1 = Math.floor(this.y / ts);
            const ty2 = Math.floor((this.y + this.h - 1) / ts);
            for (let ty = ty1; ty <= ty2; ty++) {
                if (LevelManager.isSolid(grid, tx, ty)) {
                    this.x = (tx + 1) * ts;
                    this.vx = 0;
                    break;
                }
            }
        }

        // Mouvement vertical
        const prevY = this.y;
        this.y += this.vy * dt;
        this.onGround = false;

        if (this.vy > 0) {
            // Chute — vérifier le sol et les plateformes
            const bottomEdge = this.y + this.h;
            const ty = Math.floor(bottomEdge / ts);
            const tx1 = Math.floor(this.x / ts);
            const tx2 = Math.floor((this.x + this.w - 1) / ts);
            for (let tx = tx1; tx <= tx2; tx++) {
                if (LevelManager.isSolid(grid, tx, ty)) {
                    this.y = ty * ts - this.h;
                    this.vy = 0;
                    this.onGround = true;
                    break;
                }
                // Plateformes : solides seulement si on tombe dessus par le haut
                if (LevelManager.isPlatform(grid, tx, ty)) {
                    const prevBottom = prevY + this.h;
                    if (prevBottom <= ty * ts + 2) {
                        this.y = ty * ts - this.h;
                        this.vy = 0;
                        this.onGround = true;
                        break;
                    }
                }
            }
        } else if (this.vy < 0) {
            // Montée — vérifier le plafond
            const topEdge = this.y;
            const ty = Math.floor(topEdge / ts);
            const tx1 = Math.floor(this.x / ts);
            const tx2 = Math.floor((this.x + this.w - 1) / ts);
            for (let tx = tx1; tx <= tx2; tx++) {
                if (LevelManager.isSolid(grid, tx, ty)) {
                    this.y = (ty + 1) * ts;
                    this.vy = 0;
                    break;
                }
            }
        }

        // Limites horizontales
        if (this.x < LevelManager.TILE_SIZE) this.x = LevelManager.TILE_SIZE;
        if (this.x + this.w > levelData.pixelWidth - LevelManager.TILE_SIZE) {
            this.x = levelData.pixelWidth - LevelManager.TILE_SIZE - this.w;
        }
    }

    /**
     * Vérifier les tuiles dangereuses (pics)
     */
    checkDangers(levelData) {
        if (this.invincible > 0) return;
        const ts = LevelManager.TILE_SIZE;
        const grid = levelData.grid;
        const tx1 = Math.floor(this.x / ts);
        const tx2 = Math.floor((this.x + this.w - 1) / ts);
        const ty1 = Math.floor(this.y / ts);
        const ty2 = Math.floor((this.y + this.h - 1) / ts);
        for (let ty = ty1; ty <= ty2; ty++) {
            for (let tx = tx1; tx <= tx2; tx++) {
                if (LevelManager.isDangerous(grid, tx, ty)) {
                    this.takeDamage(1);
                    return;
                }
            }
        }
    }

    /**
     * Recevoir des dégâts
     */
    takeDamage(amount) {
        if (this.invincible > 0 || this.isDead) return;
        
        // Mode Créatif : Le joueur ne perd aucun PV
        if (this.creativeMode) {
            return;
        }

        this.hp -= amount;
        this.invincible = 1.0; // 1 seconde d'invincibilité
        this.animation = 'hit';
        this.animFrame = 0;
        this.animTimer = 0;
        AudioManager.sfxPlayerHit();

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.animation = 'death';
            this.animFrame = 0;
            this.animTimer = 0;
            AudioManager.sfxDeath();
        }
    }

    /**
     * Récupérer des PV
     */
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHP);
    }

    /**
     * Obtenir la hitbox d'attaque
     */
    getAttackBox() {
        if (this.attackDuration <= 0) return null;
        const atkW = this.attackRange;
        const atkH = 14;
        if (this.facingRight) {
            return {
                x: this.x + this.w,
                y: this.y + 4,
                w: atkW,
                h: atkH,
            };
        } else {
            return {
                x: this.x - atkW,
                y: this.y + 4,
                w: atkW,
                h: atkH,
            };
        }
    }

    /**
     * Mettre à jour l'animation
     */
    updateAnimation(dt) {
        if (this.attackDuration > 0) {
            // Animation d'attaque gérée séparément
            this.animTimer += dt;
            if (this.animTimer >= 0.075) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
            return;
        }

        if (this.animation === 'hit') {
            this.animTimer += dt;
            if (this.animTimer >= 0.15) {
                this.animTimer = 0;
                this.animFrame++;
                if (this.animFrame >= 2) {
                    this.animation = 'idle';
                    this.animFrame = 0;
                }
            }
            return;
        }

        // Déterminer l'animation en cours
        if (!this.onGround) {
            this.animation = this.vy < 0 ? 'jump' : 'fall';
        } else if (this.vx !== 0) {
            this.animation = 'run';
        } else {
            this.animation = 'idle';
        }

        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animTimer = 0;
            const frames = SpriteManager.sprites.hero.right[this.animation];
            if (frames && frames.length > 0) {
                this.animFrame = (this.animFrame + 1) % frames.length;
            }
        }
    }

    /**
     * Dessiner le joueur
     */
    render(ctx, cameraX, cameraY) {
        const dir = this.facingRight ? 'right' : 'left';
        const heroSprites = SpriteManager.sprites.hero[dir];
        const frames = heroSprites[this.animation];
        if (!frames || frames.length === 0) return;

        const frame = frames[this.animFrame % frames.length];
        const dx = Math.floor(this.x - cameraX - 42); // Centrage horizontal (sprite 100x55 vs hitbox 14x22)
        const dy = Math.floor(this.y - cameraY - 33); // Alignement des pieds

        // Clignotement d'invincibilité
        if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.drawImage(frame, dx, dy);
        ctx.globalAlpha = 1;
    }
}

// =====================================================================
//  CLASSE ENNEMI
// =====================================================================

class Enemy {
    constructor(data) {
        this.type = data.type;
        this.x = data.x;
        this.y = data.y;

        if (this.type === 'slime') {
            this.w = 14;
            this.h = 14;
            this.sprW = 16;
            this.sprH = 16;
        } else {
            this.w = 28;
            this.h = 28;
            this.sprW = 32;
            this.sprH = 32;
            this.y -= 14; // On remonte l'ennemi pour qu'il n'apparaisse pas encastré dans le sol
        }

        this.hp = data.hp || 1;
        this.maxHP = this.hp;
        this.damage = data.damage || 1;
        this.speed = this.getTypeSpeed();
        this.flying = data.flying || false;

        // Patrouille
        this.startX = data.x;
        this.patrolRange = data.patrolRange || 48;
        this.direction = 1; // 1 = droite, -1 = gauche
        this.vx = 0;
        this.vy = 0;

        // Animation
        this.animation = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;

        // Combat
        this.hitTimer = 0;
        this.isDead = false;
        this.deathTimer = 0;

        // IA
        this.aiTimer = 0;
        this.attackCooldown = 0;
        this.sineOffset = Math.random() * Math.PI * 2; // Pour le vol sinusoïdal
    }

    getTypeSpeed() {
        const speeds = { slime: 25, skeleton: 35, bat: 45, mage: 20, golem: 15 };
        return speeds[this.type] || 30;
    }

    update(dt, levelData, player) {
        if (this.isDead) {
            this.deathTimer += dt;
            this.animTimer += dt;
            if (this.animTimer >= 0.15) {
                this.animTimer = 0;
                this.animFrame = Math.min(this.animFrame + 1, 2);
            }
            return this.deathTimer < 0.6; // false = à supprimer
        }

        if (this.hitTimer > 0) {
            this.hitTimer -= dt;
            this.animation = 'hit';
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // IA selon le type
        this.aiTimer += dt;
        this.updateAI(dt, levelData, player);

        // Physique
        if (!this.flying) {
            this.vy += 400 * dt; // Gravité
            if (this.vy > 250) this.vy = 250;
        }

        // Déplacement
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Collision avec le sol (simplifié)
        if (!this.flying) {
            const ts = LevelManager.TILE_SIZE;
            const grid = levelData.grid;
            const bottomTY = Math.floor((this.y + this.h) / ts);
            const tx = Math.floor((this.x + this.w / 2) / ts);
            if (LevelManager.isSolid(grid, tx, bottomTY) ||
                LevelManager.isPlatform(grid, tx, bottomTY)) {
                this.y = bottomTY * ts - this.h;
                this.vy = 0;
            }
        }

        // Animation
        this.animTimer += dt;
        if (this.animTimer >= 0.15) {
            this.animTimer = 0;
            const sprites = SpriteManager.sprites.enemies[this.type];
            if (sprites && sprites[this.animation]) {
                this.animFrame = (this.animFrame + 1) % sprites[this.animation].length;
            }
        }

        return true;
    }

    updateAI(dt, levelData, player) {
        if (this.hitTimer > 0) return;

        const distToPlayer = Math.abs(player.x - this.x);
        const playerInRange = distToPlayer < 120;

        switch (this.type) {
            case 'slime':
                // Patrouille simple avec petits sauts
                this.animation = 'walk';
                this.vx = this.speed * this.direction;
                if (this.x > this.startX + this.patrolRange) this.direction = -1;
                if (this.x < this.startX - this.patrolRange) this.direction = 1;
                // Petit saut périodique
                if (Math.floor(this.aiTimer * 2) % 3 === 0 && this.vy === 0) {
                    this.vy = -80;
                }
                break;

            case 'skeleton':
                // Patrouille, charge vers le joueur si proche
                if (playerInRange && !player.isDead) {
                    this.direction = player.x > this.x ? 1 : -1;
                    this.vx = this.speed * 1.5 * this.direction;
                    this.animation = 'walk';
                    if (distToPlayer < 20 && this.attackCooldown <= 0) {
                        this.animation = 'attack';
                        this.attackCooldown = 1.0;
                    }
                } else {
                    this.vx = this.speed * this.direction;
                    this.animation = 'walk';
                    if (this.x > this.startX + this.patrolRange) this.direction = -1;
                    if (this.x < this.startX - this.patrolRange) this.direction = 1;
                }
                break;

            case 'bat':
                // Vol sinusoïdal
                this.animation = 'walk';
                this.vx = this.speed * this.direction;
                this.vy = Math.sin(this.aiTimer * 3 + this.sineOffset) * 40;
                if (this.x > this.startX + this.patrolRange) this.direction = -1;
                if (this.x < this.startX - this.patrolRange) this.direction = 1;
                // Pique vers le joueur si proche
                if (playerInRange && !player.isDead) {
                    this.direction = player.x > this.x ? 1 : -1;
                    this.vx = this.speed * 1.8 * this.direction;
                }
                break;

            case 'mage':
                // Reste à distance, lance des projectiles
                this.animation = 'idle';
                this.vx = 0;
                if (playerInRange && !player.isDead) {
                    this.direction = player.x > this.x ? 1 : -1;
                    if (distToPlayer < 40) {
                        // Fuir si trop proche
                        this.vx = -this.speed * this.direction;
                    }
                    if (this.attackCooldown <= 0) {
                        this.animation = 'attack';
                        this.attackCooldown = 2.0;
                    }
                } else {
                    this.vx = this.speed * 0.5 * this.direction;
                    this.animation = 'walk';
                    if (this.x > this.startX + this.patrolRange) this.direction = -1;
                    if (this.x < this.startX - this.patrolRange) this.direction = 1;
                }
                break;

            case 'golem':
                // Lent mais tenace
                this.animation = 'walk';
                if (playerInRange && !player.isDead) {
                    this.direction = player.x > this.x ? 1 : -1;
                }
                this.vx = this.speed * this.direction;
                if (this.x > this.startX + this.patrolRange) this.direction = -1;
                if (this.x < this.startX - this.patrolRange) this.direction = 1;
                break;
        }
    }

    /**
     * Recevoir des dégâts
     */
    takeDamage(amount, knockbackDir) {
        if (this.isDead) return;
        this.hp -= amount;
        this.hitTimer = 0.2;
        this.animFrame = 0;
        this.animTimer = 0;
        // Knockback
        this.vx = knockbackDir * 100;

        if (this.hp <= 0) {
            this.isDead = true;
            this.animation = 'death';
            this.animFrame = 0;
            this.animTimer = 0;
            AudioManager.sfxEnemyHit();
            return true; // Ennemi tué
        }
        AudioManager.sfxEnemyHit();
        return false;
    }

    /**
     * Vérifier la collision avec un rectangle
     */
    collidesWith(box) {
        return this.x < box.x + box.w &&
               this.x + this.w > box.x &&
               this.y < box.y + box.h &&
               this.y + this.h > box.y;
    }

    /**
     * Dessiner l'ennemi
     */
    render(ctx, cameraX, cameraY) {
        const sprites = SpriteManager.sprites.enemies[this.type];
        if (!sprites) return;
        const frames = sprites[this.animation] || sprites.idle;
        if (!frames || frames.length === 0) return;

        const frame = frames[this.animFrame % frames.length];
        let dx = Math.floor(this.x - cameraX - (this.sprW - this.w) / 2);
        const dy = Math.floor(this.y - cameraY - (this.sprH - this.h) / 2);

        // Retourner si face à gauche
        if (this.direction < 0) {
            ctx.save();
            ctx.translate(dx + this.sprW, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(frame, 0, dy, this.sprW, this.sprH);
            ctx.restore();
        } else {
            ctx.drawImage(frame, dx, dy, this.sprW, this.sprH);
        }

        // Barre de vie (si pas à pleine vie)
        if (!this.isDead && this.hp < this.maxHP) {
            const barW = 14;
            const barH = 2;
            const barX = dx + 1;
            const barY = dy - 4;
            ctx.fillStyle = '#300000';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = '#e03030';
            ctx.fillRect(barX, barY, Math.floor(barW * this.hp / this.maxHP), barH);
        }
    }
}

// =====================================================================
//  CLASSE BOSS
// =====================================================================

class Boss {
    constructor(data) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.w = 28;
        this.h = 28;
        this.sprW = 32;
        this.sprH = 32;

        this.maxHP = data.hp || 20;
        this.hp = this.maxHP;
        this.damage = 2;
        this.speed = 30 + this.id * 3;

        // IA
        this.phase = 0; // Phase du boss
        this.aiTimer = 0;
        this.attackTimer = 0;
        this.attackPattern = 0;
        this.direction = -1; // Face au joueur par défaut
        this.vx = 0;
        this.vy = 0;
        this.targetX = data.x;

        // Animation
        this.animation = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;

        // État
        this.hitTimer = 0;
        this.isDead = false;
        this.deathTimer = 0;
        this.appeared = false;
        this.appearTimer = 0;

        // Projectiles du boss
        this.projectiles = [];
    }

    update(dt, levelData, player) {
        // Phase d'apparition
        if (!this.appeared) {
            this.appearTimer += dt;
            if (this.appearTimer >= 2.0) {
                this.appeared = true;
            }
            return true;
        }

        if (this.isDead) {
            this.deathTimer += dt;
            this.animTimer += dt;
            if (this.animTimer >= 0.2) {
                this.animTimer = 0;
                this.animFrame = Math.min(this.animFrame + 1, 3);
            }
            return this.deathTimer < 1.5;
        }

        // Réduire les timers
        if (this.hitTimer > 0) {
            this.hitTimer -= dt;
            this.animation = 'hit';
        }

        this.aiTimer += dt;
        this.attackTimer += dt;

        // Gravité
        this.vy += 400 * dt;
        if (this.vy > 200) this.vy = 200;

        // Phase du boss (change selon les PV restants)
        const hpRatio = this.hp / this.maxHP;
        if (hpRatio <= 0.3) this.phase = 2;
        else if (hpRatio <= 0.6) this.phase = 1;
        else this.phase = 0;

        // IA du boss
        this.updateAI(dt, player);

        // Déplacer
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Collision sol
        const ts = LevelManager.TILE_SIZE;
        const grid = levelData.grid;
        const bottomTY = Math.floor((this.y + this.h) / ts);
        const leftTX = Math.floor(this.x / ts);
        const rightTX = Math.floor((this.x + this.w) / ts);
        for (let tx = leftTX; tx <= rightTX; tx++) {
            if (LevelManager.isSolid(grid, tx, bottomTY) ||
                LevelManager.isPlatform(grid, tx, bottomTY)) {
                this.y = bottomTY * ts - this.h;
                this.vy = 0;
                break;
            }
        }

        // Limites du niveau
        if (this.x < ts) this.x = ts;
        if (this.x + this.w > levelData.pixelWidth - ts) {
            this.x = levelData.pixelWidth - ts - this.w;
        }

        // Mise à jour des projectiles
        this.projectiles = this.projectiles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.timer += dt;
            return p.timer < 3.0; // Suppression après 3 secondes
        });

        // Animation
        if (this.hitTimer <= 0) {
            this.animTimer += dt;
            const animSpeed = this.phase === 2 ? 0.1 : 0.15;
            if (this.animTimer >= animSpeed) {
                this.animTimer = 0;
                const sprites = SpriteManager.sprites.bosses[this.id];
                if (sprites && sprites[this.animation]) {
                    this.animFrame = (this.animFrame + 1) % sprites[this.animation].length;
                }
            }
        }

        return true;
    }

    updateAI(dt, player) {
        if (this.hitTimer > 0) return;
        this.direction = player.x > this.x ? 1 : -1;
        const dist = Math.abs(player.x - this.x);

        // Vitesse de base (augmente avec les phases)
        const speedMult = 1 + this.phase * 0.4;

        // Déplacement vers le joueur
        if (dist > 60) {
            this.vx = this.speed * this.direction * speedMult;
            this.animation = 'idle';
        } else {
            this.vx = 0;
        }

        // Attaque périodique
        const attackInterval = Math.max(1.5 - this.phase * 0.4, 0.5);
        if (this.attackTimer >= attackInterval) {
            this.attackTimer = 0;
            this.attackPattern = (this.attackPattern + 1) % 3;
            this.animation = 'attack';
            this.animFrame = 0;

            // Lancer un projectile
            if (this.attackPattern === 0 || this.phase >= 1) {
                this.projectiles.push({
                    x: this.x + (this.direction > 0 ? this.w : -8),
                    y: this.y + this.h / 2 - 4,
                    vx: this.direction * (80 + this.phase * 30),
                    vy: 0,
                    timer: 0,
                    w: 8, h: 8,
                });
            }

            // Phase 2 : attaque supplémentaire en éventail
            if (this.phase >= 2 && this.attackPattern === 2) {
                for (let angle = -1; angle <= 1; angle++) {
                    this.projectiles.push({
                        x: this.x + this.w / 2 - 4,
                        y: this.y + this.h / 2 - 4,
                        vx: this.direction * 60,
                        vy: angle * 50,
                        timer: 0,
                        w: 8, h: 8,
                    });
                }
            }
        }

        // Saut si le joueur est au-dessus
        if (player.y < this.y - 40 && this.vy === 0 && Math.random() < 0.02) {
            this.vy = -200 - this.phase * 30;
        }
    }

    takeDamage(amount, knockbackDir) {
        if (this.isDead || this.hitTimer > 0) return false;
        this.hp -= amount;
        this.hitTimer = 0.3;
        this.animFrame = 0;
        this.animation = 'hit';
        this.vx = knockbackDir * 50;

        AudioManager.sfxEnemyHit();

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.animation = 'death';
            this.animFrame = 0;
            this.deathTimer = 0;
            AudioManager.sfxBossDeath();
            return true;
        }
        return false;
    }

    collidesWith(box) {
        return this.x < box.x + box.w &&
               this.x + this.w > box.x &&
               this.y < box.y + box.h &&
               this.y + this.h > box.y;
    }

    render(ctx, cameraX, cameraY) {
        // Apparition
        if (!this.appeared) {
            const progress = this.appearTimer / 2.0;
            ctx.globalAlpha = progress;
        }

        const sprites = SpriteManager.sprites.bosses[this.id];
        if (!sprites) return;
        const frames = sprites[this.animation] || sprites.idle;
        if (!frames) return;

        const frame = frames[this.animFrame % frames.length];
        const dx = Math.floor(this.x - cameraX - 2);
        const dy = Math.floor(this.y - cameraY - 4);

        if (this.direction < 0) {
            ctx.save();
            ctx.translate(dx + this.sprW, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(frame, 0, dy);
            ctx.restore();
        } else {
            ctx.drawImage(frame, dx, dy);
        }

        ctx.globalAlpha = 1;

        // Barre de vie du boss (grande, en haut)
        if (this.appeared && !this.isDead) {
            const barW = 120;
            const barH = 6;
            const barX = 240 - barW / 2;
            const barY = 12;
            // Fond
            ctx.fillStyle = '#1a1020';
            ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
            // Barre vide
            ctx.fillStyle = '#300010';
            ctx.fillRect(barX, barY, barW, barH);
            // Barre de vie
            const hpWidth = Math.floor(barW * this.hp / this.maxHP);
            const hpColor = this.hp / this.maxHP > 0.3 ? '#e03030' : '#ff6020';
            ctx.fillStyle = hpColor;
            ctx.fillRect(barX, barY, hpWidth, barH);
            // Reflet
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(barX, barY, hpWidth, 2);
        }

        // Dessiner les projectiles
        const projFrames = SpriteManager.sprites.ui.projectile;
        this.projectiles.forEach(p => {
            const pf = projFrames[Math.floor(p.timer * 8) % projFrames.length];
            ctx.drawImage(pf, Math.floor(p.x - cameraX), Math.floor(p.y - cameraY));
        });
    }
}

// =====================================================================
//  CLASSE PARTICULE (Effets visuels)
// =====================================================================

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'impact', 'sparkle', 'smoke'
        this.vx = (Math.random() - 0.5) * 60;
        this.vy = (Math.random() - 0.5) * 60 - 20;
        this.frame = 0;
        this.timer = 0;
        this.alive = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 50 * dt; // Mini gravité
        this.timer += dt;

        if (this.timer >= 0.08) {
            this.timer = 0;
            this.frame++;
            if (this.frame >= 4) {
                this.alive = false;
            }
        }
        return this.alive;
    }

    render(ctx, cameraX, cameraY) {
        const effects = SpriteManager.sprites.effects;
        let frames;
        switch (this.type) {
            case 'impact': frames = effects.impactParticle; break;
            case 'sparkle': frames = effects.sparkle; break;
            case 'smoke': frames = effects.smoke; break;
            default: return;
        }
        if (!frames || this.frame >= frames.length) return;
        ctx.drawImage(frames[this.frame],
            Math.floor(this.x - cameraX - 4),
            Math.floor(this.y - cameraY - 4));
    }
}
