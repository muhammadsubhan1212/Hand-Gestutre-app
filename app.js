// ===== AirFrame - Gesture-Controlled Photo Studio =====
// Main Application JavaScript

class AirFrameApp {
    constructor() {
        // DOM Elements
        this.video = document.getElementById('cameraVideo');
        this.mainCanvas = document.getElementById('mainCanvas');
        this.overlayCanvas = document.getElementById('overlayCanvas');
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.overlayCtx = this.overlayCanvas.getContext('2d');

        // State
        this.currentCamera = 'user'; // 'user' or 'environment'
        this.stream = null;
        this.hands = null;
        this.camera = null;

        // Gesture state
        this.currentGesture = null;
        this.gestureStartTime = null;
        this.gestureDuration = 0;
        this.lastHandPosition = null;
        this.swipeStartPosition = null;

        // Photo/Video state
        this.photos = [];
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingStartTime = null;

        // Filter state
        this.filters = ['none', 'grayscale', 'sepia', 'vintage', 'colorPop', 'beauty'];
        this.currentFilterIndex = 0;

        // Settings
        this.settings = {
            timerDuration: 3,
            gestureSensitivity: 5,
            voiceFeedback: false,
            highContrastMode: false,
            showHandTracking: true,
            showCompositionGuides: false
        };

        // Photo booth mode
        this.photoBoothMode = false;
        this.photoBoothCount = 0;
        this.photoBoothPhotos = [];

        // Zoom
        this.zoomLevel = 1;

        this.init();
    }

    async init() {
        try {
            // Initialize camera
            await this.initCamera();

            // Initialize MediaPipe Hands
            await this.initMediaPipeHands();

            // Setup event listeners
            this.setupEventListeners();

            // Hide loading screen
            document.getElementById('loadingScreen').classList.add('hidden');

            this.showToast('AirFrame initialized successfully!', 'success');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Failed to initialize: ' + error.message, 'error');
        }
    }

    async initCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;

