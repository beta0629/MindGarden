/**
 * V2 §B.2 / §I.7 — Quiet Reveal Bottom Sheet (이메일·휴대폰 + 비밀번호 폼).
 *
 * <p>V1 의 인라인 토글 방식을 폐기하고 (§A.6) 트리거 → Bottom Sheet 슬라이드 업 진입으로 변경.
 * `@gorhom/bottom-sheet` v5 가 이미 `expo-app/package.json` 에 설치되어 있어 라이브러리를 활용한다 (§I.7).</p>
 *
 * <p>SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md
 *  - §B.2 ASCII wireframe (handle / title / 입력 2 / CTA / 비밀번호 찾기 inline)
 *  - §C.5 Primary CTA (`consultant.primary` 56dp 14dp radius SemiBold 16)
 *  - §D.3 Bottom Sheet 모션 (240ms 슬라이드 업, backdrop 0.18, Reduce Motion 시 fade only)
 *  - §G.1 a11y / §G.3 KeyboardAvoidingView</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Lock, Mail } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { fontFamily, fontSize, textStyles } from '@/theme/typography';
import { getWebBaseUrl } from '@/config/webBaseUrl';
import {
  BUTTON_BORDER_RADIUS,
  BUTTON_HEIGHT,
} from '@/components/organisms/login/loginAnimationConstants';

const MAX_FONT_SIZE_MULTIPLIER = 1.6;

const SHEET_TITLE = '이미 가입한 이메일·휴대폰으로 로그인';
const EMAIL_PLACEHOLDER = '이메일 또는 휴대폰 번호';
const PASSWORD_PLACEHOLDER = '비밀번호';
const SUBMIT_LABEL = '로그인';
const FORGOT_PASSWORD_LABEL = '비밀번호 찾기';
const WEB_FORGOT_PASSWORD_PATH = '/forgot-password';
const EXTERNAL_LINK_OPEN_ERROR = '웹 페이지를 열 수 없습니다. 잠시 후 다시 시도해주세요.';

/** §D.3 Backdrop opacity — `rgba(0,0,0,0.18)` (차분, blur 없음) */
const BACKDROP_OPACITY = 0.18;
/** §B.2 Sheet 높이 — `min(420dp, 화면 60%)` 의 snap point */
const SHEET_SNAP_POINT: readonly (string | number)[] = ['60%'];

export interface CredentialSheetProps {
  /** 외부에서 열림 상태 제어 */
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly email: string;
  readonly password: string;
  readonly onEmailChange: (value: string) => void;
  readonly onPasswordChange: (value: string) => void;
  readonly onSubmit: () => void;
  /** Submit 진행 중 인디케이터 표시 */
  readonly submitting: boolean;
  /** 외부에서 일반 로딩 상태 (다른 SNS 진행 중 등) */
  readonly disabled?: boolean;
}

export function CredentialSheet(props: CredentialSheetProps) {
  const {
    isOpen,
    onClose,
    email,
    password,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    submitting,
    disabled = false,
  } = props;

  const theme = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1 && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  const handleSubmit = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      /* noop */
    });
    onSubmit();
  }, [onSubmit]);

  const handleForgotPasswordPress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      /* noop */
    });
    const url = `${getWebBaseUrl()}${WEB_FORGOT_PASSWORD_PATH}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(EXTERNAL_LINK_OPEN_ERROR);
    });
  }, []);

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        opacity={BACKDROP_OPACITY}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleIndicatorStyle = useMemo(
    () => ({ backgroundColor: theme.colors.border }),
    [theme.colors.border],
  );
  const sheetBackgroundStyle = useMemo(
    () => ({ backgroundColor: theme.colors.surface }),
    [theme.colors.surface],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={SHEET_SNAP_POINT as (string | number)[]}
      enablePanDownToClose
      keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={handleIndicatorStyle}
      backgroundStyle={sheetBackgroundStyle}
      accessibilityLabel="이메일·휴대폰 로그인"
    >
      <BottomSheetView style={styles.content}>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[styles.title, { color: theme.colors.textMain }]}
          accessibilityRole="header"
        >
          {SHEET_TITLE}
        </Text>

        <View
          style={[
            styles.inputContainer,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.bgSub },
          ]}
        >
          <Mail size={18} color={theme.colors.textTertiary} />
          <TextInput
            style={[styles.input, { color: theme.colors.textMain }]}
            placeholder={EMAIL_PLACEHOLDER}
            placeholderTextColor={theme.colors.textTertiary}
            value={email}
            onChangeText={onEmailChange}
            autoCapitalize="none"
            keyboardType="default"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            accessibilityLabel={EMAIL_PLACEHOLDER}
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            testID="login-input-email"
          />
        </View>

        <View
          style={[
            styles.inputContainer,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.bgSub },
          ]}
        >
          <Lock size={18} color={theme.colors.textTertiary} />
          <TextInput
            style={[styles.input, { color: theme.colors.textMain }]}
            placeholder={PASSWORD_PLACEHOLDER}
            placeholderTextColor={theme.colors.textTertiary}
            value={password}
            onChangeText={onPasswordChange}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            accessibilityLabel={PASSWORD_PLACEHOLDER}
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            testID="login-input-password"
          />
        </View>

        <Pressable
          style={[
            styles.submitButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: disabled || submitting ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={disabled || submitting}
          accessibilityRole="button"
          accessibilityLabel={SUBMIT_LABEL}
          accessibilityState={{ disabled: disabled || submitting, busy: submitting }}
          testID="login-credential-submit"
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <Text
              maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.submitLabel, { color: theme.colors.textOnPrimary }]}
            >
              {SUBMIT_LABEL}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleForgotPasswordPress}
          style={styles.forgotPasswordWrap}
          accessibilityRole="link"
          accessibilityLabel={FORGOT_PASSWORD_LABEL}
          hitSlop={8}
          testID="login-credential-forgot-password"
        >
          <Text
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            style={[styles.forgotPasswordLabel, { color: theme.colors.textSecondary }]}
          >
            {FORGOT_PASSWORD_LABEL}
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    minHeight: BUTTON_HEIGHT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    ...textStyles.body,
  },
  submitButton: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitLabel: {
    ...textStyles.button,
    textAlign: 'center',
  },
  forgotPasswordWrap: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  forgotPasswordLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
