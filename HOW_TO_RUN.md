# 🚀 How to Run ElephantWatch Locally

## ⚡ Quick Start (Easiest Method)

### Option 1: Double-Click to Start (Windows)
Simply double-click the file:
```
START_APP.bat
```
This will automatically start both the backend server and frontend app in separate windows!

---

## 📋 Manual Start (Step-by-Step)

### Prerequisites
- ✅ Node.js installed (v18 or higher) - Already installed ✓
- ✅ npm installed - Already installed ✓
- ✅ Dependencies installed - Already installed ✓

### Step 1: Start Backend Server

Open **Command Prompt** or **PowerShell** and run:

```bash
cd c:\projects\Do-It-Now-1\Do-It-Now-1
npm run server:dev
```

You should see:
```
express server serving on port 5000
```

**Keep this terminal open!** The server is now running.

---

### Step 2: Start Frontend App (New Terminal)

Open a **NEW** Command Prompt/PowerShell window and run:

```bash
cd c:\projects\Do-It-Now-1\Do-It-Now-1
npm run start
```

You should see the Expo development menu with a QR code.

---

### Step 3: Open the App

You have 3 options:

#### Option A: Web Browser (Easiest)
Press `w` in the Expo terminal

The app will open in your default browser at:
```
http://localhost:8081
```

#### Option B: Android Emulator
1. Install Android Studio
2. Start an Android emulator
3. Press `a` in the Expo terminal

#### Option C: Physical Phone
1. Install "Expo Go" app from Play Store/App Store
2. Scan the QR code shown in terminal
3. App will load on your phone

---

## 🎯 All Available Commands

### Backend Commands
```bash
# Start development server (with auto-reload)
npm run server:dev

# Build for production
npm run server:build

# Run production server
npm run server:prod

# Push database schema (if using database)
npm run db:push
```

### Frontend Commands
```bash
# Start Expo development server
npm run start

# Start with specific platform
npx expo start --web          # Web only
npx expo start --android      # Android only
npx expo start --ios          # iOS only (Mac only)

# Build static version
npm run expo:static:build

# Clear cache and restart
npx expo start --clear
```

### Other Commands
```bash
# Install dependencies (if needed)
npm install

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## 🌐 Access URLs

Once running, you can access:

- **Backend API**: http://localhost:5000
- **API Status**: http://localhost:5000/api/status
- **API Alerts**: http://localhost:5000/api/alerts
- **Frontend Web**: http://localhost:8081 (after pressing 'w')

---

## 🔧 Troubleshooting

### Issue: Port 5000 already in use
**Solution**: Kill the process using port 5000
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Issue: Port 8081 already in use
**Solution**: Kill the process or use different port
```bash
# Kill process
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Or start on different port
npx expo start --port 8082
```

### Issue: "Cannot find module"
**Solution**: Reinstall dependencies
```bash
# Delete node_modules and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Issue: Expo not starting
**Solution**: Clear cache
```bash
npx expo start --clear
```

### Issue: Backend not connecting
**Solution**: Check if server is running
```bash
# Test backend
curl http://localhost:5000/api/status

# Or open in browser
start http://localhost:5000/api/status
```

---

## 📱 Testing the App

### 1. Check Backend is Running
Open browser: http://localhost:5000/api/status

You should see:
```json
{
  "status": "online",
  "alertCount": 5,
  "nodeCount": 6
}
```

### 2. Check Alerts Endpoint
Open browser: http://localhost:5000/api/alerts

You should see an array of 5 demo alerts.

### 3. Test Frontend
1. Start frontend (`npm run start`)
2. Press `w` for web
3. You should see the ElephantWatch home screen
4. Check that you see 5 alerts in the history

---

## 🎨 Development Tips

### Hot Reload
Both backend and frontend support hot reload:
- **Backend**: Automatically restarts when you edit files in `server/`
- **Frontend**: Automatically refreshes when you edit files in `app/`, `components/`, etc.

### View Logs
- **Backend logs**: Visible in the terminal running `npm run server:dev`
- **Frontend logs**: 
  - Web: Open browser DevTools (F12) → Console
  - Mobile: Shake device → Debug menu → Remote JS Debugging

### Edit Code
Use any code editor:
- Visual Studio Code (recommended)
- WebStorm
- Sublime Text
- Notepad++

---

## 🔄 Stopping the App

### Stop Backend
In the backend terminal, press: `Ctrl + C`

### Stop Frontend
In the frontend terminal, press: `Ctrl + C`

### Stop Both (if using START_APP.bat)
Close both terminal windows that opened.

---

## 📊 What You Should See

### Backend Terminal:
```
express server serving on port 5000
GET /api/alerts 200 in 5ms
GET /api/nodes 200 in 3ms
```

### Frontend Terminal:
```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press w │ open web
› Press a │ open Android
› Press i │ open iOS simulator
```

### Web Browser:
You should see the ElephantWatch app with:
- Home screen showing last detection
- Bottom navigation with 5 tabs
- Status showing "Online"
- 5 demo alerts in history

---

## 🎯 Quick Test Checklist

After starting the app, verify:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 8081
- [ ] Can access http://localhost:5000/api/status
- [ ] Can access http://localhost:5000/api/alerts
- [ ] Web app loads in browser
- [ ] Home screen shows "Online" status
- [ ] Can see last detection card
- [ ] Can navigate between tabs
- [ ] History shows 5 alerts
- [ ] Map shows 6 nodes
- [ ] Settings screen loads

---

## 🚀 Production Deployment

For production deployment (not needed for local testing):

```bash
# Build backend
npm run server:build

# Build frontend
npm run expo:static:build

# Run production
npm run server:prod
```

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Start everything | Double-click `START_APP.bat` |
| Start backend only | `npm run server:dev` |
| Start frontend only | `npm run start` |
| Open in web | Press `w` in Expo terminal |
| Open in Android | Press `a` in Expo terminal |
| Stop server | `Ctrl + C` |
| Clear cache | `npx expo start --clear` |
| Reinstall deps | `npm install` |

---

## 🎓 For Your Viva

When demonstrating the app:

1. **Start the app**: Use `START_APP.bat` for quick start
2. **Show backend**: Open http://localhost:5000/api/status
3. **Show frontend**: Open web version (press `w`)
4. **Navigate**: Show all 5 tabs (Home, Camera, Map, History, Settings)
5. **Explain features**: Point out alerts, map zones, voice settings
6. **Show API**: Open http://localhost:5000/api/alerts in browser

---

## ✅ Success Indicators

You'll know everything is working when:

✅ Backend terminal shows "express server serving on port 5000"
✅ Frontend terminal shows Metro bundler running
✅ Browser shows ElephantWatch app
✅ Status badge shows "Online" (green)
✅ Home screen shows last detection
✅ History tab shows 5 alerts
✅ Map tab shows 6 nodes with colored zones
✅ No error messages in terminals

---

## 🎉 You're Ready!

The app is now running locally. You can:
- Navigate through all screens
- See demo data (5 alerts, 6 nodes)
- Test all features
- Show it during your viva

**Note**: Camera feed won't work without a Raspberry Pi configured. This is expected for local testing.

---

**Need help? Check the troubleshooting section above!**
