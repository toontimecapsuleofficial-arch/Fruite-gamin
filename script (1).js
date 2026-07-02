/* =====================================================================
   FRUIT NINJA STYLE GAME - COMPLETE SINGLE FILE ENGINE
   Canvas based, no external libraries. Mobile + Desktop, touch + mouse.
===================================================================== */

(function () {
"use strict";

/* =====================================================================
   0. GLOBAL CONFIG / ASSET MANIFEST
===================================================================== */

const ASSET_MANIFEST = {
    backgrounds: {
        morning:  "assets/bg/morning.jpeg",
        evening:  "assets/bg/evening.jpeg",
        evening02:"assets/bg/evening02.jpeg",
        night:    "assets/bg/night.jpeg",
        ocean:    "assets/bg/ocean.jpeg",
        space:    "assets/bg/space.jpeg",
        golden:   "assets/bg/golden.jpeg",
        minimal:  "assets/bg/minimal.jpeg"
    },
    fruits: {
        apple:        "assets/fruites/apple.png",
        banana:       "assets/fruites/banana.png",
        grapes:       "assets/fruites/grapes.png",
        black_grapes: "assets/fruites/black_grapes.png",
        green01:      "assets/fruites/green01.png",
        jackfruite:   "assets/fruites/jackfruite.png",
        kiwi:         "assets/fruites/kiwi.png",
        lemon:        "assets/fruites/lemon.png",
        muskmelon:    "assets/fruites/muskmelon.png",
        tomato:       "assets/fruites/tomato.png"
    },
    special: {
        apple:      "assets/special/apple.png",
        banana:     "assets/special/banana.png",
        coconut:    "assets/special/coconut.png",
        kiwi:       "assets/special/kiwi.png",
        pear:       "assets/special/pear.png",
        potato:     "assets/special/potato.png",
        watermelon: "assets/special/watermelon.png"
    },
    swords: {
        clasic:  "assets/sword/clasic.png",
        fire:    "assets/sword/fire.png",
        golden:  "assets/sword/golden.png",
        rainbow: "assets/sword/rainbow.png",
        shadow:  "assets/sword/shadow.png"
    },
    splash: {
        fire:     "assets/splash/fire.png",
        electric: "assets/splash/electric.png",
        golden:   "assets/splash/golden.png",
        ice:      "assets/splash/ice.png",
        rainbow:  "assets/splash/rainbow.png"
    }
};

// Special fruit -> power mapping
const SPECIAL_POWER = {
    apple:      "fire",      // explosion score bonus
    banana:     "electric",  // chain slash
    coconut:    "ice",       // slow motion
    kiwi:       "electric",
    pear:       "golden",    // 5x coins
    potato:     "bomb",      // instant game over
    watermelon: "rainbow"    // random power
};

const SWORD_PRICES = { clasic: 0, fire: 500, golden: 1000, rainbow: 2000, shadow: 5000 };
const SWORD_COLORS = {
    clasic:  ["#ffffff", "#cfd8dc"],
    fire:    ["#ff5722", "#ffeb3b"],
    golden:  ["#ffd700", "#fff59d"],
    rainbow: ["#ff0080", "#00e5ff"],
    shadow:  ["#7c4dff", "#212121"]
};

const BG_PRICES = {
    morning: 0, minimal: 100, evening: 250, ocean: 350,
    evening02: 500, golden: 700, night: 850, space: 1000
};

const ACHIEVEMENTS_LIST = [
    { id: "first_cut",        name: "First Cut",       desc: "Slice your first fruit",                 target: 1,     type: "fruits" },
    { id: "fruits_10",        name: "Fruit Nibbler",   desc: "Slice 10 fruits",                        target: 10,    type: "fruits" },
    { id: "fruits_50",        name: "Fruit Snacker",   desc: "Slice 50 fruits",                        target: 50,    type: "fruits" },
    { id: "fruits_100",       name: "100 Fruits",      desc: "Slice 100 fruits",                       target: 100,   type: "fruits" },
    { id: "fruits_250",       name: "Fruit Fanatic",   desc: "Slice 250 fruits",                       target: 250,   type: "fruits" },
    { id: "fruits_500",       name: "500 Fruits",      desc: "Slice 500 fruits",                       target: 500,   type: "fruits" },
    { id: "fruits_1000",      name: "1000 Fruits",     desc: "Slice 1000 fruits",                      target: 1000,  type: "fruits" },
    { id: "fruits_2500",      name: "Fruit Overlord",  desc: "Slice 2500 fruits",                      target: 2500,  type: "fruits" },
    { id: "fruits_5000",      name: "Fruit Deity",     desc: "Slice 5000 fruits",                      target: 5000,  type: "fruits" },
    { id: "fruits_10000",     name: "Endless Blade",   desc: "Slice 10000 fruits",                     target: 10000, type: "fruits" },
    { id: "combo_5",          name: "Combo Starter",   desc: "Reach a 5x combo",                       target: 5,     type: "combo" },
    { id: "combo_10",         name: "Combo Master",    desc: "Reach a 10x combo",                      target: 10,    type: "combo" },
    { id: "combo_15",         name: "Combo Expert",    desc: "Reach a 15x combo",                      target: 15,    type: "combo" },
    { id: "combo_20",         name: "Combo Legend",    desc: "Reach a 20x combo",                      target: 20,    type: "combo" },
    { id: "combo_30",         name: "Combo God",       desc: "Reach a 30x combo",                      target: 30,    type: "combo" },
    { id: "combo_50",         name: "Untouchable",     desc: "Reach a 50x combo",                      target: 50,    type: "combo" },
    { id: "coins_100",        name: "Pocket Change",   desc: "Earn 100 coins total",                   target: 100,   type: "coins" },
    { id: "coins_500",        name: "Piggy Bank",      desc: "Earn 500 coins total",                   target: 500,   type: "coins" },
    { id: "coins_1000",       name: "Coin Collector",  desc: "Earn 1000 coins total",                  target: 1000,  type: "coins" },
    { id: "coins_2500",       name: "Coin Stacker",    desc: "Earn 2500 coins total",                  target: 2500,  type: "coins" },
    { id: "coins_5000",       name: "Coin Hoarder",    desc: "Earn 5000 coins total",                  target: 5000,  type: "coins" },
    { id: "coins_10000",      name: "Coin Tycoon",     desc: "Earn 10000 coins total",                 target: 10000, type: "coins" },
    { id: "coins_25000",      name: "Coin Baron",      desc: "Earn 25000 coins total",                 target: 25000, type: "coins" },
    { id: "score_500",        name: "Rising Star",     desc: "Score 500 in one run",                   target: 500,   type: "score" },
    { id: "score_1000",       name: "Legend Slayer",   desc: "Score 1000 in one run",                  target: 1000,  type: "score" },
    { id: "score_2500",       name: "Blade Runner",    desc: "Score 2500 in one run",                  target: 2500,  type: "score" },
    { id: "score_5000",       name: "Ninja Master",    desc: "Score 5000 in one run",                  target: 5000,  type: "score" },
    { id: "score_10000",      name: "Ninja Legend",    desc: "Score 10000 in one run",                 target: 10000, type: "score" },
    { id: "score_20000",      name: "Immortal Ninja",  desc: "Score 20000 in one run",                 target: 20000, type: "score" },
    { id: "specials_5",       name: "Curious Cutter",  desc: "Slice 5 special fruits",                 target: 5,     type: "specials" },
    { id: "specials_10",      name: "Special Hunter",  desc: "Slice 10 special fruits",                target: 10,    type: "specials" },
    { id: "specials_25",      name: "Power Seeker",    desc: "Slice 25 special fruits",                target: 25,    type: "specials" },
    { id: "specials_50",      name: "Power Player",    desc: "Slice 50 special fruits",                target: 50,    type: "specials" },
    { id: "specials_100",     name: "Power Master",    desc: "Slice 100 special fruits",               target: 100,   type: "specials" },
    { id: "specials_250",     name: "Power Overlord",  desc: "Slice 250 special fruits",               target: 250,   type: "specials" },
    { id: "criticals_10",     name: "Sharp Eye",       desc: "Land 10 critical slashes",               target: 10,    type: "criticals" },
    { id: "criticals_50",     name: "Precision Ninja", desc: "Land 50 critical slashes",               target: 50,    type: "criticals" },
    { id: "criticals_100",    name: "Perfect Blade",   desc: "Land 100 critical slashes",              target: 100,   type: "criticals" },
    { id: "bombs_avoided_10", name: "Bomb Dodger",     desc: "Finish 10 runs without hitting a bomb",  target: 10,    type: "bombsAvoided" },
    { id: "bombs_avoided_25", name: "Bomb Defuser",    desc: "Finish 25 runs without hitting a bomb",  target: 25,    type: "bombsAvoided" },
    { id: "fire_10",          name: "Firestarter",     desc: "Trigger the Fire power 10 times",        target: 10,    type: "firePower" },
    { id: "ice_10",           name: "Ice Cold",        desc: "Trigger the Ice power 10 times",         target: 10,    type: "icePower" },
    { id: "electric_10",      name: "Live Wire",       desc: "Trigger the Electric power 10 times",    target: 10,    type: "electricPower" },
    { id: "golden_10",        name: "Midas Touch",     desc: "Trigger the Golden power 10 times",      target: 10,    type: "goldenPower" },
    { id: "rainbow_10",       name: "Prism Master",    desc: "Trigger the Rainbow power 10 times",     target: 10,    type: "rainbowPower" },
    { id: "sword_owner",      name: "Blade Collector", desc: "Own 3 swords",                           target: 3,     type: "swords" },
    { id: "sword_owner_all",  name: "Armory Complete", desc: "Own all 5 swords",                       target: 5,     type: "swords" },
    { id: "bg_owner",         name: "Scene Setter",    desc: "Own 3 backgrounds",                      target: 3,     type: "backgrounds" },
    { id: "bg_owner_all",     name: "World Traveler",  desc: "Own all 8 backgrounds",                  target: 8,     type: "backgrounds" },
    { id: "survivor_5",       name: "Getting Started", desc: "Play 5 game sessions",                   target: 5,     type: "sessions" },
    { id: "survivor",         name: "Survivor",        desc: "Play 20 game sessions",                  target: 20,    type: "sessions" },
    { id: "survivor_50",      name: "Dedicated Ninja", desc: "Play 50 game sessions",                  target: 50,    type: "sessions" },
    { id: "survivor_100",     name: "Ninja Veteran",   desc: "Play 100 game sessions",                 target: 100,   type: "sessions" },
    { id: "no_miss_run",      name: "Flawless Victory",desc: "Finish a run without missing a fruit",   target: 1,     type: "flawless" }
];

/* =====================================================================
   1. SAVE SYSTEM
===================================================================== */

const SaveSystem = {
    KEY: "fn_save_v1",
    data: null,
    defaults() {
        return {
            coins: 0,
            highscore: 0,
            totalFruitsSliced: 0,
            totalSpecialsSliced: 0,
            totalCoinsEarned: 0,
            bestCombo: 0,
            sessions: 0,
            totalCriticals: 0,
            bombRunsSurvived: 0,
            firePowerCount: 0,
            icePowerCount: 0,
            electricPowerCount: 0,
            goldenPowerCount: 0,
            rainbowPowerCount: 0,
            flawlessRuns: 0,
            settings: { sound: true, music: true, vibration: true },
            achievements: {}, // id -> progress
            achievementsUnlocked: {}, // id -> true
            ownedSwords: ["clasic"],
            equippedSword: "clasic",
            ownedBackgrounds: ["morning", "minimal"],
            equippedBackground: "morning"
        };
    },
    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.data = Object.assign(this.defaults(), parsed);
                this.data.settings = Object.assign(this.defaults().settings, parsed.settings || {});
            } else {
                this.data = this.defaults();
            }
        } catch (e) {
            console.error("SaveSystem load failed:", e);
            this.data = this.defaults();
        }
        return this.data;
    },
    save() {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error("SaveSystem save failed:", e);
        }
    },
    get() { return this.data; }
};

