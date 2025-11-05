/**
 * 상담사 필터 컴포넌트 (Presentational)
 * 
 * 관리자가 여러 상담사의 스케줄을 필터링할 수 있는 드롭다운
 * 순수 UI 컴포넌트 - 로직 없음
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, ChevronDown } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import SIZES from '../../../constants/sizes';

const ConsultantFilter = ({
  consultants = [],
  selectedConsultantId = '',
  onConsultantChange,
  loading = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Users size={SIZES.ICON.SM} color={COLORS.primary} />
        <Text style={styles.label}>상담사 필터</Text>
      </View>
      
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedConsultantId}
          onValueChange={onConsultantChange}
          style={styles.picker}
          enabled={!loading}
        >
          <Picker.Item 
            label="전체 상담사" 
            value="" 
            color={selectedConsultantId === '' ? COLORS.primary : COLORS.dark}
          />
          {consultants.map((consultant) => (
            <Picker.Item
              key={consultant.id}
              label={consultant.name || `상담사 ${consultant.id}`}
              value={consultant.id.toString()}
              color={selectedConsultantId === consultant.id.toString() ? COLORS.primary : COLORS.dark}
            />
          ))}
        </Picker>
        {loading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>로딩 중...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
    marginBottom: SPACING.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    fontWeight: '600',
  },
  pickerContainer: {
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  picker: {
    height: SIZES.INPUT_HEIGHT.MD,
    width: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlayWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mediumGray,
  },
});

export default ConsultantFilter;

