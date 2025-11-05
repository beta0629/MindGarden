/**
 * 상담사 탭 네비게이터
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, MessageCircle, FileText, BarChart3, Users, User } from 'lucide-react-native';
import ConsultantDashboard from '../screens/consultant/ConsultantDashboard';
import ConsultantSchedule from '../screens/consultant/ConsultantSchedule';
import ConsultantMessages from '../screens/consultant/ConsultantMessages';
import ConsultantRecords from '../screens/consultant/ConsultantRecords';
import ClientManagement from '../screens/consultant/ClientManagement';
import ConsultantStatistics from '../screens/consultant/ConsultantStatistics';
import ConsultantSettings from '../screens/consultant/ConsultantSettings';
import { COLORS, SPACING } from '../constants/theme';
import SIZES from '../constants/sizes';
import { STRINGS } from '../constants/strings';
import { CONSULTANT_SCREENS } from '../constants/navigation';

const Tab = createBottomTabNavigator();

const ConsultantTabNavigator = () => {
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
          paddingBottom: SPACING.xs,
          paddingTop: SPACING.xs,
          height: SIZES.TAB_BAR_HEIGHT,
        },
      }}
    >
      <Tab.Screen
        name={CONSULTANT_SCREENS.DASHBOARD}
        component={ConsultantDashboard}
        options={{
          tabBarLabel: STRINGS.CONSULTANT.TAB_HOME || '홈',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CONSULTANT_SCREENS.SCHEDULE}
        component={ConsultantSchedule}
        options={{
          tabBarLabel: STRINGS.CONSULTANT.TAB_SCHEDULE || '일정',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CONSULTANT_SCREENS.MESSAGES}
        component={ConsultantMessages}
        options={{
          tabBarLabel: STRINGS.MESSAGE.TITLE,
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CONSULTANT_SCREENS.RECORDS}
        component={ConsultantRecords}
        options={{
          tabBarLabel: STRINGS.CONSULTANT.CONSULTATION_RECORDS,
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CONSULTANT_SCREENS.CLIENT_MANAGEMENT}
        component={ClientManagement}
        options={{
          tabBarLabel: STRINGS.CONSULTANT.QUICK_ACTION_ITEMS.CLIENTS,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CONSULTANT_SCREENS.STATISTICS}
        component={ConsultantStatistics}
        options={{
          tabBarLabel: STRINGS.CONSULTANT.TAB_STATISTICS,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={CONSULTANT_SCREENS.SETTINGS}
        component={ConsultantSettings}
        options={{
          tabBarLabel: STRINGS.CONSULTANT.SETTINGS_TITLE || '내 정보',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default ConsultantTabNavigator;