/* =====================================================================
   2. ASSET LOADER
===================================================================== */

class AssetLoader {
    constructor(manifest, onProgress, onComplete) {
        this.manifest = manifest;
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.images = {}; // category -> key -> Image
        this.total = 0;
        this.loaded = 0;
        this.failed = 0;
    }

    countAssets() {
        let count = 0;
        for (const cat in this.manifest) {
            count += Object.keys(this.manifest[cat]).length;
        }
        return count;
    }

    start() {
        this.total = this.countAssets();
        if (this.total === 0) {
            this.onComplete(this.images);
            return;
        }
        for (const cat in this.manifest) {
            this.images[cat] = {};
            const group = this.manifest[cat];
            for (const key in group) {
                this.loadOne(cat, key, group[key]);
            }
        }
    }

    loadOne(cat, key, src) {
        const img = new Image();
        img.onload = () => {
            this.loaded++;
            this.images[cat][key] = img;
            this.tick();
        };
        img.onerror = () => {
            console.error("Failed to load asset:", src);
            this.failed++;
            this.loaded++; // still counts toward progress so loader doesn't hang
            this.images[cat][key] = null;
            this.tick();
        };
        img.src = src;
    }

    tick() {
        const pct = Math.round((this.loaded / this.total) * 100);
        this.onProgress(this.loaded, this.total, pct);
        if (this.loaded >= this.total) {
            this.onComplete(this.images);
        }
    }
}

/* =====================================================================
   3. UTILITY FUNCTIONS
===================================================================== */

