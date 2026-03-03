import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAlerts } from '@/context/AlertsContext';
import { CommunityMapView } from '@/components/CommunityMapView';

export default function CommunityMapScreen() {
  const { nodes, refreshNodes } = useAlerts();

  return (
    <View style={styles.container}>
      <CommunityMapView nodes={nodes} onRefresh={refreshNodes} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
