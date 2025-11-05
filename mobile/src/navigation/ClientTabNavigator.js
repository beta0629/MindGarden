/**
 * 내담자 탭 네비게이터
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, MessageCircle, CreditCard, User } from 'lucide-react-native';
import ClientDashboard from '../screens/client/ClientDashboard';
import ClientSchedule from '../screens/client/ClientSchedule';
import ClientMessages from '../screens/client/ClientMessages';
import ClientPaymentHistory from '../screens/client/ClientPaymentHistory';
import ClientSettings from '../screens/client/ClientSettings';
import { COLORS } from '../constants/theme';
import { STRINGS } from '../constants/strings';
import { CLIENT_SCREENS } from '../constants/navigation';

const Tab = createBottomTabNavigator();

const ClientTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name={CLIENT_SCREENS.DASHBOARD}
        component={ClientDashboard}
        options={{
          tabBarLabel: STRINGS.CLIENT.TAB_HOME,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CLIENT_SCREENS.SCHEDULE}
        component={ClientSchedule}
        options={{
          tabBarLabel: STRINGS.CLIENT.TAB_SCHEDULE,
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CLIENT_SCREENS.MESSAGES}
        component={ClientMessages}
        options={{
          tabBarLabel: STRINGS.CLIENT.TAB_MESSAGES,
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CLIENT_SCREENS.PAYMENT}
        component={ClientPaymentHistory}
        options={{
          tabBarLabel: STRINGS.CLIENT.TAB_PAYMENT,
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CLIENT_SCREENS.SETTINGS}
        component={ClientSettings}
        options={{
          tabBarLabel: STRINGS.CLIENT.TAB_SETTINGS,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default ClientTabNavigator;

