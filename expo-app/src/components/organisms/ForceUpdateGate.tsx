/**
 * 강제 업데이트 전면 게이트 — updateRequired && forceUpdate 시 닫기·뒤로가기 불가
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useEffect } from 'react';
import { BackHandler, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { FORCE_UPDATE_COPY } from '@/constants/forceUpdateCopy';
import { useForceUpdateCheck } from '@/hooks/useForceUpdateCheck';
import { useTheme } from '@/theme';

type ForceUpdateGateProps = {
  readonly enabled: boolean;
  readonly children: React.ReactNode;
};

export function ForceUpdateGate({ enabled, children }: ForceUpdateGateProps) {
  const theme = useTheme();
  const { loading, data } = useForceUpdateCheck(enabled);

  const blocking = Boolean(data?.updateRequired && data?.forceUpdate);
  const storeUrl = data?.storeUrl?.trim() ?? '';

  useEffect(() => {
    if (!blocking) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [blocking]);

  const handleUpdate = () => {
    if (!storeUrl) {
      return;
    }
    void Linking.openURL(storeUrl);
  };

  if (!enabled || loading || !blocking) {
    return <>{children}</>;
  }

  const message = data?.message?.trim() || FORCE_UPDATE_COPY.defaultMessage;
  const currentVersion = data?.currentVersion?.trim() || '-';
  const minVersion = data?.minVersion?.trim() || '-';

  return (
    <>
      {children}
      <UnifiedModal
        isOpen
        onClose={() => {
          /* 강제 업데이트 — 닫기 불가 */
        }}
        title={FORCE_UPDATE_COPY.modalTitle}
        subtitle={message}
        backdropClick={false}
        showCloseButton={false}
        actions={[
          {
            label: FORCE_UPDATE_COPY.updateButton,
            onPress: handleUpdate,
            variant: 'primary',
            disabled: !storeUrl,
          },
        ]}
      >
        <View style={styles.body}>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              textAlign: 'center',
            }}
          >
            {FORCE_UPDATE_COPY.versionLine(currentVersion, minVersion)}
          </Text>
          {Platform.OS === 'android' && data?.minVersionCode != null ? (
            <Text
              style={{
                color: theme.colors.textTertiary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                textAlign: 'center',
                marginTop: theme.spacing.xs,
              }}
            >
              {`빌드 번호 ${data.minVersionCode} 이상 필요`}
            </Text>
          ) : null}
        </View>
      </UnifiedModal>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingVertical: 8,
  },
});
