import React from 'react';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { StyleSheet } from 'react-native';

interface DetectionMapProps {
  latitude: number;
  longitude: number;
  confidence: number;
}

export function DetectionMap({ latitude, longitude, confidence }: DetectionMapProps) {
  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title="Elephant Detected"
        description={`Confidence: ${Math.round(confidence * 100)}%`}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 220 },
});
