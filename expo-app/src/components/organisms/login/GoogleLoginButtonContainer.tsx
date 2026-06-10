/**
 * Google 로그인 버튼 컨테이너 — Native SDK 마이그레이션 (Build #16, 2026-06-10).
 *
 * <p>**P0 마이그레이션**: 기존 `expo-auth-session/providers/google` 의 `useAuthRequest` 훅 흐름은
 * Android Google Client 정책상 Custom URI scheme redirect 가 차단되어 (`400 invalid_request`)
 * 실패한다. `@react-native-google-signin/google-signin` Native SDK 는 mount 단계에서 throw 하지
 * 않으므로 훅 가드(`useAuthRequest` 의 mount throw 회피)가 필요 없다.</p>
 *
 *  - **Active** ({@link GoogleLoginButtonActive}) — `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` 가 구성된
 *    상태에서만 mount. onPress 시 {@link signInWithGoogle} 호출 → outcome 을 부모로 전달.
 *  - **Disabled** ({@link GoogleLoginButtonDisabled}) — Web Client ID 가 비어 있을 때 비활성 톤
 *    버튼만 렌더. 탭 시 Alert 로 친절 안내.
 *
 * <p>SSOT:
 *  - docs/project-management/2026-06-10/GOOGLE_ANDROID_OAUTH_SETUP.md (사용자 액션)
 *  - https://react-native-google-signin.github.io/docs/api</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { SocialLoginButton } from '@/components/molecules/SocialLoginButton';
import {
  isGoogleNativeConfigured,
  signInWithGoogle,
  type GoogleSignInOutcome,
} from '@/services/auth/googleSignIn';

const GOOGLE_DISABLED_ALERT_TITLE = 'Google 로그인 준비 중';
const GOOGLE_DISABLED_ALERT_BODY =
  'Google 로그인은 곧 사용 가능합니다. 다른 로그인 방법(카카오 / 네이버 / Apple / 이메일)을 이용해 주세요.';
const GOOGLE_DISABLED_ALERT_CONFIRM = '확인';
const GOOGLE_DISABLED_ACCESSIBILITY_HINT = 'Google 로그인은 곧 사용 가능합니다';

export interface GoogleLoginButtonContainerProps {
  /** OAuth 호출 직전 — 부모가 isLoading=true / loadingProvider='google' 처리. */
  readonly onSignInStart: () => void;
  /** Native SDK 결과를 부모로 전달 — 부모가 BE 호출·라우팅·에러 처리. */
  readonly onAuthOutcome: (outcome: GoogleSignInOutcome) => void;
  /** 로딩 인디케이터 표시 여부 — 다른 provider 와 동일 UX. */
  readonly loading: boolean;
  /** 외부 일반 disabled (다른 provider 진행 중 등). */
  readonly disabled: boolean;
  /** Reduce Motion 분기 — true 면 scale 대신 opacity 변경. */
  readonly reduceMotion: boolean;
  /** 등장 애니메이션 전 차단용 — 외부에서 pointerEvents 제어. */
  readonly pointerEventsDisabled: boolean;
}

/**
 * Google 로그인 버튼 — Web Client ID 구성 여부에 따라 Active/Disabled 분기.
 *
 * <p>Native SDK 는 mount throw 가 없어 가드가 단순하다. 그러나 미구성 상태에서 버튼이
 * 동작하면 `signInWithGoogle()` 가 즉시 `notConfigured` outcome 을 반환하므로 사용자에게
 * 동일 친절 안내가 노출된다 — Disabled 분기는 시각적 힌트 + Alert 만 제공한다.</p>
 */
export function GoogleLoginButtonContainer(props: GoogleLoginButtonContainerProps) {
  const configured = isGoogleNativeConfigured();
  if (configured) {
    return <GoogleLoginButtonActive {...props} />;
  }
  return <GoogleLoginButtonDisabled {...props} />;
}

function GoogleLoginButtonActive({
  onSignInStart,
  onAuthOutcome,
  loading,
  disabled,
  reduceMotion,
  pointerEventsDisabled,
}: GoogleLoginButtonContainerProps) {
  const handlePress = useCallback(async () => {
    onSignInStart();
    const outcome = await signInWithGoogle();
    onAuthOutcome(outcome);
  }, [onAuthOutcome, onSignInStart]);

  return (
    <SocialLoginButton
      variant="google"
      onPress={handlePress}
      loading={loading}
      disabled={disabled}
      reduceMotion={reduceMotion}
      pointerEventsDisabled={pointerEventsDisabled}
    />
  );
}

function GoogleLoginButtonDisabled({
  loading,
  disabled,
  reduceMotion,
  pointerEventsDisabled,
}: GoogleLoginButtonContainerProps) {
  const handlePress = useCallback(() => {
    Alert.alert(GOOGLE_DISABLED_ALERT_TITLE, GOOGLE_DISABLED_ALERT_BODY, [
      { text: GOOGLE_DISABLED_ALERT_CONFIRM },
    ]);
  }, []);

  return (
    <SocialLoginButton
      variant="google"
      onPress={handlePress}
      loading={loading}
      disabled={disabled}
      visuallyMuted
      reduceMotion={reduceMotion}
      pointerEventsDisabled={pointerEventsDisabled}
      accessibilityHint={GOOGLE_DISABLED_ACCESSIBILITY_HINT}
    />
  );
}
