/**
 * 로그인 화면
 * 본사/지점 로그인 지원
 * 
 * 웹의 frontend/src/components/auth/BranchLogin.js를 참고
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
// import { Picker } from '@react-native-picker/picker'; // 지점 선택 UI 제거로 더 이상 필요 없음
import { useSession } from '../../contexts/SessionContext';
import { apiPost } from '../../api/client';
import { AUTH_API } from '../../api/endpoints';
// NavigationService는 더 이상 필요 없음 (AppNavigator에서 자동 처리)
import { STACK_SCREENS, AUTH_SCREENS } from '../../constants/navigation';
import { STRINGS } from '../../constants/strings';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, SIZES } from '../../constants/theme';
import { kakaoLogin, naverLogin } from '../../utils/socialLogin';
import NotificationService from '../../services/NotificationService';
import { SMS_CONFIG } from '../../constants/common';
import SessionManager from '../../services/SessionManager';
import DuplicateLoginModal from '../../components/auth/DuplicateLoginModal';

const LoginScreen = () => {
  const { login } = useSession();
  // const [loginType, setLoginType] = useState('HEADQUARTERS'); // 이 부분 제거
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    // branchCode: '', // 이 부분 제거
  });
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [smsMode, setSmsMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [duplicateLoginState, setDuplicateLoginState] = useState({
    visible: false,
    message: '',
    loginData: null,
  });
  const [isConfirmingDuplicateLogin, setIsConfirmingDuplicateLogin] = useState(false);

  useEffect(() => {
    // loadBranches(); // 지점 선택 UI 제거로 더 이상 필요 없음
  }, []);

  // SMS 카운트다운 타이머
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // 로그인 성공 후 처리 로직
  const handleLoginSuccess = async (user, accessToken, refreshToken, sessionId = null) => {
    console.log('🔑 토큰 확인:', {
      accessToken: accessToken ? `존재 (길이: ${accessToken.length})` : '없음',
      refreshToken: refreshToken ? `존재 (길이: ${refreshToken.length})` : '없음',
      user: user ? `존재 (ID: ${user.id})` : '없음'
    });

    // 이전 세션 ID가 남아 있으면 서버에서 오래된 세션으로 요청을 인지할 수 있으므로 선제적으로 초기화
    await SessionManager.setSession({ sessionId: null }, { persist: true, broadcast: false });
    
    const sessionPayload = {
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      user: user || null,
    };

    if (sessionId) {
      sessionPayload.sessionId = sessionId;
    }

    await SessionManager.setSession(sessionPayload, { persist: true });

    if (accessToken && refreshToken) {
      console.log('✅ 토큰 저장 완료 (SessionManager)');
    } else {
      console.warn('⚠️ Access/Refresh token 누락 - SessionManager에 사용자 정보만 저장');
    }

    if (sessionId) {
      console.log('🔐 세션 ID 저장 완료:', sessionId);
    }
    
    const loginResult = await login();

    if (loginResult.success) {
      // 로그인 성공 시 세션 상태가 변경되면 AppNavigator가 자동으로 MainStack으로 전환됩니다.
      // initialRouteName이 올바른 화면으로 설정되어 있으므로 추가 네비게이션이 필요 없습니다.
      NotificationService.success(STRINGS.AUTH.LOGIN_SUCCESS, { title: STRINGS.COMMON.SUCCESS });
    } else {
      NotificationService.error(STRINGS.AUTH.LOGIN_ERROR, { title: STRINGS.AUTH.LOGIN_FAILED });
    }
  };

  const openDuplicateLoginModal = (message, loginData) => {
    setDuplicateLoginState({
      visible: true,
      message: message || STRINGS.AUTH.DUPLICATE_LOGIN_MESSAGE,
      loginData,
    });
  };

  const closeDuplicateLoginModal = () => {
    setDuplicateLoginState({
      visible: false,
      message: '',
      loginData: null,
    });
  };

  const handleConfirmDuplicateLogin = async () => {
    if (!duplicateLoginState.loginData) {
      console.warn('⚠️ 중복 로그인 확인 요청 데이터가 없습니다.');
      return;
    }

    setIsConfirmingDuplicateLogin(true);
    try {
      const payload = {
        email: duplicateLoginState.loginData.email,
        password: duplicateLoginState.loginData.password,
        confirmTerminate: true,
      };

      console.log('🔔 기존 세션 종료 후 로그인 시도:', {
        email: payload.email,
        confirmTerminate: payload.confirmTerminate,
      });

      const response = await apiPost(AUTH_API.CONFIRM_DUPLICATE_LOGIN, payload);
      console.log('📥 중복 로그인 확인 응답:', response);

      if (response?.success && response?.user) {
        if (response.sessionId) {
          await SessionManager.setSession({ sessionId: response.sessionId });
        }
        closeDuplicateLoginModal();
        await handleLoginSuccess(
          response.user,
          response.accessToken || response.token || null,
          response.refreshToken || null,
          response.sessionId
        );
      } else {
        NotificationService.error(
          response?.message || STRINGS.AUTH.LOGIN_FAILED,
          { title: STRINGS.AUTH.DUPLICATE_LOGIN }
        );
      }
    } catch (error) {
      console.error('❌ 중복 로그인 확인 처리 오류:', error);
      const errorMessage = error?.message || STRINGS.AUTH.LOGIN_ERROR;
      NotificationService.error(errorMessage, { title: STRINGS.AUTH.DUPLICATE_LOGIN });
    } finally {
      setIsConfirmingDuplicateLogin(false);
    }
  };

  // 지점 목록 조회 (더 이상 필요 없음)
  // const loadBranches = async () => {
  //   try {
  //     const response = await apiGet(BRANCH_API.BRANCHES);
  //     const list = Array.isArray(response)
  //       ? response
  //       : Array.isArray(response?.data)
  //         ? response.data
  //         : [];
  //     if (list.length > 0) {
  //       setBranches(list);
  //     }
  //   } catch (error) {
  //     console.error('지점 목록 조회 오류:', error);
  //     NotificationService.error(STRINGS.AUTH.BRANCH_LIST_LOAD_FAILED);
  //     setBranches([]);
  //   }
  // };

  // 로그인 처리 (이메일/비밀번호)
  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      NotificationService.warning(STRINGS.AUTH.EMAIL_PASSWORD_REQUIRED, { title: STRINGS.AUTH.INPUT_ERROR });
      return;
    }

    // if (loginType === 'BRANCH' && !formData.branchCode) { // 이 부분 제거
    //   NotificationService.warning(STRINGS.AUTH.BRANCH_CODE_REQUIRED, { title: STRINGS.AUTH.INPUT_ERROR });
    //   return;
    // }

    setIsLoading(true);
    try {
      const loginData = {
        email: formData.email,
        password: formData.password,
        // branchCode: loginType === 'BRANCH' ? formData.branchCode : null, // 이 부분 제거
        // loginType: loginType, // 이 부분 제거 (백엔드에서 역할 기반으로 처리)
      };

      console.log('🏢 로그인 요청:', { ...loginData, password: '***' }); // 비밀번호는 로그에 표시하지 않음

      const response = await apiPost(AUTH_API.LOGIN, loginData); // AUTH_API.BRANCH_LOGIN 대신 AUTH_API.LOGIN 사용

      console.log('📥 로그인 응답:', response);
      console.log('📥 로그인 응답 상세:', {
        success: response?.success,
        user: response?.user,
        accessToken: response?.accessToken ? '존재' : '없음',
        refreshToken: response?.refreshToken ? '존재' : '없음',
        allKeys: Object.keys(response || {})
      });

      if (response && response.success) {
        console.log('✅ 로그인 성공:', { user: response.user?.email, role: response.user?.role });
        await handleLoginSuccess(
          response.user,
          response.accessToken,
          response.refreshToken,
          response.sessionId
        );
      } else if (response && response.requiresConfirmation) {
        console.log('🔔 중복 로그인 확인 필요:', response.message);
        openDuplicateLoginModal(response.message, loginData);
      } else {
        console.log('❌ 로그인 실패:', response?.message || '알 수 없는 오류');
        NotificationService.error(response?.message || STRINGS.AUTH.LOGIN_FAILED, { title: STRINGS.AUTH.LOGIN_FAILED });
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // 네트워크 오류인지 확인
      const errorMessage = error.status === 401 
        ? '이메일 또는 비밀번호가 올바르지 않습니다.'
        : error.status === 403
        ? '접근 권한이 없습니다.'
        : error.status === 500
        ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        : error.message || STRINGS.AUTH.LOGIN_ERROR;
      
      NotificationService.error(errorMessage, { title: STRINGS.ERROR.ERROR });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    // 이메일과 비밀번호는 모든 문자 입력 허용 (숫자 필터링 제거)
    console.log(`📝 Input change for ${name}:`, value);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // handleLoginTypeChange 함수 제거
  // const handleLoginTypeChange = (type) => {
  //   setLoginType(type);
  //   setFormData((prev) => ({
  //     ...prev,
  //     branchCode: '',
  //   }));
  // };

  const handleKakaoLogin = async () => {
    console.log('🟡 LoginScreen: Kakao login button clicked');
    setIsLoading(true);
    try {
      console.log('🟡 LoginScreen: Calling kakaoLogin()...');
      const result = await kakaoLogin();
      console.log('🟡 LoginScreen: kakaoLogin() result:', result);
      
      if (result.redirecting) {
        // OAuth2 인증 페이지로 리다이렉트됨 (콜백에서 처리)
        NotificationService.info('카카오 로그인 페이지로 이동합니다.', { title: STRINGS.AUTH.LOGIN });
        setIsLoading(false);
        return;
      } else if (result.success && result.user) {
        await handleLoginSuccess(
          result.user,
          result.accessToken,
          result.refreshToken,
          result.sessionId || null
        );
      } else if (result.requiresSignup) {
        NotificationService.warning(STRINGS.AUTH.SOCIAL.SIGNUP_REQUIRED, { title: STRINGS.AUTH.LOGIN_FAILED });
        // TODO: 회원가입 화면으로 이동 또는 모달 표시
      } else {
        // 네트워크 오류인 경우 더 명확한 메시지 표시
        const errorMessage = result.status === 0 
          ? '네트워크 연결을 확인해주세요.\n백엔드 서버가 실행 중인지 확인하세요.'
          : result.message || STRINGS.AUTH.SOCIAL_LOGIN_ERROR;
        NotificationService.error(errorMessage, { title: STRINGS.AUTH.LOGIN_FAILED });
      }
    } catch (error) {
      console.error('❌ 카카오 로그인 오류:', error);
      const errorMessage = error.status === 0 
        ? '네트워크 연결을 확인해주세요.\n백엔드 서버가 실행 중인지 확인하세요.'
        : error.message || STRINGS.AUTH.SOCIAL_LOGIN_ERROR;
      NotificationService.error(errorMessage, { title: STRINGS.ERROR.ERROR });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    setIsLoading(true);
    try {
      const result = await naverLogin();
      
      if (result.redirecting) {
        // OAuth2 인증 페이지로 리다이렉트됨 (콜백에서 처리)
        NotificationService.info('네이버 로그인 페이지로 이동합니다.', { title: STRINGS.AUTH.LOGIN });
        setIsLoading(false);
        return;
      } else if (result.success && result.user) {
        await handleLoginSuccess(
          result.user,
          result.accessToken,
          result.refreshToken,
          result.sessionId || null
        );
      } else if (result.requiresSignup) {
        NotificationService.warning(STRINGS.AUTH.SOCIAL.SIGNUP_REQUIRED, { title: STRINGS.AUTH.LOGIN_FAILED });
        // TODO: 회원가입 화면으로 이동 또는 모달 표시
      } else {
        // 네트워크 오류인 경우 더 명확한 메시지 표시
        const errorMessage = result.status === 0 
          ? '네트워크 연결을 확인해주세요.\n백엔드 서버가 실행 중인지 확인하세요.'
          : result.message || STRINGS.AUTH.SOCIAL_LOGIN_ERROR;
        NotificationService.error(errorMessage, { title: STRINGS.AUTH.LOGIN_FAILED });
      }
    } catch (error) {
      console.error('❌ 네이버 로그인 오류:', error);
      const errorMessage = error.status === 0 
        ? '네트워크 연결을 확인해주세요.\n백엔드 서버가 실행 중인지 확인하세요.'
        : error.message || STRINGS.AUTH.SOCIAL_LOGIN_ERROR;
      NotificationService.error(errorMessage, { title: STRINGS.ERROR.ERROR });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length <= SMS_CONFIG.PHONE_NUMBER_LENGTH) {
      setPhoneNumber(cleaned);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 7) return `${phone.slice(0, 3)}-${phone.slice(3)}`;
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.length !== SMS_CONFIG.PHONE_NUMBER_LENGTH) {
      NotificationService.warning(STRINGS.AUTH.PHONE_INVALID, { title: STRINGS.AUTH.INPUT_ERROR });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiPost(AUTH_API.SMS_SEND, { phoneNumber });

      if (response.success) {
        console.log('SMS 인증 코드 전송 성공:', response);
        setIsCodeSent(true);
        setCountdown(SMS_CONFIG.COUNTDOWN_DURATION);
        NotificationService.success(STRINGS.AUTH.SMS_SENT_SUCCESS, { title: STRINGS.COMMON.SUCCESS });
      } else {
        console.error('SMS 전송 실패:', response.message);
        NotificationService.error(response.message || STRINGS.AUTH.SMS_SEND_FAILED, { title: STRINGS.AUTH.LOGIN_FAILED });
      }
    } catch (error) {
      console.error('SMS 전송 오류:', error);
      NotificationService.error(error.message || STRINGS.AUTH.SMS_SEND_FAILED, { title: STRINGS.ERROR.ERROR });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== SMS_CONFIG.VERIFICATION_CODE_LENGTH) {
      NotificationService.warning(STRINGS.AUTH.CODE_INVALID, { title: STRINGS.AUTH.INPUT_ERROR });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiPost(AUTH_API.SMS_VERIFY, {
        phoneNumber,
        verificationCode,
      });

      if (response.success) {
        console.log('SMS 인증 성공:', response);
        NotificationService.success(STRINGS.AUTH.SMS_VERIFY_SUCCESS, { title: STRINGS.COMMON.SUCCESS });
        await handleSmsAuthSuccess();
      } else {
        console.error('SMS 인증 실패:', response.message);
        NotificationService.error(response.message || STRINGS.AUTH.SMS_VERIFY_FAILED, { title: STRINGS.AUTH.LOGIN_FAILED });
      }
    } catch (error) {
      console.error('SMS 검증 오류:', error);
      NotificationService.error(error.message || STRINGS.AUTH.SMS_VERIFY_FAILED, { title: STRINGS.ERROR.ERROR });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmsAuthSuccess = async () => {
    setIsLoading(true);
    try {
      const loginData = {
        phoneNumber: phoneNumber,
        loginType: 'SMS_AUTH',
      };
      const response = await apiPost(AUTH_API.SMS_LOGIN, loginData);

      if (response.success) {
        console.log('✅ SMS 인증 로그인 성공:', response);
        await handleLoginSuccess(
          response.user,
          response.accessToken,
          response.refreshToken,
          response.sessionId
        );
      } else {
        console.error('❌ SMS 인증 로그인 실패:', response.message);
        NotificationService.error(response.message || STRINGS.AUTH.LOGIN_ERROR, { title: STRINGS.AUTH.LOGIN_FAILED });
        // TODO: 회원가입이 필요한 경우 처리 (예: 회원가입 화면으로 이동)
      }
    } catch (error) {
      console.error('❌ SMS 인증 후 로그인 처리 오류:', error);
      NotificationService.error(error.message || STRINGS.AUTH.LOGIN_ERROR, { title: STRINGS.ERROR.ERROR });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginMode = () => {
    setSmsMode(prev => !prev);
    // 상태 초기화
    setFormData({ email: '', password: '' }); // branchCode 제거
    setPhoneNumber('');
    setVerificationCode('');
    setIsCodeSent(false);
    setCountdown(0);
  };

  return (
    <>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid
        enableAutomaticScroll
      >
        <View style={styles.loginCard}>
        <View style={styles.header}>
          <Text style={styles.title}>{STRINGS.AUTH.LOGIN_TITLE}</Text>
          <Text style={styles.subtitle}>{STRINGS.AUTH.LOGIN_SUBTITLE}</Text>
        </View>

        {/* 로그인 유형 선택 UI 제거 */}
        {/* <View style={styles.typeSelector}>...</View> */}

        {!smsMode ? (
          <>
            {/* 지점 선택 UI 제거 */}
            {/* {loginType === 'BRANCH' && (...) } */}

            {/* 이메일 입력 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{STRINGS.AUTH.EMAIL_LABEL} *</Text>
              <TextInput
                style={styles.input}
                placeholder={STRINGS.AUTH.EMAIL_PLACEHOLDER}
                placeholderTextColor={COLORS.gray500}
                value={formData.email}
                onChangeText={(value) => {
                  // 모든 문자 허용 (숫자만 입력되는 문제 방지)
                  console.log('📧 Email input:', value);
                  handleInputChange('email', value);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                autoFocus
                returnKeyType="next"
                editable={true}
                multiline={false}
                textContentType="emailAddress"
                maxLength={254}
                {...(Platform.OS === 'android' && { keyboardType: 'default' })}
              />
            </View>

            {/* 비밀번호 입력 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{STRINGS.AUTH.PASSWORD_LABEL} *</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={STRINGS.AUTH.PASSWORD_PLACEHOLDER}
                  placeholderTextColor={COLORS.gray500}
                  value={formData.password}
                  onChangeText={(value) => {
                    // 모든 문자 허용 (숫자만 입력되는 문제 방지)
                    console.log('🔒 Password input:', value);
                    handleInputChange('password', value);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="done"
                  editable={true}
                  multiline={false}
                  {...(Platform.OS === 'android' && { keyboardType: 'default' })}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 비밀번호 찾기 링크 */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => NavigationService.navigate(AUTH_SCREENS.FORGOT_PASSWORD)}
            >
              <Text style={styles.forgotPasswordText}>{STRINGS.AUTH.FORGOT_PASSWORD}</Text>
            </TouchableOpacity>

            {/* 로그인 버튼 */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>{STRINGS.AUTH.LOGIN_BUTTON}</Text>
              )}
            </TouchableOpacity>

            {/* SMS 로그인 전환 버튼 */}
            <TouchableOpacity
              style={[styles.switchModeButton, isLoading && styles.switchModeButtonDisabled]}
              onPress={toggleLoginMode}
              disabled={isLoading}
            >
              <Text style={styles.switchModeButtonText}>
                📱 {STRINGS.AUTH.SMS_LOGIN_MODE}
              </Text>
            </TouchableOpacity>

            {/* 로그인 유형별 안내 제거 */}
            {/* <View style={styles.infoBox}>...</View> */}
          </>
        ) : (
          <>
            {/* SMS 로그인 섹션 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{STRINGS.AUTH.PHONE_NUMBER_LABEL} *</Text>
              <View style={styles.smsInputContainer}>
                <TextInput
                  style={styles.smsPhoneNumberInput}
                  placeholder={STRINGS.AUTH.PHONE_NUMBER_PLACEHOLDER}
                  placeholderTextColor={COLORS.gray500}
                  value={formatPhoneNumber(phoneNumber)}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={SMS_CONFIG.PHONE_NUMBER_LENGTH}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.smsButton, (isCodeSent && countdown > 0) && styles.smsButtonDisabled]}
                  onPress={sendVerificationCode}
                  disabled={isLoading || (isCodeSent && countdown > 0)}
                >
                  <Text style={styles.smsButtonText}>
                    {isCodeSent && countdown > 0
                      ? `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`
                      : STRINGS.AUTH.SEND_VERIFICATION_CODE}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {isCodeSent && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>{STRINGS.AUTH.VERIFICATION_CODE_LABEL} *</Text>
                <View style={styles.smsInputContainer}>
                  <TextInput
                    style={styles.smsVerificationInput}
                    placeholder={STRINGS.AUTH.VERIFICATION_CODE_PLACEHOLDER}
                    placeholderTextColor={COLORS.gray500}
                    value={verificationCode}
                    onChangeText={(value) => setVerificationCode(value.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={SMS_CONFIG.VERIFICATION_CODE_LENGTH}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.smsButton, isLoading && styles.smsButtonDisabled]}
                    onPress={verifyCode}
                    disabled={isLoading || !verificationCode || verificationCode.length !== SMS_CONFIG.VERIFICATION_CODE_LENGTH}
                  >
                    <Text style={styles.smsButtonText}>{STRINGS.AUTH.VERIFY_CODE}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleSmsAuthSuccess}
              disabled={isLoading || !isCodeSent || !verificationCode || verificationCode.length !== SMS_CONFIG.VERIFICATION_CODE_LENGTH}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>{STRINGS.AUTH.SMS_LOGIN_BUTTON}</Text>
              )}
            </TouchableOpacity>

            {/* 이메일/비밀번호 로그인 전환 버튼 */}
            <TouchableOpacity
              style={[styles.switchModeButton, isLoading && styles.switchModeButtonDisabled]}
              onPress={toggleLoginMode}
              disabled={isLoading}
            >
              <Text style={styles.switchModeButtonText}>
                📧 {STRINGS.AUTH.EMAIL_LOGIN_MODE}
              </Text>
            </TouchableOpacity>

            {/* 회원가입 필요 시 안내 (SMS 로그인 전용) */}
            <View style={styles.registerPrompt}>
              <Text style={styles.registerPromptText}>{STRINGS.AUTH.NO_ACCOUNT_PROMPT}{' '}</Text>
              <TouchableOpacity onPress={() => NavigationService.navigate(AUTH_SCREENS.REGISTER)}>
                <Text style={styles.registerLinkText}>{STRINGS.AUTH.REGISTER_LINK}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 구분선 */}
        <View style={styles.divider}>
          <Text style={styles.dividerText}>{STRINGS.AUTH.SOCIAL.OR}</Text>
        </View>

        {/* 소셜 로그인 버튼 */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={handleKakaoLogin}
            activeOpacity={0.7}
          >
            {/* 카카오 로고 - 말풍선 아이콘 */}
            <View style={styles.kakaoLogoContainer}>
              <MessageCircle size={24} color="#000" fill="#000" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialButton, styles.naverButton]}
            onPress={handleNaverLogin}
            activeOpacity={0.7}
          >
            {/* 네이버 로고 */}
            <View style={styles.naverLogo}>
              <Text style={styles.naverLogoText}>N</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 일반 회원가입 링크 (이메일/비밀번호 로그인 전용) */}
        {!smsMode && (
          <View style={styles.registerPrompt}>
            <Text style={styles.registerPromptText}>{STRINGS.AUTH.NO_ACCOUNT_PROMPT}{' '}</Text>
            <TouchableOpacity onPress={() => NavigationService.navigate(AUTH_SCREENS.REGISTER)}>
              <Text style={styles.registerLinkText}>{STRINGS.AUTH.REGISTER_LINK}</Text>
            </TouchableOpacity>
          </View>
        )}

        </View>
      </KeyboardAwareScrollView>
      <DuplicateLoginModal
        visible={duplicateLoginState.visible}
        message={duplicateLoginState.message}
        onConfirm={handleConfirmDuplicateLogin}
        onCancel={closeDuplicateLoginModal}
        isProcessing={isConfirmingDuplicateLogin}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  loginCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.dark,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.dark,
  },
  passwordToggle: {
    padding: SPACING.md,
  },
  passwordToggleText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  loginButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm, // 로그인 버튼 위로 간격 조정
    marginBottom: SPACING.md, // 기존 로그인 버튼 위 간격과 조화롭게 조정
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  socialButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xs,
  },
  kakaoButton: {
    backgroundColor: COLORS.kakao,
  },
  naverButton: {
    backgroundColor: COLORS.naver,
  },
  kakaoLogoContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  naverLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  naverLogoText: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#03C75A',
    lineHeight: 18,
  },
  smsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  smsPhoneNumberInput: {
    flex: 1,
    padding: SPACING.md * 0.75,
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  smsVerificationInput: {
    flex: 1,
    padding: SPACING.md * 0.75,
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  smsButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md * 0.75,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  smsButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  registerPromptText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  registerLinkText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  switchModeButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchModeButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  switchModeButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default LoginScreen;

