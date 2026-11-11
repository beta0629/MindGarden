/**
 * 내담자 다음 상담 영역 — 로딩 · 히어로+입장 CTA · 오류 · 빈 상태(비예약 행동).
 * 커버 홈과 예약 챕터가 공유한다. 결제 정보는 넣지 않는다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { StyleSheet, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import { CLIENT_COVER_COPY } from '@/constants/clientHomeCopy';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import { borderRadius, spacing } from '@/theme';
import type { CoverHeroView } from '@/utils/coverChapterViewModel';
import { CoverHeroEmpty } from './CoverHeroEmpty';
import { NextSessionHero } from './NextSessionHero';
import { PrimaryEntryCta } from './PrimaryEntryCta';

const HERO_SKELETON_HEIGHT = 160;

export interface ClientHeroBlockProps {
  readonly hero: CoverHeroView | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly size: 'phone' | 'tablet';
  readonly eyebrowOverride?: string;
  readonly onEnter: (scheduleId: number) => void;
  readonly onRetry: () => void;
  readonly onEmptyAction: () => void;
}

export function ClientHeroBlock({
  hero,
  isLoading,
  isError,
  size,
  eyebrowOverride,
  onEnter,
  onRetry,
  onEmptyAction,
}: ClientHeroBlockProps) {
  if (isLoading) {
    return <SkeletonLoader height={HERO_SKELETON_HEIGHT} borderRadius={borderRadius.md} />;
  }
  if (hero) {
    return (
      <View style={styles.stack}>
        <NextSessionHero hero={hero} size={size} eyebrowOverride={eyebrowOverride} />
        <PrimaryEntryCta
          label={CLIENT_COVER_COPY.ENTRY_CTA}
          accessibilityLabel={CLIENT_COVER_COPY.ENTRY_CTA_A11Y}
          onPress={() => onEnter(hero.scheduleId)}
        />
      </View>
    );
  }
  if (isError) {
    return (
      <CoverHeroEmpty
        eyebrow={COVER_CHAPTER_COPY.NEXT_SESSION_LABEL}
        title={CLIENT_COVER_COPY.HERO_ERROR_TITLE}
        actionLabel={CLIENT_COVER_COPY.HERO_ERROR_ACTION}
        onAction={onRetry}
      />
    );
  }
  return (
    <CoverHeroEmpty
      eyebrow={COVER_CHAPTER_COPY.NEXT_SESSION_LABEL}
      title={CLIENT_COVER_COPY.HERO_EMPTY_TITLE}
      description={CLIENT_COVER_COPY.HERO_EMPTY_DESCRIPTION}
      actionLabel={CLIENT_COVER_COPY.HERO_EMPTY_ACTION}
      actionIcon={Bell}
      onAction={onEmptyAction}
    />
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing['2xl'],
  },
});
