import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import type { Node } from '@/context/AlertsContext';

type NodeStatus = 'alert' | 'monitoring' | 'safe' | 'inactive';

function getNodeStatus(node: Node): NodeStatus {
  if (!node.is_active) return 'inactive';
  if (!node.last_detection_timestamp) return 'safe';
  const mins =
    (Date.now() - new Date(node.last_detection_timestamp).getTime()) / 60000;
  if (mins <= 30) return 'alert';
  if (mins <= 360) return 'monitoring';
  return 'safe';
}

function timeSince(isoString: string | null): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_CONFIG: Record<
  NodeStatus,
  { label: string; color: string }
> = {
  alert: { label: 'Alert', color: Colors.alertRed },
  monitoring: { label: 'Monitoring', color: Colors.amber },
  safe: { label: 'Safe', color: Colors.accent },
  inactive: { label: 'Inactive', color: '#6B8088' },
};

interface Props {
  nodes: Node[];
  onRefresh: () => void;
}

export function CommunityMapView({ nodes, onRefresh }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Community Map
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
            {nodes.length} monitoring nodes
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.refreshBtn,
            { borderColor: colors.cardBorder, backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="refresh" size={18} color={colors.tint} />
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {(['alert', 'monitoring', 'safe', 'inactive'] as NodeStatus[]).map((status) => {
          const count = nodes.filter((n) => getNodeStatus(n) === status).length;
          const config = STATUS_CONFIG[status];
          return (
            <View key={status} style={styles.statItem}>
              <Text style={[styles.statCount, { color: config.color, fontFamily: 'Inter_700Bold' }]}>
                {count}
              </Text>
              <Text style={[styles.statLabel, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
                {config.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Map link */}
      <Pressable
        onPress={() => {
          if (nodes.length > 0) {
            const first = nodes[0];
            Linking.openURL(
              `https://www.google.com/maps?q=${first.latitude},${first.longitude}`,
            );
          }
        }}
        style={({ pressed }) => [
          styles.mapLinkBtn,
          { backgroundColor: Colors.accent, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="map" size={18} color="#0B1012" />
        <Text style={[styles.mapLinkText, { fontFamily: 'Inter_600SemiBold' }]}>
          View on Google Maps
        </Text>
      </Pressable>

      <Text style={[styles.sectionLabel, { color: colors.subtext, fontFamily: 'Inter_500Medium' }]}>
        DETECTION NODES
      </Text>

      {nodes.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="radar" size={48} color={colors.subtext} />
          <Text style={[styles.emptyText, { color: colors.subtext, fontFamily: 'Inter_500Medium' }]}>
            No nodes found
          </Text>
        </View>
      )}

      {nodes.map((node) => {
        const status = getNodeStatus(node);
        const config = STATUS_CONFIG[status];
        return (
          <View
            key={node.id}
            style={[styles.nodeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <View style={styles.nodeTop}>
              <View style={styles.nodeLeft}>
                <Text style={[styles.nodeId, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                  {node.node_id}
                </Text>
                <Text style={[styles.nodeCoords, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
                  {node.latitude.toFixed(5)}, {node.longitude.toFixed(5)}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${config.color}22` }]}>
                <View style={[styles.badgeDot, { backgroundColor: config.color }]} />
                <Text style={[styles.badgeText, { color: config.color, fontFamily: 'Inter_600SemiBold' }]}>
                  {config.label}
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.nodeBottom}>
              <Ionicons name="time-outline" size={13} color={colors.subtext} />
              <Text style={[styles.detectionTime, { color: colors.subtext, fontFamily: 'Inter_400Regular' }]}>
                Last detected: {timeSince(node.last_detection_timestamp)}
              </Text>
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: node.is_active ? Colors.accent : '#6B8088' },
                ]}
              />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, paddingVertical: 14, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statCount: { fontSize: 22 },
  statLabel: { fontSize: 11, textTransform: 'capitalize' },
  mapLinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, marginBottom: 24 },
  mapLinkText: { fontSize: 15, color: '#0B1012' },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 16 },
  nodeCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  nodeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14 },
  nodeLeft: { gap: 3 },
  nodeId: { fontSize: 16 },
  nodeCoords: { fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12 },
  divider: { height: 1, marginHorizontal: 14 },
  nodeBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  detectionTime: { fontSize: 12, flex: 1 },
  activeIndicator: { width: 8, height: 8, borderRadius: 4 },
});