const Utils = {
    rand(min, max) { return Math.random() * (max - min) + min; },
    randInt(min, max) { return Math.floor(this.rand(min, max + 1)); },
    choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },
    clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
    lerp(a, b, t) { return a + (b - a) * t; },
    degToRad(d) { return d * Math.PI / 180; },
    lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2 - x1, dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        let t = lenSq === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
        t = this.clamp(t, 0, 1);
        const px = x1 + t * dx, py = y1 + t * dy;
        return this.dist(px, py, cx, cy) <= r;
    },
    vibrate(ms) {
        const s = SaveSystem.get();
        if (s && s.settings.vibration && navigator.vibrate) {
            try { navigator.vibrate(ms); } catch (e) {}
        }
    }
};

/* =====================================================================
   4. AUDIO SYSTEM (simple WebAudio synthesized SFX, no external files)
===================================================================== */

class AudioSystem {
    constructor() {
        this.ctx = null;
        this.musicGain = null;
        this.enabled = true;
    }
    ensureCtx() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) this.ctx = new AC();
        }
    }
    resume() {
        this.ensureCtx();
        if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }
    playTone(freq, duration, type, vol) {
        const s = SaveSystem.get();
        if (!s.settings.sound) return;
        this.ensureCtx();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type || "sine";
            osc.frequency.value = freq;
            gain.gain.value = vol !== undefined ? vol : 0.15;
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(gain.gain.value, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {}
    }
    slice() { this.playTone(Utils.rand(400, 700), 0.12, "triangle", 0.12); }
    combo() { this.playTone(Utils.rand(700, 1100), 0.15, "square", 0.1); }
    bomb() { this.playTone(90, 0.5, "sawtooth", 0.3); }
    miss() { this.playTone(200, 0.2, "sine", 0.1); }
    coin() { this.playTone(1200, 0.08, "square", 0.08); }
    powerup() { this.playTone(900, 0.3, "sine", 0.15); }
    click() { this.playTone(500, 0.06, "square", 0.08); }
    gameover() { this.playTone(150, 0.6, "sawtooth", 0.2); }
    achievement() { this.playTone(1300, 0.35, "triangle", 0.15); }
}

/* =====================================================================
   5. INPUT MANAGER (mouse + touch unified as pointer trail)
===================================================================== */

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.pointers = new Map(); // id -> {x,y,trail:[]}
        this.activeSlashes = [];
        this.down = false;

        canvas.addEventListener("mousedown", (e) => this.onDown(e, "mouse"));
        canvas.addEventListener("mousemove", (e) => this.onMove(e, "mouse"));
        window.addEventListener("mouseup", (e) => this.onUp("mouse"));

        canvas.addEventListener("touchstart", (e) => this.onTouch(e, "start"), { passive: false });
        canvas.addEventListener("touchmove", (e) => this.onTouch(e, "move"), { passive: false });
        canvas.addEventListener("touchend", (e) => this.onTouch(e, "end"), { passive: false });
        canvas.addEventListener("touchcancel", (e) => this.onTouch(e, "end"), { passive: false });
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    onDown(e, id) {
        this.down = true;
        const pos = this.getPos(e);
        this.pointers.set(id, { x: pos.x, y: pos.y, trail: [{ x: pos.x, y: pos.y, t: performance.now() }] });
    }
    onMove(e, id) {
        if (!this.pointers.has(id)) return;
        const pos = this.getPos(e);
        const p = this.pointers.get(id);
        const last = p.trail[p.trail.length - 1];
        if (last) this.emitSegment(last.x, last.y, pos.x, pos.y, id);
        p.x = pos.x; p.y = pos.y;
        p.trail.push({ x: pos.x, y: pos.y, t: performance.now() });
        if (p.trail.length > 12) p.trail.shift();
    }
    onUp(id) {
        this.pointers.delete(id);
    }
    onTouch(e, phase) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        for (const t of e.changedTouches) {
            const id = "t" + t.identifier;
            const pos = {
                x: (t.clientX - rect.left) * (this.canvas.width / rect.width),
                y: (t.clientY - rect.top) * (this.canvas.height / rect.height)
            };
            if (phase === "start") {
                this.down = true;
                this.pointers.set(id, { x: pos.x, y: pos.y, trail: [{ x: pos.x, y: pos.y, t: performance.now() }] });
            } else if (phase === "move") {
                if (!this.pointers.has(id)) continue;
                const p = this.pointers.get(id);
                const last = p.trail[p.trail.length - 1];
                if (last) this.emitSegment(last.x, last.y, pos.x, pos.y, id);
                p.x = pos.x; p.y = pos.y;
                p.trail.push({ x: pos.x, y: pos.y, t: performance.now() });
                if (p.trail.length > 12) p.trail.shift();
            } else {
                this.pointers.delete(id);
            }
        }
        if (this.pointers.size === 0) this.down = false;
    }

    emitSegment(x1, y1, x2, y2, id) {
        const dist = Utils.dist(x1, y1, x2, y2);
        if (dist < 1) return;
        this.activeSlashes.push({ x1, y1, x2, y2, id, life: 1 });
    }

    consumeSlashes() {
        const s = this.activeSlashes;
        this.activeSlashes = [];
        return s;
    }

    getAllTrails() {
        return Array.from(this.pointers.values());
    }
}

/* =====================================================================
   6. PARTICLE SYSTEM
===================================================================== */

