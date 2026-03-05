# ElephantWatch - Key Code Snippets

## 📝 Important Code Implementations

This document contains the most important code snippets you should understand for your viva.

---

## 1. Global State Management (AlertsContext)

### Location: `context/AlertsContext.tsx`

```typescript
// Define data types
export interface Alert {
  id: string;
  timestamp: string;
  confidence: number;
  image_url: string;
  latitude: number;
  longitude: number;
}

export interface Node {
  id: string;
  node_id: string;
  latitude: number;
  longitude: number;
  last_detection_timestamp: string | null;
  is_active: boolean;
}

// Context provider
export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  
  // Track last alert for voice detection
  const lastAlertIdRef = useRef<string | null>(null);
  
  // Fetch alerts from server
  const refreshAlerts = useCallback(async () => {
    try {
      const res = await apiRequest('GET', '/api/alerts');
      const data: Alert[] = await res.json();
      
      // Sort by timestamp (newest first)
      const sorted = [...data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setIsOnline(true);
      
      // Detect new alert for voice
      const newestId = sorted[0]?.id ?? null;
      if (newestId && newestId !== lastAlertIdRef.current && voiceSettings.enabled) {
        speakAlert(sorted[0].latitude, sorted[0].longitude, voiceSettings.language);
      }
      
      lastAlertIdRef.current = newestId;
      setAlerts(sorted);
      
      // Cache for offline use
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(sorted));
    } catch {
      setIsOnline(false);
    }
  }, []);
  
  // Poll server every 10 seconds
  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 10000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);
  
  return (
    <AlertsContext.Provider value={{ alerts, nodes, isOnline, refreshAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
}

// Hook to use context in any screen
export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlerts must be used within AlertsProvider');
  return context;
}
```

**Key Points:**
- Stores all alerts and nodes globally
- Polls server every 10 seconds
- Detects new alerts by comparing IDs
- Triggers voice alert automatically
- Caches data in AsyncStorage for offline use

---

## 2. Voice Alert Service (TTS)

### Location: `services/ttsService.ts`

```typescript
import * as Speech from 'expo-speech';

const THROTTLE_MS = 60_000; // 1 minute
let lastSpokenAt = 0;

// Messages in 3 languages
const MESSAGES: Record<string, (lat: number, lon: number) => string> = {
  en: (lat, lon) =>
    `Elephant detected near ${lat.toFixed(3)}, ${lon.toFixed(3)}. Please stay indoors and alert local authorities.`,
  hi: (lat, lon) =>
    `${lat.toFixed(3)}, ${lon.toFixed(3)} के पास हाथी का पता चला। कृपया घर के अंदर रहें।`,
  ta: (lat, lon) =>
    `${lat.toFixed(3)}, ${lon.toFixed(3)} அருகில் யானை கண்டறியப்பட்டது. தயவுசெய்து உள்ளே இருங்கள்.`,
};

export function speakAlert(
  latitude: number,
  longitude: number,
  language: 'en' | 'hi' | 'ta'
): void {
  const now = Date.now();
  
  // Throttle: only speak once per minute
  if (now - lastSpokenAt < THROTTLE_MS) return;
  lastSpokenAt = now;
  
  // Get message in selected language
  const messageFn = MESSAGES[language] ?? MESSAGES.en;
  const text = messageFn(latitude, longitude);
  const langCode = language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'ta-IN';
  
  // Speak using expo-speech
  Speech.speak(text, {
    language: langCode,
    rate: 0.85,
    pitch: 1.0,
    onError: () => {
      // Fallback to English if language not available
      if (language !== 'en') {
        Speech.speak(MESSAGES.en(latitude, longitude), { language: 'en-US' });
      }
    },
  });
}
```

**Key Points:**
- Supports 3 languages (English, Hindi, Tamil)
- Throttled to 1 alert per minute (prevents spam)
- Fallback to English if language unavailable
- Uses expo-speech API

---

## 3. API Request Helper

### Location: `lib/query-client.ts`

```typescript
import { fetch } from "expo/fetch";

// Get server URL from environment
export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;
  if (!host) throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  return `https://${host}`;
}

