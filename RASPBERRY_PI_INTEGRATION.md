# Raspberry Pi Integration Guide for ElephantWatch

## 🎯 Overview

This guide shows you EXACTLY how to connect a Raspberry Pi with a camera and AI model to your ElephantWatch app.

**Difficulty**: 🟢 EASY (No app changes needed!)

---

## 📋 What You Need

### Hardware:
- Raspberry Pi 4 (or 3B+)
- Pi Camera Module (or USB webcam)
- SD Card (16GB+)
- Power supply
- Internet connection (WiFi/Ethernet)

### Software:
- Raspberry Pi OS (Bullseye or newer)
- Python 3.8+
- Your trained AI model (TensorFlow/PyTorch)

---

## 🚀 Complete Setup (Step-by-Step)

### Step 1: Prepare Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python dependencies
sudo apt install python3-pip python3-opencv -y

# Install required Python packages
pip3 install tensorflow opencv-python flask requests pillow numpy

# Enable camera (if using Pi Camera Module)
sudo raspi-config
# Navigate to: Interface Options → Camera → Enable
# Reboot: sudo reboot
```

---

### Step 2: Create Detection Script

Create file: `elephant_detector.py`

```python
#!/usr/bin/env python3
"""
ElephantWatch - Raspberry Pi Detection Script
Detects elephants using AI model and sends alerts to ElephantWatch app
"""

import cv2
import numpy as np
import requests
import time
from datetime import datetime
import os

# ============ CONFIGURATION ============
# Your ElephantWatch server URL
SERVER_URL = "http://your-server-domain.com:5000/api/alerts"

# Your Raspberry Pi's GPS coordinates (get from Google Maps)
LATITUDE = 37.2606
LONGITUDE = -2.6527

# AI Model settings
MODEL_PATH = "elephant_detector.h5"  # Path to your trained model
CONFIDENCE_THRESHOLD = 0.70  # 70% confidence minimum

# Detection settings
CHECK_INTERVAL = 5  # Check every 5 seconds
ALERT_COOLDOWN = 60  # Send alert max once per 60 seconds

# Image upload (choose one method)
UPLOAD_METHOD = "local"  # Options: "local", "cloudinary", "s3"
LOCAL_IMAGE_URL_BASE = "http://192.168.1.100:8000/images"  # Your Pi's IP

# ============ LOAD AI MODEL ============
print("Loading AI model...")
try:
    import tensorflow as tf
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✓ Model loaded successfully")
except Exception as e:
    print(f"✗ Error loading model: {e}")
    exit(1)

# ============ CAMERA SETUP ============
print("Initializing camera...")
camera = cv2.VideoCapture(0)  # 0 = default camera

if not camera.isOpened():
    print("✗ Error: Cannot open camera")
    exit(1)

# Set camera resolution
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
print("✓ Camera initialized")

# ============ HELPER FUNCTIONS ============

def preprocess_frame(frame):
    """Prepare frame for AI model"""
    # Resize to model input size (adjust based on your model)
    resized = cv2.resize(frame, (224, 224))
    # Normalize pixel values
    normalized = resized / 255.0
    # Add batch dimension
    batched = np.expand_dims(normalized, axis=0)
    return batched

def save_image_local(frame):
    """Save image locally and return URL"""
    os.makedirs("detections", exist_ok=True)
    timestamp = int(time.time())
    filename = f"detection_{timestamp}.jpg"
    filepath = os.path.join("detections", filename)
    cv2.imwrite(filepath, frame)
    return f"{LOCAL_IMAGE_URL_BASE}/{filename}"

def upload_to_cloudinary(frame):
    """Upload image to Cloudinary (optional)"""
    # Install: pip3 install cloudinary
    import cloudinary
    import cloudinary.uploader
    
    cloudinary.config(
        cloud_name="your_cloud_name",
        api_key="your_api_key",
        api_secret="your_api_secret"
    )
    
    # Encode frame to jpg
    _, buffer = cv2.imencode('.jpg', frame)
    
    # Upload
    result = cloudinary.uploader.upload(buffer.tobytes())
    return result['secure_url']

def send_alert(confidence, image_url):
    """Send detection alert to ElephantWatch server"""
    data = {
        "timestamp": datetime.now().isoformat(),
        "confidence": float(confidence),
        "image_url": image_url,
        "latitude": LATITUDE,
        "longitude": LONGITUDE
    }
    
    try:
        response = requests.post(SERVER_URL, json=data, timeout=10)
        if response.status_code == 201:
            print(f"✓ Alert sent successfully! Confidence: {confidence:.2%}")
            return True
        else:
            print(f"✗ Server error: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Network error: {e}")
        return False

# ============ MAIN DETECTION LOOP ============

