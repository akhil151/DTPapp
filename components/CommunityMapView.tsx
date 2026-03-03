import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  useColorScheme,
} from 'react-native';
import MapView, {
  Marker,
  Circle,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
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

function formatFull(isoString: string | null): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_CONFIG: Record<
  NodeStatus,
  { label: string; color: string; markerColor: string }
> = {
  alert: { label: 'Alert', color: Colors.alertRed, markerColor: Colors.alertRed },
  monitoring: { label: 'Monitoring', color: Colors.amber, markerColor: Colors.amber },
  safe: { label: 'Safe', color: Colors.accent, markerColor: '#0080FF' },
  inactive: { label: 'Inactive', color: '#6B8088', markerColor: '#6B8088' },
};

const ZONE_CONFIG: Record<
  Exclude<NodeStatus, 'inactive'>,
  { fill: string; stroke: string; label: string }
> = {
  alert: {
    fill: 'rgba(224,59,59,0.25)',
    stroke: Colors.alertRed,
    label: 'High Risk Zone',
  },
  monitoring: {
    fill: 'rgba(245,166,35,0.18)',
    stroke: Colors.amber,
    label: 'Monitoring Zone',
  },
  safe: {
    fill: 'rgba(45,190,108,0.18)',
    stroke: Colors.accent,
    label: 'Safe Zone',
  },
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

  const [showZones, setShowZones] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const handleMarkerPress = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleCloseSheet = useCallback(() => setSelectedNode(null), []);

  const selectedStatus = selectedNode ? getNodeStatus(selectedNode) : null;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: -2.651,
          longitude: 37.261,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        {nodes.map((node) => {
          const status = getNodeStatus(node);
          const config = STATUS_CONFIG[status];

          return (
            <React.Fragment key={node.id}>
              {showZones && status !== 'inactive' && (
                <Circle
                  center={{ latitude: node.latitude, longitude: node.longitude }}
                  radius={500}
                  fillColor={ZONE_CONFIG[status as Exclude<NodeStatus, 'inactive'>].fill}
                  strokeColor={ZONE_CONFIG[status as Exclude<NodeStatus, 'inactive'>].stroke}
                  strokeWidth={1.5}
                />
              )}
              <Marker
                coordinate={{ latitude: node.latitude, longitude: node.longitude }}
                onPress={() => handleMarkerPress(node)}
                pinColor={config.markerColor}
                title={node.node_id}
              />
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Top Controls */}
      <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => setShowZones((v) => !v)}
          style={({ pressed }) => [
            styles.toggleBtn,
            {
              backgroundColor: showZones ? Colors.accent : 'rgba(11,16,18,0.8)',
              borderColor: Colors.accent,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name="radio-button-on"
            size={14}
            color={showZones ? '#0B1012' : Colors.accent}
          />
          <Text
            style={[
              styles.toggleBtnText,
              {
                color: showZones ? '#0B1012' : Colors.accent,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            {showZones ? 'Zones On' : 'Zones Off'}
          </Text>
        </Pressable>

        <View style={styles.topRight}>
          <Pressable
            onPress={() => setShowLegend((v) => !v)}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: 'rgba(11,16,18,0.8)', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="information-circle" size={20} color="#EDF2F4" />
          </Pressable>
          <Pressable
            onPress={onRefresh}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: 'rgba(11,16,18,0.8)', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="refresh" size={18} color="#EDF2F4" />
          </Pressable>
        </View>
      </View>

      {/* Legend */}
      {showLegend && (
        <View
          style={[
            styles.legend,
            {
              bottom: insets.bottom + 120,
              backgroundColor: isDark
                ? 'rgba(22,30,33,0.95)'
                : 'rgba(255,255,255,0.95)',
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.legendTitle,
              { color: colors.text, fontFamily: 'Inter_700Bold' },
            ]}
          >
            Legend
          </Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: Colors.alertRed }]} />
            <Text
              style={[
                styles.legendLabel,
                { color: colors.text, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Alert Zone ({"<"}30 min)
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: Colors.amber }]} />
            <Text
              style={[
                styles.legendLabel,
                { color: colors.text, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Monitoring (30 min – 6h)
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
            <Text
              style={[
                styles.legendLabel,
                { color: colors.text, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Safe Zone ({">"}6 hours)
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#0080FF' }]} />
            <Text
              style={[
                styles.legendLabel,
                { color: colors.text, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Active Node
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#6B8088' }]} />
            <Text
              style={[
                styles.legendLabel,
                { color: colors.text, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Inactive Node
            </Text>
          </View>
        </View>
      )}

      {/* Node Stats Bar */}
      <View
        style={[
          styles.statsBar,
          {
            bottom: insets.bottom + 80,
            backgroundColor: isDark
              ? 'rgba(22,30,33,0.92)'
              : 'rgba(255,255,255,0.92)',
          },
        ]}
      >
        {(
          [
            ['alert', Colors.alertRed, nodes.filter((n) => getNodeStatus(n) === 'alert').length],
            ['monitoring', Colors.amber, nodes.filter((n) => getNodeStatus(n) === 'monitoring').length],
            ['safe', Colors.accent, nodes.filter((n) => getNodeStatus(n) === 'safe').length],
            ['inactive', '#6B8088', nodes.filter((n) => getNodeStatus(n) === 'inactive').length],
          ] as [string, string, number][]
        ).map(([label, color, count]) => (
          <View key={label} style={styles.statItem}>
            <Text
              style={[
                styles.statCount,
                { color, fontFamily: 'Inter_700Bold' },
              ]}
            >
              {count}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: colors.subtext, fontFamily: 'Inter_400Regular' },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Node Bottom Sheet */}
      <Modal
        visible={!!selectedNode}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSheet}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCloseSheet}>
          <Pressable
            style={[
              styles.bottomSheet,
              {
                backgroundColor: isDark ? '#161E21' : '#FFFFFF',
                paddingBottom: insets.bottom + 20,
              },
            ]}
            onPress={() => {}}
          >
            {/* Handle */}
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? '#2A3840' : '#D5E0E4' },
              ]}
            />

            {selectedNode && selectedStatus && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Node Header */}
                <View style={styles.sheetHeader}>
                  <View>
                    <Text
                      style={[
                        styles.nodeId,
                        { color: isDark ? '#EDF2F4' : '#0B1012', fontFamily: 'Inter_700Bold' },
                      ]}
                    >
                      {selectedNode.node_id}
                    </Text>
                    <Text
                      style={[
                        styles.nodeCoords,
                        { color: isDark ? '#6B8088' : '#4A6068', fontFamily: 'Inter_400Regular' },
                      ]}
                    >
                      {selectedNode.latitude.toFixed(5)},{' '}
                      {selectedNode.longitude.toFixed(5)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${STATUS_CONFIG[selectedStatus].color}22`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_CONFIG[selectedStatus].color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusLabel,
                        {
                          color: STATUS_CONFIG[selectedStatus].color,
                          fontFamily: 'Inter_700Bold',
                        },
                      ]}
                    >
                      {STATUS_CONFIG[selectedStatus].label}
                    </Text>
                  </View>
                </View>

                {/* Detail Rows */}
                {[
                  {
                    icon: 'time',
                    iconColor: Colors.amber,
                    label: 'Last Detection',
                    value: formatFull(selectedNode.last_detection_timestamp),
                  },
                  {
                    icon: 'timer-outline',
                    iconColor: Colors.accent,
                    label: 'Time Since',
                    value: timeSince(selectedNode.last_detection_timestamp),
                  },
                  {
                    icon: 'radio',
                    iconColor: selectedNode.is_active ? Colors.accent : '#6B8088',
                    label: 'Node Status',
                    value: selectedNode.is_active ? 'Active' : 'Inactive',
                  },
                ].map((row) => (
                  <View
                    key={row.label}
                    style={[
                      styles.detailRow,
                      {
                        borderBottomColor: isDark ? '#1F2B2F' : '#D5E0E4',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.detailIcon,
                        { backgroundColor: `${row.iconColor}18` },
                      ]}
                    >
                      <Ionicons
                        name={row.icon as any}
                        size={16}
                        color={row.iconColor}
                      />
                    </View>
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          {
                            color: isDark ? '#6B8088' : '#4A6068',
                            fontFamily: 'Inter_400Regular',
                          },
                        ]}
                      >
                        {row.label}
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color: isDark ? '#EDF2F4' : '#0B1012',
                            fontFamily: 'Inter_500Medium',
                          },
                        ]}
                      >
                        {row.value}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Zone label */}
                {selectedStatus !== 'inactive' && (
                  <View
                    style={[
                      styles.zoneLabel,
                      {
                        backgroundColor: `${ZONE_CONFIG[selectedStatus].stroke}18`,
                        borderColor: ZONE_CONFIG[selectedStatus].stroke,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-radius"
                      size={16}
                      color={ZONE_CONFIG[selectedStatus].stroke}
                    />
                    <Text
                      style={[
                        styles.zoneLabelText,
                        {
                          color: ZONE_CONFIG[selectedStatus].stroke,
                          fontFamily: 'Inter_600SemiBold',
                        },
                      ]}
                    >
                      {ZONE_CONFIG[selectedStatus].label} — 500m radius
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  toggleBtnText: { fontSize: 13 },
  topRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    position: 'absolute',
    left: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    minWidth: 220,
  },
  legendTitle: { fontSize: 13, marginBottom: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 13 },
  statsBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statCount: { fontSize: 20 },
  statLabel: { fontSize: 11, textTransform: 'capitalize' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  nodeId: { fontSize: 22 },
  nodeCoords: { fontSize: 12, marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: { flex: 1, gap: 3 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 15 },
  zoneLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  zoneLabelText: { fontSize: 13 },
});
