/**
 * Google 로그인 버튼 컨테이너 — P0 핫픽스 (2026-06-10).
 *
 * <p>`Google.useAuthRequest` 는 render 중 현재 플랫폼의 client id 가 누락(또는 placeholder)이면
 * **컴포넌트 mount 시점에 throw** 한다(`Client Id property iosClientId must be defined to
 * use Google auth on this platform.`). 이 throw 가 React error boundary 까지 전파되면
 * 앱 첫 화면이 `Something went wrong` Fatal 로 막혀 베타 테스트가 완전 차단된다.</p>
 *
 * <p>본 컨테이너는 `isGoogleConfiguredForPlatform()` 분기로 mount 자체를 가드한다:</p>
 *
 *  - **Active** ({@link GoogleLoginButtonActive}) — 환경에 platform 별 client id 가 있을 때만
 *    `useGoogleAuthRequest()` 훅을 호출한다. 정상 OAuth 플로우 진행.
 *  - **Disabled** ({@link GoogleLoginButtonDisabled}) — client id 가 비어 있을 때 훅을
 *    호출하지 않고 비활성 톤의 버튼만 렌더한다. 탭 시 Alert 로 친절 안내.
 *
 * <p>SSOT:
 *  - docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md §I.4 G-1
 *  - docs/project-management/GOOGLE_AUTH_IOS_FATAL_HOTFIX_20260610.md (운영 일지)</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { SocialLoginButton } from '@/components/molecules/SocialLoginButton';
import {
  isGoogleConfiguredForPlatform,
  useGoogleAuthRequest,
  type GoogleSignInOutcome,
} from '@/services/auth/googleSignIn';

/** Disabled 상태 안내 카피 — 정의된 한 곳에서만 변경한다. */
const GOOGLE_DISABLED_ALERT_TITLE = 'Google 로그인 준비 중';
const GOOGLE_DISABLED_ALERT_BODY =
  'Google 로그인은 곧 사용 가능합니다. 다른 로그인 방법(카카오 / 네이버 / Apple / 이메일)을 이용해 주세요.';
const GOOGLE_DISABLED_ALERT_CONFIRM = '확인';
const GOOGLE_DISABLED_ACCESSIBILITY_HINT = 'Google 로그인은 곧 사용 가능합니다';

export interface GoogleLoginButtonContainerProps {
  /** 사용자가 버튼을 눌러 OAuth 브라우저 호출 직전 — 부모가 isLoading=true / loadingProvider='google' 처리 */
  readonly onSignInStart: () => void;
  /** OAuth 브라우저 결과를 부모로 전달 — 부모가 BE 호출·라우팅·에러 처리 */
  readonly onAuthOutcome: (outcome: GoogleSignInOutcome) => void;
  /** 로딩 인디케이터 표시 여부 — 다른 provider 와 동일 UX */
  readonly loading: boolean;
  /** 외부 일반 disabled (다른 provider 진행 중 등) */
  readonly disabled: boolean;
  /** Reduce Motion 분기 — true 면 scale 대신 opacity 변경 */
  readonly reduceMotion: boolean;
  /** 등장 애니메이션 전 차단용 — 외부에서 pointerEvents 제어 */
  readonly pointerEventsDisabled: boolean;
}

/**
 * Google 로그인 버튼 — platform client id 구성 여부에 따라 Active/Disabled 분기.
 *
 * <p>**핵심 안전판**: `isGoogleConfiguredForPlatform()` 이 false 면 절대로 Active 컴포넌트를
 * mount 하지 않는다. 따라서 `useGoogleAuthRequest()` 도 호출되지 않아 throw 0.</p>
 */
export function GoogleLoginButtonContainer(props: GoogleLoginButtonContainerProps) {
  const configured = isGoogleConfiguredForPlatform();
  if (configured) {
    return <GoogleLoginButtonActive {...props} />;
  }
  return <GoogleLoginButtonDisabled {...props} />;
}

/**
 * 활성 분기 — platform client id 가 구성된 상태에서만 mount 된다.
 *
 * <p>`useGoogleAuthRequest()` 가 안전하게 호출됨이 보장된다 (mount 가드 통과 후).</p>
 */
function GoogleLoginButtonActive({
  onSignInStart,
  onAuthOutcome,
  loading,
  disabled,
  reduceMotion,
  pointerEventsDisabled,
}: GoogleLoginButtonContainerProps) {
  const { promptAsync, isReady } = useGoogleAuthRequest();

  const handlePress = useCallback(async () => {
    if (!isReady) {
      onAuthOutcome({
        kind: 'notConfigured',
        message: 'Google 로그인 모듈이 아직 준비 중입니다. 잠시 후 다시 시도해 주세요.',
      });
      return;
    }
    onSignInStart();
    const outcome = await promptAsync();
    onAuthOutcome(outcome);
  }, [isReady, onAuthOutcome, onSignInStart, promptAsync]);

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

/**
 * 비활성 분기 — client id 가 비어 있을 때 렌더. 훅 미사용 → mount throw 0.
 *
 * <p>버튼은 시각적으로 흐리게(`visuallyMuted`) 렌더되어 곧 사용 가능 상태임을 암시하고,
 * 탭 시 Alert 로 친절 안내한다. 다른 3 provider(카카오/네이버/Apple) + 이메일 폼은 정상 동작.</p>
 */
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
