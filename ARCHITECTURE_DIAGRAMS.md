# ElephantWatch - Architecture Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ELEPHANTWATCH SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  RASPBERRY PI    │         │  EXPRESS SERVER  │         │   MOBILE APP     │
│  (Detection)     │────────▶│  (Backend API)   │◀────────│  (React Native)  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
│                            │                            │
│ • Camera Module            │ • Port 5000                │ • Android/iOS/Web
│ • AI Model (TF)            │ • REST API                 │ • Expo Router
│ • Python Script            │ • In-Memory DB             │ • React Context
│ • Flask Server             │ • CORS Enabled             │ • AsyncStorage
│                            │                            │
│ POST /api/alerts           │ GET /api/alerts            │ Polls every 10s
│ {timestamp, conf,          │ GET /api/nodes             │ Voice alerts
│  image_url, lat, lon}      │ DELETE /api/alerts         │ Live camera view
│                            │                            │
└────────────────────────────┴────────────────────────────┴──────────────────┘
```

---

## 📱 App Screen Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP NAVIGATION                           │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   Root Layout    │
                    │  (_layout.tsx)   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Tab Navigator  │
                    │  (tabs)/_layout  │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │         │          │          │         │
   ┌────▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼────┐ ┌──▼──────┐
   │ Home   │ │Camera│ │  Map  │ │History │ │Settings │
   │index.tsx│ │.tsx  │ │ .tsx  │ │ .tsx   │ │  .tsx   │
   └────┬───┘ └──────┘ └───────┘ └───┬────┘ └─────────┘
        │                             │
        │         Tap Alert           │
        └─────────────┬───────────────┘
                      │
                ┌─────▼──────┐
                │Alert Detail│
                │alert/[id]  │
                │   .tsx     │
                └────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW SEQUENCE                           │
└─────────────────────────────────────────────────────────────────┘

1. DETECTION
   ┌──────────────┐
   │ Raspberry Pi │
   │   Camera     │
   └──────┬───────┘
          │ Captures frame
          ▼
   ┌──────────────┐
   │  AI Model    │
   │ (TensorFlow) │
   └──────┬───────┘
          │ Predicts: 94% elephant
          ▼
   ┌──────────────┐
   │ POST Request │
   │ /api/alerts  │
   └──────┬───────┘
          │
          ▼

2. SERVER PROCESSING
   ┌──────────────┐
   │Express Server│
   │  Port 5000   │
   └──────┬───────┘
          │ Receives POST
          ▼
   ┌──────────────┐
   │ Create Alert │
   │ {id, time,   │
   │  conf, img}  │
   └──────┬───────┘
          │ Store in array
          ▼
   ┌──────────────┐
   │alerts.unshift│
   │  (newAlert)  │
   └──────┬───────┘
          │
          ▼

3. APP POLLING
   ┌──────────────┐
   │  Mobile App  │
   │ (Every 10s)  │
   └──────┬───────┘
          │ GET /api/alerts
          ▼
   ┌──────────────┐
   │AlertsContext │
   │ refreshAlerts│
   └──────┬───────┘
          │ Compare IDs
          ▼
   ┌──────────────┐
   │ New Alert?   │
   │ newestId !=  │
   │ lastAlertId  │
   └──────┬───────┘
          │ YES
          ▼

4. VOICE ALERT
   ┌──────────────┐
   │ Voice Enabled│
   │    Check     │
   └──────┬───────┘
          │ YES
          ▼
   ┌──────────────┐
   │ speakAlert() │
   │ "Elephant    │
   │  detected!"  │
   └──────┬───────┘
          │
          ▼

5. UI UPDATE
   ┌──────────────┐
   │ React State  │
   │   Update     │
   └──────┬───────┘
          │ setAlerts(sorted)
          ▼
   ┌──────────────┐
   │ AsyncStorage │
   │    Save      │
   └──────┬───────┘
          │ Cache for offline
          ▼
   ┌──────────────┐
   │ UI Renders   │
   │ New Alert    │
   │  on Screen   │
   └──────────────┘
```

---

## 🗺️ Map Zone Classification

