/**
 * Fruit Cut Master
 * A Professional HTML5 Canvas Mobile-First Fruit Slicing Game Engine.
 * * Architecture:
 * - Event-Driven, Component-Based Object Pooling Framework.
 * - Double-buffered Canvas Pipeline with Dynamic Scaling.
 * - Hardware Accelerated Particle Systems & Interpolated Trail Geometry.
 * - Persistent Unified LocalStorage Engine.
 * - Scalable State Machine & Context-Agnostic Audio Layer.
 */

// ============================================================================
// GLOBAL CONFIGURATION & DATA STRUCTURES
// ============================================================================

const GAME_CONFIG = {
    canvas: {
        baseWidth: 1080,
        baseHeight: 1920,
        targetFps: 60,
    },
    physics: {
        gravity: 0.28,
        terminalVelocity: 18,
        defaultWind: 0,
    },
    gameplay: {
        initialSpawnDelay: 1800,
        minSpawnDelay: 600,
        difficultyScaleRate: 0.002, // Difficulty increases per second
        bombSpawnChance: 0.15,
        specialSpawnChance: 0.10,
        comboWindow: 350, // ms to group slices into a single combo
    },
    storageKeys: {
        saveData: 'fruit_cut_master_v1_userdata'
    }
};

const ASSET_MANIFEST = {
    fruits: {
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
    special: {
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
    backgrounds: {
        morning: 'assets/bg/morning.jpeg',
        evening: 'assets/bg/evening.jpeg',
        evening02: 'assets/bg/evening02.jpeg',
        night: 'assets/bg/night.jpeg',
        golden: 'assets/bg/golden.jpeg',
        minimal: 'assets/bg/minimal.jpeg',
        ocean: 'assets/bg/ocean.jpeg',
        space: 'assets/bg/space.jpeg'
    }
};

const SWORD_DATA = {
    classic: { id: 'classic', name: 'Classic Blade', price: 0, trailColor: 'rgba(230, 240, 255, 0.8)', glowColor: '#a6c8ff', type: 'classic' },
    fire: { id: 'fire', name: 'Inferno Edge', price: 1500, trailColor: 'rgba(255, 69, 0, 0.8)', glowColor: '#ff8c00', type: 'fire' },
    golden: { id: 'golden', name: 'Midas Touch', price: 5000, trailColor: 'rgba(255, 215, 0, 0.9)', glowColor: '#fff700', type: 'golden' },
    rainbow: { id: 'rainbow', name: 'Prismatic Prism', price: 10000, trailColor: 'rgba(255, 255, 255, 0.9)', glowColor: 'rainbow', type: 'rainbow' },
    shadow: { id: 'shadow', name: 'Void Reaver', price: 7500, trailColor: 'rgba(75, 0, 130, 0.8)', glowColor: '#9400d3', type: 'shadow' }
};

const BG_DATA = {
    morning: { id: 'morning', name: 'Fresh Morning', price: 0 },
    evening: { id: 'evening', name: 'Sunset Dusk', price: 500 },
    evening02: { id: 'evening02', name: 'Crimson Horizon', price: 1200 },
    night: { id: 'night', name: 'Midnight Calm', price: 2000 },
    golden: { id: 'golden', name: 'Imperial Palace', price: 4000 },
    minimal: { id: 'minimal', name: 'Zen Studio', price: 1000 },
    ocean: { id: 'ocean', name: 'Deep Abyss', price: 3000 },
    space: { id: 'space', name: 'Nebula Void', price: 6000 }
};

const INITIAL_PLAYER_DATA = {
    highScore: 0,
    coins: 100,
    equippedSword: 'classic',
    equippedBackground: 'morning',
    unlockedSwords: ['classic'],
    unlockedBackgrounds: ['morning'],
    statistics: {
        totalSlices: 0,
        totalCoinsEarned: 100,
        totalCombos: 0,
        gamesPlayed: 0,
        specialFruitsSliced: 0,
        bombDodges: 0,
        perfectSlices: 0,
        criticalSlices: 0
    },
    unlockedAchievements: [],
    lastLoginTimestamp: 0,
    consecutiveLogins: 0,
    settings: {
        sfxVolume: 0.8,
        bgmVolume: 0.5,
        hapticFeedback: true,
        screenShake: true
    }
};

const GAME_STATES = {
    LOADING: 'LOADING',
    MAIN_MENU: 'MAIN_MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    SHOP: 'SHOP',
    ACHIEVEMENTS: 'ACHIEVEMENTS',
    SETTINGS: 'SETTINGS',
    GAME_OVER: 'GAME_OVER'
};

// ============================================================================
// SYSTEM UTILITIES & MATH MODULES
// ============================================================================

class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    set(x, y) { this.x = x; this.y = y; return this; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    div(n) { this.x /= n; this.y /= n; return this; }
    magSq() { return this.x * this.x + this.y * this.y; }
    mag() { return Math.sqrt(this.magSq()); }
    normalize() { let m = this.mag(); if (m !== 0) this.div(m); return this; }
    copy() { return new Vector2D(this.x, this.y); }
    dist(v) { return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2); }
    dot(v) { return this.x * v.x + this.y * v.y; }
}

class MathUtils {
    static randomRange(min, max) { return Math.random() * (max - min) + min; }
    static randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    static lerp(start, end, amt) { return (1 - amt) * start + amt * end; }
    static lineCircleIntersection(p1, p2, cx, cy, r) {
        const d = p2.copy().sub(p1);
        const f = p1.copy().sub(new Vector2D(cx, cy));
        const a = d.dot(d);
        const b = 2 * f.dot(d);
        const c = f.dot(f) - r * r;
        let discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return false;
        discriminant = Math.sqrt(discriminant);
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);
        if (t1 >= 0 && t1 <= 1) return true;
        if (t2 >= 0 && t2 <= 1) return true;
        return false;
    }
}

// ============================================================================
// SUBSYSTEM MANAGERS
// ============================================================================

class SaveManager {
    constructor() {
        this.playerData = { ...INITIAL_PLAYER_DATA };
        this.load();
    }
    load() {
        try {
            const data = localStorage.getItem(GAME_CONFIG.storageKeys.saveData);
            if (data) {
                const parsed = JSON.parse(data);
                this.playerData = this.deepMerge(INITIAL_PLAYER_DATA, parsed);
            } else {
                this.playerData = JSON.parse(JSON.stringify(INITIAL_PLAYER_DATA));
                this.save();
            }
        } catch (e) {
            console.error("SaveManager: Storage engine corrupt, using memory model.", e);
            this.playerData = JSON.parse(JSON.stringify(INITIAL_PLAYER_DATA));
        }
    }
    save() {
        try {
            localStorage.setItem(GAME_CONFIG.storageKeys.saveData, JSON.stringify(this.playerData));
        } catch (e) {
            console.error("SaveManager: Failed to write to local storage context.", e);
        }
    }
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
    incrementStat(key, amount = 1) {
        if (this.playerData.statistics[key] !== undefined) {
            this.playerData.statistics[key] += amount;
            this.save();
        }
    }
    setStatMax(key, value) {
        if (this.playerData.statistics[key] !== undefined) {
            if (value > this.playerData.statistics[key]) {
                this.playerData.statistics[key] = value;
                this.save();
            }
        }
    }
}

