/**
 * CitationBlock — 의료/건강 콘텐츠 출처(Citation) 표시 molecule.
 *
 * Apple Guideline 1.4.1 (Plan A · T3) 대응 — 심리 교육·명상·자가검사 결과·마음 날씨 등
 * 의학적 정보가 노출되는 화면 **하단**에 원전 출처를 표기한다.
 *
 * - 4 필드(`label`, `url`, `author`, `publishedYear`) 모두 비어 있으면 렌더링하지 않는다.
 * - 외부 링크는 `expo-web-browser`(인앱 브라우저)로 열고, `https://`/`http://` 외 스킴은 무시한다.
 * - 색·간격은 디자인 토큰(`useTheme()`)만 사용한다(`APPLE_T3_CITATION_DESIGN_HANDOFF.md` §3.4).
 *
 * @author MindGarden
 * @since 2026-06-07
 */
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BookOpen, ExternalLink, Pen, Calendar } from 'lucide-react-native';
import { useTheme } from '@/theme';

export interface CitationSource {
  readonly label?: string | null;
  readonly url?: string | null;
  readonly author?: string | null;
  readonly publishedYear?: number | null;
}

interface CitationBlockProps {
  readonly source?: CitationSource | null;
  readonly title?: string;
  readonly testID?: string;
}

const SAFE_URL_PATTERN = /^https?:\/\//i;

function isFiniteYear(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1800 && value <= 2999;
}

function trimToString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function isSafeUrl(url: string): boolean {
  return SAFE_URL_PATTERN.test(url);
}

export function CitationBlock({
  source,
  title = '출처',
  testID,
}: CitationBlockProps) {
  const theme = useTheme();

  if (!source) return null;

  const label = trimToString(source.label);
  const author = trimToString(source.author);
  const url = trimToString(source.url);
  const year = isFiniteYear(source.publishedYear) ? source.publishedYear : null;

  if (!label && !author && !url && year === null) {
    return null;
  }

  const safeUrl = url && isSafeUrl(url) ? url : '';

  const handleOpenLink = async () => {
    if (!safeUrl) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    try {
      const supported = await Linking.canOpenURL(safeUrl);
      if (supported) {
        await Linking.openURL(safeUrl);
      }
    } catch {
      // 외부 브라우저 호출 실패는 조용히 무시 (사용자 경험 보호)
    }
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.bgSub,
          borderRadius: theme.borderRadius.md,
        },
      ]}
      accessibilityRole="text"
      testID={testID}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
          marginBottom: 6,
        }}
      >
        {title}
      </Text>

      {label ? (
        <View style={styles.row}>
          <BookOpen size={14} color={theme.colors.textSecondary} />
          <Text
            style={[
              styles.rowText,
              {
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMain,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      ) : null}

      {author ? (
        <View style={styles.row}>
          <Pen size={14} color={theme.colors.textSecondary} />
          <Text
            style={[
              styles.rowText,
              {
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {author}
            {year !== null ? ` · ${year}` : ''}
          </Text>
        </View>
      ) : year !== null ? (
        <View style={styles.row}>
          <Calendar size={14} color={theme.colors.textSecondary} />
          <Text
            style={[
              styles.rowText,
              {
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {year}
          </Text>
        </View>
      ) : null}

      {safeUrl ? (
        <Pressable
          onPress={handleOpenLink}
          style={({ pressed }) => [
            styles.linkRow,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="link"
          accessibilityLabel={`출처 링크 열기: ${label || safeUrl}`}
        >
          <ExternalLink size={14} color={theme.colors.primary} />
          <Text
            style={[
              styles.linkText,
              {
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.primary,
              },
            ]}
            numberOfLines={1}
          >
            {safeUrl}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 12,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    gap: 6,
  },
  rowText: {
    flex: 1,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  linkText: {
    flex: 1,
    textDecorationLine: 'underline',
  },
});
