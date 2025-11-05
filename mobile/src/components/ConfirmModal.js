/**
 * ConfirmModal 컴포넌트
 * 확인 모달 (Alert 대체)
 * 
 * 웹의 frontend/src/components/common/ConfirmModal.js를 참고
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import { STRINGS } from '../constants/strings';
import MGButton from './MGButton';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = STRINGS.COMMON.CONFIRM,
  message = STRINGS.COMMON.CONFIRM_DEFAULT_MESSAGE,
  confirmText = STRINGS.COMMON.CONFIRM,
  cancelText = STRINGS.COMMON.CANCEL,
  type = 'default', // default, danger, warning, success
}) => {
  if (!isOpen) return null;

  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <View style={styles.body}>
            <Text style={styles.message}>{message}</Text>
          </View>
          
          <View style={styles.footer}>
            <MGButton
              variant="outline"
              size="medium"
              onPress={onClose}
              style={styles.cancelButton}
            >
              {cancelText}
            </MGButton>
            <MGButton
              variant={getConfirmButtonVariant()}
              size="medium"
              onPress={() => {
                onConfirm();
                onClose();
              }}
              style={styles.confirmButton}
            >
              {confirmText}
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
    padding: SPACING.md,
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    width: '90%',
    maxWidth: 400, // TODO: SIZES에서 관리할지 확인 필요
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    textAlign: 'center',
  },
  body: {
    padding: SPACING.md,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});

export default ConfirmModal;