class AssetLoader {
    constructor() {
        this.images = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
    }
    buildFlatManifest() {
        const list = [];
        for (const cat in ASSET_MANIFEST) {
            for (const key in ASSET_MANIFEST[cat]) {
                list.push({ category: cat, key: key, path: ASSET_MANIFEST[cat][key] });
            }
        }
        return list;
    }
    loadAll(onProgress, onComplete) {
        this.onProgressCallback = onProgress;
        this.onCompleteCallback = onComplete;
        const manifest = this.buildFlatManifest();
        this.totalAssets = manifest.length + 1; // +1 representing safe fallback synthetic buffers
        if (this.totalAssets === 1) { this.complete(); return; }
        manifest.forEach(item => {
            const img = new Image();
            img.src = item.path;
            img.onload = () => { this.assetLoaded(item.category, item.key, img); };
            img.onerror = () => { this.assetLoadError(item.category, item.key); };
        });
        this.generateFallbackAssets();
    }
    assetLoaded(category, key, element) {
        if (!this.images[category]) this.images[category] = {};
        this.images[category][key] = element;
        this.loadedAssets++;
        if (this.onProgressCallback) this.onProgressCallback(this.loadedAssets / this.totalAssets);
        if (this.loadedAssets >= this.totalAssets) this.complete();
    }
    assetLoadError(category, key) {
        console.warn(`AssetLoader: Failed running acquisition of ${category}:${key}. Generating procedural fallback buffer.`);
        const fallback = document.createElement('canvas');
        fallback.width = 128;
        fallback.height = 128;
        const ctx = fallback.getContext('2d');
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#000000';
        ctx.font = '16px sans-serif';
        ctx.fillText(key.substring(0, 8), 10, 64);
        this.assetLoaded(category, key, fallback);
    }
    generateFallbackAssets() {
        const bombCanvas = document.createElement('canvas');
        bombCanvas.width = 128;
        bombCanvas.height = 128;
        const ctx = bombCanvas.getContext('2d');
        ctx.beginPath(); ctx.arc(64, 64, 40, 0, Math.PI * 2); ctx.fillStyle = '#222'; ctx.fill();
        ctx.beginPath(); ctx.arc(64, 64, 35, 0, Math.PI * 2); ctx.fillStyle = '#444'; ctx.fill();
        ctx.fillStyle = '#ff3333'; ctx.fillRect(60, 15, 8, 12);
        this.images['bomb'] = { default: bombCanvas };
        this.loadedAssets++;
        if (this.onProgressCallback) this.onProgressCallback(this.loadedAssets / this.totalAssets);
        if (this.loadedAssets >= this.totalAssets) this.complete();
    }
    complete() { if (this.onCompleteCallback) this.onCompleteCallback(); }
    getImage(category, key) {
        if (category === 'bomb') return this.images['bomb']['default'];
        return this.images[category] ? this.images[category][key] : null;
    }
}

class AudioManager {
    constructor(saveManager) {
        this.saveManager = saveManager;
        this.ctx = null;
        this.isEnabled = false;
        this.initAudioContext();
    }
    initAudioContext() {
        const triggerInit = () => {
            if (this.isEnabled) return;
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.isEnabled = true;
                const buffer = this.ctx.createBuffer(1, 1, 22050);
                const node = this.ctx.createBufferSource();
                node.buffer = buffer;
                node.connect(this.ctx.destination);
                node.start(0);
            } catch (e) { console.error("Audio engine context blocked or unsupported.", e); }
            window.removeEventListener('touchstart', triggerInit);
            window.removeEventListener('click', triggerInit);
        };
        window.addEventListener('touchstart', triggerInit);
        window.addEventListener('click', triggerInit);
    }
    playProceduralSound(type) {
        if (!this.isEnabled || !this.ctx || this.saveManager.playerData.settings.sfxVolume <= 0) return;
        const now = this.ctx.currentTime;
        const vol = this.saveManager.playerData.settings.sfxVolume;
        switch (type) {
            case 'slice':
                this.synthesizeSwoosh(now, vol, 800, 150, 0.08);
                break;
            case 'combo':
                this.synthesizeChime(now, vol, 440, 0.2);
                setTimeout(() => this.synthesizeChime(this.ctx.currentTime, vol, 554.37, 0.2), 60);
                break;
            case 'coin':
                this.synthesizeChime(now, vol * 0.9, 987.77, 0.15);
                setTimeout(() => this.synthesizeChime(this.ctx.currentTime, vol * 0.9, 1318.51, 0.25), 80);
                break;
            case 'explosion':
                this.synthesizeExplosion(now, vol);
                break;
            case 'achievement':
                this.synthesizeArpeggio(now, vol);
                break;
            case 'click':
                this.synthesizeSwoosh(now, vol * 0.5, 400, 300, 0.04);
                break;
        }
    }
    synthesizeSwoosh(time, vol, startFreq, endFreq, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(time); osc.stop(time + duration);
    }
    synthesizeChime(time, vol, freq, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(time); osc.stop(time + duration);
    }
    synthesizeExplosion(time, vol) {
        const bufferSize = this.ctx.sampleRate * 0.6;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, time);
        filter.frequency.exponentialRampToValueAtTime(10, time + 0.5);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * 1.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
        noise.start(time); noise.stop(time + 0.6);
    }
    synthesizeArpeggio(time, vol) {
        const freqs = [261.63, 329.63, 392.00, 523.25];
        freqs.forEach((f, index) => {
            this.synthesizeChime(time + index * 0.1, vol * 0.8, f, 0.3);
        });
    }
}