```
┌─────────────────────────────────────────────────────────────────┐
│                  MAP ZONE LOGIC                                 │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  Monitoring Node │
                    │  last_detection  │
                    │    timestamp     │
                    └────────┬─────────┘
                             │
                    Calculate time since
                    detection (hours)
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐           ┌─────▼──────┐
         │ < 0.5 hours │           │ No detection│
         │  (30 min)   │           │    ever     │
         └──────┬──────┘           └─────┬──────┘
                │                        │
         ┌──────▼──────┐                 │
         │ ALERT ZONE  │                 │
         │   🔴 RED    │                 │
         │ Danger!     │                 │
         └─────────────┘                 │
                                         │
         ┌──────────────┐                │
         │ 0.5-6 hours  │                │
         └──────┬───────┘                │
                │                        │
         ┌──────▼──────┐                 │
         │ MONITORING  │                 │
         │  🟠 AMBER   │                 │
         │ Caution     │                 │
         └─────────────┘                 │
                                         │
         ┌──────────────┐                │
         │  > 6 hours   │◀───────────────┘
         └──────┬───────┘
                │
         ┌──────▼──────┐
         │  SAFE ZONE  │
         │  🟢 GREEN   │
         │  All clear  │
         └─────────────┘
```

---

## 🎤 Voice Alert Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  VOICE ALERT MECHANISM                          │
└─────────────────────────────────────────────────────────────────┘

Timer: Every 10 seconds
         │
         ▼
┌────────────────┐
│ refreshAlerts()│
│  API Call      │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Sort by time   │
│ (newest first) │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Get newest ID  │
│ sorted[0].id   │
└────────┬───────┘
         │
         ▼
┌────────────────────┐
│ Compare with last  │
│ newestId !=        │
│ lastAlertIdRef     │
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
   NO        YES
    │         │
    │    ┌────▼────────┐
    │    │ Voice       │
    │    │ Enabled?    │
    │    └────┬────────┘
    │         │
    │    ┌────┴────┐
    │    │         │
    │   NO        YES
    │    │         │
    │    │    ┌────▼────────┐
    │    │    │ Throttle    │
    │    │    │ Check       │
    │    │    │ (60s gap)   │
    │    │    └────┬────────┘
    │    │         │
    │    │    ┌────┴────┐
    │    │    │         │
    │    │   NO        YES
    │    │    │         │
    │    │    │    ┌────▼────────┐
    │    │    │    │ speakAlert()│
    │    │    │    │ expo-speech │
    │    │    │    └────┬────────┘
    │    │    │         │
    │    │    │    ┌────▼────────┐
    │    │    │    │ "Elephant   │
    │    │    │    │  detected   │
    │    │    │    │  near..."   │
    │    │    │    └────┬────────┘
    │    │    │         │
    └────┴────┴─────────▼
         │
         ▼
┌────────────────┐
│ Update lastId  │
│ Save to cache  │
└────────────────┘
```

---

## 📦 Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMPONENT TREE                                 │
└─────────────────────────────────────────────────────────────────┘

App
└── AlertsProvider (Context)
    └── RootLayout (_layout.tsx)
        └── TabLayout ((tabs)/_layout.tsx)
            ├── HomeScreen (index.tsx)
            │   ├── StatusBadge
            │   ├── AlertCard
            │   │   └── Image (expo-image)
            │   ├── ActionCards
            │   └── StatsRow
            │
            ├── CameraScreen (camera.tsx)
            │   ├── StreamImage (expo-image)
            │   ├── LoadingOverlay
            │   ├── ErrorOverlay
            │   └── ControlButtons
            │
            ├── MapScreen (map.tsx)
            │   └── CommunityMapView
            │       ├── MapView (react-native-maps)
            │       ├── Markers (nodes)
            │       ├── Circles (zones)
            │       └── BottomSheet
            │
            ├── HistoryScreen (history.tsx)
            │   └── FlatList
            │       └── AlertCard (repeated)
            │
            └── SettingsScreen (settings.tsx)
                ├── StatusCard
                ├── CameraInput
                ├── NotificationToggle
                ├── VoiceSettings
                │   ├── Toggle
                │   ├── LanguageSelector
                │   └── TestButton
                └── DangerZone

Stack Screens:
└── AlertDetailScreen (alert/[id].tsx)
    ├── HeroImage
    ├── ConfidenceBadge
    ├── DetectionMap
    ├── GPSCoordinates
    └── Timestamp
```

