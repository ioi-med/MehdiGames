/* ==========================================================================
   AudioManager — Synthèse sonore 8-bit via Web Audio API
   Tous les effets sonores sont générés mathématiquement (pas de fichiers)
   ========================================================================== */

const AudioManager = {
    ctx: null,
    enabled: true,
    masterVolume: 0.25,

    /**
     * Initialisation paresseuse du contexte audio
     * Doit être appelé après une interaction utilisateur (politique navigateur)
     */
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    /**
     * Créer un nœud de gain connecté à la sortie
     */
    createGain(volume) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
        gain.connect(this.ctx.destination);
        return gain;
    },

    /**
     * Jouer une note simple avec un oscillateur
     * @param {number} freq - Fréquence en Hz
     * @param {number} duration - Durée en secondes
     * @param {string} type - Type d'onde (square, sawtooth, triangle, sine)
     * @param {number} volume - Volume (0-1)
     */
    playTone(freq, duration, type = 'square', volume = 0.3) {
        if (!this.ctx || !this.enabled) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(volume * this.masterVolume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + duration + 0.01);
        } catch (e) { /* silencieux si erreur audio */ }
    },

    /**
     * Sweep de fréquence (glissando)
     */
    playSweep(startFreq, endFreq, duration, type = 'square', volume = 0.3) {
        if (!this.ctx || !this.enabled) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(startFreq, t);
            osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t + duration);
            gain.gain.setValueAtTime(volume * this.masterVolume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + duration + 0.01);
        } catch (e) { /* silencieux */ }
    },

    /**
     * Générer du bruit blanc (pour bruits d'impact/explosion)
     */
    playNoise(duration, volume = 0.2) {
        if (!this.ctx || !this.enabled) return;
        try {
            const t = this.ctx.currentTime;
            const sampleRate = this.ctx.sampleRate;
            const bufferSize = Math.floor(sampleRate * duration);
            const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(volume * this.masterVolume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            // Filtre passe-bas pour adoucir le bruit
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(3000, t);
            filter.frequency.exponentialRampToValueAtTime(500, t + duration);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            source.start(t);
        } catch (e) { /* silencieux */ }
    },

    // =====================================================================
    //  EFFETS SONORES DU JEU
    // =====================================================================

    /** Saut du joueur — sweep montant rapide */
    sfxJump() {
        this.playSweep(180, 550, 0.15, 'square', 0.25);
    },

    /** Attaque épée — bruit blanc court + sweep descendant */
    sfxAttack() {
        this.playNoise(0.06, 0.2);
        this.playSweep(700, 150, 0.12, 'sawtooth', 0.15);
    },

    /** Ennemi touché — blip descendant */
    sfxEnemyHit() {
        this.playSweep(500, 80, 0.1, 'square', 0.2);
    },

    /** Joueur touché — buzz basse + blip d'alerte */
    sfxPlayerHit() {
        this.playTone(70, 0.2, 'sawtooth', 0.2);
        this.playSweep(300, 60, 0.25, 'square', 0.15);
    },

    /** Objet collecté — double bip aigu ascendant */
    sfxCollect() {
        this.playTone(880, 0.06, 'square', 0.15);
        setTimeout(() => this.playTone(1320, 0.1, 'square', 0.15), 60);
    },

    /** Victoire de niveau — arpège Do-Mi-Sol-Do (majeur ascendant) */
    sfxLevelComplete() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.25, 'square', 0.2), i * 150);
        });
    },

    /** Game Over — arpège descendant mineur */
    sfxGameOver() {
        const notes = [392, 311, 262, 196];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.35, 'sawtooth', 0.18), i * 220);
        });
    },

    /** Apparition d'un boss — grondement + montée dramatique */
    sfxBossAppear() {
        this.playTone(50, 0.6, 'sawtooth', 0.2);
        this.playNoise(0.3, 0.08);
        setTimeout(() => this.playSweep(60, 400, 0.5, 'square', 0.15), 350);
    },

    /** Mort d'un boss — série d'explosions */
    sfxBossDeath() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.playSweep(300 + Math.random() * 500, 40, 0.15, 'square', 0.15);
                this.playNoise(0.1, 0.1);
            }, i * 120);
        }
        setTimeout(() => {
            this.playTone(1047, 0.5, 'square', 0.2);
        }, 1000);
    },

    /** Sélection dans le menu */
    sfxMenuSelect() {
        this.playTone(660, 0.07, 'square', 0.15);
    },

    /** Navigation dans le menu */
    sfxMenuNav() {
        this.playTone(440, 0.04, 'square', 0.1);
    },

    /** Mort du joueur — chute dramatique */
    sfxDeath() {
        this.playSweep(400, 60, 0.6, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(50, 0.5, 'square', 0.15), 400);
    },

    /** Porte/sortie de niveau — son magique */
    sfxDoor() {
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'triangle', 0.12), i * 80);
        });
    },

    /** Pas du joueur — petit tick */
    sfxStep() {
        this.playTone(100 + Math.random() * 50, 0.03, 'triangle', 0.05);
    }
};
