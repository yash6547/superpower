import { CONFIG, getDistance2D } from './utils.js';
import { MediaPipeManager } from './mediapipe.js';
import { BeamRenderer } from './beam.js';
import { OrbRenderer } from './orbs.js';
import { SpecialEffectsEngine } from './effects.js';
import { UIController } from './ui.js';

class CoreVFXEngine {
    constructor() {
        this.vfxCanvas = document.getElementById('vfx-canvas');
        this.vfxCtx = this.vfxCanvas.getContext('2d');
        this.bgCanvas = document.getElementById('bg-canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.webcamElement = document.getElementById('webcam');

        this.mpManager = new MediaPipeManager(this.webcamElement, this.handleTrackingResults.bind(this));
        this.ui = new UIController(this.mpManager);
        this.beams = new BeamRenderer();
        this.orbs = new OrbRenderer(); // [STEP 1 ACTIVE]
        this.fx = new SpecialEffectsEngine();

        this.trackedHands = { Left: null, Right: null };
        this.globalTime = 0;
        this.lastFrameTimestamp = 0;
        this.fpsFrameCount = 0;
        this.fpsLastMeasuredTime = performance.now();
        this.measuredFps = 0;
    }

    async bootstrap() {
        const powerDropdown = document.getElementById('power-mode');
        powerDropdown.addEventListener('change', (e) => {
            CONFIG.powerMode = e.target.value;
            this.ui.showSystemAlert(`MODE CHANGED // ${CONFIG.powerMode.toUpperCase()}`);
        });

        this.ui.initializeUIHooks();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        try {
            await this.mpManager.initializePipeline();
            this.ui.showSystemAlert("SYS LIGHTNING MATRIX ONLINE");
            requestAnimationFrame((t) => this.renderLoop(t));
        } catch(error) {
            this.ui.showSystemAlert("HARDWARE INITIALIZATION ERROR");
        }
    }

    handleResize() {
        this.vfxCanvas.width = window.innerWidth;
        this.vfxCanvas.height = window.innerHeight;
        this.bgCanvas.width = window.innerWidth;
        this.bgCanvas.height = window.innerHeight;
    }

    handleTrackingResults(handsData) {
        this.trackedHands = handsData;
    }

    renderLoop(currentTimestamp) {
        if(CONFIG.mirrorMode) {
            this.webcamElement.classList.remove('no-mirror');
        } else {
            this.webcamElement.classList.add('no-mirror');
        }

        const elapsed = currentTimestamp - this.lastFrameTimestamp;
        if (elapsed < 1000 / CONFIG.fpsLimit) {
            requestAnimationFrame((t) => this.renderLoop(t));
            return;
        }
        this.lastFrameTimestamp = currentTimestamp - (elapsed % (1000 / CONFIG.fpsLimit));
        this.globalTime = currentTimestamp / 1000;

        this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        this.vfxCtx.clearRect(0, 0, this.vfxCanvas.width, this.vfxCanvas.height);

        const left = this.trackedHands.Left;
        const right = this.trackedHands.Right;

        if (left && right) {
            const ctx = this.vfxCtx;
            const wristL = { x: left[0].x * ctx.canvas.width, y: left[0].y * ctx.canvas.height };
            const wristR = { x: right[0].x * ctx.canvas.width, y: right[0].y * ctx.canvas.height };
            const midpoint = { x: (wristL.x + wristR.x) / 2, y: (wristL.y + wristR.y) / 2 };
            const absoluteHandDistance = Math.hypot(wristR.x - wristL.x, wristR.y - wristL.y);

            if (CONFIG.powerMode === "plasma-shield") {
                this.fx.renderPlasmaSphere(ctx, midpoint.x, midpoint.y, Math.max(70, absoluteHandDistance * 0.4), this.globalTime);
            } 
            else if (CONFIG.powerMode === "doctor-strange") {
                this.fx.renderMysticPortal(ctx, midpoint.x, midpoint.y, Math.max(90, absoluteHandDistance * 0.45), this.globalTime);
            } 
            else {
                this.beams.renderEnergyMatrix(ctx, left, right, this.globalTime);
                this.orbs.renderOrbs(ctx, left, right); // [STEP 2 ACTIVE - BOTH HANDS]
            }
        } 
        else if (left || right) {
            this.orbs.renderOrbs(this.vfxCtx, left, right); // [STEP 2 ACTIVE - SINGLE HAND]
        }

        this.fpsFrameCount++;
        const now = performance.now();
        if (now >= this.fpsLastMeasuredTime + 1000) {
            this.measuredFps = (this.fpsFrameCount * 1000) / (now - this.fpsLastMeasuredTime);
            this.fpsFrameCount = 0;
            this.fpsLastMeasuredTime = now;
        }
        this.ui.updatePerformanceMetrics(this.measuredFps, this.measuredFps, 0, 0);

        requestAnimationFrame((t) => this.renderLoop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const applicationInstance = new CoreVFXEngine();
    applicationInstance.bootstrap();
});