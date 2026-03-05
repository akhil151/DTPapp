# ElephantWatch - Quick Viva Cheat Sheet

## 🚀 Commands to Run Locally

```bash
# 1. Install dependencies (first time only)
cd c:\projects\Do-It-Now-1\Do-It-Now-1
npm install

# 2. Start Backend Server (Terminal 1)
npm run server:dev
# Server runs on http://localhost:5000

# 3. Start Expo App (Terminal 2)
npm run start
# Then press:
# - 'w' for web browser
# - 'a' for Android emulator
# - 'i' for iOS simulator (Mac only)
# - Scan QR with Expo Go app on phone
```

---

## 📱 App Overview (30-second pitch)

**ElephantWatch** is a real-time elephant movement monitoring system that:
- Detects elephants using AI on Raspberry Pi cameras
- Shows alerts with images, GPS, and confidence scores
- Displays community map with color-coded danger zones
- Speaks alerts in English, Hindi, or Tamil
- Streams live camera feed
- Works offline with cached data

**Purpose**: Prevent human-elephant conflicts in rural communities

---

## 🏗️ Tech Stack (What you used)

| Layer | Technology | Why? |
|-------|-----------|------|
| **Frontend** | React Native + Expo | Cross-platform (Android/iOS/Web) |
| **Navigation** | Expo Router | File-based routing |
| **Backend** | Express.js (Node.js) | REST API server |
| **State** | React Context | Global state management |
| **Storage** | AsyncStorage | Local cache (offline) |
| **Maps** | react-native-maps | Native map component |
| **Voice** | expo-speech | Text-to-speech |
| **Language** | TypeScript | Type safety |

---

## 📂 Project Structure (5 key folders)

```
app/              → All screens (Expo Router)
  (tabs)/         → Bottom navigation tabs
  alert/[id].tsx  → Alert detail (dynamic route)

components/       → Reusable UI (maps, error handling)

context/          → Global state (AlertsContext)

server/           → Backend API (Express)
  routes.ts       → API endpoints

services/         → Business logic (TTS)
```

---

## 🎯 5 Main Features

### 1. **Home Screen** (`app/(tabs)/index.tsx`)
- Shows last detection with image
- System status (online/offline)
- Quick action buttons
- Statistics (total, avg confidence, last 24h)

### 2. **Live Camera** (`app/(tabs)/camera.tsx`)
- MJPEG stream from Raspberry Pi
- Refreshes every 800ms
- Start/Stop/Reconnect controls
- Shows error if Pi offline

### 3. **Community Map** (`app/(tabs)/map.tsx`)
- 6 monitoring nodes on map
- Color zones:
  - **Red**: Detection < 30 min ago (Alert)
  - **Amber**: 30 min - 6 hours (Monitoring)
  - **Green**: > 6 hours (Safe)
- Tap marker → node info

### 4. **Voice Alerts** (`services/ttsService.ts`)
- Auto-speaks when new elephant detected
- 3 languages: English, Hindi, Tamil
- Throttled to 1 per minute
- Respects silent mode

### 5. **Settings** (`app/(tabs)/settings.tsx`)
- Configure camera URL
- Toggle voice alerts
- Select language
- Clear history

---

## 🔄 Data Flow (How it works)

```
Raspberry Pi Camera
  ↓ (AI detects elephant)
POST /api/alerts {timestamp, confidence, image_url, lat, lon}
  ↓
Express Server (port 5000)
  ↓ (stores in array)
App polls every 10 seconds
  ↓
AlertsContext updates
  ↓
If new alert + voice enabled → speakAlert()
  ↓
UI updates (React state)
  ↓
Save to AsyncStorage (offline cache)
```

---

## 🌐 API Endpoints (Backend)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/alerts` | List all detections |
| POST | `/api/alerts` | Add new detection (from Pi) |
| DELETE | `/api/alerts` | Clear all alerts |
| GET | `/api/nodes` | List monitoring stations |
| GET | `/api/status` | Health check |

**Server**: `http://localhost:5000`

---

## 📊 Where Data Comes From

### Current (Demo):
- 5 hardcoded alerts in `server/routes.ts`
- 6 hardcoded nodes (Amboseli, Kenya coordinates)
- Unsplash images
- In-memory storage (resets on restart)

### Production (Real):
- Raspberry Pi POST requests
- PostgreSQL database
- Cloud storage (S3) for images
- GPS module on Pi

---

## 🤖 Raspberry Pi Integration (How to connect)

### Is it easy? **YES! ✅**

### Step 1: Detection Script (Pi)
```python
import requests
import cv2
import tensorflow as tf

# Load AI model
model = tf.keras.models.load_model('elephant_detector.h5')

# Detect elephant
prediction = model.predict(frame)
confidence = prediction[0][0]

if confidence > 0.7:
    # Send to ElephantWatch
    requests.post('http://your-server.com:5000/api/alerts', json={
        "timestamp": datetime.now().isoformat(),
        "confidence": float(confidence),
        "image_url": "https://...",
        "latitude": 37.2606,
        "longitude": -2.6527
    })
```

