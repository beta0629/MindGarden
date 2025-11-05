/**
 * SimpleLayout 컴포넌트
 * 기본 레이아웃 컴포넌트
 * 
 * 웹의 frontend/src/components/layout/SimpleLayout.js를 참고
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell, Menu, User as UserIcon } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import SIZES, { TOUCH_TARGET } from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
import UnifiedLoading from '../UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { CLIENT_SCREENS, CONSULTANT_SCREENS, ADMIN_SCREENS } from '../../constants/navigation';
import HamburgerMenu from './HamburgerMenu';
import ConfirmModal from '../ConfirmModal';

const SimpleLayout = ({
  children,
  title,
  loading = false,
  loadingText = STRINGS.COMMON.LOADING_DATA,
  loadingVariant = 'default',
  showBackButton = true, // 기본적으로 뒤로가기 버튼 표시
  showLogo = true, // 로고 표시 여부
}) => {
  const navigation = useNavigation();
  const { user } = useSession();
  const { unreadCount } = useNotification();
  const canGoBack = navigation.canGoBack();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [roleDisplayName, setRoleDisplayName] = useState('');

  // 역할 표시명 로드 (간단한 버전)
  useEffect(() => {
    if (user?.role) {
      // 간단한 역할 표시명 매핑 (웹처럼 동적 로드하려면 API 호출 필요)
      const roleMap = {
        'CLIENT': '내담자',
        'ROLE_CLIENT': '내담자',
        'CONSULTANT': '상담사',
        'ROLE_CONSULTANT': '상담사',
        'ADMIN': '관리자',
        'SUPER_ADMIN': '슈퍼 관리자',
        'BRANCH_SUPER_ADMIN': '지점 관리자',
      };
      setRoleDisplayName(roleMap[user.role] || user.role);
    }
  }, [user?.role]);

  // 프로필 이미지 URL 가져오기
  const getProfileImageUrl = () => {
    if (user?.profileImageUrl && !imageLoadError) {
      return user.profileImageUrl;
    }
    if (user?.socialProfileImage && !imageLoadError) {
      return user.socialProfileImage;
    }
    return null;
  };

  // 알림 아이콘 클릭 핸들러
  const handleNotificationClick = () => {
    if (!user?.role) return;
    
    let route;
    switch (user.role) {
      case 'CLIENT':
      case 'ROLE_CLIENT':
        route = CLIENT_SCREENS.MESSAGES;
        break;
      case 'CONSULTANT':
      case 'ROLE_CONSULTANT':
        route = CONSULTANT_SCREENS.MESSAGES;
        break;
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'BRANCH_SUPER_ADMIN':
        route = ADMIN_SCREENS.MESSAGES;
        break;
      default:
        route = CLIENT_SCREENS.MESSAGES;
    }
    
    if (route) {
      navigation.navigate(route);
    }
  };

  // 햄버거 메뉴 토글
  const toggleHamburger = () => {
    setIsHamburgerOpen(!isHamburgerOpen);
  };

  // 프로필 클릭 핸들러
  const handleProfileClick = () => {
    if (!user?.role) return;
    
    let route;
    switch (user.role) {
      case 'CLIENT':
      case 'ROLE_CLIENT':
        route = CLIENT_SCREENS.SETTINGS;
        break;
      case 'CONSULTANT':
      case 'ROLE_CONSULTANT':
        route = CONSULTANT_SCREENS.SETTINGS;
        break;
      default:
        route = CLIENT_SCREENS.SETTINGS;
    }
    
    if (route) {
      navigation.navigate(route);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      {(title || (showBackButton && canGoBack) || user || showLogo) && (
        <View style={styles.header}>
          {/* 왼쪽 영역 - 뒤로가기 버튼 + 로고 */}
          <View style={styles.headerLeft}>
            {showBackButton && canGoBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                hitSlop={TOUCH_TARGET.closeButton}
              >
                <ArrowLeft size={SIZES.ICON.MD} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            
            {/* 로고 */}
            {showLogo && (
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>MindGarden</Text>
              </View>
            )}
            
            {/* 제목 (로고가 없을 때만 표시) */}
            {title && !showLogo && (
              <Text style={[styles.title, canGoBack && showBackButton && styles.titleWithBack]}>
                {title}
              </Text>
            )}
          </View>
          
          {/* 오른쪽 영역 */}
          {user ? (
            <View style={styles.headerRight}>
              {/* 사용자 정보 */}
              <TouchableOpacity
                style={styles.userInfo}
                onPress={handleProfileClick}
              >
                <View style={styles.userAvatar}>
                  {getProfileImageUrl() ? (
                    <Image
                      source={{ uri: getProfileImageUrl() }}
                      style={styles.profileImage}
                      onError={() => setImageLoadError(true)}
                    />
                  ) : (
                    <UserIcon size={SIZES.ICON.MD} color={COLORS.primary} />
                  )}
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || user?.nickname || user?.username || '사용자'}
                  </Text>
                  <Text style={styles.userRole} numberOfLines={1}>
                    {roleDisplayName || user?.role || ''}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 알림 아이콘 */}
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={handleNotificationClick}
                hitSlop={TOUCH_TARGET.closeButton}
              >
                <Bell size={SIZES.ICON.MD} color={COLORS.primary} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* 햄버거 메뉴 버튼 */}
              <TouchableOpacity
                style={styles.hamburgerButton}
                onPress={toggleHamburger}
                hitSlop={TOUCH_TARGET.closeButton}
              >
                <Menu size={SIZES.ICON.MD} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerRight}>
              {/* 알림 아이콘 (로그인 전에는 표시 안 함) */}
            </View>
          )}
        </View>
      )}

      {/* 햄버거 메뉴 */}
      <HamburgerMenu
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
      />
      
      {/* 컨텐츠 */}
      {loading ? (
        <UnifiedLoading text={loadingText} size="large" variant={loadingVariant} type="fullscreen" />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    minHeight: SIZES.NAVIGATION_BAR_HEIGHT,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.screen.horizontal,
    borderBottomWidth: SIZES.BORDER_WIDTH.THIN,
    borderBottomColor: COLORS.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    flex: 1,
  },
  titleWithBack: {
    // 뒤로가기 버튼이 있을 때 추가 스타일 (필요시)
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  userDetails: {
    maxWidth: 100,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
  userRole: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
  },
  notificationButton: {
    padding: SPACING.xs,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: 14,
  },
  hamburgerButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.screen.horizontal, // 화면 좌우 여백
    paddingVertical: SPACING.screen.vertical, // 화면 상하 여백
  },
});

export default SimpleLayout;

