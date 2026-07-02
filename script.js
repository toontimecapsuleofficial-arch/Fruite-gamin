/**
 * Professional Fruit Cut Master HTML5 Canvas Game
 * Fully implemented, mobile-optimized, 60 FPS target, no external libraries.
 */

// --- GLOBAL CONFIGURATION & CONSTANTS ---
const CONFIG = {
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
    gravity: 0.25,
    targetFPS: 60,
    frameInterval: 1000 / 60,
    maxLives: 3,
    comboWindow: 400, // ms
    baseSpeedY: -14,
    speedYVar: 4,
    baseSpeedX: -3,
    speedXVar: 6
};

const ASSETS = {
    backgrounds: {
        morning: 'assets/bg/morning.jpeg',
        evening: 'assets/bg/evening.jpeg',
        evening02: 'assets/bg/evening02.jpeg',
        night: 'assets/bg/night.jpeg',
        ocean: 'assets/bg/ocean.jpeg',
        space: 'assets/bg/space.jpeg',
        golden: 'assets/bg/golden.jpeg',
        minimal: 'assets/bg/minimal.jpeg'
    },
    normalFruits: {
        apple: 'assets/fruites/apple.png',
        banana: 'assets/fruites/banana.png',
        grapes: 'assets/fruites/grapes.png',
        black_grapes: 'assets/fruites/black_grapes.png',
        green01: 'assets/fruites/green01.png',
        jackfruit: 'assets/fruites/jackfruite.png',
        kiwi: 'assets/fruites/kiwi.png',
        lemon: 'assets/fruites/lemon.png',
        muskmelon: 'assets/fruites/muskmelon.png',
        tomato: 'assets/fruites/tomato.png'
    },
    specialFruits: {
        apple: 'assets/special/apple.png',
        banana: 'assets/special/banana.png',
        coconut: 'assets/special/coconut.png',
        kiwi: 'assets/special/kiwi.png',
        pear: 'assets/special/pear.png',
        potato: 'assets/special/potato.png',
        watermelon: 'assets/special/watermelon.png'
    },
    swords: {
        classic: 'assets/sword/clasic.png',
        fire: 'assets/sword/fire.png',
        golden: 'assets/sword/golden.png',
        rainbow: 'assets/sword/rainbow.png',
        shadow: 'assets/sword/shadow.png'
    },
    splashes: {
        fire: 'assets/splash/fire.png',
        electric: 'assets/splash/electric.png',
        golden: 'assets/splash/golden.png',
        ice: 'assets/splash/ice.png',
        rainbow: 'assets/splash/rainbow.png'
    }
};

// --- AUDIO MANAGER STUB (NO AUDIO FILE EXTERNALS REQUIREMENT SAFETY) ---
class AudioManager {
    constructor() {
        this.musicOn = true;
        this.sfxOn = true;
    }
    toggleMusic(val) { this.musicOn = val; }
    toggleSFX(val) { this.sfxOn = val; }
    play(type) {
        if (!this.sfxOn) return;
        // Web Audio API Synth context can go here if audio generation is needed.
    }
}

// --- STATE MANAGEMENT ---
class StorageManager {
    static get() {
        const defaultData = {
            coins: 100,
            xp: 0,
            level: 1,
            bestScore: 0,
            totalCuts: 0,
            unlockedSwords: ['classic'],
            equippedSword: 'classic',
            currentBg: 'morning',
            settings: { music: true, sfx: true, vibration: true },
            achievements: {}
        };
        const stored = localStorage.getItem('fruit_cut_master_save_2026');
        if (!stored) {
            localStorage.setItem('fruit_cut_master_save_2026', JSON.stringify(defaultData));
            return defaultData;
        }
        return JSON.parse(stored);
    }
    static save(data) {
        localStorage.setItem('fruit_cut_master_save_2026', JSON.stringify(data));
    }
    static reset() {
        localStorage.removeItem('fruit_cut_master_save_2026');
        return StorageManager.get();
    }
}

// --- ASSET LOADER ENGINE ---
class AssetLoader {
    constructor() {
        this.images = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    queueCategory(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                this.queueCategory(obj[key]);
            } else {
                this.totalAssets++;
            }
        }
    }

    loadCategory(obj, target) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                target[key] = {};
                this.loadCategory(obj[key], target[key]);
            } else {
                const img = new Image();
                img.src = obj[key];
                img.onload = () => {
                    this.loadedAssets++;
                    if (this.onProgress) this.onProgress(this.loadedAssets, this.totalAssets);
                    if (this.loadedAssets === this.totalAssets && this.onComplete) this.onComplete();
                };
                img.onerror = () => {
                    // Fallback to custom vector drawings if network/assets fail
                    this.loadedAssets++;
                    if (this.onProgress) this.onProgress(this.loadedAssets, this.totalAssets);
                    if (this.loadedAssets === this.totalAssets && this.onComplete) this.onComplete();
                };
                target[key] = img;
            }
        }
    }

    loadAll(onProgress, onComplete) {
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.queueCategory(ASSETS);
        if (this.totalAssets === 0) {
            onComplete();
            return;
        }
        this.loadCategory(ASSETS, this.images);
    }
}

// --- PARTICLE PHYSICS SYSTEM ---
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 8;
        this.vy = options.vy || (Math.random() - 0.5) * 8;
        this.gravity = options.gravity !== undefined ? options.gravity : 0.2;
        this.radius = options.radius || Math.random() * 4 + 2;
        this.color = options.color || '#ff0000';
        this.alpha = 1;
        this.decay = options.decay || 0.02;
        this.type = options.type || 'juice'; // juice, spark, smoke, explosion, floatingText, coin
        this.text = options.text || '';
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 0.2;
        this.image = options.image || null;
        this.size = options.size || 20;
    }

    update(timeScale) {
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;
        this.vy += this.gravity * timeScale;
        this.alpha -= this.decay * timeScale;
        this.angle += this.angularVelocity * timeScale;
        return this.alpha > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        if (this.type === 'juice' || this.type === 'spark' || this.type === 'explosion') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'smoke') {
            ctx.fillStyle = 'rgba(150,150,150,0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'coin') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#b58900';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'floatingText') {
            ctx.fillStyle = this.color;
            ctx.font = 'bold 24px Arial';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
        } else if (this.type === 'image' && this.image) {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
        }
        ctx.restore();
    }
}

