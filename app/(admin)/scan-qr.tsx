import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Corrected import
import { useRouter } from 'expo-router';

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions(); // Using the hook
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.type === 'student_id' && parsedData.registrationNumber) {
        router.push({ pathname: '/(admin)/student-details', params: { studentId: parsedData.registrationNumber } });
      } else {
        Alert.alert('Invalid QR code format.', 'The scanned QR code does not contain valid student ID data.');
      }
    } catch (error) {
      Alert.alert('Invalid QR code data.', 'Could not parse the QR code content. It might not be a valid JSON string.');
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.loadingContainer}><Text>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView // Corrected component name
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <View style={styles.scanBox} />
      </View>
      {scanned && (
        <View style={styles.scanAgainButtonContainer}>
          <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
  },
  scanAgainButtonContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 5,
  },
});
