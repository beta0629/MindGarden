import React from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MGButton from '../MGButton';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { STRINGS } from '../../constants/strings';

const DuplicateLoginModal = ({
  visible,
  message,
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{STRINGS.AUTH.DUPLICATE_LOGIN}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.message}>
              {message || STRINGS.AUTH.DUPLICATE_LOGIN_MESSAGE}
            </Text>

            <Text style={styles.info}>{STRINGS.AUTH.DUPLICATE_LOGIN_INFO}</Text>

            {isProcessing && (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>
                  {STRINGS.AUTH.DUPLICATE_LOGIN_PROCESSING}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <MGButton
              variant="outline"
              size="medium"
              onPress={onCancel}
              disabled={isProcessing}
              style={styles.button}
            >
              {STRINGS.AUTH.DUPLICATE_LOGIN_CANCEL}
            </MGButton>
            <MGButton
              variant="primary"
              size="medium"
              onPress={onConfirm}
              loading={isProcessing}
              style={styles.button}
            >
              {STRINGS.AUTH.DUPLICATE_LOGIN_CONFIRM}
            </MGButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
    textAlign: 'center',
  },
  info: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
  },
  loadingWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
  },
});

export default DuplicateLoginModal;


