import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FirewallListScreen from '../screens/networking/FirewallListScreen';
import FirewallDetailScreen from '../screens/networking/FirewallDetailScreen';
import CreateFirewallScreen from '../screens/networking/CreateFirewallScreen';
import NetworkListScreen from '../screens/networking/NetworkListScreen';
import NetworkDetailScreen from '../screens/networking/NetworkDetailScreen';
import LoadBalancerListScreen from '../screens/networking/LoadBalancerListScreen';
import LoadBalancerDetailScreen from '../screens/networking/LoadBalancerDetailScreen';
import NetworkingMenuScreen from '../screens/networking/NetworkingMenuScreen';
import FloatingIpListScreen from '../screens/networking/FloatingIpListScreen';

export type NetworkingStackParamList = {
  NetworkingMenu: undefined;
  FirewallList: undefined;
  FirewallDetail: { firewallId: number };
  CreateFirewall: undefined;
  NetworkList: undefined;
  NetworkDetail: { networkId: number };
  LoadBalancerList: undefined;
  LoadBalancerDetail: { lbId: number };
  FloatingIpList: undefined;
};

const Stack = createNativeStackNavigator<NetworkingStackParamList>();

export default function NetworkingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NetworkingMenu" component={NetworkingMenuScreen} />
      <Stack.Screen name="FirewallList" component={FirewallListScreen} />
      <Stack.Screen name="FirewallDetail" component={FirewallDetailScreen} />
      <Stack.Screen name="CreateFirewall" component={CreateFirewallScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="NetworkList" component={NetworkListScreen} />
      <Stack.Screen name="NetworkDetail" component={NetworkDetailScreen} />
      <Stack.Screen name="LoadBalancerList" component={LoadBalancerListScreen} />
      <Stack.Screen name="LoadBalancerDetail" component={LoadBalancerDetailScreen} />
      <Stack.Screen name="FloatingIpList" component={FloatingIpListScreen} />
    </Stack.Navigator>
  );
}
