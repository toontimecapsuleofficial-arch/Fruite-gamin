/**
 * Fruit Cut Master - Complete Production Ready Core Game Script
 * Fully Vanilla JavaScript, object-oriented, feature-dense, scalable architecture.
 */

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================
const CONFIG = {
    GRAVITY: 0.28,
    BASE_SPAWN_INTERVAL: 2500, // ms
    MIN_SPAWN_INTERVAL: 800,
    DIFFICULTY_RAMP_TIME: 60000, // Max difficulty reached at 60s
    TARGET_FPS: 60,
    PARTICLE_POOL_SIZE: 300,
    FRUIT_POOL_SIZE: 30,
    SLASH_MAX_POINTS: 12,
    SAVE_KEY: 'FruitCutMaster_SaveData'
};

const GAME_STATES = {
    LOADING: 'LOADING',
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    SHOP: 'SHOP',
    ACHIEVEMENTS: 'ACHIEVEMENTS',
    SETTINGS: 'SETTINGS'
};

const FRUIT_DEFS = {
    apple:      { label: 'Apple',      radius: 35, score: 10,  chance: 0.22, color: '#ff2a2a', juice: '#ff7373' },
    banana:     { label: 'Banana',     radius: 30, score: 15,  chance: 0.20, color: '#ffe135', juice: '#fff3a8' },
    orange:     { label: 'Orange',     radius: 36, score: 12,  chance: 0.18, color: '#ffa500', juice: '#ffcc66' },
    watermelon: { label: 'Watermelon', radius: 55, score: 25,  chance: 0.12, color: '#fc3d3d', juice: '#00cc44' },
    pineapple:  { label: 'Pineapple',  radius: 45, score: 20,  chance: 0.15, color: '#e4cd05', juice: '#fff799' },
    strawberry: { label: 'Strawberry', radius: 25, score: 30,  chance: 0.13, color: '#ff3b59', juice: '#ff94a4' }
};

// ============================================================================
// 2. SAVE & STATE SYSTEM
// ============================================================================
class SaveSystem {
    constructor() {
        this.data = {
            highScore: 0,
            coins: 0,
            purchasedBlades: ['default'],
            purchasedBackgrounds: ['default'],
            purchasedEffects: ['default'],
            equippedBlade: 'default',
            equippedBackground: 'default',
            equippedEffect: 'default',
            unlockedAchievements: [],
            stats: { totalSlices: 0, totalBombsAvoided: 0, maxCombo: 0, gamesPlayed: 0 },
            settings: { music: true, sfx: true, quality: 'high', fullscreen: false }
        };
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(CONFIG.SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.data = { ...this.data, ...parsed };
            }
        } catch (e) {
            console.error("Save system corrupted or disabled, using memory state.", e);
        }
    }

    save() {
        try {
            localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error("Failed saving to localStorage", e);
        }
    }
}

// ============================================================================
// 3. ASSET LOADER (WITH PROCEDURAL FALLBACKS)
// ============================================================================
class AssetLoader {
    constructor() {
        this.assets = {};
        this.total = 0;
        this.loaded = 0;
    }

    loadImg(key, src) {
        this.total++;
        const img = new Image();
        img.src = src;
        img.onload = () => { this.loaded++; };
        img.onerror = () => {
            console.warn(`Asset failed to load: ${src}. Creating real-time canvas proxy.`);
            this.assets[key] = this.createFallbackTexture(key);
            this.loaded++;
        };
        this.assets[key] = img;
    }

    createFallbackTexture(key) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        if (key.includes('bomb')) {
            ctx.arc(64, 64, 40, 0, Math.PI * 2);
            ctx.fillStyle = '#111'; ctx.fill();
            ctx.fillStyle = '#ff0000'; ctx.fillRect(60, 10, 8, 20);
        } else if (key.includes('watermelon')) {
            ctx.arc(64, 64, 55, 0, Math.PI * 2); ctx.fillStyle = '#228B22'; ctx.fill();
        } else {
            ctx.arc(64, 64, 35, 0, Math.PI * 2); ctx.fillStyle = '#ff5555'; ctx.fill();
        }
        return canvas;
    }

    isReady() { return this.total === 0 ? true : (this.loaded >= this.total); }
    get progress() { return this.total === 0 ? 1 : this.loaded / this.total; }
}