### Step 2: Camera Stream (Pi)
```python
from flask import Flask, Response
import cv2

app = Flask(__name__)
camera = cv2.VideoCapture(0)

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

app.run(host='0.0.0.0', port=5000)
```

### Step 3: Configure in App
Settings → Camera URL → `http://192.168.1.100:5000`

**That's it!** No app code changes needed.

---

## 🎨 Design Highlights

- **Dark theme**: Battery saving, field visibility
- **Large text**: Easy to read outdoors
- **Color coding**: Red (danger), Amber (warning), Green (safe)
- **Haptic feedback**: Touch vibrations
- **Pull-to-refresh**: Manual updates
- **Offline support**: Works without internet

---

## 🎓 Top 10 Viva Questions

### Q1: What is ElephantWatch?
**A**: Real-time elephant monitoring app to prevent human-elephant conflicts using AI detection on Raspberry Pi cameras.

### Q2: What tech stack?
**A**: React Native (Expo), Express.js, TypeScript, react-native-maps, expo-speech.

### Q3: How does voice alert work?
**A**: App polls server every 10s, detects new alert by comparing IDs, speaks if voice enabled, throttled to 1/min.

### Q4: How to integrate Raspberry Pi?
**A**: Pi runs AI model, POSTs to `/api/alerts` when elephant detected, runs Flask for camera stream. Configure URL in settings.

### Q5: What are the color zones on map?
**A**: Red (<30 min), Amber (30 min-6h), Green (>6h) based on last detection time.

### Q6: Where is data stored?
**A**: Server: in-memory arrays (demo). App: AsyncStorage (cache). Production: PostgreSQL.

### Q7: How does offline mode work?
**A**: AsyncStorage caches alerts/settings. App loads from cache on start. Works without internet.

### Q8: What is confidence score?
**A**: AI model's certainty percentage. 94% = very confident. Color: Green (>85%), Amber (65-85%), Red (<65%).

### Q9: How does camera stream work?
**A**: MJPEG stream from Pi. App loads image with timestamp query param, refreshes every 800ms.

### Q10: What languages supported?
**A**: English, Hindi, Tamil for voice alerts using expo-speech.

---

## 🔧 State Management

**Global State**: `AlertsContext.tsx`

```typescript
{
  alerts: Alert[],              // All detections
  nodes: Node[],                // Monitoring stations
  settings: Settings,           // Camera URL, notifications
  voiceSettings: VoiceSettings, // TTS config
  isOnline: boolean,            // Connection status
  isLoading: boolean            // Refresh state
}
```

**Access in any screen**:
```typescript
const { alerts, refreshAlerts } = useAlerts();
```

**Persistence**: AsyncStorage (loads on start, saves on update)

---

## 📱 Navigation (Expo Router)

```
app/
├── (tabs)/           → Tab Navigator
│   ├── index.tsx    → Home
│   ├── camera.tsx   → Camera
│   ├── map.tsx      → Map
│   ├── history.tsx  → History
│   └── settings.tsx → Settings
└── alert/[id].tsx   → Alert Detail
```

**Navigate**:
```typescript
router.push({ pathname: '/alert/[id]', params: { id: '123' } });
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not loading | Check Pi running, verify URL, check network |
| Voice not working | Check silent mode, test in settings |
| Alerts not updating | Check server running (port 5000), pull-to-refresh |
| Map not showing | Web shows list (fallback), mobile needs permissions |

---

## 📈 Future Enhancements

1. Push notifications (Firebase)
2. Real database (PostgreSQL)
3. User authentication (JWT)
4. Analytics dashboard
5. Geofencing (custom zones)
6. Multi-camera support
7. Offline maps

---

## 🎯 Key Metrics

- **Total Code**: ~2000 lines
- **Screens**: 6 (5 tabs + 1 detail)
- **API Endpoints**: 5
- **Languages**: 3 (EN, HI, TA)
- **Polling**: 10s (alerts), 15s (nodes)
- **Voice Throttle**: 60s

---

## 💡 Why This Project is Good

✅ **Real-world problem**: Human-elephant conflict prevention
✅ **IoT integration**: Raspberry Pi + AI model
✅ **Cross-platform**: Android, iOS, Web
✅ **Multilingual**: Supports local languages
✅ **Offline-first**: Works without internet
✅ **Production-ready**: Error handling, dark mode, haptics
✅ **Scalable**: Easy to add more cameras/nodes

---

## 🎤 30-Second Elevator Pitch

"ElephantWatch is a mobile app that helps rural communities avoid dangerous encounters with elephants. Raspberry Pi cameras with AI models detect elephants and send alerts to the app. Users see real-time locations on a map with color-coded danger zones, hear voice warnings in their language, and can view live camera feeds. It works offline and is designed for field use with a dark theme and large text. Integration is simple—just POST to our API when an elephant is detected."

---

## 📞 Quick Commands Reference

```bash
# Install
npm install

# Run backend
npm run server:dev

# Run app
npm run start

# Build for production
npm run expo:static:build
npm run server:build
npm run server:prod
```

---

**Print this sheet and keep it handy during your viva! 📄**
