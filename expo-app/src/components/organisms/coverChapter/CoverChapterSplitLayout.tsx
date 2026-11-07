/**
 * 커버+챕터 셸 — 폰·세로 태블릿은 단일 세로 스택, 가로 태블릿은 좌 40% 커버 / 우 60% 시트.
 * 가로 태블릿에서 폰 레이아웃을 letterbox 로 늘리지 않고 화면 구조를 나눈다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import type { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { spacing } from '@/theme';
import type { CoverLayoutMode } from '@/utils/coverChapterViewModel';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

/**
 * @param mode 레이아웃 모드
 * @returns 화면 좌우 여백(pt)
 */
export function getCoverGutter(mode: CoverLayoutMode): number {
  return mode === 'phone' ? COVER_METRICS.phoneGutter : COVER_METRICS.tabletGutter;
}

export interface CoverChapterSplitLayoutProps {
  readonly mode: CoverLayoutMode;
  readonly header: ReactNode;
  /** 커버(다음 상담·입장) 영역 */
  readonly cover: ReactNode;
  /** 정보 시트(배너·알림·회기·목록) 영역 */
  readonly sheet: ReactNode;
  readonly refreshControl?: ReactElement<RefreshControlProps>;
}

export function CoverChapterSplitLayout({
  mode,
  header,
  cover,
  sheet,
  refreshControl,
}: CoverChapterSplitLayoutProps) {
  const gutter = getCoverGutter(mode);

  if (mode === 'tabletLandscape') {
    return (
      <View style={styles.root}>
        <View style={{ paddingHorizontal: gutter }}>{header}</View>
        <View style={[styles.split, { paddingHorizontal: gutter, paddingBottom: gutter }]}>
          <ScrollView
            style={styles.coverPane}
            contentContainerStyle={[styles.paneContent, { padding: gutter }]}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {cover}
          </ScrollView>
          <ScrollView
            style={styles.sheetPane}
            contentContainerStyle={[styles.paneContent, { padding: gutter }]}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {sheet}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={{ paddingHorizontal: gutter }}>{header}</View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.stackContent, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {cover}
        {sheet}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CLINIC_OS.cream,
  },
  scroll: {
    flex: 1,
  },
  stackContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  split: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: spacing.xl,
  },
  coverPane: {
    flex: COVER_METRICS.splitCoverFlex,
    backgroundColor: CLINIC_OS.tint,
  },
  sheetPane: {
    flex: COVER_METRICS.splitSheetFlex,
    backgroundColor: CLINIC_OS.sheet,
  },
  paneContent: {
    gap: COVER_METRICS.sectionGap,
  },
});