class Particle {
    constructor(x, y, color, opts) {
        opts = opts || {};
        this.x = x; this.y = y;
        const angle = opts.angle !== undefined ? opts.angle : Utils.rand(0, Math.PI * 2);
        const speed = opts.speed !== undefined ? opts.speed : Utils.rand(80, 260);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = opts.gravity !== undefined ? opts.gravity : 500;
        this.color = color;
        this.size = opts.size || Utils.rand(3, 7);
        this.life = opts.life || Utils.rand(0.4, 0.9);
        this.maxLife = this.life;
        this.shrink = opts.shrink !== false;
    }
    update(dt) {
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        return this.life > 0;
    }
    draw(ctx) {
        const t = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = t;
        ctx.fillStyle = this.color;
        const size = this.shrink ? this.size * t : this.size;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class SplashEffect {
    constructor(x, y, img, tint) {
        this.x = x; this.y = y;
        this.img = img;
        this.tint = tint;
        this.scale = 0.2;
        this.alpha = 1;
        this.life = 0.6;
        this.maxLife = this.life;
        this.rotation = Utils.rand(0, Math.PI * 2);
    }
    update(dt) {
        this.life -= dt;
        this.scale = Utils.lerp(this.scale, 1.4, dt * 6);
        this.alpha = Math.max(0, this.life / this.maxLife);
        return this.life > 0;
    }
    draw(ctx) {
        if (!this.img) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        const w = this.img.width * 0.5 * this.scale;
        const h = this.img.height * 0.5 * this.scale;
        ctx.drawImage(this.img, -w / 2, -h / 2, w, h);
        ctx.restore();
    }
}

/* =====================================================================
   7. FRUIT ENTITIES
===================================================================== */

const FRUIT_KEYS = ["apple", "banana", "grapes", "black_grapes", "green01", "jackfruite", "kiwi", "lemon", "muskmelon", "tomato"];
const SPECIAL_KEYS = ["apple", "banana", "coconut", "kiwi", "pear", "potato", "watermelon"];

class Fruit {
    constructor(game, opts) {
        this.game = game;
        this.isSpecial = !!opts.isSpecial;
        this.key = opts.key;
        this.img = opts.img;
        this.sliced = false;
        this.missed = false;
        this.x = opts.x;
        this.y = opts.y;
        this.vx = opts.vx;
        this.vy = opts.vy;
        this.gravity = opts.gravity;
        this.rotation = Utils.rand(0, Math.PI * 2);
        this.rotationSpeed = Utils.rand(-4, 4);
        this.size = opts.size;
        this.radius = this.size * 0.38;
        this.sliceAngle = 0;
        this.halfA = null;
        this.halfB = null;
        this.isBomb = this.isSpecial && SPECIAL_POWER[this.key] === "bomb";
        this.power = this.isSpecial ? SPECIAL_POWER[this.key] : null;
    }

    update(dt) {
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotationSpeed * dt;
        if (this.sliced && this.halfA) {
            for (const h of [this.halfA, this.halfB]) {
                h.vy += this.gravity * dt;
                h.x += h.vx * dt;
                h.y += h.vy * dt;
                h.rotation += h.rotationSpeed * dt;
                h.alpha -= dt * 0.6;
            }
        }
    }

    isOffscreen(h) {
        return this.y - this.radius > h + 100;
    }

    slice(angle) {
        this.sliced = true;
        this.sliceAngle = angle;
        const spread = 140;
        this.halfA = {
            x: this.x, y: this.y,
            vx: this.vx + Math.cos(angle + Math.PI / 2) * spread * 0.5 - 40,
            vy: this.vy - 120,
            rotation: this.rotation, rotationSpeed: this.rotationSpeed - 2,
            alpha: 1, side: -1
        };
        this.halfB = {
            x: this.x, y: this.y,
            vx: this.vx + Math.cos(angle - Math.PI / 2) * spread * 0.5 + 40,
            vy: this.vy - 120,
            rotation: this.rotation, rotationSpeed: this.rotationSpeed + 2,
            alpha: 1, side: 1
        };
    }

    draw(ctx) {
        if (!this.img) return;
        if (!this.sliced) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            if (this.isSpecial) {
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.shadowColor = this.isBomb ? "#ff1744" : "#ffd54f";
                ctx.shadowBlur = 28;
                ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
            ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        } else {
            for (const h of [this.halfA, this.halfB]) {
                if (h.alpha <= 0) continue;
                ctx.save();
                ctx.globalAlpha = Math.max(0, h.alpha);
                ctx.translate(h.x, h.y);
                ctx.rotate(h.rotation);
                ctx.beginPath();
                ctx.rect(h.side < 0 ? -this.size / 2 : 0, -this.size / 2, this.size / 2, this.size);
                ctx.clip();
                ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }
    }
}

/* =====================================================================
   8. SCENE MANAGER (menu, shop, achievements, settings, game, pause, gameover)
===================================================================== */

class SceneManager {
    constructor(game) {
        this.game = game;
        this.current = "loading";
        this.root = document.getElementById("ui-root");
    }
    goto(name) {
        this.current = name;
        this.game.onSceneChange(name);
    }
}

/* =====================================================================
   9. MAIN GAME CLASS
===================================================================== */

class Game {
    constructor() {
        this.canvas = document.getElementById("game-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();
        window.addEventListener("resize", () => this.resize());
        window.addEventListener("orientationchange", () => this.resize());

        this.save = SaveSystem.load();
        this.audio = new AudioSystem();
        this.input = new InputManager(this.canvas);
        this.scenes = new SceneManager(this);

        this.images = null;
        this.state = "loading"; // loading, menu, shop, achievements, settings, playing, paused, gameover
        this.shopTab = "swords";

        this.lastTime = performance.now();
        this.accumulatedTime = 0;

        // gameplay state
        this.fruits = [];
        this.particles = [];
        this.splashes = [];
        this.floatingTexts = [];
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.combo = 0;
        this.comboTimer = 0;
        this.maxComboThisRun = 0;
        this.slicedThisRun = 0;
        this.specialsThisRun = 0;
        this.criticalsThisRun = 0;
        this.missedThisRun = 0;
        this.hitBombThisRun = false;
        this.spawnTimer = 0;
        this.spawnInterval = 1.1;
        this.difficultyTimer = 0;
        this.timeScale = 1;
        this.slowMoTimer = 0;
        this.shakeTime = 0;
        this.shakeMag = 0;
        this.flashAlpha = 0;
        this.flashColor = "255,255,255";
        this.gameOverReason = "";
        this.runStartTime = 0;

        this.ui = {};
        this.bindStaticUI();

        this.startLoading();
        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        const w = window.innerWidth, h = window.innerHeight;
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.width = w;
        this.height = h;
    }

    /* ---------------- LOADING ---------------- */

    startLoading() {
        const progressBar = document.getElementById("loading-progress-bar");
        const progressText = document.getElementById("loading-progress-text");
        const countText = document.getElementById("loading-count-text");

        const loader = new AssetLoader(
            ASSET_MANIFEST,
            (loaded, total, pct) => {
                if (progressBar) progressBar.style.width = pct + "%";
                if (progressText) progressText.textContent = pct + "%";
                if (countText) countText.textContent = loaded + " / " + total + " Loaded";
            },
            (images) => {
                this.images = images;
                setTimeout(() => {
                    document.getElementById("loading-screen").classList.add("hidden");
                    this.goto("menu");
                }, 300);
            }
        );
        loader.start();
    }

    /* ---------------- UI BINDING ---------------- */

    bindStaticUI() {
        const $ = (id) => document.getElementById(id);

        // Menu
        $("btn-play") && $("btn-play").addEventListener("click", () => { this.audio.click(); this.startGame(); });
        $("btn-shop") && $("btn-shop").addEventListener("click", () => { this.audio.click(); this.goto("shop"); });
        $("btn-achievements") && $("btn-achievements").addEventListener("click", () => { this.audio.click(); this.goto("achievements"); });
        $("btn-settings") && $("btn-settings").addEventListener("click", () => { this.audio.click(); this.goto("settings"); });

        // Shop
        $("shop-back") && $("shop-back").addEventListener("click", () => { this.audio.click(); this.goto("menu"); });
        $("shop-tab-swords") && $("shop-tab-swords").addEventListener("click", () => { this.shopTab = "swords"; this.renderShop(); });
        $("shop-tab-backgrounds") && $("shop-tab-backgrounds").addEventListener("click", () => { this.shopTab = "backgrounds"; this.renderShop(); });

        // Achievements
        $("achievements-back") && $("achievements-back").addEventListener("click", () => { this.audio.click(); this.goto("menu"); });

        // Settings
        $("settings-back") && $("settings-back").addEventListener("click", () => { this.audio.click(); this.goto("menu"); });
        $("toggle-sound") && $("toggle-sound").addEventListener("click", () => this.toggleSetting("sound"));
        $("toggle-music") && $("toggle-music").addEventListener("click", () => this.toggleSetting("music"));
        $("toggle-vibration") && $("toggle-vibration").addEventListener("click", () => this.toggleSetting("vibration"));

        // HUD / Pause
        $("btn-pause") && $("btn-pause").addEventListener("click", () => { this.audio.click(); this.pauseGame(); });
        $("pause-resume") && $("pause-resume").addEventListener("click", () => { this.audio.click(); this.resumeGame(); });
        $("pause-restart") && $("pause-restart").addEventListener("click", () => { this.audio.click(); this.startGame(); });
        $("pause-quit") && $("pause-quit").addEventListener("click", () => { this.audio.click(); this.goto("menu"); });

        // Game over
        $("gameover-again") && $("gameover-again").addEventListener("click", () => { this.audio.click(); this.startGame(); });
        $("gameover-menu") && $("gameover-menu").addEventListener("click", () => { this.audio.click(); this.goto("menu"); });

        document.addEventListener("touchmove", (e) => {
            if (e.target === this.canvas) e.preventDefault();
        }, { passive: false });
    }

    toggleSetting(key) {
        this.save.settings[key] = !this.save.settings[key];
        SaveSystem.save();
        this.renderSettings();
        this.audio.click();
    }

    /* ---------------- SCENE SWITCHING ---------------- */

    goto(name) {
        this.state = name;
        const screens = document.querySelectorAll(".screen");
        screens.forEach((s) => s.classList.add("hidden"));
        const map = {
            menu: "menu-screen",
            shop: "shop-screen",
            achievements: "achievements-screen",
            settings: "settings-screen",
            playing: "hud-screen",
            paused: "pause-screen",
            gameover: "gameover-screen"
        };
        if (name === "paused") {
            document.getElementById("hud-screen") && document.getElementById("hud-screen").classList.remove("hidden");
            document.getElementById("pause-screen") && document.getElementById("pause-screen").classList.remove("hidden");
            return;
        }
        const id = map[name];
        if (id) {
            const el = document.getElementById(id);
            if (el) el.classList.remove("hidden");
        }
        if (name === "shop") this.renderShop();
        if (name === "achievements") this.renderAchievements();
        if (name === "settings") this.renderSettings();
        if (name === "menu") this.applyMenuBackground();
    }

    onSceneChange() {}

    applyMenuBackground() {
        const menuBg = document.getElementById("menu-bg-canvas");
        // handled in render loop via this.state === 'menu'
    }

    /* ---------------- SHOP ---------------- */

    renderShop() {
        const container = document.getElementById("shop-items");
        if (!container) return;
        container.innerHTML = "";
        document.getElementById("shop-coins-text").textContent = this.save.coins;

        document.getElementById("shop-tab-swords").classList.toggle("active", this.shopTab === "swords");
        document.getElementById("shop-tab-backgrounds").classList.toggle("active", this.shopTab === "backgrounds");

        if (this.shopTab === "swords") {
            Object.keys(SWORD_PRICES).forEach((key) => {
                container.appendChild(this.makeShopCard({
                    key, price: SWORD_PRICES[key],
                    owned: this.save.ownedSwords.includes(key),
                    equipped: this.save.equippedSword === key,
                    imgSrc: ASSET_MANIFEST.swords[key],
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    onBuy: () => this.buySword(key),
                    onEquip: () => this.equipSword(key)
                }));
            });
        } else {
            Object.keys(BG_PRICES).forEach((key) => {
                container.appendChild(this.makeShopCard({
                    key, price: BG_PRICES[key],
                    owned: this.save.ownedBackgrounds.includes(key),
                    equipped: this.save.equippedBackground === key,
                    imgSrc: ASSET_MANIFEST.backgrounds[key],
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    onBuy: () => this.buyBackground(key),
                    onEquip: () => this.equipBackground(key)
                }));
            });
        }
    }

    makeShopCard(opts) {
        const card = document.createElement("div");
        card.className = "shop-card" + (opts.equipped ? " equipped" : "");
        const img = document.createElement("img");
        img.src = opts.imgSrc;
        img.className = "shop-card-img";
        const title = document.createElement("div");
        title.className = "shop-card-title";
        title.textContent = opts.label;
        const btn = document.createElement("button");
        btn.className = "shop-card-btn";
        if (opts.equipped) {
            btn.textContent = "EQUIPPED";
            btn.disabled = true;
        } else if (opts.owned) {
            btn.textContent = "EQUIP";
            btn.addEventListener("click", () => { this.audio.click(); opts.onEquip(); this.renderShop(); });
        } else if (opts.price === 0) {
            btn.textContent = "EQUIP";
            btn.addEventListener("click", () => { this.audio.click(); opts.onEquip(); this.renderShop(); });
        } else {
            btn.textContent = "LOCKED - " + opts.price;
            if (this.save.coins < opts.price) btn.classList.add("disabled");
            btn.addEventListener("click", () => {
                if (this.save.coins >= opts.price) {
                    this.audio.coin();
                    opts.onBuy();
                    this.renderShop();
                } else {
                    this.audio.miss();
                }
            });
        }
        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(btn);
        return card;
    }

    buySword(key) {
        const price = SWORD_PRICES[key];
        if (this.save.ownedSwords.includes(key) || this.save.coins < price) return;
        this.save.coins -= price;
        this.save.ownedSwords.push(key);
        this.checkAchievementProgress("swords", this.save.ownedSwords.length);
        SaveSystem.save();
    }
    equipSword(key) {
        if (!this.save.ownedSwords.includes(key)) return;
        this.save.equippedSword = key;
        SaveSystem.save();
    }
    buyBackground(key) {
        const price = BG_PRICES[key];
        if (this.save.ownedBackgrounds.includes(key) || this.save.coins < price) return;
        this.save.coins -= price;
        this.save.ownedBackgrounds.push(key);
        this.checkAchievementProgress("backgrounds", this.save.ownedBackgrounds.length);
        SaveSystem.save();
    }
    equipBackground(key) {
        if (!this.save.ownedBackgrounds.includes(key)) return;
        this.save.equippedBackground = key;
        SaveSystem.save();
    }

    /* ---------------- ACHIEVEMENTS ---------------- */

    renderAchievements() {
        const container = document.getElementById("achievements-list");
        if (!container) return;
        container.innerHTML = "";
        ACHIEVEMENTS_LIST.forEach((a) => {
            const progress = this.save.achievements[a.id] || 0;
            const unlocked = !!this.save.achievementsUnlocked[a.id];
            const pct = Utils.clamp(Math.round((progress / a.target) * 100), 0, 100);
            const row = document.createElement("div");
            row.className = "achievement-row" + (unlocked ? " unlocked" : "");
            row.innerHTML =
                '<div class="ach-info">' +
                '<div class="ach-name">' + a.name + (unlocked ? " ✓" : "") + '</div>' +
                '<div class="ach-desc">' + a.desc + '</div>' +
                '<div class="ach-bar-bg"><div class="ach-bar-fill" style="width:' + pct + '%"></div></div>' +
                '<div class="ach-progress">' + Math.min(progress, a.target) + ' / ' + a.target + '</div>' +
                '</div>';
            container.appendChild(row);
        });
    }

    checkAchievementProgress(type, value) {
        let unlockedAny = false;
        ACHIEVEMENTS_LIST.forEach((a) => {
            if (a.type !== type) return;
            const current = this.save.achievements[a.id] || 0;
            const newVal = Math.max(current, value);
            this.save.achievements[a.id] = newVal;
            if (newVal >= a.target && !this.save.achievementsUnlocked[a.id]) {
                this.save.achievementsUnlocked[a.id] = true;
                unlockedAny = true;
                this.showAchievementPopup(a);
            }
        });
        if (unlockedAny) SaveSystem.save();
    }

    showAchievementPopup(a) {
        this.audio.achievement();
        const popup = document.getElementById("achievement-popup");
        if (!popup) return;
        popup.querySelector(".ach-popup-name").textContent = a.name;
        popup.querySelector(".ach-popup-desc").textContent = a.desc;
        popup.classList.remove("hidden");
        popup.classList.add("show");
        clearTimeout(this._achPopupTimer);
        this._achPopupTimer = setTimeout(() => {
            popup.classList.remove("show");
            setTimeout(() => popup.classList.add("hidden"), 400);
        }, 2800);
    }

    /* ---------------- SETTINGS ---------------- */

    renderSettings() {
        const s = this.save.settings;
        const setToggle = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle("on", val);
            if (el) el.textContent = val ? "ON" : "OFF";
        };
        setToggle("toggle-sound", s.sound);
        setToggle("toggle-music", s.music);
        setToggle("toggle-vibration", s.vibration);
    }

    /* ---------------- GAME FLOW ---------------- */

    startGame() {
        this.audio.resume();
        this.fruits = [];
        this.particles = [];
        this.splashes = [];
        this.floatingTexts = [];
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.combo = 0;
        this.comboTimer = 0;
        this.maxComboThisRun = 0;
        this.slicedThisRun = 0;
        this.specialsThisRun = 0;
        this.criticalsThisRun = 0;
        this.missedThisRun = 0;
        this.hitBombThisRun = false;
        this.spawnTimer = 0;
        this.spawnInterval = 1.15;
        this.difficultyTimer = 0;
        this.timeScale = 1;
        this.slowMoTimer = 0;
        this.shakeTime = 0;
        this.flashAlpha = 0;
        this.runStartTime = performance.now();

        this.save.sessions++;
        this.checkAchievementProgress("sessions", this.save.sessions);
        SaveSystem.save();

        this.updateHUD();
        this.goto("playing");
    }

    pauseGame() {
        if (this.state !== "playing") return;
        this.goto("paused");
    }
    resumeGame() {
        this.goto("playing");
    }

    endGame(reason) {
        this.gameOverReason = reason;
        this.audio.gameover();
        Utils.vibrate(200);

        const earnedCoins = this.coins;
        this.save.coins += earnedCoins;
        this.save.totalCoinsEarned += earnedCoins;
        if (this.score > this.save.highscore) this.save.highscore = this.score;
        this.checkAchievementProgress("coins", this.save.totalCoinsEarned);
        this.checkAchievementProgress("score", this.score);

        if (!this.hitBombThisRun) {
            this.save.bombRunsSurvived++;
            this.checkAchievementProgress("bombsAvoided", this.save.bombRunsSurvived);
        }
        if (this.missedThisRun === 0 && this.slicedThisRun > 0) {
            this.save.flawlessRuns++;
            this.checkAchievementProgress("flawless", this.save.flawlessRuns);
        }
        SaveSystem.save();

        document.getElementById("gameover-final-score").textContent = this.score;
        document.getElementById("gameover-best-score").textContent = this.save.highscore;
        document.getElementById("gameover-coins-earned").textContent = earnedCoins;

        this.goto("gameover");
    }

    /* ---------------- SPAWNING ---------------- */

    spawnFruit() {
        const isSpecial = Math.random() < 0.12;
        const key = isSpecial ? Utils.choice(SPECIAL_KEYS) : Utils.choice(FRUIT_KEYS);
        const img = isSpecial ? this.images.special[key] : this.images.fruits[key];
        const w = this.width, h = this.height;
        const size = Utils.rand(70, 110) * (isSpecial ? 1.1 : 1);
        const x = Utils.rand(w * 0.15, w * 0.85);
        const targetX = Utils.rand(w * 0.3, w * 0.7);
        const vy = -Utils.rand(850, 1050) - this.difficultyBoost() * 20;
        const vx = (targetX - x) / 1.0 * 0.6;
        const gravity = 1500;

        const fruit = new Fruit(this, {
            key, img, isSpecial, x, y: h + size,
            vx, vy, gravity, size
        });
        this.fruits.push(fruit);
    }

    difficultyBoost() {
        return Math.min(this.difficultyTimer / 10, 15);
    }

    /* ---------------- SLICING LOGIC ---------------- */

    processSlashes(slashes) {
        if (slashes.length === 0) return;
        for (const f of this.fruits) {
            if (f.sliced) continue;
            for (const s of slashes) {
                if (Utils.lineCircleIntersect(s.x1, s.y1, s.x2, s.y2, f.x, f.y, f.radius)) {
                    const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
                    this.sliceFruit(f, angle, s);
                    break;
                }
            }
        }
    }
    /* NOTE: slashInfo (s) is forwarded into sliceFruit for critical-hit calculation. */

    sliceFruit(f, angle, slashInfo) {
        f.slice(angle);
        this.audio.slice();
        Utils.vibrate(15);

        if (f.isBomb) {
            this.hitBombThisRun = true;
            this.triggerBomb(f);
            return;
        }

        this.combo++;
        this.comboTimer = 1.1;
        this.maxComboThisRun = Math.max(this.maxComboThisRun, this.combo);
        this.slicedThisRun++;
        this.save.totalFruitsSliced++;
        this.checkAchievementProgress("fruits", this.save.totalFruitsSliced);
        this.checkAchievementProgress("combo", this.maxComboThisRun);
        if (this.save.bestCombo < this.maxComboThisRun) this.save.bestCombo = this.maxComboThisRun;

        const multiplier = 1 + Math.floor(this.combo / 5);
        const baseScore = f.isSpecial ? 25 : 10;

        // Critical slash: fast/long slashes near the fruit center grant a bonus
        let isCritical = false;
        if (slashInfo) {
            const slashLen = Utils.dist(slashInfo.x1, slashInfo.y1, slashInfo.x2, slashInfo.y2);
            const centerDist = Utils.lineCircleIntersect(slashInfo.x1, slashInfo.y1, slashInfo.x2, slashInfo.y2, f.x, f.y, f.radius * 0.35);
            if (slashLen > 90 || centerDist) isCritical = true;
        }

        let gained = baseScore * multiplier;
        if (isCritical) {
            gained = Math.round(gained * 1.5);
            this.criticalsThisRun++;
            this.save.totalCriticals++;
            this.checkAchievementProgress("criticals", this.save.totalCriticals);
            this.spawnFloatingText(f.x, f.y - 26, "CRITICAL!", "#ff1744");
            this.shake(4, 0.12);
        }
        this.score += gained;

        let coinGain = f.isSpecial ? 5 : 1;

        this.spawnJuiceParticles(f.x, f.y, f.isSpecial ? "#ffd700" : this.fruitColor(f.key));
        this.spawnFloatingText(f.x, f.y, "+" + gained, isCritical ? "#ff5252" : "#ffffff");

        if (this.combo > 0 && this.combo % 5 === 0) {
            this.audio.combo();
            this.spawnFloatingText(f.x, f.y - 40, this.combo + "x COMBO!", "#ffeb3b");
            this.shake(6, 0.2);
            this.checkLevelUp();
        }

        if (f.isSpecial) {
            this.specialsThisRun++;
            this.save.totalSpecialsSliced++;
            this.checkAchievementProgress("specials", this.save.totalSpecialsSliced);
            this.applyPower(f, coinGain);
        } else {
            this.coins += coinGain;
            this.spawnCoinFly(f.x, f.y, coinGain);
        }

        this.updateHUD();
    }

    checkLevelUp() {
        const level = Math.floor(this.combo / 5);
        if (level < 2) return;
        this.showLevelUpPopup(level);
    }

    showLevelUpPopup(level) {
        const popup = document.getElementById("levelup-popup");
        if (!popup) return;
        popup.querySelector(".levelup-text").textContent = "LEVEL " + level + " COMBO!";
        popup.classList.remove("hidden");
        popup.classList.add("show");
        clearTimeout(this._levelUpTimer);
        this._levelUpTimer = setTimeout(() => {
            popup.classList.remove("show");
            setTimeout(() => popup.classList.add("hidden"), 350);
        }, 900);
    }

    spawnCoinFly(x, y) {
        const target = document.getElementById("hud-coins");
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const coinEl = document.createElement("div");
        coinEl.className = "flying-coin";
        coinEl.style.left = x + "px";
        coinEl.style.top = y + "px";
        document.body.appendChild(coinEl);
        const dx = rect.left - x;
        const dy = rect.top - y;
        requestAnimationFrame(() => {
            coinEl.style.transform = "translate(" + dx + "px," + dy + "px) scale(0.3)";
            coinEl.style.opacity = "0";
        });
        setTimeout(() => coinEl.remove(), 650);
    }

    fruitColor(key) {
        const map = {
            apple: "#ff5252", banana: "#ffeb3b", grapes: "#8e24aa",
            black_grapes: "#4a148c", green01: "#66bb6a", jackfruite: "#ffa726",
            kiwi: "#9ccc65", lemon: "#fff176", muskmelon: "#ffca28", tomato: "#e53935"
        };
        return map[key] || "#ffffff";
    }

    applyPower(f, baseCoinGain) {
        let power = f.power;
        if (power === "rainbow") {
            power = Utils.choice(["fire", "ice", "electric", "golden"]);
        }
        const splashImg = this.images.splash[power === "fire" ? "fire" : power === "ice" ? "ice" : power === "electric" ? "electric" : "golden"];
        this.splashes.push(new SplashEffect(f.x, f.y, splashImg));

        switch (power) {
            case "fire":
                this.score += 100;
                this.coins += baseCoinGain;
                this.spawnFloatingText(f.x, f.y - 20, "EXPLOSION +100", "#ff5722");
                this.shake(10, 0.3);
                this.flash("255,87,34", 0.25);
                this.save.firePowerCount++;
                this.checkAchievementProgress("firePower", this.save.firePowerCount);
                break;
            case "ice":
                this.slowMoTimer = 5;
                this.coins += baseCoinGain;
                this.spawnFloatingText(f.x, f.y - 20, "SLOW MOTION", "#4fc3f7");
                this.flash("79,195,247", 0.2);
                this.save.icePowerCount++;
                this.checkAchievementProgress("icePower", this.save.icePowerCount);
                break;
            case "electric":
                this.coins += baseCoinGain;
                this.chainSlashNearby(f);
                this.spawnFloatingText(f.x, f.y - 20, "CHAIN SLASH", "#ffee58");
                this.flash("255,238,88", 0.2);
                this.save.electricPowerCount++;
                this.checkAchievementProgress("electricPower", this.save.electricPowerCount);
                break;
            case "golden":
                this.coins += baseCoinGain * 5;
                this.spawnFloatingText(f.x, f.y - 20, "5x COINS", "#ffd700");
                this.flash("255,215,0", 0.2);
                this.save.goldenPowerCount++;
                this.checkAchievementProgress("goldenPower", this.save.goldenPowerCount);
                break;
        }
        if (f.power === "rainbow") {
            this.save.rainbowPowerCount++;
            this.checkAchievementProgress("rainbowPower", this.save.rainbowPowerCount);
        }
        SaveSystem.save();
        this.audio.powerup();
    }

    chainSlashNearby(source) {
        const radius = 260;
        for (const f of this.fruits) {
            if (f === source || f.sliced) continue;
            if (Utils.dist(f.x, f.y, source.x, source.y) <= radius) {
                this.sliceFruit(f, Utils.rand(0, Math.PI * 2));
            }
        }
    }

    triggerBomb(f) {
        this.audio.bomb();
        Utils.vibrate([100, 50, 100]);
        this.spawnJuiceParticles(f.x, f.y, "#333333", 40);
        this.shake(20, 0.5);
        this.flash("0,0,0", 0.5);
        this.endGame("bomb");
    }

    missFruit(f) {
        if (f.isSpecial || f.isBomb) return; // missing specials/bombs has no penalty
        f.missed = true;
        this.missedThisRun++;
        this.lives--;
        this.combo = 0;
        this.audio.miss();
        this.updateHUD();
        if (this.lives <= 0) {
            this.endGame("lives");
        }
    }

    /* ---------------- VFX HELPERS ---------------- */

    spawnJuiceParticles(x, y, color, count) {
        count = count || 18;
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, { speed: Utils.rand(100, 320) }));
        }
    }