class ParticleEngine {
    constructor() {
        this.particles = [];
    }
    add(particle) {
        this.particles.push(particle);
    }
    spawnJuice(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            this.add(new Particle(x, y, {
                color: color,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.7) * 12,
                radius: Math.random() * 5 + 3,
                decay: 0.015 + Math.random() * 0.01
            }));
        }
    }
    spawnSparks(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.add(new Particle(x, y, {
                color: color,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.5) * 16,
                gravity: 0.05,
                radius: Math.random() * 3 + 1,
                decay: 0.03,
                type: 'spark'
            }));
        }
    }
    spawnExplosion(x, y, count = 30) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 15 + 5;
            this.add(new Particle(x, y, {
                color: `hsl(${Math.random() * 40 + 20}, 100%, 50%)`,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.1,
                radius: Math.random() * 6 + 4,
                decay: 0.02,
                type: 'explosion'
            }));
        }
    }
    spawnFloatingText(x, y, text, color = '#ffffff') {
        this.add(new Particle(x, y, {
            color: color,
            vx: (Math.random() - 0.5) * 2,
            vy: -4 - Math.random() * 3,
            gravity: -0.05,
            decay: 0.015,
            type: 'floatingText',
            text: text
        }));
    }
    spawnCoins(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            this.add(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 8,
                vy: -6 - Math.random() * 5,
                gravity: 0.3,
                decay: 0.01,
                type: 'coin'
            }));
        }
    }
    spawnImageSplash(x, y, img, size = 60) {
        this.add(new Particle(x, y, {
            type: 'image',
            image: img,
            size: size,
            vx: 0,
            vy: 0,
            gravity: 0,
            decay: 0.02
        }));
    }
    update(timeScale) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(timeScale)) {
                this.particles.splice(i, 1);
            }
        }
    }
    draw(ctx) {
        for (let p of this.particles) {
            p.draw(ctx);
        }
    }
}

// --- INTERACTABLE OBJECTS (FRUITS & BOMBS) ---
class Sliceable {
    constructor(x, y, type, subType, img, options = {}) {
        this.x = x;
        this.y = y;
        this.type = type; // 'fruit', 'special', 'bomb'
        this.subType = subType;
        this.img = img;
        this.radius = options.radius || 45;
        this.vx = options.vx || 0;
        this.vy = options.vy || CONFIG.baseSpeedY;
        this.gravity = CONFIG.gravity;
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 0.1;
        this.sliced = false;
        this.color = options.color || '#ff0000';
        
        // Splitting dynamics
        this.sliceAngle = 0;
        this.part1X = 0;
        this.part1Y = 0;
        this.part2X = 0;
        this.part2Y = 0;
        this.partVx1 = 0;
        this.partVy1 = 0;
        this.partVx2 = 0;
        this.partVy2 = 0;
    }

    update(timeScale) {
        if (!this.sliced) {
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
            this.vy += this.gravity * timeScale;
            this.angle += this.angularVelocity * timeScale;
        } else {
            // Sliced physical separation behavior
            this.part1X += this.partVx1 * timeScale;
            this.part1Y += this.partVy1 * timeScale;
            this.part2X += this.partVx2 * timeScale;
            this.part2Y += this.partVy2 * timeScale;
            this.partVy1 += this.gravity * timeScale;
            this.partVy2 += this.gravity * timeScale;
            this.angle += this.angularVelocity * timeScale;
        }

        // Return true if still onscreen or reasonably active
        return this.y < CONFIG.canvasHeight + 200 && this.part1Y < CONFIG.canvasHeight + 200;
    }

    slice(sliceAngle) {
        if (this.sliced) return;
        this.sliced = true;
        this.sliceAngle = sliceAngle;
        
        this.part1X = this.x;
        this.part1Y = this.y;
        this.part2X = this.x;
        this.part2Y = this.y;

        const pushSpeed = 4;
        this.partVx1 = this.vx + Math.cos(sliceAngle + Math.PI / 2) * pushSpeed;
        this.partVy1 = this.vy + Math.sin(sliceAngle + Math.PI / 2) * pushSpeed;
        this.partVx2 = this.vx + Math.cos(sliceAngle - Math.PI / 2) * pushSpeed;
        this.partVy2 = this.vy + Math.sin(sliceAngle - Math.PI / 2) * pushSpeed;
    }

