import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  useColorScheme,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAlerts, Alert } from '@/context/AlertsContext';

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function confidenceColor(c: number): string {
  if (c >= 0.85) return Colors.accent;
  if (c >= 0.65) return Colors.amber;
  return Colors.alertRed;
}

function confidenceLabel(c: number): string {
  if (c >= 0.85) return 'High';
  if (c >= 0.65) return 'Medium';
  return 'Low';
}

function AlertCard({ alert, colors, onPress }: { alert: Alert; colors: typeof Colors.dark; onPress: () => void }) {
  const conf = alert.confidence;
  const color = confidenceColor(conf);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <Image
        source={{ uri: alert.image_url }}
        style={styles.cardImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="elephant" size={14} color={Colors.alertRed} />
              <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                Elephant Detected
              </Text>
            </View>
            <Text style={[styles.cardTime, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
              {formatTime(alert.timestamp)}
            </Text>
            <Text style={[styles.cardDate, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
              {formatDate(alert.timestamp)}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
              <Text style={[styles.badgePercent, { color, fontFamily: 'Inter_700Bold' }]}>
                {Math.round(conf * 100)}%
              </Text>
            </View>
            <Text style={[styles.badgeLabel, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
              {confidenceLabel(conf)}
            </Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.subtext} />
          <Text style={[styles.locationText, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
            {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.subtext} style={{ marginLeft: 'auto' }} />
        </View>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { alerts, isLoading, refreshAlerts } = useAlerts();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handlePress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/alert/[id]', params: { id } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Alert }) => (
      <AlertCard
        alert={item}
        colors={colors}
        onPress={() => handlePress(item.id)}
      />
    ),
    [colors, handlePress],
  );

  const ListHeader = (
    <View style={[styles.listHeader, { paddingTop: topPad + 16 }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
        Alert History
      </Text>
      <Text style={[styles.subtitle, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
        {alerts.length} detection{alerts.length !== 1 ? 's' : ''} recorded
      </Text>
    </View>
  );

  const ListEmpty = (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="elephant" size={56} color={colors.subtext} />
      <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
        No alerts recorded
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
        Detection events will appear here automatically
      </Text>
    </View>
  );

  return (
    <FlatList
      data={alerts}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 },
      ]}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={!isLoading ? ListEmpty : null}
      showsVerticalScrollIndicator={false}
      scrollEnabled={alerts.length > 0}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refreshAlerts}
          tintColor={colors.tint}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20 },
  listHeader: { marginBottom: 20 },
  title: { fontSize: 28, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardImage: { width: 88, height: 88 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 14 },
  cardTime: { fontSize: 12 },
  cardDate: { fontSize: 11, marginTop: 1 },
  cardRight: { alignItems: 'center', gap: 4 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgePercent: { fontSize: 15 },
  badgeLabel: { fontSize: 11 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: { fontSize: 11 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyTitle: { fontSize: 20 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
