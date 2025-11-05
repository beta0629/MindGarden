/**
 * 관리자 탭 네비게이터
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, BarChart3, Calendar, Settings, FileText, DollarSign } from 'lucide-react-native';
import AdminDashboard from '../screens/admin/AdminDashboard';
import UserManagement from '../screens/admin/UserManagement';
import ConsultantManagement from '../screens/admin/ConsultantManagement';
import ClientManagement from '../screens/admin/ClientManagement';
import MappingManagement from '../screens/admin/MappingManagement';
import SessionManagement from '../screens/admin/SessionManagement';
import StatisticsDashboard from '../screens/admin/StatisticsDashboard';
import ErpDashboard from '../screens/admin/ErpDashboard';
import FinancialManagement from '../screens/admin/FinancialManagement';
import SalaryManagement from '../screens/admin/SalaryManagement';
// import ClientComprehensiveManagement from '../screens/admin/ClientComprehensiveManagement';
// import MappingManagement from '../screens/admin/MappingManagement';
// import SessionManagement from '../screens/admin/SessionManagement';
// import StatisticsDashboard from '../screens/admin/StatisticsDashboard';
// import ErpDashboard from '../screens/admin/ErpDashboard';
// import FinancialManagement from '../screens/admin/FinancialManagement';
// import SalaryManagement from '../screens/admin/SalaryManagement';
import { COLORS, SPACING } from '../constants/theme';
import SIZES from '../constants/sizes';
import { STRINGS } from '../constants/strings';
import { ADMIN_SCREENS } from '../constants/navigation';

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
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
        name={ADMIN_SCREENS.DASHBOARD}
        component={AdminDashboard}
        options={{
          tabBarLabel: STRINGS.ADMIN.DASHBOARD_TITLE,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={ADMIN_SCREENS.USER_MANAGEMENT}
        component={UserManagement}
        options={{
          tabBarLabel: STRINGS.ADMIN.USER_MANAGEMENT,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={ADMIN_SCREENS.CONSULTANT_MANAGEMENT}
        component={ConsultantManagement}
        options={{
          tabBarLabel: STRINGS.ADMIN.CONSULTANT_MANAGEMENT,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={ADMIN_SCREENS.CLIENT_MANAGEMENT}
        component={ClientManagement}
        options={{
          tabBarLabel: STRINGS.ADMIN.CLIENT_MANAGEMENT,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={ADMIN_SCREENS.MAPPING_MANAGEMENT}
        component={MappingManagement}
        options={{
          tabBarLabel: STRINGS.ADMIN.MAPPING_MANAGEMENT,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={ADMIN_SCREENS.SESSION_MANAGEMENT}
        component={SessionManagement}
        options={{
          tabBarLabel: STRINGS.ADMIN.SESSION_MANAGEMENT,
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={ADMIN_SCREENS.STATISTICS}
        component={StatisticsDashboard}
        options={{
          tabBarLabel: STRINGS.ADMIN.STATISTICS_DASHBOARD,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={ADMIN_SCREENS.ERP}
        component={ErpDashboard}
        options={{
          tabBarLabel: STRINGS.ADMIN.ERP_DASHBOARD,
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={ADMIN_SCREENS.FINANCIAL}
        component={FinancialManagement}
        options={{
          tabBarLabel: STRINGS.ADMIN.FINANCIAL_MANAGEMENT,
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabNavigator;