            // Wait for video metadata to load
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve();
                };
            });

            // Set canvas sizes
            this.mainCanvas.width = this.video.videoWidth;
            this.mainCanvas.height = this.video.videoHeight;
            this.overlayCanvas.width = this.video.videoWidth;
            this.overlayCanvas.height = this.video.videoHeight;

            // Start rendering loop
            this.renderLoop();

        } catch (error) {
            console.error('Camera initialization error:', error);
            throw new Error('Camera access denied or unavailable');
        }
    }

    async initMediaPipeHands() {
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => this.onHandsResults(results));

        // Start processing
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                await this.hands.send({ image: this.video });
            },
            width: 1280,
            height: 720
        });

        this.camera.start();
    }

    renderLoop() {
        // Draw video frame with current filter
        this.mainCtx.save();

        // Apply zoom
        const scaledWidth = this.video.videoWidth * this.zoomLevel;
        const scaledHeight = this.video.videoHeight * this.zoomLevel;
        const offsetX = (this.video.videoWidth - scaledWidth) / 2;
        const offsetY = (this.video.videoHeight - scaledHeight) / 2;

        this.mainCtx.drawImage(
            this.video,
            offsetX / this.zoomLevel,
            offsetY / this.zoomLevel,
            this.video.videoWidth / this.zoomLevel,
            this.video.videoHeight / this.zoomLevel,
            0,
            0,
            this.video.videoWidth,
            this.video.videoHeight
        );

        // Apply filter
        this.applyFilter();

        this.mainCtx.restore();

        requestAnimationFrame(() => this.renderLoop());
    }

    applyFilter() {
        const filterName = this.filters[this.currentFilterIndex];

        if (filterName === 'none') return;

        const imageData = this.mainCtx.getImageData(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        const data = imageData.data;

        switch (filterName) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    data[i] = data[i + 1] = data[i + 2] = gray;
                }
                break;

            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
                }
                break;

            case 'vintage':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    data[i] = Math.min(255, r * 1.2);
                    data[i + 1] = Math.min(255, g * 1.1);
                    data[i + 2] = Math.min(255, b * 0.8);
                }
                // Add grain
                for (let i = 0; i < data.length; i += 4) {
                    const noise = (Math.random() - 0.5) * 25;
                    data[i] += noise;
                    data[i + 1] += noise;
                    data[i + 2] += noise;
                }
                break;

            case 'colorPop':
                // Keep reds, desaturate others
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    if (r > g + 30 && r > b + 30) {
                        // Keep reds vibrant
                        data[i] = Math.min(255, r * 1.2);
                    } else {
                        // Desaturate others
                        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                        data[i] = data[i + 1] = data[i + 2] = gray;
                    }
                }
                break;

            case 'beauty':
                // Simple beauty filter (softening)
                const tempData = new Uint8ClampedArray(data);
                const width = this.mainCanvas.width;
                const kernelSize = 3;
                const offset = Math.floor(kernelSize / 2);

                for (let y = offset; y < this.mainCanvas.height - offset; y++) {
                    for (let x = offset; x < this.mainCanvas.width - offset; x++) {
                        let r = 0, g = 0, b = 0, count = 0;

                        for (let ky = -offset; ky <= offset; ky++) {
                            for (let kx = -offset; kx <= offset; kx++) {
                                const idx = ((y + ky) * width + (x + kx)) * 4;
                                r += tempData[idx];
                                g += tempData[idx + 1];
                                b += tempData[idx + 2];
                                count++;
                            }
                        }

                        const idx = (y * width + x) * 4;
                        data[idx] = r / count;
                        data[idx + 1] = g / count;
                        data[idx + 2] = b / count;
                    }
                }
                break;
        }

        this.mainCtx.putImageData(imageData, 0, 0);
    }

    onHandsResults(results) {
        // Clear overlay
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Draw hand landmarks if enabled
            if (this.settings.showHandTracking) {
                for (const landmarks of results.multiHandLandmarks) {
                    drawConnectors(this.overlayCtx, landmarks, HAND_CONNECTIONS, {
                        color: '#00FF00',
                        lineWidth: 2
                    });
                    drawLandmarks(this.overlayCtx, landmarks, {
                        color: '#FF0000',
                        lineWidth: 1,
                        radius: 3
                    });
                }
            }

            // Recognize gestures
            const gesture = this.recognizeGesture(results.multiHandLandmarks[0]);
            this.handleGesture(gesture, results.multiHandLandmarks[0]);
        }
    }

    recognizeGesture(landmarks) {
        const fingers = this.getFingerStatus(landmarks);
        const palmPosition = landmarks[0];

        // Track hand position for swipe detection
        if (this.lastHandPosition) {
            const deltaX = palmPosition.x - this.lastHandPosition.x;
            const deltaY = palmPosition.y - this.lastHandPosition.y;

            if (Math.abs(deltaX) > 0.15 && Math.abs(deltaY) < 0.1) {
                if (deltaX > 0) return 'swipe_right';
                if (deltaX < 0) return 'swipe_left';
            }
        }
        this.lastHandPosition = palmPosition;

        // Open palm (all fingers extended)
        if (fingers.every(f => f)) {
            return 'open_palm';
        }

        // Peace sign (index and middle extended, others closed)
        if (fingers[1] && fingers[2] && !fingers[0] && !fingers[3] && !fingers[4]) {
            return 'peace';
        }

        // Thumbs up
        if (fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
            const thumbTip = landmarks[4];
            const indexBase = landmarks[5];
            if (thumbTip.y < indexBase.y) {
                return 'thumbs_up';
            } else {
                return 'thumbs_down';
            }
        }

        // Point up (only index extended)
        if (!fingers[0] && fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
            const indexTip = landmarks[8];
            const indexBase = landmarks[5];
            if (indexTip.y < indexBase.y - 0.1) {
                return 'point_up';
            } else if (indexTip.y > indexBase.y + 0.1) {
                return 'point_down';
            }
        }

        // Fist (all fingers closed)
        if (!fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
            return 'fist';
        }

        // Rock sign (index and pinky extended)
        if (fingers[1] && fingers[4] && !fingers[2] && !fingers[3]) {
            return 'rock';
        }

        return 'none';
    }

    getFingerStatus(landmarks) {
        const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
        const fingerBases = [2, 6, 10, 14, 18];
        const fingers = [];

        for (let i = 0; i < 5; i++) {
            const tip = landmarks[fingerTips[i]];
            const base = landmarks[fingerBases[i]];

            if (i === 0) {
                // Thumb (check horizontal distance)
                fingers.push(Math.abs(tip.x - base.x) > 0.05);
            } else {
                // Other fingers (check vertical distance)
                fingers.push(tip.y < base.y);
            }
        }

        return fingers;
    }

    handleGesture(gesture, landmarks) {
        const now = Date.now();

        // Update gesture status display
        document.getElementById('gestureStatus').textContent =
            gesture !== 'none' ? `Gesture: ${gesture}` : 'Ready for gestures';

        // Check if it's a new gesture
        if (gesture !== this.currentGesture) {
            this.currentGesture = gesture;
            this.gestureStartTime = now;
            this.gestureDuration = 0;
        } else {
            this.gestureDuration = now - this.gestureStartTime;
        }

        // Handle sustained gestures
        if (gesture === 'open_palm' && this.gestureDuration > 2000) {
            this.takePhoto();
            this.currentGesture = null; // Reset to avoid multiple captures
        }

        // Handle instant gestures
        if (this.gestureDuration < 100) return; // Debounce

        switch (gesture) {
            case 'peace':
                this.switchCamera();
                this.currentGesture = null;
                break;

            case 'thumbs_up':
                this.nextFilter();
                this.currentGesture = null;
                break;

            case 'thumbs_down':
                this.removeFilter();
                this.currentGesture = null;
                break;

            case 'point_up':
                this.zoomIn();
                break;

            case 'point_down':
                this.zoomOut();
                break;

            case 'fist':
                if (this.gestureDuration > 1000) {
                    this.toggleRecording();
                    this.currentGesture = null;
                }
                break;

            case 'rock':
                this.toggleTimer();
                this.currentGesture = null;
                break;

            case 'swipe_left':
                this.discardLastPhoto();
                this.currentGesture = null;
                break;

            case 'swipe_right':
                this.saveLastPhoto();
                this.currentGesture = null;
                break;
        }
    }

    async takePhoto() {
        const timerDuration = this.settings.timerDuration;

        if (timerDuration > 0) {
            await this.showCountdown(timerDuration);
        }

        // Capture photo from main canvas (with filter applied)
        const photoData = this.mainCanvas.toDataURL('image/jpeg', 0.9);

        if (this.photoBoothMode) {
            this.photoBoothPhotos.push(photoData);
            this.photoBoothCount++;

            this.showGestureFeedback(`Photo ${this.photoBoothCount}/4`);
            this.speak(`Photo ${this.photoBoothCount}`);

            if (this.photoBoothCount >= 4) {
                this.finishPhotoBooth();
            }
        } else {
            this.photos.push({
                data: photoData,
                timestamp: Date.now()
            });

            this.updateGallery();
            this.showGestureFeedback('Photo captured!');
            this.speak('Photo captured');
            this.showToast('Photo captured successfully!', 'success');
        }
    }

    async showCountdown(duration) {
        const overlay = document.getElementById('countdownOverlay');
        const numberEl = document.getElementById('countdownNumber');

        overlay.classList.add('active');

        for (let i = duration; i > 0; i--) {
            numberEl.textContent = i;
            this.speak(i.toString());
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        overlay.classList.remove('active');
    }

    async switchCamera() {
        this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';

        // Stop current stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        if (this.camera) {
            this.camera.stop();
        }

        // Reinitialize camera
        await this.initCamera();
        await this.initMediaPipeHands();

        this.showGestureFeedback('Camera switched');
        this.speak('Camera switched');
        this.showToast('Camera switched successfully', 'success');
    }

    nextFilter() {
        this.currentFilterIndex = (this.currentFilterIndex + 1) % this.filters.length;
        const filterName = this.filters[this.currentFilterIndex];

        document.getElementById('currentFilter').textContent =
            filterName.charAt(0).toUpperCase() + filterName.slice(1);

        this.showGestureFeedback(`Filter: ${filterName}`);
        this.speak(filterName);
    }

    removeFilter() {
        this.currentFilterIndex = 0; // Reset to 'none'
        document.getElementById('currentFilter').textContent = 'No Filter';

        this.showGestureFeedback('Filter removed');
        this.speak('Filter removed');
    }

    zoomIn() {
        this.zoomLevel = Math.min(3, this.zoomLevel + 0.1);
        this.showGestureFeedback(`Zoom: ${Math.round(this.zoomLevel * 100)}%`);
    }

    zoomOut() {
        this.zoomLevel = Math.max(1, this.zoomLevel - 0.1);
        this.showGestureFeedback(`Zoom: ${Math.round(this.zoomLevel * 100)}%`);
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            const canvasStream = this.mainCanvas.captureStream(30);
            const audioTrack = this.stream.getAudioTracks()[0];

            if (audioTrack) {
                canvasStream.addTrack(audioTrack);
            }

            this.mediaRecorder = new MediaRecorder(canvasStream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);

                this.photos.push({
                    data: url,
                    timestamp: Date.now(),
                    isVideo: true
                });

                this.updateGallery();
                this.showToast('Video saved successfully!', 'success');
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            document.getElementById('recordingIndicator').classList.add('active');
            this.updateRecordingTime();

            this.showGestureFeedback('Recording started');
            this.speak('Recording started');

        } catch (error) {
            console.error('Recording error:', error);
            this.showToast('Failed to start recording', 'error');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            document.getElementById('recordingIndicator').classList.remove('active');

            this.showGestureFeedback('Recording stopped');
            this.speak('Recording stopped');
        }
    }

    updateRecordingTime() {
        if (!this.isRecording) return;

        const elapsed = Date.now() - this.recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        document.getElementById('recordingTime').textContent =
            `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        setTimeout(() => this.updateRecordingTime(), 1000);
    }

    toggleTimer() {
        const timerSelect = document.getElementById('timerDuration');
        const currentValue = parseInt(timerSelect.value);
        const values = [0, 3, 5, 10];
        const currentIndex = values.indexOf(currentValue);
        const nextIndex = (currentIndex + 1) % values.length;

        timerSelect.value = values[nextIndex];
        this.settings.timerDuration = values[nextIndex];

        this.showGestureFeedback(`Timer: ${values[nextIndex]}s`);
        this.speak(`Timer ${values[nextIndex]} seconds`);
    }

    discardLastPhoto() {
        if (this.photos.length > 0) {
            this.photos.pop();
            this.updateGallery();
            this.showGestureFeedback('Photo discarded');
            this.speak('Photo discarded');
            this.showToast('Last photo discarded', 'info');
        }
    }

    saveLastPhoto() {
        if (this.photos.length > 0) {
            const lastPhoto = this.photos[this.photos.length - 1];

            if (lastPhoto.isVideo) {
                // Download video
                const link = document.createElement('a');
                link.href = lastPhoto.data;
                link.download = `airframe-video-${lastPhoto.timestamp}.webm`;
                link.click();
            } else {
                // Download image
                const link = document.createElement('a');
                link.href = lastPhoto.data;
                link.download = `airframe-photo-${lastPhoto.timestamp}.jpg`;
                link.click();
            }

            this.showGestureFeedback('Photo saved');
            this.speak('Photo saved');
            this.showToast('Photo saved to downloads', 'success');
        }
    }

    updateGallery() {
        const gallery = document.getElementById('galleryGrid');
        gallery.innerHTML = '';

        this.photos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            if (photo.isVideo) {
                const video = document.createElement('video');
                video.src = photo.data;
                video.controls = true;
                item.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = photo.data;
                item.appendChild(img);
            }

            const actions = document.createElement('div');
            actions.className = 'gallery-item-actions';

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'gallery-item-btn';
            downloadBtn.textContent = 'Download';
            downloadBtn.onclick = () => this.downloadPhoto(index);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'gallery-item-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => this.deletePhoto(index);

            actions.appendChild(downloadBtn);
            actions.appendChild(deleteBtn);
            item.appendChild(actions);

            gallery.appendChild(item);
        });
    }

    downloadPhoto(index) {
        const photo = this.photos[index];
        const link = document.createElement('a');
        link.href = photo.data;
        link.download = `airframe-${photo.isVideo ? 'video' : 'photo'}-${photo.timestamp}.${photo.isVideo ? 'webm' : 'jpg'}`;
        link.click();

        this.showToast('Download started', 'success');
    }

    deletePhoto(index) {
        this.photos.splice(index, 1);
        this.updateGallery();
        this.showToast('Photo deleted', 'info');
    }

    togglePhotoBooth() {
        this.photoBoothMode = !this.photoBoothMode;

        if (this.photoBoothMode) {
            this.photoBoothCount = 0;
            this.photoBoothPhotos = [];
            this.showToast('Photo Booth Mode: Use open palm gesture to take 4 photos', 'info');
            this.speak('Photo booth mode activated');
        } else {
            this.showToast('Photo Booth Mode disabled', 'info');
        }
    }

    finishPhotoBooth() {
        // Create collage from 4 photos
        const collageCanvas = document.createElement('canvas');
        collageCanvas.width = 800;
        collageCanvas.height = 800;
        const ctx = collageCanvas.getContext('2d');

        const positions = [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
            { x: 0, y: 400 },
            { x: 400, y: 400 }
        ];

        this.photoBoothPhotos.forEach((photoData, index) => {
            const img = new Image();
            img.src = photoData;
            img.onload = () => {
                ctx.drawImage(img, positions[index].x, positions[index].y, 400, 400);

                if (index === 3) {
                    // All images loaded, save collage
                    const collageData = collageCanvas.toDataURL('image/jpeg', 0.9);
                    this.photos.push({
                        data: collageData,
                        timestamp: Date.now()
                    });

                    this.updateGallery();
                    this.photoBoothMode = false;
                    this.photoBoothCount = 0;
                    this.photoBoothPhotos = [];

                    this.showToast('Photo booth collage created!', 'success');
                    this.speak('Photo booth complete');
                }
            };
        });
    }

    async exportGif() {
        if (this.photos.length < 2) {
            this.showToast('Need at least 2 photos to create GIF', 'error');
            return;
        }

        this.showToast('Creating GIF... This may take a moment', 'info');

        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: 400,
            height: 400
        });

        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        for (const photo of this.photos.slice(0, 10)) { // Limit to 10 photos
            if (photo.isVideo) continue;

            await new Promise((resolve) => {
                const img = new Image();
                img.src = photo.data;
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, 400, 400);
                    gif.addFrame(canvas, { delay: 500 });
                    resolve();
                };
            });
        }

        gif.on('finished', (blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `airframe-animation-${Date.now()}.gif`;
            link.click();

            this.showToast('GIF exported successfully!', 'success');
        });

        gif.render();
    }

    showGestureFeedback(message) {
        const feedback = document.getElementById('gestureFeedback');
        feedback.textContent = message;
        feedback.classList.add('active');

        setTimeout(() => {
            feedback.classList.remove('active');
        }, 2000);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    speak(text) {
        if (!this.settings.voiceFeedback) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.2;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }

    setupEventListeners() {
        // Settings toggle
        document.getElementById('settingsToggle').addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.toggle('open');
        });

        // Settings controls
        document.getElementById('gestureSensitivity').addEventListener('input', (e) => {
            this.settings.gestureSensitivity = parseInt(e.target.value);
        });

        document.getElementById('voiceFeedback').addEventListener('change', (e) => {
            this.settings.voiceFeedback = e.target.checked;
        });

        document.getElementById('highContrastMode').addEventListener('change', (e) => {
            this.settings.highContrastMode = e.target.checked;
            document.body.classList.toggle('high-contrast', e.target.checked);
        });

        document.getElementById('showHandTracking').addEventListener('change', (e) => {
            this.settings.showHandTracking = e.target.checked;
        });

        document.getElementById('showCompositionGuides').addEventListener('change', (e) => {
            this.settings.showCompositionGuides = e.target.checked;
            document.getElementById('compositionGuides').classList.toggle('active', e.target.checked);
        });

        document.getElementById('timerDuration').addEventListener('change', (e) => {
            this.settings.timerDuration = parseInt(e.target.value);
        });

        // Gallery actions
        document.getElementById('clearGalleryBtn').addEventListener('click', () => {
            if (confirm('Delete all photos?')) {
                this.photos = [];
                this.updateGallery();
                this.showToast('Gallery cleared', 'info');
            }
        });

        document.getElementById('exportGifBtn').addEventListener('click', () => {
            this.exportGif();
        });

        document.getElementById('togglePhotoBoothBtn').addEventListener('click', () => {
            this.togglePhotoBooth();
        });

        // Gesture guide toggle
        document.getElementById('toggleGuideBtn').addEventListener('click', (e) => {
            const guide = document.getElementById('gestureGuide');
            const isHidden = guide.style.display === 'none';
            guide.style.display = isHidden ? 'block' : 'none';
            e.target.textContent = isHidden ? 'Hide Guide' : 'Show Guide';
        });
    }
}

// Initialize app when page loads
window.addEventListener('load', () => {
    new AirFrameApp();
});