    spawnFloatingText(x, y, text, color) {
        this.floatingTexts.push({ x, y, text, color, life: 1, maxLife: 1 });
    }

    shake(mag, time) {
        this.shakeMag = Math.max(this.shakeMag, mag);
        this.shakeTime = Math.max(this.shakeTime, time);
    }

    flash(rgb, alpha) {
        this.flashColor = rgb;
        this.flashAlpha = Math.max(this.flashAlpha, alpha);
    }

    /* ---------------- HUD ---------------- */

    updateHUD() {
        const scoreEl = document.getElementById("hud-score");
        const comboEl = document.getElementById("hud-combo");
        const coinsEl = document.getElementById("hud-coins");
        const livesEl = document.getElementById("hud-lives");
        if (scoreEl) scoreEl.textContent = this.score;
        if (comboEl) comboEl.textContent = this.combo > 1 ? this.combo + "x" : "";
        if (coinsEl) coinsEl.textContent = this.coins;
        if (livesEl) livesEl.textContent = "❤".repeat(Math.max(0, this.lives));
    }

    /* ---------------- MAIN LOOP ---------------- */

    loop(now) {
        let dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        dt = Math.min(dt, 0.05);

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        if (this.state === "playing") {
            this.updateGame(dt);
        } else if (this.state === "menu") {
            this.menuTime = (this.menuTime || 0) + dt;
        }

        for (let i = this.splashes.length - 1; i >= 0; i--) {
            if (!this.splashes[i].update(dt)) this.splashes.splice(i, 1);
        }
    }