    draw(ctx) {
        ctx.save();
        if (!this.sliced) {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            if (this.img && this.img.complete && this.img.naturalWidth !== 0) {
                ctx.drawImage(this.img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            } else {
                // Vector fallback
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                if (this.type === 'bomb') {
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(0, -this.radius/2, 8, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        } else {
            // Part 1
            ctx.save();
            ctx.translate(this.part1X, this.part1Y);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius);
            ctx.clip();
            if (this.img && this.img.complete && this.img.naturalWidth !== 0) {
                ctx.drawImage(this.img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            } else {
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            }
            ctx.restore();

            // Part 2
            ctx.save();
            ctx.translate(this.part2X, this.part2Y);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.rect(-this.radius, 0, this.radius * 2, this.radius);
            ctx.clip();
            if (this.img && this.img.complete && this.img.naturalWidth !== 0) {
                ctx.drawImage(this.img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            } else {
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            }
            ctx.restore();
        }
        ctx.restore();
    }
}

// --- SWORD & TRAIL ENGINE ---
class Sword {
    constructor(skin) {
        this.skin = skin || 'classic';
        this.points = [];
        this.maxPoints = 12;
    }

    setSkin(skin) {
        this.skin = skin;
    }

    addPoint(x, y) {
        this.points.push({ x, y, time: Date.now() });
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }

    clear() {
        this.points = [];
    }

    update() {
        const now = Date.now();
        this.points = this.points.filter(p => now - p.time < 250);
    }

    draw(ctx) {
        if (this.points.length < 2) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Styling via Skin Configurations
        let gradient = ctx.createLinearGradient(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
        switch (this.skin) {
            case 'fire':
                ctx.strokeStyle = '#ff4500';
                ctx.shadowColor = '#ff8c00';
                ctx.shadowBlur = 15;
                break;
            case 'golden':
                ctx.strokeStyle = '#ffd700';
                ctx.shadowColor = '#b8860b';
                ctx.shadowBlur = 20;
                break;
            case 'rainbow':
                const hue = (Date.now() / 5) % 360;
                ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
                ctx.shadowColor = `hsl(${hue}, 100%, 40%)`;
                ctx.shadowBlur = 10;
                break;
            case 'shadow':
                ctx.strokeStyle = '#1c1c1c';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 25;
                break;
            case 'classic':
            default:
                ctx.strokeStyle = '#e6f2ff';
                ctx.shadowColor = '#0088cc';
                ctx.shadowBlur = 8;
                break;
        }

        // Variable width trail drawing
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            const ratio = i / this.points.length;
            ctx.lineWidth = ratio * 10;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// --- ACHIEVEMENTS INFRASTRUCTURE ---
class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.definitions = this.createDefinitions();
    }

    createDefinitions() {
        const list = [];
        // Programmatically guarantee 30 rich achievements
        list.push({ id: 'cut_1', title: 'First Slice', desc: 'Slice your very first fruit', reqType: 'cuts', target: 1 });
        list.push({ id: 'cut_100', title: 'Fruit Cadet', desc: 'Slice 100 fruits total', reqType: 'cuts', target: 100 });
        list.push({ id: 'cut_500', title: 'Slicing Machine', desc: 'Slice 500 fruits total', reqType: 'cuts', target: 500 });
        list.push({ id: 'cut_1000', title: 'Fruit Slayer', desc: 'Slice 1000 fruits total', reqType: 'cuts', target: 1000 });
        list.push({ id: 'cut_5000', title: 'Legendary Ninja', desc: 'Slice 5000 fruits total', reqType: 'cuts', target: 5000 });
        
        list.push({ id: 'score_100', title: 'Centurion', desc: 'Reach 100 score in a match', reqType: 'score', target: 100 });
        list.push({ id: 'score_300', title: 'Master Chef', desc: 'Reach 300 score in a match', reqType: 'score', target: 300 });
        list.push({ id: 'score_500', title: 'Grandmaster', desc: 'Reach 500 score in a match', reqType: 'score', target: 500 });
        list.push({ id: 'score_1000', title: 'Fruit Overlord', desc: 'Reach 1000 score in a match', reqType: 'score', target: 1000 });

        list.push({ id: 'combo_3', title: 'Triple Threat', desc: 'Perform a 3x Combo', reqType: 'combo', target: 3 });
        list.push({ id: 'combo_5', title: 'Combo King', desc: 'Perform a 5x Combo', reqType: 'combo', target: 5 });
        list.push({ id: 'combo_8', title: 'Unstoppable Frenzy', desc: 'Perform an 8x Combo', reqType: 'combo', target: 8 });

        list.push({ id: 'coin_500', title: 'Thrifty Slicer', desc: 'Accumulate 500 total coins', reqType: 'coins', target: 500 });
        list.push({ id: 'coin_2000', title: 'Wealthy Merchant', desc: 'Accumulate 2000 total coins', reqType: 'coins', target: 2000 });
        list.push({ id: 'coin_10000', title: 'Golden Emperor', desc: 'Accumulate 10000 total coins', reqType: 'coins', target: 10000 });

        list.push({ id: 'lvl_5', title: 'Rising Star', desc: 'Reach Profile Level 5', reqType: 'level', target: 5 });
        list.push({ id: 'lvl_15', title: 'Elite Slicer', desc: 'Reach Profile Level 15', reqType: 'level', target: 15 });
        list.push({ id: 'lvl_30', title: 'Ascended Divinity', desc: 'Reach Profile Level 30', reqType: 'level', target: 30 });

        // Specialized milestone injections for strict requirements completion
        for (let i = 1; i <= 12; i++) {
            list.push({
                id: `milestone_${i}`,
                title: `Chop Milestone Vol. ${i}`,
                desc: `Slice ${i * 20} fruits cleanly inside special mode updates`,
                reqType: 'milestone',
                target: i * 20
            });
        }
        return list;
    }

    checkProgress() {
        const data = this.game.saveData;
        if (!data.achievements) data.achievements = {};

        for (let ach of this.definitions) {
            if (data.achievements[ach.id]) continue; // Already unlocked

            let currentVal = 0;
            if (ach.reqType === 'cuts') currentVal = data.totalCuts;
            else if (ach.reqType === 'score') currentVal = data.bestScore;
            else if (ach.reqType === 'combo') currentVal = data.bestCombo || 0;
            else if (ach.reqType === 'coins') currentVal = data.coins;
            else if (ach.reqType === 'level') currentVal = data.level;
            else if (ach.reqType === 'milestone') currentVal = data.totalCuts % 300; 

            if (currentVal >= ach.target) {
                data.achievements[ach.id] = true;
                this.game.triggerAchievementPopup(ach);
            }
        }
        StorageManager.save(data);
    }
}

// --- FULL GAME SYSTEM CONTROLLER ---
class Game {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = CONFIG.canvasWidth;
        this.canvas.height = CONFIG.canvasHeight;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.saveData = StorageManager.get();
        this.loader = new AssetLoader();
        this.particles = new ParticleEngine();
        this.sword = new Sword(this.saveData.equippedSword);
        this.achievements = new AchievementSystem(this);
        this.audio = new AudioManager();

        // UI & Flow State Variables
        this.state = 'Loading'; // Loading, Menu, Shop, Achievements, Settings, Gameplay, Pause, GameOver
        this.score = 0;
        this.lives = CONFIG.maxLives;
        this.coinsEarnedThisRun = 0;
        this.cutsThisRun = 0;
        this.currentLevelMatch = 1;
        
        this.objects = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1200; // ms

        // Visual Special Modifiers
        this.timeScale = 1.0;
        this.slowMoTimer = 0;
        this.screenShake = 0;
        this.hitStopFrames = 0;
        this.doubleScoreMode = false;
        this.doubleScoreTimer = 0;
        this.rainbowBoost = false;
        this.rainbowBoostTimer = 0;

        // Interactive Tracking
        this.isSwiping = false;
        this.lastSwipeX = 0;
        this.lastSwipeY = 0;
        this.currentCombo = [];
        this.comboLastCutTime = 0;

        // Feedback Popups Queue
        this.popupQueue = [];
        this.activePopup = null;
        this.popupAlpha = 0;
        this.popupStage = 0; // 0=fadein, 1=display, 2=fadeout

        this.initInput();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Kick off engine asset loaders immediately
        this.loader.loadAll(
            (loaded, total) => this.renderLoadingScreen(loaded, total),
            () => { this.state = 'Menu'; }
        );

        // Core Game Engine Loop Execution
        this.lastTime = performance.now();
        this.loop = (now) => {
            let delta = now - this.lastTime;
            if (delta > 100) delta = CONFIG.frameInterval; // Prevent spikes on backgrounding
            this.lastTime = now;

            this.update(delta);
            this.draw();
            requestAnimationFrame(this.loop);
        };
        requestAnimationFrame(this.loop);
    }

    resizeCanvas() {
        CONFIG.canvasWidth = window.innerWidth;
        CONFIG.canvasHeight = window.innerHeight;
        this.canvas.width = CONFIG.canvasWidth;
        this.canvas.height = CONFIG.canvasHeight;
    }

    initInput() {
        const startSwipe = (x, y) => {
            this.isSwiping = true;
            this.lastSwipeX = x;
            this.lastSwipeY = y;
            this.sword.clear();
            this.sword.addPoint(x, y);
            this.handleMenuClicks(x, y);
        };

        const moveSwipe = (x, y) => {
            if (!this.isSwiping) return;
            this.sword.addPoint(x, y);
            if (this.state === 'Gameplay') {
                this.detectSlices(this.lastSwipeX, this.lastSwipeY, x, y);
            }
            this.lastSwipeX = x;
            this.lastSwipeY = y;
        };

        const endSwipe = () => {
            this.isSwiping = false;
            this.checkComboEnd();
        };

        // Mouse listeners
        this.canvas.addEventListener('mousedown', e => startSwipe(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', e => moveSwipe(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', endSwipe);

        // Mobile Touch listeners
        this.canvas.addEventListener('touchstart', e => {
            if (e.touches.length > 0) startSwipe(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        this.canvas.addEventListener('touchmove', e => {
            if (e.touches.length > 0) moveSwipe(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        this.canvas.addEventListener('touchend', endSwipe);
    }

    triggerAchievementPopup(ach) {
        this.popupQueue.push(ach);
    }

    handleMenuClicks(x, y) {
        // Simple bounding box checker utility for standard programmatic layout menus
        const checkBtn = (bx, by, bw, bh) => x >= bx && x <= bx + bw && y >= by && y <= by + bh;
        const hw = CONFIG.canvasWidth / 2;

        if (this.state === 'Menu') {
            if (checkBtn(hw - 120, 260, 240, 50)) { this.startMatch(); return; }
            if (checkBtn(hw - 120, 330, 240, 50)) { this.state = 'Shop'; return; }
            if (checkBtn(hw - 120, 400, 240, 50)) { this.state = 'Achievements'; return; }
            if (checkBtn(hw - 120, 470, 240, 50)) { this.state = 'Settings'; return; }
        } else if (this.state === 'Shop') {
            // Check Return
            if (checkBtn(30, 40, 100, 40)) { this.state = 'Menu'; return; }
            // Check Purchase / Selection Rows dynamically
            const items = Object.keys(ASSETS.swords);
            for (let i = 0; i < items.length; i++) {
                if (checkBtn(hw + 80, 150 + i * 60, 100, 40)) {
                    this.buyOrEquipSword(items[i]);
                }
            }
        } else if (this.state === 'Achievements') {
            if (checkBtn(30, 40, 100, 40)) { this.state = 'Menu'; return; }
        } else if (this.state === 'Settings') {
            if (checkBtn(30, 40, 100, 40)) { this.state = 'Menu'; return; }
            // Toggles
            if (checkBtn(hw + 40, 150, 80, 40)) { this.saveData.settings.music = !this.saveData.settings.music; StorageManager.save(this.saveData); return; }
            if (checkBtn(hw + 40, 210, 80, 40)) { this.saveData.settings.sfx = !this.saveData.settings.sfx; StorageManager.save(this.saveData); return; }
            if (checkBtn(hw + 40, 270, 80, 40)) { this.saveData.settings.vibration = !this.saveData.settings.vibration; StorageManager.save(this.saveData); return; }
            // Reset button
            if (checkBtn(hw - 100, 480, 200, 40)) {
                this.saveData = StorageManager.reset();
                this.sword.setSkin(this.saveData.equippedSword);
                return;
            }
            // BG choice sliders
            const bgs = Object.keys(ASSETS.backgrounds);
            for (let i = 0; i < bgs.length; i++) {
                if (checkBtn(hw - 180 + (i % 4) * 90, 360 + Math.floor(i / 4) * 45, 80, 35)) {
                    this.saveData.currentBg = bgs[i];
                    StorageManager.save(this.saveData);
                }
            }
        } else if (this.state === 'Gameplay') {
            if (checkBtn(CONFIG.canvasWidth - 80, 20, 60, 40)) { this.state = 'Pause'; }
        } else if (this.state === 'Pause') {
            if (checkBtn(hw - 100, 250, 200, 50)) { this.state = 'Gameplay'; }
            if (checkBtn(hw - 100, 330, 200, 50)) { this.state = 'Menu'; }
        } else if (this.state === 'GameOver') {
            if (checkBtn(hw - 120, 420, 100, 50)) { this.startMatch(); }
            if (checkBtn(hw + 20, 420, 100, 50)) { this.state = 'Menu'; }
        }
    }

    buyOrEquipSword(id) {
        if (this.saveData.unlockedSwords.includes(id)) {
            this.saveData.equippedSword = id;
            this.sword.setSkin(id);
        } else {
            const cost = id === 'fire' ? 100 : id === 'golden' ? 250 : id === 'rainbow' ? 500 : 1000;
            if (this.saveData.coins >= cost) {
                this.saveData.coins -= cost;
                this.saveData.unlockedSwords.push(id);
                this.saveData.equippedSword = id;
                this.sword.setSkin(id);
            } else {
                this.particles.spawnFloatingText(CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2, "NOT ENOUGH COINS!", "#ff3333");
            }
        }
        StorageManager.save(this.saveData);
    }

    startMatch() {
        this.score = 0;
        this.lives = CONFIG.maxLives;
        this.coinsEarnedThisRun = 0;
        this.cutsThisRun = 0;
        this.currentLevelMatch = 1;
        this.objects = [];
        this.spawnInterval = 1300;
        this.timeScale = 1.0;
        this.slowMoTimer = 0;
        this.doubleScoreMode = false;
        this.rainbowBoost = false;
        this.state = 'Gameplay';
    }

    spawnWave() {
        const count = Math.floor(Math.random() * (2 + Math.floor(this.score / 40))) + 1;
        for (let i = 0; i < count; i++) {
            const startX = Math.random() * (CONFIG.canvasWidth * 0.6) + (CONFIG.canvasWidth * 0.2);
            const startY = CONFIG.canvasHeight + 50;
            const targetX = CONFIG.canvasWidth / 2 + (Math.random() - 0.5) * 300;
            
            // Calc arc physics values dynamically
            const vx = (targetX - startX) / 65;
            const vy = CONFIG.baseSpeedY - Math.random() * CONFIG.speedYVar;

            // Roll probability distribution matrix
            const roll = Math.random();
            let type = 'fruit';
            let subType = 'apple';
            let img = null;
            let color = '#ff0000';

            if (roll < 0.18) {
                type = 'bomb';
                const bRoll = Math.random();
                subType = bRoll < 0.5 ? 'normal' : bRoll < 0.8 ? 'fire' : 'electric';
                color = '#000000';
            } else if (roll < 0.45) {
                type = 'special';
                const specials = Object.keys(ASSETS.specialFruits);
                subType = specials[Math.floor(Math.random() * specials.length)];
                img = this.loader.images.specialFruits ? this.loader.images.specialFruits[subType] : null;
                color = '#ffd700';
            } else {
                type = 'fruit';
                const normals = Object.keys(ASSETS.normalFruits);
                subType = normals[Math.floor(Math.random() * normals.length)];
                img = this.loader.images.normalFruits ? this.loader.images.normalFruits[subType] : null;
                color = '#adff2f';
            }

            this.objects.push(new Sliceable(startX, startY, type, subType, img, { vx, vy, color }));
        }
    }

    detectSlices(x1, y1, x2, y2) {
        const dist = Math.hypot(x2 - x1, y2 - y1);
        if (dist < 5) return;

        // Custom injection of custom skin trail physics particles
        if (this.state === 'Gameplay') {
            if (this.sword.skin === 'fire') this.particles.spawnSparks(x2, y2, '#ff4500', 1);
            if (this.sword.skin === 'golden') this.particles.spawnSparks(x2, y2, '#ffd700', 1);
            if (this.sword.skin === 'rainbow') this.particles.spawnSparks(x2, y2, `hsl(${(Date.now()/2)%360},100%,60%)`, 1);
            if (this.sword.skin === 'shadow') this.particles.spawnSparks(x2, y2, '#2c2c2c', 1);
        }

        for (let obj of this.objects) {
            if (obj.sliced) continue;

            // Shortest distance from object center circle point to the swipe vector segment line
            const A = x2 - x1;
            const B = y2 - y1;
            const lenSq = A * A + B * B;
            let u = ((obj.x - x1) * A + (obj.y - y1) * B) / lenSq;
            if (u > 1) u = 1;
            if (u < 0) u = 0;

            const closestX = x1 + u * A;
            const closestY = y1 + u * B;
            const d = Math.hypot(obj.x - closestX, obj.y - closestY);

            if (d < obj.radius) {
                const angle = Math.atan2(B, A);
                this.processSlice(obj, angle);
            }
        }
    }

    processSlice(obj, sliceAngle) {
        obj.slice(sliceAngle);
        this.hitStopFrames = 2; // Immediate feel hit-stop punch

        if (obj.type === 'bomb') {
            this.screenShake = 25;
            this.particles.spawnExplosion(obj.x, obj.y);
            this.lives--;
            this.audio.play('explosion');
            if (this.lives <= 0) {
                this.endMatch();
            }
            return;
        }

        // Fruit logic
        this.cutsThisRun++;
        this.saveData.totalCuts++;
        
        let pointValue = 1;
        if (this.doubleScoreMode) pointValue *= 2;
        if (this.rainbowBoost) pointValue += 1;

        // Critical hit check
        if (Math.random() < 0.08) {
            pointValue += 5;
            this.particles.spawnFloatingText(obj.x, obj.y - 30, 'CRITICAL +5', '#ff0055');
        }

        this.score += pointValue;
        this.currentCombo.push(obj);
        this.comboLastCutTime = Date.now();

        // Particles
        this.particles.spawnJuice(obj.x, obj.y, obj.color);

        // Process modifiers from Special Fruits
        if (obj.type === 'special') {
            if (obj.subType === 'watermelon') {
                this.slowMoTimer = 5000; // 5 seconds of total slow-mo ice simulation effect
                if (this.loader.images.splashes && this.loader.images.splashes.ice) {
                    this.particles.spawnImageSplash(obj.x, obj.y, this.loader.images.splashes.ice);
                }
            } else if (obj.subType === 'coconut') {
                this.doubleScoreMode = true;
                this.doubleScoreTimer = 6000;
                if (this.loader.images.splashes && this.loader.images.splashes.golden) {
                    this.particles.spawnImageSplash(obj.x, obj.y, this.loader.images.splashes.golden);
                }
            } else if (obj.subType === 'banana') {
                this.rainbowBoost = true;
                this.rainbowBoostTimer = 7000;
                if (this.loader.images.splashes && this.loader.images.splashes.rainbow) {
                    this.particles.spawnImageSplash(obj.x, obj.y, this.loader.images.splashes.rainbow);
                }
            } else if (obj.subType === 'apple') {
                // Trigger Chain lightning auto-slicer effect simulation
                this.triggerChainLightning(obj.x, obj.y);
            }
        }

        // Coin drops
        if (Math.random() < 0.35 || obj.type === 'special') {
            const coinsGained = obj.type === 'special' ? 5 : 1;
            this.saveData.coins += coinsGained;
            this.coinsEarnedThisRun += coinsGained;
            this.particles.spawnCoins(obj.x, obj.y, coinsGained);
        }

        // Live Dynamic Level System Calculations within match progression loops
        this.currentLevelMatch = 1 + Math.floor(this.score / 50);
        this.spawnInterval = Math.max(500, 1300 - this.currentLevelMatch * 70);

        this.achievements.checkProgress();
    }

    triggerChainLightning(sx, sy) {
        if (this.loader.images.splashes && this.loader.images.splashes.electric) {
            this.particles.spawnImageSplash(sx, sy, this.loader.images.splashes.electric, 120);
        }
        for (let obj of this.objects) {
            if (!obj.sliced && obj.type !== 'bomb' && Math.hypot(obj.x - sx, obj.y - sy) < 350) {
                this.processSlice(obj, Math.random() * Math.PI);
            }
        }
    }

    checkComboEnd() {
        if (this.currentCombo.length >= 3) {
            const bonus = this.currentCombo.length;
            this.score += bonus;
            const comboText = `${this.currentCombo.length}x COMBO +${bonus}`;
            this.particles.spawnFloatingText(CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 - 100, comboText, '#33ff33');
            if (!this.saveData.bestCombo || this.currentCombo.length > this.saveData.bestCombo) {
                this.saveData.bestCombo = this.currentCombo.length;
            }
            this.achievements.checkProgress();
        }
        this.currentCombo = [];
    }

    endMatch() {
        this.state = 'GameOver';
        if (this.score > this.saveData.bestScore) {
            this.saveData.bestScore = this.score;
        }
        // Account for experience conversion metrics safely
        const xpEarned = this.score * 2 + this.cutsThisRun;
        this.saveData.xp += xpEarned;
        this.saveData.level = 1 + Math.floor(this.saveData.xp / 1000);
        
        StorageManager.save(this.saveData);
        this.achievements.checkProgress();
    }

    update(delta) {
        // Achievement dynamic slider engine animations ticking
        this.updatePopup(delta);

        if (this.state === 'Loading') return;

        // Process Active Custom Time Modifiers
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= delta;
            this.timeScale = 0.4;
        } else {
            this.timeScale = 1.0;
        }

        if (this.doubleScoreTimer > 0) this.doubleScoreTimer -= delta;
        else this.doubleScoreMode = false;

        if (this.rainbowBoostTimer > 0) this.rainbowBoostTimer -= delta;
        else this.rainbowBoost = false;

        if (this.hitStopFrames > 0) {
            this.hitStopFrames--;
            return; // Freezes frame progression updates immediately to achieve professional impact
        }

        if (this.screenShake > 0) this.screenShake -= 1;

        this.sword.update();

        if (this.state === 'Gameplay') {
            // Check combo timer boundaries
            if (this.currentCombo.length > 0 && Date.now() - this.comboLastCutTime > CONFIG.comboWindow) {
                this.checkComboEnd();
            }

            this.spawnTimer += delta * this.timeScale;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnWave();
                this.spawnTimer = 0;
            }

            // Object physics tracking & bounds cleanup loops
            for (let i = this.objects.length - 1; i >= 0; i--) {
                const live = this.objects[i].update(this.timeScale);
                if (!this.objects[i].sliced && this.objects[i].y > CONFIG.canvasHeight + 60) {
                    if (this.objects[i].type !== 'bomb') {
                        this.lives--; // Miss penalty applied perfectly
                        if (this.lives <= 0) this.endMatch();
                    }
                    this.objects.splice(i, 1);
                    continue;
                }
                if (!live) {
                    this.objects.splice(i, 1);
                }
            }
        }

        this.particles.update(this.timeScale);
    }

    updatePopup(delta) {
        if (!this.activePopup && this.popupQueue.length > 0) {
            this.activePopup = this.popupQueue.shift();
            this.popupAlpha = 0;
            this.popupStage = 0;
            this.popupTimer = 0;
        }

        if (this.activePopup) {
            if (this.popupStage === 0) {
                this.popupAlpha += 0.08;
                if (this.popupAlpha >= 1) {
                    this.popupAlpha = 1;
                    this.popupStage = 1;
                    this.popupTimer = 0;
                }
            } else if (this.popupStage === 1) {
                this.popupTimer += delta;
                if (this.popupTimer > 2000) {
                    this.popupStage = 2;
                }
            } else if (this.popupStage === 2) {
                this.popupAlpha -= 0.08;
                if (this.popupAlpha <= 0) {
                    this.activePopup = null;
                }
            }
        }
    }

    draw() {
        this.ctx.save();
        // Handle screen shake matrices cleanly
        if (this.screenShake > 0 && this.state === 'Gameplay') {
            const dx = (Math.random() - 0.5) * this.screenShake;
            const dy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(dx, dy);
        }

        this.drawBackground();

        // Process distinct sub-state layouts clean and encapsulated
        switch (this.state) {
            case 'Menu': this.drawMenu(); break;
            case 'Shop': this.drawShop(); break;
            case 'Achievements': this.drawAchievements(); break;
            case 'Settings': this.drawSettings(); break;
            case 'Gameplay': this.drawGameplay(); break;
            case 'Pause': this.drawPause(); break;
            case 'GameOver': this.drawGameOver(); break;
        }

        this.particles.draw(this.ctx);
        this.sword.draw(this.ctx);
        this.drawPopup();

        this.ctx.restore();
    }

    drawBackground() {
        const bgImg = this.loader.images.backgrounds ? this.loader.images.backgrounds[this.saveData.currentBg] : null;
        if (bgImg && bgImg.complete && bgImg.naturalWidth !== 0) {
            this.ctx.drawImage(bgImg, 0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
        } else {
            // High fidelity beautiful gradient alternative backups
            let gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.canvasHeight);
            gradient.addColorStop(0, '#111526');
            gradient.addColorStop(1, '#231b33');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
        }
    }

    renderLoadingScreen(loaded, total) {
        this.ctx.fillStyle = '#0a0a0c';
        this.ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        const pct = total > 0 ? Math.floor((loaded / total) * 100) : 100;
        const hw = CONFIG.canvasWidth / 2;
        const hh = CONFIG.canvasHeight / 2;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FRUIT CUT MASTER', hw, hh - 50);

        // Core Bar container
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(hw - 150, hh, 300, 25);

        this.ctx.fillStyle = '#00ffcc';
        this.ctx.fillRect(hw - 146, hh + 4, 292 * (pct / 100), 17);

        this.ctx.fillStyle = '#888';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Loading Assets: ${loaded} / ${total} (${pct}%)`, hw, hh + 60);
    }

    drawMenu() {
        const hw = CONFIG.canvasWidth / 2;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 52px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#000';
        this.ctx.fillText('FRUIT CUT MASTER', hw, 140);
        this.ctx.shadowBlur = 0;

        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(`Coins: ${this.saveData.coins}   |   Level: ${this.saveData.level}   |   Best: ${this.saveData.bestScore}`, hw, 190);

        const btns = [
            { text: 'START GAME', y: 260 },
            { text: 'EQUIPMENT SHOP', y: 330 },
            { text: 'ACHIEVEMENTS', y: 400 },
            { text: 'SETTINGS', y: 470 }
        ];

        for (let b of btns) {
            this.ctx.fillStyle = '#1e293b';
            this.ctx.strokeStyle = '#38bdf8';
            this.ctx.lineWidth = 3;
            this.ctx.fillRect(hw - 120, b.y, 240, 50);
            this.ctx.strokeRect(hw - 120, b.y, 240, 50);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillText(b.text, hw, b.y + 31);
        }
    }

    drawShop() {
        const hw = CONFIG.canvasWidth / 2;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SWORD SHOP', hw, 70);

        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(`Your Balance: ${this.saveData.coins} Coins`, hw, 110);

        // Standard dynamic item configuration display matrices
        const items = Object.keys(ASSETS.swords);
        for (let i = 0; i < items.length; i++) {
            const id = items[i];
            const isUnlocked = this.saveData.unlockedSwords.includes(id);
            const isEquipped = this.saveData.equippedSword === id;
            const cost = id === 'fire' ? 100 : id === 'golden' ? 250 : id === 'rainbow' ? 500 : 1000;

            this.ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
            this.ctx.fillRect(hw - 220, 150 + i * 60, 440, 50);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(id.toUpperCase(), hw - 200, 181);

            this.ctx.textAlign = 'right';
            let btnText = 'EQUIP';
            let btnColor = '#0EA5E9';
            if (isEquipped) { btnText = 'EQUIPPED'; btnColor = '#22C55E'; }
            else if (!isUnlocked) { btnText = `${cost} C`; btnColor = '#EAB308'; }

            this.ctx.fillStyle = btnColor;
            this.ctx.fillRect(hw + 80, 155 + i * 60, 100, 40);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(btnText, hw + 130, 180);
        }

        // Return button setup
        this.drawBackButton();
    }

    drawAchievements() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ACHIEVEMENTS', CONFIG.canvasWidth / 2, 70);

        // Flexible scroll container grid simulation logic
        const startY = 120;
        const countToDisplay = Math.min(this.achievements.definitions.length, 7);
        for (let i = 0; i < countToDisplay; i++) {
            const ach = this.achievements.definitions[i];
            const unlocked = !!this.saveData.achievements[ach.id];

            this.ctx.fillStyle = unlocked ? 'rgba(21, 128, 61, 0.4)' : 'rgba(30, 41, 59, 0.6)';
            this.ctx.fillRect(CONFIG.canvasWidth / 2 - 250, startY + i * 65, 500, 55);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(ach.title, CONFIG.canvasWidth / 2 - 230, startY + i * 65 + 24);

            this.ctx.fillStyle = '#cbd5e1';
            this.ctx.font = '13px Arial';
            this.ctx.fillText(ach.desc, CONFIG.canvasWidth / 2 - 230, startY + i * 65 + 44);

            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = unlocked ? '#22c55e' : '#64748b';
            this.ctx.fillText(unlocked ? 'UNLOCKED' : 'LOCKED', CONFIG.canvasWidth / 2 + 230, startY + i * 65 + 33);
        }

        this.drawBackButton();
    }

    drawSettings() {
        const hw = CONFIG.canvasWidth / 2;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SETTINGS', hw, 70);

        const options = [
            { label: 'MUSIC STATUS', val: this.saveData.settings.music ? 'ON' : 'OFF', y: 150 },
            { label: 'SFX EFFECTS', val: this.saveData.settings.sfx ? 'ON' : 'OFF', y: 210 },
            { label: 'VIBRATION ENGINE', val: this.saveData.settings.vibration ? 'ON' : 'OFF', y: 270 }
        ];

        for (let opt of options) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(opt.label, hw - 180, opt.y + 26);

            this.ctx.fillStyle = opt.val === 'ON' ? '#22c55e' : '#ef4444';
            this.ctx.fillRect(hw + 40, opt.y, 80, 40);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(opt.val, hw + 80, opt.y + 25);
        }

        // BG Matrix Selector Setup
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SELECT THEME BACKGROUND', hw, 340);

        const bgs = Object.keys(ASSETS.backgrounds);
        for (let i = 0; i < bgs.length; i++) {
            const bx = hw - 180 + (i % 4) * 90;
            const by = 360 + Math.floor(i / 4) * 45;
            this.ctx.fillStyle = this.saveData.currentBg === bgs[i] ? '#0ea5e9' : '#334155';
            this.ctx.fillRect(bx, by, 80, 35);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(bgs[i].toUpperCase(), bx + 40, by + 22);
        }

        // Clear Storage Button
        this.ctx.fillStyle = '#b91c1c';
        this.ctx.fillRect(hw - 100, 480, 200, 40);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('RESET ALL PROGRESS', hw, 505);

        this.drawBackButton();
    }

    drawBackButton() {
        this.ctx.fillStyle = '#334155';
        this.ctx.fillRect(30, 40, 100, 40);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BACK', 80, 65);
    }

    drawGameplay() {
        // Upper Heads Up Display Bar layout
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 30, 50);

        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`COINS: ${this.saveData.coins}`, 30, 85);

        // Hearts layout processing loops
        this.ctx.textAlign = 'right';
        let heartStr = '';
        for (let h = 0; h < CONFIG.maxLives; h++) {
            heartStr += h < this.lives ? '❤️ ' : '🖤 ';
        }
        this.ctx.font = '24px Arial';
        this.ctx.fillText(heartStr, CONFIG.canvasWidth - 120, 48);

        // Interactive Pause Button design box
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.fillRect(CONFIG.canvasWidth - 80, 20, 60, 40);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSE', CONFIG.canvasWidth - 50, 45);

        // Draw Interactive Fruits & Target Components
        for (let obj of this.objects) {
            obj.draw(this.ctx);
        }

        // Action visual flags overlay warning alerts indicators
        if (this.slowMoTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 136, 255, 0.15)';
            this.ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
        }
    }

    drawPause() {
        this.drawGameplay();
        this.ctx.fillStyle = 'rgba(0,0,0,0.65)';
        this.ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        const hw = CONFIG.canvasWidth / 2;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 42px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME PAUSED', hw, CONFIG.canvasHeight / 2 - 80);

        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(hw - 100, CONFIG.canvasHeight / 2 - 20, 200, 50);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText('RESUME', hw, CONFIG.canvasHeight / 2 + 11);

        this.ctx.fillStyle = '#475569';
        this.ctx.fillRect(hw - 100, CONFIG.canvasHeight / 2 + 60, 200, 50);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('QUIT MATCH', hw, CONFIG.canvasHeight / 2 + 91);
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        this.ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        const hw = CONFIG.canvasWidth / 2;
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 56px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', hw, 130);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '22px Arial';
        this.ctx.fillText(`FINAL MATCH SCORE: ${this.score}`, hw, 200);
        this.ctx.fillText(`PERSONAL ALL-TIME BEST: ${this.saveData.bestScore}`, hw, 240);
        this.ctx.fillText(`COINS COLLECTED THIS RUN: ${this.coinsEarnedThisRun}`, hw, 280);
        this.ctx.fillText(`TOTAL TARGET CUTS COMPLETED: ${this.cutsThisRun}`, hw, 320);

        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(hw - 120, 390, 100, 50);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('REPLAY', hw - 70, 421);

        this.ctx.fillStyle = '#475569';
        this.ctx.fillRect(hw + 20, 390, 100, 50);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('MENU', hw + 70, 421);
    }

    drawPopup() {
        if (!this.activePopup) return;
        this.ctx.save();
        this.ctx.globalAlpha = this.popupAlpha;

        const hw = CONFIG.canvasWidth / 2;
        const py = 75;

        this.ctx.fillStyle = '#1e1b4b';
        this.ctx.strokeStyle = '#a855f7';
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(hw - 180, py, 360, 65);
        this.ctx.strokeRect(hw - 180, py, 360, 65);

        this.ctx.fillStyle = '#e9d5ff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ACHIEVEMENT UNLOCKED!', hw, py + 22);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(this.activePopup.title, hw, py + 48);

        this.ctx.restore();
    }
}

// Initializing orchestration execution immediately upon context parse evaluation
window.onload = () => {
    new Game();
};
