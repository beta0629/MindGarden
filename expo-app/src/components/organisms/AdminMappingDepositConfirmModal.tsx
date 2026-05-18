/**
 * 매칭 입금 확인 — 웹 MappingDepositModal 축소 패리티
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  getAdminMappingSettlementErrorMessage,
  useConfirmMappingDeposit,
} from '@/api/hooks/useAdminMappingSettlement';
import { ADMIN_MAPPING_COPY } from '@/constants/adminMappingCopy';
import {
  generateMappingDepositReference,
  type AdminMappingSettlementTarget,
} from '@/utils/adminMappingSettlement';
import { toDisplayString } from '@/utils/safeDisplay';

export type AdminMappingDepositConfirmModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly mapping: AdminMappingSettlementTarget | null;
  readonly onSuccess?: (mappingId: number) => void;
};

export function AdminMappingDepositConfirmModal({
  isOpen,
  onClose,
  mapping,
  onSuccess,
}: AdminMappingDepositConfirmModalProps) {
  const theme = useTheme();
  const confirmMutation = useConfirmMappingDeposit();
  const [depositReference, setDepositReference] = useState('');

  useEffect(() => {
    if (isOpen && mapping != null) {
      setDepositReference(generateMappingDepositReference());
    }
  }, [isOpen, mapping]);

  const handleSubmit = useCallback(async () => {
    if (mapping == null) {
      return;
    }
    const ref = depositReference.trim();
    if (!ref) {
      Alert.alert(ADMIN_MAPPING_COPY.ERROR_TITLE, ADMIN_MAPPING_COPY.VALIDATION_PAYMENT);
      return;
    }
    try {
      await confirmMutation.mutateAsync({
        mappingId: mapping.id,
        depositReference: ref,
      });
      Alert.alert(ADMIN_MAPPING_COPY.SUCCESS_TITLE, ADMIN_MAPPING_COPY.CONFIRM_DEPOSIT_SUCCESS);
      onSuccess?.(mapping.id);
      onClose();
    } catch (err) {
      Alert.alert(
        ADMIN_MAPPING_COPY.ERROR_TITLE,
        getAdminMappingSettlementErrorMessage(err, ADMIN_MAPPING_COPY.CONFIRM_DEPOSIT_FAILED),
      );
    }
  }, [confirmMutation, depositReference, mapping, onClose, onSuccess]);

  const loading = confirmMutation.isPending;

  return (
    <UnifiedModal
      isOpen={isOpen && mapping != null}
      onClose={onClose}
      title={ADMIN_MAPPING_COPY.DEPOSIT_MODAL_TITLE}
      loading={loading}
      actions={[
        { label: ADMIN_MAPPING_COPY.CANCEL, onPress: onClose, variant: 'secondary' },
        {
          label: ADMIN_MAPPING_COPY.DEPOSIT_MODAL_SUBMIT,
          onPress: () => void handleSubmit(),
          variant: 'primary',
          disabled: loading,
        },
      ]}
    >
      {mapping != null ? (
        <View style={{ gap: theme.spacing.md }}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            }}
          >
            {toDisplayString(mapping.consultantName, '상담사')} →{' '}
            {toDisplayString(mapping.clientName, '내담자')}
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            }}
          >
            {ADMIN_MAPPING_COPY.LABEL_PAYMENT_REF}
          </Text>
          <TextInput
            value={depositReference}
            onChangeText={setDepositReference}
            editable={!loading}
            style={[
              styles.input,
              {
                borderColor: theme.colors.divider,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          />
        </View>
      ) : null}
    </UnifiedModal>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
});
