/**
 * 매칭 결제 확인 — 웹 MappingPaymentModal 축소 패리티
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  getAdminMappingSettlementErrorMessage,
  useConfirmMappingPayment,
} from '@/api/hooks/useAdminMappingSettlement';
import { useAdminMappingPaymentMethodCodes } from '@/api/hooks/useAdminMappingPickers';
import {
  ADMIN_MAPPING_COPY,
  ADMIN_MAPPING_DEFAULTS,
} from '@/constants/adminMappingCopy';
import { generateMappingPaymentReference } from '@/utils/adminMappingCreateBody';
import type { AdminMappingSettlementTarget } from '@/utils/adminMappingSettlement';
import { toDisplayString } from '@/utils/safeDisplay';

export type AdminMappingPaymentConfirmModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly mapping: AdminMappingSettlementTarget | null;
  readonly onSuccess?: (mappingId: number) => void;
};

export function AdminMappingPaymentConfirmModal({
  isOpen,
  onClose,
  mapping,
  onSuccess,
}: AdminMappingPaymentConfirmModalProps) {
  const theme = useTheme();
  const paymentMethodsQuery = useAdminMappingPaymentMethodCodes({ enabled: isOpen });
  const confirmMutation = useConfirmMappingPayment();

  const paymentMethods = paymentMethodsQuery.data ?? [];
  const [paymentMethod, setPaymentMethod] = useState(ADMIN_MAPPING_DEFAULTS.PAYMENT_METHOD);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    if (!isOpen || mapping == null) {
      return;
    }
    const method =
      mapping.paymentMethod.trim() !== ''
        ? mapping.paymentMethod
        : ADMIN_MAPPING_DEFAULTS.PAYMENT_METHOD;
    setPaymentMethod(method);
    setPaymentReference(generateMappingPaymentReference(method));
    const price =
      mapping.packagePrice > 0 ? mapping.packagePrice : ADMIN_MAPPING_DEFAULTS.PACKAGE_PRICE;
    setPaymentAmount(String(price));
  }, [isOpen, mapping]);

  const handleMethodChange = useCallback((method: string) => {
    setPaymentMethod(method);
    setPaymentReference(generateMappingPaymentReference(method));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (mapping == null) {
      return;
    }
    const amount = parseInt(paymentAmount, 10);
    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert(ADMIN_MAPPING_COPY.ERROR_TITLE, ADMIN_MAPPING_COPY.VALIDATION_PAYMENT);
      return;
    }
    const reference =
      paymentMethod === 'CASH' ? null : paymentReference.trim() || null;
    try {
      await confirmMutation.mutateAsync({
        mappingId: mapping.id,
        paymentMethod,
        paymentReference: reference,
        paymentAmount: amount,
      });
      Alert.alert(ADMIN_MAPPING_COPY.SUCCESS_TITLE, ADMIN_MAPPING_COPY.CONFIRM_PAYMENT_SUCCESS);
      onSuccess?.(mapping.id);
      onClose();
    } catch (err) {
      Alert.alert(
        ADMIN_MAPPING_COPY.ERROR_TITLE,
        getAdminMappingSettlementErrorMessage(err, ADMIN_MAPPING_COPY.CONFIRM_PAYMENT_FAILED),
      );
    }
  }, [
    confirmMutation,
    mapping,
    onClose,
    onSuccess,
    paymentAmount,
    paymentMethod,
    paymentReference,
  ]);

  const loading = confirmMutation.isPending;
  const isCash = paymentMethod === 'CASH';

  return (
    <UnifiedModal
      isOpen={isOpen && mapping != null}
      onClose={onClose}
      title={ADMIN_MAPPING_COPY.PAYMENT_MODAL_TITLE}
      loading={loading}
      actions={[
        { label: ADMIN_MAPPING_COPY.CANCEL, onPress: onClose, variant: 'secondary' },
        {
          label: ADMIN_MAPPING_COPY.PAYMENT_MODAL_SUBMIT,
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
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            }}
          >
            {toDisplayString(mapping.packageName, '패키지')}
          </Text>

          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            }}
          >
            {ADMIN_MAPPING_COPY.LABEL_PAYMENT_METHOD}
          </Text>
          <View style={styles.chipWrap}>
            {(paymentMethods.length > 0
              ? paymentMethods
              : [{ value: paymentMethod, label: paymentMethod }]
            ).map((m) => (
              <Pressable
                key={m.value}
                onPress={() => handleMethodChange(m.value)}
                style={[
                  styles.chip,
                  {
                    borderColor:
                      paymentMethod === m.value ? theme.colors.primary : theme.colors.divider,
                    backgroundColor:
                      paymentMethod === m.value ? theme.colors.gray[100] : theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      paymentMethod === m.value
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {!isCash ? (
            <>
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
                value={paymentReference}
                onChangeText={setPaymentReference}
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
            </>
          ) : null}

          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            }}
          >
            {ADMIN_MAPPING_COPY.LABEL_PRICE}
          </Text>
          <TextInput
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            keyboardType="number-pad"
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    minHeight: ADMIN_MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: ADMIN_MIN_TOUCH_TARGET,
    paddingVertical: 10,
    fontSize: 15,
  },
});