---

## 🔐 State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  STATE MANAGEMENT                               │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    AlertsContext                             │
│  (Global State - Accessible from any screen)                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  State:                                                      │
│  ├── alerts: Alert[]                                         │
│  ├── nodes: Node[]                                           │
│  ├── settings: Settings                                      │
│  ├── voiceSettings: VoiceSettings                            │
│  ├── isOnline: boolean                                       │
│  └── isLoading: boolean                                      │
│                                                              │
│  Actions:                                                    │
│  ├── refreshAlerts()                                         │
│  ├── refreshNodes()                                          │
│  ├── updateSettings()                                        │
│  ├── updateVoiceSettings()                                   │
│  └── clearAlerts()                                           │
│                                                              │
│  Effects:                                                    │
│  ├── Load from AsyncStorage on mount                         │
│  ├── Poll /api/alerts every 10s                             │
│  ├── Poll /api/nodes every 15s                              │
│  ├── Detect new alerts (ID comparison)                       │
│  ├── Trigger voice alert if enabled                          │
│  └── Save to AsyncStorage on update                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                             │
                             │ useAlerts() hook
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │  Home   │         │  Map    │         │Settings │
   │ Screen  │         │ Screen  │         │ Screen  │
   └─────────┘         └─────────┘         └─────────┘
   
   Access:                Access:              Access:
   const { alerts,        const { nodes,       const { settings,
           isOnline,              refreshNodes }       updateSettings }
           refreshAlerts }        = useAlerts();       = useAlerts();
           = useAlerts();
```

---

## 🌐 API Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  API REQUEST FLOW                               │
└─────────────────────────────────────────────────────────────────┘

Mobile App                    Express Server
    │                              │
    │  GET /api/alerts             │
    ├─────────────────────────────▶│
    │                              │
    │                         ┌────▼────┐
    │                         │ CORS    │
    │                         │ Check   │
    │                         └────┬────┘
    │                              │
    │                         ┌────▼────┐
    │                         │ Route   │
    │                         │ Handler │
    │                         └────┬────┘
    │                              │
    │                         ┌────▼────┐
    │                         │ Return  │
    │                         │ alerts  │
    │                         │ array   │
    │                         └────┬────┘
    │                              │
    │  200 OK + JSON data          │
    │◀─────────────────────────────┤
    │                              │
┌───▼────┐                         │
│ Parse  │                         │
│ JSON   │                         │
└───┬────┘                         │
    │                              │
┌───▼────┐                         │
│ Update │                         │
│ State  │                         │
└───┬────┘                         │
    │                              │
┌───▼────┐                         │
│ Save   │                         │
│ Cache  │                         │
└────────┘                         │


Raspberry Pi                  Express Server
    │                              │
    │  POST /api/alerts            │
    │  {timestamp, confidence,     │
    │   image_url, lat, lon}       │
    ├─────────────────────────────▶│
    │                              │
    │                         ┌────▼────┐
    │                         │Validate │
    │                         │ Data    │
    │                         └────┬────┘
    │                              │
    │                         ┌────▼────┐
    │                         │ Create  │
    │                         │ Alert   │
    │                         │ Object  │
    │                         └────┬────┘
    │                              │
    │                         ┌────▼────┐
    │                         │ Add to  │
    │                         │ Array   │
    │                         └────┬────┘
    │                              │
    │  201 Created + Alert         │
    │◀─────────────────────────────┤
    │                              │
```

---