print("\n" + "="*50)
print("ElephantWatch Detection System Started")
print("="*50)
print(f"Server: {SERVER_URL}")
print(f"Location: {LATITUDE}, {LONGITUDE}")
print(f"Confidence threshold: {CONFIDENCE_THRESHOLD:.0%}")
print(f"Check interval: {CHECK_INTERVAL}s")
print("Press Ctrl+C to stop\n")

last_alert_time = 0

try:
    while True:
        # Capture frame
        ret, frame = camera.read()
        
        if not ret:
            print("✗ Error reading frame")
            time.sleep(1)
            continue
        
        # Preprocess for model
        processed = preprocess_frame(frame)
        
        # Run AI detection
        prediction = model.predict(processed, verbose=0)
        confidence = prediction[0][0]  # Adjust based on your model output
        
        # Check if elephant detected
        if confidence >= CONFIDENCE_THRESHOLD:
            current_time = time.time()
            
            # Check cooldown period
            if current_time - last_alert_time >= ALERT_COOLDOWN:
                print(f"\n🐘 ELEPHANT DETECTED! Confidence: {confidence:.2%}")
                
                # Save/upload image
                if UPLOAD_METHOD == "local":
                    image_url = save_image_local(frame)
                elif UPLOAD_METHOD == "cloudinary":
                    image_url = upload_to_cloudinary(frame)
                else:
                    image_url = ""
                
                # Send alert
                if send_alert(confidence, image_url):
                    last_alert_time = current_time
                    print(f"Next alert available in {ALERT_COOLDOWN}s\n")
            else:
                remaining = int(ALERT_COOLDOWN - (current_time - last_alert_time))
                print(f"⏳ Cooldown active ({remaining}s remaining)")
        else:
            # No detection
            print(f"Monitoring... Confidence: {confidence:.2%}", end='\r')
        
        # Wait before next check
        time.sleep(CHECK_INTERVAL)

except KeyboardInterrupt:
    print("\n\nStopping detection system...")

finally:
    camera.release()
    print("✓ Camera released")
    print("Goodbye!")
```

---

### Step 3: Create Camera Stream Server

Create file: `camera_stream.py`

```python
#!/usr/bin/env python3
"""
ElephantWatch - Camera Stream Server
Provides live MJPEG stream for ElephantWatch app
"""

from flask import Flask, Response
import cv2
import time

app = Flask(__name__)

# Camera setup
camera = cv2.VideoCapture(0)
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
camera.set(cv2.CAP_PROP_FPS, 30)

def generate_frames():
    """Generate video frames for MJPEG stream"""
    while True:
        success, frame = camera.read()
        
        if not success:
            print("Error reading frame")
            break
        
        # Add timestamp overlay (optional)
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, timestamp, (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame, 
                                   [cv2.IMWRITE_JPEG_QUALITY, 85])
        
        if not ret:
            continue
        
        # Convert to bytes
        frame_bytes = buffer.tobytes()
        
        # Yield frame in MJPEG format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    """Health check endpoint"""
    return {"status": "online", "camera": "active"}

@app.route('/')
def index():
    """Simple test page"""
    return """
    <html>
        <head><title>ElephantWatch Camera</title></head>
        <body>
            <h1>ElephantWatch Camera Stream</h1>
            <img src="/video_feed" width="640" height="480">
        </body>
    </html>
    """

if __name__ == '__main__':
    print("="*50)
    print("ElephantWatch Camera Stream Server")
    print("="*50)
    print("Starting server on http://0.0.0.0:5000")
    print("Access stream at: http://YOUR_PI_IP:5000/video_feed")
    print("Press Ctrl+C to stop\n")
    
    app.run(host='0.0.0.0', port=5000, threaded=True)
```

---

### Step 4: Create Simple Image Server (Optional)

If using local image storage, create: `image_server.py`

```python
#!/usr/bin/env python3
"""
Simple HTTP server to serve detection images
"""

import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = "detections"

os.makedirs(DIRECTORY, exist_ok=True)
os.chdir(DIRECTORY)

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving images at http://0.0.0.0:{PORT}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()
```

---

### Step 5: Create Startup Script

Create file: `start_elephantwatch.sh`

```bash
#!/bin/bash
# ElephantWatch Startup Script

echo "Starting ElephantWatch System..."

# Start camera stream server
echo "Starting camera stream..."
python3 camera_stream.py &
STREAM_PID=$!

# Wait for stream to initialize
sleep 3

# Start image server (if using local storage)
echo "Starting image server..."
python3 image_server.py &
IMAGE_PID=$!

# Wait for image server
sleep 2

# Start detection system
echo "Starting detection system..."
python3 elephant_detector.py

