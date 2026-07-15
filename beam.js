import { CONFIG } from './utils.js';

export class BeamRenderer {
    constructor() {
        this.timeCounter = 0;
        this.beamImage = new Image();
        this.beamImage.src = './assets/images/beam_sprite.png';
        this.isImageLoaded = false;

        this.beamImage.onload = () => {
            this.isImageLoaded = true;
        };
    }

    renderEnergyMatrix(ctx, leftHand, rightHand) {
        if (!this.isImageLoaded) return; // Fail-safe: Jab tak image load na ho, loop crash na ho

        const fingerTips = [4, 8, 12, 16, 20];
        const fingerHues = [280, 200, 120, 35, 0]; // Rainbow spectrum colors
        
        const rSpeed = CONFIG.rainbowSpeed || 1.5;
        this.timeCounter += 0.2 * rSpeed;

        if (leftHand && rightHand) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';

            fingerTips.forEach((index, i) => {
                const ptL = leftHand[index];
                const ptR = rightHand[index];

                if (ptL && ptR) {
                    const p1 = { x: ptL.x * ctx.canvas.width, y: ptL.y * ctx.canvas.height };
                    const p2 = { x: ptR.x * ctx.canvas.width, y: ptR.y * ctx.canvas.height };

                    this.drawTexturedBeam(ctx, p1, p2, fingerHues[i]);
                }
            });

            ctx.restore();
        }
    }

    drawTexturedBeam(ctx, p1, p2, hue) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 15) return; // Bohot paas aane par rendering lock

        const angle = Math.atan2(dy, dx);
        const thickness = CONFIG.beamThickness || 6;

        // REALISTIC FLICKER MECHANISM: Har frame me beam ki height micro-level par dynamically vibrate karegi
        const flickerFactor = 0.85 + Math.sin(this.timeCounter * 5 + Math.random()) * 0.15;
        const beamHeight = thickness * 7 * flickerFactor;

        ctx.save();
        
        // 1. POSITIONING & ROTATION MATRIX: Dono fingertips ke coordinates par lock aur scale
        ctx.translate(p1.x, p1.y);
        ctx.rotate(angle);

        // 2. LIVE DYNAMIC COLOR SHIFT: Canvas engine real-time me white core ko preserve karke hue-rotate karega
        // Default cyan/blue image ko exact finger-specific color me live convert karega
        const targetHueShift = (hue - 200 + 360) % 360; // 200 base asset color offset adjustment
        ctx.filter = `hue-rotate(${targetHueShift}deg) saturate(1.5) brightness(1.1)`;
        ctx.globalAlpha = 0.85; // Natural environment blending opacity

        // 3. IMAGE STRETCHING OPERATION: Dono fingers ke beech image ko tight rubber band look dena
        // Image center pivot setup taaki displacement zero ho
        ctx.drawImage(
            this.beamImage, 
            0, 
            -beamHeight / 2, 
            distance, 
            beamHeight
        );

        ctx.restore();
    }
}