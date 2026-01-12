# ✋ AirFrame - Gesture-Controlled Photo Studio

A sophisticated browser-based camera application where every function is controlled by hand gestures. Perfect for self-portraits, group photos, accessibility needs, or when your hands are dirty/gloved.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### Gesture Control System

Control every aspect of the camera with intuitive hand gestures:

| Gesture | Action |
|---------|--------|
| ✋ Open palm (hold 2s) | Take photo |
| ✌️ Peace sign | Switch camera (front/back) |
| 👍 Thumbs up | Apply next filter |
| 👎 Thumbs down | Remove filter |
| 👆 Point up | Increase zoom |
| 👇 Point down | Decrease zoom |
| ✊ Fist (hold 1s) | Start/stop video recording |
| 🖐️ Five fingers spread, swipe left | Discard last photo |
| 🖐️ Five fingers spread, swipe right | Save to downloads |
| 🤟 Rock sign | Toggle timer (0s/3s/5s/10s) |

### Advanced Features

#### 📸 Photo & Video Capture
- High-resolution photo capture
- Video recording with audio
- Configurable countdown timer (0, 3, 5, or 10 seconds)
- Real-time preview with filters

#### 🎨 Real-Time Filters
- **None** - No filter applied
- **Grayscale** - Classic black and white
- **Sepia** - Vintage warm tone
- **Vintage** - Retro look with film grain
- **Color Pop** - Keep reds vibrant, desaturate others
- **Beauty** - Smoothing filter for portraits

#### 🎭 Photo Booth Mode
- Capture 4 consecutive photos
- Automatic collage creation
- Perfect for parties and events
- Save as single image

#### 🎬 GIF Export
- Create animated GIFs from your photos
- Up to 10 photos per GIF
- Customizable frame delay
- One-click download

#### 🔍 Zoom Control
- Digital zoom from 1x to 3x
- Smooth zoom transitions
- Gesture-controlled zoom in/out

#### 📐 Composition Guides
- Rule of thirds grid overlay
- Toggle on/off in settings
- Professional photo composition