    updateGame(dt) {
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt;
            this.timeScale = 0.35;
        } else {
            this.timeScale = 1;
        }
        const gdt = dt * this.timeScale;

        this.difficultyTimer += dt;
        this.spawnTimer += dt;
        const interval = Math.max(0.45, this.spawnInterval - this.difficultyBoost() * 0.04);
        if (this.spawnTimer >= interval) {
            this.spawnTimer = 0;
            this.spawnFruit();
            if (Math.random() < Math.min(0.25, this.difficultyTimer / 60)) {
                this.spawnTimer = -0.2; // occasional double spawn
            }
        }

        const slashes = this.input.consumeSlashes();
        this.processSlashes(slashes);

        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const f = this.fruits[i];
            f.update(gdt);
            if (f.isOffscreen(this.height)) {
                if (!f.sliced) this.missFruit(f);
                this.fruits.splice(i, 1);
            } else if (f.sliced && f.halfA.alpha <= 0) {
                this.fruits.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(gdt)) this.particles.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 40 * dt;
            ft.life -= dt;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }

        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.updateHUD();
            }
        }

        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
        }
        if (this.flashAlpha > 0) {
            this.flashAlpha -= dt * 2;
            if (this.flashAlpha < 0) this.flashAlpha = 0;
        }
    }

    /* ---------------- RENDERING ---------------- */

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        let shakeX = 0, shakeY = 0;
        if (this.shakeTime > 0) {
            shakeX = Utils.rand(-this.shakeMag, this.shakeMag);
            shakeY = Utils.rand(-this.shakeMag, this.shakeMag);
        } else {
            this.shakeMag = 0;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        this.drawBackground(ctx);

        if (this.state === "playing" || this.state === "paused") {
            this.drawGameplay(ctx);
        } else if (this.state === "menu") {
            this.drawMenuDecor(ctx);
        }

        for (const s of this.splashes) s.draw(ctx);

        if (this.flashAlpha > 0) {
            ctx.fillStyle = "rgba(" + this.flashColor + "," + this.flashAlpha + ")";
            ctx.fillRect(-50, -50, this.width + 100, this.height + 100);
        }

        ctx.restore();

        this.drawSlashTrail(ctx);
    }

    drawBackground(ctx) {
        const bgKey = this.state === "menu" || this.state === "shop" || this.state === "achievements" || this.state === "settings"
            ? this.save.equippedBackground
            : this.save.equippedBackground;
        const img = this.images && this.images.backgrounds[bgKey];
        if (img) {
            const scale = Math.max(this.width / img.width, this.height / img.height);
            const w = img.width * scale, h = img.height * scale;
            const x = (this.width - w) / 2, y = (this.height - h) / 2;
            ctx.drawImage(img, x, y, w, h);
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            ctx.fillRect(0, 0, this.width, this.height);
        } else {
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    drawMenuDecor(ctx) {
        const t = this.menuTime || 0;
        const keys = FRUIT_KEYS;
        for (let i = 0; i < 6; i++) {
            const key = keys[i % keys.length];
            const img = this.images.fruits[key];
            if (!img) continue;
            const speed = 0.4 + (i % 3) * 0.15;
            const x = (this.width * ((i + 1) / 7)) + Math.sin(t * speed + i) * 30;
            const y = (this.height * 0.5) + Math.cos(t * speed * 1.3 + i) * (this.height * 0.3);
            const size = 60;
            ctx.save();
            ctx.globalAlpha = 0.85;
            ctx.translate(x, y);
            ctx.rotate(t * speed + i);
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
            ctx.restore();
        }
    }

    drawGameplay(ctx) {
        for (const f of this.fruits) f.draw(ctx);
        for (const p of this.particles) p.draw(ctx);

        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.life);
            ctx.fillStyle = ft.color;
            ctx.font = "bold 32px 'Arial', sans-serif";
            ctx.textAlign = "center";
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.lineWidth = 4;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    drawSlashTrail(ctx) {
        if (this.state !== "playing") return;
        const trails = this.input.getAllTrails();
        if (trails.length === 0) return;

        const swordKey = this.save.equippedSword;
        const colors = SWORD_COLORS[swordKey] || SWORD_COLORS.clasic;
        const swordImg = this.images.swords[swordKey];

        for (const trail of trails) {
            const pts = trail.trail;
            if (pts.length < 2) continue;

            ctx.save();
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (let i = 1; i < pts.length; i++) {
                const t = i / pts.length;
                ctx.strokeStyle = colors[0];
                ctx.globalAlpha = t * 0.9;
                ctx.lineWidth = 14 * t;
                ctx.beginPath();
                ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
                ctx.lineTo(pts[i].x, pts[i].y);
                ctx.stroke();

                ctx.strokeStyle = colors[1];
                ctx.globalAlpha = t * 0.6;
                ctx.lineWidth = 6 * t;
                ctx.stroke();
            }
            ctx.restore();

            if (swordImg && pts.length >= 2) {
                const last = pts[pts.length - 1];
                const prev = pts[pts.length - 2];
                const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
                ctx.save();
                ctx.translate(last.x, last.y);
                ctx.rotate(angle + Math.PI / 4);
                const sw = 70;
                const sh = swordImg.height * (sw / swordImg.width);
                ctx.drawImage(swordImg, -sw * 0.15, -sh * 0.85, sw, sh);
                ctx.restore();
            }
        }
    }
}

/* =====================================================================
   10. BOOTSTRAP
===================================================================== */

window.addEventListener("DOMContentLoaded", () => {
    window.__game = new Game();
});

})();