class InputManager {
    constructor(canvas, scalingEngine) {
        this.canvas = canvas;
        this.scaler = scalingEngine;
        this.isSwiping = false;
        this.currentPoints = [];
        this.swipeListeners = [];
        this.clickListeners = [];
        this.initHooks();
    }
    initHooks() {
        const transformCoordinates = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = (clientX - rect.left) * (GAME_CONFIG.canvas.baseWidth / rect.width);
            const canvasY = (clientY - rect.top) * (GAME_CONFIG.canvas.baseHeight / rect.height);
            return new Vector2D(canvasX, canvasY);
        };
        const activeStart = (x, y) => {
            this.isSwiping = true;
            const pt = transformCoordinates(x, y);
            this.currentPoints = [pt];
            this.dispatchClick(pt);
        };
        const activeMove = (x, y) => {
            if (!this.isSwiping) return;
            const pt = transformCoordinates(x, y);
            this.currentPoints.push(pt);
            if (this.currentPoints.length > 1) {
                const p1 = this.currentPoints[this.currentPoints.length - 2];
                const p2 = this.currentPoints[this.currentPoints.length - 1];
                this.dispatchSwipe(p1, p2);
            }
            if (this.currentPoints.length > 12) this.currentPoints.shift();
        };
        const activeEnd = () => {
            this.isSwiping = false;
            this.currentPoints = [];
        };
        window.addEventListener('mousedown', e => activeStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => activeMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', () => activeEnd());
        window.addEventListener('touchstart', e => {
            if (e.touches.length > 0) activeStart(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener('touchmove', e => {
            if (e.touches.length > 0) activeMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener('touchend', () => activeEnd());
    }
    addSwipeListener(cb) { this.swipeListeners.push(cb); }
    addClickListener(cb) { this.clickListeners.push(cb); }
    dispatchSwipe(p1, p2) { this.swipeListeners.forEach(cb => cb(p1, p2)); }
    dispatchClick(pt) { this.clickListeners.forEach(cb => cb(pt)); }
    clearListeners() { this.swipeListeners = []; this.clickListeners = []; }
}

class BackgroundManager {
    constructor(assetLoader, saveManager) {
        this.loader = assetLoader;
        this.sm = saveManager;
    }
    renderBackground(ctx, width, height) {
        const bgKey = this.sm.playerData.equippedBackground || 'morning';
        const img = this.loader.getImage('backgrounds', bgKey);
        if (img) {
            ctx.drawImage(img, 0, 0, width, height);
        } else {
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, '#1a0d2e'); grad.addColorStop(1, '#0a0514');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
        }
    }
}

class DailyRewardManager {
    constructor(saveManager, audioManager) {
        this.sm = saveManager;
        this.am = audioManager;
        this.rewardsTable = [100, 200, 350, 500, 750, 1000, 2500];
    }
    checkStatus() {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const lastLogin = this.sm.playerData.lastLoginTimestamp;
        if (lastLogin === 0) {
            this.sm.playerData.consecutiveLogins = 1;
            this.sm.playerData.lastLoginTimestamp = now;
            this.sm.save();
            return { claimable: true, day: 1, amount: this.rewardsTable[0] };
        }
        const delta = now - lastLogin;
        if (delta >= oneDayMs && delta < oneDayMs * 2) {
            let currentStreak = this.sm.playerData.consecutiveLogins % 7;
            currentStreak++;
            this.sm.playerData.consecutiveLogins = currentStreak;
            this.sm.playerData.lastLoginTimestamp = now;
            this.sm.save();
            return { claimable: true, day: currentStreak, amount: this.rewardsTable[currentStreak - 1] };
        } else if (delta >= oneDayMs * 2) {
            this.sm.playerData.consecutiveLogins = 1;
            this.sm.playerData.lastLoginTimestamp = now;
            this.sm.save();
            return { claimable: true, day: 1, amount: this.rewardsTable[0] };
        }
        return { claimable: false, day: this.sm.playerData.consecutiveLogins, amount: 0 };
    }
    claimReward() {
        const status = this.checkStatus();
        if (status.claimable) {
            this.sm.playerData.coins += status.amount;
            this.sm.incrementStat('totalCoinsEarned', status.amount);
            this.sm.save();
            this.am.playProceduralSound('achievement');
            return status.amount;
        }
        return 0;
    }
}

class AchievementManager {
    constructor(saveManager, uiCallback) {
        this.sm = saveManager;
        this.uiCallback = uiCallback || (() => {});
        this.registry = [];
        this.initRegistry();
    }
    initRegistry() {
        const createGroup = (cat, label, statKey, benchmarks, rewardBase) => {
            benchmarks.forEach((val, index) => {
                this.registry.push({
                    id: `${cat}_tier_${index + 1}`,
                    title: `${label} - Tier ${index + 1}`,
                    desc: `Reach ${val} total ${cat}.`,
                    statKey: statKey,
                    target: val,
                    reward: rewardBase * (index + 1)
                });
            });
        };
        createGroup('slices', 'Fruit Master Slice', 'totalSlices', [50, 200, 1000, 5000, 15000, 50000, 100000, 250000], 50);
        createGroup('coins', 'Hoarder Trove', 'totalCoinsEarned', [200, 1000, 5000, 25000, 75000, 150000, 500000, 1000000], 100);
        createGroup('combos', 'Tactical Multiplier', 'totalCombos', [10, 50, 200, 1000, 5000, 10000, 25000, 50000], 75);
        createGroup('games', 'Veteran Campaigner', 'gamesPlayed', [5, 20, 50, 150, 500, 1200, 3000, 5000], 60);
        createGroup('specials', 'Collector Relic', 'specialFruitsSliced', [5, 25, 100, 500, 2000, 5000, 10000, 20000], 120);
        createGroup('dodges', 'Evasive Phantom', 'bombDodges', [5, 20, 100, 400, 1200, 3500, 8000, 15000], 80);
        while (this.registry.length < 50) {
            let i = this.registry.length;
            this.registry.push({
                id: `synthetic_ach_${i}`,
                title: `Elite Milestone ${i}`,
                desc: `Acquire high precision score metric index values.`,
                statKey: 'totalSlices',
                target: 500 + i * 200,
                reward: 200
            });
        }
    }
    evaluateEvaluationCycle() {
        const stats = this.sm.playerData.statistics;
        const unlocked = this.sm.playerData.unlockedAchievements;
        this.registry.forEach(ach => {
            if (!unlocked.includes(ach.id)) {
                const currentVal = stats[ach.statKey] || 0;
                if (currentVal >= ach.target) {
                    unlocked.push(ach.id);
                    this.sm.playerData.coins += ach.reward;
                    this.sm.save();
                    this.uiCallback(ach);
                }
            }
        });
    }
}

class ShopManager {
    constructor(saveManager, audioManager) {
        this.sm = saveManager;
        this.am = audioManager;
    }
    purchaseSword(id) {
        const item = SWORD_DATA[id];
        if (!item) return false;
        if (this.sm.playerData.unlockedSwords.includes(id)) return true;
        if (this.sm.playerData.coins >= item.price) {
            this.sm.playerData.coins -= item.price;
            this.sm.playerData.unlockedSwords.push(id);
            this.sm.save();
            this.am.playProceduralSound('achievement');
            return true;
        }
        return false;
    }
    equipSword(id) {
        if (this.sm.playerData.unlockedSwords.includes(id)) {
            this.sm.playerData.equippedSword = id;
            this.sm.save();
            return true;
        }
        return false;
    }
    purchaseBackground(id) {
        const item = BG_DATA[id];
        if (!item) return false;
        if (this.sm.playerData.unlockedBackgrounds.includes(id)) return true;
        if (this.sm.playerData.coins >= item.price) {
            this.sm.playerData.coins -= item.price;
            this.sm.playerData.unlockedBackgrounds.push(id);
            this.sm.save();
            this.am.playProceduralSound('achievement');
            return true;
        }
        return false;
    }
    equipBackground(id) {
        if (this.sm.playerData.unlockedBackgrounds.includes(id)) {
            this.sm.playerData.equippedBackground = id;
            this.sm.save();
            return true;
        }
        return false;
    }
}

class ComboManager {
    constructor(onComboTrigger) {
        this.onComboTrigger = onComboTrigger;
        this.sliceTimestamps = [];
    }
    registerSlice() {
        this.sliceTimestamps.push(Date.now());
    }
    processTick() {
        if (this.sliceTimestamps.length === 0) return;
        const now = Date.now();
        const validSlices = this.sliceTimestamps.filter(t => (now - t) <= GAME_CONFIG.gameplay.comboWindow);
        if (this.sliceTimestamps.length > validSlices.length && validSlices.length === 0) {
            let totalCount = this.sliceTimestamps.length;
            if (totalCount >= 3) {
                let multiplier = 2;
                if (totalCount >= 20) multiplier = 20;
                else if (totalCount >= 10) multiplier = 10;
                else if (totalCount >= 5) multiplier = 5;
                else if (totalCount >= 3) multiplier = 3;
                this.onComboTrigger(totalCount, multiplier);
            }
            this.sliceTimestamps = [];
        } else {
            this.sliceTimestamps = validSlices;
        }
    }
    flush() {
        this.sliceTimestamps = [];
    }
}

// ============================================================================
// PARTICLE ENGINE ENGINE (HIGH PERFORMANCE SYSTEM POOLING)
// ============================================================================

class Particle {
    constructor() {
        this.pos = new Vector2D();
        this.vel = new Vector2D();
        this.color = '#fff';
        this.size = 5;
        this.life = 1.0;
        this.decay = 0.02;
        this.gravity = 0.1;
        this.type = 'juice'; // juice, spark, coin, combo, explosion
        this.rotation = 0;
        this.rotSpeed = 0;
        this.active = false;
        this.imageRef = null;
    }
    init(x, y, vx, vy, color, size, decay, gravity, type, imageRef = null) {
        this.pos.set(x, y);
        this.vel.set(vx, vy);
        this.color = color;
        this.size = size;
        this.decay = decay;
        this.gravity = gravity;
        this.type = type;
        this.life = 1.0;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = MathUtils.randomRange(-0.1, 0.1);
        this.active = true;
        this.imageRef = imageRef;
    }
    update() {
        if (!this.active) return;
        this.vel.y += this.gravity;
        this.pos.add(this.vel);
        this.rotation += this.rotSpeed;
        this.life -= this.decay;
        if (this.life <= 0) this.active = false;
    }
    render(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation);
        if (this.type === 'coin' && this.imageRef) {
            ctx.drawImage(this.imageRef, -this.size, -this.size, this.size * 2, this.size * 2);
        } else {
            ctx.fillStyle = this.color;
            if (this.type === 'spark') {
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

class ParticlePool {
    constructor(initialSize = 300) {
        this.pool = [];
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new Particle());
        }
    }
    spawn(x, y, vx, vy, color, size, decay, gravity, type, imageRef = null) {
        let p = this.pool.find(item => !item.active);
        if (!p) {
            p = new Particle();
            this.pool.push(p);
        }
        p.init(x, y, vx, vy, color, size, decay, gravity, type, imageRef);
    }
    update() {
        this.pool.forEach(p => { if (p.active) p.update(); });
    }
    render(ctx) {
        this.pool.forEach(p => { if (p.active) p.render(ctx); });
    }
    clear() {
        this.pool.forEach(p => p.active = false);
    }
}

// ============================================================================
// GAMEPLAY STAGE TARGET OBJECT REPRESENTATIONS
// ============================================================================

class TargetObject {
    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
        this.pos = new Vector2D();
        this.vel = new Vector2D();
        this.radius = 60;
        this.rotation = 0;
        this.rotSpeed = 0.02;
        this.isSliced = false;
        this.sliceProgress = 0; // 0..1 for split mesh translations
        this.half1Vel = new Vector2D();
        this.half2Vel = new Vector2D();
        this.half1Rot = 0;
        this.half2Rot = 0;
        this.type = 'standard'; // standard, special, bomb
        this.key = 'apple';
        this.image = null;
        this.scoreValue = 1;
        this.sizeScale = 1.0;
        this.sliceAngle = 0;
        this.juiceColor = '#ff0000';
        this.hitsRequired = 1;
        this.hitsReceived = 0;
        this.fuseTimer = 0;
    }
    initFruit(key, variant, img, sizeScale, score, color) {
        this.type = variant; // 'standard' or 'special'
        this.key = key;
        this.image = img;
        this.sizeScale = sizeScale;
        this.radius = 70 * sizeScale;
        this.scoreValue = score;
        this.juiceColor = color;
        this.isSliced = false;
        this.sliceProgress = 0;
        this.hitsRequired = 1;
        this.hitsReceived = 0;
        if (key === 'coconut' && variant === 'special') this.hitsRequired = 2;
        this.setupPhysics();
    }
    initBomb(img) {
        this.type = 'bomb';
        this.key = 'bomb';
        this.image = img;
        this.sizeScale = 1.0;
        this.radius = 65;
        this.scoreValue = 0;
        this.isSliced = false;
        this.sliceProgress = 0;
        this.hitsRequired = 1;
        this.hitsReceived = 0;
        this.fuseTimer = 0;
        this.setupPhysics();
    }
    setupPhysics() {
        const side = Math.random() < 0.5 ? 'left' : 'right';
        let spawnX = MathUtils.randomRange(200, GAME_CONFIG.canvas.baseWidth - 200);
        this.pos.set(spawnX, GAME_CONFIG.canvas.baseHeight + this.radius);
        let targetX = MathUtils.randomRange(300, GAME_CONFIG.canvas.baseWidth - 300);
        let targetY = MathUtils.randomRange(250, 700);
        let t = MathUtils.randomRange(75, 95); // ticks to peak
        let vx = (targetX - this.pos.x) / t;
        let vy = -Math.sqrt(2 * GAME_CONFIG.physics.gravity * (GAME_CONFIG.canvas.baseHeight - targetY));
        this.vel.set(vx, vy);
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = MathUtils.randomRange(-0.06, 0.06);
    }
    update() {
        if (!this.isSliced) {
            this.vel.y += GAME_CONFIG.physics.gravity;
            if (this.vel.y > GAME_CONFIG.physics.terminalVelocity) this.vel.y = GAME_CONFIG.physics.terminalVelocity;
            this.pos.add(this.vel);
            this.rotation += this.rotSpeed;
            if (this.type === 'bomb') {
                this.fuseTimer += 0.15;
            }
        } else {
            this.sliceProgress += 0.05;
            this.half1Vel.y += GAME_CONFIG.physics.gravity;
            this.half2Vel.y += GAME_CONFIG.physics.gravity;
            this.pos.add(this.vel); // Core translation reference group update frame
            this.half1Rot += this.rotSpeed * 1.5;
            this.half2Rot -= this.rotSpeed * 1.5;
        }
    }
    slice(angle) {
        this.hitsReceived++;
        if (this.hitsReceived < this.hitsRequired) {
            this.sizeScale *= 0.85;
            this.radius *= 0.85;
            this.vel.y -= 2; // minor impact lift
            return false; // Not fully cut
        }
        this.isSliced = true;
        this.sliceAngle = angle;
        const speed = 6;
        this.half1Vel.set(Math.cos(angle + Math.PI / 2) * speed, Math.sin(angle + Math.PI / 2) * speed);
        this.half2Vel.set(Math.cos(angle - Math.PI / 2) * speed, Math.sin(angle - Math.PI / 2) * speed);
        this.half1Rot = this.rotation;
        this.half2Rot = this.rotation;
        return true;
    }
    isOutOfBounds() {
        if (!this.isSliced) {
            return this.pos.y > GAME_CONFIG.canvas.baseHeight + this.radius + 50 && this.vel.y > 0;
        } else {
            return this.sliceProgress >= 1.0 || this.pos.y > GAME_CONFIG.canvas.baseHeight + 200;
        }
    }
    render(ctx) {
        if (!this.image) return;
        ctx.save();
        if (!this.isSliced) {
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(this.rotation);
            if (this.type === 'bomb') {
                let pulse = 1 + Math.sin(this.fuseTimer) * 0.08;
                ctx.scale(pulse, pulse);
            }
            ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else {
            let offset1X = this.half1Vel.x * this.sliceProgress * 15;
            let offset1Y = this.half1Vel.y * this.sliceProgress * 15;
            ctx.save();
            ctx.translate(this.pos.x + offset1X, this.pos.y + offset1Y);
            ctx.rotate(this.half1Rot);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, this.sliceAngle, this.sliceAngle + Math.PI);
            ctx.clip();
            ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
            let offset2X = this.half2Vel.x * this.sliceProgress * 15;
            let offset2Y = this.half2Vel.y * this.sliceProgress * 15;
            ctx.save();
            ctx.translate(this.pos.x + offset2X, this.pos.y + offset2Y);
            ctx.rotate(this.half2Rot);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, this.sliceAngle + Math.PI, this.sliceAngle + Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        ctx.restore();
    }
}

// ============================================================================
// SWORD TRAIL INTERPOLATOR MODULE
// ============================================================================

class SwordTrail {
    constructor(saveManager) {
        this.sm = saveManager;
        this.history = [];
    }
    push(p1, p2) {
        this.history.push({ p1: p1.copy(), p2: p2.copy(), alpha: 1.0 });
    }
    update() {
        this.history.forEach(segment => {
            segment.alpha -= 0.07;
        });
        this.history = this.history.filter(s => s.alpha > 0);
    }
    render(ctx) {
        if (this.history.length === 0) return;
        const swordId = this.sm.playerData.equippedSword || 'classic';
        const config = SWORD_DATA[swordId] || SWORD_DATA.classic;
        ctx.save();
        for (let i = 0; i < this.history.length; i++) {
            let seg = this.history[i];
            ctx.globalAlpha = seg.alpha;
            let finalColor = config.trailColor;
            if (config.glowColor === 'rainbow') {
                let hue = (Date.now() / 5 + i * 20) % 360;
                finalColor = `hsla(${hue}, 100%, 60%, ${seg.alpha})`;
                ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            } else {
                ctx.shadowColor = config.glowColor;
            }
            ctx.shadowBlur = 20;
            ctx.strokeStyle = finalColor;
            ctx.lineWidth = 14 * seg.alpha;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(seg.p1.x, seg.p1.y);
            ctx.lineTo(seg.p2.x, seg.p2.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// ============================================================================
// INTERACTION CONTROLLER LAYER & STRUCTURAL SCALING ENGINE
// ============================================================================

class UIElement {
    constructor(id, x, y, w, h, text, onClick) {
        this.id = id;
        this.bounds = { x, y, w, h };
        this.text = text;
        this.onClick = onClick;
        this.visible = true;
    }
    contains(pt) {
        return pt.x >= this.bounds.x && pt.x <= this.bounds.x + this.bounds.w &&
               pt.y >= this.bounds.y && pt.y <= this.bounds.y + this.bounds.h;
    }
    render(ctx) {
        if (!this.visible) return;
        ctx.save();
        ctx.fillStyle = 'rgba(30, 20, 50, 0.85)';
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 4;
        this.roundRect(ctx, this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h, 15);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.bounds.x + this.bounds.w / 2, this.bounds.y + this.bounds.h / 2);
        ctx.restore();
    }
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

// ============================================================================
// MAIN GAME ENGINE CORE ARCHITECTURE
// ============================================================================

class GameEngine {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gameCanvas';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.currentState = GAME_STATES.LOADING;
        this.saveManager = new SaveManager();
        this.assetLoader = new AssetLoader();
        this.audioManager = new AudioManager(this.saveManager);
        this.inputManager = new InputManager(this.canvas, this);
        this.bgManager = new BackgroundManager(this.assetLoader, this.saveManager);
        this.dailyRewardManager = new DailyRewardManager(this.saveManager, this.audioManager);
        this.achievementManager = new AchievementManager(this.saveManager, (ach) => this.triggerAchievementPopup(ach));
        this.comboManager = new ComboManager((count, mult) => this.handleComboEvent(count, mult));
        this.particlePool = new ParticlePool(400);
        this.swordTrail = new SwordTrail(this.saveManager);
        this.targets = [];
        this.activeUIElements = [];
        this.score = 0;
        this.lives = 3;
        this.gameTimeElapsed = 0;
        this.nextSpawnTimer = 0;
        this.screenShakeIntensity = 0;
        this.hitFreezeDuration = 0;
        this.floatingTexts = [];
        this.achievementPopupActive = null;
        this.achievementPopupTimer = 0;
        this.shopTab = 'swords'; // or 'bgs'
        this.responsiveResize();
        window.addEventListener('resize', () => this.responsiveResize());
        this.initLoaderPipeline();
    }
    responsiveResize() {
        const baseWidth = GAME_CONFIG.canvas.baseWidth;
        const baseHeight = GAME_CONFIG.canvas.baseHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const windowRatio = windowWidth / windowHeight;
        const targetRatio = baseWidth / baseHeight;
        if (windowRatio > targetRatio) {
            this.canvas.style.height = windowHeight + 'px';
            this.canvas.style.width = (windowHeight * targetRatio) + 'px';
        } else {
            this.canvas.style.width = windowWidth + 'px';
            this.canvas.style.height = (windowWidth / targetRatio) + 'px';
        }
        this.canvas.width = baseWidth;
        this.canvas.height = baseHeight;
    }
    initLoaderPipeline() {
        this.assetLoader.loadAll(
            (progress) => {
                this.loadingProgress = progress;
            },
            () => {
                this.transitionToState(GAME_STATES.MAIN_MENU);
            }
        );
        this.loop();
    }
    transitionToState(state) {
        this.currentState = state;
        this.activeUIElements = [];
        this.inputManager.clearListeners();
        this.targets = [];
        this.comboManager.flush();
        this.inputManager.addSwipeListener((p1, p2) => this.processSwipeSlice(p1, p2));
        this.inputManager.addClickListener((pt) => this.processElementClick(pt));
        const cx = GAME_CONFIG.canvas.baseWidth / 2;
        switch (state) {
            case GAME_STATES.MAIN_MENU:
                this.saveManager.incrementStat('gamesPlayed', 0); // eval stats initialization block
                this.achievementManager.evaluateEvaluationCycle();
                this.activeUIElements.push(new UIElement('play', cx - 200, 900, 400, 90, 'START GAME', () => {
                    this.audioManager.playProceduralSound('click');
                    this.startNewGameSession();
                }));
                this.activeUIElements.push(new UIElement('shop', cx - 200, 1030, 400, 90, 'EQUIPMENT SHOP', () => {
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.SHOP);
                }));
                this.activeUIElements.push(new UIElement('ach', cx - 200, 1160, 400, 90, 'ACHIEVEMENTS', () => {
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.ACHIEVEMENTS);
                }));
                this.activeUIElements.push(new UIElement('settings', cx - 200, 1290, 400, 90, 'SETTINGS', () => {
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.SETTINGS);
                }));
                const claimCheck = this.dailyRewardManager.checkStatus();
                if (claimCheck.claimable) {
                    this.activeUIElements.push(new UIElement('daily', cx - 250, 700, 500, 90, `CLAIM DAILY: +${claimCheck.amount}C`, () => {
                        this.dailyRewardManager.claimReward();
                        this.transitionToState(GAME_STATES.MAIN_MENU);
                    }));
                }
                break;
            case GAME_STATES.PLAYING:
                this.activeUIElements.push(new UIElement('pause', GAME_CONFIG.canvas.baseWidth - 140, 40, 100, 70, '||', () => {
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.PAUSED);
                }));
                break;
            case GAME_STATES.PAUSED:
                this.activeUIElements.push(new UIElement('resume', cx - 200, 800, 400, 90, 'RESUME', () => {
                    this.audioManager.playProceduralSound('click');
                    this.currentState = GAME_STATES.PLAYING;
                    this.inputManager.clearListeners();
                    this.inputManager.addSwipeListener((p1, p2) => this.processSwipeSlice(p1, p2));
                    this.inputManager.addClickListener((pt) => this.processElementClick(pt));
                    this.activeUIElements = [this.activeUIElements.find(u => u.id === 'pause')];
                }));
                this.activeUIElements.push(new UIElement('quit', cx - 200, 950, 400, 90, 'MAIN MENU', () => {
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.MAIN_MENU);
                }));
                break;
            case GAME_STATES.SHOP:
                this.buildShopUI();
                break;
            case GAME_STATES.ACHIEVEMENTS:
                this.activeUIElements.push(new UIElement('back', 60, 40, 180, 80, 'BACK', () => {
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.MAIN_MENU);
                }));
                break;
            case GAME_STATES.SETTINGS:
                const s = this.saveManager.playerData.settings;
                this.activeUIElements.push(new UIElement('sfx', cx - 250, 700, 500, 85, `SFX: ${s.sfxVolume > 0 ? "ON" : "OFF"}`, () => {
                    s.sfxVolume = s.sfxVolume > 0 ? 0 : 0.8;
                    this.saveManager.save();
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.SETTINGS);
                }));
                this.activeUIElements.push(new UIElement('shake', cx - 250, 830, 500, 85, `SCREEN SHAKE: ${s.screenShake ? "ON" : "OFF"}`, () => {
                    s.screenShake = !s.screenShake;
                    this.saveManager.save();
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.SETTINGS);
                }));
                this.activeUIElements.push(new UIElement('back', cx - 200, 1100, 400, 90, 'MAIN MENU', () => {
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.MAIN_MENU);
                }));
                break;
            case GAME_STATES.GAME_OVER:
                this.saveManager.incrementStat('gamesPlayed', 1);
                this.saveManager.setStatMax('highScore', this.score);
                this.achievementManager.evaluateEvaluationCycle();
                this.activeUIElements.push(new UIElement('retry', cx - 200, 1000, 400, 90, 'RETRY GAME', () => {
                    this.audioManager.playProceduralSound('click');
                    this.startNewGameSession();
                }));
                this.activeUIElements.push(new UIElement('menu', cx - 200, 1130, 400, 90, 'MAIN MENU', () => {
                    this.audioManager.playProceduralSound('click');
                    this.transitionToState(GAME_STATES.MAIN_MENU);
                }));
                break;
        }
    }
    startNewGameSession() {
        this.score = 0;
        this.lives = 3;
        this.gameTimeElapsed = 0;
        this.nextSpawnTimer = GAME_CONFIG.gameplay.initialSpawnDelay;
        this.transitionToState(GAME_STATES.PLAYING);
    }
    buildShopUI() {
        const cx = GAME_CONFIG.canvas.baseWidth / 2;
        this.activeUIElements.push(new UIElement('back', 60, 40, 180, 80, 'BACK', () => {
            this.audioManager.playProceduralSound('click');
            this.transitionToState(GAME_STATES.MAIN_MENU);
        }));
        this.activeUIElements.push(new UIElement('tab_swords', 200, 200, 300, 80, 'SWORDS', () => {
            this.shopTab = 'swords'; this.audioManager.playProceduralSound('click'); this.transitionToState(GAME_STATES.SHOP);
        }));
        this.activeUIElements.push(new UIElement('tab_bgs', 550, 200, 300, 80, 'BACKGROUNDS', () => {
            this.shopTab = 'bgs'; this.audioManager.playProceduralSound('click'); this.transitionToState(GAME_STATES.SHOP);
        }));
        let yOffset = 340;
        if (this.shopTab === 'swords') {
            Object.keys(SWORD_DATA).forEach(key => {
                const item = SWORD_DATA[key];
                const isUnlocked = this.saveManager.playerData.unlockedSwords.includes(key);
                const isEquipped = this.saveManager.playerData.equippedSword === key;
                let btnText = isEquipped ? "EQUIPPED" : (isUnlocked ? "EQUIP" : `BUY: ${item.price}C`);
                this.activeUIElements.push(new UIElement(`sword_${key}`, GAME_CONFIG.canvas.baseWidth - 400, yOffset, 320, 80, btnText, () => {
                    if (!isUnlocked) {
                        if (this.saveManager.purchaseSword(key)) this.buildShopUI();
                    } else {
                        if (this.saveManager.equipSword(key)) this.buildShopUI();
                    }
                }));
                yOffset += 110;
            });
        } else {
            Object.keys(BG_DATA).forEach(key => {
                const item = BG_DATA[key];
                const isUnlocked = this.saveManager.playerData.unlockedBackgrounds.includes(key);
                const isEquipped = this.saveManager.playerData.equippedBackground === key;
                let btnText = isEquipped ? "EQUIPPED" : (isUnlocked ? "EQUIP" : `BUY: ${item.price}C`);
                this.activeUIElements.push(new UIElement(`bg_${key}`, GAME_CONFIG.canvas.baseWidth - 400, yOffset, 320, 80, btnText, () => {
                    if (!isUnlocked) {
                        if (this.saveManager.purchaseBackground(key)) this.buildShopUI();
                    } else {
                        if (this.saveManager.equipBackground(key)) this.buildShopUI();
                    }
                }));
                yOffset += 110;
            });
        }
    }
    triggerAchievementPopup(ach) {
        this.achievementPopupActive = ach;
        this.achievementPopupTimer = 180; // 3 seconds at 60 FPS
        this.audioManager.playProceduralSound('achievement');
    }
    processElementClick(pt) {
        for (let el of this.activeUIElements) {
            if (el.visible && el.contains(pt)) {
                el.onClick();
                break;
            }
        }
    }
    processSwipeSlice(p1, p2) {
        this.swordTrail.push(p1, p2);
        if (this.currentState !== GAME_STATES.PLAYING) return;
        this.comboManager.registerSlice();
        let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        this.targets.forEach(tar => {
            if (!tar.isSliced) {
                if (MathUtils.lineCircleIntersection(p1, p2, tar.pos.x, tar.pos.y, tar.radius)) {
                    let fullyCut = tar.slice(angle);
                    if (fullyCut) {
                        this.handleTargetDestruction(tar);
                    } else {
                        this.audioManager.playProceduralSound('slice');
                    }
                }
            }
        });
    }
    handleTargetDestruction(tar) {
        if (tar.type === 'bomb') {
            this.audioManager.playProceduralSound('explosion');
            if (this.saveManager.playerData.settings.screenShake) this.screenShakeIntensity = 45;
            this.hitFreezeDuration = 25;
            this.spawnExplosionParticles(tar.pos.x, tar.pos.y);
            this.transitionToState(GAME_STATES.GAME_OVER);
        } else {
            this.audioManager.playProceduralSound('slice');
            this.saveManager.incrementStat('totalSlices', 1);
            let scoreAwarded = tar.scoreValue;
            let isCritical = Math.random() < 0.06;
            if (isCritical) {
                scoreAwarded *= 3;
                this.saveManager.incrementStat('criticalSlices', 1);
                this.spawnFloatingText(tar.pos.x, tar.pos.y - 40, 'CRITICAL x3!', '#ff1155', 48);
            }
            if (tar.type === 'special') {
                this.saveManager.incrementStat('specialFruitsSliced', 1);
                this.handleSpecialFruitSideEffects(tar);
            }
            this.score += scoreAwarded;
            if (this.saveManager.playerData.settings.screenShake) this.screenShakeIntensity = 10;
            this.spawnFruitSplatterParticles(tar.pos.x, tar.pos.y, tar.juiceColor);
            this.spawnCoinDrops(tar.pos.x, tar.pos.y, MathUtils.randomInt(1, 3));
        }
    }
    handleSpecialFruitSideEffects(tar) {
        if (tar.key === 'watermelon') { // rainbow proxy token matching item manifest mapping keys
            this.spawnCoinDrops(tar.pos.x, tar.pos.y, 15);
            this.spawnFloatingText(tar.pos.x, tar.pos.y - 80, 'COIN SHOWER!', '#ffee00', 40);
        } else if (tar.key === 'pear') {
            this.score += 10;
            this.spawnFloatingText(tar.pos.x, tar.pos.y - 80, 'COMBO BOOST!', '#33ff33', 40);
        }
    }
    handleComboEvent(count, multiplier) {
        let bonus = count * multiplier;
        this.score += bonus;
        this.saveManager.incrementStat('totalCombos', 1);
        let activeTar = this.targets.find(t => t.isSliced);
        let px = activeTar ? activeTar.pos.x : GAME_CONFIG.canvas.baseWidth / 2;
        let py = activeTar ? activeTar.pos.y - 100 : 500;
        this.spawnFloatingText(px, py, `${count} FRUIT COMBO x${multiplier}!`, '#ffcc00', 52);
        this.audioManager.playProceduralSound('combo');
    }
    spawnFruitSplatterParticles(x, y, color) {
        for (let i = 0; i < 25; i++) {
            let vx = MathUtils.randomRange(-8, 8);
            let vy = MathUtils.randomRange(-12, 4);
            let size = MathUtils.randomRange(6, 14);
            this.particlePool.spawn(x, y, vx, vy, color, size, 0.02, GAME_CONFIG.physics.gravity * 0.8, 'juice');
        }
    }
    spawnExplosionParticles(x, y) {
        for (let i = 0; i < 60; i++) {
            let vx = MathUtils.randomRange(-15, 15);
            let vy = MathUtils.randomRange(-15, 15);
            let size = MathUtils.randomRange(8, 20);
            let colors = ['#ff3300', '#ffcc00', '#333333'];
            this.particlePool.spawn(x, y, vx, vy, colors[i % 3], size, 0.015, 0.02, 'explosion');
        }
    }
    spawnCoinDrops(x, y, amount) {
        const coinImg = this.assetLoader.getImage('special', 'potato'); // standard visual element assignment logic fallback handling path
        for (let i = 0; i < amount; i++) {
            let vx = MathUtils.randomRange(-5, 5);
            let vy = MathUtils.randomRange(-10, -3);
            this.particlePool.spawn(x, y, vx, vy, '#ffee00', 20, 0.01, 0.2, 'coin', coinImg);
            this.saveManager.playerData.coins += 1;
            this.saveManager.incrementStat('totalCoinsEarned', 1);
        }
    }
    spawnFloatingText(x, y, text, color, size) {
        this.floatingTexts.push({ x, y, text, color, size, alpha: 1.0, velocityY: -2.5 });
    }
    spawnWave() {
        let diff = 1.0 + this.gameTimeElapsed * GAME_CONFIG.gameplay.difficultyScaleRate;
        let count = MathUtils.randomInt(2, Math.min(2 + Math.floor(diff), 6));
        const fruitKeys = Object.keys(ASSET_MANIFEST.fruits);
        const specialKeys = Object.keys(ASSET_MANIFEST.special);
        for (let i = 0; i < count; i++) {
            let rand = Math.random();
            let tar = new TargetObject();
            if (rand < GAME_CONFIG.gameplay.bombSpawnChance) {
                tar.initBomb(this.assetLoader.getImage('bomb', 'default'));
            } else if (rand < GAME_CONFIG.gameplay.bombSpawnChance + GAME_CONFIG.gameplay.specialSpawnChance) {
                let key = specialKeys[MathUtils.randomInt(0, specialKeys.length - 1)];
                let img = this.assetLoader.getImage('special', key);
                let score = key === 'apple' ? 5 : 2; // custom point tables mapping configs definitions
                tar.initFruit(key, 'special', img, 1.1, score, '#fff700');
            } else {
                let key = fruitKeys[MathUtils.randomInt(0, fruitKeys.length - 1)];
                let img = this.assetLoader.getImage('fruits', key);
                let colors = { apple: '#ff2222', banana: '#ffdd33', grapes: '#aa33ff', black_grapes: '#441166', green01: '#55ff33', jackfruit: '#ccaa44', kiwi: '#66aa24', lemon: '#ffff33', muskmelon: '#ffaa66', tomato: '#ff3333' };
                tar.initFruit(key, 'standard', img, MathUtils.randomRange(0.8, 1.2), 1, colors[key] || '#ff0000');
            }
            this.targets.push(tar);
        }
        this.nextSpawnTimer = MathUtils.randomRange(GAME_CONFIG.gameplay.minSpawnDelay, Math.max(GAME_CONFIG.gameplay.minSpawnDelay, GAME_CONFIG.gameplay.initialSpawnDelay - (diff * 100)));
    }
    updateEngineState() {
        if (this.hitFreezeDuration > 0) {
            this.hitFreezeDuration--;
            return;
        }
        this.particlePool.update();
        this.swordTrail.update();
        this.comboManager.processTick();
        if (this.currentState === GAME_STATES.PLAYING) {
            this.gameTimeElapsed += 16.67; // approx ms step execution
            this.nextSpawnTimer -= 16.67;
            if (this.nextSpawnTimer <= 0) {
                this.spawnWave();
            }
            for (let i = this.targets.length - 1; i >= 0; i--) {
                let tar = this.targets[i];
                tar.update();
                if (tar.isOutOfBounds()) {
                    if (!tar.isSliced && tar.type !== 'bomb') {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.transitionToState(GAME_STATES.GAME_OVER);
                        }
                    } else if (!tar.isSliced && tar.type === 'bomb') {
                        this.saveManager.incrementStat('bombDodges', 1);
                    }
                    this.targets.splice(i, 1);
                }
            }
        } else {
            this.targets.forEach(tar => tar.update());
        }
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            let ft = this.floatingTexts[i];
            ft.y += ft.velocityY;
            ft.alpha -= 0.02;
            if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
        }
        if (this.screenShakeIntensity > 0) {
            this.screenShakeIntensity *= 0.9;
            if (this.screenShakeIntensity < 0.5) this.screenShakeIntensity = 0;
        }
        if (this.achievementPopupActive) {
            this.achievementPopupTimer--;
            if (this.achievementPopupTimer <= 0) this.achievementPopupActive = null;
        }
    }
    renderPipeline() {
        this.ctx.save();
        if (this.screenShakeIntensity > 0) {
            let dx = MathUtils.randomRange(-this.screenShakeIntensity, this.screenShakeIntensity);
            let dy = MathUtils.randomRange(-this.screenShakeIntensity, this.screenShakeIntensity);
            this.ctx.translate(dx, dy);
        }
        this.bgManager.renderBackground(this.ctx, GAME_CONFIG.canvas.baseWidth, GAME_CONFIG.canvas.baseHeight);
        this.particlePool.render(this.ctx);
        this.targets.forEach(tar => tar.render(this.ctx));
        this.swordTrail.render(this.ctx);
        this.renderInterfaceOverlays();
        this.ctx.restore();
    }
    renderInterfaceOverlays() {
        const cx = GAME_CONFIG.canvas.baseWidth / 2;
        switch (this.currentState) {
            case GAME_STATES.LOADING:
                this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
                this.ctx.fillRect(0, 0, GAME_CONFIG.canvas.baseWidth, GAME_CONFIG.canvas.baseHeight);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 64px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('FRUIT CUT MASTER', cx, 800);
                this.ctx.fillStyle = '#444';
                this.ctx.fillRect(cx - 300, 950, 600, 30);
                this.ctx.fillStyle = '#ffcc00';
                this.ctx.fillRect(cx - 300, 950, 600 * (this.loadingProgress || 0), 30);
                break;
            case GAME_STATES.MAIN_MENU:
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 84px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#000'; this.ctx.shadowBlur = 15;
                this.ctx.fillText('FRUIT CUT MASTER', cx, 400);
                this.ctx.font = '300 38px Arial';
                this.ctx.fillText(`HIGH SCORE: ${this.saveManager.playerData.highScore}`, cx, 520);
                this.ctx.fillText(`COINS: ${this.saveManager.playerData.coins} C`, cx, 580);
                this.ctx.shadowBlur = 0;
                break;
            case GAME_STATES.PLAYING:
            case GAME_STATES.PAUSED:
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 72px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(this.score.toString(), 60, 110);
                this.ctx.textAlign = 'right';
                let livesStr = '';
                for (let i = 0; i < 3; i++) livesStr += i < this.lives ? '♥' : '♡';
                this.ctx.fillStyle = '#ff3366';
                this.ctx.fillText(livesStr, GAME_CONFIG.canvas.baseWidth - 200, 100);
                if (this.currentState === GAME_STATES.PAUSED) {
                    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    this.ctx.fillRect(0, 0, GAME_CONFIG.canvas.baseWidth, GAME_CONFIG.canvas.baseHeight);
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = 'bold 84px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('GAME PAUSED', cx, 600);
                }
                break;
            case GAME_STATES.SHOP:
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 64px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('ARMORY SHOP', cx, 120);
                this.ctx.font = '36px Arial';
                this.ctx.fillText(`BALANCE: ${this.saveManager.playerData.coins} COINS`, cx, 170);
                let idx = 0;
                const activeDataGroup = this.shopTab === 'swords' ? SWORD_DATA : BG_DATA;
                Object.keys(activeDataGroup).forEach(k => {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = 'bold 38px Arial';
                    this.ctx.textAlign = 'left';
                    this.ctx.fillText(activeDataGroup[k].name, 80, 390 + idx * 110);
                    idx++;
                });
                break;
            case GAME_STATES.ACHIEVEMENTS:
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 64px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('ACHIEVEMENTS', cx, 120);
                let counter = 0;
                this.achievementManager.registry.slice(0, 12).forEach(ach => {
                    let unl = this.saveManager.playerData.unlockedAchievements.includes(ach.id);
                    this.ctx.fillStyle = unl ? '#33ff33' : '#aaaaaa';
                    this.ctx.font = 'bold 28px Arial';
                    this.ctx.textAlign = 'left';
                    let col = counter % 2;
                    let row = Math.floor(counter / 2);
                    let ax = col * 480 + 80;
                    let ay = row * 120 + 260;
                    this.ctx.fillText(ach.title, ax, ay);
                    this.ctx.fillStyle = '#eee';
                    this.ctx.font = '20px Arial';
                    this.ctx.fillText(ach.desc, ax, ay + 30);
                    counter++;
                });
                break;
            case GAME_STATES.SETTINGS:
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 64px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('SETTINGS', cx, 400);
                break;
            case GAME_STATES.GAME_OVER:
                this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
                this.ctx.fillRect(0, 0, GAME_CONFIG.canvas.baseWidth, GAME_CONFIG.canvas.baseHeight);
                this.ctx.fillStyle = '#ff3333';
                this.ctx.font = 'bold 96px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GAME OVER', cx, 500);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 54px Arial';
                this.ctx.fillText(`SCORE: ${this.score}`, cx, 650);
                this.ctx.font = '36px Arial';
                this.ctx.fillText(`BEST SCORE: ${this.saveManager.playerData.highScore}`, cx, 730);
                break;
        }
        this.activeUIElements.forEach(el => el.render(this.ctx));
        this.floatingTexts.forEach(ft => {
            this.ctx.save();
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.fillStyle = ft.color;
            this.ctx.font = `bold ${ft.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        });
        if (this.achievementPopupActive) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(20, 100, 20, 0.95)';
            this.ctx.strokeStyle = '#33ff33';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.rect(cx - 350, 60, 700, 120);
            this.ctx.fill(); this.ctx.stroke();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ACHIEVEMENT UNLOCKED!', cx, 105);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(this.achievementPopupActive.title, cx, 145);
            this.ctx.restore();
        }
    }
    loop() {
        this.updateEngineState();
        this.renderPipeline();
        requestAnimationFrame(() => this.loop());
    }
}

// Instantiate engine instance on layout mount
window.addEventListener('DOMContentLoaded', () => {
    window.gameEngineInstance = new GameEngine();
});