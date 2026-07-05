/* ==========================================================================
   Game — Moteur principal du jeu
   Boucle principale, gestion des états, caméra, et système de sauvegarde
   ========================================================================== */

const Game = {
    canvas: null,
    ctx: null,
    // Résolution interne rétro (ratio 16:9)
    WIDTH: 480,
    HEIGHT: 270,

    state: 0, // État actuel (voir UIManager.STATE)
    lastTime: 0,
    frameCount: 0,
    accumulator: 0,
    timestep: 1 / 60, // 60 FPS logique fixe

    // Données de jeu
    player: null,
    levelNum: 1,
    levelData: null,
    particles: [],

    // Caméra
    cameraX: 0,
    cameraY: 0,
    targetCameraX: 0,
    targetCameraY: 0,

    // Timer divers
    stateTimer: 0,

    /**
     * Point d'entrée principal appelé par window.onload
     */
    start() {
        console.log("Démarrage de MehdiGames...");

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Forcer le rendu sans lissage pour le pixel art
        this.ctx.imageSmoothingEnabled = false;

        // Ajuster la taille interne
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;

        // Gestion de la fenêtre
        window.addEventListener('resize', () => this.resize());
        // Aussi écouter orientationchange pour mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resize(), 200);
        });
        this.resize();

        // Initialisation des modules
        InputManager.init();
        UIManager.init();
        this.state = UIManager.STATE.LOADING;

        // Lancer la boucle immédiatement pour afficher l'écran de chargement
        requestAnimationFrame((t) => this.loop(t));

        // Initialisation de la sauvegarde HTML
        this.initSaveLoadUI();

        // Sur mobile, tenter le fullscreen au premier tap
        if (InputManager.isMobile) {
            const requestFS = () => {
                const el = document.documentElement;
                if (el.requestFullscreen) el.requestFullscreen().catch(() => { });
                else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                document.removeEventListener('touchstart', requestFS);
            };
            document.addEventListener('touchstart', requestFS, { once: true });
        }

        // Configurer l'input mobile pour la saisie du nom
        this.mobileInput = document.getElementById('mobileNameInput');
        if (this.mobileInput) {
            this.mobileInput.addEventListener('input', (e) => {
                // Synchroniser le contenu de l'input HTML vers le jeu
                let val = this.mobileInput.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
                if (val.length > 10) val = val.substring(0, 10);
                this.mobileInput.value = val;
                UIManager.playerNameInput = val;
            });
        }

        // Générer les spritesheets (désormais asynchrone car charge des images depuis le disque)
        setTimeout(() => {
            SpriteManager.init().then(() => {
                // Masquer l'écran CSS de chargement
                const loadingDOM = document.getElementById('loadingScreen');
                if (loadingDOM) {
                    loadingDOM.style.opacity = '0';
                    setTimeout(() => loadingDOM.style.display = 'none', 500);
                }

                this.state = UIManager.STATE.MENU;
                document.body.classList.add('game-active');
            });
        }, 100); // Petit délai pour laisser le temps au navigateur de render la frame
    },

    /**
     * Ajuster le canvas à l'écran (tout en gardant le ratio et les pixels nets)
     */
    resize() {
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        const scaleX = ww / this.WIDTH;
        const scaleY = wh / this.HEIGHT;
        const scale = Math.min(scaleX, scaleY);

        // Sur mobile, utiliser l'échelle fractionnaire pour maximiser l'espace
        // Sur PC, arrondir vers le bas pour garder les pixels nets
        let finalScale;
        if (InputManager.isMobile) {
            finalScale = Math.max(0.5, scale);
        } else {
            finalScale = Math.max(1, Math.floor(scale));
        }

        this.canvas.style.width = `${Math.floor(this.WIDTH * finalScale)}px`;
        this.canvas.style.height = `${Math.floor(this.HEIGHT * finalScale)}px`;
    },

    // =====================================================================
    //  BOUCLE PRINCIPALE
    // =====================================================================

    loop(timestamp) {
        // Delta time avec limite pour éviter les sauts spatio-temporels
        let dt = (timestamp - this.lastTime) / 1000;
        if (dt > 0.1) dt = 0.1;
        this.lastTime = timestamp;

        // Update UI logic (always runs)
        UIManager.update(dt);

        // Lecture de la manette (Gamepad API)
        InputManager.update();

        // Update logic (fixed timestep)
        this.accumulator += dt;
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep);
            this.accumulator -= this.timestep;
        }

        // Render (runs as fast as possible)
        this.render();

        // Reset inputs at frame end
        InputManager.resetFrame();

        requestAnimationFrame((t) => this.loop(t));
    },

    // =====================================================================
    //  MÉCANIQUES DE JEU
    // =====================================================================

    /**
     * Lancer une nouvelle partie ou charger la sauvegarde
     */
    startNewGame() {
        this.player = new Player(0, 0);
        this.player.name = UIManager.playerNameInput;
        this.levelNum = 1;

        // Sauvegarder le dernier nom
        localStorage.setItem('mehdigames_last_name', this.player.name);

        // Initialiser ou charger joueur
        const save = localStorage.getItem('mehdigames_save');
        if (save) {
            try {
                const data = JSON.parse(save);
                // Si la sauvegarde appartient à ce joueur ET que le mode de jeu correspond
                if (data.playerName === UIManager.playerNameInput && (data.creativeMode || false) === this.creativeMode) {
                    this.levelNum = data.currentLevel;
                    this.player.maxHP = data.maxHP;
                    this.player.hp = data.hp;
                    this.player.score = data.score;
                    this.player.coins = data.coins;
                }
            } catch (e) {
                console.error("Erreur lecture save", e);
            }
        }

        // Lier le mode créatif au joueur pour l'invincibilité
        this.player.creativeMode = this.creativeMode;

        this.loadLevel(this.levelNum);
        this.state = UIManager.STATE.PLAYING;
    },

    /**
     * Initialisation de l'import/export JSON
     */
    initSaveLoadUI() {
        const btnExport = document.getElementById('btnExport');
        const btnImport = document.getElementById('btnImport');
        const fileInput = document.getElementById('fileInput');

        if (btnExport) {
            btnExport.onclick = () => {
                const save = localStorage.getItem('mehdigames_save');
                if (!save) return alert('Aucune sauvegarde locale trouvée pour le moment !');
                const blob = new Blob([save], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mehdigames_save.json';
                a.click();
                URL.revokeObjectURL(url);
            };
        }
        if (btnImport) {
            btnImport.onclick = () => fileInput.click();
        }
        if (fileInput) {
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const json = JSON.parse(evt.target.result);
                        if (json && json.playerName && json.currentLevel) {
                            localStorage.setItem('mehdigames_save', JSON.stringify(json));
                            localStorage.setItem('mehdigames_last_name', json.playerName);
                            alert('Sauvegarde chargée ! Le jeu va redémarrer pour la prendre en compte.');
                            location.reload();
                        } else {
                            alert('Fichier de sauvegarde invalide.');
                        }
                    } catch (err) {
                        alert('Erreur: Fichier JSON illisible.');
                    }
                };
                reader.readAsText(file);
            };
        }
    },

    /**
     * Sauvegarder la progression
     */
    saveGame() {
        if (!this.player) return;
        const saveData = {
            playerName: this.player.name,
            currentLevel: this.levelNum,
            maxHP: this.player.maxHP,
            hp: this.player.hp,
            score: this.player.score,
            coins: this.player.coins,
            creativeMode: this.creativeMode || false
        };
        localStorage.setItem('mehdigames_save', JSON.stringify(saveData));
    },

    /**
     * Charger un niveau
     */
    loadLevel(levelNum) {
        this.levelData = LevelManager.generate(levelNum);

        // Positionner le joueur
        this.player.x = this.levelData.playerStart.x;
        this.player.y = this.levelData.playerStart.y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = false;

        // Créer les entités ennemis
        this.levelData.entities = this.levelData.enemies.map(e => new Enemy(e));
        if (this.levelData.bossData) {
            this.levelData.entities.push(new Boss(this.levelData.bossData));
        }

        // Vider les particules
        this.particles = [];
        this.bossPotionTimer = 0; // Timer pour le spawn de potions pendant les boss

        // Caméra initiale
        this.updateCamera(0, true);

        this.saveGame();
    },

    /**
     * Spawn d'effets visuels
     */
    spawnEffect(x, y, type, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    },

    // =====================================================================
    //  UPDATE LOGIQUE
    // =====================================================================

    update(dt) {
        this.frameCount++;

        switch (this.state) {
            case UIManager.STATE.MENU:
                if (InputManager.confirm) {
                    AudioManager.init(); // Important : initialiser l'audio au premier clic
                    AudioManager.sfxMenuSelect();
                    UIManager.startTransition(() => {
                        if (InputManager.isMobile && Game.mobileNameEntered) {
                            this.state = UIManager.STATE.STORY;
                        } else {
                            this.state = UIManager.STATE.NAME_INPUT;
                        }
                    });
                }
                break;

            case UIManager.STATE.NAME_INPUT:
                if (!InputManager.isMobile) {
                    window.addEventListener('keydown', this.nameInputHandler);
                }
                if (InputManager.confirm && UIManager.playerNameInput.trim().length > 0) {
                    window.removeEventListener('keydown', this.nameInputHandler);
                    AudioManager.sfxMenuSelect();
                    UIManager.startTransition(() => {
                        this.state = UIManager.STATE.STORY;
                    });
                }
                break;

            case UIManager.STATE.STORY:
                if (InputManager.confirm) {
                    AudioManager.sfxMenuSelect();
                    UIManager.startTransition(() => {
                        this.state = UIManager.STATE.MODE_SELECT;
                        this.canChangeMode = false; // Reset anti-rebond du clavier
                    });
                }
                break;

            case UIManager.STATE.MODE_SELECT:
                if (InputManager.up || InputManager.down) {
                    if (this.canChangeMode) {
                        UIManager.menuSelection = (UIManager.menuSelection === 0) ? 1 : 0;
                        AudioManager.sfxMenuSelect();
                        this.canChangeMode = false;
                    }
                } else {
                    this.canChangeMode = true;
                }

                if (InputManager.confirm) {
                    AudioManager.sfxMenuSelect();
                    this.creativeMode = (UIManager.menuSelection === 1);
                    UIManager.startTransition(() => {
                        this.startNewGame();
                    });
                }
                break;

            case UIManager.STATE.PLAYING:
                if (InputManager.pause) {
                    this.state = UIManager.STATE.PAUSED;
                    return;
                }
                this.updatePlaying(dt);
                break;

            case UIManager.STATE.PAUSED:
                if (InputManager.pause) {
                    this.state = UIManager.STATE.PLAYING;
                }
                break;

            case UIManager.STATE.GAME_OVER:
                this.stateTimer -= dt;
                if (this.stateTimer <= 0 && InputManager.confirm) {
                    UIManager.startTransition(() => {
                        // Reprendre au même niveau
                        this.player.hp = this.player.maxHP;
                        this.player.isDead = false;
                        this.player.animation = 'idle';
                        this.loadLevel(this.levelNum);
                        this.state = UIManager.STATE.PLAYING;
                    });
                }
                break;

            case UIManager.STATE.LEVEL_CLEAR:
                this.stateTimer -= dt;
                // Le joueur avance tout seul
                this.player.vx = 60;
                this.player.updateAnimation(dt);
                this.player.x += this.player.vx * dt;
                this.updateCamera(dt, false);

                if (this.stateTimer <= 0) {
                    UIManager.startTransition(() => {
                        this.levelNum++;
                        if (this.levelNum > 100) {
                            this.state = UIManager.STATE.GAME_CLEAR;
                        } else {
                            this.loadLevel(this.levelNum);
                            this.state = UIManager.STATE.PLAYING;
                        }
                    });
                }
                break;

            case UIManager.STATE.GAME_CLEAR:
                // Attente sur l'écran de victoire
                if (InputManager.confirm) {
                    UIManager.startTransition(() => {
                        this.state = UIManager.STATE.MENU;
                    });
                }
                break;
        }
    },

    /**
     * Logique principale en jeu
     */
    updatePlaying(dt) {
        // --- Fin de jeu (Joueur mort) ---
        this.player.update(dt, this.levelData);

        // Vérifier mort du joueur
        if (this.player.isDead && this.player.deathTimer > 2.0 && this.state !== UIManager.STATE.GAME_OVER) {
            this.state = UIManager.STATE.GAME_OVER;
            this.stateTimer = 1.0; // Bloquer l'input 1s
            AudioManager.sfxGameOver();
        }

        // --- Entités (Ennemis/Boss) ---
        let bossAlive = false;

        // Spawn de potions toutes les 3 secondes pendant les boss
        if (this.levelData.isBoss) {
            this.bossPotionTimer += dt;
            if (this.bossPotionTimer >= 3.0) {
                this.bossPotionTimer = 0;
                // Potion à une position aléatoire dans l'arène
                const arenaW = this.levelData.width;
                const arenaH = this.levelData.height;
                const px = (2 + Math.floor(Math.random() * (arenaW - 4))) * LevelManager.TILE_SIZE;
                const py = (arenaH - 4) * LevelManager.TILE_SIZE;
                this.levelData.collectibles.push({
                    type: 'potion',
                    x: px,
                    y: py,
                    collected: false,
                });
                this.spawnEffect(px, py, 'sparkle', 3);
            }
        }

        for (let i = this.levelData.entities.length - 1; i >= 0; i--) {
            const ent = this.levelData.entities[i];

            // Les boss gèrent leur apparition
            if (ent instanceof Boss) {
                bossAlive = !ent.isDead;
                if (!ent.appeared && ent.appearTimer === 0) {
                    AudioManager.sfxBossAppear();
                }
            }

            const keepAlive = ent.update(dt, this.levelData, this.player);

            // Collisions Entité -> Joueur (dégâts)
            if (!ent.isDead && !this.player.isDead && this.player.invincible <= 0) {
                if (ent.collidesWith(this.player)) {
                    this.player.takeDamage(ent.damage);
                }
                // Collisions Projectiles de Boss -> Joueur
                if (ent instanceof Boss) {
                    for (const proj of ent.projectiles) {
                        if (this.player.x < proj.x + proj.w && this.player.x + this.player.w > proj.x &&
                            this.player.y < proj.y + proj.h && this.player.y + this.player.h > proj.y) {
                            this.player.takeDamage(ent.damage);
                        }
                    }
                }
            }

            // Retirer l'entité si morte et animation terminée
            if (!keepAlive) {
                this.levelData.entities.splice(i, 1);
                this.spawnEffect(ent.x + ent.w / 2, ent.y + ent.h / 2, 'smoke', 4);
                this.player.score += (ent instanceof Boss ? 1000 : 50);
            }
        }

        // --- Collisions Joueur (Attaque) -> Entité ---
        const atkBox = this.player.getAttackBox();
        if (atkBox && !this.player.isDead) {
            for (const ent of this.levelData.entities) {
                if (!ent.isDead && ent.hitTimer <= 0 && ent.collidesWith(atkBox)) {
                    // Touché !
                    const knockDir = this.player.facingRight ? 1 : -1;
                    const killed = ent.takeDamage(this.player.attackDamage, knockDir);
                    this.spawnEffect(ent.x + ent.w / 2, ent.y + ent.h / 2, 'impact', 3);
                }
            }
        }

        // --- Collectibles ---
        for (let i = this.levelData.collectibles.length - 1; i >= 0; i--) {
            const item = this.levelData.collectibles[i];
            const itemSize = 32; // Taille agrandie x2
            const ix = item.x - 8; // Centrage
            const iy = item.y - 16;

            if (this.player.x < ix + itemSize && this.player.x + this.player.w > ix &&
                this.player.y < iy + itemSize && this.player.y + this.player.h > iy) {

                // Ramassé
                this.levelData.collectibles.splice(i, 1);
                this.spawnEffect(item.x + 8, item.y + 8, 'sparkle', 3);
                AudioManager.sfxCollect();

                if (item.type === 'coin') {
                    this.player.coins++;
                    this.player.score += 10;
                } else if (item.type === 'potion') {
                    this.player.heal(1);
                    this.player.score += 50;
                }
            }
        }

        // --- Particules ---
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(dt)) {
                this.particles.splice(i, 1);
            }
        }

        // --- Fin de niveau ---
        if (!this.player.isDead) {
            if (this.levelData.isBoss) {
                if (!bossAlive && this.levelData.entities.length === 0) {
                    this.completeLevel();
                }
            } else {
                // Porte de sortie
                const door = this.levelData.doorPos;
                if (door && Math.abs(this.player.x - door.x) < 16 && Math.abs(this.player.y - (door.y - 16)) < 16) {
                    this.completeLevel();
                }
            }
        }

        // --- Caméra ---
        this.updateCamera(dt, false);
    },

    /**
     * Terminer le niveau
     */
    completeLevel() {
        if (this.state === UIManager.STATE.LEVEL_CLEAR) return;
        this.state = UIManager.STATE.LEVEL_CLEAR;
        this.stateTimer = 2.0; // 2s de pose
        this.player.vx = 0;
        this.player.animation = 'run'; // Courir vers la victoire
        AudioManager.sfxLevelComplete();
    },

    /**
     * Mise à jour de la caméra (Smooth Follow)
     */
    updateCamera(dt, instant) {
        if (!this.player || !this.levelData) return;

        // Cible la position du joueur (centrée)
        this.targetCameraX = this.player.x - this.WIDTH / 2;

        // Sur les niveaux boss, la caméra est fixe
        if (this.levelData.isBoss) {
            this.targetCameraX = 0;
            this.targetCameraY = 0;
        } else {
            // Suivi horizontal
            if (instant) {
                this.cameraX = this.targetCameraX;
            } else {
                // Interpolation douce
                this.cameraX += (this.targetCameraX - this.cameraX) * 5 * dt;
            }

            // Caméra Y fixe (alignée en bas)
            this.cameraY = this.levelData.pixelHeight - this.HEIGHT;
        }

        // Limites de la caméra (pour ne pas sortir du niveau)
        if (this.cameraX < 0) this.cameraX = 0;
        if (this.cameraX > this.levelData.pixelWidth - this.WIDTH) {
            this.cameraX = this.levelData.pixelWidth - this.WIDTH;
        }

        // Arrondir pour éviter le sub-pixel rendering (qui floute)
        this.cameraX = Math.floor(this.cameraX);
        this.cameraY = Math.floor(this.cameraY);
    },

    // =====================================================================
    //  RENDU
    // =====================================================================

    render() {
        // Gérer l'affichage des boutons HTML selon l'état du jeu
        const saveMenu = document.getElementById('saveLoadMenu');
        if (saveMenu) {
            saveMenu.style.display = (this.state === UIManager.STATE.PAUSED && UIManager.transitionState === 0) ? 'flex' : 'none';
        }

        // Gérer l'affichage des contrôles tactiles selon l'état
        if (InputManager.isMobile) {
            const touchControls = document.getElementById('touchControls');
            const touchMenu = document.getElementById('touchMenuControls');

            if (touchControls && touchMenu) {
                const isPlaying = (this.state === UIManager.STATE.PLAYING);
                const isMenu = (this.state === UIManager.STATE.MENU ||
                    this.state === UIManager.STATE.NAME_INPUT ||
                    this.state === UIManager.STATE.STORY ||
                    this.state === UIManager.STATE.MODE_SELECT ||
                    this.state === UIManager.STATE.GAME_OVER ||
                    this.state === UIManager.STATE.PAUSED ||
                    this.state === UIManager.STATE.GAME_CLEAR);

                touchControls.style.display = isPlaying ? 'flex' : 'none';
                touchMenu.style.display = isMenu ? 'flex' : 'none';
            }
        }

        // Effacer
        this.ctx.fillStyle = '#0a0a12';
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        if (this.state >= UIManager.STATE.PLAYING && this.levelData) {
            // 1. Fond (parallax léger si on veut)
            // 2. Tuiles
            LevelManager.render(this.ctx, this.levelData, this.cameraX, this.cameraY, this.frameCount);

            // 3. Collectibles
            const uiSprites = SpriteManager.sprites.ui;
            for (const item of this.levelData.collectibles) {
                let img;
                if (item.type === 'coin') {
                    img = uiSprites.coin[Math.floor(this.frameCount / 10) % uiSprites.coin.length];
                } else if (item.type === 'potion') {
                    img = uiSprites.potion;
                    // Flottement
                    item.y += Math.sin(this.frameCount * 0.1) * 0.5;
                }
                if (img) {
                    this.ctx.drawImage(img, Math.floor(item.x - this.cameraX - 8), Math.floor(item.y - this.cameraY - 16), 32, 32);
                }
            }

            // 4. Entités
            for (const ent of this.levelData.entities) {
                ent.render(this.ctx, this.cameraX, this.cameraY);
            }

            // 5. Joueur
            if (this.player) {
                this.player.render(this.ctx, this.cameraX, this.cameraY);
            }

            // 6. Particules
            for (const p of this.particles) {
                p.render(this.ctx, this.cameraX, this.cameraY);
            }

            // 7. HUD
            UIManager.renderHUD(this.ctx, this.WIDTH, this.HEIGHT, this.player, this.levelNum, this.levelData.isBoss);
        }

        // HUD et Menus (Pas affectés par la caméra)
        switch (this.state) {
            case UIManager.STATE.LOADING:
                // Géré par DOM
                break;
            case UIManager.STATE.MENU:
                UIManager.renderMenu(this.ctx, this.canvas.width, this.canvas.height);
                break;
            case UIManager.STATE.NAME_INPUT:
                UIManager.renderNameInput(this.ctx, this.canvas.width, this.canvas.height);
                break;
            case UIManager.STATE.STORY:
                UIManager.renderStory(this.ctx, this.canvas.width, this.canvas.height);
                break;
            case UIManager.STATE.MODE_SELECT:
                UIManager.renderModeSelect(this.ctx, this.canvas.width, this.canvas.height);
                break;
            case UIManager.STATE.PLAYING:
                // HUD déjà rendu ci-dessus
                break;
            case UIManager.STATE.PAUSED:
                UIManager.renderPause(this.ctx, this.WIDTH, this.HEIGHT);
                break;
            case UIManager.STATE.GAME_OVER:
                UIManager.renderGameOver(this.ctx, this.WIDTH, this.HEIGHT, this.player.score, this.levelNum);
                break;
            case UIManager.STATE.LEVEL_CLEAR:
                UIManager.renderLevelClear(this.ctx, this.WIDTH, this.HEIGHT, this.levelNum);
                break;
            case UIManager.STATE.GAME_CLEAR:
                UIManager.renderGameClear(this.ctx, this.WIDTH, this.HEIGHT, this.player);
                break;
        }

        // Transitions globales
        UIManager.renderTransitions(this.ctx, this.WIDTH, this.HEIGHT);
    }
};

// =====================================================================
//  GESTIONNAIRE CLAVIER POUR SAISIE DU NOM
// =====================================================================

Game.nameInputHandler = (e) => {
    // Éviter les touches de fonction et de contrôle
    if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9 ]/)) {
        if (UIManager.playerNameInput.length < 10) {
            UIManager.playerNameInput += e.key.toUpperCase();
            AudioManager.sfxMenuNav();
        }
    } else if (e.code === 'Backspace') {
        UIManager.playerNameInput = UIManager.playerNameInput.slice(0, -1);
        AudioManager.sfxMenuNav();
    }
};

// =====================================================================
//  POINT D'ENTRÉE DU NAVIGATEUR
// =====================================================================
window.onload = () => {
    Game.start();
};
