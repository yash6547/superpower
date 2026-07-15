import { CONFIG } from './utils.js';

export class UIController {
    constructor(mediaPipeManagerInstance) {
        this.mpManager = mediaPipeManagerInstance;
        this.isMenuExpanded = false;
        
        this.toggleBtn = document.getElementById('toggle-settings');
        this.scrollArea = document.getElementById('settings-scroll-area');
        this.fpsVal = document.getElementById('fps-val');
        this.alertBanner = document.getElementById('gesture-alert');
        this.btnFullscreen = document.getElementById('btn-fullscreen');
        this.alertTimeout = null;
    }

    initializeUIHooks() {
        this.bindMenuControls();
        this.bindSliders();
    }

    bindMenuControls() {
        if (this.toggleBtn && this.scrollArea) {
            this.toggleBtn.addEventListener('click', () => {
                this.isMenuExpanded = !this.isMenuExpanded;
                if (this.isMenuExpanded) this.scrollArea.classList.remove('collapsed');
                else this.scrollArea.classList.add('collapsed');
            });
        }

        if (this.btnFullscreen) {
            this.btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                    this.btnFullscreen.textContent = "EXIT FULLSCREEN";
                } else {
                    document.exitFullscreen().catch(() => {});
                    this.btnFullscreen.textContent = "FULLSCREEN";
                }
            });
        }

        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.reload();
            });
        }
    }

    bindSliders() {
        const mappings = [
            { id: 'beam-thickness', prop: 'beamThickness', isFloat: false },
            { id: 'glow-intensity', prop: 'glowIntensity', isFloat: false }
        ];

        mappings.forEach(({ id, prop, isFloat }) => {
            const el = document.getElementById(id);
            const valSpan = document.getElementById(`v-${id}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    CONFIG[prop] = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                    if (valSpan) valSpan.textContent = e.target.value;
                });
            }
        });

        const mirrorCheck = document.getElementById('mirror-mode');
        if (mirrorCheck) {
            mirrorCheck.addEventListener('change', (e) => {
                CONFIG.mirrorMode = e.target.checked;
            });
        }

        const powerModeSelect = document.getElementById('power-mode');
        if (powerModeSelect) {
            powerModeSelect.addEventListener('change', (e) => {
                CONFIG.powerMode = e.target.value;
                this.showSystemAlert(`MODE CHANGED // ${CONFIG.powerMode.toUpperCase()}`);
            });
        }
    }

    showSystemAlert(message) {
        if (!this.alertBanner) return;
        if (this.alertTimeout) clearTimeout(this.alertTimeout);
        this.alertBanner.textContent = `SYS_ALERT: ${message}`;
        this.alertBanner.classList.remove('hidden');
        this.alertTimeout = setTimeout(() => this.alertBanner.classList.add('hidden'), 2000);
    }

    updatePerformanceMetrics(fps) {
        if (this.fpsVal) {
            this.fpsVal.textContent = String(Math.round(fps)).padStart(2, '0');
        }
    }
}