#### ♿ Accessibility Features
- **Voice Feedback** - Audio announcements for all actions
- **High Contrast Mode** - Enhanced visibility
- **Adjustable Gesture Sensitivity** - Customize detection threshold
- **Visual Gesture Feedback** - On-screen confirmation

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, or Safari)
- Webcam access
- HTTPS connection (required for camera access)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Hand-Gesture-app.git
cd Hand-Gesture-app
```

2. Serve the files using a local web server:

**Option 1: Using Python**
```bash
python -m http.server 8000
```

**Option 2: Using Node.js (http-server)**
```bash
npx http-server -p 8000
```

**Option 3: Using VS Code Live Server**
- Install the "Live Server" extension
- Right-click on `index.html`
- Select "Open with Live Server"

3. Open your browser and navigate to:
```
http://localhost:8000
```

4. Allow camera and microphone permissions when prompted

## 📖 Usage Guide

### First Time Setup

1. **Grant Permissions**: When you first open the app, allow camera and microphone access
2. **Check Gesture Guide**: Review the gesture controls on the right panel
3. **Test Gestures**: Try different gestures to familiarize yourself with the controls
4. **Adjust Settings**: Click the ⚙️ icon to customize your experience

### Taking Photos

1. Position yourself in front of the camera
2. Make an **open palm** gesture (all fingers extended)
3. Hold the gesture for **2 seconds**
4. The countdown timer will start (if enabled)
5. Photo is captured automatically

### Switching Cameras

- Make a **peace sign** (✌️) gesture
- The app will switch between front and back cameras
- Useful for selfies vs. regular photos

### Applying Filters

1. Make a **thumbs up** (👍) gesture to cycle through filters
2. Current filter name is displayed in the top-right corner
3. Make a **thumbs down** (👎) gesture to remove all filters

### Recording Video

1. Make a **fist** gesture and hold for **1 second**
2. Recording starts with a red REC indicator
3. Make the **fist** gesture again to stop recording
4. Video is automatically saved to the gallery

### Zooming

- **Point up** (👆) to zoom in (up to 3x)
- **Point down** (👇) to zoom out (back to 1x)
- Current zoom level appears briefly on screen

### Managing Photos

**Using Gestures:**
- **Swipe right** (🖐️) to save the last photo to downloads
- **Swipe left** (🖐️) to discard the last photo

**Using Gallery:**
- Hover over photos to see Download/Delete buttons
- Click "Clear All" to remove all photos
- Click "Export as GIF" to create an animated GIF

### Photo Booth Mode

1. Click "Photo Booth Mode" button
2. Use **open palm** gesture 4 times to capture photos
3. A collage is automatically created and saved
4. Perfect for creating photo strips!

## ⚙️ Settings

Click the ⚙️ icon on the right side to access:

- **Gesture Sensitivity** (1-10): Adjust how easily gestures are detected
- **Voice Feedback**: Enable audio announcements for actions
- **High Contrast Mode**: Enhanced visibility for accessibility
- **Show Hand Tracking**: Toggle hand skeleton overlay
- **Composition Guides**: Show rule of thirds grid
- **Timer Duration**: Select countdown time (0s, 3s, 5s, 10s)

## 🛠️ Technical Details

### Technologies Used

- **HTML5 Canvas API** - Image processing and rendering
- **MediaStream API** - Camera and microphone access
- **MediaPipe Hands** - Real-time hand tracking and gesture recognition
- **MediaRecorder API** - Video recording
- **Web Speech API** - Voice feedback
- **GIF.js** - Animated GIF generation

### Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Safari | 14+ | ⚠️ Partial* |

*Safari may require additional permissions for some features.

### Performance Considerations

- **Hand tracking** runs at ~30 FPS
- **Video recording** supports up to 1080p at 30 FPS
- **Filter processing** is done in real-time on the main thread
- **Memory usage** increases with gallery size (~2-5 MB per photo)

### Architecture

```
AirFrameApp
├── Camera Management
│   ├── Stream initialization
│   ├── Camera switching
│   └── Render loop
├── Gesture Recognition
│   ├── MediaPipe Hands integration
│   ├── Landmark analysis
│   └── Gesture classification
├── Photo/Video Capture
│   ├── Timer/countdown
│   ├── Filter application
│   └── Recording management
├── Gallery Management
│   ├── Photo storage
│   ├── Display grid
│   └── Export functions
└── UI/Settings
    ├── Event handlers
    ├── Notifications
    └── Accessibility features
```

## 🐛 Troubleshooting

### Camera Not Working

- Ensure you granted camera permissions
- Check if another application is using the camera
- Try refreshing the page
- Verify you're using HTTPS (required for camera access)

### Gestures Not Detected

- Ensure good lighting conditions
- Position your hand clearly in front of the camera
- Adjust **Gesture Sensitivity** in settings
- Make sure hand is fully visible (not cut off by frame)

### Recording Fails

- Check microphone permissions
- Verify browser supports MediaRecorder API
- Try using a different browser (Chrome recommended)

### Performance Issues

- Close other browser tabs
- Disable hand tracking overlay in settings
- Reduce zoom level
- Clear photo gallery periodically

## 🔒 Privacy & Security

- **All processing happens locally** - No data is sent to servers
- **No photos are uploaded** - Everything stays on your device
- **No tracking or analytics** - Complete privacy
- **Camera access only when page is active** - Automatically stops when you close/switch tabs

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Check the troubleshooting section
- Review the usage guide

## 🙏 Acknowledgments

- **MediaPipe** by Google - Hand tracking technology
- **GIF.js** - GIF encoding library
- Inspired by accessibility-first design principles

## 🎯 Roadmap

- [ ] Face detection and auto-focus
- [ ] Custom gesture creation
- [ ] Cloud backup integration
- [ ] Social media sharing
- [ ] Multi-hand gesture combinations
- [ ] AR effects and overlays
- [ ] Advanced pose detection
- [ ] Photo editing tools

---

Made with ❤️ for hands-free photography