import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { initDatabase } from './src/database/db';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';
import { DarkColors, LightColors } from './src/utils/theme';

function Root() {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        await ImagePicker.requestCameraPermissionsAsync();
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
      <View style={[styles.center, { backgroundColor: Colors.background }]}>
        <ExpoStatusBar style={isDark ? 'light' : 'dark'} backgroundColor={Colors.background} translucent={false} />
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={Colors.background} />
        <Text style={[styles.errorText, { color: Colors.danger }]}>⚠️ Failed to load database</Text>
        <Text style={[styles.errorSub, { color: Colors.textSecondary }]}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: Colors.background }]}>
        <ExpoStatusBar style={isDark ? 'light' : 'dark'} backgroundColor={Colors.background} translucent={false} />
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={Colors.background} />
        <Text style={styles.splashLogo}>🛒</Text>
        <Text style={[styles.splashTitle, { color: Colors.textPrimary }]}>Stokku</Text>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ExpoStatusBar
          style={isDark ? 'light' : 'dark'}
          backgroundColor={Colors.surface}
          translucent={false}
        />
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={Colors.surface}
        />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  splashLogo: { fontSize: 64, marginBottom: 12 },
  splashTitle: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  errorText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errorSub: { fontSize: 13, textAlign: 'center' },
});