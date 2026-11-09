/**
 * 다음 상담 히어로 — 머리말 · 큰 시각 · 상대 이름 · 보조 정보.
 * 결제·미결제 표시는 넣지 않는다(정책: 히어로·입장 CTA 옆 금지).
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, spacing } from '@/theme';
import type { CoverHeroView } from '@/utils/coverChapterViewModel';
import { InstitutionBadge } from './CoverMarks';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

export interface NextSessionHeroProps {
  readonly hero: CoverHeroView;
  readonly size?: 'phone' | 'tablet';
  /** 일정 챕터처럼 머리말을 날짜 문구로 바꿀 때 */
  readonly eyebrowOverride?: string;
}

export function NextSessionHero({ hero, size = 'phone', eyebrowOverride }: NextSessionHeroProps) {
  const clockSize =
    size === 'tablet' ? COVER_METRICS.heroClockFontSizeTablet : COVER_METRICS.heroClockFontSize;
  const eyebrow = eyebrowOverride ?? hero.eyebrow;

  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={[eyebrow, hero.clock, hero.personLabel, hero.detail, hero.badgeLabel]
        .filter(Boolean)
        .join(', ')}
    >
      <Text style={styles.eyebrow} numberOfLines={1}>
        {eyebrow}
      </Text>
      {hero.clock ? (
        <Text
          style={[
            styles.clock,
            {
              fontSize: clockSize,
              lineHeight: Math.round(clockSize * COVER_METRICS.heroClockLineHeightRatio),
            },
          ]}
          numberOfLines={1}
        >
          {hero.clock}
        </Text>
      ) : null}
      {hero.personLabel ? (
        <HeroLine>
          <Text style={styles.person} numberOfLines={1} ellipsizeMode="tail">
            {hero.personLabel}
          </Text>
          <InstitutionBadge label={hero.badgeLabel} />
        </HeroLine>
      ) : null}
      {hero.detail ? (
        <HeroLine>
          <Text style={styles.detail} numberOfLines={1} ellipsizeMode="tail">
            {hero.detail}
          </Text>
          {hero.personLabel ? null : <InstitutionBadge label={hero.badgeLabel} />}
        </HeroLine>
      ) : null}
    </View>
  );
}

function HeroLine({ children }: Readonly<{ children: ReactNode }>) {
  return <View style={styles.line}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  eyebrow: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: CLINIC_OS.teal,
  },
  clock: {
    fontFamily: fontFamily.regular,
    color: CLINIC_OS.ink,
    letterSpacing: -1,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  person: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xl,
    color: CLINIC_OS.ink,
  },
  detail: {
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: CLINIC_OS.muted,
  },
});