// Make API request
export async function apiRequest(
  method: string,
  route: string,
  data?: unknown
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  
  const res = await fetch(url.toString(), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  
  return res;
}
```

**Key Points:**
- Centralized API request function
- Handles errors automatically
- Uses environment variable for server URL
- Includes credentials for CORS

---

## 4. Home Screen Implementation

### Location: `app/(tabs)/index.tsx`

```typescript
export default function HomeScreen() {
  const { alerts, isOnline, refreshAlerts } = useAlerts();
  const lastAlert = alerts[0] ?? null; // Get most recent alert
  
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refreshAlerts} />
      }
    >
      {/* Status Badge */}
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { 
          backgroundColor: isOnline ? Colors.accent : Colors.alertRed 
        }]} />
        <Text>{isOnline ? 'Online' : 'Offline'}</Text>
      </View>
      
      {/* Last Alert Card */}
      {lastAlert ? (
        <Pressable onPress={() => router.push({ 
          pathname: '/alert/[id]', 
          params: { id: lastAlert.id } 
        })}>
          <Image source={{ uri: lastAlert.image_url }} />
          <Text>Confidence: {Math.round(lastAlert.confidence * 100)}%</Text>
          <Text>Location: {lastAlert.latitude}, {lastAlert.longitude}</Text>
        </Pressable>
      ) : (
        <Text>No detections yet</Text>
      )}
      
      {/* Statistics */}
      <View style={styles.statsRow}>
        <Text>{alerts.length} Total Alerts</Text>
        <Text>{Math.round(avgConfidence * 100)}% Avg Confidence</Text>
        <Text>{last24h} Last 24h</Text>
      </View>
    </ScrollView>
  );
}
```

**Key Points:**
- Uses `useAlerts()` hook to get data
- Pull-to-refresh to update
- Shows most recent alert (first in sorted array)
- Navigates to detail screen on tap
- Calculates statistics from alerts array

---

## 5. Camera Stream Implementation

### Location: `app/(tabs)/camera.tsx`

```typescript
export default function CameraScreen() {
  const { settings } = useAlerts();
  const [frameUri, setFrameUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const cameraUrl = settings.cameraUrl;
  
  // Start stream
  const startStream = useCallback(() => {
    setFrameUri(`${cameraUrl}/video_feed?t=${Date.now()}`);
  }, [cameraUrl]);
  
  // Refresh frame every 800ms to simulate video
  useEffect(() => {
    if (!cameraUrl) return;
    
    const interval = setInterval(() => {
      setFrameUri(`${cameraUrl}/video_feed?t=${Date.now()}`);
    }, 800);
    
    return () => clearInterval(interval);
  }, [cameraUrl]);
  
  return (
    <View>
      {frameUri ? (
        <Image
          source={{ uri: frameUri }}
          cachePolicy="no-cache"
          onLoadStart={() => setIsConnecting(true)}
          onLoad={() => setIsConnecting(false)}
          onError={() => setHasError(true)}
        />
      ) : null}
      
      {isConnecting && <Text>Connecting...</Text>}
      {hasError && <Text>Stream Unavailable</Text>}
      
      <Button onPress={startStream}>Reconnect</Button>
    </View>
  );
}
```

**Key Points:**
- Gets camera URL from settings
- Adds timestamp to URL to prevent caching
- Refreshes every 800ms for smooth video
- Shows loading/error states
- No caching for real-time stream

---

## 6. Map Zone Classification

### Location: `components/CommunityMapView.tsx`

```typescript
function getNodeStatus(node: Node): 'alert' | 'monitoring' | 'safe' {
  if (!node.last_detection_timestamp) return 'safe';
  
  // Calculate hours since last detection
  const hoursSince = 
    (Date.now() - new Date(node.last_detection_timestamp).getTime()) / 3600000;
  
  if (hoursSince < 0.5) return 'alert';      // < 30 minutes
  if (hoursSince < 6) return 'monitoring';   // 30 min - 6 hours
  return 'safe';                             // > 6 hours
}

function getZoneColor(status: string): string {
  switch (status) {
    case 'alert': return '#E03B3B';      // Red
    case 'monitoring': return '#F5A623'; // Amber
    case 'safe': return '#2DBE6C';       // Green
    default: return '#6B8088';           // Gray
  }
}

export function CommunityMapView({ nodes }: { nodes: Node[] }) {
  return (
    <MapView>
      {nodes.map(node => {
        const status = getNodeStatus(node);
        const color = getZoneColor(status);
        
        return (
          <React.Fragment key={node.id}>
            {/* Marker */}
            <Marker
              coordinate={{ latitude: node.latitude, longitude: node.longitude }}
              title={node.node_id}
            />
            
            {/* Zone Circle */}
            <Circle
              center={{ latitude: node.latitude, longitude: node.longitude }}
              radius={500} // 500 meters
              fillColor={`${color}33`} // 20% opacity
              strokeColor={color}
              strokeWidth={2}
            />
          </React.Fragment>
        );
      })}
    </MapView>
  );
}
```

**Key Points:**
- Calculates time since last detection
- Classifies into 3 zones (alert/monitoring/safe)
- Color-codes markers and circles
- Shows 500m radius around each node

---

## 7. Backend API Routes

### Location: `server/routes.ts`

```typescript
import type { Express } from 'express';

let alerts: Alert[] = []; // In-memory storage

export async function registerRoutes(app: Express) {
  // Get all alerts
  app.get('/api/alerts', (_req, res) => {
    res.json(alerts);
  });
  
  // Add new alert (from Raspberry Pi)
  app.post('/api/alerts', (req, res) => {
    const { timestamp, confidence, image_url, latitude, longitude } = req.body;
    
    // Validate required fields
    if (!timestamp || confidence === undefined || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create new alert
    const newAlert: Alert = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      timestamp,
      confidence,
      image_url: image_url || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
    
    // Add to beginning of array (newest first)
    alerts.unshift(newAlert);
    
    return res.status(201).json(newAlert);
  });
  
  // Clear all alerts
  app.delete('/api/alerts', (_req, res) => {
    alerts = [];
    res.json({ message: 'All alerts cleared' });
  });
  
  // Get monitoring nodes
  app.get('/api/nodes', (_req, res) => {
    res.json(nodes);
  });
  
  // Health check
  app.get('/api/status', (_req, res) => {
    res.json({ 
      status: 'online', 
      alertCount: alerts.length, 
      nodeCount: nodes.length 
    });
  });
}
```

**Key Points:**
- Simple REST API with Express
- In-memory storage (array)
- Validates POST data
- Returns JSON responses
- CORS enabled in server/index.ts

---

## 8. Raspberry Pi Detection Script

### Example Python code for Pi:

```python
import cv2
import tensorflow as tf
import requests
from datetime import datetime

# Configuration
SERVER_URL = "http://your-server.com:5000/api/alerts"
MODEL_PATH = "elephant_detector.h5"
CONFIDENCE_THRESHOLD = 0.70

# Load AI model
model = tf.keras.models.load_model(MODEL_PATH)

# Camera setup
camera = cv2.VideoCapture(0)

while True:
    # Capture frame
    ret, frame = camera.read()
    if not ret:
        continue
    
    # Preprocess for model
    resized = cv2.resize(frame, (224, 224))
    normalized = resized / 255.0
    batched = np.expand_dims(normalized, axis=0)
    
    # Run AI detection
    prediction = model.predict(batched)
    confidence = prediction[0][0]
    
    # If elephant detected
    if confidence >= CONFIDENCE_THRESHOLD:
        # Save image
        image_path = f"detection_{datetime.now().timestamp()}.jpg"
        cv2.imwrite(image_path, frame)
        
        # Send to ElephantWatch
        data = {
            "timestamp": datetime.now().isoformat(),
            "confidence": float(confidence),
            "image_url": f"http://192.168.1.100:8000/{image_path}",
            "latitude": 37.2606,
            "longitude": -2.6527
        }
        
        response = requests.post(SERVER_URL, json=data)
        print(f"Alert sent! Status: {response.status_code}")
        
        # Wait 60 seconds before next alert
        time.sleep(60)
    
    time.sleep(5)  # Check every 5 seconds
```

**Key Points:**
- Loads TensorFlow model
- Captures frames from camera
- Preprocesses image for model
- Runs prediction
- POSTs to API if confidence > 70%
- Throttles to prevent spam

---

## 9. Raspberry Pi Camera Stream

### Example Flask server for Pi:

```python
from flask import Flask, Response
import cv2

app = Flask(__name__)
camera = cv2.VideoCapture(0)

def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        # Yield in MJPEG format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Key Points:**
- Flask web server
- Captures frames continuously
- Encodes as JPEG
- Streams as MJPEG (multipart)
- Accessible at `/video_feed`

---

## 10. Settings Screen Implementation

### Location: `app/(tabs)/settings.tsx`

```typescript
export default function SettingsScreen() {
  const { settings, voiceSettings, updateSettings, updateVoiceSettings } = useAlerts();
  const [cameraUrlInput, setCameraUrlInput] = useState(settings.cameraUrl);
  
  // Save camera URL
  const handleSaveCameraUrl = useCallback(() => {
    updateSettings({ cameraUrl: cameraUrlInput });
  }, [cameraUrlInput, updateSettings]);
  
  // Toggle voice alerts
  const handleToggleVoice = useCallback((value: boolean) => {
    updateVoiceSettings({ enabled: value });
  }, [updateVoiceSettings]);
  
  // Select language
  const handleSelectLanguage = useCallback((code: 'en' | 'hi' | 'ta') => {
    updateVoiceSettings({ language: code });
  }, [updateVoiceSettings]);
  
  // Test voice
  const handleTestVoice = useCallback(async () => {
    await testVoice(voiceSettings.language);
  }, [voiceSettings.language]);
  
  return (
    <ScrollView>
      {/* Camera URL Input */}
      <TextInput
        value={cameraUrlInput}
        onChangeText={setCameraUrlInput}
        placeholder="http://192.168.1.100:5000"
      />
      <Button onPress={handleSaveCameraUrl}>Save URL</Button>
      
      {/* Voice Toggle */}
      <Switch
        value={voiceSettings.enabled}
        onValueChange={handleToggleVoice}
      />
      
      {/* Language Selection */}
      {['en', 'hi', 'ta'].map(lang => (
        <Button
          key={lang}
          onPress={() => handleSelectLanguage(lang)}
          selected={voiceSettings.language === lang}
        >
          {lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Tamil'}
        </Button>
      ))}
      
      {/* Test Button */}
      <Button onPress={handleTestVoice}>Test Voice</Button>
    </ScrollView>
  );
}
```

**Key Points:**
- Updates settings via context
- Saves to AsyncStorage automatically
- Test voice button for preview
- Language selection buttons
- Camera URL configuration

---

## 11. Alert Detail Screen

### Location: `app/alert/[id].tsx`

```typescript
import { useLocalSearchParams } from 'expo-router';

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams(); // Get ID from URL
  const { alerts } = useAlerts();
  
  // Find alert by ID
  const alert = alerts.find(a => a.id === id);
  
  if (!alert) {
    return <Text>Alert not found</Text>;
  }
  
  return (
    <ScrollView>
      {/* Hero Image */}
      <Image source={{ uri: alert.image_url }} style={styles.heroImage} />
      
      {/* Confidence Badge */}
      <View style={styles.badge}>
        <Text style={{ color: confidenceColor(alert.confidence) }}>
          {Math.round(alert.confidence * 100)}% Confidence
        </Text>
      </View>
      
      {/* Map */}
      <DetectionMap
        latitude={alert.latitude}
        longitude={alert.longitude}
      />
      
      {/* Details */}
      <Text>GPS: {alert.latitude}, {alert.longitude}</Text>
      <Text>Time: {new Date(alert.timestamp).toLocaleString()}</Text>
      <Text>ID: {alert.id}</Text>
    </ScrollView>
  );
}
```

**Key Points:**
- Gets alert ID from URL params
- Finds alert in global state
- Shows full-size image
- Displays map with marker
- Shows all alert details

---

## 12. Confidence Color Coding

```typescript
function confidenceColor(confidence: number): string {
  if (confidence >= 0.85) return '#2DBE6C';  // Green (high confidence)
  if (confidence >= 0.65) return '#F5A623';  // Amber (medium)
  return '#E03B3B';                          // Red (low)
}

// Usage
<Text style={{ color: confidenceColor(alert.confidence) }}>
  {Math.round(alert.confidence * 100)}%
</Text>
```

**Key Points:**
- Visual indicator of AI certainty
- Green = very confident (>85%)
- Amber = moderately confident (65-85%)
- Red = less confident (<65%)

---

## 13. Time Formatting

```typescript
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Usage
<Text>{formatRelativeTime(alert.timestamp)}</Text>
// Output: "18m ago", "3h ago", "2d ago"
```

**Key Points:**
- Human-readable time format
- Shows relative time (ago)
- Automatically scales (minutes/hours/days)

---

## 14. AsyncStorage Persistence

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALERTS_KEY = '@elephant_alerts';
const SETTINGS_KEY = '@elephant_settings';

// Save data
await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

// Load data
const storedAlerts = await AsyncStorage.getItem(ALERTS_KEY);
if (storedAlerts) {
  const parsed = JSON.parse(storedAlerts);
  setAlerts(parsed);
}

// Remove data
await AsyncStorage.removeItem(ALERTS_KEY);
```

**Key Points:**
- Local storage on device
- Persists between app restarts
- Enables offline functionality
- Stores as JSON strings

---

## 15. Navigation

```typescript
import { router } from 'expo-router';

// Navigate to alert detail
router.push({ 
  pathname: '/alert/[id]', 
  params: { id: '123' } 
});

// Navigate to tab
router.push('/(tabs)/settings');

// Go back
router.back();

// Replace (no back button)
router.replace('/');
```

**Key Points:**
- File-based routing (Expo Router)
- Type-safe navigation
- Dynamic routes with params
- Stack and tab navigation

---

## Summary of Key Concepts

1. **State Management**: React Context + AsyncStorage
2. **API Communication**: Fetch with error handling
3. **Voice Alerts**: expo-speech with throttling
4. **Camera Stream**: MJPEG with timestamp refresh
5. **Map Zones**: Time-based classification
6. **Offline Support**: AsyncStorage caching
7. **Raspberry Pi**: POST to API + Flask stream
8. **Navigation**: Expo Router (file-based)
9. **Styling**: Dark theme with color coding
10. **Polling**: setInterval for real-time updates

---

**Study these snippets to understand the implementation! 💻**
