import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DetectionMapProps {
  latitude: number;
  longitude: number;
  confidence: number;
}

export function DetectionMap({ latitude, longitude }: DetectionMapProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={40} color="#3D5059" />
      <Text style={styles.coords}>
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Text>
      <Text style={styles.hint}>Open in Maps to view location</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1012',
    gap: 10,
  },
  coords: {
    fontSize: 14,
    color: '#6B8088',
    fontFamily: 'Inter_500Medium',
  },
  hint: {
    fontSize: 12,
    color: '#3D5059',
    fontFamily: 'Inter_400Regular',
  },
});
