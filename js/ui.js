/* ==========================================================================
   UIManager — Gestion des écrans (Accueil, Jeu, Pause, Game Over)
   Dessine l'interface par-dessus le canvas de jeu
   ========================================================================== */

const UIManager = {
    // États possibles du jeu
    STATE: {
        LOADING: 0,
        MENU: 1,
        NAME_INPUT: 2,
        PLAYING: 3,
        PAUSED: 4,
        GAME_OVER: 5,
        LEVEL_CLEAR: 6,
        GAME_CLEAR: 7,
        MODE_SELECT: 8,
        STORY: 9
    },

    // Variables UI
    playerNameInput: "",
    cursorVisible: true,
    cursorBlinkTimer: 0,
    menuSelection: 0,
    transitionAlpha: 0,
    transitionState: 0, // 0=none, 1=fade_out, 2=fade_in
    transitionCallback: null,

    /**
     * Initialisation
     */
    init() {
        this.playerNameInput = localStorage.getItem('mehdigames_last_name') || "";
    },

    /**
     * Dessiner le texte stylisé avec contour
     */
    drawText(ctx, text, x, y, size, color, align = 'center') {
        ctx.font = `${size}px "Press Start 2P"`;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';

        // Contour noir (épaisseur selon taille)
        const outline = Math.max(1, Math.floor(size / 8));
        ctx.fillStyle = '#0a0a12';
        ctx.fillText(text, x - outline, y);
        ctx.fillText(text, x + outline, y);
        ctx.fillText(text, x, y - outline);
        ctx.fillText(text, x, y + outline);
        ctx.fillText(text, x - outline, y - outline);
        ctx.fillText(text, x + outline, y + outline);

        // Texte principal
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    },

    /**
     * Démarrer une transition (fondu au noir)
     */
    startTransition(callback) {
        if (this.transitionState !== 0) return;
        this.transitionState = 1;
        this.transitionAlpha = 0;
        this.transitionCallback = callback;
    },

    /**
     * Mise à jour de la logique UI (clignotement, transitions)
     */
    update(dt) {
        // Clignotement du curseur (saisie nom)
        this.cursorBlinkTimer += dt;
        if (this.cursorBlinkTimer >= 0.5) {
            this.cursorBlinkTimer = 0;
            this.cursorVisible = !this.cursorVisible;
        }

        // Transitions
        if (this.transitionState === 1) { // Fade out
            this.transitionAlpha += dt * 2;
            if (this.transitionAlpha >= 1) {
                this.transitionAlpha = 1;
                this.transitionState = 2; // Fade in
                if (this.transitionCallback) {
                    this.transitionCallback();
                    this.transitionCallback = null;
                }
            }
        } else if (this.transitionState === 2) { // Fade in
            this.transitionAlpha -= dt * 2;
            if (this.transitionAlpha <= 0) {
                this.transitionAlpha = 0;
                this.transitionState = 0;
            }
        }
    },

    /**
     * Rendu de l'écran d'accueil
     */
    renderMenu(ctx, cw, ch) {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, cw, ch);

        // Dessiner quelques particules en fond
        const time = Date.now() / 1000;
        for (let i = 0; i < 20; i++) {
            const px = ((Math.sin(time * 0.5 + i) * 0.5 + 0.5) * cw * 1.5 - time * 20) % (cw + 50);
            const py = (Math.cos(time * 0.3 + i * 2) * 0.5 + 0.5) * ch;
            ctx.fillStyle = `rgba(150, 150, 255, ${0.1 + (i % 3) * 0.1})`;
            ctx.fillRect(px, py, 2, 2);
        }

        // Titre
        this.drawText(ctx, "MEHDIGAMES", cw / 2, ch / 2 - 40, 24, '#f0c040');

        // Sous-titre
        this.drawText(ctx, "Le Retour de Stalum", cw / 2, ch / 2 - 15, 10, '#a0a0c0');

        // Mention obligatoire
        this.drawText(ctx, "Créé par MehdiLabs", cw / 2, ch - 20, 8, '#606080');

        // Press Start (clignotant)
        if (this.cursorVisible) {
            const startText = InputManager.isMobile ? "APPUYEZ POUR JOUER" : "APPUYEZ SUR ENTRÉE";
            this.drawText(ctx, startText, cw / 2, ch / 2 + 30, 10, '#ffffff');
        }
    },

    /**
     * Rendu de l'écran de saisie du nom
     */
    renderNameInput(ctx, cw, ch) {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, cw, ch);

        this.drawText(ctx, "ENTREZ VOTRE NOM", cw / 2, ch / 2 - 40, 16, '#f0c040');

        // Champ de saisie
        const boxW = 160;
        const boxH = 30;
        const boxX = cw / 2 - boxW / 2;
        const boxY = ch / 2 - 10;

        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#f0c040';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        const displayText = this.playerNameInput + (this.cursorVisible ? '_' : ' ');
        this.drawText(ctx, displayText, cw / 2, boxY + boxH / 2, 12, '#ffffff');

        this.drawText(ctx, "(Max 10 lettres)", cw / 2, ch / 2 + 40, 8, '#8080a0');

        if (InputManager.isMobile) {
            this.drawText(ctx, "Tapez puis appuyez OK", cw / 2, ch / 2 + 60, 8, '#606080');
        } else {
            this.drawText(ctx, "Entrée pour valider", cw / 2, ch / 2 + 60, 8, '#606080');
        }
    },

    /**
     * Rendu de l'écran d'histoire
     */
    renderStory(ctx, cw, ch) {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, cw, ch);

        this.drawText(ctx, "HISTOIRE", cw / 2, ch / 2 - 60, 16, '#f0c040');

        const lines = [
            "Le Roi Démon a instauré le",
            "Communisme dans le royaume",
            "de Stalum.",
            "",
            "Le Dieu du Capitalisme nous",
            "demande de libérer le royaume!"
        ];

        for (let i = 0; i < lines.length; i++) {
            this.drawText(ctx, lines[i], cw / 2, ch / 2 - 20 + i * 15, 8, '#ffffff');
        }

        if (this.cursorVisible) {
            const btn = InputManager.isMobile ? "OK" : "ENTRÉE";
            this.drawText(ctx, "APPUYEZ SUR " + btn, cw / 2, ch / 2 + 70, 8, '#f0c040');
        }
    },

    /**
     * Rendu de l'écran de sélection de mode
     */
    renderModeSelect(ctx, cw, ch) {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, cw, ch);

        this.drawText(ctx, "CHOIX DU MODE", cw / 2, ch / 2 - 40, 16, '#f0c040');

        // Mode Survie
        const colorSurvie = (this.menuSelection === 0) ? '#ffffff' : '#606080';
        this.drawText(ctx, (this.menuSelection === 0 ? "> " : "") + "1. SURVIE (Normal)", cw / 2, ch / 2, 10, colorSurvie);

        // Mode Créatif
        const colorCreatif = (this.menuSelection === 1) ? '#ffffff' : '#606080';
        this.drawText(ctx, (this.menuSelection === 1 ? "> " : "") + "2. CREATIF (Invincible)", cw / 2, ch / 2 + 20, 10, colorCreatif);

        if (InputManager.isMobile) {
            this.drawText(ctx, "Touchez l'écran pour changer", cw / 2, ch / 2 + 50, 8, '#404060');
            this.drawText(ctx, "OK pour valider", cw / 2, ch / 2 + 65, 8, '#606080');
        } else {
            this.drawText(ctx, "Haut/Bas pour choisir", cw / 2, ch / 2 + 50, 8, '#404060');
            this.drawText(ctx, "Entrée pour valider", cw / 2, ch / 2 + 65, 8, '#606080');
        }
    },

    /**
     * Rendu du HUD (Heads-Up Display) en jeu
     */
    renderHUD(ctx, cw, ch, player, levelNum, isBossLevel) {
        const ui = SpriteManager.sprites.ui;
        if (!ui) return;

        // --- Coin supérieur gauche : PV ---
        for (let i = 0; i < player.maxHP; i++) {
            const hx = 10 + i * 18;
            const hy = 10;
            if (i < player.hp) {
                ctx.drawImage(ui.heartFull, hx, hy);
            } else {
                ctx.drawImage(ui.heartEmpty, hx, hy);
            }
        }

        // --- Coin inférieur gauche : Nom + Score ---
        this.drawText(ctx, player.name, 10, ch - 20, 8, '#a0a0c0', 'left');
        this.drawText(ctx, `Score: ${player.score}`, 10, ch - 10, 8, '#ffffff', 'left');

        // --- Coin supérieur droit : Pièces ---
        ctx.drawImage(ui.coin[0], cw - 50, 8);
        this.drawText(ctx, `x${player.coins}`, cw - 28, 16, 10, '#f0c040', 'left');

        // --- Milieu haut : Niveau actuel ---
        let levelText = `Niveau ${levelNum}`;
        let levelColor = '#ffffff';
        if (isBossLevel) {
            levelText = `BOSS ${levelNum}`;
            levelColor = '#ff4040';
        }
        this.drawText(ctx, levelText, cw / 2, 16, 10, levelColor);
    },

    /**
     * Rendu de l'écran de Pause
     */
    renderPause(ctx, cw, ch) {
        // Overlay semi-transparent
        ctx.fillStyle = 'rgba(10, 10, 18, 0.7)';
        ctx.fillRect(0, 0, cw, ch);

        this.drawText(ctx, "PAUSE", cw / 2, ch / 2 - 20, 20, '#ffffff');
        const resumeText = InputManager.isMobile ? "Appuyez sur ⏸ pour reprendre" : "Appuyez sur ÉCHAP pour reprendre";
        this.drawText(ctx, resumeText, cw / 2, ch / 2 + 20, 8, '#a0a0c0');
    },

    /**
     * Rendu du Game Over
     */
    renderGameOver(ctx, cw, ch, score, level) {
        ctx.fillStyle = 'rgba(10, 10, 18, 0.85)';
        ctx.fillRect(0, 0, cw, ch);

        this.drawText(ctx, "GAME OVER", cw / 2, ch / 2 - 30, 24, '#ff3030');
        this.drawText(ctx, `Niveau atteint : ${level}`, cw / 2, ch / 2 + 10, 10, '#ffffff');
        this.drawText(ctx, `Score final : ${score}`, cw / 2, ch / 2 + 25, 10, '#f0c040');

        if (this.cursorVisible) {
            const retryText = InputManager.isMobile ? "Appuyez sur OK pour réessayer" : "Appuyez sur ENTRÉE pour réessayer";
            this.drawText(ctx, retryText, cw / 2, ch / 2 + 60, 8, '#ffffff');
        }

        this.drawText(ctx, "Créé par MehdiLabs", cw / 2, ch - 20, 8, '#606080');
    },

    /**
     * Rendu de la victoire d'un niveau
     */
    renderLevelClear(ctx, cw, ch, level) {
        ctx.fillStyle = 'rgba(10, 10, 18, 0.5)';
        ctx.fillRect(0, 0, cw, ch);

        this.drawText(ctx, "NIVEAU TERMINÉ", cw / 2, ch / 2 - 20, 16, '#f0c040');
        this.drawText(ctx, `Prêt pour le niveau ${level + 1}`, cw / 2, ch / 2 + 10, 10, '#ffffff');
    },

    /**
     * Rendu de la victoire finale
     */
    renderGameClear(ctx, cw, ch, player) {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, cw, ch);

        this.drawText(ctx, "VICTOIRE", cw / 2, ch / 2 - 40, 24, '#f0c040');
        this.drawText(ctx, `${player.name} a sauvé Stalum !`, cw / 2, ch / 2 - 10, 10, '#ffffff');
        this.drawText(ctx, `Score final : ${player.score}`, cw / 2, ch / 2 + 10, 10, '#f0c040');

        this.drawText(ctx, "Merci d'avoir joué", cw / 2, ch / 2 + 40, 10, '#a0a0c0');
        this.drawText(ctx, "Créé par MehdiLabs", cw / 2, ch - 20, 8, '#606080');
    },

    /**
     * Rendu des transitions globales
     */
    renderTransitions(ctx, cw, ch) {
        if (this.transitionState > 0 && this.transitionAlpha > 0) {
            ctx.fillStyle = `rgba(10, 10, 18, ${this.transitionAlpha})`;
            ctx.fillRect(0, 0, cw, ch);
        }
    }
};
