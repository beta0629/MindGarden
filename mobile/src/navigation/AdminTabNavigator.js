/**
 * 관리자 Stack 네비게이터
 * 하단 탭 네비게이션을 제거하고 Stack Navigator로 변경
 * 모든 메뉴는 햄버거 메뉴를 통해 접근
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
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
import AdminMessages from '../screens/admin/AdminMessages';
import { ADMIN_SCREENS } from '../constants/navigation';

const Stack = createStackNavigator();

const AdminTabNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={ADMIN_SCREENS.DASHBOARD}
    >
      <Stack.Screen
        name={ADMIN_SCREENS.DASHBOARD}
        component={AdminDashboard}
      />
      <Stack.Screen
        name={ADMIN_SCREENS.USER_MANAGEMENT}
        component={UserManagement}
      />
      <Stack.Screen
        name={ADMIN_SCREENS.CONSULTANT_MANAGEMENT}
        component={ConsultantManagement}
      />
      <Stack.Screen
        name={ADMIN_SCREENS.CLIENT_MANAGEMENT}
        component={ClientManagement}
      />
      <Stack.Screen
        name={ADMIN_SCREENS.MAPPING_MANAGEMENT}
        component={MappingManagement}
      />
      <Stack.Screen
        name={ADMIN_SCREENS.SESSION_MANAGEMENT}
        component={SessionManagement}
      />
      <Stack.Screen
        name={ADMIN_SCREENS.STATISTICS}
        component={StatisticsDashboard}
      />
      <Stack.Screen
        name={ADMIN_SCREENS.ERP}
        component={ErpDashboard}
      />
      <Stack.Screen
        name={ADMIN_SCREENS.FINANCIAL}
        component={FinancialManagement}
      />
      <Stack.Screen
        name={ADMIN_SCREENS.MESSAGES}
        component={AdminMessages}
      />
    </Stack.Navigator>
  );
};

export default AdminTabNavigator;

