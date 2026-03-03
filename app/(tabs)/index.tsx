import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  useColorScheme,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAlerts } from '@/context/AlertsContext';

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

function confidenceColor(c: number): string {
  if (c >= 0.85) return Colors.accent;
  if (c >= 0.65) return Colors.amber;
  return Colors.alertRed;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { alerts, isOnline, isLoading, refreshAlerts } = useAlerts();
  const lastAlert = alerts[0] ?? null;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : 0;

  const handleAlertPress = useCallback(() => {
    if (!lastAlert) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/alert/[id]', params: { id: lastAlert.id } });
  }, [lastAlert]);

  const handleCameraPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/camera');
  }, []);

  const handleHistoryPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/history');
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refreshAlerts}
          tintColor={colors.tint}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.appTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            ElephantWatch
          </Text>
          <Text style={[styles.appSubtitle, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
            Movement Monitoring System
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isOnline
                ? 'rgba(45,190,108,0.15)'
                : 'rgba(224,59,59,0.15)',
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? Colors.accent : Colors.alertRed },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: isOnline ? Colors.accent : Colors.alertRed,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Last Detection */}
      <Text
        style={[
          styles.sectionLabel,
          { color: colors.subtext, fontFamily: 'Inter_500Medium' },
        ]}
      >
        LAST DETECTION
      </Text>

      {lastAlert ? (
        <Pressable
          onPress={handleAlertPress}
          style={({ pressed }) => [
            styles.alertCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
          ]}
        >
          <Image
            source={{ uri: lastAlert.image_url }}
            style={styles.alertImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.alertBanner}>
            <View style={styles.alertBannerLeft}>
              <MaterialCommunityIcons
                name="elephant"
                size={18}
                color={Colors.alertRed}
              />
              <Text
                style={[
                  styles.alertBannerTitle,
                  { fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
                ]}
              >
                Elephant Detected
              </Text>
            </View>
            <Text
              style={[
                styles.alertTime,
                { fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
              ]}
            >
              {formatRelativeTime(lastAlert.timestamp)}
            </Text>
          </View>
          <View style={styles.alertDetails}>
            <View style={styles.alertDetailRow}>
              <Ionicons name="analytics" size={16} color={colors.subtext} />
              <Text
                style={[
                  styles.alertDetailLabel,
                  { color: colors.subtext, fontFamily: 'Inter_400Regular' },
                ]}
              >
                Confidence
              </Text>
              <Text
                style={[
                  styles.alertDetailValue,
                  {
                    color: confidenceColor(lastAlert.confidence),
                    fontFamily: 'Inter_700Bold',
                  },
                ]}
              >
                {Math.round(lastAlert.confidence * 100)}%
              </Text>
            </View>
            <View style={styles.alertDetailRow}>
              <Ionicons name="location" size={16} color={colors.subtext} />
              <Text
                style={[
                  styles.alertDetailLabel,
                  { color: colors.subtext, fontFamily: 'Inter_400Regular' },
                ]}
              >
                Location
              </Text>
              <Text
                style={[
                  styles.alertDetailValue,
                  { color: colors.text, fontFamily: 'Inter_500Medium' },
                ]}
              >
                {lastAlert.latitude.toFixed(4)}, {lastAlert.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
          <View style={styles.viewDetailRow}>
            <Text
              style={[
                styles.viewDetailText,
                { color: colors.tint, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              View Details
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.tint} />
          </View>
        </Pressable>
      ) : (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <MaterialCommunityIcons name="elephant" size={48} color={colors.subtext} />
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            No detections yet
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: colors.subtext, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Alerts will appear here when elephants are detected
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text
        style={[
          styles.sectionLabel,
          { color: colors.subtext, fontFamily: 'Inter_500Medium', marginTop: 28 },
        ]}
      >
        QUICK ACCESS
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleCameraPress}
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.85 : 1,
              flex: 1,
            },
          ]}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(45,190,108,0.12)' }]}>
            <Ionicons name="videocam" size={24} color={Colors.accent} />
          </View>
          <Text
            style={[
              styles.actionLabel,
              { color: colors.text, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Live Camera
          </Text>
          <Text
            style={[
              styles.actionSub,
              { color: colors.subtext, fontFamily: 'Inter_400Regular' },
            ]}
          >
            View stream
          </Text>
        </Pressable>

        <Pressable
          onPress={handleHistoryPress}
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.85 : 1,
              flex: 1,
            },
          ]}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(245,166,35,0.12)' }]}>
            <Ionicons name="time" size={24} color={Colors.amber} />
          </View>
          <Text
            style={[
              styles.actionLabel,
              { color: colors.text, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Alert History
          </Text>
          <Text
            style={[
              styles.actionSub,
              { color: colors.subtext, fontFamily: 'Inter_400Regular' },
            ]}
          >
            {alerts.length} records
          </Text>
        </Pressable>

        {lastAlert && (
          <Pressable
            onPress={handleAlertPress}
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.85 : 1,
                flex: 1,
              },
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(224,59,59,0.12)' }]}>
              <Ionicons name="map" size={24} color={Colors.alertRed} />
            </View>
            <Text
              style={[
                styles.actionLabel,
                { color: colors.text, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              Open Map
            </Text>
            <Text
              style={[
                styles.actionSub,
                { color: colors.subtext, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Last location
            </Text>
          </Pressable>
        )}
      </View>

      {/* System Stats */}
      <View
        style={[
          styles.statsRow,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            {alerts.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
            Total Alerts
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.accent, fontFamily: 'Inter_700Bold' }]}>
            {alerts.length > 0
              ? `${Math.round(alerts.reduce((s, a) => s + a.confidence, 0) / alerts.length * 100)}%`
              : '--'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
            Avg Confidence
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.amber, fontFamily: 'Inter_700Bold' }]}>
            {alerts.filter((a) => {
              const hours = (Date.now() - new Date(a.timestamp).getTime()) / 3600000;
              return hours < 24;
            }).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
            Last 24h
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  appTitle: { fontSize: 28, letterSpacing: -0.5 },
  appSubtitle: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 12 },
  alertCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  alertImage: { width: '100%', height: 220 },
  alertBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  alertBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertBannerTitle: { fontSize: 15, color: '#fff' },
  alertTime: { fontSize: 13 },
  alertDetails: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  alertDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertDetailLabel: { fontSize: 14, flex: 1 },
  alertDetailValue: { fontSize: 14 },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  viewDetailText: { fontSize: 14 },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: { fontSize: 18 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 13 },
  actionSub: { fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, marginVertical: 4 },
});
