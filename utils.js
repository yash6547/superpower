export const CONFIG = {
    powerMode: "neon-laser",
    beamThickness: 6,
    glowIntensity: 25,
    beamOpacity: 0.85,
    rainbowSpeed: 1.5,
    lightningIntensity: 0,
    portalToggle: false,
    particleCount: 0,
    particleSize: 0,
    particleSpeed: 0,
    trailLength: 0.1,
    fpsLimit: 60,
    bgBrightness: 15,
    mirrorMode: true,
    audioEnable: false,
    resolution: "640x480",
    activeCameraId: ""
};

export class ExponentialSmoothingFilter {
    constructor(alpha = 0.38) {
        this.alpha = alpha;
        this.storedX = null;
        this.storedY = null;
    }

    filter(x, y) {
        if (this.storedX === null || this.storedY === null) {
            this.storedX = x;
            this.storedY = y;
            return { x, y };
        }
        this.storedX = this.alpha * x + (1 - this.alpha) * this.storedX;
        this.storedY = this.alpha * y + (1 - this.alpha) * this.storedY;
        return { x: this.storedX, y: this.storedY };
    }

    reset() {
        this.storedX = null;
        this.storedY = null;
    }
}

export function getDistance2D(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export const SoundEngine = {
    init() {},
    setHumVolume() {},
    triggerSpark() {},
    triggerExplosion() {}
};