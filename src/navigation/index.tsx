import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuthStore } from '../store/authStore';
import { useColors } from '../store/themeStore';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ServersMenuScreen from '../screens/servers/ServersMenuScreen';
import ServerListScreen from '../screens/servers/ServerListScreen';
import ServerDetailScreen from '../screens/servers/ServerDetailScreen';
import ServerMetricsScreen from '../screens/servers/ServerMetricsScreen';
import VncConsoleScreen from '../screens/servers/VncConsoleScreen';
import CreateServerScreen from '../screens/servers/CreateServerScreen';
import SshKeyListScreen from '../screens/servers/SshKeyListScreen';
import ImagesScreen from '../screens/servers/ImagesScreen';
import VolumeListScreen from '../screens/volumes/VolumeListScreen';
// TODO: Storage Boxes require Hetzner Robot API (separate credentials) — implement later
// import StorageBoxListScreen from '../screens/storage/StorageBoxListScreen';
import NetworkingNavigator from './NetworkingNavigator';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Settings: undefined;
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
  // StorageBoxes: undefined; // TODO: Robot API
};

export type ServersStackParamList = {
  ServersMenu: undefined;
  ServerList: undefined;
  SshKeyList: undefined;
  Images: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ServersStack = createNativeStackNavigator<ServersStackParamList>();

function ServersNavigator() {
  return (
    <ServersStack.Navigator screenOptions={{ headerShown: false }}>
      <ServersStack.Screen name="ServersMenu" component={ServersMenuScreen} />
      <ServersStack.Screen name="ServerList" component={ServerListScreen} />
      <ServersStack.Screen name="SshKeyList" component={SshKeyListScreen} />
      <ServersStack.Screen name="Images" component={ImagesScreen} />
    </ServersStack.Navigator>
  );
}

function MainTabs() {
  const colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => <Icon name="view-dashboard-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Servers"
        component={ServersNavigator}
        options={{
          title: 'Servers',
          tabBarIcon: ({ color, size }) => <Icon name="server" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Networking"
        component={NetworkingNavigator}
        options={{
          title: 'Networking',
          tabBarIcon: ({ color, size }) => <Icon name="lan" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Volumes"
        component={VolumeListScreen}
        options={{
          title: 'Volumes',
          tabBarIcon: ({ color, size }) => <Icon name="harddisk" color={color} size={size} />,
        }}
      />
      {/* TODO: StorageBoxes tab — needs Robot API integration */}
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
            <RootStack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
