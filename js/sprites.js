/* ==========================================================================
   SpriteManager — Génération dynamique de VRAIES spritesheets Pixel Art
   Chaque sprite est dessiné pixel par pixel sur des mini-canvas
   ========================================================================== */

const SpriteManager = {
    sprites: {},

    // =====================================================================
    //  FONCTIONS UTILITAIRES DE DESSIN PIXEL ART
    // =====================================================================

    /** Poser un pixel unique */
    sp(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    },

    /** Remplir un rectangle */
    sr(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    },

    /** Dessiner une ligne horizontale */
    hline(ctx, x, y, len, color) {
        this.sr(ctx, x, y, len, 1, color);
    },

    /** Dessiner une ligne verticale */
    vline(ctx, x, y, len, color) {
        this.sr(ctx, x, y, 1, len, color);
    },

    /** Créer un canvas vide de la taille donnée */
    createCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { canvas: c, ctx };
    },

    /** Créer un frame (petite image) avec une fonction de dessin */
    createFrame(w, h, drawFn) {
        const { canvas, ctx } = this.createCanvas(w, h);
        drawFn(ctx);
        return canvas;
    },

    /** Dessiner un sprite à partir d'une map de caractères (pixel map) */
    drawFromMap(ctx, map, palette, offsetX = 0, offsetY = 0) {
        for (let y = 0; y < map.length; y++) {
            const row = map[y];
            for (let x = 0; x < row.length; x++) {
                const ch = row[x];
                if (ch !== '.' && palette[ch]) {
                    ctx.fillStyle = palette[ch];
                    ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
                }
            }
        }
    },

    /** Retourner horizontalement un canvas */
    flipH(canvas) {
        const flipped = document.createElement('canvas');
        flipped.width = canvas.width;
        flipped.height = canvas.height;
        const ctx = flipped.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(canvas, 0, 0);
        return flipped;
    },

    // =====================================================================
    //  PALETTES DE COULEURS
    // =====================================================================

    palettes: {
        hero: {
            '0': '#1a1020', // Contour
            '1': '#7a3c18', // Cheveux
            '2': '#a05828', // Cheveux clair
            '3': '#e8b878', // Peau
            '4': '#c89858', // Peau ombre
            '5': '#4488cc', // Armure bleue
            '6': '#2a6090', // Armure sombre
            '7': '#f0c040', // Or/dorures
            '8': '#d0d8e8', // Lame épée
            '9': '#3a3060', // Pantalon
            'a': '#f0f0ff', // Blanc (yeux)
            'b': '#dd3344', // Cape rouge
            'c': '#aa2233', // Cape sombre
            'd': '#6a4028', // Bottes
            'e': '#8a5838', // Bottes clair
            'f': '#f8f0c0', // Reflet épée
        },

        slime: {
            '0': '#0a2010', '1': '#1a6030', '2': '#30a050',
            '3': '#50d070', '4': '#80f0a0', 'a': '#f0f0ff',
            'b': '#101020',
        },

        skeleton: {
            '0': '#1a1020', '1': '#c8c0b0', '2': '#e8e0d0',
            '3': '#f8f0e0', '4': '#808070', '5': '#a09888',
            '6': '#606058', 'a': '#ff3030', 'b': '#101020',
        },

        bat: {
            '0': '#1a1020', '1': '#3a2050', '2': '#5a3878',
            '3': '#7a50a0', '4': '#9a70c0', 'a': '#ff4040',
            'b': '#101020',
        },

        mage: {
            '0': '#1a1020', '1': '#2a1840', '2': '#4a2868',
            '3': '#6a3890', '4': '#9a58c0', '5': '#c088e0',
            '6': '#e8b878', 'a': '#30ff60', 'b': '#101020',
            'c': '#ff6020',
        },

        golem: {
            '0': '#1a1820', '1': '#484040', '2': '#686060',
            '3': '#888080', '4': '#a89898', '5': '#c8b8b0',
            'a': '#ff8020', 'b': '#101020',
        },

        // Palettes de biomes pour les tuiles
        forest: {
            grass: '#4a8b3f', grassDark: '#356b2f', grassLight: '#5aab4f',
            dirt: '#8b6b3f', dirtDark: '#6a5030', dirtLight: '#ab8b5f',
            stone: '#808888', stoneDark: '#606068', stoneLight: '#a0a8a8',
            wood: '#8b6b3f', woodDark: '#6a4a28', woodLight: '#ab8b5f',
            sky: '#5898d0', skyLight: '#80b8e8',
            leaves: '#2d7b3f', leavesDark: '#1a5a28', leavesLight: '#40a050',
        },
        caves: {
            grass: '#384858', grassDark: '#283848', grassLight: '#485868',
            dirt: '#3a3848', dirtDark: '#2a2838', dirtLight: '#4a4858',
            stone: '#505868', stoneDark: '#383e48', stoneLight: '#687078',
            wood: '#585048', woodDark: '#403830', woodLight: '#706858',
            sky: '#101828', skyLight: '#182038',
            crystal: '#60a0d0', crystalGlow: '#a0d0ff',
        },
        swamp: {
            grass: '#3a5838', grassDark: '#2a4028', grassLight: '#4a6848',
            dirt: '#4a4838', dirtDark: '#3a3828', dirtLight: '#5a5848',
            stone: '#505848', stoneDark: '#404038', stoneLight: '#606850',
            wood: '#4a4030', woodDark: '#3a3020', woodLight: '#5a5040',
            sky: '#283028', skyLight: '#384038',
            fog: 'rgba(100, 120, 80, 0.3)',
        },
        volcano: {
            grass: '#584038', grassDark: '#483028', grassLight: '#685048',
            dirt: '#5a3828', dirtDark: '#4a2818', dirtLight: '#6a4838',
            stone: '#504040', stoneDark: '#403030', stoneLight: '#605050',
            wood: '#584030', woodDark: '#483020', woodLight: '#685040',
            sky: '#301810', skyLight: '#482818',
            lava: '#ff6020', lavaGlow: '#ff9040', lavaDark: '#d04010',
        },
        citadel: {
            grass: '#282838', grassDark: '#181828', grassLight: '#383848',
            dirt: '#201828', dirtDark: '#100818', dirtLight: '#302838',
            stone: '#303040', stoneDark: '#202030', stoneLight: '#404050',
            wood: '#282030', woodDark: '#181020', woodLight: '#383040',
            sky: '#080010', skyLight: '#100818',
            neon: '#a040ff', neonGlow: '#c080ff',
        },
    },

    // =====================================================================
    //  CHARGEMENT DU HÉROS DEPUIS LE DOSSIER (Hero Knight)
    // =====================================================================

    async loadHeroKnight() {
        const W = 100, H = 55;
        const result = { right: {}, left: {} };
        const anims = {
            idle: { folder: 'Idle', count: 8 },
            run: { folder: 'Run', count: 10 },
            jump: { folder: 'Jump', count: 3 },
            fall: { folder: 'Fall', count: 4 },
            attack: { folder: 'Attack1', count: 6 },
            hit: { folder: 'Hurt', count: 3 },
            death: { folder: 'Death', count: 10 }
        };

        const loadImage = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    // Si l'image n'est pas trouvée, créer un carré de secours
                    const fallback = this.createCanvas(W, H);
                    this.sr(fallback.ctx, 45, 20, 10, 10, '#ff00ff');
                    resolve(fallback.canvas);
                };
                img.src = src;
            });
        };

        for (const [animName, data] of Object.entries(anims)) {
            result.right[animName] = [];
            for (let i = 0; i < data.count; i++) {
                const src = `Hero Knight/Sprites/HeroKnight/${data.folder}/HeroKnight_${data.folder}_${i}.png`;
                const img = await loadImage(src);
                const { canvas, ctx } = this.createCanvas(W, H);
                ctx.drawImage(img, 0, 0);
                result.right[animName].push(canvas);
            }
            // Générer les versions pour la face gauche
            result.left[animName] = result.right[animName].map(c => this.flipH(c));
        }

        return result;
    },

    // =====================================================================
    //  GÉNÉRATION DES ENNEMIS (16×16 pixels)
    // =====================================================================

    generateSlime() {
        const W = 16, H = 16;
        const P = this.palettes.slime;
        const self = this;

        const idle1 = [
            '................',
            '................',
            '......0000......',
            '.....022220.....',
            '....02222220....',
            '...0222222200...',
            '...0222222200...',
            '...0222222200...',
            '...0222222200...',
            '...02a202a200...',
            '...02b202b200...',
            '..022233322200..',
            '..022222222200..',
            '.02222222222200.',
            '.01111111111100.',
            '..000000000000..',
        ];
        const idle2 = [
            '................',
            '................',
            '................',
            '.....000000.....',
            '....02222220....',
            '...0222222200...',
            '...0222222200...',
            '...0222222200...',
            '...0222222200...',
            '...0222222200...',
            '...02a202a200...',
            '..022b202b2200..',
            '..022233322200..',
            '.02222222222200.',
            '.01111111111100.',
            '..000000000000..',
        ];

        const walk1 = [
            '................',
            '......0000......',
            '.....022220.....',
            '....02222220....',
            '...0222222200...',
            '...0222222200...',
            '...0222222200...',
            '...0222222200...',
            '...02a202a200...',
            '...02b202b200...',
            '..022233322200..',
            '..022222222200..',
            '.02222222222200.',
            '.01111111111100.',
            '0.000000000000.0',
            '00..........0.00',
        ];
        const walk2 = [
            '................',
            '................',
            '.....000000.....',
            '....02222220....',
            '...0222222200...',
            '...0222222200...',
            '...0222222200...',
            '...0222222200...',
            '...02a202a200...',
            '...02b202b200...',
            '..022233322200..',
            '..022222222200..',
            '.02222222222200.',
            '0111111111111000',
            '0.000000000000.0',
            '................',
        ];

        const death1 = [
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '.....000000.....',
            '....02222220....',
            '...0222222200...',
            '...0222222200...',
            '..02a2002a2200..',
            '..022233322200..',
            '.02222222222200.',
            '..000000000000..',
            '................',
        ];

        function makeFrame(map) {
            return self.createFrame(W, H, ctx => self.drawFromMap(ctx, map, P));
        }

        const result = {
            idle: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle1), makeFrame(idle2)],
            walk: [makeFrame(walk1), makeFrame(walk2), makeFrame(walk1), makeFrame(walk2)],
            attack: [makeFrame(idle1), makeFrame(walk1), makeFrame(idle1)],
            hit: [makeFrame(idle2), makeFrame(idle1)],
            death: [makeFrame(idle1), makeFrame(death1), makeFrame(death1)],
        };
        return result;
    },

    generateSkeleton() {
        const W = 16, H = 16;
        const P = this.palettes.skeleton;
        const self = this;

        const idle1 = [
            '................',
            '.....00000......',
            '....0222220.....',
            '....0232320.....',
            '....0222220.....',
            '.....02220......',
            '.....00000......',
            '....0111110.....',
            '...01111110.....',
            '..040111104.....',
            '.....01110......',
            '.....01110......',
            '.....06060......',
            '....066060......',
            '....06.060......',
            '...00..000......',
        ];
        const idle2 = [
            '................',
            '.....00000......',
            '....0222220.....',
            '....0232320.....',
            '....0222220.....',
            '.....02220......',
            '.....00000......',
            '....0111110.....',
            '...011111100....',
            '..040111104.....',
            '.....01110......',
            '.....01110......',
            '.....06060......',
            '....060.60......',
            '....06..60......',
            '...000.000......',
        ];

        const walk1 = [
            '................',
            '.....00000......',
            '....0222220.....',
            '....0232320.....',
            '....0222220.....',
            '.....02220......',
            '.....00000......',
            '....0111110.....',
            '...011111100....',
            '..040111104.....',
            '.....01110......',
            '.....01110......',
            '....060060......',
            '...060..060.....',
            '...06....60.....',
            '..000...000.....',
        ];
        const walk2 = [
            '................',
            '.....00000......',
            '....0222220.....',
            '....0232320.....',
            '....0222220.....',
            '.....02220......',
            '.....00000......',
            '....0111110.....',
            '...011111100....',
            '..040111104.....',
            '.....01110......',
            '.....01110......',
            '.....06060......',
            '.....06060......',
            '....060060......',
            '...000..000.....',
        ];

        const atk1 = [
            '................',
            '.....00000......',
            '....0222220.....',
            '....02a2a20.....',
            '....0222220.....',
            '.....02220......',
            '.....00000...0..',
            '....0111110.040.',
            '...01111110.040.',
            '..0401111044440.',
            '.....01110..0...',
            '.....01110......',
            '.....06060......',
            '....066060......',
            '....06.060......',
            '...00..000......',
        ];

        function makeFrame(map) {
            return self.createFrame(W, H, ctx => self.drawFromMap(ctx, map, P));
        }

        const frames = {
            idle: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle1), makeFrame(idle2)],
            walk: [makeFrame(walk1), makeFrame(walk2), makeFrame(walk1), makeFrame(walk2)],
            attack: [makeFrame(idle1), makeFrame(atk1), makeFrame(atk1)],
            hit: [makeFrame(idle2), makeFrame(idle1)],
            death: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle2)],
        };
        return frames;
    },

    generateBat() {
        const W = 16, H = 16;
        const P = this.palettes.bat;
        const self = this;

        const fly1 = [
            '................',
            '................',
            '................',
            '..0..........0..',
            '.020........020.',
            '0220........0220',
            '02200..00..00220',
            '022200222200220.',
            '.0222222222220..',
            '..022a2002a20...',
            '..02222222220...',
            '...0222bb220....',
            '....02222220....',
            '.....022220.....',
            '......0220......',
            '.......00.......',
        ];
        const fly2 = [
            '................',
            '................',
            '................',
            '................',
            '................',
            '....0......0....',
            '...020....020...',
            '..02200..00220..',
            '..0222222222200.',
            '..022a2002a2200.',
            '..02222222222200',
            '...0222bb2220...',
            '....02222220....',
            '.....022220.....',
            '......0220......',
            '.......00.......',
        ];
        const fly3 = [
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '....00....00....',
            '...022200022200.',
            '..0222222222200.',
            '..022a2002a2200.',
            '.022222222222200',
            '022222bb22220...',
            '02222222220.....',
            '.02222222200....',
            '..0022220.......',
            '....000.........',
        ];

        function makeFrame(map) {
            return self.createFrame(W, H, ctx => self.drawFromMap(ctx, map, P));
        }

        return {
            idle: [makeFrame(fly1), makeFrame(fly2), makeFrame(fly3), makeFrame(fly2)],
            walk: [makeFrame(fly1), makeFrame(fly2), makeFrame(fly3), makeFrame(fly2)],
            attack: [makeFrame(fly3), makeFrame(fly1), makeFrame(fly3)],
            hit: [makeFrame(fly2), makeFrame(fly1)],
            death: [makeFrame(fly1), makeFrame(fly3), makeFrame(fly3)],
        };
    },

    generateMage() {
        const W = 16, H = 16;
        const P = this.palettes.mage;
        const self = this;

        const idle1 = [
            '......000.......',
            '.....02220......',
            '....0222220.....',
            '....0266620.....',
            '....06a06a0.....',
            '....0666660.....',
            '.....06660......',
            '.....00000......',
            '....0333330.....',
            '...033343330....',
            '...033333330....',
            '..0444333444....',
            '...043333340....',
            '....0333330.....',
            '...011001100....',
            '..0110..0110....',
        ];
        const idle2 = [
            '......000.......',
            '.....02220......',
            '....0222220.....',
            '....0266620.....',
            '....06a06a0.....',
            '....0666660.....',
            '.....06660......',
            '.....00000......',
            '....0333330.....',
            '...033343330....',
            '...033333330....',
            '..0444333444....',
            '...043333340....',
            '....0333330.....',
            '...011.0110.....',
            '..0110.0110.....',
        ];

        const atk1 = [
            '......000.......',
            '.....02220......',
            '....0222220.....',
            '....0266620.....',
            '....06a06a0.....',
            '....0666660.....',
            '.....06660......',
            '.....00000..c...',
            '....0333330.cc..',
            '...033343330ccc.',
            '...033333334c...',
            '..04443334440...',
            '...043333340....',
            '....0333330.....',
            '...011001100....',
            '..0110..0110....',
        ];

        function makeFrame(map) {
            return self.createFrame(W, H, ctx => self.drawFromMap(ctx, map, P));
        }

        return {
            idle: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle1), makeFrame(idle2)],
            walk: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle1), makeFrame(idle2)],
            attack: [makeFrame(idle1), makeFrame(atk1), makeFrame(atk1)],
            hit: [makeFrame(idle2), makeFrame(idle1)],
            death: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle2)],
        };
    },

    generateGolem() {
        const W = 16, H = 16;
        const P = this.palettes.golem;
        const self = this;

        const idle1 = [
            '................',
            '....000000......',
            '...02222220.....',
            '..0223223220....',
            '..022a22a220....',
            '..0222222220....',
            '...022332200....',
            '...00000000.....',
            '..0333333330....',
            '.03333333330....',
            '.033333333330...',
            '.033344433330...',
            '..0333333330....',
            '..0223002230....',
            '.02230.02230....',
            '.0000..00000....',
        ];
        const idle2 = [
            '................',
            '....000000......',
            '...02222220.....',
            '..0223223220....',
            '..022a22a220....',
            '..0222222220....',
            '...022332200....',
            '...00000000.....',
            '..0333333330....',
            '.03333333330....',
            '.033333333330...',
            '.033344433330...',
            '..0333333330....',
            '..0223002230....',
            '.02230.02230....',
            '.00000.00000....',
        ];

        function makeFrame(map) {
            return self.createFrame(W, H, ctx => self.drawFromMap(ctx, map, P));
        }

        return {
            idle: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle1), makeFrame(idle2)],
            walk: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle1), makeFrame(idle2)],
            attack: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle1)],
            hit: [makeFrame(idle2), makeFrame(idle1)],
            death: [makeFrame(idle1), makeFrame(idle2), makeFrame(idle2)],
        };
    },

    // =====================================================================
    //  GÉNÉRATION DES BOSS (32×32 pixels)
    // =====================================================================

    generateBoss(bossId) {
        const W = 32, H = 32;
        const self = this;

        // Palettes spécifiques à chaque boss
        const bossPalettes = {
            1: { // Roi Slime
                '0':'#0a2010', '1':'#1a6030', '2':'#30a050', '3':'#50d070',
                '4':'#80f0a0', '5':'#f0c040', '6':'#d0a020', 'a':'#f0f0ff', 'b':'#101020',
                'c':'#ff3030', 'r':'#e8c060',
            },
            2: { // Chevalier Noir
                '0':'#101018', '1':'#282838', '2':'#404058', '3':'#585878',
                '4':'#787898', '5':'#c83030', '6':'#e05050', 'a':'#e04040', 'b':'#101020',
                'c':'#a0a0b8', 'd':'#c0c0d8', 'r':'#a01020',
            },
            3: { // Dragon de Lave
                '0':'#201008', '1':'#803010', '2':'#c05020', '3':'#e07030',
                '4':'#f0a050', '5':'#f0c070', '6':'#ffe090', 'a':'#ffff40', 'b':'#101020',
                'c':'#f04020', 'r':'#ff6020',
            },
            4: { // Hydre des Marais
                '0':'#0a1810', '1':'#1a3820', '2':'#2a5830', '3':'#3a7840',
                '4':'#50a058', '5':'#70c070', '6':'#90e090', 'a':'#ff4040', 'b':'#101020',
                'c':'#6040a0', 'r':'#483868',
            },
            5: { // Nécromancien
                '0':'#100818', '1':'#281838', '2':'#402858', '3':'#583878',
                '4':'#705098', '5':'#9070b8', '6':'#b090d8', 'a':'#40ff40', 'b':'#101020',
                'c':'#e0e0f0', 'd':'#f0f0ff', 'r':'#6020a0',
            },
            6: { // Golem de Cristal
                '0':'#081828', '1':'#183858', '2':'#285888', '3':'#3878a8',
                '4':'#58a0d0', '5':'#80c0e8', '6':'#a8e0ff', 'a':'#ffffff', 'b':'#101020',
                'c':'#60d0f0', 'r':'#2888c0',
            },
            7: { // Spectre du Vide
                '0':'#080010', '1':'#180828', '2':'#281040', '3':'#381858',
                '4':'#502070', '5':'#683088', '6':'#8040a0', 'a':'#a0f0ff', 'b':'#101020',
                'c':'#c060ff', 'r':'#5020a0',
            },
            8: { // Titan de Fer
                '0':'#181818', '1':'#383838', '2':'#585858', '3':'#787878',
                '4':'#989898', '5':'#b8b8b8', '6':'#d0d0d0', 'a':'#ff8020', 'b':'#101020',
                'c':'#f0c040', 'r':'#808080',
            },
            9: { // Archimage du Chaos
                '0':'#101020', '1':'#282048', '2':'#403068', '3':'#584088',
                '4':'#7050a8', '5':'#a070d0', '6':'#c090f0', 'a':'#ff20ff', 'b':'#101020',
                'c':'#40c0ff', 'd':'#ff6020', 'r':'#8040c0',
            },
            10: { // Seigneur de Stalum
                '0':'#100008', '1':'#300018', '2':'#500028', '3':'#800040',
                '4':'#a00058', '5':'#c02070', '6':'#e04090', 'a':'#ff0000', 'b':'#101020',
                'c':'#f0c040', 'd':'#f0f0ff', 'r':'#d02040',
            },
        };

        const pal = bossPalettes[bossId] || bossPalettes[1];

        // Template de boss humanoïde (utilisé par boss 2,5,9,10)
        function drawHumanoidBoss(ctx, frame, p) {
            // Tête
            self.sr(ctx, 11, 2, 10, 10, p['2']);
            self.sr(ctx, 12, 3, 8, 8, p['3']);
            // Yeux
            self.sr(ctx, 13, 5, 3, 3, p['a']);
            self.sr(ctx, 18, 5, 3, 3, p['a']);
            self.sp(ctx, 14, 6, p['b']);
            self.sp(ctx, 19, 6, p['b']);
            // Casque/chapeau
            self.sr(ctx, 10, 1, 12, 3, p['1']);
            self.sr(ctx, 9, 2, 14, 1, p['0']);
            // Corps
            const bodyY = frame % 2 === 0 ? 12 : 11;
            self.sr(ctx, 8, bodyY, 16, 10, p['2']);
            self.sr(ctx, 9, bodyY + 1, 14, 8, p['3']);
            // Détails armure
            self.sr(ctx, 14, bodyY + 2, 4, 4, p['4']);
            self.hline(ctx, 9, bodyY + 7, 14, p['c'] || p['4']);
            // Bras
            self.sr(ctx, 4, bodyY + 1, 4, 8, p['2']);
            self.sr(ctx, 24, bodyY + 1, 4, 8, p['2']);
            // Jambes
            self.sr(ctx, 10, bodyY + 10, 5, 6, p['1']);
            self.sr(ctx, 17, bodyY + 10, 5, 6, p['1']);
            // Bottes
            self.sr(ctx, 9, bodyY + 14, 6, 3, p['0']);
            self.sr(ctx, 17, bodyY + 14, 6, 3, p['0']);
            // Contour
            self.sr(ctx, 10, 0, 12, 1, p['0']);
        }

        // Template de boss bête/créature (utilisé par boss 1,3,4)
        function drawBeastBoss(ctx, frame, p) {
            const bounce = frame % 2 === 0 ? 0 : 1;
            // Corps principal (gros blob)
            self.sr(ctx, 4, 6 + bounce, 24, 18, p['2']);
            self.sr(ctx, 6, 4 + bounce, 20, 2, p['2']);
            self.sr(ctx, 8, 2 + bounce, 16, 2, p['3']);
            self.sr(ctx, 6, 8 + bounce, 20, 14, p['3']);
            self.sr(ctx, 8, 10 + bounce, 16, 10, p['4']);
            // Yeux
            self.sr(ctx, 8, 10 + bounce, 4, 4, p['a']);
            self.sr(ctx, 20, 10 + bounce, 4, 4, p['a']);
            self.sr(ctx, 9, 11 + bounce, 2, 2, p['b']);
            self.sr(ctx, 21, 11 + bounce, 2, 2, p['b']);
            // Bouche
            self.sr(ctx, 10, 18 + bounce, 12, 3, p['0']);
            self.sr(ctx, 11, 19 + bounce, 10, 1, p['5']);
            // Base
            self.sr(ctx, 2, 24 + bounce, 28, 4, p['1']);
            self.sr(ctx, 4, 28 + bounce, 24, 2, p['0']);
        }

        // Template de boss golem/géant (utilisé par boss 6,7,8)
        function drawGolemBoss(ctx, frame, p) {
            const sway = frame % 2 === 0 ? 0 : 1;
            // Tête
            self.sr(ctx, 10, 1, 12, 8, p['2']);
            self.sr(ctx, 11, 2, 10, 6, p['3']);
            self.sr(ctx, 12, 3, 3, 3, p['a']);
            self.sr(ctx, 19, 3, 3, 3, p['a']);
            self.sp(ctx, 13, 4, p['b']);
            self.sp(ctx, 20, 4, p['b']);
            // Corps massif
            self.sr(ctx, 6, 9 + sway, 20, 14, p['2']);
            self.sr(ctx, 8, 10 + sway, 16, 12, p['3']);
            // Détails
            self.sr(ctx, 12, 13 + sway, 8, 4, p['4']);
            self.sr(ctx, 14, 14 + sway, 4, 2, p['5']);
            // Bras massifs
            self.sr(ctx, 1, 10 + sway, 5, 12, p['2']);
            self.sr(ctx, 2, 11 + sway, 3, 10, p['3']);
            self.sr(ctx, 26, 10 + sway, 5, 12, p['2']);
            self.sr(ctx, 27, 11 + sway, 3, 10, p['3']);
            // Mains/poings
            self.sr(ctx, 0, 20 + sway, 6, 5, p['1']);
            self.sr(ctx, 26, 20 + sway, 6, 5, p['1']);
            // Jambes
            self.sr(ctx, 8, 23 + sway, 6, 7, p['1']);
            self.sr(ctx, 18, 23 + sway, 6, 7, p['1']);
            self.sr(ctx, 7, 28, 7, 3, p['0']);
            self.sr(ctx, 18, 28, 7, 3, p['0']);
        }

        // Sélection du template selon le boss
        let drawFn;
        switch (bossId) {
            case 1: // Roi Slime
                drawFn = (ctx, frame) => {
                    drawBeastBoss(ctx, frame, pal);
                    // Couronne
                    self.sr(ctx, 10, 1, 12, 3, pal['5']);
                    self.sr(ctx, 8, 3, 16, 1, pal['6']);
                    self.sp(ctx, 10, 0, pal['5']);
                    self.sp(ctx, 14, 0, pal['5']);
                    self.sp(ctx, 18, 0, pal['5']);
                    self.sp(ctx, 22, 0, pal['5']);
                    // Gemmes
                    self.sp(ctx, 12, 1, pal['c']);
                    self.sp(ctx, 16, 1, pal['c']);
                    self.sp(ctx, 20, 1, pal['c']);
                };
                break;
            case 2: // Chevalier Noir
                drawFn = (ctx, frame) => {
                    drawHumanoidBoss(ctx, frame, pal);
                    // Grande épée
                    self.sr(ctx, 27, 3, 3, 2, pal['c']);
                    self.sr(ctx, 28, 1, 2, 14, pal['c']);
                    self.sr(ctx, 27, 0, 4, 1, pal['d']);
                    self.sp(ctx, 28, 15, pal['5']);
                    self.sp(ctx, 29, 15, pal['5']);
                };
                break;
            case 3: // Dragon de Lave
                drawFn = (ctx, frame) => {
                    drawBeastBoss(ctx, frame, pal);
                    // Cornes
                    self.sr(ctx, 6, 0, 3, 5, pal['1']);
                    self.sr(ctx, 23, 0, 3, 5, pal['1']);
                    // Ailes
                    const wingY = frame % 2 === 0 ? 4 : 6;
                    self.sr(ctx, 0, wingY, 4, 10, pal['2']);
                    self.sr(ctx, 28, wingY, 4, 10, pal['2']);
                    self.sr(ctx, 0, wingY + 1, 3, 8, pal['3']);
                    self.sr(ctx, 29, wingY + 1, 3, 8, pal['3']);
                };
                break;
            case 4: // Hydre des Marais
                drawFn = (ctx, frame) => {
                    // Corps central
                    self.sr(ctx, 8, 14, 16, 14, pal['2']);
                    self.sr(ctx, 10, 16, 12, 10, pal['3']);
                    self.sr(ctx, 6, 26, 20, 4, pal['1']);
                    self.sr(ctx, 8, 29, 16, 2, pal['0']);
                    // 3 têtes
                    const headY = frame % 2 === 0 ? 0 : 1;
                    // Tête gauche
                    self.sr(ctx, 2, 4 + headY, 8, 6, pal['2']);
                    self.sr(ctx, 3, 5 + headY, 6, 4, pal['3']);
                    self.sr(ctx, 3, 6 + headY, 2, 2, pal['a']);
                    self.sp(ctx, 3, 7 + headY, pal['b']);
                    self.sr(ctx, 5, 10 + headY, 3, 6, pal['2']);
                    // Tête centrale
                    self.sr(ctx, 10, 2 + headY, 12, 8, pal['2']);
                    self.sr(ctx, 11, 3 + headY, 10, 6, pal['3']);
                    self.sr(ctx, 12, 4 + headY, 3, 3, pal['a']);
                    self.sr(ctx, 19, 4 + headY, 3, 3, pal['a']);
                    self.sp(ctx, 13, 5 + headY, pal['b']);
                    self.sp(ctx, 20, 5 + headY, pal['b']);
                    self.sr(ctx, 14, 10 + headY, 4, 6, pal['2']);
                    // Tête droite
                    self.sr(ctx, 22, 4 + headY, 8, 6, pal['2']);
                    self.sr(ctx, 23, 5 + headY, 6, 4, pal['3']);
                    self.sr(ctx, 27, 6 + headY, 2, 2, pal['a']);
                    self.sp(ctx, 28, 7 + headY, pal['b']);
                    self.sr(ctx, 24, 10 + headY, 3, 6, pal['2']);
                };
                break;
            case 5: // Nécromancien
                drawFn = (ctx, frame) => {
                    drawHumanoidBoss(ctx, frame, pal);
                    // Capuche pointue
                    self.sr(ctx, 12, 0, 8, 4, pal['1']);
                    self.sr(ctx, 14, 0, 4, 1, pal['1']);
                    self.sp(ctx, 15, 0, pal['0']);
                    self.sp(ctx, 16, 0, pal['0']);
                    // Bâton
                    self.vline(ctx, 4, 2, 24, pal['1']);
                    self.sr(ctx, 2, 0, 5, 3, pal['a']);
                    self.sp(ctx, 4, 1, pal['c'] || pal['a']);
                    // Rune brillante
                    const glow = frame % 2 === 0;
                    if (glow) {
                        self.sp(ctx, 3, 0, pal['a']);
                        self.sp(ctx, 5, 0, pal['a']);
                        self.sp(ctx, 4, 0, pal['a']);
                    }
                };
                break;
            case 6: // Golem de Cristal
                drawFn = (ctx, frame) => {
                    drawGolemBoss(ctx, frame, pal);
                    // Cristaux sur les épaules
                    self.sr(ctx, 3, 6, 4, 5, pal['5']);
                    self.sr(ctx, 4, 4, 2, 3, pal['6']);
                    self.sr(ctx, 25, 6, 4, 5, pal['5']);
                    self.sr(ctx, 26, 4, 2, 3, pal['6']);
                    // Cristal sur la tête
                    self.sr(ctx, 14, 0, 4, 3, pal['6']);
                    self.sp(ctx, 15, 0, pal['a']);
                };
                break;
            case 7: // Spectre du Vide
                drawFn = (ctx, frame) => {
                    const float = frame % 2 === 0 ? 0 : 2;
                    // Corps fantomatique (forme éthérée)
                    self.sr(ctx, 8, 4 + float, 16, 16, pal['2']);
                    self.sr(ctx, 10, 6 + float, 12, 12, pal['3']);
                    self.sr(ctx, 12, 8 + float, 8, 8, pal['4']);
                    // Tête/capuche
                    self.sr(ctx, 10, 2 + float, 12, 8, pal['1']);
                    self.sr(ctx, 11, 3 + float, 10, 6, pal['2']);
                    // Yeux luisants
                    self.sr(ctx, 12, 5 + float, 3, 3, pal['a']);
                    self.sr(ctx, 19, 5 + float, 3, 3, pal['a']);
                    // Queue éthérée
                    self.sr(ctx, 10, 20 + float, 12, 4, pal['3']);
                    self.sr(ctx, 12, 24 + float, 8, 3, pal['4']);
                    self.sr(ctx, 14, 27 + float, 4, 2, pal['5']);
                    // Bras fantômes
                    self.sr(ctx, 4, 10 + float, 4, 8, pal['3']);
                    self.sr(ctx, 24, 10 + float, 4, 8, pal['3']);
                };
                break;
            case 8: // Titan de Fer
                drawFn = (ctx, frame) => {
                    drawGolemBoss(ctx, frame, pal);
                    // Rivets/boulons
                    for (let i = 0; i < 4; i++) {
                        self.sp(ctx, 9 + i * 4, 12, pal['c']);
                        self.sp(ctx, 9 + i * 4, 20, pal['c']);
                    }
                    // Visière
                    self.sr(ctx, 12, 4, 8, 1, pal['a']);
                    self.hline(ctx, 10, 7, 12, pal['0']);
                };
                break;
            case 9: // Archimage du Chaos
                drawFn = (ctx, frame) => {
                    drawHumanoidBoss(ctx, frame, pal);
                    // Grand chapeau pointu
                    self.sr(ctx, 10, 0, 12, 4, pal['1']);
                    self.sr(ctx, 12, 0, 8, 1, pal['2']);
                    self.sr(ctx, 14, 0, 4, 1, pal['3']);
                    self.sp(ctx, 15, 0, pal['c']);
                    // Orbes magiques
                    const orbPhase = frame % 4;
                    const orbColors = [pal['c'], pal['d'], pal['a'], pal['6']];
                    self.sr(ctx, 2, 8, 3, 3, orbColors[orbPhase]);
                    self.sr(ctx, 27, 8, 3, 3, orbColors[(orbPhase + 2) % 4]);
                    // Bâton
                    self.vline(ctx, 3, 4, 20, pal['4']);
                };
                break;
            case 10: // Seigneur de Stalum (Boss Final)
                drawFn = (ctx, frame) => {
                    drawHumanoidBoss(ctx, frame, pal);
                    // Cornes démoniaques
                    self.sr(ctx, 8, 0, 3, 4, pal['1']);
                    self.sr(ctx, 21, 0, 3, 4, pal['1']);
                    self.sp(ctx, 8, 0, pal['c']);
                    self.sp(ctx, 23, 0, pal['c']);
                    // Cape géante
                    self.sr(ctx, 2, 10, 4, 18, pal['1']);
                    self.sr(ctx, 26, 10, 4, 18, pal['1']);
                    self.sr(ctx, 3, 11, 2, 16, pal['2']);
                    self.sr(ctx, 27, 11, 2, 16, pal['2']);
                    // Aura
                    const glowing = frame % 2 === 0;
                    if (glowing) {
                        self.sr(ctx, 14, 14, 4, 4, pal['a']);
                        self.sp(ctx, 15, 15, pal['c']);
                        self.sp(ctx, 16, 15, pal['c']);
                    }
                    // Épée géante
                    self.sr(ctx, 28, 2, 2, 20, pal['d']);
                    self.sr(ctx, 27, 0, 4, 2, pal['d']);
                    self.sp(ctx, 28, 0, pal['c']);
                    self.sp(ctx, 29, 0, pal['c']);
                };
                break;
            default:
                drawFn = (ctx, frame) => drawBeastBoss(ctx, frame, pal);
        }

        // Générer les frames d'animation
        const idle = [], attack = [], hit = [], death = [];
        for (let f = 0; f < 4; f++) {
            idle.push(self.createFrame(W, H, ctx => drawFn(ctx, f)));
        }
        for (let f = 0; f < 4; f++) {
            attack.push(self.createFrame(W, H, ctx => {
                drawFn(ctx, f);
                // Effet d'attaque : flash ou projectile
                const atkX = 28 + (f % 2) * 2;
                self.sr(ctx, atkX > 30 ? 30 : atkX, 12, 2, 4, pal['a']);
            }));
        }
        for (let f = 0; f < 2; f++) {
            hit.push(self.createFrame(W, H, ctx => {
                drawFn(ctx, f);
                // Flash blanc sur tout le sprite
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(0, 0, W, H);
            }));
        }
        for (let f = 0; f < 4; f++) {
            death.push(self.createFrame(W, H, ctx => {
                ctx.globalAlpha = 1 - (f * 0.25);
                drawFn(ctx, 0);
                ctx.globalAlpha = 1;
            }));
        }

        return {
            idle, attack, hit, death,
            walk: idle, // les boss ne marchent pas, ils glissent
        };
    },

    // =====================================================================
    //  GÉNÉRATION DES TUILES (16×16 pixels)
    // =====================================================================

    generateTiles(biome) {
        const W = 16, H = 16;
        const self = this;
        const bp = this.palettes[biome] || this.palettes.forest;

        const tiles = {};

        // --- Sol (herbe/surface) ---
        tiles.ground = this.createFrame(W, H, (ctx) => {
            self.sr(ctx, 0, 0, 16, 16, bp.dirt);
            self.sr(ctx, 0, 0, 16, 4, bp.grass);
            self.sr(ctx, 0, 0, 16, 2, bp.grassLight);
            // Texture herbe
            for (let i = 0; i < 6; i++) {
                const x = (i * 3 + 1) % 14;
                self.sp(ctx, x, 3, bp.grassDark);
                self.sp(ctx, x + 1, 2, bp.grass);
            }
            // Texture terre
            for (let i = 0; i < 4; i++) {
                const x = (i * 5 + 2) % 14;
                const y = 8 + (i * 3) % 6;
                self.sp(ctx, x, y, bp.dirtDark);
                self.sp(ctx, x + 1, y + 1, bp.dirtLight);
            }
        });

        // --- Sol profond (terre pleine) ---
        tiles.dirt = this.createFrame(W, H, (ctx) => {
            self.sr(ctx, 0, 0, 16, 16, bp.dirt);
            for (let i = 0; i < 8; i++) {
                const x = (i * 5 + 1) % 14;
                const y = (i * 3 + 2) % 14;
                self.sp(ctx, x, y, bp.dirtDark);
                self.sp(ctx, x + 1, y + 1, bp.dirtLight);
            }
        });

        // --- Pierre ---
        tiles.stone = this.createFrame(W, H, (ctx) => {
            self.sr(ctx, 0, 0, 16, 16, bp.stone);
            // Joints de pierre
            self.hline(ctx, 0, 5, 16, bp.stoneDark);
            self.hline(ctx, 0, 11, 16, bp.stoneDark);
            self.vline(ctx, 7, 0, 5, bp.stoneDark);
            self.vline(ctx, 3, 6, 5, bp.stoneDark);
            self.vline(ctx, 11, 6, 5, bp.stoneDark);
            self.vline(ctx, 7, 12, 4, bp.stoneDark);
            // Reflets
            self.sp(ctx, 2, 2, bp.stoneLight);
            self.sp(ctx, 10, 8, bp.stoneLight);
            self.sp(ctx, 5, 13, bp.stoneLight);
        });

        // --- Plateforme (bois) ---
        tiles.platform = this.createFrame(W, H, (ctx) => {
            self.sr(ctx, 0, 0, 16, 6, bp.wood);
            self.sr(ctx, 0, 0, 16, 2, bp.woodLight);
            self.hline(ctx, 0, 5, 16, bp.woodDark);
            // Grains du bois
            for (let i = 0; i < 4; i++) {
                self.sp(ctx, i * 4 + 1, 3, bp.woodDark);
                self.sp(ctx, i * 4 + 2, 2, bp.woodLight);
            }
        });

        // --- Pics (danger) ---
        tiles.spikes = this.createFrame(W, H, (ctx) => {
            const spikeColor = bp.stoneDark;
            const tipColor = bp.stoneLight;
            // 4 pics triangulaires
            for (let i = 0; i < 4; i++) {
                const bx = i * 4;
                for (let y = 0; y < 10; y++) {
                    const halfW = Math.floor((10 - y) * 2 / 10);
                    if (halfW > 0) {
                        self.sr(ctx, bx + 2 - halfW, 15 - y, halfW * 2, 1, spikeColor);
                    }
                }
                self.sp(ctx, bx + 2, 6, tipColor);
            }
        });

        // --- Porte (sortie de niveau) ---
        tiles.door = this.createFrame(W, H, (ctx) => {
            // Cadre de porte
            self.sr(ctx, 2, 0, 12, 16, bp.woodDark);
            self.sr(ctx, 3, 1, 10, 14, bp.wood);
            self.sr(ctx, 4, 2, 8, 12, '#1a1020');
            // Arc supérieur
            self.sr(ctx, 5, 1, 6, 2, bp.woodLight);
            // Poignée
            self.sp(ctx, 10, 8, '#f0c040');
            self.sp(ctx, 10, 9, '#f0c040');
            // Lumière intérieure
            self.sr(ctx, 6, 4, 4, 8, '#2a2040');
        });

        // --- Vide / ciel ---
        tiles.sky = this.createFrame(W, H, (ctx) => {
            self.sr(ctx, 0, 0, 16, 16, bp.sky);
            // Subtiles étoiles/nuages pour certains biomes
            self.sp(ctx, 4, 3, bp.skyLight);
            self.sp(ctx, 11, 7, bp.skyLight);
            self.sp(ctx, 7, 12, bp.skyLight);
        });

        // --- Mur latéral ---
        tiles.wall = this.createFrame(W, H, (ctx) => {
            self.sr(ctx, 0, 0, 16, 16, bp.stone);
            self.vline(ctx, 0, 0, 16, bp.stoneDark);
            self.vline(ctx, 15, 0, 16, bp.stoneDark);
            // Texture
            for (let y = 0; y < 16; y += 4) {
                self.hline(ctx, 1, y, 14, bp.stoneDark);
            }
            self.sp(ctx, 4, 2, bp.stoneLight);
            self.sp(ctx, 10, 6, bp.stoneLight);
            self.sp(ctx, 6, 10, bp.stoneLight);
            self.sp(ctx, 12, 14, bp.stoneLight);
        });

        // --- Torche (décor animé) ---
        tiles.torch = [];
        for (let f = 0; f < 4; f++) {
            tiles.torch.push(this.createFrame(W, H, (ctx) => {
                // Manche
                self.sr(ctx, 7, 6, 2, 10, bp.woodDark);
                // Flamme (varie par frame)
                const flameH = 4 + (f % 2);
                self.sr(ctx, 5, 6 - flameH, 6, flameH, '#f0a020');
                self.sr(ctx, 6, 5 - flameH, 4, flameH - 1, '#f0c040');
                self.sr(ctx, 7, 4 - flameH, 2, flameH - 2, '#f0f080');
            }));
        }

        return tiles;
    },

    // =====================================================================
    //  ÉLÉMENTS D'INTERFACE (16×16 pixels)
    // =====================================================================

    generateUI() {
        const self = this;

        // --- Cœur plein ---
        const heartFull = this.createFrame(16, 16, (ctx) => {
            const c = '#e03040';
            const cd = '#a02030';
            const cl = '#ff5060';
            self.sr(ctx, 2, 3, 5, 5, c);
            self.sr(ctx, 9, 3, 5, 5, c);
            self.sr(ctx, 1, 4, 3, 3, c);
            self.sr(ctx, 12, 4, 3, 3, c);
            self.sr(ctx, 3, 8, 10, 3, c);
            self.sr(ctx, 4, 11, 8, 2, c);
            self.sr(ctx, 5, 13, 6, 1, c);
            self.sr(ctx, 6, 14, 4, 1, c);
            self.sr(ctx, 7, 15, 2, 1, c);
            // Reflet
            self.sp(ctx, 3, 4, cl);
            self.sp(ctx, 4, 4, cl);
            self.sp(ctx, 3, 5, cl);
            // Ombre
            self.sp(ctx, 10, 9, cd);
            self.sp(ctx, 11, 9, cd);
        });

        // --- Cœur vide ---
        const heartEmpty = this.createFrame(16, 16, (ctx) => {
            const c = '#404050';
            const cd = '#303040';
            self.sr(ctx, 2, 3, 5, 5, c);
            self.sr(ctx, 9, 3, 5, 5, c);
            self.sr(ctx, 1, 4, 3, 3, c);
            self.sr(ctx, 12, 4, 3, 3, c);
            self.sr(ctx, 3, 8, 10, 3, c);
            self.sr(ctx, 4, 11, 8, 2, c);
            self.sr(ctx, 5, 13, 6, 1, c);
            self.sr(ctx, 6, 14, 4, 1, c);
            self.sr(ctx, 7, 15, 2, 1, c);
            self.sp(ctx, 3, 4, cd);
        });

        // --- Pièce (4 frames d'animation de rotation) ---
        const coin = [];
        for (let f = 0; f < 4; f++) {
            coin.push(this.createFrame(16, 16, (ctx) => {
                const widths = [8, 6, 2, 6];
                const w = widths[f];
                const x = 8 - Math.floor(w / 2);
                self.sr(ctx, x, 3, w, 10, '#e8c060');
                self.sr(ctx, x + 1, 2, w - 2, 1, '#e8c060');
                self.sr(ctx, x + 1, 13, w - 2, 1, '#e8c060');
                if (w > 3) {
                    self.sr(ctx, x + 1, 4, w - 2, 8, '#f0d070');
                    self.sp(ctx, x + 1, 4, '#f8e898');
                }
                if (w > 5) {
                    // Symbole $ au centre
                    self.vline(ctx, 8, 5, 6, '#c0a030');
                }
            }));
        }

        // --- Potion de vie ---
        const potion = this.createFrame(16, 16, (ctx) => {
            // Bouchon
            self.sr(ctx, 6, 2, 4, 2, '#6a4028');
            // Goulot
            self.sr(ctx, 7, 4, 2, 2, '#a0a0b0');
            // Corps
            self.sr(ctx, 4, 6, 8, 8, '#a0a0b0');
            self.sr(ctx, 5, 7, 6, 6, '#e03040');
            self.sr(ctx, 5, 7, 2, 2, '#ff5060');
            // Base
            self.sr(ctx, 5, 14, 6, 1, '#808090');
        });

        // --- Projectile ennemi ---
        const projectile = [];
        for (let f = 0; f < 2; f++) {
            projectile.push(this.createFrame(8, 8, (ctx) => {
                const c1 = f === 0 ? '#ff6020' : '#ff9040';
                const c2 = f === 0 ? '#ff9040' : '#ffb060';
                self.sr(ctx, 2, 2, 4, 4, c1);
                self.sr(ctx, 3, 3, 2, 2, c2);
                self.sp(ctx, 3, 2, c2);
                self.sp(ctx, 2, 3, c2);
            }));
        }

        return { heartFull, heartEmpty, coin, potion, projectile };
    },

    // =====================================================================
    //  EFFETS VISUELS (particules)
    // =====================================================================

    generateEffects() {
        const self = this;

        // Particules d'impact
        const impactParticle = [];
        for (let f = 0; f < 4; f++) {
            impactParticle.push(this.createFrame(8, 8, (ctx) => {
                const size = 4 - f;
                const offset = f;
                ctx.fillStyle = '#f0f0ff';
                ctx.fillRect(4 - size / 2, 4 - size / 2, size, size);
                if (f < 3) {
                    self.sp(ctx, 1 - f, 4, '#f0c040');
                    self.sp(ctx, 7 + f, 4, '#f0c040');
                    self.sp(ctx, 4, 1 - f, '#f0c040');
                    self.sp(ctx, 4, 7 + f, '#f0c040');
                }
            }));
        }

        // Étoiles (collectible ramassé)
        const sparkle = [];
        for (let f = 0; f < 4; f++) {
            sparkle.push(this.createFrame(8, 8, (ctx) => {
                const alpha = 1 - f * 0.25;
                ctx.globalAlpha = alpha;
                self.sp(ctx, 4, 2, '#f0f080');
                self.sp(ctx, 4, 6, '#f0f080');
                self.sp(ctx, 2, 4, '#f0f080');
                self.sp(ctx, 6, 4, '#f0f080');
                if (f < 2) {
                    self.sp(ctx, 3, 3, '#f0c040');
                    self.sp(ctx, 5, 3, '#f0c040');
                    self.sp(ctx, 3, 5, '#f0c040');
                    self.sp(ctx, 5, 5, '#f0c040');
                }
                ctx.globalAlpha = 1;
            }));
        }

        // Fumée (mort ennemie)
        const smoke = [];
        for (let f = 0; f < 4; f++) {
            smoke.push(this.createFrame(16, 16, (ctx) => {
                ctx.globalAlpha = 0.8 - f * 0.2;
                const r = 3 + f * 2;
                const colors = ['#808080', '#a0a0a0', '#c0c0c0', '#e0e0e0'];
                self.sr(ctx, 8 - r, 8 - r + f, r * 2, r * 2 - f, colors[f]);
                if (f < 3) {
                    self.sr(ctx, 8 - r + 2, 8 - r + f + 2, r * 2 - 4, r * 2 - f - 4, colors[Math.min(f + 1, 3)]);
                }
                ctx.globalAlpha = 1;
            }));
        }

        return { impactParticle, sparkle, smoke };
    },

    // =====================================================================
    //  INITIALISATION GLOBALE
    // =====================================================================

    async init() {
        console.log('[SpriteManager] Génération des spritesheets...');

        // Héros
        this.sprites.hero = await this.loadHeroKnight();

        // Ennemis
        this.sprites.enemies = {
            slime: this.generateSlime(),
            skeleton: this.generateSkeleton(),
            bat: this.generateBat(),
            mage: this.generateMage(),
            golem: this.generateGolem(),
        };

        // Boss (10 boss uniques)
        this.sprites.bosses = {};
        for (let i = 1; i <= 10; i++) {
            this.sprites.bosses[i] = this.generateBoss(i);
        }

        // Tuiles par biome
        this.sprites.tiles = {};
        const biomes = ['forest', 'caves', 'swamp', 'volcano', 'citadel'];
        biomes.forEach(b => {
            this.sprites.tiles[b] = this.generateTiles(b);
        });

        // Interface utilisateur
        this.sprites.ui = this.generateUI();

        // Effets visuels
        this.sprites.effects = this.generateEffects();

        console.log('[SpriteManager] Spritesheets générées avec succès !');
    },

    /**
     * Obtenir le biome correspondant à un numéro de niveau
     */
    getBiome(level) {
        if (level <= 20) return 'forest';
        if (level <= 40) return 'caves';
        if (level <= 60) return 'swamp';
        if (level <= 80) return 'volcano';
        return 'citadel';
    },

    /**
     * Obtenir le type d'ennemi adapté au niveau
     * Retourne un tableau des types d'ennemis disponibles
     */
    getEnemyTypes(level) {
        const types = ['slime'];
        if (level >= 5) types.push('bat');
        if (level >= 15) types.push('skeleton');
        if (level >= 30) types.push('mage');
        if (level >= 50) types.push('golem');
        return types;
    },

    /**
     * Obtenir le numéro de boss pour un niveau donné (ou null si pas un niveau boss)
     */
    getBossId(level) {
        if (level % 10 === 0 && level >= 10 && level <= 100) {
            return level / 10;
        }
        return null;
    },
};
