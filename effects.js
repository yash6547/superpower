import { CONFIG, SoundEngine } from './utils.js';

export class SpecialEffectsEngine {
    constructor() {
        this.portalRotation = 0;
    }

    /**
     * Standard point explosion triggered on thumb contact bounds
     */
    renderExplosion(ctx, x, y, hue) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Draw main expanding core flash rings
        const pulseGradient = ctx.createRadialGradient(x, y, 2, x, y, 75);
        pulseGradient.addColorStop(0, '#ffffff');
        pulseGradient.addColorStop(0.2, `hsla(${hue}, 100%, 60%, 0.8)`);
        pulseGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = pulseGradient;
        ctx.beginPath();
        ctx.arc(x, y, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draws a continuous laser beam between index fingers
     */
    renderHighIntensityLaser(ctx, p1, p2, hue) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.shadowBlur = CONFIG.glowIntensity * 1.5;
        ctx.shadowColor = `hsla(${hue}, 100%, 50%, 1.0)`;

        // Outer glow path
        ctx.lineWidth = CONFIG.beamThickness * 3.5;
        ctx.strokeStyle = `hsla(${hue}, 100% , 55%, 0.3)`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Inner solid white hot discharge core
        ctx.lineWidth = CONFIG.beamThickness * 1.2;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = CONFIG.glowIntensity * 0.4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Plasma energy sphere system
     */
    renderPlasmaSphere(ctx, x, y, radius, globalTime) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Base sphere core gradient layout
        ctx.shadowBlur = CONFIG.glowIntensity * 1.2;
        const sphereHue = (globalTime * 40) % 360;
        ctx.shadowColor = `hsla(${sphereHue}, 100%, 50%, 0.8)`;

        const coreGrad = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.3, `hsla(${sphereHue}, 100%, 65%, 0.7)`);
        coreGrad.addColorStop(0.8, `hsla(${(sphereHue + 40) % 360}, 100%, 40%, 0.3)`);
        coreGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Internally animated internal arcs
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = `hsla(${(sphereHue - 20 + i * 20) % 360}, 100%, 75%, 0.8)`;
            ctx.beginPath();
            
            let angleStart = (globalTime * 3) + (i * Math.PI / 2);
            let cx1 = x + Math.cos(angleStart) * radius * 0.5;
            let cy1 = y + Math.sin(angleStart) * radius * 0.5;
            let cx2 = x + Math.cos(angleStart + Math.PI) * radius * 0.5;
            let cy2 = y + Math.sin(angleStart + Math.PI) * radius * 0.5;
            
            ctx.moveTo(x + Math.cos(angleStart) * radius * 0.8, y + Math.sin(angleStart) * radius * 0.8);
            ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x + Math.cos(angleStart + Math.PI * 1.2) * radius * 0.8, y + Math.sin(angleStart + Math.PI * 1.2) * radius * 0.8);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    /**
     * Doctor Strange Portal System
     */
    renderMysticPortal(ctx, x, y, radius, globalTime) {
        this.portalRotation += 0.015;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 1. Draw heavy background atmospheric glow rings
        ctx.shadowBlur = CONFIG.glowIntensity * 1.4;
        ctx.shadowColor = 'rgba(255, 90, 0, 0.7)';
        
        ctx.strokeStyle = 'rgba(255, 70, 0, 0.25)';
        ctx.lineWidth = radius * 0.25;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Draw rotating magical runic boundaries
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.portalRotation);
        
        ctx.strokeStyle = 'rgba(255, 120, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        
        // Outer concentric hex frame
        ctx.beginPath();
        for(let i=0; i<12; i++){
            const angle = (i * Math.PI) / 6;
            const targetX = Math.cos(angle) * radius;
            const targetY = Math.sin(angle) * radius;
            if(i === 0) ctx.moveTo(targetX, targetY);
            else ctx.lineTo(targetX, targetY);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner rune ring layout hashes
        ctx.strokeStyle = 'rgba(255, 160, 0, 0.6)';
        ctx.lineWidth = 2;
        for(let a=0; a<24; a++) {
            const rot = (a * Math.PI) / 12;
            ctx.beginPath();
            ctx.moveTo(Math.cos(rot) * (radius - 15), Math.sin(rot) * (radius - 15));
            ctx.lineTo(Math.cos(rot) * (radius - 2), Math.sin(rot) * (radius - 2));
            ctx.stroke();
        }
        ctx.restore();

        // 3. Spitting tangential sparks sparks discharge array generator
        if(Math.random() > 0.15) {
            const sparkCount = 2 + Math.floor(Math.random() * 4);
            ctx.lineWidth = 2 + Math.random() * 2;
            ctx.shadowBlur = 4;
            
            for(let s=0; s<sparkCount; s++) {
                const sparkAngle = Math.random() * Math.PI * 2;
                const dev = Math.random() * 0.4 - 0.2;
                const startRadius = radius + (Math.random() * 6 - 3);
                
                const sX = x + Math.cos(sparkAngle) * startRadius;
                const sY = y + Math.sin(sparkAngle) * startRadius;
                
                ctx.strokeStyle = `rgba(255, ${140 + Math.floor(Math.random() * 115)}, 0, ${0.4 + Math.random() * 0.6})`;
                ctx.beginPath();
                ctx.moveTo(sX, sY);
                ctx.lineTo(sX + Math.cos(sparkAngle + Math.PI/2 + dev) * (15 + Math.random()*25), sY + Math.sin(sparkAngle + Math.PI/2 + dev) * (15 + Math.random()*25));
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}