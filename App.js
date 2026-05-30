import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase } from './src/database/db';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/utils/theme';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, stack: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.message, stack: error.stack };
  }
  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 20 }}>
          <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginTop: 60, marginBottom: 16 }}>
            ⚠️ App Crashed
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 14, marginBottom: 16 }}>
            {this.state.error}
          </Text>
          <Text style={{ color: '#aaaaaa', fontSize: 11, fontFamily: 'monospace' }}>
            {this.state.stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

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
        setError(e.message + '\n\n' + e.stack);
      }
    })();
  }, []);

  if (error) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 20 }}>
        <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginTop: 60, marginBottom: 16 }}>
          ⚠️ DB Error
        </Text>
        <Text style={{ color: '#ffffff', fontSize: 13 }}>{error}</Text>
      </ScrollView>
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
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor={Colors.surface} />
          <AppNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
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
});