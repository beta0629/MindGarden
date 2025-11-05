/**
 * 메인 네비게이션 구조
 * 인증 상태에 따라 다른 네비게이션 스택 표시
 */

import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Linking, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { navigationRef, NavigationService } from './NavigationService';
import { useSession } from '../contexts/SessionContext';
import { handleOAuthCallback } from '../utils/socialLogin';
import NotificationService from '../services/NotificationService';
import { STRINGS } from '../constants/strings';

// 스크린 임포트
import LoginScreen from '../screens/auth/LoginScreen';
import ClientTabNavigator from './ClientTabNavigator';
import ConsultantTabNavigator from './ConsultantTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';
import MessageDetail from '../screens/shared/MessageDetail';
import RecordDetail from '../screens/consultant/RecordDetail';
import ClientManagement from '../screens/consultant/ClientManagement';
import ScheduleCreate from '../screens/consultant/ScheduleCreate';
import NotificationSettings from '../screens/settings/NotificationSettings';
import NotificationHistory from '../screens/settings/NotificationHistory';
import ProfilePhotoScreen from '../screens/profile/ProfilePhotoScreen';
import { STACK_SCREENS, CLIENT_SCREENS, CONSULTANT_SCREENS, ADMIN_SCREENS, SETTINGS_SCREENS } from '../constants/navigation';
// TODO: Phase 6에서 구현
// import HQTabNavigator from './HQTabNavigator';

const Stack = createStackNavigator();

// 인증 스택 (로그인 전)
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={STACK_SCREENS.LOGIN} component={LoginScreen} />
    </Stack.Navigator>
  );
};

