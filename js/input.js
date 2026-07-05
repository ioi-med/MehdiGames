/* ==========================================================================
   InputManager — Gestion des entrées clavier
   Supporte les touches fléchées ET ZQSD/WASD
   ========================================================================== */

const InputManager = {
    // État actuel des touches (true = enfoncée)
    keys: {},
    // Touches pressées cette frame uniquement (détection de front montant)
    justPressed: {},
    // Touches relâchées cette frame
    justReleased: {},

    // Variables pour la manette (Gamepad API)
    gpKeys: {},
    gpJustPressed: {},
    gpAxesThreshold: 0.5,

    // Détection mobile
    isMobile: false,

    /**
     * Initialiser les écouteurs clavier
     */
    init() {
        // Détecter si on est sur mobile/tablette
        this.isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0)
            && (window.innerWidth < 900 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

        window.addEventListener('keydown', (e) => {
            // Marquer comme "just pressed" seulement au premier appui
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;

            // Empêcher le scroll et comportements par défaut
            const blocked = [
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                'Space', 'KeyX', 'KeyP', 'Escape'
            ];
            if (blocked.includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.justReleased[e.code] = true;
        });

        // Réinitialiser si la fenêtre perd le focus
        window.addEventListener('blur', () => {
            this.keys = {};
            this.justPressed = {};
            this.justReleased = {};
        });

        // ==========================================
        // Contrôles tactiles (Mobile)
        // ==========================================
        if (this.isMobile) {
            const touchControls = document.getElementById('touchControls');
            if (touchControls) {
                touchControls.style.display = 'flex';
                
                // Fonction pour lier un bouton HTML à un code clavier
                const bindTouch = (id, code) => {
                    const btn = document.getElementById(id);
                    if (!btn) return;
                    
                    const press = (e) => {
                        if (e.cancelable) e.preventDefault();
                        if (!this.keys[code]) this.justPressed[code] = true;
                        this.keys[code] = true;
                        btn.classList.add('active');
                        
                        // Hack menus : N'importe quel bouton simule aussi "Enter" pour passer les menus
                        if (!this.keys['Enter']) this.justPressed['Enter'] = true;
                        this.keys['Enter'] = true;
                    };
                    
                    const release = (e) => {
                        if (e.cancelable) e.preventDefault();
                        this.keys[code] = false;
                        this.justReleased[code] = true;
                        btn.classList.remove('active');
                        
                        this.keys['Enter'] = false;
                        this.justReleased['Enter'] = true;
                    };
                    
                    btn.addEventListener('touchstart', press, {passive: false});
                    btn.addEventListener('touchend', release, {passive: false});
                    btn.addEventListener('touchcancel', release, {passive: false});
                };

                bindTouch('btnLeft', 'ArrowLeft');
                bindTouch('btnRight', 'ArrowRight');
                bindTouch('btnAttack', 'Space');
                bindTouch('btnJump', 'ArrowUp');
            }

            // ==========================================
            // Boutons tactiles de menu (Confirmer / Pause)
            // ==========================================
            const bindMenuTouch = (id, codes) => {
                const btn = document.getElementById(id);
                if (!btn) return;

                btn.addEventListener('touchstart', (e) => {
                    if (e.cancelable) e.preventDefault();

                    if (id === 'btnConfirm' && typeof Game !== 'undefined' && typeof UIManager !== 'undefined' && Game.state === UIManager.STATE.MENU) {
                        if (UIManager.transitionState !== 0 || Game._prompting) return;
                        Game._prompting = true;
                        let name = window.prompt("Entrez votre nom (10 lettres max) :", UIManager.playerNameInput);
                        Game._prompting = false;
                        
                        if (name !== null && name.trim().length > 0) {
                            UIManager.playerNameInput = name.trim().toUpperCase().substring(0, 10).replace(/[^A-Z0-9 ]/g, '');
                            Game.mobileNameEntered = true;
                        } else {
                            return;
                        }
                    }

                    for (const code of codes) {
                        if (!this.keys[code]) this.justPressed[code] = true;
                        this.keys[code] = true;
                    }
                }, {passive: false});

                btn.addEventListener('touchend', (e) => {
                    if (e.cancelable) e.preventDefault();
                    for (const code of codes) {
                        this.keys[code] = false;
                        this.justReleased[code] = true;
                    }
                }, {passive: false});

                btn.addEventListener('touchcancel', (e) => {
                    if (e.cancelable) e.preventDefault();
                    for (const code of codes) {
                        this.keys[code] = false;
                        this.justReleased[code] = true;
                    }
                }, {passive: false});
            };

            bindMenuTouch('btnConfirm', ['Enter', 'Space']);
            bindMenuTouch('btnPause', ['Escape']);
        }

        // Empêcher les comportements par défaut du navigateur mobile (scroll, zoom, etc.)
        document.addEventListener('touchmove', (e) => {
            if (e.target.tagName !== 'INPUT') {
                e.preventDefault();
            }
        }, {passive: false});
    },


    /**
     * Vérifier si une touche est enfoncée
     */
    isDown(key) {
        return !!this.keys[key];
    },

    /**
     * Vérifier si une touche vient d'être pressée (1 frame)
     */
    isJustPressed(key) {
        return !!this.justPressed[key];
    },

    // === Raccourcis directionnels (fléchées + ZQSD + WASD + Manette) ===
    get left() {
        return this.isDown('ArrowLeft') || this.isDown('KeyQ') || this.isDown('KeyA') || this.gpKeys['Left'];
    },
    get right() {
        return this.isDown('ArrowRight') || this.isDown('KeyD') || this.gpKeys['Right'];
    },
    get up() {
        return this.isDown('ArrowUp') || this.isDown('KeyZ') || this.isDown('KeyW') || this.gpKeys['Up'];
    },
    get down() {
        return this.isDown('ArrowDown') || this.isDown('KeyS') || this.gpKeys['Down'];
    },

    // === Raccourcis d'action ===
    get attack() {
        return this.isJustPressed('Space') || this.isJustPressed('KeyX') || this.gpJustPressed['Attack'];
    },
    get jump() {
        return this.isJustPressed('ArrowUp') || this.isJustPressed('KeyZ') || this.isJustPressed('KeyW') || this.gpJustPressed['Jump'];
    },
    get pause() {
        return this.isJustPressed('Escape') || this.isJustPressed('KeyP') || this.gpJustPressed['Pause'];
    },
    get confirm() {
        return this.isJustPressed('Enter') || this.isJustPressed('Space') || this.gpJustPressed['Jump'];
    },

    /**
     * Scanner l'état de la manette (à appeler à chaque frame)
     */
    update() {
        if (!navigator.getGamepads) return;
        const gamepads = navigator.getGamepads();
        const pad = gamepads[0];
        if (!pad) return;

        const updateBtn = (id, pressed) => {
            if (pressed) {
                if (!this.gpKeys[id]) this.gpJustPressed[id] = true;
                this.gpKeys[id] = true;
            } else {
                this.gpKeys[id] = false;
            }
        };

        // mapping buttons
        updateBtn('Jump', pad.buttons[0] && pad.buttons[0].pressed); // Bouton A / Croix
        updateBtn('Attack', (pad.buttons[2] && pad.buttons[2].pressed) || (pad.buttons[1] && pad.buttons[1].pressed)); // Bouton X / Carré ou B / Cercle
        updateBtn('Pause', pad.buttons[9] && pad.buttons[9].pressed); // Start / Options

        // mapping D-pad ou Joystick Gauche
        const left = (pad.axes[0] < -this.gpAxesThreshold) || (pad.buttons[14] && pad.buttons[14].pressed);
        const right = (pad.axes[0] > this.gpAxesThreshold) || (pad.buttons[15] && pad.buttons[15].pressed);
        const up = (pad.axes[1] < -this.gpAxesThreshold) || (pad.buttons[12] && pad.buttons[12].pressed);
        const down = (pad.axes[1] > this.gpAxesThreshold) || (pad.buttons[13] && pad.buttons[13].pressed);

        updateBtn('Left', left);
        updateBtn('Right', right);
        updateBtn('Up', up);
        updateBtn('Down', down);
    },

    /**
     * Réinitialiser les états "just pressed" — appeler EN FIN de chaque frame
     */
    resetFrame() {
        this.justPressed = {};
        this.justReleased = {};
        this.gpJustPressed = {};
    }
};
