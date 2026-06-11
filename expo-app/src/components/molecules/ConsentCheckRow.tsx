/**
 * Apple G1.2 UGC (P2-C) — 동의 체크 행 (필수/선택 라벨 + 체크박스 + 보기 링크).
 *
 * <p>디자이너 시안 §A.4.5 ConsentCheckRow molecule. EULA 동의 화면 / 가입 화면 등에서 재사용한다.
 * 디자인 토큰만 사용하며 하드코딩 0건.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme';

const CHECKBOX_SIZE = 22;
const CHECK_ICON_SIZE = 14;
const ROW_MIN_HEIGHT = 56;

export type ConsentCheckRowProps = {
  readonly required: boolean;
  readonly label: string;
  readonly checked: boolean;
  readonly onToggle: () => void;
  readonly onViewPress?: () => void;
  readonly disabled?: boolean;
  readonly viewLinkLabel?: string;
  readonly testID?: string;
};

/**
 * 동의 체크 행 — 좌측 체크박스 + 라벨 + (선택) 우측 "보기" 링크.
 *
 * @param props {@link ConsentCheckRowProps}
 * @returns 체크 행
 */
export function ConsentCheckRow({
  required,
  label,
  checked,
  onToggle,
  onViewPress,
  disabled = false,
  viewLinkLabel = '보기',
  testID,
}: ConsentCheckRowProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (disabled) {
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {
        /* noop */
      });
    }
    onToggle();
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={label}
        onPress={handlePress}
        disabled={disabled}
        style={styles.checkArea}
        testID={testID}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: checked ? theme.colors.primary : theme.colors.gray[300],
              backgroundColor: checked ? theme.colors.primary : theme.colors.surface,
              borderRadius: theme.borderRadius.sm,
            },
          ]}
        >
          {checked ? <Check size={CHECK_ICON_SIZE} color={theme.colors.textOnPrimary} /> : null}
        </View>
        <View style={styles.labelWrap}>
          <Text
            style={[
              styles.requiredTag,
              {
                color: required ? theme.colors.error : theme.colors.textTertiary,
                fontFamily: theme.fontFamily.medium,
              },
              theme.textStyles.caption,
            ]}
          >
            {required ? '(필수)' : '(선택)'}
          </Text>
          <Text
            style={[
              styles.label,
              { color: theme.colors.textMain },
              theme.textStyles.bodySmall,
            ]}
            numberOfLines={2}
          >
            {label}
          </Text>
        </View>
      </Pressable>

      {onViewPress ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${label} ${viewLinkLabel}`}
          onPress={onViewPress}
          hitSlop={8}
          disabled={disabled}
          style={styles.viewLink}
          testID={testID ? `${testID}-view` : undefined}
        >
          <Text
            style={[
              {
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.semibold,
              },
              theme.textStyles.label,
            ]}
          >
            {viewLinkLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_MIN_HEIGHT,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  checkArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requiredTag: {
    flexShrink: 0,
  },
  label: {
    flex: 1,
    flexShrink: 1,
  },
  viewLink: {
    paddingVertical: 6,
    paddingLeft: 8,
  },
});

export default ConsentCheckRow;
