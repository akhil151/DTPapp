import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  useColorScheme,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAlerts } from '@/context/AlertsContext';
import { DetectionMap } from '@/components/DetectionMap';

function confidenceColor(c: number): string {
  if (c >= 0.85) return Colors.accent;
  if (c >= 0.65) return Colors.amber;
  return Colors.alertRed;
}

function confidenceLabel(c: number): string {
  if (c >= 0.85) return 'High Confidence';
  if (c >= 0.65) return 'Medium Confidence';
  return 'Low Confidence';
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { alerts } = useAlerts();

  const alert = alerts.find((a) => a.id === id);

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!alert) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <MaterialCommunityIcons name="elephant" size={48} color={colors.subtext} />
        <Text
          style={[
            styles.notFoundText,
            { color: colors.subtext, fontFamily: 'Inter_500Medium' },
          ]}
        >
          Alert not found
        </Text>
      </View>
    );
  }

  const conf = alert.confidence;
  const confColor = confidenceColor(conf);

  const openInMaps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = Platform.select({
      ios: `maps://app?ll=${alert.latitude},${alert.longitude}&q=Elephant+Detection`,
      android: `geo:${alert.latitude},${alert.longitude}?q=${alert.latitude},${alert.longitude}(Elephant+Detection)`,
      default: `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Detection Image */}
      <Image
        source={{ uri: alert.image_url }}
        style={styles.heroImage}
        contentFit="cover"
        transition={300}
      />

      {/* Alert Banner */}
      <View style={[styles.alertBanner, { backgroundColor: Colors.alertRed }]}>
        <MaterialCommunityIcons name="elephant" size={18} color="#fff" />
        <Text style={[styles.alertBannerText, { fontFamily: 'Inter_700Bold' }]}>
          Elephant Detected
        </Text>
      </View>

      <View style={styles.body}>
        {/* Confidence */}
        <View
          style={[
            styles.confCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.confLeft}>
            <Text
              style={[
                styles.confLabel,
                { color: colors.subtext, fontFamily: 'Inter_500Medium' },
              ]}
            >
              Detection Confidence
            </Text>
            <Text
              style={[
                styles.confSubLabel,
                { color: colors.subtext, fontFamily: 'Inter_400Regular' },
              ]}
            >
              {confidenceLabel(conf)}
            </Text>
          </View>
          <View style={[styles.confBadge, { backgroundColor: `${confColor}22` }]}>
            <Text
              style={[
                styles.confPercent,
                { color: confColor, fontFamily: 'Inter_700Bold' },
              ]}
            >
              {Math.round(conf * 100)}%
            </Text>
          </View>
        </View>

        {/* Info rows */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIcon,
                { backgroundColor: 'rgba(245,166,35,0.12)' },
              ]}
            >
              <Ionicons name="time" size={16} color={Colors.amber} />
            </View>
            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: colors.subtext, fontFamily: 'Inter_400Regular' },
                ]}
              >
                Timestamp
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: colors.text, fontFamily: 'Inter_500Medium' },
                ]}
              >
                {formatDateTime(alert.timestamp)}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIcon,
                { backgroundColor: 'rgba(45,190,108,0.12)' },
              ]}
            >
              <Ionicons name="location" size={16} color={Colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: colors.subtext, fontFamily: 'Inter_400Regular' },
                ]}
              >
                GPS Coordinates
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: colors.text, fontFamily: 'Inter_500Medium' },
                ]}
              >
                {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIcon,
                { backgroundColor: 'rgba(224,59,59,0.12)' },
              ]}
            >
              <Ionicons name="analytics" size={16} color={Colors.alertRed} />
            </View>
            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: colors.subtext, fontFamily: 'Inter_400Regular' },
                ]}
              >
                Alert ID
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: colors.text, fontFamily: 'Inter_500Medium' },
                ]}
              >
                #{alert.id}
              </Text>
            </View>
          </View>
        </View>

        {/* Map */}
        <View
          style={[
            styles.mapCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text
            style={[
              styles.mapTitle,
              { color: colors.text, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Detection Location
          </Text>
          <DetectionMap
            latitude={alert.latitude}
            longitude={alert.longitude}
            confidence={alert.confidence}
          />
        </View>

        {/* Open in Maps button */}
        <Pressable
          onPress={openInMaps}
          style={({ pressed }) => [
            styles.mapsBtn,
            { backgroundColor: Colors.accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="navigate" size={18} color="#0B1012" />
          <Text style={[styles.mapsBtnText, { fontFamily: 'Inter_600SemiBold' }]}>
            Open in Maps
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroImage: { width: '100%', height: 260 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  alertBannerText: { fontSize: 16, color: '#fff' },
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  notFoundText: { fontSize: 16, marginTop: 12 },
  confCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confLeft: { gap: 4 },
  confLabel: { fontSize: 14 },
  confSubLabel: { fontSize: 12 },
  confBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
  },
  confPercent: { fontSize: 28 },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1, gap: 3 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 14 },
  divider: { height: 1, marginHorizontal: 14 },
  mapCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapTitle: { fontSize: 15, padding: 14 },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  mapsBtnText: { fontSize: 16, color: '#0B1012' },
});