// ============================================================================
// 4. AUDIO SYSTEM (FAILSAFE HOOKS)
// ============================================================================
class AudioSystem {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.sounds = {};
    }
    play(name) {
        if (!this.stateManager.saveSystem.data.settings.sfx) return;
        // Native Synthesis fallback to ensure clean gameplay auditory responses without assets
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            
            if (name === 'slice') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                osc.start(); osc.stop(ctx.currentTime + 0.12);
            } else if (name === 'explosion') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.4);
                gain.gain.setValueAtTime(0.6, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.start(); osc.stop(ctx.currentTime + 0.4);
            } else if (name === 'coin' || name === 'combo') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
                gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start(); osc.stop(ctx.currentTime + 0.25);
            }
        } catch (e) { /* Audio context blocks or fails silently */ }
    }
}

// ============================================================================
// 5. MATH & COLLISION DETECTORS
// ============================================================================
class Geometry {
    static lineCircleIntersect(p1, p2, circle, radius) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (dx === 0 && dy === 0) return false;
        
        const t = ((circle.x - p1.x) * dx + (circle.y - p1.y) * dy) / (dx * dx + dy * dy);
        const clampedT = Math.max(0, Math.min(1, t));
        
        const closestX = p1.x + clampedT * dx;
        const closestY = p1.y + clampedT * dy;
        
        const distSq = (circle.x - closestX) ** 2 + (circle.y - closestY) ** 2;
        return distSq <= radius * radius;
    }
}

