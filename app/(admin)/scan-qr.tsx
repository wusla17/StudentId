import React, { useState, useEffect } from 'react';
import { StyleSheet, Button, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ScanQRScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Alert.alert(
      'QR Code Scanned',
      `Data: ${data}\nType: ${type}`,
      [
        { text: 'OK', onPress: () => setScanned(false) },
      ],
      { cancelable: false }
    );
    // Here you would typically process the scanned data, e.g., mark attendance
    console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
  };

  if (hasPermission === null) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting for camera permission</ThemedText>
      </ThemedView>
    );
  }
  if (hasPermission === false) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No access to camera</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Scan Student QR</ThemedText>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  header: {
    position: 'absolute',
    top: 50,
    zIndex: 1,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
});