import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../utils/ThemeContext';
import { DarkColors, LightColors } from '../utils/theme';

import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CustomersScreen from '../screens/CustomersScreen';
import CustomerTabScreen from '../screens/CustomerTabScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import ReceiptHistoryScreen from '../screens/ReceiptHistoryScreen';
import ReceiptHistoryDetailScreen from '../screens/ReceiptHistoryDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RestockHistoryScreen from '../screens/RestockHistoryScreen';
import StatsScreen from '../screens/StatsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ emoji, focused }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  </View>
);

function DashboardStack({ Colors }) {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.textPrimary,
      headerTitleStyle: { fontWeight: '800', fontSize: 18 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: Colors.background },
    }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Sales Statistics' }} />
    </Stack.Navigator>
  );
}

function ProductsStack({ Colors }) {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.textPrimary,
      headerTitleStyle: { fontWeight: '800', fontSize: 18 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: Colors.background },
    }}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="RestockHistory" component={RestockHistoryScreen} options={{ title: 'Restock History' }} />
    </Stack.Navigator>
  );
}

function CustomerStack({ Colors }) {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.textPrimary,
      headerTitleStyle: { fontWeight: '800', fontSize: 18 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: Colors.background },
    }}>
      <Stack.Screen name="CustomersList" component={CustomersScreen} options={{ title: 'Customers' }} />
      <Stack.Screen name="CustomerTab" component={CustomerTabScreen} options={{ title: 'Tab' }} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: 'Receipt 🧾' }} />
      <Stack.Screen name="ReceiptHistory" component={ReceiptHistoryScreen} options={{ title: 'Receipt History' }} />
      <Stack.Screen name="ReceiptHistoryDetail" component={ReceiptHistoryDetailScreen} options={{ title: 'Receipt' }} />
    </Stack.Navigator>
  );
}

function SettingsStack({ Colors }) {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.textPrimary,
      headerTitleStyle: { fontWeight: '800', fontSize: 18 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: Colors.background },
    }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: Colors.background,
      card: Colors.surface,
      text: Colors.textPrimary,
      border: Colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: -2 },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        >
          {() => <DashboardStack Colors={Colors} />}
        </Tab.Screen>
        <Tab.Screen
          name="Products"
          options={{
            tabBarLabel: 'Products',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
          }}
        >
          {() => <ProductsStack Colors={Colors} />}
        </Tab.Screen>
        <Tab.Screen
          name="Customers"
          options={{
            tabBarLabel: 'Customers',
            tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
          }}
        >
          {() => <CustomerStack Colors={Colors} />}
        </Tab.Screen>
        <Tab.Screen
          name="Settings"
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
          }}
        >
          {() => <SettingsStack Colors={Colors} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}