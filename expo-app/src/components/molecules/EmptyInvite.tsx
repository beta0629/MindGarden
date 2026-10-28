/**
 * EmptyInvite — 회기 0 / 빈 예정 입구
 * 「회기 고르기」「결제하기」· 직접예약 CTA 없음.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MGButton } from '@/components/atoms/MGButton';
import { NextSheet } from '@/components/molecules/NextSheet';
import {
  EMPTY_INVITE_COPY,
  EMPTY_INVITE_ROUTES,
} from '@/components/molecules/emptyInviteActions';

export interface EmptyInviteProps {
  readonly title?: string;
  readonly datetime?: string;
  readonly meta?: string;
}

export function EmptyInvite({
  title = EMPTY_INVITE_COPY.TITLE,
  datetime = EMPTY_INVITE_COPY.DATETIME,
  meta = EMPTY_INVITE_COPY.META,
}: EmptyInviteProps) {
  const router = useRouter();

  return (
    <NextSheet
      zeroState
      title={title}
      datetime={datetime}
      meta={meta}
      accessibilityLabel="다음 한 장 회기0"
      cta={
        <View style={styles.ctaRow}>
          <MGButton
            label={EMPTY_INVITE_COPY.PRIMARY_CTA}
            variant="primary"
            onPress={() => router.push(EMPTY_INVITE_ROUTES.PRIMARY)}
            testID="empty-invite-pick-sessions"
          />
          <MGButton
            label={EMPTY_INVITE_COPY.GHOST_CTA}
            variant="ghost"
            onPress={() => router.push(EMPTY_INVITE_ROUTES.GHOST)}
            testID="empty-invite-pay"
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
