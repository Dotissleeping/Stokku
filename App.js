import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase } from './src/database/db';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/utils/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        setReady(true);
      } catch (e) {
        console.error('DB init failed:', e);
        setError(e.message);
      }
    })();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ Failed to load database</Text>
        <Text style={styles.errorSub}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <Text style={styles.splashLogo}>🛒</Text>
        <Text style={styles.splashTitle}>Stokku</Text>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={Colors.surface} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashLogo: { fontSize: 64, marginBottom: 12 },
  splashTitle: { fontSize: 36, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1 },
  errorText: { fontSize: 18, fontWeight: '700', color: Colors.danger, marginBottom: 8 },
  errorSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
