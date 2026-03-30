import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ServersMenuScreen from '../screens/servers/ServersMenuScreen';
import ServerListScreen from '../screens/servers/ServerListScreen';
import ServerDetailScreen from '../screens/servers/ServerDetailScreen';
import ServerMetricsScreen from '../screens/servers/ServerMetricsScreen';
import VncConsoleScreen from '../screens/servers/VncConsoleScreen';
import CreateServerScreen from '../screens/servers/CreateServerScreen';
import VolumeListScreen from '../screens/volumes/VolumeListScreen';
import StorageBoxListScreen from '../screens/storage/StorageBoxListScreen';
import NetworkingNavigator from './NetworkingNavigator';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ServerDetail: { serverId: number };
  ServerMetrics: { serverId: number };
  VncConsole: { serverId: number; serverName: string };
  CreateServer: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Servers: undefined;
  Networking: undefined;
  Volumes: undefined;
  StorageBoxes: undefined;
};

export type ServersStackParamList = {
  ServersMenu: undefined;
  ServerList: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ServersStack = createNativeStackNavigator<ServersStackParamList>();

function ServersNavigator() {
  return (
    <ServersStack.Navigator screenOptions={{ headerShown: false }}>
      <ServersStack.Screen name="ServersMenu" component={ServersMenuScreen} />
      <ServersStack.Screen name="ServerList" component={ServerListScreen} />
    </ServersStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.cardBorder,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Servers" component={ServersNavigator} options={{ title: 'Servers' }} />
      <Tab.Screen name="Networking" component={NetworkingNavigator} options={{ title: 'Networking' }} />
      <Tab.Screen name="Volumes" component={VolumeListScreen} options={{ title: 'Volumes' }} />
      <Tab.Screen name="StorageBoxes" component={StorageBoxListScreen} options={{ title: 'Storage' }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen
              name="ServerDetail"
              component={ServerDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="ServerMetrics"
              component={ServerMetricsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="VncConsole"
              component={VncConsoleScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
            />
            <RootStack.Screen
              name="CreateServer"
              component={CreateServerScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
