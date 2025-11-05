import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost } from '../api/client';
import { AUTH_API } from '../api/endpoints';
import { STRINGS } from '../constants/strings';
import { login as kakaoSDKLogin, getProfile as getKakaoProfile, logout as kakaoSDKLogout, unlink as kakaoSDKUnlink } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { getNaverLoginConfig } from '../config/environments';

/**
 * 네이버 SDK 초기화 (앱 시작 시 한 번만 호출)
 * iOS와 Android 모두 지원
 */
let naverSDKInitialized = false;
export const initializeNaverSDK = async () => {
  if (naverSDKInitialized) {
    return;
  }
  
  try {
    const naverConfig = getNaverLoginConfig();
    
    // 네이버 SDK 초기화 (iOS와 Android 모두 지원)
    const initConfig = {
      appName: naverConfig.APP_NAME,
      consumerKey: naverConfig.CLIENT_ID,
      consumerSecret: naverConfig.CLIENT_SECRET,
    };
    
    // iOS만 serviceUrlSchemeIOS 필요
    if (Platform.OS === 'ios') {
      initConfig.serviceUrlSchemeIOS = 'naverMindGardenMobileApp'; // Info.plist의 URL Scheme과 일치해야 함
    }
    
    NaverLogin.initialize(initConfig);
    
    naverSDKInitialized = true;
    const platform = Platform.OS === 'ios' ? '🍎 iOS' : '🤖 Android';
    console.log(`✅ 네이버 SDK 초기화 완료 (${platform})`);
  } catch (error) {
    console.error('❌ 네이버 SDK 초기화 오류:', error);
    throw error;
  }
};

/**
 * 랜덤 state 생성 (웹과 동일)
 */
const generateRandomState = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 카카오 로그인 (네이티브 SDK 사용 - iOS/Android 모두 지원)
 */
