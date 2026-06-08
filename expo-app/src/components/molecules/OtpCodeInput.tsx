/**
 * OtpCodeInput — 6자리 OTP 코드 입력 컴포넌트 (Molecule).
 *
 * <p>단일 hidden `TextInput` + 6칸 표시 박스 패턴.
 *  - 자동 포커스 이동 불필요(입력 길이로 표시 동기화)
 *  - iOS/Android SMS 자동 입력 호환 (`textContentType="oneTimeCode"`, `autoComplete="sms-otp"`)
 *  - 숫자 키보드 + 6자리 입력 시 `onComplete` 콜백
 * </p>
 *
 * 디자인 토큰만 사용 (`useTheme()`), 하드코딩 색상·간격 금지.
 *
 * @author MindGarden
 * @since 2026-06-08
 */
import { useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type AccessibilityProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { OTP_CODE_LENGTH, sanitizeOtpInput, isOtpComplete } from './otpCodeInputUtils';

export { OTP_CODE_LENGTH, sanitizeOtpInput, isOtpComplete };

interface OtpCodeInputProps extends Pick<AccessibilityProps, 'accessibilityLabel'> {
  /** 현재 입력 값 (0~6자리 숫자) — 부모가 상태 관리 */
  value: string;
  /** 입력 변경 콜백 — 6자리 숫자만 통과시킴 */
  onChange: (value: string) => void;
  /** 6자리 입력 완료 시 호출 (부모가 자동 verify 트리거 등에 사용) */
  onComplete?: (value: string) => void;
  /** 비활성화 */
  disabled?: boolean;
  /** 자동 포커스 (화면 진입 직후 키보드 표시) */
  autoFocus?: boolean;
  /** 에러 상태 — 빨간 테두리 */
  hasError?: boolean;
  /** 컨테이너 추가 스타일 */
  style?: StyleProp<ViewStyle>;
}

/**
 * 입력 길이로 동기화되는 6칸 OTP 박스. tap 시 hidden input 으로 포커스.
 */
export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  hasError = false,
  style,
  accessibilityLabel = '인증번호 6자리 입력',
}: OtpCodeInputProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);

  const cells = useMemo(() => Array.from({ length: OTP_CODE_LENGTH }, (_, i) => i), []);

  useEffect(() => {
    if (autoFocus && !disabled) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [autoFocus, disabled]);

  const focusInput = () => {
    if (!disabled) inputRef.current?.focus();
  };

  const handleChange = (raw: string) => {
    const digits = sanitizeOtpInput(raw);
    onChange(digits);
    if (isOtpComplete(digits) && onComplete) {
      onComplete(digits);
    }
  };

  const cellBorder = (filled: boolean, isError: boolean): string => {
    if (isError) return theme.colors.error;
    if (filled) return theme.colors.primary;
    return theme.colors.border;
  };

  return (
    <Pressable
      onPress={focusInput}
      style={[styles.container, style]}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.row} pointerEvents="none">
        {cells.map((i) => {
          const ch = value[i] ?? '';
          const filled = ch.length > 0;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                {
                  borderColor: cellBorder(filled, hasError),
                  backgroundColor: theme.colors.bgSub,
                },
              ]}
            >
              <Text
                style={[
                  styles.cellText,
                  {
                    color: hasError ? theme.colors.error : theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                  },
                ]}
              >
                {ch}
              </Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_CODE_LENGTH}
        editable={!disabled}
        style={styles.hiddenInput}
        importantForAccessibility="yes"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="6자리 숫자를 입력해 주세요"
      />
    </Pressable>
  );
}

const CELL_SIZE = 44;
const CELL_GAP = 8;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: CELL_SIZE,
  },
  row: {
    flexDirection: 'row',
    gap: CELL_GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: fontSizeTokens.xl,
    fontWeight: '700',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    color: 'transparent',
  },
});
