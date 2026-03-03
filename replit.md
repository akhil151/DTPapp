# ElephantWatch — AI-Based Elephant Movement Monitoring System

## Overview
A production-ready Expo React Native mobile app for real-time elephant movement monitoring. Dark-themed, optimized for field use with large typography and clear visuals.

## Tech Stack
- **Frontend**: Expo React Native (SDK 54), Expo Router (file-based routing)
- **Backend**: Express.js / TypeScript (port 5000)
- **State**: React Context + AsyncStorage
- **Maps**: react-native-maps@1.18.0
- **TTS**: expo-speech@14.0.8
- **HTTP**: @tanstack/react-query + custom apiRequest

## App Structure

### Screens (app/(tabs)/)
- `index.tsx` — Home: status indicator, last alert card, quick actions, stats
- `camera.tsx` — Live Camera: MJPEG stream viewer, reconnect, full-screen
- `map.tsx` — Community Map: detection nodes, alert/safe/monitoring zones
- `history.tsx` — Alert History: sorted list, confidence badges, pull-to-refresh
- `settings.tsx` — Settings: camera URL, voice alerts, language selection

### Stack Screens
- `app/alert/[id].tsx` — Alert Detail: hero image, confidence, map, GPS, timestamps

## Key Features

### Feature 1: Live Community Alert Map
- 6 demo nodes seeded from server (Amboseli region coordinates)
- Zone classification: Alert (<30 min), Monitoring (30 min–6h), Safe (>6h)
- Colored circles: Red = Alert, Amber = Monitoring, Green = Safe
- Toggle zones on/off
- Bottom sheet info panel on marker tap
- Stats bar showing counts per status
- Legend overlay (info button)
- Web fallback: list view with map link

### Feature 2: Auto Voice Alert Mode
- expo-speech integration with throttling (60 second minimum gap)
- Languages: English (en-US), Hindi (hi-IN), Tamil (ta-IN)
- Test voice button in Settings
- Trigger fires when polling detects a new alert (new ID at top of sorted list)
- Respects device silent mode (Speech API behavior)
- Persisted to AsyncStorage

## Backend API Endpoints
- `GET /api/alerts` — list all alerts (sorted by timestamp)
- `POST /api/alerts` — receive detection from Raspberry Pi `{timestamp, confidence, image_url, latitude, longitude}`
- `DELETE /api/alerts` — clear all alerts
- `GET /api/nodes` — list all monitoring nodes
- `PATCH /api/nodes/:id` — update node status/timestamp
- `GET /api/status` — system health check

## Key Files
- `context/AlertsContext.tsx` — Global state (alerts, nodes, settings, voice)
- `services/ttsService.ts` — TTS service with throttle + multilingual support
- `components/CommunityMapView.tsx` — Native map component
- `components/CommunityMapView.web.tsx` — Web fallback list view
- `components/DetectionMap.tsx` — Alert detail map (native)
- `components/DetectionMap.web.tsx` — Alert detail map (web)
- `constants/colors.ts` — App color palette

## Color Palette
- Background: #0B1012 (dark) / #EEF3F5 (light)
- Card: #161E21 (dark) / #FFFFFF (light)
- Accent Green: #2DBE6C
- Alert Red: #E03B3B
- Amber: #F5A623
- Text: #EDF2F4 (dark) / #0B1012 (light)

## Polling Intervals
- Alerts: every 10 seconds
- Nodes: every 15 seconds