export const kakaoLogin = async () => {
  try {
    const platform = Platform.OS === 'ios' ? '🍎 iOS' : '🤖 Android';
    console.log(`${platform} - 🔵 카카오 로그인 시작 (네이티브 SDK)`);
    
    // 카카오 SDK로 로그인
    const token = await kakaoSDKLogin();
    console.log(`${platform} - ✅ 카카오 SDK 로그인 성공:`, token);
    
    // 카카오 프로필 정보 가져오기
    const profile = await getKakaoProfile();
    console.log(`${platform} - ✅ 카카오 프로필 정보:`, profile);
    
    // 백엔드로 로그인 정보 전송
    const response = await apiPost(AUTH_API.SOCIAL_LOGIN, {
      provider: 'KAKAO',
      accessToken: token.accessToken,
      userId: profile.id,
      email: profile.email,
      nickname: profile.nickname,
      profileImage: profile.profileImageUrl,
    });
    
    if (response?.success && response?.user) {
      // 사용자 정보 저장
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      // 세션 ID 저장 (응답 인터셉터에서 이미 저장했을 수 있지만, 명시적으로 다시 저장)
      const sessionId = response.sessionId;
      if (sessionId) {
        await AsyncStorage.setItem('sessionId', sessionId);
        
        // iOS 디버깅: 세션 저장 확인
        if (Platform.OS === 'ios') {
          const savedSessionId = await AsyncStorage.getItem('sessionId');
          console.log(`${platform} - ✅ 카카오 세션 ID 저장 완료:`, savedSessionId ? `${savedSessionId.substring(0, 10)}... (길이: ${savedSessionId.length})` : '저장 실패');
          console.log(`${platform} - 📊 응답에서 받은 sessionId:`, sessionId ? `${sessionId.substring(0, 10)}... (길이: ${sessionId.length})` : '없음');
          console.log(`${platform} - 📊 AsyncStorage에 저장된 sessionId:`, savedSessionId ? `${savedSessionId.substring(0, 10)}... (길이: ${savedSessionId.length})` : '없음');
        }
      } else {
        // iOS 디버깅: 세션 ID가 없음
        if (Platform.OS === 'ios') {
          console.warn(`${platform} - ⚠️ 카카오 응답에 sessionId가 없습니다! response:`, JSON.stringify(response, null, 2));
        }
      }
      
      return {
        success: true,
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
    } else if (response?.requiresSignup) {
      return {
        success: false,
        requiresSignup: true,
        socialUserInfo: {
          email: profile.email || profile.email,
          nickname: profile.nickname || '',
          provider: 'KAKAO',
          socialId: profile.id.toString(),
        },
      };
    } else {
      throw new Error(response?.message || '카카오 로그인에 실패했습니다.');
    }
  } catch (error) {
    console.error('❌ 카카오 로그인 오류:', error);
    
    let errorMessage = STRINGS.AUTH.SOCIAL_LOGIN_ERROR;
    if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * 네이버 로그인 (네이티브 SDK 사용 - iOS/Android 모두 지원)
 */
export const naverLogin = async () => {
  try {
    const platform = Platform.OS === 'ios' ? '🍎 iOS' : '🤖 Android';
    console.log(`${platform} - 🟢 네이버 로그인 시작 (네이티브 SDK)`);
    
    // 네이버 SDK 초기화 (아직 초기화되지 않았으면)
    await initializeNaverSDK();
    
    // 네이버 SDK로 로그인
    const loginResult = await NaverLogin.login();
    console.log(`${platform} - ✅ 네이버 SDK 로그인 성공:`, loginResult);
    console.log(`${platform} - 📊 네이버 SDK 응답 구조:`, JSON.stringify(loginResult, null, 2));
    
    // 네이버 SDK 응답 구조 확인 (iOS와 Android가 다를 수 있음)
    // iOS: { isSuccess: true, successResponse: { accessToken, refreshToken, ... } }
    // Android: 직접 accessToken 객체를 반환할 수도 있음
    let accessToken = null;
    
    if (loginResult?.isSuccess && loginResult?.successResponse?.accessToken) {
      // iOS 형식: { isSuccess: true, successResponse: { accessToken: string } }
      accessToken = loginResult.successResponse.accessToken;
    } else if (loginResult?.accessToken) {
      // 직접 accessToken 필드 (Android 가능)
      accessToken = typeof loginResult.accessToken === 'string' 
        ? loginResult.accessToken 
        : loginResult.accessToken.accessToken;
    } else if (loginResult?.successResponse?.accessToken) {
      // successResponse가 있지만 isSuccess가 없는 경우
      accessToken = loginResult.successResponse.accessToken;
    } else if (loginResult?.token) {
      // token 필드 사용
      accessToken = loginResult.token;
    }
    
    if (!accessToken) {
      console.error(`${platform} - ❌ 네이버 로그인 응답 구조:`, JSON.stringify(loginResult, null, 2));
      throw new Error('네이버 로그인 응답에서 accessToken을 찾을 수 없습니다.');
    }
    
    console.log(`${platform} - ✅ 네이버 accessToken 획득:`, accessToken.substring(0, 20) + '...');
    
    // 네이버 프로필 정보 가져오기 (accessToken 사용)
    let userId = null;
    let email = null;
    let nickname = null;
    let profileImage = null;
    
    try {
      const profileResult = await NaverLogin.getProfile(accessToken);
      console.log(`${platform} - ✅ 네이버 프로필 정보:`, profileResult);
      
      if (profileResult?.response) {
        userId = profileResult.response.id || profileResult.response.userId;
        email = profileResult.response.email;
        nickname = profileResult.response.nickname || profileResult.response.name;
        profileImage = profileResult.response.profile_image || profileResult.response.profileImageUrl;
      }
    } catch (profileError) {
      console.warn('⚠️ 네이버 프로필 정보 가져오기 실패:', profileError);
      // 프로필 정보가 없어도 accessToken으로 백엔드에서 조회 가능
    }
    
    if (!userId || !email) {
      console.warn('⚠️ 네이버 응답에 사용자 정보가 없습니다. 백엔드에서 조회합니다.');
    }
    
      // 백엔드로 로그인 정보 전송
      const response = await apiPost(AUTH_API.SOCIAL_LOGIN, {
        provider: 'NAVER',
        accessToken: accessToken,
        userId: userId,
        email: email,
        nickname: nickname || '',
        profileImage: profileImage || '',
      });
      
      if (response?.success && response?.user) {
        // 사용자 정보 저장
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        
        // 세션 ID 저장 (응답 인터셉터에서 이미 저장했을 수 있지만, 명시적으로 다시 저장)
        const sessionId = response.sessionId;
        if (sessionId) {
          await AsyncStorage.setItem('sessionId', sessionId);
          
          // iOS 디버깅: 세션 저장 확인
          if (Platform.OS === 'ios') {
            const savedSessionId = await AsyncStorage.getItem('sessionId');
            console.log(`${platform} - ✅ 네이버 세션 ID 저장 완료:`, savedSessionId ? `${savedSessionId.substring(0, 10)}... (길이: ${savedSessionId.length})` : '저장 실패');
            console.log(`${platform} - 📊 응답에서 받은 sessionId:`, sessionId ? `${sessionId.substring(0, 10)}... (길이: ${sessionId.length})` : '없음');
            console.log(`${platform} - 📊 AsyncStorage에 저장된 sessionId:`, savedSessionId ? `${savedSessionId.substring(0, 10)}... (길이: ${savedSessionId.length})` : '없음');
          }
        } else {
          // iOS 디버깅: 세션 ID가 없음
          if (Platform.OS === 'ios') {
            console.warn(`${platform} - ⚠️ 네이버 응답에 sessionId가 없습니다! response:`, JSON.stringify(response, null, 2));
          }
        }
        
        return {
          success: true,
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        };
      } else if (response?.requiresSignup) {
      return {
        success: false,
        requiresSignup: true,
        socialUserInfo: {
          email: email || '',
          nickname: nickname || '',
          provider: 'NAVER',
          socialId: userId ? userId.toString() : '',
        },
      };
    } else {
      throw new Error(response?.message || '네이버 로그인에 실패했습니다.');
    }
  } catch (error) {
    console.error('❌ 네이버 로그인 오류:', error);
    
    let errorMessage = STRINGS.AUTH.SOCIAL_LOGIN_ERROR;
    if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * 소셜 로그아웃 (네이티브 SDK 사용)
 */
export const socialLogout = async (provider) => {
  try {
    if (provider === 'KAKAO') {
      await kakaoSDKLogout();
      console.log('✅ 카카오 SDK 로그아웃 성공');
    } else if (provider === 'NAVER') {
      await NaverLogin.logout();
      console.log('✅ 네이버 SDK 로그아웃 성공');
    }
    
    // 백엔드 로그아웃 API 호출 (선택 사항, 세션 기반이므로 필요 없을 수도 있음)
    await apiPost(AUTH_API.LOGOUT);
    
    // 로컬 저장소에서 토큰 및 사용자 정보 제거
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'sessionId', 'oauth_state']);
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Social Logout Failed (${provider}):`, error);
    return { success: false, message: error.message || '소셜 로그아웃에 실패했습니다.' };
  }
};

/**
 * 소셜 계정 연결 해제 (네이티브 SDK 사용)
 */
export const socialUnlink = async (provider) => {
  try {
    if (provider === 'KAKAO') {
      await kakaoSDKUnlink();
      console.log('✅ 카카오 SDK 연결 해제 성공');
    } else if (provider === 'NAVER') {
      await NaverLogin.deleteToken(); // 네이버는 deleteToken으로 연결 해제
      console.log('✅ 네이버 SDK 연결 해제 성공');
    }
    
    // 백엔드 API를 통해 소셜 계정 연결 해제
    const response = await apiPost('/api/auth/social/unlink', { provider });
    
    if (response.success) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'sessionId', 'oauth_state']);
      return { success: true };
    } else {
      throw new Error(response.message || '소셜 계정 연결 해제에 실패했습니다.');
    }
  } catch (error) {
    console.error(`❌ Social Unlink Failed (${provider}):`, error);
    return { success: false, message: error.message || '소셜 계정 연결 해제에 실패했습니다.' };
  }
};

/**
 * OAuth2 콜백 처리 (웹과 동일)
 * Deep Link URL 형식 지원: mindgarden://oauth/callback?code=xxx&state=xxx
 */
export const handleOAuthCallback = async (url) => {
  try {
    const isIOS = Platform.OS === 'ios';
    const logPrefix = isIOS ? '🍎 iOS' : '🤖 Android';
    
    console.log(`${logPrefix} - OAuth2 콜백 처리 시작:`, url);
    
    // URL 파라미터 파싱 (Deep Link 및 일반 URL 모두 지원)
    let params;
    
    if (url.startsWith('mindgarden://') || url.startsWith('com.mindgardenmobile://')) {
      // Deep Link 형식: mindgarden://oauth/callback?code=xxx&state=xxx
      // URL에서 path와 query 분리
      const urlParts = url.split('?');
      const queryString = urlParts.length > 1 ? urlParts[1] : '';
      params = new URLSearchParams(queryString);
      console.log(`${logPrefix} - Deep Link 형식 감지:`, url);
      console.log(`${logPrefix} - Query String:`, queryString);
      
      // iOS 전용: URL 디코딩 확인
      if (isIOS) {
        console.log(`${logPrefix} - URL 전체 길이:`, url.length);
        console.log(`${logPrefix} - Query String 길이:`, queryString.length);
      }
    } else if (url.includes('oauth/callback') || url.includes('oauth2/callback')) {
      // 일반 URL 형식
      try {
        const urlObj = new URL(url);
        params = new URLSearchParams(urlObj.search);
      } catch (e) {
        // URL 파싱 실패 시 직접 파싱
        const queryString = url.includes('?') ? url.split('?')[1] : url;
        params = new URLSearchParams(queryString);
      }
    }
    
    const success = params.get('success');
    const provider = params.get('provider');
    const code = params.get('code');
    const authToken = params.get('authToken'); // Deep Link에서 전달된 임시 인증 토큰
    const state = params.get('state');
    const error = params.get('error');
    const userId = params.get('userId'); // Deep Link에서 받은 userId
    let sessionId = params.get('sessionId'); // Deep Link에서 받은 sessionId
    
    // iOS 전용: sessionId 파싱 실패 시 강제 추출
    if (isIOS && !sessionId) {
      console.warn(`${logPrefix} - ⚠️ URLSearchParams에서 sessionId 파싱 실패! 강제 추출 시도`);
      // URL에서 직접 추출 시도 (여러 패턴 시도)
      const patterns = [
        /[&?]sessionId=([^&]+)/,  // 일반 패턴
        /sessionId%3D([^&%]+)/,   // URL 인코딩된 패턴
        /sessionId=([A-F0-9]{32})/, // 32자리 hex 패턴
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          try {
            sessionId = decodeURIComponent(match[1]);
            console.log(`${logPrefix} - 🔧 정규식으로 sessionId 추출 성공:`, sessionId);
            console.log(`${logPrefix} - sessionId 길이:`, sessionId.length);
            // params에 강제로 추가
            params.set('sessionId', sessionId);
            break;
          } catch (e) {
            console.warn(`${logPrefix} - 🔧 URL 디코딩 실패, 원본 사용:`, match[1]);
            sessionId = match[1];
            params.set('sessionId', sessionId);
            break;
          }
        }
      }
      
      if (!sessionId) {
        console.error(`${logPrefix} - ❌ sessionId를 찾을 수 없습니다! URL 전체:`, url);
      }
    }
    
    console.log(`${logPrefix} - OAuth2 콜백 파라미터:`, { 
      success, 
      provider, 
      userId, 
      sessionId: sessionId ? `${sessionId.substring(0, 10)}... (길이: ${sessionId.length})` : '없음' 
    });
    
    // iOS 전용: sessionId 상세 확인
    if (isIOS && sessionId) {
      console.log(`${logPrefix} - ✅ sessionId 파싱 성공:`, sessionId);
      console.log(`${logPrefix} - sessionId 전체:`, sessionId);
    }
    
    if (error) {
      console.error('❌ OAuth2 오류:', error);
      return { success: false, message: `OAuth2 인증 오류: ${error}` };
    }
    
    // 저장된 state 확인
    const savedState = await AsyncStorage.getItem('oauth_state');
    if (state && state !== savedState) {
      console.error('❌ State 검증 실패:', { received: state, saved: savedState });
      return { success: false, message: 'OAuth2 state 검증 실패' };
    }
    
    if (state) {
      await AsyncStorage.removeItem('oauth_state');
    }
    
    // Deep Link에서 이미 success=true를 받은 경우 (백엔드에서 이미 처리 완료)
    if (success === 'true') {
      console.log(`${logPrefix} - Deep Link에서 success=true 받음, 세션 복원 시도`);
      
      // Deep Link에서 받은 sessionId 저장 (최우선) - 여러 방법으로 시도
      let finalSessionId = params.get('sessionId') || sessionId;
      
      // iOS 전용: params.get이 실패했을 경우 강제 추출
      if (isIOS && !finalSessionId) {
        console.warn(`${logPrefix} - ⚠️ sessionId가 없어서 URL에서 재추출 시도`);
        const sessionIdMatch = url.match(/[&?]sessionId=([^&]+)/);
        if (sessionIdMatch && sessionIdMatch[1]) {
          finalSessionId = decodeURIComponent(sessionIdMatch[1]);
          console.log(`${logPrefix} - 🔧 URL에서 sessionId 재추출:`, finalSessionId);
        }
      }
      
      if (finalSessionId) {
        // 세션 ID 정규화 (공백 제거 등)
        finalSessionId = finalSessionId.trim();
        await AsyncStorage.setItem('sessionId', finalSessionId);
        console.log(`${logPrefix} - ✅ Deep Link에서 받은 세션 ID 저장:`, finalSessionId);
        console.log(`${logPrefix} - 세션 ID 길이:`, finalSessionId.length);
        
        // iOS 전용: 저장 확인 (즉시 확인)
        if (isIOS) {
          const savedSessionId = await AsyncStorage.getItem('sessionId');
          if (savedSessionId === finalSessionId) {
            console.log(`${logPrefix} - ✅ 세션 ID 저장 확인 완료`);
            console.log(`${logPrefix} - 저장된 세션 ID 전체:`, savedSessionId);
          } else {
            console.error(`${logPrefix} - ❌ 세션 ID 저장 실패!`);
            console.error(`${logPrefix} - 저장하려던 값:`, finalSessionId);
            console.error(`${logPrefix} - 실제 저장된 값:`, savedSessionId);
            // 재시도
            await AsyncStorage.setItem('sessionId', finalSessionId);
            const retrySaved = await AsyncStorage.getItem('sessionId');
            if (retrySaved === finalSessionId) {
              console.log(`${logPrefix} - ✅ 재시도 후 세션 ID 저장 성공`);
            } else {
              console.error(`${logPrefix} - ❌ 재시도 후에도 실패`);
            }
          }
        }
      } else {
        console.error(`${logPrefix} - ❌ sessionId를 찾을 수 없습니다!`);
        console.error(`${logPrefix} - URL 전체:`, url);
        console.error(`${logPrefix} - params 객체:`, Object.fromEntries(params));
      }
      
      // 백엔드로 세션 복원 요청 (Deep Link에서 받은 userId, sessionId 전달)
      const requestSessionId = params.get('sessionId') || sessionId;
      
      console.log(`${logPrefix} - 📤 /api/auth/oauth2/callback 호출 시작`);
      console.log(`${logPrefix} - 📤 요청 데이터:`, { provider, userId, sessionId: requestSessionId ? `${requestSessionId.substring(0, 10)}...` : '없음' });
      
      // iOS 전용: AsyncStorage에서 저장된 세션 ID 확인
      if (isIOS) {
        const storedSessionId = await AsyncStorage.getItem('sessionId');
        console.log(`${logPrefix} - 📦 AsyncStorage의 세션 ID:`, storedSessionId ? `${storedSessionId.substring(0, 10)}...` : '없음');
      }
      
      const response = await apiPost(AUTH_API.OAUTH2_CALLBACK, {
        provider,
        userId, // Deep Link에서 받은 userId
        sessionId: requestSessionId, // Deep Link에서 받은 sessionId
        authToken, // 임시 인증 토큰 (사용 안할 수도 있음)
        code, // fallback용 (사용 안할 수도 있음)
        state,
      });
      
      console.log(`${logPrefix} - 📊 백엔드 OAuth2 콜백 응답:`, response);
      console.log(`${logPrefix} - 📊 응답 세션 ID:`, response?.sessionId ? `${response.sessionId.substring(0, 10)}...` : '없음');
      
      if (response && response.success) {
        // 세션 ID 저장 (API 응답에서 받은 것 우선, 없으면 Deep Link에서 받은 것 사용)
        const finalSessionId = response.sessionId || requestSessionId;
        if (finalSessionId) {
          await AsyncStorage.setItem('sessionId', finalSessionId);
          console.log(`${logPrefix} - ✅ 최종 세션 ID 저장:`, finalSessionId);
          
          // iOS 전용: 저장 확인
          if (isIOS) {
            const savedSessionId = await AsyncStorage.getItem('sessionId');
            if (savedSessionId === finalSessionId) {
              console.log(`${logPrefix} - ✅ 최종 세션 ID 저장 확인 완료`);
            } else {
              console.error(`${logPrefix} - ❌ 최종 세션 ID 저장 실패! 저장된 값:`, savedSessionId);
            }
          }
        } else {
          console.error(`${logPrefix} - ❌ 최종 세션 ID가 없습니다!`);
        }
        
        // 사용자 정보 저장 (로그인 후 Context 업데이트를 위해 필수)
        let finalUser = response.user;
        
        if (finalUser) {
          await AsyncStorage.setItem('user', JSON.stringify(finalUser));
          console.log('✅ 소셜 로그인 사용자 정보 저장 완료:', finalUser);
        } else {
          // 백엔드에서 user 정보를 반환하지 않았지만 userId가 있으면
          // 현재 사용자 정보를 가져오기 위해 GET_CURRENT_USER 호출
          console.log('⚠️ 백엔드 응답에 사용자 정보가 없음, 현재 사용자 정보 조회 시도');
          try {
            const { apiGet } = await import('../api/client');
            const { AUTH_API } = await import('../api/endpoints');
            const userResponse = await apiGet(AUTH_API.GET_CURRENT_USER);
            if (userResponse && userResponse.user) {
              finalUser = userResponse.user;
              await AsyncStorage.setItem('user', JSON.stringify(finalUser));
              console.log('✅ 현재 사용자 정보 조회 및 저장 완료:', finalUser);
            } else {
              console.warn('⚠️ GET_CURRENT_USER 응답에 사용자 정보가 없습니다.');
            }
          } catch (userError) {
            console.error('❌ 현재 사용자 정보 조회 실패:', userError);
            // 세션은 설정되었지만 사용자 정보를 가져오지 못한 경우
            // Deep Link에서 받은 정보로 사용자 객체 생성
            const name = params.get('name');
            const email = params.get('email');
            const role = params.get('role');
            const nickname = params.get('nickname');
            const profileImage = params.get('profileImage');
            
            if (userId && name && email && role) {
              finalUser = {
                id: parseInt(userId),
                email: email,
                name: name,
                nickname: nickname || '',
                role: role,
                profileImageUrl: profileImage || ''
              };
              await AsyncStorage.setItem('user', JSON.stringify(finalUser));
              console.log('✅ Deep Link 정보로 사용자 객체 생성 및 저장:', finalUser);
            }
          }
        }
        
        if (!finalUser) {
          console.error('❌ 사용자 정보를 가져올 수 없습니다.');
          return { success: false, message: '사용자 정보를 가져올 수 없습니다.' };
        }
        
        return { 
          success: true, 
          user: finalUser
        };
      } else if (response && response.requiresSignup) {
        return { 
          success: false, 
          requiresSignup: true, 
          socialUserInfo: response.socialUserInfo 
        };
      } else {
        return { success: false, message: response.message || 'OAuth2 인증 실패' };
      }
    } else if (success === 'false' && params.get('requiresSignup') === 'true') {
      // 회원가입 필요
      return {
        success: false,
        requiresSignup: true,
        socialUserInfo: {
          email: params.get('email') || '',
          name: params.get('name') || '',
          nickname: params.get('nickname') || '',
          provider: provider
        }
      };
    } else {
      return { success: false, message: error || 'OAuth2 인증 실패' };
    }
  } catch (error) {
    console.error('❌ OAuth2 콜백 처리 오류:', error);
    return { success: false, message: error.message || 'OAuth2 콜백 처리 중 오류가 발생했습니다.' };
  }
};
