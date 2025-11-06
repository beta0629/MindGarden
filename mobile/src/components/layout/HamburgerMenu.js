/**
 * 햄버거 메뉴 컴포넌트
 * 웹의 frontend/src/components/layout/SimpleHamburgerMenu.js를 참고
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { X, LogOut, Home, Calendar, MessageCircle, User, Users, BarChart3, Settings, CreditCard, FileText } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
import { useSession } from '../../contexts/SessionContext';
import { useNavigation } from '@react-navigation/native';
import { CLIENT_SCREENS, CONSULTANT_SCREENS, ADMIN_SCREENS } from '../../constants/navigation';

const HamburgerMenu = ({ isOpen, onClose }) => {
  const navigation = useNavigation();
  const { user, logout } = useSession();

  if (!isOpen || !user) return null;

  // 역할별 메뉴 항목 정의
  const getMenuItems = () => {
    if (!user?.role) {
      if (__DEV__) {
        console.warn('🍔 햄버거 메뉴: user 또는 role이 없습니다', { user });
      }
      return [];
    }

    const role = user.role.toUpperCase(); // 대소문자 구분 없이 처리
    
    if (__DEV__) {
      console.log('🍔 햄버거 메뉴: role 확인', { originalRole: user.role, normalizedRole: role });
    }
    
    // 역할 매칭 (대소문자 구분 없이)
    if (role === 'CLIENT' || role === 'ROLE_CLIENT') {
      return [
        { id: 'dashboard', label: STRINGS.CLIENT.DASHBOARD_TITLE || '대시보드', icon: Home, screen: CLIENT_SCREENS.DASHBOARD, tabNavigator: 'ClientTabs' },
        { id: 'schedule', label: STRINGS.CLIENT.TAB_SCHEDULE || '일정', icon: Calendar, screen: CLIENT_SCREENS.SCHEDULE, tabNavigator: 'ClientTabs' },
        { id: 'messages', label: STRINGS.CLIENT.TAB_MESSAGES || '메시지', icon: MessageCircle, screen: CLIENT_SCREENS.MESSAGES, tabNavigator: 'ClientTabs' },
        { id: 'payment', label: STRINGS.CLIENT.TAB_PAYMENT || '결제 내역', icon: CreditCard, screen: CLIENT_SCREENS.PAYMENT, tabNavigator: 'ClientTabs' },
        { id: 'settings', label: STRINGS.CLIENT.SETTINGS_TITLE || '내 정보', icon: User, screen: CLIENT_SCREENS.SETTINGS, tabNavigator: 'ClientTabs' },
      ];
    }
    
    if (role === 'CONSULTANT' || role === 'ROLE_CONSULTANT') {
      return [
        { id: 'dashboard', label: STRINGS.CONSULTANT.DASHBOARD_TITLE || '대시보드', icon: Home, screen: CONSULTANT_SCREENS.DASHBOARD, tabNavigator: 'ConsultantTabs' },
        { id: 'schedule', label: STRINGS.CONSULTANT.TAB_SCHEDULE || '일정', icon: Calendar, screen: CONSULTANT_SCREENS.SCHEDULE, tabNavigator: 'ConsultantTabs' },
        { id: 'messages', label: STRINGS.MESSAGE.TITLE || '메시지', icon: MessageCircle, screen: CONSULTANT_SCREENS.MESSAGES, tabNavigator: 'ConsultantTabs' },
        { id: 'records', label: STRINGS.CONSULTANT.CONSULTATION_RECORDS || '상담 기록', icon: FileText, screen: CONSULTANT_SCREENS.RECORDS, tabNavigator: 'ConsultantTabs' },
        { id: 'clients', label: STRINGS.CONSULTANT.QUICK_ACTION_ITEMS?.CLIENTS || '내담자 관리', icon: Users, screen: CONSULTANT_SCREENS.CLIENT_MANAGEMENT, tabNavigator: 'ConsultantTabs' },
        { id: 'statistics', label: STRINGS.CONSULTANT.TAB_STATISTICS || '통계', icon: BarChart3, screen: CONSULTANT_SCREENS.STATISTICS, tabNavigator: 'ConsultantTabs' },
        { id: 'settings', label: STRINGS.CONSULTANT.SETTINGS_TITLE || '내 정보', icon: User, screen: CONSULTANT_SCREENS.SETTINGS, tabNavigator: 'ConsultantTabs' },
      ];
    }
    
    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'BRANCH_SUPER_ADMIN' || role.includes('ADMIN')) {
      return [
        { id: 'dashboard', label: STRINGS.ADMIN.DASHBOARD_TITLE || '대시보드', icon: Home, screen: ADMIN_SCREENS.DASHBOARD, stackNavigator: 'AdminTabs' },
        { id: 'users', label: STRINGS.ADMIN.USER_MANAGEMENT || '사용자 관리', icon: Users, screen: ADMIN_SCREENS.USER_MANAGEMENT, stackNavigator: 'AdminTabs' },
        { id: 'consultants', label: STRINGS.ADMIN.CONSULTANT_MANAGEMENT || '상담사 관리', icon: Users, screen: ADMIN_SCREENS.CONSULTANT_MANAGEMENT, stackNavigator: 'AdminTabs' },
        { id: 'clients', label: STRINGS.ADMIN.CLIENT_MANAGEMENT || '내담자 관리', icon: Users, screen: ADMIN_SCREENS.CLIENT_MANAGEMENT, stackNavigator: 'AdminTabs' },
        { id: 'mapping', label: STRINGS.ADMIN.MAPPING_MANAGEMENT || '매핑 관리', icon: BarChart3, screen: ADMIN_SCREENS.MAPPING_MANAGEMENT, stackNavigator: 'AdminTabs' },
        { id: 'sessions', label: STRINGS.ADMIN.SESSION_MANAGEMENT || '세션 관리', icon: Calendar, screen: ADMIN_SCREENS.SESSION_MANAGEMENT, stackNavigator: 'AdminTabs' },
        { id: 'statistics', label: STRINGS.ADMIN.STATISTICS_DASHBOARD || '통계', icon: BarChart3, screen: ADMIN_SCREENS.STATISTICS, stackNavigator: 'AdminTabs' },
        { id: 'erp', label: STRINGS.ADMIN.ERP_DASHBOARD || 'ERP', icon: Settings, screen: ADMIN_SCREENS.ERP, stackNavigator: 'AdminTabs' },
        { id: 'financial', label: STRINGS.ADMIN.FINANCIAL_MANAGEMENT || '재무 관리', icon: CreditCard, screen: ADMIN_SCREENS.FINANCIAL, stackNavigator: 'AdminTabs' },
      ];
    }
    
    if (__DEV__) {
      console.warn('🍔 햄버거 메뉴: 알 수 없는 role', { role, userRole: user.role });
    }
    return [];
  };

  const menuItems = getMenuItems();

  // 디버깅: 메뉴 항목 확인
  if (__DEV__) {
    console.log('🍔 햄버거 메뉴 디버깅:', {
      isOpen,
      user: user ? { id: user.id, role: user.role, name: user.name } : null,
      menuItemsCount: menuItems.length,
      menuItems: menuItems.map(item => ({ id: item.id, label: item.label })),
    });
  }

  // 메뉴 항목 클릭 핸들러
  const handleMenuClick = (item) => {
    onClose();
    // Stack Navigator로 직접 이동 (하단 탭 제거됨)
    if (item.stackNavigator || item.tabNavigator) {
      // AdminTabs는 이제 Stack Navigator이므로 직접 화면으로 이동
      const navigatorName = item.stackNavigator || item.tabNavigator;
      navigation.navigate(navigatorName, {
        screen: item.screen,
      });
    } else {
      navigation.navigate(item.screen);
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    Alert.alert(
      STRINGS.AUTH.LOGOUT_CONFIRM_TITLE || '로그아웃',
      STRINGS.AUTH.LOGOUT_CONFIRM_MESSAGE || '정말 로그아웃하시겠습니까?',
      [
        {
          text: STRINGS.COMMON.CANCEL || '취소',
          style: 'cancel',
        },
        {
          text: STRINGS.AUTH.LOGOUT || '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              onClose();
            } catch (error) {
              console.error('로그아웃 실패:', error);
              Alert.alert('오류', '로그아웃에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.name || user?.nickname || user?.username || '사용자'}
              </Text>
              <Text style={styles.userRole}>
                {user?.role || 'USER'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={SIZES.TOUCH_TARGET?.closeButton || { top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={SIZES.ICON.LG} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          {/* 메뉴 목록 */}
          <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
            {menuItems.length > 0 ? (
              menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => handleMenuClick(item)}
                  >
                    <IconComponent size={SIZES.ICON.MD} color={COLORS.primary} />
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyMenuContainer}>
                <Text style={styles.emptyMenuText}>
                  메뉴 항목이 없습니다.
                </Text>
                {__DEV__ && (
                  <Text style={styles.debugText}>
                    Role: {user?.role || '없음'}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* 푸터 - 로그아웃 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LogOut size={SIZES.ICON.MD} color={COLORS.danger || COLORS.error || '#FF4444'} />
              <Text style={styles.logoutButtonText}>
                {STRINGS.AUTH.LOGOUT || '로그아웃'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '80%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.xs / 2,
  },
  userRole: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  menuContent: {
    maxHeight: 400,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  menuItemText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  logoutButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.danger || COLORS.error || '#FF4444',
  },
  emptyMenuContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMenuText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginBottom: SPACING.sm,
  },
  debugText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray400,
    fontStyle: 'italic',
  },
});

export default HamburgerMenu;

