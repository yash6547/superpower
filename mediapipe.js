import { CONFIG, ExponentialSmoothingFilter } from './utils.js';

export class MediaPipeManager {
    constructor(videoElement, onResultsCallback) {
        this.videoElement = videoElement;
        this.onResultsCallback = onResultsCallback;
        this.handsEngine = null;
        this.cameraUtilsInstance = null;
        this.isProcessingHalted = false;

        // Filter ko thoda aur heavy kiya smooth tracking ke liye bina lag ke
        this.smoothFilters = {
            Left: Array.from({ length: 21 }, () => new ExponentialSmoothingFilter(0.35)),
            Right: Array.from({ length: 21 }, () => new ExponentialSmoothingFilter(0.35))
        };
    }

    async initializePipeline() {
        if (typeof window.Hands === 'undefined') {
            throw new Error("MediaPipe library not loaded.");
        }

        this.handsEngine = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        // HACK: Yahan model complexity ko balanced kiya aur confidence parameters ko force kiya GPU ke liye
        this.handsEngine.setOptions({
            maxNumHands: 2,
            modelComplexity: 0, // 1 se 0 kiya, tracking fast hogi aur jitter khatam ho jayega
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.handsEngine.onResults((results) => {
            if (this.isProcessingHalted) return;
            const parsedHands = this.preprocessTrackingCoordinates(results);
            this.onResultsCallback(parsedHands);
        });

        await this.startCameraCapture();
    }

    async startCameraCapture() {
        if (this.cameraUtilsInstance) {
            await this.cameraUtilsInstance.stop();
        }

        // Cam resolution drop kiya background engine ke liye taaki calculation fast ho
        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user"
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = stream;
        } catch (err) {
            this.videoElement.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        this.cameraUtilsInstance = new window.Camera(this.videoElement, {
            onFrame: async () => {
                if (!this.isProcessingHalted) {
                    // Direct feed optimize logic
                    await this.handsEngine.send({ image: this.videoElement });
                }
            },
            width: 640,
            height: 480
        });

        await this.cameraUtilsInstance.start();
    }

    preprocessTrackingCoordinates(results) {
        const output = { Left: null, Right: null };
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            return output;
        }

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const rawLandmarks = results.multiHandLandmarks[i];
            const classification = results.multiHandedness[i];
            
            let handedness = classification.label; 
            if (CONFIG.mirrorMode) {
                handedness = handedness === 'Left' ? 'Right' : 'Left';
            }

            const smoothedLandmarks = rawLandmarks.map((lm, idx) => {
                let initialX = lm.x;
                if (CONFIG.mirrorMode) {
                    initialX = 1 - initialX;
                }
                
                const smoothPoint = this.smoothFilters[handedness][idx].filter(initialX, lm.y);
                return {
                    x: smoothPoint.x,
                    y: smoothPoint.y,
                    z: lm.z
                };
            });

            output[handedness] = smoothedLandmarks;
        }

        if (!output.Left) this.smoothFilters.Left.forEach(f => f.reset());
        if (!output.Right) this.smoothFilters.Right.forEach(f => f.reset());

        return output;
    }

    async changeResolution() {
        await this.startCameraCapture();
    }

    async updateCameraDevice(deviceId) {
        CONFIG.activeCameraId = deviceId;
        await this.startCameraCapture();
    }

    pause() {
        this.isProcessingHalted = true;
        this.videoElement.pause();
    }

    resume() {
        this.isProcessingHalted = false;
        this.videoElement.play();
    }
}