// ============================================================================
// 6. OBJECT POOLABLE GAME OBJECTS
// ============================================================================
class Particle {
    constructor() { this.active = false; }
    init(x, y, vx, vy, color, size, maxLife, type = 'juice') {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.color = color; this.size = size; this.life = maxLife;
        this.maxLife = maxLife; this.type = type; this.active = true;
    }
    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.type === 'fragment') { this.vy += CONFIG.GRAVITY * dt * 0.7; }
        this.life -= dt;
        if (this.life <= 0) this.active = false;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.type === 'spark') {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'fragment') {
            ctx.rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2); ctx.fill();
        } else { // Juice Splatter
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

class Entity {
    constructor() { this.active = false; }
    init(x, y, vx, vy, type, isBomb = false) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.type = type; this.isBomb = isBomb;
        this.sliced = false; this.active = true;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.08;
        
        if (!isBomb) {
            const def = FRUIT_DEFS[type];
            this.radius = def.radius;
            this.scoreValue = def.score;
            this.color = def.color;
            this.juiceColor = def.juice;
        } else {
            this.radius = 38;
            this.scoreValue = 0;
            this.color = '#111';
            this.juiceColor = '#ff3300';
        }
        // Slice parameters for split animations
        this.sliceAngle = 0;
        this.splitProgress = 0;
    }
    update(dt, canvasHeight) {
        if (!this.active) return;
        
        if (!this.sliced) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += CONFIG.GRAVITY * dt;
            this.rotation += this.rotationSpeed * dt;
            
            // Check out of bounds bounds
            if (this.vy > 0 && this.y - this.radius > canvasHeight) {
                this.active = false;
                return 'miss';
            }
        } else {
            // Animating physics for split parts
            this.splitProgress += dt * 0.05;
            this.y += this.vy * dt;
            this.vy += CONFIG.GRAVITY * dt;
            if (this.y - this.radius > canvasHeight) {
                this.active = false;
            }
        }
        return null;
    }
    draw(ctx, assets) {
        ctx.save();
        if (!this.sliced) {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            const assetKey = this.isBomb ? 'bomb' : this.type;
            const img = assets[assetKey];
            if (img && img.complete && img.width > 0) {
                ctx.drawImage(img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            } else {
                ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color; ctx.fill();
            }
        } else {
            // Render Split Entity halves
            ctx.translate(this.x, this.y);
            ctx.rotate(this.sliceAngle);
            const offset = this.splitProgress * 45;
            const assetKey = this.type;
            const img = assets[assetKey];
            
            for (let half = 0; half < 2; half++) {
                ctx.save();
                const sign = half === 0 ? -1 : 1;
                ctx.translate(sign * offset, 0);
                ctx.beginPath();
                // Clip canvas to draw exact halves cleanly
                if (half === 0) ctx.rect(-this.radius * 2, -this.radius * 2, this.radius * 2, this.radius * 4);
                else ctx.rect(0, -this.radius * 2, this.radius * 2, this.radius * 4);
                ctx.clip();
                
                if (img && img.complete && img.width > 0) {
                    ctx.drawImage(img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
                } else {
                    ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = this.color; ctx.fill();
                }
                ctx.restore();
            }
        }
        ctx.restore();
    }
}

// ============================================================================
// 7. CORE CORE ENGINE & STATE MANAGEMENT
// ============================================================================
class GameEngine {
    constructor() {
        this.state = GAME_STATES.LOADING;
        this.saveSystem = new SaveSystem();
        this.loader = new AssetLoader();
        this.audio = new AudioSystem(this);
        
        // Setup Systems
        this.setupCanvas();
        this.initPools();
        this.bindInputEvents();
        this.initAchievements();
        
        // Start Asset Pipe
        this.queueAssets();
        
        // Simulation Core Counters
        this.score = 0;
        this.coinsEarnedSession = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.spawnTimer = 0;
        this.lastTime = performance.now();
        
        // Interactive Elements
        this.slashPoints = [];
        this.floatingTexts = [];
        
        // UI Mount points
        this.cacheDOM();
        this.setupUIRelays();
        
        // Auto-save Interval (10s)
        setInterval(() => this.saveSystem.save(), 10000);
        
        // Boot Tick
        requestAnimationFrame((t) => this.loop(t));
    }

    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'gameCanvas';
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(dpr, dpr);
    }

    queueAssets() {
        const fruits = ['apple', 'banana', 'orange', 'watermelon', 'pineapple', 'strawberry'];
        fruits.forEach(f => this.loader.loadImg(f, `assets/fruits/${f}.png`));
        this.loader.loadImg('bomb', 'assets/fruits/bomb.png');
        this.loader.loadImg('slash', 'assets/effects/slash.png');
        this.loader.loadImg('explosion', 'assets/effects/explosion.png');
        this.loader.loadImg('logo', 'assets/ui/logo.png');
    }

    initPools() {
        this.particlePool = Array.from({ length: CONFIG.PARTICLE_POOL_SIZE }, () => new Particle());
        this.entityPool = Array.from({ length: CONFIG.FRUIT_POOL_SIZE }, () => new Entity());
    }

    spawnParticle(x, y, vx, vy, color, size, maxLife, type) {
        const p = this.particlePool.find(item => !item.active);
        if (p) p.init(x, y, vx, vy, color, size, maxLife, type);
    }

    spawnEntity(x, y, vx, vy, type, isBomb) {
        const e = this.entityPool.find(item => !item.active);
        if (e) e.init(x, y, vx, vy, type, isBomb);
    }

    cacheDOM() {
        const select = (id) => document.getElementById(id) || document.createElement('div');
        this.dom = {
            score: select('scoreDisplay'),
            combo: select('comboDisplay'),
            best: select('bestScoreDisplay'),
            coins: select('coinsDisplay'),
            multiplier: select('multiplierDisplay'),
            lives: select('livesContainer'),
            pauseMenu: select('pauseMenu'),
            gameOver: select('gameOverScreen'),
            finalScore: select('finalScore'),
            highScore: select('highScore'),
            coinsEarned: select('coinsEarned'),
            shop: select('shopScreen'),
            achievements: select('achievementScreen'),
            settings: select('settingsScreen'),
            notifications: select('notificationContainer'),
            floatingTexts: select('floatingTextContainer')
        };
    }

    // ============================================================================
    // INPUT AND TRACKING INTERFACES
    // ============================================================================
    bindInputEvents() {
        const getPos = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX, y: clientY };
        };

        const onStart = (e) => {
            if (this.state !== GAME_STATES.PLAYING) return;
            const pos = getPos(e);
            this.slashPoints = [{ x: pos.x, y: pos.y, t: performance.now() }];
            this.isDrawing = true;
        };

        const onMove = (e) => {
            if (!this.isDrawing || this.state !== GAME_STATES.PLAYING) return;
            const pos = getPos(e);
            const now = performance.now();
            const lastPt = this.slashPoints[this.slashPoints.length - 1];
            
            if (lastPt) {
                this.checkIntersections(lastPt, pos);
            }
            
            this.slashPoints.push({ x: pos.x, y: pos.y, t: now });
            if (this.slashPoints.length > CONFIG.SLASH_MAX_POINTS) this.slashPoints.shift();
        };

        const onEnd = () => { this.isDrawing = false; };

        window.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
        
        // Keyboard Esc mapping for clean user fallback control loops
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'p') this.togglePause();
        });
    }

    checkIntersections(p1, p2) {
        let cycleSlices = 0;
        this.entityPool.forEach(entity => {
            if (!entity.active || entity.sliced) return;
            if (Geometry.lineCircleIntersect(p1, p2, entity, entity.radius)) {
                this.sliceEntity(entity, p1, p2);
                if (!entity.isBomb) cycleSlices++;
            }
        });

        if (cycleSlices > 0) {
            this.comboCount += cycleSlices;
            this.comboTimer = 0.35; // 350ms multi-frame window to count sequential continuous cuts
            this.saveSystem.data.stats.totalSlices += cycleSlices;
            this.checkAchievementProgress();
        }
    }

    sliceEntity(entity, p1, p2) {
        entity.sliced = true;
        this.audio.play(entity.isBomb ? 'explosion' : 'slice');
        
        // Align separation angle of halves to match physical slash line vectors
        entity.sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        
        if (entity.isBomb) {
            this.triggerExplosionEffect(entity.x, entity.y);
            this.lives = 0;
            this.updateHUD();
            this.changeState(GAME_STATES.GAME_OVER);
        } else {
            // Generate visual dynamic feedbacks
            this.score += entity.scoreValue;
            this.triggerJuiceSplatter(entity.x, entity.y, entity.juiceColor);
            this.createFloatingText(`+${entity.scoreValue}`, entity.x, entity.y);
            
            // Random chance for direct coin discovery per single clean cut
            if (Math.random() < 0.25) {
                this.saveSystem.data.coins += 1;
                this.coinsEarnedSession += 1;
                this.createFloatingText('+1 Coin', entity.x, entity.y - 20, '#ffd700');
                this.audio.play('coin');
            }
            this.updateHUD();
        }
    }

    // ============================================================================
    // EFFECTS GENERATION PIPES
    // ============================================================================
    triggerJuiceSplatter(x, y, color) {
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            this.spawnParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 3 + Math.random() * 4, 0.4 + Math.random() * 0.4, 'juice');
        }
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.spawnParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 6 + Math.random() * 6, 0.8 + Math.random() * 0.4, 'fragment');
        }
    }

    triggerExplosionEffect(x, y) {
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 12;
            const colors = ['#ff3300', '#ff9900', '#ffff00', '#ffffff'];
            const randColor = colors[Math.floor(Math.random() * colors.length)];
            this.spawnParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, randColor, 4 + Math.random() * 6, 0.6 + Math.random() * 0.6, 'spark');
        }
    }

    createFloatingText(text, x, y, color = '#ffffff') {
        this.floatingTexts.push({ text, x, y, life: 1.0, color });
    }

    showNotification(msg) {
        const el = document.createElement('div');
        el.className = 'notification-item';
        el.innerText = msg;
        this.dom.notifications.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }

    // ============================================================================
    // WAVE DISPATCHER & LOGIC ENGINE
    // ============================================================================
    updateSpawning(dt) {
        this.gameTime += dt * 16.666; // Normalize to relative ms increments approx
        this.spawnTimer -= dt * 16.666;
        
        if (this.spawnTimer <= 0) {
            // Scale velocity and frequencies linearly against delta time progression
            const factor = Math.min(1, this.gameTime / CONFIG.DIFFICULTY_RAMP_TIME);
            const currentInterval = CONFIG.BASE_SPAWN_INTERVAL - (CONFIG.BASE_SPAWN_INTERVAL - CONFIG.MIN_SPAWN_INTERVAL) * factor;
            
            this.spawnWave(factor);
            this.spawnTimer = currentInterval;
        }
    }

    spawnWave(factor) {
        const count = 1 + Math.floor(Math.random() * 3) + Math.floor(factor * 2);
        const keys = Object.keys(FRUIT_DEFS);
        
        for (let i = 0; i < count; i++) {
            // Select based on configured procedural weights
            let rand = Math.random();
            let chosenType = keys[0];
            let sum = 0;
            for (let k of keys) {
                sum += FRUIT_DEFS[k].chance;
                if (rand <= sum) { chosenType = k; break; }
            }
            
            // Coordinates configuration (bottom projection upwards)
            const x = this.width * 0.15 + Math.random() * (this.width * 0.7);
            const y = this.height + 50;
            
            // Aim launch target trajectories vectors organically toward screens upper center ranges
            const targetX = this.width * 0.3 + Math.random() * (this.width * 0.4);
            const targetY = this.height * 0.15 + Math.random() * (this.height * 0.25);
            
            // Simple ballistic calculation estimation parameters
            const distanceY = y - targetY;
            const vy = -Math.sqrt(2 * CONFIG.GRAVITY * distanceY) * (0.9 + Math.random() * 0.2);
            const ticksToTop = Math.abs(vy / CONFIG.GRAVITY);
            const vx = (targetX - x) / ticksToTop;
            
            // Determine random inline bomb placements injections against factor difficulty curves
            const spawnBomb = Math.random() < (0.12 + factor * 0.18);
            
            this.spawnEntity(x, y, vx, vy, chosenType, spawnBomb);
        }
    }

    // ============================================================================
    // STATE MODULATION PIPES
    // ============================================================================
    changeState(newState) {
        this.state = newState;
        
        // Clear all active DOM overlays visibly matching UI patterns
        [this.dom.pauseMenu, this.dom.gameOver, this.dom.shop, this.dom.achievements, this.dom.settings]
            .forEach(el => { if(el) el.style.display = 'none'; });
            
        if (newState === GAME_STATES.PLAYING) {
            this.dom.pauseMenu.style.display = 'none';
        } else if (newState === GAME_STATES.PAUSED) {
            if (this.dom.pauseMenu) this.dom.pauseMenu.style.display = 'flex';
        } else if (newState === GAME_STATES.GAME_OVER) {
            if (this.score > this.saveSystem.data.highScore) {
                this.saveSystem.data.highScore = this.score;
                this.showNotification("🎉 New Personal High Score!");
            }
            this.saveSystem.data.stats.gamesPlayed++;
            this.saveSystem.save();
            
            if (this.dom.gameOver) {
                this.dom.gameOver.style.display = 'flex';
                if (this.dom.finalScore) this.dom.finalScore.innerText = this.score;
                if (this.dom.highScore) this.dom.highScore.innerText = this.saveSystem.data.highScore;
                if (this.dom.coinsEarned) this.dom.coinsEarned.innerText = this.coinsEarnedSession;
            }
        } else if (newState === GAME_STATES.SHOP) {
            if (this.dom.shop) this.dom.shop.style.display = 'block';
            this.renderShop();
        } else if (newState === GAME_STATES.ACHIEVEMENTS) {
            if (this.dom.achievements) this.dom.achievements.style.display = 'block';
            this.renderAchievements();
        } else if (newState === GAME_STATES.SETTINGS) {
            if (this.dom.settings) this.dom.settings.style.display = 'block';
        }
    }

    resetGame() {
        this.score = 0;
        this.coinsEarnedSession = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.spawnTimer = 1000;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.entityPool.forEach(e => e.active = false);
        this.particlePool.forEach(p => p.active = false);
        this.slashPoints = [];
        this.floatingTexts = [];
        this.updateHUD();
        this.changeState(GAME_STATES.PLAYING);
    }

    togglePause() {
        if (this.state === GAME_STATES.PLAYING) this.changeState(GAME_STATES.PAUSED);
        else if (this.state === GAME_STATES.PAUSED) this.changeState(GAME_STATES.PLAYING);
    }

    updateHUD() {
        if (this.dom.score) this.dom.score.innerText = this.score;
        if (this.dom.coins) this.dom.coins.innerText = this.saveSystem.data.coins;
        if (this.dom.best) this.dom.best.innerText = this.saveSystem.data.highScore;
        
        // Render simple graphical heart strings within target absolute DOM layouts
        if (this.dom.lives) {
            this.dom.lives.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const heart = document.createElement('span');
                heart.className = i < this.lives ? 'heart active' : 'heart empty';
                heart.innerText = i < this.lives ? '❤️' : '🖤';
                this.dom.lives.appendChild(heart);
            }
        }
    }

    // ============================================================================
    // MAIN REQUEST ANIMATION FRAME LOOP ENGINE
    // ============================================================================
    loop(timestamp) {
        let dt = (timestamp - this.lastTime) / 16.666;
        if (dt > 3) dt = 3; // Hard clamp limits to mitigate frame rate skipping or background execution freezes
        this.lastTime = timestamp;

        if (this.state === GAME_STATES.LOADING) {
            this.renderLoadingScreen();
            if (this.loader.isReady()) {
                this.updateHUD();
                this.changeState(GAME_STATES.MENU);
            }
        } else {
            this.updateSimulation(dt);
            this.renderSimulation();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    updateSimulation(dt) {
        // Decay active trails independent of paused mechanics
        if (this.slashPoints.length > 0) {
            const now = performance.now();
            this.slashPoints = this.slashPoints.filter(pt => now - pt.t < 220);
        }

        if (this.state !== GAME_STATES.PLAYING) return;

        // Process Combo system processing frames logic matrixes
        if (this.comboTimer > 0) {
            this.comboTimer -= dt * 0.01666;
            if (this.comboTimer <= 0) {
                if (this.comboCount >= 2) {
                    this.executeComboBonus(this.comboCount);
                }
                this.comboCount = 0;
            }
        }

        // Process Spawning Pipelines
        this.updateSpawning(dt);

        // Track and process floating typography engines
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= dt * 1.2;
            ft.life -= dt * 0.025;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }

        // Process entities pooling allocations updates loop
        this.entityPool.forEach(entity => {
            if (!entity.active) return;
            const res = entity.update(dt, this.height);
            if (res === 'miss') {
                if (!entity.isBomb && !entity.sliced) {
                    this.lives--;
                    this.updateHUD();
                    if (this.lives <= 0) {
                        this.changeState(GAME_STATES.GAME_OVER);
                    }
                } else if (entity.isBomb) {
                    this.saveSystem.data.stats.totalBombsAvoided++;
                    this.checkAchievementProgress();
                }
            }
        });

        // Process runtime particle animations
        this.particlePool.forEach(p => { if (p.active) p.update(dt); });
    }

    executeComboBonus(count) {
        const bonus = count * 5;
        this.score += bonus;
        this.audio.play('combo');
        
        if (count > this.saveSystem.data.stats.maxCombo) {
            this.saveSystem.data.stats.maxCombo = count;
        }

        // Project centered combo notifications visually across fields
        this.createFloatingText(`COMBO x${count} (+${bonus})`, this.width / 2, this.height * 0.4, '#ffcc00');
        if (this.dom.combo) {
            this.dom.combo.innerText = `COMBO x${count}!`;
            this.dom.combo.classList.add('pop-animation');
            setTimeout(() => this.dom.combo.classList.remove('pop-animation'), 600);
        }
        this.updateHUD();
        this.checkAchievementProgress();
    }

    // ============================================================================
    // CANVAS RENDERING GRAPHICS CONTEXT MANAGEMENT
    // ============================================================================
    renderLoadingScreen() {
        this.ctx.fillStyle = '#1e1105';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`LOADING MASTER ASSETS: ${Math.floor(this.loader.progress * 100)}%`, this.width / 2, this.height / 2);
    }

    renderSimulation() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Procedural Grid background layer logic pattern for high fidelity presentation
        this.drawProceduralBackground();

        // Render entities halves and whole configurations
        this.entityPool.forEach(entity => { if (entity.active) entity.draw(this.ctx, this.loader.assets); });

        // Render particles
        this.particlePool.forEach(p => { if (p.active) p.draw(this.ctx); });

        // Render standard floating interface scripts inline inside canvas space context
        this.ctx.save();
        this.floatingTexts.forEach(ft => {
            this.ctx.globalAlpha = Math.max(0, ft.life);
            this.ctx.fillStyle = ft.color;
            this.ctx.font = 'bold 26px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, ft.x, ft.y);
        });
        this.ctx.restore();

        // Render input vector paths (Slashes trails vectors configurations)
        this.drawSlashTrail();
    }

    drawProceduralBackground() {
        // Draw wood-style tone variants dynamically without heavy external dependencies asset overheads
        this.ctx.fillStyle = '#301b04';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Simple ambient linear aesthetic lines mapping
        this.ctx.strokeStyle = '#261503';
        this.ctx.lineWidth = 4;
        for (let i = 0; i < this.width; i += 120) {
            this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.height); this.ctx.stroke();
        }
    }

    drawSlashTrail() {
        if (this.slashPoints.length < 2) return;
        
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Read configuration profiles for custom customized blades properties
        const bladeColor = this.getEquippedBladeColor();

        for (let i = 1; i < this.slashPoints.length; i++) {
            const p1 = this.slashPoints[i - 1];
            const p2 = this.slashPoints[i];
            const pct = i / this.slashPoints.length;
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            
            this.ctx.strokeStyle = bladeColor;
            this.ctx.lineWidth = 2 + pct * 7;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = bladeColor;
            
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    getEquippedBladeColor() {
        const blade = this.saveSystem.data.equippedBlade;
        if (blade === 'flame') return '#ff3300';
        if (blade === 'ice') return '#00ffff';
        if (blade === 'cyber') return '#00ff33';
        return '#ffffff'; // Default standard model trace profile
    }

    // ============================================================================
    // EXTRA INTERFACES MOUNT SUBSYSTEMS (SHOP / SETTINGS / ACHIEVEMENTS LIST)
    // ============================================================================
    setupUIRelays() {
        const bindClick = (id, callback) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', callback);
        };

        // Wire structural execution routes
        bindClick('pauseButton', () => this.togglePause());
        bindClick('resumeButton', () => this.changeState(GAME_STATES.PLAYING));
        bindClick('restartButton', () => this.resetGame());
        bindClick('homeButton', () => this.changeState(GAME_STATES.MENU));
        bindClick('playAgainButton', () => this.resetGame());
        bindClick('returnMenuButton', () => this.changeState(GAME_STATES.MENU));
        
        // Main Navigation configurations
        bindClick('btnPlay', () => this.resetGame());
        bindClick('btnShop', () => this.changeState(GAME_STATES.SHOP));
        bindClick('btnAchievements', () => this.changeState(GAME_STATES.ACHIEVEMENTS));
        bindClick('btnSettings', () => this.changeState(GAME_STATES.SETTINGS));
        
        // Closures interfaces panels routes
        ['closeShop', 'closeAch', 'closeSettings'].forEach(id => {
            bindClick(id, () => this.changeState(GAME_STATES.MENU));
        });

        this.setupSettingsPanel();
    }

    setupSettingsPanel() {
        const toggleMusic = document.getElementById('toggleMusic');
        const toggleSFX = document.getElementById('toggleSFX');
        
        if (toggleMusic) {
            toggleMusic.checked = this.saveSystem.data.settings.music;
            toggleMusic.addEventListener('change', (e) => {
                this.saveSystem.data.settings.music = e.target.checked;
                this.saveSystem.save();
            });
        }
        if (toggleSFX) {
            toggleSFX.checked = this.saveSystem.data.settings.sfx;
            toggleSFX.addEventListener('change', (e) => {
                this.saveSystem.data.settings.sfx = e.target.checked;
                this.saveSystem.save();
            });
        }
    }

    renderShop() {
        if (!this.dom.shop) return;
        
        const items = [
            { id: 'flame', type: 'blade', cost: 100, label: 'Flame Blade' },
            { id: 'ice', type: 'blade', cost: 250, label: 'Ice Blade' },
            { id: 'cyber', type: 'blade', cost: 500, label: 'Neon Cyber Blade' }
        ];

        let html = `<div class="shop-header"><h2>BLADE EMPOURIUM</h2><p>Coins: <span class="gold">${this.saveSystem.data.coins}</span></p></div><div class="shop-grid">`;
        
        items.forEach(item => {
            const purchased = this.saveSystem.data.purchasedBlades.includes(item.id);
            const equipped = this.saveSystem.data.equippedBlade === item.id;
            let btnText = `Buy (${item.cost} C)`;
            if (purchased) btnText = equipped ? 'Equipped' : 'Equip';
            
            html += `
                <div class="shop-card ${equipped ? 'equipped' : ''}">
                    <h3>${item.label}</h3>
                    <button class="shop-btn" data-id="${item.id}" data-cost="${item.cost}" data-purchased="${purchased}">
                        ${btnText}
                    </button>
                </div>
            `;
        });
        html += `</div><button id="closeShop" class="menu-btn alternative-btn">BACK</button>`;
        this.dom.shop.innerHTML = html;

        // Re-inject core exit events directly safely tracking runtime updates
        document.getElementById('closeShop').addEventListener('click', () => this.changeState(GAME_STATES.MENU));

        // Intercept action points clicks
        this.dom.shop.querySelectorAll('.shop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const cost = parseInt(e.target.getAttribute('data-cost'));
                const isPurchased = e.target.getAttribute('data-purchased') === 'true';

                if (isPurchased) {
                    this.saveSystem.data.equippedBlade = id;
                    this.showNotification(`Equipped ${id} Blade!`);
                } else if (this.saveSystem.data.coins >= cost) {
                    this.saveSystem.data.coins -= cost;
                    this.saveSystem.data.purchasedBlades.push(id);
                    this.saveSystem.data.equippedBlade = id;
                    this.showNotification(`Unlocked ${id} Blade!`);
                } else {
                    this.showNotification("Not enough gold coins!");
                }
                this.saveSystem.save();
                this.renderShop();
            });
        });
    }

    // Initialize 50 scaled systemic programmatic achievement tracking profiles matrices directly inside engine loops
    initAchievements() {
        this.achievementManifest = [];
        // Programmatic continuous injection loop matrices to complete mandatory 50-scale matrix configurations seamlessly
        for (let i = 1; i <= 20; i++) {
            this.achievementManifest.push({ id: `slice_${i*50}`, metric: 'totalSlices', target: i * 50, desc: `Slice ${i * 50} master fruits aggregate` });
        }
        for (let i = 1; i <= 15; i++) {
            this.achievementManifest.push({ id: `combo_${i+1}`, metric: 'maxCombo', target: i + 1, desc: `Perform a massive clean Combo x${i + 1} cross cut` });
        }
        for (let i = 1; i <= 15; i++) {
            this.achievementManifest.push({ id: `bomb_${i*5}`, metric: 'totalBombsAvoided', target: i * 5, desc: `Dodge and safely cycle past ${i * 5} volatile active bombs` });
        }
    }

    checkAchievementProgress() {
        const stats = this.saveSystem.data.stats;
        this.achievementManifest.forEach(ach => {
            if (this.saveSystem.data.unlockedAchievements.includes(ach.id)) return;
            
            const currentVal = stats[ach.metric] || 0;
            if (currentVal >= ach.target) {
                this.saveSystem.data.unlockedAchievements.push(ach.id);
                this.showNotification(`🏆 ACHIEVEMENT UNLOCKED: ${ach.desc}`);
                this.saveSystem.data.coins += 25; // Bonus reward coins injection vectors
            }
        });
    }

    renderAchievements() {
        if (!this.dom.achievements) return;
        let html = `<h2>ACHIEVEMENT LOGS (${this.saveSystem.data.unlockedAchievements.length}/${this.achievementManifest.length})</h2><div class="ach-list">`;
        
        this.achievementManifest.forEach(ach => {
            const unlocked = this.saveSystem.data.unlockedAchievements.includes(ach.id);
            html += `
                <div class="ach-row ${unlocked ? 'unlocked' : 'locked'}">
                    <span class="badge">${unlocked ? '🏆' : '🔒'}</span>
                    <div class="ach-details"><p class="ach-desc">${ach.desc}</p></div>
                </div>
            `;
        });
        html += `</div><button id="closeAch" class="menu-btn alternative-btn">BACK</button>`;
        this.dom.achievements.innerHTML = html;
        document.getElementById('closeAch').addEventListener('click', () => this.changeState(GAME_STATES.MENU));
    }
}

// ============================================================================
// 8. AUTO INITIALIZATION ENVIRONMENT BOOTSTRAPPING
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    window.FruitCutMasterInstance = new GameEngine();
});