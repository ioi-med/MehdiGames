/* ==========================================================================
   LevelManager — Génération procédurale des 100 niveaux
   Chaque niveau est reproductible grâce à une seed basée sur son numéro
   ========================================================================== */

const LevelManager = {
    TILE_SIZE: 16,
    LEVEL_HEIGHT: 17, // Hauteur en tuiles (270 / 16 ≈ 17)
    MIN_WIDTH: 40,    // Largeur min en tuiles
    MAX_WIDTH: 80,    // Largeur max en tuiles

    // Types de tuiles
    TILE: {
        EMPTY: 0,
        GROUND: 1,
        DIRT: 2,
        STONE: 3,
        PLATFORM: 4,
        SPIKES: 5,
        DOOR: 6,
        WALL: 7,
        TORCH: 8,
    },

    /**
     * Générateur pseudo-aléatoire avec seed (reproductible)
     */
    seededRandom(seed) {
        let s = seed;
        return function () {
            s = (s * 16807 + 0) % 2147483647;
            return (s - 1) / 2147483646;
        };
    },

    /**
     * Générer les données d'un niveau
     * @param {number} levelNum - Numéro du niveau (1-100)
     * @returns {object} Données du niveau
     */
    generate(levelNum) {
        const rng = this.seededRandom(levelNum * 7919 + 1013);
        const isBoss = (levelNum % 10 === 0);
        const biome = SpriteManager.getBiome(levelNum);
        const difficulty = Math.min(levelNum / 100, 1); // 0 à 1

        // Dimensions du niveau
        let width, height;
        if (isBoss) {
            width = 25; // Arène de boss compacte
            height = this.LEVEL_HEIGHT;
        } else {
            width = Math.floor(this.MIN_WIDTH + difficulty * (this.MAX_WIDTH - this.MIN_WIDTH));
            width = Math.floor(width + rng() * 10);
            height = this.LEVEL_HEIGHT;
        }

        // Initialiser la grille avec du vide
        const grid = [];
        for (let y = 0; y < height; y++) {
            grid[y] = new Array(width).fill(this.TILE.EMPTY);
        }

        if (isBoss) {
            this.generateBossArena(grid, width, height, rng, biome);
        } else {
            this.generatePlatformLevel(grid, width, height, rng, difficulty, biome);
        }

        // Placer les ennemis
        const enemies = isBoss ? [] : this.placeEnemies(grid, width, height, rng, levelNum, difficulty);

        // Données du boss si applicable
        const bossData = isBoss ? {
            id: SpriteManager.getBossId(levelNum),
            x: (width / 2) * this.TILE_SIZE,
            y: (height - 6) * this.TILE_SIZE,
            hp: 10 + levelNum * 2,
        } : null;

        // Placer les collectibles
        const collectibles = this.placeCollectibles(grid, width, height, rng, difficulty);

        // Position de départ du joueur
        const playerStart = { x: 2 * this.TILE_SIZE, y: (height - 4) * this.TILE_SIZE };

        // Trouver la position de la porte (sortie)
        let doorPos = null;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x] === this.TILE.DOOR) {
                    doorPos = { x: x * this.TILE_SIZE, y: y * this.TILE_SIZE };
                }
            }
        }

        return {
            levelNum,
            biome,
            isBoss,
            width,
            height,
            grid,
            enemies,
            bossData,
            collectibles,
            playerStart,
            doorPos,
            tileSize: this.TILE_SIZE,
            pixelWidth: width * this.TILE_SIZE,
            pixelHeight: height * this.TILE_SIZE,
        };
    },

    /**
     * Générer un niveau de plateforme classique
     */
    generatePlatformLevel(grid, w, h, rng, difficulty, biome) {
        const T = this.TILE;

        // --- Sol de base (2-3 tuiles d'épaisseur en bas) ---
        const groundH = 2 + Math.floor(rng());
        for (let y = h - groundH; y < h; y++) {
            for (let x = 0; x < w; x++) {
                grid[y][x] = (y === h - groundH) ? T.GROUND : T.DIRT;
            }
        }

        // --- Trous dans le sol (difficulté croissante) ---
        const numHoles = Math.floor(2 + difficulty * 6);
        for (let i = 0; i < numHoles; i++) {
            const holeX = Math.floor(5 + rng() * (w - 12));
            const holeW = Math.floor(2 + rng() * (2 + difficulty * 2));
            for (let y = h - groundH; y < h; y++) {
                for (let x = holeX; x < Math.min(holeX + holeW, w - 3); x++) {
                    grid[y][x] = T.EMPTY;
                }
            }
        }

        // --- Plateformes flottantes ---
        const numPlatforms = Math.floor(6 + difficulty * 8 + rng() * 4);
        for (let i = 0; i < numPlatforms; i++) {
            const px = Math.floor(3 + rng() * (w - 8));
            // Aligner les plateformes sur 3 étages bien définis et atteignables
            const floorLevel = Math.floor(rng() * 3); // 0, 1 ou 2
            const py = (h - groundH) - 4 - (floorLevel * 4);
            
            const pw = Math.floor(3 + rng() * 5);
            if (py > 2) { // Ne pas déborder en haut du niveau
                for (let x = px; x < Math.min(px + pw, w - 1); x++) {
                    grid[py][x] = T.PLATFORM;
                }
            }
        }

        // --- Pics (obstacles) ---
        const numSpikes = Math.floor(difficulty * 8);
        for (let i = 0; i < numSpikes; i++) {
            const sx = Math.floor(6 + rng() * (w - 10));
            if (grid[h - groundH - 1][sx] === T.EMPTY && grid[h - groundH][sx] === T.GROUND) {
                grid[h - groundH - 1][sx] = T.SPIKES;
            }
        }

        // --- Murs latéraux ---
        for (let y = 0; y < h; y++) {
            grid[y][0] = T.WALL;
            grid[y][w - 1] = T.WALL;
        }

        // --- Torches décoratives ---
        const numTorches = Math.floor(2 + rng() * 4);
        for (let i = 0; i < numTorches; i++) {
            const tx = Math.floor(2 + rng() * (w - 4));
            const ty = Math.floor(3 + rng() * (h - 8));
            if (grid[ty][tx] === T.EMPTY) {
                grid[ty][tx] = T.TORCH;
            }
        }

        // --- Porte de sortie (à droite) ---
        const doorX = w - 3;
        const doorY = h - groundH - 1;
        // S'assurer qu'il y a du sol sous la porte
        grid[h - groundH][doorX] = T.GROUND;
        grid[h - groundH][doorX + 1] = T.GROUND;
        grid[doorY][doorX] = T.DOOR;

        // --- Escaliers/marches vers la sortie ---
        if (rng() > 0.4) {
            const stairStart = Math.max(doorX - 5, w - 10);
            for (let i = 0; i < 3; i++) {
                const sx = stairStart + i * 2;
                const sy = h - groundH - 1 - i;
                if (sx < w - 2 && sy > 2) {
                    grid[sy][sx] = T.PLATFORM;
                    grid[sy][sx + 1] = T.PLATFORM;
                }
            }
        }

        // --- Zone de départ dégagée ---
        for (let x = 1; x < 5; x++) {
            for (let y = h - groundH - 4; y < h - groundH; y++) {
                if (grid[y][x] !== T.EMPTY) {
                    // Garder seulement le sol
                }
                if (y < h - groundH) grid[y][x] = T.EMPTY;
            }
            grid[h - groundH][x] = T.GROUND;
        }
    },

    /**
     * Générer une arène de boss
     */
    generateBossArena(grid, w, h, rng, biome) {
        const T = this.TILE;

        // Sol plat
        for (let x = 0; x < w; x++) {
            grid[h - 2][x] = T.GROUND;
            grid[h - 1][x] = T.DIRT;
        }

        // Murs
        for (let y = 0; y < h; y++) {
            grid[y][0] = T.WALL;
            grid[y][w - 1] = T.WALL;
        }

        // Plafond
        for (let x = 0; x < w; x++) {
            grid[0][x] = T.STONE;
        }

        // Plateformes latérales (pour esquiver)
        grid[h - 6][3] = T.PLATFORM;
        grid[h - 6][4] = T.PLATFORM;
        grid[h - 6][5] = T.PLATFORM;

        grid[h - 6][w - 6] = T.PLATFORM;
        grid[h - 6][w - 5] = T.PLATFORM;
        grid[h - 6][w - 4] = T.PLATFORM;

        // Plateforme centrale haute
        grid[h - 9][Math.floor(w / 2) - 2] = T.PLATFORM;
        grid[h - 9][Math.floor(w / 2) - 1] = T.PLATFORM;
        grid[h - 9][Math.floor(w / 2)] = T.PLATFORM;
        grid[h - 9][Math.floor(w / 2) + 1] = T.PLATFORM;

        // Torches d'ambiance
        grid[3][2] = T.TORCH;
        grid[3][w - 3] = T.TORCH;
        grid[h - 5][1] = T.TORCH;
        grid[h - 5][w - 2] = T.TORCH;
    },

    /**
     * Placer les ennemis dans le niveau
     */
    placeEnemies(grid, w, h, rng, levelNum, difficulty) {
        const enemyTypes = SpriteManager.getEnemyTypes(levelNum);
        const numEnemies = Math.floor(3 + difficulty * 8 + rng() * 3);
        const enemies = [];

        for (let i = 0; i < numEnemies; i++) {
            const ex = Math.floor(8 + rng() * (w - 12));
            // Trouver le sol sous cette position
            let ey = -1;
            for (let y = 0; y < h - 1; y++) {
                if (grid[y][ex] === this.TILE.EMPTY &&
                    (grid[y + 1][ex] === this.TILE.GROUND ||
                     grid[y + 1][ex] === this.TILE.PLATFORM)) {
                    ey = y;
                    break;
                }
            }
            if (ey === -1) continue; // Pas de position valide

            const type = enemyTypes[Math.floor(rng() * enemyTypes.length)];
            const isFlyingType = (type === 'bat');

            enemies.push({
                type,
                x: ex * this.TILE_SIZE,
                y: isFlyingType ? (ey - 2) * this.TILE_SIZE : ey * this.TILE_SIZE,
                hp: this.getEnemyHP(type, difficulty),
                damage: 1,
                patrolRange: Math.floor(3 + rng() * 4) * this.TILE_SIZE,
                flying: isFlyingType,
            });
        }

        return enemies;
    },

    /**
     * Obtenir les PV d'un ennemi selon son type et la difficulté
     */
    getEnemyHP(type, difficulty) {
        const baseHP = {
            slime: 1,
            bat: 1,
            skeleton: 2,
            mage: 2,
            golem: 4,
        };
        return (baseHP[type] || 1) + Math.floor(difficulty * 2);
    },

    /**
     * Placer les collectibles (pièces, potions)
     */
    placeCollectibles(grid, w, h, rng, difficulty) {
        const items = [];
        const numCoins = Math.floor(5 + rng() * 8);
        const numPotions = rng() > 0.6 ? 1 : 0;

        for (let i = 0; i < numCoins; i++) {
            const cx = Math.floor(3 + rng() * (w - 6));
            // Chercher une surface solide (sol ou plateforme) en partant du bas
            let cy = -1;
            for (let y = h - 2; y >= 2; y--) {
                if (grid[y][cx] === this.TILE.EMPTY && 
                   (grid[y+1][cx] === this.TILE.GROUND || grid[y+1][cx] === this.TILE.PLATFORM)) {
                    cy = y - 1; // Placer la pièce 1 tuile au-dessus de la surface
                    break;
                }
            }
            if (cy !== -1) {
                items.push({
                    type: 'coin',
                    x: cx * this.TILE_SIZE + 4,
                    y: cy * this.TILE_SIZE,
                    collected: false,
                });
            }
        }

        if (numPotions > 0) {
            const px = Math.floor(w / 3 + rng() * (w / 3));
            items.push({
                type: 'potion',
                x: px * this.TILE_SIZE,
                y: (h - 4) * this.TILE_SIZE,
                collected: false,
            });
        }

        return items;
    },

    /**
     * Vérifier si une position dans la grille est solide (collision)
     */
    isSolid(grid, tileX, tileY) {
        if (tileY >= grid.length) {
            return false; // Le vide n'est pas solide
        }
        if (tileY < 0 || tileX < 0 || tileX >= grid[0].length) {
            return true; // Les murs latéraux et le plafond sont solides
        }
        const tile = grid[tileY][tileX];
        return tile === this.TILE.GROUND ||
               tile === this.TILE.DIRT ||
               tile === this.TILE.STONE ||
               tile === this.TILE.WALL;
    },

    /**
     * Vérifier si une tuile est une plateforme (solide par le dessus uniquement)
     */
    isPlatform(grid, tileX, tileY) {
        if (tileY < 0 || tileY >= grid.length || tileX < 0 || tileX >= grid[0].length) {
            return false;
        }
        return grid[tileY][tileX] === this.TILE.PLATFORM;
    },

    /**
     * Vérifier si une tuile est dangereuse (pics)
     */
    isDangerous(grid, tileX, tileY) {
        if (tileY < 0 || tileY >= grid.length || tileX < 0 || tileX >= grid[0].length) {
            return false;
        }
        return grid[tileY][tileX] === this.TILE.SPIKES;
    },

    /**
     * Dessiner le niveau entier sur le canvas principal
     */
    render(ctx, levelData, cameraX, cameraY, frameCount) {
        const ts = this.TILE_SIZE;
        const biome = levelData.biome;
        const tiles = SpriteManager.sprites.tiles[biome];
        if (!tiles) return;

        // Calculer les tuiles visibles
        const startTX = Math.max(0, Math.floor(cameraX / ts));
        const endTX = Math.min(levelData.width, Math.ceil((cameraX + 480) / ts) + 1);
        const startTY = Math.max(0, Math.floor(cameraY / ts));
        const endTY = Math.min(levelData.height, Math.ceil((cameraY + 270) / ts) + 1);

        for (let ty = startTY; ty < endTY; ty++) {
            for (let tx = startTX; tx < endTX; tx++) {
                const tile = levelData.grid[ty][tx];
                const dx = tx * ts - cameraX;
                const dy = ty * ts - cameraY;

                let tileImg = null;
                switch (tile) {
                    case this.TILE.GROUND: tileImg = tiles.ground; break;
                    case this.TILE.DIRT: tileImg = tiles.dirt; break;
                    case this.TILE.STONE: tileImg = tiles.stone; break;
                    case this.TILE.PLATFORM: tileImg = tiles.platform; break;
                    case this.TILE.SPIKES: tileImg = tiles.spikes; break;
                    case this.TILE.DOOR: tileImg = tiles.door; break;
                    case this.TILE.WALL: tileImg = tiles.wall; break;
                    case this.TILE.TORCH:
                        if (Array.isArray(tiles.torch)) {
                            tileImg = tiles.torch[Math.floor(frameCount / 8) % tiles.torch.length];
                        }
                        break;
                }

                if (tileImg) {
                    if (tile === this.TILE.DOOR) {
                        ctx.drawImage(tileImg, Math.floor(dx), Math.floor(dy) - 16, 32, 32);
                    } else {
                        ctx.drawImage(tileImg, Math.floor(dx), Math.floor(dy));
                    }
                }
            }
        }
    },
};