// 메인 스택 (로그인 후)
// React Navigation에서는 스크린이 항상 등록되어 있어야 합니다.
// 조건부 렌더링으로 스크린을 제거하면 네비게이션이 작동하지 않습니다.
// 권한 체크는 각 스크린 내부에서 수행합니다.
const MainStack = () => {
  const { user } = useSession();
  
  // 사용자 역할에 따라 초기 라우트 결정
  const getInitialRouteName = () => {
    if (!user) return STACK_SCREENS.CLIENT_TABS;
    
    switch (user.role) {
      case 'CLIENT':
      case 'ROLE_CLIENT':
        return STACK_SCREENS.CLIENT_TABS;
      case 'CONSULTANT':
      case 'ROLE_CONSULTANT':
        return STACK_SCREENS.CONSULTANT_TABS;
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'BRANCH_SUPER_ADMIN':
        return STACK_SCREENS.ADMIN_TABS;
      case 'HQ':
      case 'HQ_ADMIN':
        return STACK_SCREENS.HQ_TABS;
      default:
        return STACK_SCREENS.CLIENT_TABS;
    }
  };
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={getInitialRouteName()}
    >
      {/* 모든 탭 네비게이터는 항상 등록 */}
      <Stack.Screen name={STACK_SCREENS.CLIENT_TABS} component={ClientTabNavigator} />
      <Stack.Screen name={STACK_SCREENS.CONSULTANT_TABS} component={ConsultantTabNavigator} />
      <Stack.Screen name={STACK_SCREENS.ADMIN_TABS} component={AdminTabNavigator} />
      {/* TODO: Phase 6에서 구현
      <Stack.Screen name={STACK_SCREENS.HQ_TABS} component={HQTabNavigator} />
      */}
      
      {/* 공통 스크린들 */}
      <Stack.Screen 
        name={CLIENT_SCREENS.MESSAGE_DETAIL} 
        component={MessageDetail}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name={CONSULTANT_SCREENS.MESSAGE_DETAIL} 
        component={MessageDetail}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={CONSULTANT_SCREENS.RECORD_DETAIL}
        component={RecordDetail}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={CONSULTANT_SCREENS.CLIENT_MANAGEMENT}
        component={ClientManagement}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={CONSULTANT_SCREENS.SCHEDULE_CREATE}
        component={ScheduleCreate}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={SETTINGS_SCREENS.NOTIFICATION_SETTINGS}
        component={NotificationSettings}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={SETTINGS_SCREENS.NOTIFICATION_HISTORY}
        component={NotificationHistory}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={SETTINGS_SCREENS.PROFILE_PHOTO}
        component={ProfilePhotoScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Deep Linking 설정 (OAuth2 콜백 처리)
const linking = {
  prefixes: ['mindgarden://', 'com.mindgardenmobile://'],
  config: {
    screens: {
      OAuthCallback: 'oauth/callback',
    },
  },
  async getInitialURL() {
    // 앱이 이미 열려있는 경우
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }
    return null;
  },
  subscribe(listener) {
    // Deep Link 리스너
    const onReceiveURL = ({ url }) => {
      listener(url);
    };

    // 앱이 실행 중일 때 Deep Link 받기
    const subscription = Linking.addEventListener('url', onReceiveURL);

    // 앱이 종료된 상태에서 Deep Link로 열린 경우
    Linking.getInitialURL().then(url => {
      if (url) {
        listener(url);
      }
    });

    return () => {
      subscription.remove();
    };
  },
};

// 메인 네비게이터
const AppNavigator = () => {
  const { isLoggedIn, isLoading, user, login } = useSession();
  const navigationAttemptedRef = useRef(false);
  const navigationReadyRef = useRef(false);
  
  // 앱 시작 시 Deep Link 리스너 등록 확인
  useEffect(() => {
    const isIOS = Platform.OS === 'ios';
    const logPrefix = isIOS ? '🍎 iOS' : '🤖 Android';
    console.log(`${logPrefix} - 📱 AppNavigator 마운트 완료`);
    console.log(`${logPrefix} - 🔧 Deep Link 리스너 등록 준비 중...`);
  }, []);

  // OAuth2 콜백 처리
  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) {
        console.log('🔗 Deep Link 수신: URL 없음');
        return;
      }
      
      const isIOS = Platform.OS === 'ios';
      const logPrefix = isIOS ? '🍎 iOS' : '🤖 Android';
      console.log(`${logPrefix} - 🔗 Deep Link 수신:`, url);
      console.log(`${logPrefix} - Deep Link URL 길이:`, url.length);
      console.log(`${logPrefix} - Deep Link URL 전체:`, url);
      
      if (url.includes('oauth/callback') || url.includes('oauth2/callback')) {
        console.log('🔗 OAuth2 콜백 Deep Link 수신:', url);
        
        try {
          const result = await handleOAuthCallback(url);
          
          console.log('📊 handleOAuthCallback 결과:', {
            success: result?.success,
            hasUser: !!result?.user,
            message: result?.message
          });
          
          if (result.success && result.user) {
            // 사용자 정보가 이미 handleOAuthCallback에서 저장되었으므로
            // login() 함수를 호출하여 Context 업데이트
            const loginResult = await login();
            
            console.log('📊 login() 결과:', {
              success: loginResult?.success,
              hasUser: !!loginResult?.user,
              userRole: loginResult?.user?.role
            });
            
            // result.user를 사용 (handleOAuthCallback에서 반환한 사용자 정보)
            const loggedInUser = loginResult?.user || result.user;
            
            if (loggedInUser) {
              // 성공 알림 표시
              NotificationService.success(STRINGS.AUTH.LOGIN_SUCCESS, { title: STRINGS.COMMON.SUCCESS });
              
              // Context 업데이트가 완료될 때까지 잠시 대기
              // 그 후 네비게이션은 두 번째 useEffect가 자동으로 처리함
              // 하지만 즉시 이동을 보장하기 위해 여기서도 시도
              
              // 역할에 맞는 대시보드로 자동 이동 (중복 방지)
              if (navigationAttemptedRef.current) {
                console.log('⏭️ Deep Link 네비게이션 이미 시도됨, 스킵');
                return;
              }
              
              const getTargetRoute = () => {
                switch (loggedInUser.role) {
                  case 'CLIENT':
                  case 'ROLE_CLIENT':
                    return STACK_SCREENS.CLIENT_TABS;
                  case 'CONSULTANT':
                  case 'ROLE_CONSULTANT':
                    return STACK_SCREENS.CONSULTANT_TABS;
                  case 'ADMIN':
                  case 'SUPER_ADMIN':
                  case 'BRANCH_SUPER_ADMIN':
                    return STACK_SCREENS.ADMIN_TABS;
                  case 'HQ':
                  case 'HQ_ADMIN':
                    return STACK_SCREENS.HQ_TABS;
                  default:
                    return STACK_SCREENS.CLIENT_TABS;
                }
              };
              
              const targetRoute = getTargetRoute();
              console.log('🎯 Deep Link 대시보드 이동 시도:', {
                target: targetRoute,
                navigationReady: navigationRef.isReady(),
                userRole: loggedInUser.role
              });
              
              // navigationRef가 준비될 때까지 재시도
              const tryNavigate = (attempt = 0) => {
                // NavigationContainer가 완전히 준비되었는지 확인
                if (navigationReadyRef.current && navigationRef.isReady()) {
                  try {
                    const currentRoute = navigationRef.getCurrentRoute();
                    
                    // 이미 올바른 대시보드에 있으면 네비게이션하지 않음
                    if (currentRoute && currentRoute.name === targetRoute) {
                      console.log('✅ 이미 올바른 대시보드에 있습니다:', targetRoute);
                      navigationAttemptedRef.current = true;
                      return;
                    }
                    
                    // 네비게이션 시도 중복 방지
                    if (navigationAttemptedRef.current) {
                      console.log('⏭️ 네비게이션 이미 시도됨, 스킵');
                      return;
                    }
                    
                    navigationAttemptedRef.current = true;
                    // NavigationService를 통해 안전하게 reset 호출
                    NavigationService.reset({
                      index: 0,
                      routes: [{ name: targetRoute }],
                    });
                    console.log('✅ 대시보드로 이동 성공:', targetRoute);
                    return; // 성공하면 재시도 중단
                  } catch (navError) {
                    console.error('❌ 네비게이션 실패:', navError);
                    navigationAttemptedRef.current = false;
                    // 에러 발생 시에만 재시도 (최대 5번)
                    if (attempt < 5) {
                      setTimeout(() => tryNavigate(attempt + 1), 200);
                    } else {
                      console.warn('⚠️ 네비게이션 재시도 실패 (최대 횟수 초과)');
                    }
                  }
                } else {
                  // 네비게이션이 준비되지 않았으면 조용히 재시도 (최대 10번)
                  if (attempt < 10) {
                    setTimeout(() => tryNavigate(attempt + 1), 100);
                  } else {
                    // 이미 올바른 화면에 있으면 에러 출력하지 않음
                    const currentRoute = navigationRef.getCurrentRoute();
                    if (currentRoute && currentRoute.name !== targetRoute) {
                      console.warn('⚠️ 네비게이션 준비 대기 시간 초과');
                    }
                  }
                }
              };
              
              // 즉시 시도 (한 번만)
              tryNavigate(0);
            } else {
              // 세션 재확인 시도
              setTimeout(async () => {
                const retryResult = await login();
                if (retryResult && retryResult.success) {
                  NotificationService.success(STRINGS.AUTH.LOGIN_SUCCESS, { title: STRINGS.COMMON.SUCCESS });
                  
                  // 네비게이션도 재시도
                  const navigateToDashboard = () => {
                    if (!retryResult.user) return;
                    
                    const getTargetRoute = () => {
                      switch (retryResult.user.role) {
                        case 'CLIENT':
                        case 'ROLE_CLIENT':
                          return STACK_SCREENS.CLIENT_TABS;
                        case 'CONSULTANT':
                        case 'ROLE_CONSULTANT':
                          return STACK_SCREENS.CONSULTANT_TABS;
                        case 'ADMIN':
                        case 'SUPER_ADMIN':
                        case 'BRANCH_SUPER_ADMIN':
                          return STACK_SCREENS.ADMIN_TABS;
                        default:
                          return STACK_SCREENS.CLIENT_TABS;
                      }
                    };
                    
                    const targetRoute = getTargetRoute();
                    const tryNavigate = (attempt = 0) => {
                      if (attempt > 10) return;
                      if (navigationRef.isReady()) {
                        try {
                          navigationRef.reset({
                            index: 0,
                            routes: [{ name: targetRoute }],
                          });
                        } catch (navError) {
                          setTimeout(() => tryNavigate(attempt + 1), 100);
                        }
                      } else {
                        setTimeout(() => tryNavigate(attempt + 1), 100);
                      }
                    };
                    tryNavigate(0);
                  };
                  
                  navigateToDashboard();
                  setTimeout(navigateToDashboard, 100);
                  setTimeout(navigateToDashboard, 300);
                } else {
                  Alert.alert('오류', '로그인 세션 복원에 실패했습니다.\n다시 시도해주세요.');
                }
              }, 500);
            }
          } else if (result.requiresSignup) {
            NotificationService.warning(STRINGS.AUTH.SOCIAL.SIGNUP_REQUIRED, { title: STRINGS.AUTH.LOGIN_FAILED });
            // TODO: 회원가입 화면으로 이동
          } else {
            NotificationService.error(result.message || STRINGS.AUTH.SOCIAL_LOGIN_ERROR, { title: STRINGS.AUTH.LOGIN_FAILED });
          }
        } catch (error) {
          console.error('❌ OAuth2 콜백 처리 오류:', error);
          NotificationService.error(STRINGS.AUTH.SOCIAL_LOGIN_ERROR, { title: STRINGS.ERROR.ERROR });
        }
      }
    };

    // 초기 URL 확인
    const isIOS = Platform.OS === 'ios';
    const logPrefix = isIOS ? '🍎 iOS' : '🤖 Android';
    
    Linking.getInitialURL().then(url => {
      console.log(`${logPrefix} - 🔗 초기 URL 확인:`, url ? url.substring(0, 100) : 'URL 없음');
      if (url) {
        console.log(`${logPrefix} - ✅ 초기 URL 발견, Deep Link 처리 시작`);
        handleDeepLink(url);
      } else {
        console.log(`${logPrefix} - ⚠️ 초기 URL 없음`);
      }
    }).catch(error => {
      console.error(`${logPrefix} - ❌ 초기 URL 확인 오류:`, error);
    });

    // Deep Link 리스너 등록
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log(`${logPrefix} - 🔗 URL 이벤트 수신:`, url ? url.substring(0, 100) : 'URL 없음');
      if (url) {
        console.log(`${logPrefix} - ✅ URL 이벤트 URL 발견, Deep Link 처리 시작`);
        handleDeepLink(url);
      } else {
        console.log(`${logPrefix} - ⚠️ URL 이벤트에 URL 없음`);
      }
    });

    console.log(`${logPrefix} - ✅ Deep Link 리스너 등록 완료`);

    return () => {
      subscription.remove();
    };
  }, [login]);

  // 로그인 상태가 변경되면 올바른 화면으로 네비게이션
  useEffect(() => {
    if (!isLoading && isLoggedIn && user) {
      const getTargetRoute = () => {
        switch (user.role) {
          case 'CLIENT':
          case 'ROLE_CLIENT':
            return STACK_SCREENS.CLIENT_TABS;
          case 'CONSULTANT':
          case 'ROLE_CONSULTANT':
            return STACK_SCREENS.CONSULTANT_TABS;
          case 'ADMIN':
          case 'SUPER_ADMIN':
          case 'BRANCH_SUPER_ADMIN':
            return STACK_SCREENS.ADMIN_TABS;
          case 'HQ':
          case 'HQ_ADMIN':
            return STACK_SCREENS.HQ_TABS;
          default:
            return STACK_SCREENS.CLIENT_TABS;
        }
      };
      
      const targetRoute = getTargetRoute();
      
      // 네비게이션 시도 중복 방지
      if (navigationAttemptedRef.current) {
        console.log('⏭️ 네비게이션 이미 시도됨, 스킵');
        return;
      }
      
      // navigationRef가 준비될 때까지 재시도
      const tryNavigate = (attempt = 0) => {
        // NavigationContainer가 완전히 준비되었는지 확인
        if (navigationReadyRef.current && navigationRef.isReady()) {
          try {
            const currentRoute = navigationRef.getCurrentRoute();
            
            // 이미 올바른 대시보드에 있으면 네비게이션하지 않음
            if (currentRoute && currentRoute.name === targetRoute) {
              console.log('✅ 이미 올바른 대시보드에 있습니다:', targetRoute);
              navigationAttemptedRef.current = true;
              return;
            }
            
            // 네비게이션 시도 중복 방지 (한 번 더 체크)
            if (navigationAttemptedRef.current) {
              console.log('⏭️ 네비게이션 이미 시도됨, 스킵');
              return;
            }
            
            // 현재 라우트가 타겟과 다르거나 AuthStack에 있으면 리셋
            if (!currentRoute || currentRoute.name === STACK_SCREENS.LOGIN || currentRoute.name !== targetRoute) {
              navigationAttemptedRef.current = true;
              // NavigationService를 통해 안전하게 reset 호출
              NavigationService.reset({
                index: 0,
                routes: [{ name: targetRoute }],
              });
              console.log('✅ 로그인 후 대시보드로 이동:', targetRoute);
              return; // 성공하면 재시도 중단
            }
          } catch (error) {
            console.warn('네비게이션 리셋 실패:', error);
            navigationAttemptedRef.current = false;
            // 에러 발생 시에만 재시도 (최대 5번)
            if (attempt < 5) {
              setTimeout(() => tryNavigate(attempt + 1), 200);
            } else {
              console.warn('⚠️ 네비게이션 재시도 실패 (최대 횟수 초과)');
            }
          }
        } else {
          // 네비게이션이 준비되지 않았으면 조용히 재시도 (최대 10번)
          if (attempt < 10) {
            setTimeout(() => tryNavigate(attempt + 1), 100);
          } else {
            // 이미 올바른 화면에 있으면 에러 출력하지 않음
            const currentRoute = navigationRef.getCurrentRoute();
            if (currentRoute && currentRoute.name !== targetRoute) {
              console.warn('⚠️ 네비게이션 준비 대기 시간 초과');
            }
          }
        }
      };
      
      // 즉시 시도 (한 번만)
      tryNavigate(0);
    } else {
      // 로그아웃 상태면 플래그 초기화
      navigationAttemptedRef.current = false;
    }
  }, [isLoggedIn, user, isLoading]);

  // 로딩 중일 때는 아무것도 렌더링하지 않음 (또는 로딩 스크린 표시)
  if (isLoading) {
    return null; // TODO: 로딩 스크린 추가
  }

  return (
    <NavigationContainer 
      ref={navigationRef} 
      // linking={linking} // 수동 Linking 리스너 사용으로 인해 주석 처리
      onReady={() => {
        navigationReadyRef.current = true;
        console.log('✅ NavigationContainer 준비 완료');
      }}
    >
      {isLoggedIn ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