## 📱 Screen Layouts

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOME SCREEN LAYOUT                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ElephantWatch                          [●] Online      │
│  Movement Monitoring System                             │
├─────────────────────────────────────────────────────────┤
│  LAST DETECTION                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  [Elephant Image]                                 │ │
│  │  🐘 Elephant Detected          18m ago            │ │
│  │  ─────────────────────────────────────────────    │ │
│  │  📊 Confidence              94%                   │ │
│  │  📍 Location                37.2606, -2.6527      │ │
│  │                                                   │ │
│  │  View Details →                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  QUICK ACCESS                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ 📹       │  │ ⏱️       │  │ 🗺️       │            │
│  │ Live     │  │ Alert    │  │ Open     │            │
│  │ Camera   │  │ History  │  │ Map      │            │
│  │ View     │  │ 5 records│  │ Last loc │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │    5         │      94%      │       3          │  │
│  │ Total Alerts │ Avg Confidence│   Last 24h       │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    MAP SCREEN LAYOUT                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Community Map                          [i] Legend      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Interactive Map View]                     │
│                                                         │
│         🔴 NODE-001 (Alert)                            │
│                                                         │
│    🟠 NODE-002                                         │
│                  (Monitoring)                           │
│                                                         │
│                        🟢 NODE-003 (Safe)              │
│                                                         │
│  🔴 NODE-004                                           │
│                                                         │
│         🟠 NODE-005                                    │
│                                                         │
│                              🟢 NODE-006               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🔴 Alert: 2  │  🟠 Monitoring: 2  │  🟢 Safe: 2 │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Offline/Online Sync

```
┌─────────────────────────────────────────────────────────────────┐
│                  OFFLINE/ONLINE BEHAVIOR                        │
└─────────────────────────────────────────────────────────────────┘

App Startup
    │
    ▼
┌────────────────┐
│ Load from      │
│ AsyncStorage   │
│ (cached data)  │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Display cached │
│ alerts/settings│
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Try API call   │
│ /api/status    │
└────────┬───────┘
         │
    ┌────┴────┐
    │         │
 Success    Fail
    │         │
    │         ▼
    │    ┌────────────────┐
    │    │ Set isOnline   │
    │    │ = false        │
    │    └────────┬───────┘
    │             │
    │             ▼
    │    ┌────────────────┐
    │    │ Show "Offline" │
    │    │ badge          │
    │    └────────┬───────┘
    │             │
    │             ▼
    │    ┌────────────────┐
    │    │ Use cached     │
    │    │ data only      │
    │    └────────────────┘
    │
    ▼
┌────────────────┐
│ Set isOnline   │
│ = true         │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Start polling  │
│ (10s/15s)      │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Fetch fresh    │
│ data from API  │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Update cache   │
│ AsyncStorage   │
└────────────────┘
```

---

## 🎯 Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              ELEPHANTWATCH - COMPLETE SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ RASPBERRY PI │         │    SERVER    │         │  MOBILE APP  │
│              │         │              │         │              │
│ • Camera     │  POST   │ • Express.js │   GET   │ • React      │
│ • AI Model   │────────▶│ • Port 5000  │◀────────│   Native     │
│ • Python     │         │ • REST API   │         │ • Expo       │
│ • Flask      │  Stream │ • In-Memory  │  Poll   │ • TypeScript │
│              │         │   Storage    │  10s    │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │                        │                        │
   Detects                  Stores                   Displays
   Elephant                 Alerts                   Alerts
       │                        │                        │
       │                        │                        │
   Sends POST              Returns JSON              Shows UI
   {timestamp,             [alerts]                  + Voice
    confidence,                                      + Map
    image_url,                                       + Camera
    lat, lon}                                        + History

┌─────────────────────────────────────────────────────────────────┐
│                         FEATURES                                │
├─────────────────────────────────────────────────────────────────┤
│ 1. Real-time Alerts    → Home screen with last detection       │
│ 2. Live Camera         → MJPEG stream from Pi                  │
│ 3. Community Map       → Color-coded danger zones              │
│ 4. Voice Alerts        → Auto TTS in 3 languages               │
│ 5. Alert History       → List of all detections                │
│ 6. Offline Support     → AsyncStorage cache                    │
│ 7. Settings            → Configure camera, voice, language     │
└─────────────────────────────────────────────────────────────────┘
```

---

**Use these diagrams to visualize and explain the system! 📊**
