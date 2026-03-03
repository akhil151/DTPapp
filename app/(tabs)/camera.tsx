import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useAlerts } from '@/context/AlertsContext';

export default function CameraScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { settings } = useAlerts();

  const [frameUri, setFrameUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const cameraUrl = settings.cameraUrl.trim();

  const startStream = useCallback(() => {
    if (!cameraUrl) return;
    setHasError(false);
    setIsConnecting(true);
    setIsActive(true);
    setFrameUri(`${cameraUrl}/video_feed?t=${Date.now()}`);
  }, [cameraUrl]);

  const stopStream = useCallback(() => {
    setIsActive(false);
    setFrameUri('');
  }, []);

  useEffect(() => {
    if (!isActive || !cameraUrl) return;
    const interval = setInterval(() => {
      setFrameUri(`${cameraUrl}/video_feed?t=${Date.now()}`);
    }, 800);
    return () => clearInterval(interval);
  }, [isActive, cameraUrl]);

  useEffect(() => {
    if (cameraUrl) startStream();
    return () => setIsActive(false);
  }, [cameraUrl]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!cameraUrl) {
    return (
      <View style={[styles.container, { backgroundColor: '#0B1012' }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Text style={[styles.headerTitle, { fontFamily: 'Inter_700Bold' }]}>
            Live Camera
          </Text>
        </View>
        <View style={styles.centerContent}>
          <View style={styles.noUrlIcon}>
            <Ionicons name="videocam-off" size={48} color="#3D5059" />
          </View>
          <Text style={[styles.noUrlTitle, { fontFamily: 'Inter_600SemiBold' }]}>
            Camera Not Configured
          </Text>
          <Text style={[styles.noUrlSubtitle, { fontFamily: 'Inter_400Regular' }]}>
            Set your Raspberry Pi camera URL in Settings to view the live stream
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/settings');
            }}
            style={({ pressed }) => [
              styles.settingsBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="settings" size={18} color="#0B1012" />
            <Text style={[styles.settingsBtnText, { fontFamily: 'Inter_600SemiBold' }]}>
              Open Settings
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0B1012' }]}>
      {/* Stream Area */}
      <View style={styles.streamContainer}>
        {frameUri ? (
          <Image
            source={{ uri: frameUri }}
            style={styles.streamImage}
            contentFit="contain"
            cachePolicy="no-cache"
            onLoadStart={() => setIsConnecting(true)}
            onLoad={() => {
              setIsConnecting(false);
              setHasError(false);
            }}
            onError={() => {
              setIsConnecting(false);
              setHasError(true);
            }}
          />
        ) : null}

        {isConnecting && !hasError && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={[styles.overlayText, { fontFamily: 'Inter_400Regular' }]}>
              Connecting to camera...
            </Text>
          </View>
        )}

        {hasError && (
          <View style={styles.overlay}>
            <Ionicons name="wifi-outline" size={48} color="#3D5059" />
            <Text style={[styles.overlayTitle, { fontFamily: 'Inter_600SemiBold' }]}>
              Stream Unavailable
            </Text>
            <Text style={[styles.overlayText, { fontFamily: 'Inter_400Regular' }]}>
              Cannot connect to camera
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                startStream();
              }}
              style={({ pressed }) => [styles.reconnectBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="refresh" size={16} color="#0B1012" />
              <Text style={[styles.reconnectText, { fontFamily: 'Inter_600SemiBold' }]}>
                Reconnect
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Header overlay */}
      <View style={[styles.headerOverlay, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.headerTitle, { fontFamily: 'Inter_700Bold' }]}>Live Camera</Text>
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, { backgroundColor: hasError ? Colors.alertRed : Colors.accent }]} />
          <Text style={[styles.liveText, { fontFamily: 'Inter_600SemiBold' }]}>
            {hasError ? 'OFFLINE' : 'LIVE'}
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: bottomPad + 100 },
        ]}
      >
        <Text
          style={[styles.urlText, { fontFamily: 'Inter_400Regular' }]}
          numberOfLines={1}
        >
          {cameraUrl}
        </Text>
        <View style={styles.controlRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (isActive) stopStream();
              else startStream();
            }}
            style={({ pressed }) => [
              styles.controlBtn,
              {
                backgroundColor: isActive ? Colors.alertRed : Colors.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name={isActive ? 'stop' : 'play'}
              size={18}
              color="#fff"
            />
            <Text style={[styles.controlBtnText, { fontFamily: 'Inter_600SemiBold' }]}>
              {isActive ? 'Stop' : 'Start'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              startStream();
            }}
            style={({ pressed }) => [
              styles.controlBtnSecondary,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="refresh" size={18} color={Colors.accent} />
            <Text
              style={[
                styles.controlBtnSecondaryText,
                { fontFamily: 'Inter_600SemiBold', color: Colors.accent },
              ]}
            >
              Reconnect
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1012' },
  streamContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamImage: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1012',
    gap: 16,
  },
  overlayTitle: { fontSize: 18, color: '#EDF2F4' },
  overlayText: { fontSize: 14, color: '#6B8088', textAlign: 'center', paddingHorizontal: 40 },
  reconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  reconnectText: { fontSize: 15, color: '#0B1012' },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(11,16,18,0.75)',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, color: '#EDF2F4' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 13, color: '#EDF2F4', letterSpacing: 1 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(11,16,18,0.85)',
    gap: 12,
  },
  urlText: { fontSize: 12, color: '#6B8088' },
  controlRow: { flexDirection: 'row', gap: 12 },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  controlBtnText: { fontSize: 15, color: '#fff' },
  controlBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  controlBtnSecondaryText: { fontSize: 15 },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  noUrlIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#161E21',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noUrlTitle: { fontSize: 20, color: '#EDF2F4', textAlign: 'center' },
  noUrlSubtitle: { fontSize: 14, color: '#6B8088', textAlign: 'center', lineHeight: 22 },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 8,
  },
  settingsBtnText: { fontSize: 15, color: '#0B1012' },
});