# Cleanup on exit
kill $STREAM_PID $IMAGE_PID
echo "ElephantWatch stopped"
```

Make it executable:
```bash
chmod +x start_elephantwatch.sh
```

---

## 🔧 Configuration

### 1. Get Your Server URL

If running locally:
```bash
# Find your computer's IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Use: http://YOUR_COMPUTER_IP:5000
```

If deployed (Replit/Heroku):
```bash
# Use your deployment URL
# Example: https://your-app.replit.app
```

### 2. Get Pi's IP Address

```bash
hostname -I
# Example output: 192.168.1.100
```

### 3. Update Configuration

Edit `elephant_detector.py`:
```python
SERVER_URL = "http://192.168.1.50:5000/api/alerts"  # Your server
LATITUDE = 37.2606   # Your location (from Google Maps)
LONGITUDE = -2.6527
LOCAL_IMAGE_URL_BASE = "http://192.168.1.100:8000/images"  # Pi's IP
```

---

## 🚀 Running the System

### Option 1: Run All Together
```bash
./start_elephantwatch.sh
```

### Option 2: Run Separately (3 terminals)

**Terminal 1 - Camera Stream:**
```bash
python3 camera_stream.py
```

**Terminal 2 - Image Server:**
```bash
python3 image_server.py
```

**Terminal 3 - Detection:**
```bash
python3 elephant_detector.py
```

---

## 📱 Configure ElephantWatch App

1. Open ElephantWatch app
2. Go to **Settings** tab
3. Under **Camera** section:
   - Enter: `http://192.168.1.100:5000` (your Pi's IP)
   - Click **Save URL**
4. Go to **Camera** tab
5. You should see live stream!

---

## 🧪 Testing

### Test 1: Camera Stream
```bash
# On your computer, open browser:
http://192.168.1.100:5000

# You should see live video
```

### Test 2: Manual Alert
```bash
# Send test alert using curl
curl -X POST http://YOUR_SERVER:5000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-01-15T10:30:00Z",
    "confidence": 0.95,
    "image_url": "https://images.unsplash.com/photo-1564760055775-d63b17a55c44",
    "latitude": 37.2606,
    "longitude": -2.6527
  }'

# Check app - alert should appear!
```

### Test 3: Detection System
```bash
# Run detector with test image
python3 elephant_detector.py

# Point camera at elephant picture on screen
# Should detect and send alert
```

---

## 🔄 Auto-Start on Boot (Optional)

Create systemd service: `/etc/systemd/system/elephantwatch.service`

```ini
[Unit]
Description=ElephantWatch Detection System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/elephantwatch
ExecStart=/home/pi/elephantwatch/start_elephantwatch.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable elephantwatch
sudo systemctl start elephantwatch
sudo systemctl status elephantwatch
```

---

## 🐛 Troubleshooting

### Camera not working
```bash
# Check camera
vcgencmd get_camera
# Should show: supported=1 detected=1

# Test camera
raspistill -o test.jpg

# Check USB camera
ls /dev/video*
```

### Network issues
```bash
# Test server connection
curl http://YOUR_SERVER:5000/api/status

# Check Pi's IP
hostname -I

# Ping server
ping YOUR_SERVER_IP
```

### Model errors
```python
# Check model input shape
print(model.input_shape)  # Should match your preprocessing

# Test prediction
test_input = np.random.rand(1, 224, 224, 3)
prediction = model.predict(test_input)
print(prediction)
```

---

## 📊 Monitoring

### View Logs
```bash
# Detection logs
tail -f detection.log

# System logs
journalctl -u elephantwatch -f
```

### Check Performance
```bash
# CPU usage
top

# Temperature
vcgencmd measure_temp

# Memory
free -h
```

---

## 🎯 Summary

**What you did:**
1. ✅ Installed Python + dependencies
2. ✅ Created detection script (sends POST to API)
3. ✅ Created camera stream server (Flask)
4. ✅ Configured Pi's location
5. ✅ Connected to ElephantWatch app

**What happens:**
1. Pi camera captures frames
2. AI model analyzes each frame
3. If elephant detected (>70% confidence):
   - Save image
   - POST to `/api/alerts`
4. App polls server every 10s
5. New alert appears in app
6. Voice alert speaks (if enabled)

**Integration difficulty**: 🟢 **EASY!**
- No app code changes needed
- Just POST to existing API
- Configure URL in settings

---

## 📞 Quick Reference

```bash
# Start everything
./start_elephantwatch.sh

# Camera stream URL (for app settings)
http://YOUR_PI_IP:5000

# Test stream in browser
http://YOUR_PI_IP:5000

# Send test alert
curl -X POST http://YOUR_SERVER:5000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"2025-01-15T10:30:00Z","confidence":0.95,"image_url":"https://...","latitude":37.26,"longitude":-2.65}'

# Check logs
tail -f detection.log

# Stop all
pkill -f elephant_detector
pkill -f camera_stream
```

---

**You're ready to integrate! 🎉**
