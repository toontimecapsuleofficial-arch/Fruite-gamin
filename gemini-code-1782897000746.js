/**
 * Ultimate Blade Ninja - Production-Ready Fruit Slicing Game Engine
 * * Features:
 * - Advanced HTML5 Canvas Rendering & Core Physics Trajectories
 * - Object Pooling Pattern for Particles, Fruits, and Splashes
 * - Smooth Multi-touch & Mouse Drag Sword Trails with Glow Effects
 * - LocalStorage Persistent Save System for Shop Unlocks, Achievements, and Economy
 * - Advanced Combo Multipliers, Juice Particles, Fragment Physics, and Screen Shake
 * - UI Rendering Stack via Canvas APIs (No DOM dependencies)
 * * Target Frame Rate: 60 FPS
 */

// ============================================================================
// 1. ASSET DEFINITIONS & CONFIGURATION
// ============================================================================

const FRUIT_ASSETS = {
    apple: "assets/fruites/apple.png",
    banana: "assets/fruites/banana.png",
    grapes: "assets/fruites/grapes.png",
    blackGrapes: "assets/fruites/black_grapes.png",
    greenApple: "assets/fruites/green01.png",
    jackfruit: "assets/fruites/jackfruite.png",
    kiwi: "assets/fruites/kiwi.png",
    lemon: "assets/fruites/lemon.png",
    muskmelon: "assets/fruites/muskmelon.png",
    tomato: "assets/fruites/tomato.png"
};

const BACKGROUND_ASSETS = {
    morning: "assets/bg/morning.jpeg",
    evening: "assets/bg/evening.jpeg",
    evening2: "assets/bg/evening02.jpeg",
    night: "assets/bg/night.jpeg",
    golden: "assets/bg/golden.jpeg",
    minimal: "assets/bg/minimal.jpeg",
    ocean: "assets/bg/ocean.jpeg",
    space: "assets/bg/space.jpeg"
};

// Metadata for Physics, Rendering Scales, Scoring, and Juice Visuals
const FRUIT_METADATA = {
    apple: { radius: 45, color: "#ff2a2a", splashColor: "rgba(255,42,42,0.6)", points: 1, weight: 1.0 },
    banana: { radius: 40, color: "#ffe135", splashColor: "rgba(255,225,53,0.6)", points: 1, weight: 1.1 },
    grapes: { radius: 38, color: "#9b59b6", splashColor: "rgba(155,89,182,0.6)", points: 2, weight: 0.95 },
    blackGrapes: { radius: 38, color: "#4a154b", splashColor: "rgba(74,21,75,0.6)", points: 2, weight: 0.95 },
    greenApple: { radius: 45, color: "#7cb342", splashColor: "rgba(124,179,66,0.6)", points: 1, weight: 1.0 },
    jackfruit: { radius: 65, color: "#c0ca33", splashColor: "rgba(192,202,51,0.6)", points: 3, weight: 1.4 },
    kiwi: { radius: 36, color: "#9ccc65", splashColor: "rgba(156,204,101,0.6)", points: 2, weight: 0.9 },
    lemon: { radius: 32, color: "#ffee55", splashColor: "rgba(255,238,85,0.6)", points: 1, weight: 0.8 },
    muskmelon: { radius: 60, color: "#ffa726", splashColor: "rgba(255,167,38,0.6)", points: 3, weight: 1.35 },
    tomato: { radius: 42, color: "#ef5350", splashColor: "rgba(239,83,80,0.6)", points: 1, weight: 1.05 }
};

const BLADE_SKINS = {
    default: { id: "default", name: "Steel Katana", color: "#e0e0e0", glow: "#ffffff", shadow: "rgba(255,255,255,0.4)", trailLength: 12, width: 5, cost: 0 },
    fire: { id: "fire", name: "Crimson Inferno", color: "#ff3d00", glow: "#ffea00", shadow: "rgba(255,61,0,0.6)", trailLength: 18, width: 8, cost: 500 },
    ice: { id: "ice", name: "Glacial Frost", color: "#00e5ff", glow: "#d5f5ff", shadow: "rgba(0,229,255,0.5)", trailLength: 14, width: 6, cost: 800 },
    cyber: { id: "cyber", name: "Neon Matrix", color: "#00ff66", glow: "#00ffff", shadow: "rgba(0,255,102,0.7)", trailLength: 22, width: 7, cost: 1500 }
};

const BACKGROUND_CONFIGS = {
    morning: { id: "morning", name: "Zen Dojo", assetKey: "morning", cost: 0 },
    evening: { id: "evening", name: "Sunset Horizon", assetKey: "evening", cost: 300 },
    night: { id: "night", name: "Midnight Shadow", assetKey: "night", cost: 600 },
    ocean: { id: "ocean", name: "Sunken Reef", assetKey: "ocean", cost: 1200 },
    space: { id: "space", name: "Cosmic Gravity", assetKey: "space", cost: 2000 }
};

const GAME_STATES = {
    MENU: "MENU",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER: "GAME_OVER",
    SHOP: "SHOP"
};

// ============================================================================
// 2. SAVEMANAGER (LOCALSTORAGE INTERFACE)
// ============================================================================

class SaveManager {
    static STORAGE_KEY = "blade_ninja_save_profile";

    static getInitialData() {
        return {
            highScore: 0,
            coins: 150, // Starting currency
            unlockedBlades: ["default"],
            unlockedBackgrounds: ["morning"],
            equippedBlade: "default",
            equippedBackground: "morning",
            stats: {
                totalSlices: 0,
                totalCombos: 0,
                totalBombsHit: 0,
                gamesPlayed: 0
            },
            achievements: {}
        };
    }

    static load() {
        try {
            const serialized = localStorage.getItem(this.STORAGE_KEY);
            if (!serialized) {
                const data = this.getInitialData();
                this.save(data);
                return data;
            }
            const parsed = JSON.parse(serialized);
            // Dynamic schema verification deep merge
            const fallback = this.getInitialData();
            return { ...fallback, ...parsed, stats: { ...fallback.stats, ...parsed.stats }, achievements: { ...fallback.achievements, ...parsed.achievements } };
        } catch (e) {
            console.warn("Storage API inaccessible. Executing on memory state.");
            return this.getInitialData();
        }
    }

    static save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // Silence storage failure
        }
    }
}

// ============================================================================
// 3. ASSETLOADER (RESOURCE MANAGEMENT PIPELINE)
// ============================================================================

class AssetLoader {
    constructor() {
        this.images = {};
        this.totalResources = 0;
        this.loadedResources = 0;
        this.isComplete = false;
    }

    preload(onProgress, onComplete) {
        const fruitKeys = Object.keys(FRUIT_ASSETS);
        const bgKeys = Object.keys(BACKGROUND_ASSETS);
        this.totalResources = fruitKeys.length + bgKeys.length;

        if (this.totalResources === 0) {
            this.isComplete = true;
            onComplete();
            return;
        }

        const queueLoad = (key, url, category) => {
            const img = new Image();
            img.onload = () => {
                this.loadedResources++;
                onProgress(this.getPercentage());
                if (this.loadedResources >= this.totalResources) {
                    this.isComplete = true;
                    onComplete();
                }
            };
            img.onerror = () => {
                console.error(`Asset critical loading failure: [${category}] @ location "${url}"`);
                // Fail-soft progress incrementation to keep engine stable
                this.loadedResources++;
                onProgress(this.getPercentage());
                if (this.loadedResources >= this.totalResources) {
                    this.isComplete = true;
                    onComplete();
                }
            };
            img.src = url;
            this.images[key] = img;
        };

        fruitKeys.forEach(key => queueLoad(key, FRUIT_ASSETS[key], "FRUIT"));
        bgKeys.forEach(key => queueLoad(key, BACKGROUND_ASSETS[key], "BACKGROUND"));
    }

    getPercentage() {
        if (this.totalResources === 0) return 100;
        return Math.floor((this.loadedResources / this.totalResources) * 100);
    }

    getImage(key) {
        return this.images[key] || null;
    }
}

// ============================================================================
// 4. AUDIOMANAGER (WEBAUDIO GENERATOR SINCE NO EXTERNAL MP3 DEPENDENCIES EXIST)
// ============================================================================

class AudioManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playSwoosh() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(350, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
    }

    playSlice() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.11);
    }

    playBombExplode() {
        if (this.muted) return;
        this.init();
        // Synthesizing noise via low buffer manipulation
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.4);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
        noise.stop(this.ctx.currentTime + 0.4);
    }

    playCombo() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            gain.gain.setValueAtTime(0.1, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.16);
        });
    }

    playClick() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
    }
}

// ============================================================================
// 5. OBJECT POOLING SYSTEM EXECUTOR
// ============================================================================

class ParticlePool {
    constructor() {
        this.pool = [];
    }

    acquire(x, y, vx, vy, color, radius, type, maxLife) {
        if (this.pool.length > 0) {
            const p = this.pool.pop();
            p.reset(x, y, vx, vy, color, radius, type, maxLife);
            return p;
        }
        return new Particle(x, y, vx, vy, color, radius, type, maxLife);
    }

    release(particle) {
        this.pool.push(particle);
    }
}

class Particle {
    constructor(x, y, vx, vy, color, radius, type, maxLife) {
        this.reset(x, y, vx, vy, color, radius, type, maxLife);
    }

    reset(x, y, vx, vy, color, radius, type, maxLife) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.radius = radius;
        this.type = type; // "juice" | "spark" | "shard"
        this.life = maxLife;
        this.maxLife = maxLife;
        this.alpha = 1.0;
        this.gravity = type === "juice" ? 0.25 : 0.15;
        this.friction = 0.98;
    }

    update() {
        this.vx *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        if (this.type === "spark") {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ============================================================================
// 6. GAME OBJECTS (FRUIT & BOMB ENTITIES)
// ============================================================================

class Fruit {
    constructor(type, key, img, x, y, vx, vy, scaleModifier = 1.0) {
        const meta = FRUIT_METADATA[key];
        this.type = type; // e.g. "apple"
        this.key = key;
        this.img = img;
        this.radius = meta.radius * scaleModifier;
        this.points = meta.points;
        this.weight = meta.weight;
        this.color = meta.color;
        this.splashColor = meta.splashColor;

        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.gravity = 0.15 * this.weight;
        
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.06;

        this.isCut = false;
        this.cutAngle = 0;
        this.halves = null;
        this.markedForRemoval = false;
    }

    update(canvasHeight) {
        if (!this.isCut) {
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;

            if (this.y - this.radius > canvasHeight + 100) {
                this.markedForRemoval = true;
            }
        } else {
            // Processing separate velocity models for cut halves
            this.halves.h1.vy += this.gravity * 1.2;
            this.halves.h1.x += this.halves.h1.vx;
            this.halves.h1.y += this.halves.h1.vy;
            this.halves.h1.rotation += this.halves.h1.rotationSpeed;

            this.halves.h2.vy += this.gravity * 1.2;
            this.halves.h2.x += this.halves.h2.vx;
            this.halves.h2.y += this.halves.h2.vy;
            this.halves.h2.rotation += this.halves.h2.rotationSpeed;

            if (this.halves.h1.y - this.radius > canvasHeight + 100 && this.halves.h2.y - this.radius > canvasHeight + 100) {
                this.markedForRemoval = true;
            }
        }
    }

    slice(slashAngle, slashVelocityX) {
        this.isCut = true;
        this.cutAngle = slashAngle;
        
        const pushMagX = Math.max(2, Math.abs(slashVelocityX) * 0.3);
        const directionFactor = slashVelocityX > 0 ? 1 : -1;

        this.halves = {
            h1: {
                x: this.x, y: this.y,
                vx: this.vx - (pushMagX * 0.7) * directionFactor,
                vy: this.vy - 2,
                rotation: this.rotation,
                rotationSpeed: this.rotationSpeed - 0.05
            },
            h2: {
                x: this.x, y: this.y,
                vx: this.vx + (pushMagX * 0.7) * directionFactor,
                vy: this.vy + 1,
                rotation: this.rotation,
                rotationSpeed: this.rotationSpeed + 0.05
            }
        };
    }

    draw(ctx) {
        if (!this.img) return;

        if (!this.isCut) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.drawImage(this.img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        } else {
            // Rendering split components via custom canvas clipping regions mapping along cut alignment line
            const drawHalf = (halfObj, isLeft) => {
                ctx.save();
                ctx.translate(halfObj.x, halfObj.y);
                ctx.rotate(halfObj.rotation);

                ctx.beginPath();
                // Establish explicit clipping matrix along the local cut space
                ctx.rotate(this.cutAngle - halfObj.rotation);
                if (isLeft) {
                    ctx.rect(-this.radius * 2, -this.radius * 2, this.radius * 2, this.radius * 4);
                } else {
                    ctx.rect(0, -this.radius * 2, this.radius * 2, this.radius * 4);
                }
                ctx.rotate(-(this.cutAngle - halfObj.rotation));
                ctx.clip();

                ctx.drawImage(this.img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
                ctx.restore();
            };

            drawHalf(this.halves.h1, true);
            drawHalf(this.halves.h2, false);
        }
    }
}

class Bomb {
    constructor(x, y, vx, vy) {
        this.radius = 42;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.gravity = 0.13;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.04;
        this.pulseTime = 0;
        this.markedForRemoval = false;
    }

    update(canvasHeight) {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.pulseTime += 0.15;

        if (this.y - this.radius > canvasHeight + 100) {
            this.markedForRemoval = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const pulse = 1.0 + Math.sin(this.pulseTime) * 0.05;
        const currentRadius = this.radius * pulse;

        // Core procedural rendering for extreme resolution decoupling
        ctx.fillStyle = "#222222";
        ctx.strokeStyle = "#444444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Bomb metallic plate reflection highlight
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.arc(-currentRadius * 0.3, -currentRadius * 0.3, currentRadius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Fuse cord rendering
        ctx.strokeStyle = "#d7ccc8";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -currentRadius);
        ctx.bezierCurveTo(-10, -currentRadius - 15, 10, -currentRadius - 25, 5, -currentRadius - 35);
        ctx.stroke();

        // Spark dynamic generation point coordinates mapped to canvas global tracking vector space
        ctx.restore();
    }

    getFuseSpitLocation() {
        const currentRadius = this.radius * (1.0 + Math.sin(this.pulseTime) * 0.05);
        // Approximation vector offset based on local coordinate space rotations
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const localX = 5;
        const localY = -currentRadius - 35;
        return {
            x: this.x + (localX * cos - localY * sin),
            y: this.y + (localX * sin + localY * cos)
        };
    }
}

// ============================================================================
// 7. SUBSYSTEM INTERFACES (SHOP, ACHIEVEMENTS, STATE MANAGEMENT)
// ============================================================================

class ShopManager {
    constructor(engine) {
        this.engine = engine;
    }

    purchaseBlade(id) {
        const profile = this.engine.profile;
        const spec = BLADE_SKINS[id];
        if (!spec) return false;
        if (profile.unlockedBlades.includes(id)) return true;

        if (profile.coins >= spec.cost) {
            profile.coins -= spec.cost;
            profile.unlockedBlades.push(id);
            SaveManager.save(profile);
            return true;
        }
        return false;
    }

    purchaseBackground(id) {
        const profile = this.engine.profile;
        const spec = BACKGROUND_CONFIGS[id];
        if (!spec) return false;
        if (profile.unlockedBackgrounds.includes(id)) return true;

        if (profile.coins >= spec.cost) {
            profile.coins -= spec.cost;
            profile.unlockedBackgrounds.push(id);
            SaveManager.save(profile);
            return true;
        }
        return false;
    }

    equipBlade(id) {
        const profile = this.engine.profile;
        if (profile.unlockedBlades.includes(id)) {
            profile.equippedBlade = id;
            SaveManager.save(profile);
            return true;
        }
        return false;
    }

    equipBackground(id) {
        const profile = this.engine.profile;
        if (profile.unlockedBackgrounds.includes(id)) {
            profile.equippedBackground = id;
            SaveManager.save(profile);
            return true;
        }
        return false;
    }
}

class AchievementManager {
    constructor(engine) {
        this.engine = engine;
        this.registry = [];
        this.initRegistry();
    }

    initRegistry() {
        // Generating programmatically intensive 50-achievement data footprint layout matrix structures
        const targets = [
            { id: "slices_", name: "Slicer Tier ", prop: "totalSlices", thresholdBase: 50, multi: 3, rewardBase: 20 },
            { id: "combos_", name: "Combo Master Tier ", prop: "totalCombos", thresholdBase: 10, multi: 2.5, rewardBase: 30 },
            { id: "bombs_", name: "Danger Walker Tier ", prop: "totalBombsHit", thresholdBase: 5, multi: 2, rewardBase: 15 },
            { id: "games_", name: "Veteran Ninja Tier ", prop: "gamesPlayed", thresholdBase: 5, multi: 2, rewardBase: 25 }
        ];

        let idCounter = 1;
        targets.forEach(target => {
            for (let i = 1; i <= 10; i++) {
                const threshold = Math.floor(target.thresholdBase * Math.pow(target.multi, i - 1));
                const reward = Math.floor(target.rewardBase * i * 1.5);
                this.registry.push({
                    id: `${target.id}${i}`,
                    name: `${target.name}${i}`,
                    description: `Reach ${threshold} counts of ${target.prop.replace("total", "")}`,
                    evaluator: (p) => p.stats[target.prop] >= threshold,
                    reward: reward,
                    claimed: false
                });
                idCounter++;
            }
        });

        // Add contextual specific threshold milestone achievements
        this.registry.push(
            { id: "score_100", name: "Centurion Slicer", description: "Score 100+ points in a single session", evaluator: (p) => p.highScore >= 100, reward: 100 },
            { id: "score_250", name: "Blade Legend", description: "Score 250+ points in a single session", evaluator: (p) => p.highScore >= 250, reward: 300 },
            { id: "rich_500", name: "Coin Hoarder", description: "Possess 500+ coins in savings balance", evaluator: (p) => p.coins >= 500, reward: 50 },
            { id: "rich_2000", name: "Tycoon Dojo Master", description: "Possess 2000+ coins in savings balance", evaluator: (p) => p.coins >= 2000, reward: 250 },
            { id: "unlock_all_blades", name: "Armory Collector", description: "Unlock all distinct blade configurations", evaluator: (p) => p.unlockedBlades.length >= 4, reward: 400 },
            { id: "unlock_all_bgs", name: "World Traveler", description: "Unlock all distinct background structural spaces", evaluator: (p) => p.unlockedBackgrounds.length >= 5, reward: 400 },
            { id: "combo_god", name: "Precision Storm", description: "Execute total historical combo metric limits over 150 instances", evaluator: (p) => p.stats.totalCombos >= 150, reward: 500 },
            { id: "completionist", name: "Zen Supremacy", description: "Accumulate global slice metric counts past 5000 instances", evaluator: (p) => p.stats.totalSlices >= 5000, reward: 1000 }
        );
    }

    checkAchievements(notificationCallback) {
        const profile = this.engine.profile;
        if (!profile.achievements) profile.achievements = {};

        this.registry.forEach(ach => {
            if (!profile.achievements[ach.id]) {
                if (ach.evaluator(profile)) {
                    profile.achievements[ach.id] = true;
                    profile.coins += ach.reward;
                    if (notificationCallback) {
                        notificationCallback(ach);
                    }
                }
            }
        });
        SaveManager.save(profile);
    }

    getProgressData() {
        const profile = this.engine.profile;
        let unlockedCount = 0;
        const list = this.registry.map(ach => {
            const isUnlocked = !!profile.achievements[ach.id];
            if (isUnlocked) unlockedCount++;
            return { ...ach, unlocked: isUnlocked };
        });
        return { list, total: this.registry.length, unlockedCount };
    }
}

// ============================================================================
// 8. CORE ENGINE MAIN CONTROLLER
// ============================================================================

class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
            this.canvas.id = canvasId;
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext("2d");

        // Initialization Parameters
        this.profile = SaveManager.load();
        this.loader = new AssetLoader();
        this.audio = new AudioManager();
        this.shop = new ShopManager(this);
        this.achievements = new AchievementManager(this);
        this.particlePool = new ParticlePool();

        this.state = GAME_STATES.MENU;
        this.setupDimensions();

        // Game Trackers
        this.score = 0;
        this.lives = 3;
        this.waveTimer = 0;
        this.difficultyIntensity = 1.0;
        this.timeElapsed = 0;

        // Dynamic System Lists
        this.fruits = [];
        this.bombs = [];
        this.particles = [];
        this.swordTrail = []; // Collection of vectors: {x, y, time}
        
        // Active Wave Definition Configuration parameters
        this.waveSpawnDelay = 220; // FPS Tick metrics
        
        // Background System Fading properties
        this.currentBgKey = this.profile.equippedBackground;
        this.previousBgKey = null;
        this.bgFadeAlpha = 1.0;

        // Combo Engine Trackers
        this.sliceFrameBuffer = []; // Tracking active cuts across current slice phase window
        this.comboAnimationText = []; // Active text elements processing animations

        // Screen Shake properties
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;

        // UI View Specific Configuration Trackers
        this.shopScrollOffset = 0;
        this.achievScrollOffset = 0;
        this.activeShopTab = "blades"; // "blades" | "backgrounds"
        
        // Floating UI notifications banner queue layout
        this.uiNotificationQueue = [];
        this.uiNotificationTimer = 0;

        // Interactive Tracking Vectors
        this.isTrackingTouch = false;
        this.lastInputPos = { x: 0, y: 0 };

        window.addEventListener("resize", () => this.setupDimensions());
        this.registerInputPipelines();

        // Execution Core
        this.runPreloader();
    }

    setupDimensions() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    runPreloader() {
        this.loader.preload(
            (progress) => {
                this.renderPreloadProgress(progress);
            },
            () => {
                // Ensure default profiles load background successfully
                this.currentBgKey = this.profile.equippedBackground;
                this.cycleState(GAME_STATES.MENU);
                this.tick();
            }
        );
    }

    registerInputPipelines() {
        const startAction = (x, y) => {
            this.isTrackingTouch = true;
            this.lastInputPos = { x, y };
            this.swordTrail = [{ x, y, time: Date.now() }];
            if (this.state === GAME_STATES.PLAYING) {
                this.audio.playSwoosh();
            }
            this.processInputInteraction(x, y, true);
        };

        const moveAction = (x, y) => {
            if (!this.isTrackingTouch) return;
            this.swordTrail.push({ x, y, time: Date.now() });
            this.processSlicingPhysics(this.lastInputPos, { x, y });
            this.lastInputPos = { x, y };
        };

        const endAction = () => {
            this.isTrackingTouch = false;
        };

        // Mouse Hooks
        this.canvas.addEventListener("mousedown", (e) => {
            startAction(e.clientX, e.clientY);
        });
        this.canvas.addEventListener("mousemove", (e) => {
            moveAction(e.clientX, e.clientY);
        });
        window.addEventListener("mouseup", () => {
            endAction();
        });

        // Touch Hooks
        this.canvas.addEventListener("touchstart", (e) => {
            if (e.touches.length > 0) {
                startAction(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
        this.canvas.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                moveAction(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        }, { passive: false });
        window.addEventListener("touchend", () => {
            endAction();
        });
    }

    cycleState(targetState) {
        this.state = targetState;
        this.audio.playClick();

        if (targetState === GAME_STATES.PLAYING) {
            this.score = 0;
            this.lives = 3;
            this.timeElapsed = 0;
            this.difficultyIntensity = 1.0;
            this.fruits = [];
            this.bombs = [];
            this.particles = [];
            this.swordTrail = [];
            this.waveTimer = 30; // Initiate execution cascade instantly

            // Select random operational workspace backdrop
            const keys = Object.keys(BACKGROUND_ASSETS);
            const randKey = keys[Math.floor(Math.random() * keys.length)];
            if (this.currentBgKey !== randKey) {
                this.previousBgKey = this.currentBgKey;
                this.currentBgKey = randKey;
                this.bgFadeAlpha = 0.0;
            }

            this.profile.stats.gamesPlayed++;
            SaveManager.save(this.profile);
            this.achievements.checkAchievements((ach) => this.triggerNotification(ach));
        }
    }

    triggerNotification(ach) {
        this.uiNotificationQueue.push(ach);
    }

    // ============================================================================
    // 9. COLLISION DETECTION & PHYSICS EVALUATION ENGINE
    // ============================================================================

    processSlicingPhysics(p1, p2) {
        if (this.state !== GAME_STATES.PLAYING) return;

        // Fast escape optimization vector
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);
        if (segmentLength < 2) return;

        const sliceAngle = Math.atan2(dy, dx);

        // Evaluate intersection matrix properties across active items lists
        this.fruits.forEach(fruit => {
            if (fruit.isCut) return;

            if (this.checkLineCircleCollision(p1, p2, fruit)) {
                fruit.slice(sliceAngle, dx);
                this.handleFruitCutSuccess(fruit);
            }
        });

        this.bombs.forEach(bomb => {
            if (this.checkLineCircleCollision(p1, p2, bomb)) {
                this.handleBombExplosion(bomb);
            }
        });

        // Generate spark particles trace paths tracking blade location coordinates
        const activeBlade = BLADE_SKINS[this.profile.equippedBlade] || BLADE_SKINS.default;
        for (let i = 0; i < 3; i++) {
            const rx = p1.x + dx * Math.random();
            const ry = p1.y + dy * Math.random();
            const vx = (Math.random() - 0.5) * 4;
            const vy = (Math.random() - 0.5) * 4;
            this.particles.push(
                this.particlePool.acquire(rx, ry, vx, vy, activeBlade.glow, 2 + Math.random() * 3, "spark", 20 + Math.random() * 15)
            );
        }
    }

    checkLineCircleCollision(p1, p2, circle) {
        const cx = circle.x;
        const cy = circle.y;
        const r = circle.radius;

        // Vector validation math segment logic
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;

        // Prevent division by zero errors on matching coordinates evaluation spaces
        if (lenSq === 0) {
            const dist = Math.sqrt((cx - p1.x) * (cx - p1.x) + (cy - p1.y) * (cy - p1.y));
            return dist <= r;
        }

        // Project circle center onto line segment mapping dot product values limits
        let t = ((cx - p1.x) * dx + (cy - p1.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t)); // Constrain to segment boundaries

        const closestX = p1.x + t * dx;
        const closestY = p1.y + t * dy;

        const distSq = (cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY);
        return distSq <= r * r;
    }

    handleFruitCutSuccess(fruit) {
        this.audio.playSlice();
        this.profile.stats.totalSlices++;
        
        // Append context frame elements for execution analytics combo scanning processes
        this.sliceFrameBuffer.push({
            key: fruit.key,
            x: fruit.x,
            y: fruit.y,
            points: fruit.points,
            color: fruit.color,
            timestamp: Date.now()
        });

        // Spawn high density splash particles metrics tracking target parameters
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.particles.push(
                this.particlePool.acquire(
                    fruit.x, fruit.y,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    fruit.color, 4 + Math.random() * 5, "juice", 40 + Math.random() * 20
                )
            );
        }

        this.score += fruit.points;
        if (this.score > this.profile.highScore) {
            this.profile.highScore = this.score;
        }
        SaveManager.save(this.profile);
    }

    handleBombExplosion(bomb) {
        this.audio.playBombExplode();
        this.profile.stats.totalBombsHit++;
        this.shakeIntensity = 35;

        // Generate intense high density splash screen flashing effect parameters mapping execution paths
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 12;
            this.particles.push(
                this.particlePool.acquire(
                    bomb.x, bomb.y,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    i % 2 === 0 ? "#ff5722" : "#ffeb3b", 5 + Math.random() * 6, "spark", 50 + Math.random() * 30
                )
            );
        }

        this.lives = 0; // Immediate failure cascade execution
        this.cycleState(GAME_STATES.GAME_OVER);
    }

    // ============================================================================
    // 10. INTERACTION SCREEN COORD BUTTON INTERSECT IMPLEMENTATIONS
    // ============================================================================

    processInputInteraction(x, y, isFirstPress) {
        // Evaluate structural location maps mapping relative targets based on active game states parameters
        if (this.state === GAME_STATES.MENU) {
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;

            if (this.checkPointInCircle(x, y, cx, cy, 80)) {
                this.cycleState(GAME_STATES.PLAYING);
            } else if (this.checkPointInRect(x, y, cx - 180, cy + 140, 150, 50)) {
                this.cycleState(GAME_STATES.SHOP);
            } else if (this.checkPointInRect(x, y, cx + 30, cy + 140, 150, 50)) {
                this.state = GAME_STATES.SHOP; // Change tab focus
                this.cycleState(GAME_STATES.SHOP);
                this.activeShopTab = "achievements";
            }
        } else if (this.state === GAME_STATES.PLAYING) {
            // Check operational boundaries metrics mapping targeting paused control icon box locations
            if (this.checkPointInRect(x, y, this.canvas.width - 60, 20, 40, 40)) {
                this.cycleState(GAME_STATES.PAUSED);
            }
        } else if (this.state === GAME_STATES.PAUSED) {
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;
            if (this.checkPointInRect(x, y, cx - 100, cy - 30, 200, 50)) {
                this.cycleState(GAME_STATES.PLAYING);
            } else if (this.checkPointInRect(x, y, cx - 100, cy + 40, 200, 50)) {
                this.cycleState(GAME_STATES.MENU);
            }
        } else if (this.state === GAME_STATES.GAME_OVER) {
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;
            if (this.checkPointInRect(x, y, cx - 140, cy + 60, 120, 50)) {
                this.cycleState(GAME_STATES.PLAYING);
            } else if (this.checkPointInRect(x, y, cx + 20, cy + 60, 120, 50)) {
                this.cycleState(GAME_STATES.MENU);
            }
        } else if (this.state === GAME_STATES.SHOP) {
            const padX = 40;
            const padY = 40;
            const sw = this.canvas.width - padX * 2;
            const sh = this.canvas.height - padY * 2;

            // Return to main menu layout location mapping metrics coordinate boundaries
            if (this.checkPointInRect(x, y, padX + sw - 60, padY + 20, 40, 40)) {
                this.cycleState(GAME_STATES.MENU);
                return;
            }

            // Tab Switching Intersections
            if (this.checkPointInRect(x, y, padX + 30, padY + 90, 100, 40)) {
                this.activeShopTab = "blades";
                this.audio.playClick();
            } else if (this.checkPointInRect(x, y, padX + 140, padY + 90, 140, 40)) {
                this.activeShopTab = "backgrounds";
                this.audio.playClick();
            } else if (this.checkPointInRect(x, y, padX + 290, padY + 90, 140, 40)) {
                this.activeShopTab = "achievements";
                this.audio.playClick();
            }

            // Scroll arrows click processing tracking matrix operations
            if (this.checkPointInRect(x, y, padX + sw - 140, padY + 90, 40, 40)) {
                if (this.activeShopTab === "blades" || this.activeShopTab === "backgrounds") this.shopScrollOffset = Math.max(0, this.shopScrollOffset - 1);
                else this.achievScrollOffset = Math.max(0, this.achievScrollOffset - 1);
                this.audio.playClick();
            }
            if (this.checkPointInRect(x, y, padX + sw - 80, padY + 90, 40, 40)) {
                if (this.activeShopTab === "blades" || this.activeShopTab === "backgrounds") this.shopScrollOffset++;
                else this.achievScrollOffset++;
                this.audio.playClick();
            }

            // Item Listing dynamic calculation click processing tracking matrices locations bounds map parameters
            if (this.activeShopTab === "blades") {
                const keys = Object.keys(BLADE_SKINS);
                const startIdx = this.shopScrollOffset * 3;
                const visibleKeys = keys.slice(startIdx, startIdx + 3);
                visibleKeys.forEach((key, idx) => {
                    const itemY = padY + 160 + idx * 95;
                    // Check action execution processing tracking interaction parameters matrix target button triggers
                    if (this.checkPointInRect(x, y, padX + sw - 170, itemY + 20, 130, 40)) {
                        this.processBladeShopAction(key);
                    }
                });
            } else if (this.activeShopTab === "backgrounds") {
                const keys = Object.keys(BACKGROUND_CONFIGS);
                const startIdx = this.shopScrollOffset * 3;
                const visibleKeys = keys.slice(startIdx, startIdx + 3);
                visibleKeys.forEach((key, idx) => {
                    const itemY = padY + 160 + idx * 95;
                    if (this.checkPointInRect(x, y, padX + sw - 170, itemY + 20, 130, 40)) {
                        this.processBackgroundShopAction(key);
                    }
                });
            }
        }
    }

    processBladeShopAction(id) {
        if (this.profile.unlockedBlades.includes(id)) {
            this.shop.equipBlade(id);
        } else {
            this.shop.purchaseBlade(id);
        }
        this.audio.playClick();
    }

    processBackgroundShopAction(id) {
        if (this.profile.unlockedBackgrounds.includes(id)) {
            this.shop.equipBackground(id);
            // Track dynamic real-time structural configuration modifications mapping updates
            this.currentBgKey = this.profile.equippedBackground;
        } else {
            this.shop.purchaseBackground(id);
        }
        this.audio.playClick();
    }

    checkPointInCircle(px, py, cx, cy, r) {
        return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
    }

    checkPointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    // ============================================================================
    // 11. SPARK FRUIT SPAWNING & PATTERN SYSTEMS WAVE CONTROLLER
    // ============================================================================

    evaluateWaveSpawningSystems() {
        this.waveTimer++;
        if (this.waveTimer >= this.waveSpawnDelay) {
            this.waveTimer = 0;
            // Scale dynamically wave spawning frequency metrics limits
            this.waveSpawnDelay = Math.max(100, 220 - Math.floor(this.timeElapsed * 0.05));

            const fruitsToSpawn = 2 + Math.floor(Math.random() * Math.min(4, 1 + this.difficultyIntensity * 0.5));
            const fruitKeys = Object.keys(FRUIT_ASSETS);

            for (let i = 0; i < fruitsToSpawn; i++) {
                const randomKey = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
                const img = this.loader.getImage(randomKey);

                // Setup launch physics mechanics vector constraints maps
                const x = this.canvas.width * 0.15 + Math.random() * (this.canvas.width * 0.7);
                const y = this.canvas.height + 50;

                // Dynamically direct launch path toward center space target parameters
                const targetX = this.canvas.width / 2 + (Math.random() - 0.5) * (this.canvas.width * 0.3);
                const ticksToApex = 75 + Math.random() * 25;
                const vx = (targetX - x) / ticksToApex;
                
                // Solve trajectory parameters based on gravity constants allocations equations models mapping matrix trajectories
                const targetApexY = this.canvas.height * 0.15 + Math.random() * (this.canvas.height * 0.35);
                const distY = targetApexY - y;
                const meta = FRUIT_METADATA[randomKey];
                const simulatedGravity = 0.15 * (meta ? meta.weight : 1.0);
                const vy = (distY - 0.5 * simulatedGravity * ticksToApex * ticksToApex) / ticksToApex;

                this.fruits.push(new Fruit(randomKey, randomKey, img, x, y, vx, vy, 1.0));
            }

            // Bomb Spawning Odds Logic calculations metrics parameters scaling upwards over session operational periods
            const bombChance = 0.2 + Math.min(0.4, this.difficultyIntensity * 0.05);
            if (Math.random() < bombChance) {
                const bx = this.canvas.width * 0.25 + Math.random() * (this.canvas.width * 0.5);
                const by = this.canvas.height + 50;
                const bTargetX = this.canvas.width / 2 + (Math.random() - 0.5) * (this.canvas.width * 0.2);
                const bTicks = 85;
                const bvx = (bTargetX - bx) / bTicks;
                const bApexY = this.canvas.height * 0.2 + Math.random() * (this.canvas.height * 0.3);
                const bdistY = bApexY - by;
                const bvy = (bdistY - 0.5 * 0.13 * bTicks * bTicks) / bTicks;

                this.bombs.push(new Bomb(bx, by, bvx, bvy));
            }
        }
    }

    evaluateActiveComboScanners() {
        const now = Date.now();
        // Extract elements processing metrics thresholds matching context filters validation rules maps
        if (this.sliceFrameBuffer.length > 0) {
            // Scan historical tracking arrays to identify sequential records grouped closely inside structural duration constraints
            const validCuts = this.sliceFrameBuffer.filter(item => now - item.timestamp < 350);
            
            if (validCuts.length >= 3 && validCuts.length === this.sliceFrameBuffer.length) {
                // Combo triggered
                let comboCount = validCuts.length;
                let displayMultiplier = 2;
                if (comboCount >= 10) displayMultiplier = 10;
                else if (comboCount >= 5) displayMultiplier = 5;
                else if (comboCount >= 4) displayMultiplier = 3;

                const bonusScore = comboCount * displayMultiplier;
                this.score += bonusScore;
                this.profile.stats.totalCombos++;
                SaveManager.save(this.profile);

                this.audio.playCombo();

                // Compute geometric balance center across matching item coordinates points matrix mappings
                let avgX = 0, avgY = 0;
                validCuts.forEach(c => { avgX += c.x; avgY += c.y; });
                avgX /= comboCount;
                avgY /= comboCount;

                this.comboAnimationText.push({
                    text: `COMBO x${displayMultiplier}!`,
                    subtext: `+${bonusScore} PTS`,
                    x: Math.min(this.canvas.width - 150, Math.max(150, avgX)),
                    y: Math.min(this.canvas.height - 100, Math.max(150, avgY)),
                    life: 55,
                    maxLife: 55,
                    color: validCuts[validCuts.length - 1].color
                });

                if (displayMultiplier >= 5) {
                    this.shakeIntensity = 16;
                }

                this.achievements.checkAchievements((ach) => this.triggerNotification(ach));
                this.sliceFrameBuffer = [];
            } else if (this.sliceFrameBuffer.length > 0 && now - this.sliceFrameBuffer[0].timestamp >= 350) {
                // Evict obsolete records safely past duration criteria tracking points limits
                this.sliceFrameBuffer.shift();
            }
        }
    }

    // ============================================================================
    // 12. RUNTIME GRAPHICS PIPELINE & SCENE UPDATES RENDERING LOOP
    // ============================================================================

    tick() {
        this.updateDataStates();
        this.renderSceneGraphics();
        requestAnimationFrame(() => this.tick());
    }

    updateDataStates() {
        // Linear execution progression tracking counters increments logic
        if (this.state === GAME_STATES.PLAYING) {
            this.timeElapsed += 1 / 60;
            this.difficultyIntensity = 1.0 + this.timeElapsed * 0.015;
            this.evaluateWaveSpawningSystems();
            this.evaluateActiveComboScanners();
        }

        // Clean sword trails of obsolete elements past structural lifetime criteria thresholds configurations
        const trailTimeLimit = 180; 
        const now = Date.now();
        const activeBlade = BLADE_SKINS[this.profile.equippedBlade] || BLADE_SKINS.default;
        const maxLen = activeBlade.trailLength;

        while (this.swordTrail.length > maxLen || (this.swordTrail.length > 0 && now - this.swordTrail[0].time > trailTimeLimit)) {
            this.swordTrail.shift();
        }

        // Processing background fade tracking counters transitions metrics matrix mappings
        if (this.bgFadeAlpha < 1.0) {
            this.bgFadeAlpha += 0.02;
            if (this.bgFadeAlpha >= 1.0) {
                this.bgFadeAlpha = 1.0;
                this.previousBgKey = null;
            }
        }

        // Processing screen shake damping interpolation vectors tracking models configurations formulas models parameters
        if (this.shakeIntensity > 0.1) {
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
        }

        // Framework updates loop calculations execution lists parsing management routines
        if (this.state === GAME_STATES.PLAYING) {
            this.fruits.forEach(f => f.update(this.canvas.height));
            this.bombs.forEach(b => b.update(this.canvas.height));

            // Check missed items parameters causing dynamic drop penances structural lives metrics damage counts allocation properties
            this.fruits.forEach(f => {
                if (f.markedForRemoval && !f.isCut) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.lives = 0;
                        this.cycleState(GAME_STATES.GAME_OVER);
                    }
                }
            });

            // Evict spent object pointers tracking items allocation systems lists maps parameters safely
            this.fruits = this.fruits.filter(f => !f.markedForRemoval);
            this.bombs = this.bombs.filter(b => !b.markedForRemoval);
        }

        // Universal update tracking particle metrics entities
        this.particles.forEach(p => p.update());
        this.particles.forEach(p => {
            if (p.life <= 0) this.particlePool.release(p);
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Track procedural particle spawns attached directly onto bomb fuse locations
        if (this.state === GAME_STATES.PLAYING) {
            this.bombs.forEach(b => {
                const fLoc = b.getFuseSpitLocation();
                for (let i = 0; i < 2; i++) {
                    const vx = (Math.random() - 0.5) * 3;
                    const vy = -Math.random() * 2 - 1;
                    this.particles.push(
                        this.particlePool.acquire(fLoc.x, fLoc.y, vx, vy, "#ffeb3b", 1.5 + Math.random() * 2, "spark", 12 + Math.random() * 10)
                    );
                }
            });
        }

        // Animate floating combo elements text structures configurations tracking matrices
        this.comboAnimationText.forEach(ct => ct.life--);
        this.comboAnimationText = this.comboAnimationText.filter(ct => ct.life > 0);

        // Step active float notifications processing systems timers counts parameters allocations
        if (this.uiNotificationQueue.length > 0) {
            this.uiNotificationTimer++;
            if (this.uiNotificationTimer > 160) {
                this.uiNotificationQueue.shift();
                this.uiNotificationTimer = 0;
            }
        }
    }

    renderSceneGraphics() {
        this.ctx.save();
        
        // Execute camera matrix translations tracking screen shake parameters formulas structural equations models
        if (this.shakeIntensity > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(sx, sy);
        }

        this.drawBackgroundLayer();

        // Render game object layers conditionally matching operational runtime contexts parameters maps
        if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED || this.state === GAME_STATES.GAME_OVER) {
            this.fruits.forEach(f => f.draw(this.ctx));
            this.bombs.forEach(b => b.draw(this.ctx));
        }

        this.particles.forEach(p => p.draw(this.ctx));
        this.drawSwordTrailLayer();
        this.drawComboOverlayTextLayer();

        this.ctx.restore(); // Evict shaking translation transforms matrix structures layers cleanly

        // Overlay context user interface screens directly on top of base vector rendering spaces paths definitions
        this.renderCanvasUserInterfacesStack();
    }

    drawBackgroundLayer() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        if (this.previousBgKey) {
            const prevImg = this.loader.getImage(this.previousBgKey);
            if (prevImg) this.ctx.drawImage(prevImg, 0, 0, w, h);
        }

        this.ctx.save();
        this.ctx.globalAlpha = this.bgFadeAlpha;
        const curImg = this.loader.getImage(this.currentBgKey);
        if (curImg) {
            this.ctx.drawImage(curImg, 0, 0, w, h);
        } else {
            // Fail soft solid backdrop color rendering
            this.ctx.fillStyle = "#1e1e24";
            this.ctx.fillRect(0, 0, w, h);
        }
        this.ctx.restore();

        // Background shadow overlay context layout shading layer tracking operations metrics paths parameters maps
        this.ctx.fillStyle = "rgba(0,0,0,0.15)";
        this.ctx.fillRect(0, 0, w, h);
    }

    drawSwordTrailLayer() {
        if (this.swordTrail.length < 2) return;

        const activeBlade = BLADE_SKINS[this.profile.equippedBlade] || BLADE_SKINS.default;
        this.ctx.save();
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = activeBlade.glow;

        // Render wide backing glow profile element path layout allocations parameters
        this.ctx.strokeStyle = activeBlade.shadow;
        this.ctx.lineWidth = activeBlade.width * 1.6;
        this.ctx.beginPath();
        this.ctx.moveTo(this.swordTrail[0].x, this.swordTrail[0].y);
        for (let i = 1; i < this.swordTrail.length; i++) {
            this.ctx.lineTo(this.swordTrail[i].x, this.swordTrail[i].y);
        }
        this.ctx.stroke();

        // Render sharp core razor bright white inner trail component layout structural pathways maps configuration parameters
        this.ctx.strokeStyle = activeBlade.color;
        this.ctx.lineWidth = activeBlade.width * 0.7;
        this.ctx.beginPath();
        this.ctx.moveTo(this.swordTrail[0].x, this.swordTrail[0].y);
        for (let i = 1; i < this.swordTrail.length; i++) {
            this.ctx.lineTo(this.swordTrail[i].x, this.swordTrail[i].y);
        }
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawComboOverlayTextLayer() {
        this.comboAnimationText.forEach(ct => {
            this.ctx.save();
            const progress = ct.life / ct.maxLife;
            this.ctx.globalAlpha = Math.min(1.0, progress * 1.5);
            
            // Scaled pop animations vectors calculations layout allocations formulas structural models equations configuration parameters
            const scale = 1.0 + Math.sin((1.0 - progress) * Math.PI) * 0.25;
            this.ctx.translate(ct.x, ct.y);
            this.ctx.scale(scale, scale);

            this.ctx.textAlign = "center";
            this.ctx.font = "italic bold 28px sans-serif";
            
            // High visibility inner textual layout elements shading operations parameters paths mapping matrix spaces
            this.ctx.fillStyle = "#ffffff";
            this.ctx.strokeStyle = ct.color || "#ffeb3b";
            this.ctx.lineWidth = 5;
            this.ctx.strokeText(ct.text, 0, 0);
            this.ctx.fillText(ct.text, 0, 0);

            this.ctx.font = "bold 18px sans-serif";
            this.ctx.fillStyle = "#ffeb3b";
            this.ctx.strokeStyle = "rgba(0,0,0,0.8)";
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(ct.subtext, 0, 30);
            this.ctx.fillText(ct.subtext, 0, 30);

            this.ctx.restore();
        });
    }

    // ============================================================================
    // 13. UI SUB-RESOURCES ARCHITECTURE DRAW STACK PIPELINES
    // ============================================================================

    renderCanvasUserInterfacesStack() {
        this.renderSystemAchievementNotificationBanner();

        switch (this.state) {
            case GAME_STATES.MENU:
                this.drawMenuHUD();
                break;
            case GAME_STATES.PLAYING:
                this.drawPlayingHUD();
                break;
            case GAME_STATES.PAUSED:
                this.drawPausedHUD();
                break;
            case GAME_STATES.GAME_OVER:
                this.drawGameOverHUD();
                break;
            case GAME_STATES.SHOP:
                this.drawShopScreenHUD();
                break;
        }
    }

    renderPreloadProgress(progress) {
        // Simple standalone full context screen clean canvas progress layout routine
        this.ctx.fillStyle = "#0f0f12";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 24px sans-serif";
        this.ctx.fillText("LOADING ZEN DOJO ASSETS", cx, cy - 20);

        this.ctx.strokeStyle = "#333333";
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(cx - 150, cy + 10, 300, 20);

        this.ctx.fillStyle = "#00ff66";
        this.ctx.fillRect(cx - 148, cy + 12, (296 * progress) / 100, 16);

        this.ctx.font = "14px sans-serif";
        this.ctx.fillStyle = "#888888";
        this.ctx.fillText(`${progress}% COMPLETE`, cx, cy + 55);
    }

    renderSystemAchievementNotificationBanner() {
        if (this.uiNotificationQueue.length === 0) return;
        const ach = this.uiNotificationQueue[0];
        const w = this.canvas.width;

        this.ctx.save();
        let alpha = 1.0;
        if (this.uiNotificationTimer < 20) alpha = this.uiNotificationTimer / 20;
        if (this.uiNotificationTimer > 140) alpha = (160 - this.uiNotificationTimer) / 20;
        this.ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

        const bx = w / 2 - 200;
        const by = 20;

        // Draw structural layout glass plate interface layout matrix components allocations parameters
        this.ctx.fillStyle = "rgba(20,20,28,0.92)";
        this.ctx.strokeStyle = "#ffeb3b";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(bx, by, 400, 65, 12);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.textAlign = "left";
        this.ctx.fillStyle = "#ffeb3b";
        this.ctx.font = "bold 14px sans-serif";
        this.ctx.fillText("🏆 ACHIEVEMENT UNLOCKED!", bx + 20, by + 25);

        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "13px sans-serif";
        this.ctx.fillText(ach.name, bx + 20, by + 48);

        this.ctx.textAlign = "right";
        this.ctx.fillStyle = "#00ff66";
        this.ctx.font = "bold 13px sans-serif";
        this.ctx.fillText(`+${ach.reward} COINS`, bx + 380, by + 38);

        this.ctx.restore();
    }

    drawMenuHUD() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // Title Structural Layout Graphics
        this.ctx.textAlign = "center";
        this.ctx.save();
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = "#ff2a2a";
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "italic bold 56px sans-serif";
        this.ctx.fillText("BLADE NINJA", cx, cy - 140);
        this.ctx.restore();

        // Central Play Action Circular Interactive Plate Layout parameters maps structural models calculations
        this.ctx.save();
        this.ctx.fillStyle = "rgba(255,255,255,0.08)";
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 22px sans-serif";
        this.ctx.fillText("SLICE", cx, cy + 8);
        this.ctx.restore();

        // Interactive Button Layout Elements mapping system coordinate properties matrices maps configurations parameters
        const drawButton = (tx, ty, tw, th, text, color) => {
            this.ctx.fillStyle = "rgba(0,0,0,0.6)";
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(tx, ty, tw, th, 8);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "bold 15px sans-serif";
            this.ctx.fillText(text, tx + tw / 2, ty + th / 2 + 5);
        };

        drawButton(cx - 180, cy + 140, 150, 50, "ARMORY SHOP", "#00e5ff");
        drawButton(cx + 30, cy + 140, 150, 50, "MEDALS", "#ffeb3b");

        // Lower Metadata Info Layout lines parameters allocation vectors matrix maps
        this.ctx.fillStyle = "#aaaaaa";
        this.ctx.font = "14px sans-serif";
        this.ctx.fillText(`PERSONAL HIGH SCORE: ${this.profile.highScore}`, cx, cy + 240);
        this.ctx.fillText(`COINS STASH BAL: ${this.profile.coins}`, cx, cy + 265);
    }

    drawPlayingHUD() {
        // Upper left point configurations display modules interface maps limits formulas models calculations parameters
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 34px sans-serif";
        this.ctx.fillText(this.score.toString(), 25, 50);

        this.ctx.fillStyle = "#ffeb3b";
        this.ctx.font = "14px sans-serif";
        this.ctx.fillText(`HIGH: ${this.profile.highScore}`, 27, 75);

        // Upper right lifecycle metrics crosses trackers elements allocations matrix fields configurations updates parameters
        const startX = this.canvas.width - 160;
        this.ctx.textAlign = "left";
        for (let i = 0; i < 3; i++) {
            this.ctx.save();
            if (i < this.lives) {
                this.ctx.fillStyle = "#ff2a2a";
                this.ctx.font = "28px sans-serif";
                this.ctx.fillText("❤️", startX + i * 32, 45);
            } else {
                this.ctx.fillStyle = "rgba(255,255,255,0.2)";
                this.ctx.font = "28px sans-serif";
                this.ctx.fillText("🖤", startX + i * 32, 45);
            }
            this.ctx.restore();
        }

        // Processing interactive active pause control action layout boxes components
        const px = this.canvas.width - 60;
        this.ctx.fillStyle = "rgba(0,0,0,0.4)";
        this.ctx.strokeStyle = "rgba(255,255,255,0.5)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(px, 20, 40, 40, 6);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(px + 13, 30, 4, 20);
        this.ctx.fillRect(px + 23, 30, 4, 20);
    }

    drawPausedHUD() {
        // Lightly darken screen content beneath pause box layer elements maps configuration parameters
        this.ctx.fillStyle = "rgba(0,0,0,0.65)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 38px sans-serif";
        this.ctx.fillText("GAME PAUSED", cx, cy - 90);

        const drawPausedBtn = (bx, by, bw, bh, txt, col) => {
            this.ctx.fillStyle = "rgba(255,255,255,0.1)";
            this.ctx.strokeStyle = col;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(bx, by, bw, bh, 8);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "bold 16px sans-serif";
            this.ctx.fillText(txt, bx + bw / 2, by + bh / 2 + 5);
        };

        drawPausedBtn(cx - 100, cy - 30, 200, 50, "RESUME ACTION", "#00ff66");
        drawPausedBtn(cx - 100, cy + 40, 200, 50, "QUIT TO MENU", "#ff2a2a");
    }

    drawGameOverHUD() {
        this.ctx.fillStyle = "rgba(0,0,0,0.78)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "#ff2a2a";
        this.ctx.font = "italic bold 48px sans-serif";
        this.ctx.fillText("GAME OVER", cx, cy - 110);

        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "22px sans-serif";
        this.ctx.fillText(`FINAL SCORE: ${this.score}`, cx, cy - 45);

        this.ctx.fillStyle = "#ffeb3b";
        this.ctx.font = "16px sans-serif";
        this.ctx.fillText(`RECORD TO BEAT: ${this.profile.highScore}`, cx, cy - 15);

        // Dynamic session financial calculation gains parsing metrics allocation systems configurations update logic parameters maps
        const coinGains = Math.floor(this.score * 0.5);
        this.ctx.fillStyle = "#00ff66";
        this.ctx.font = "bold 15px sans-serif";
        this.ctx.fillText(`REWARD BAL ADD: +${coinGains} COINS`, cx, cy + 20);

        // Commit reward gains securely inside configuration storage vectors matrix layers fields parameters
        if (this.timeElapsed > 0.1) {
            this.profile.coins += coinGains;
            // Evict time metrics counters variables to confirm single execution run across loop passes safely
            this.timeElapsed = 0;
            SaveManager.save(this.profile);
        }

        const drawGOBtn = (bx, by, bw, bh, txt, col) => {
            this.ctx.fillStyle = "rgba(255,255,255,0.08)";
            this.ctx.strokeStyle = col;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(bx, by, bw, bh, 8);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "bold 15px sans-serif";
            this.ctx.fillText(txt, bx + bw / 2, by + bh / 2 + 5);
        };

        drawGOBtn(cx - 140, cy + 60, 120, 50, "TRY AGAIN", "#00e5ff");
        drawGOBtn(cx + 20, cy + 60, 120, 50, "MAIN MENU", "#ffffff");
    }

    drawShopScreenHUD() {
        const padX = 40;
        const padY = 40;
        const sw = this.canvas.width - padX * 2;
        const sh = this.canvas.height - padY * 2;

        // Draw structural window framing container lines parameters models equations mapping matrix paths elements
        this.ctx.fillStyle = "rgba(14,14,18,0.94)";
        this.ctx.strokeStyle = "#333333";
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.roundRect(padX, padY, sw, sh, 16);
        this.ctx.fill();
        this.ctx.stroke();

        // Header Title parameters tracking maps configurations systems properties metrics layers bounds
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 26px sans-serif";
        this.ctx.fillText("DOJO LOCKER ARMORY", padX + 30, padY + 50);

        this.ctx.textAlign = "right";
        this.ctx.fillStyle = "#ffeb3b";
        this.ctx.font = "bold 16px sans-serif";
        this.ctx.fillText(`BALANCE: ${this.profile.coins} COINS`, padX + sw - 90, padY + 48);

        // Close Action circular box targets allocations elements
        const cxButtonX = padX + sw - 60;
        this.ctx.fillStyle = "rgba(255,255,255,0.1)";
        this.ctx.strokeStyle = "#ff2a2a";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(cxButtonX, padY + 20, 40, 40, 8);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "#ff2a2a";
        this.ctx.font = "bold 16px sans-serif";
        this.ctx.fillText("X", cxButtonX + 20, padY + 45);

        // Tab Selection Header items loops calculations parameters mapping boundaries bounds locations map parameters
        const drawTab = (tx, ty, tw, th, label, active) => {
            this.ctx.fillStyle = active ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.3)";
            this.ctx.strokeStyle = active ? "#00e5ff" : "#555555";
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(tx, ty, tw, th, 6);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.fillStyle = active ? "#ffffff" : "#999999";
            this.ctx.font = "bold 14px sans-serif";
            this.ctx.fillText(label, tx + tw / 2, ty + th / 2 + 5);
        };

        this.ctx.textAlign = "center";
        drawTab(padX + 30, padY + 90, 100, 40, "BLADES", this.activeShopTab === "blades");
        drawTab(padX + 140, padY + 90, 140, 40, "BACKGROUNDS", this.activeShopTab === "backgrounds");
        drawTab(padX + 290, padY + 90, 140, 40, "ACHIEVEMENTS", this.activeShopTab === "achievements");

        // Rendering operational pagination tracking interfaces buttons elements
        const drawScrollArrow = (ax, ay, txt) => {
            this.ctx.fillStyle = "rgba(255,255,255,0.05)";
            this.ctx.strokeStyle = "#ffffff";
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.roundRect(ax, ay, 40, 40, 4);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "bold 16px sans-serif";
            this.ctx.fillText(txt, ax + 20, ay + 25);
        };

        drawScrollArrow(padX + sw - 140, padY + 90, "<");
        drawScrollArrow(padX + sw - 80, padY + 90, ">");

        // Sub-view component render distribution routing logic switches maps structures allocation fields
        this.ctx.textAlign = "left";
        if (this.activeShopTab === "blades") {
            this.renderBladesSubTabList(padX, padY, sw, sh);
        } else if (this.activeShopTab === "backgrounds") {
            this.renderBackgroundsSubTabList(padX, padY, sw, sh);
        } else if (this.activeShopTab === "achievements") {
            this.renderAchievementsSubTabList(padX, padY, sw, sh);
        }
    }

    renderBladesSubTabList(padX, padY, sw, sh) {
        const keys = Object.keys(BLADE_SKINS);
        const startIdx = this.shopScrollOffset * 3;
        // Restrict indices limits securely safely matching length criteria configurations arrays ranges bounds maps
        const targetKeys = keys.slice(startIdx, Math.min(keys.length, startIdx + 3));

        if (targetKeys.length === 0 && this.shopScrollOffset > 0) {
            this.shopScrollOffset = 0; // Reset loop back soft bounds safely parameters
            return;
        }

        targetKeys.forEach((key, idx) => {
            const spec = BLADE_SKINS[key];
            const itemY = padY + 160 + idx * 95;

            this.ctx.fillStyle = "rgba(255,255,255,0.02)";
            this.ctx.strokeStyle = "#222222";
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.roundRect(padX + 30, itemY, sw - 60, 80, 8);
            this.ctx.fill();
            this.ctx.stroke();

            // Meta Details Textual strings layout renderings components allocations properties parameters maps formulas
            this.ctx.fillStyle = spec.glow;
            this.ctx.font = "bold 18px sans-serif";
            this.ctx.fillText(spec.name, padX + 50, itemY + 35);

            this.ctx.fillStyle = "#aaaaaa";
            this.ctx.font = "13px sans-serif";
            this.ctx.fillText(`Trail Particle Depth Density Trace Metrics Count Rating Level: ${spec.trailLength}`, padX + 50, itemY + 60);

            // Item Transaction Interaction Context State Assessment Logic Block structures layout fields maps parameters
            const isUnlocked = this.profile.unlockedBlades.includes(key);
            const isEquipped = this.profile.equippedBlade === key;

            let btnText = "";
            let btnColor = "";
            if (isEquipped) { active: { btnText = "ACTIVE"; btnColor = "#00ff66"; } }
            else if (isUnlocked) { acquired: { btnText = "EQUIP"; btnColor = "#00e5ff"; } }
            else { market: { btnText = `${spec.cost} COINS`; btnColor = "#ffeb3b"; } }

            const btnX = padX + sw - 170;
            this.ctx.fillStyle = "rgba(0,0,0,0.4)";
            this.ctx.strokeStyle = btnColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(btnX, itemY + 20, 130, 40, 6);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.textAlign = "center";
            this.ctx.fillStyle = btnColor;
            this.ctx.font = "bold 13px sans-serif";
            this.ctx.fillText(btnText, btnX + 65, itemY + 44);
            this.ctx.textAlign = "left"; // Reset positioning vector orientation constraints parameter alignment settings safely
        });
    }

    renderBackgroundsSubTabList(padX, padY, sw, sh) {
        const keys = Object.keys(BACKGROUND_CONFIGS);
        const startIdx = this.shopScrollOffset * 3;
        const targetKeys = keys.slice(startIdx, Math.min(keys.length, startIdx + 3));

        if (targetKeys.length === 0 && this.shopScrollOffset > 0) {
            this.shopScrollOffset = 0;
            return;
        }

        targetKeys.forEach((key, idx) => {
            const spec = BACKGROUND_CONFIGS[key];
            const itemY = padY + 160 + idx * 95;

            this.ctx.fillStyle = "rgba(255,255,255,0.02)";
            this.ctx.strokeStyle = "#222222";
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.roundRect(padX + 30, itemY, sw - 60, 80, 8);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "bold 18px sans-serif";
            this.ctx.fillText(spec.name, padX + 50, itemY + 35);

            this.ctx.fillStyle = "#aaaaaa";
            this.ctx.font = "13px sans-serif";
            this.ctx.fillText(`Environment Space Backdrop Skin Asset Key ID Profile Mapping Tag: ${spec.assetKey}`, padX + 50, itemY + 60);

            const isUnlocked = this.profile.unlockedBackgrounds.includes(key);
            const isEquipped = this.profile.equippedBackground === key;

            let btnText = "";
            let btnColor = "";
            if (isEquipped) { btnText = "EQUIPPED"; btnColor = "#00ff66"; }
            else if (isUnlocked) { btnText = "SELECT"; btnColor = "#00e5ff"; }
            else { btnText = `${spec.cost} C`; btnColor = "#ffeb3b"; }

            const btnX = padX + sw - 170;
            this.ctx.fillStyle = "rgba(0,0,0,0.4)";
            this.ctx.strokeStyle = btnColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(btnX, itemY + 20, 130, 40, 6);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.textAlign = "center";
            this.ctx.fillStyle = btnColor;
            this.ctx.font = "bold 13px sans-serif";
            this.ctx.fillText(btnText, btnX + 65, itemY + 44);
            this.ctx.textAlign = "left";
        });
    }

    renderAchievementsSubTabList(padX, padY, sw, sh) {
        const data = this.achievements.getProgressData();
        const startIdx = this.achievScrollOffset * 3;
        const targetList = data.list.slice(startIdx, Math.min(data.list.length, startIdx + 3));

        if (targetList.length === 0 && this.achievScrollOffset > 0) {
            this.achievScrollOffset = 0;
            return;
        }

        // Sub-header displaying master status indicators metrics summaries metrics allocations fields maps properties
        this.ctx.fillStyle = "#888888";
        this.ctx.font = "14px sans-serif";
        this.ctx.fillText(`MEDALS PROFILE PROGRESS SUMMARY CAPTURES STATE: ${data.unlockedCount} / ${data.total} UNLOCKED`, padX + 35, padY + 150);

        targetList.forEach((ach, idx) => {
            const itemY = padY + 172 + idx * 92;

            this.ctx.fillStyle = ach.unlocked ? "rgba(0,255,102,0.03)" : "rgba(255,255,255,0.01)";
            this.ctx.strokeStyle = ach.unlocked ? "rgba(0,255,102,0.2)" : "#222222";
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.roundRect(padX + 30, itemY, sw - 60, 78, 8);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = ach.unlocked ? "#00ff66" : "#ffffff";
            this.ctx.font = "bold 16px sans-serif";
            this.ctx.fillText(`${ach.unlocked ? "🏆 " : "🔒 "}${ach.name}`, padX + 45, itemY + 30);

            this.ctx.fillStyle = "#999999";
            this.ctx.font = "13px sans-serif";
            this.ctx.fillText(ach.description, padX + 45, itemY + 55);

            this.ctx.textAlign = "right";
            this.ctx.fillStyle = ach.unlocked ? "#00ff66" : "#ffeb3b";
            this.ctx.font = "bold 13px sans-serif";
            this.ctx.fillText(ach.unlocked ? "SECURED" : `+${ach.reward} COINS`, padX + sw - 55, itemY + 44);
            this.ctx.textAlign = "left";
        });
    }
}

// ============================================================================
// 14. AUTO-INITIALIZATION BOOTSTRAPPING CODES SYSTEM CALL ACTION
// ============================================================================

window.addEventListener("DOMContentLoaded", () => {
    // Generate functional engine layout instances pointing to structural body canvas identification markers values names properties
    window.AppEngineInstance = new GameEngine("gameCanvas");
});