/**
 * 휴가 등록 모달 컴포넌트
 * 
 * 웹의 frontend/src/components/consultant/VacationModal.js를 참고
 */

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Calendar, X, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import SIZES from '../constants/sizes';
import { STRINGS } from '../constants/strings';
import MGButton from './MGButton';
import UnifiedLoading from './UnifiedLoading';
import { apiPost, apiGet } from '../api/client';

const VacationModal = ({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
  consultantId,
}) => {
  const [vacationData, setVacationData] = useState({
    date: selectedDate || '',
    type: 'MORNING_HALF_DAY',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vacationTypeOptions, setVacationTypeOptions] = useState([]);

  // selectedDate가 변경될 때 vacationData의 날짜 업데이트
  useEffect(() => {
    if (selectedDate) {
      setVacationData(prev => ({
        ...prev,
        date: selectedDate,
      }));
    }
  }, [selectedDate]);

  // 휴가 유형 코드 로드
  useEffect(() => {
    const loadVacationTypeCodes = async () => {
      try {
        const response = await apiGet('/api/common-codes/VACATION_TYPE');
        console.log('휴가 유형 코드 응답:', response);
        
        // apiGet은 인터셉터에서 response.data를 반환하므로 response가 이미 배열
        const codes = Array.isArray(response) ? response : (response?.data || []);
        
        if (codes && codes.length > 0) {
          const allowedTypes = [
            'MORNING_HALF_DAY',
            'AFTERNOON_HALF_DAY',
            'MORNING_HALF_1',
            'MORNING_HALF_2',
            'AFTERNOON_HALF_1',
            'AFTERNOON_HALF_2',
            'ALL_DAY',
          ];
          
          const uniqueCodes = codes.filter(code => 
            allowedTypes.includes(code.codeValue)
          );
          
          const sortedCodes = uniqueCodes.sort((a, b) => {
            const order = allowedTypes.indexOf(a.codeValue) - allowedTypes.indexOf(b.codeValue);
            return order;
          });
          
          const options = sortedCodes.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            description: code.description,
          }));
          
          setVacationTypeOptions(options);
          
          // 기본값 설정
          if (options.length > 0 && !vacationData.type) {
            setVacationData(prev => ({ ...prev, type: options[0].value }));
          }
        }
      } catch (error) {
        console.error('휴가 유형 코드 로드 실패:', error);
        setVacationTypeOptions([]);
      }
    };
    
    if (isOpen) {
      loadVacationTypeCodes();
    }
  }, [isOpen]);

  const handleInputChange = (name, value) => {
    setVacationData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!vacationData.reason.trim()) {
      setError('휴가 사유를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestData = {
        consultantId: consultantId,
        date: vacationData.date,
        type: vacationData.type,
        reason: vacationData.reason.trim(),
      };

      console.log('🏖️ 휴가 등록 요청:', requestData);

      const response = await apiPost('/api/consultant/vacation', requestData);
      console.log('API 응답:', response);
      
      // apiPost는 인터셉터에서 response.data를 반환하므로 response가 이미 data임
      if (response?.success) {
        console.log('✅ 휴가 등록 성공:', response.data);
        onSuccess?.(response.data);
        handleClose();
      } else {
        setError(response?.message || '휴가 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('휴가 등록 오류:', err);
      setError(err?.message || '휴가 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setVacationData({
        date: selectedDate || '',
        type: 'MORNING_HALF_DAY',
        reason: '',
      });
      setError(null);
      onClose();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  if (!isOpen) return null;

  const vacationTypes = Object.values(VACATION_TYPES).map(type => ({
    value: type,
    label: VACATION_TYPE_LABELS[type],
  }));

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Calendar size={SIZES.ICON.LG} color={COLORS.primary} />
              <View>
                <Text style={styles.title}>휴가 등록</Text>
                {selectedDate && (
                  <Text style={styles.subtitle}>{formatDate(selectedDate)}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <X size={SIZES.ICON.MD} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>

          {/* 본문 */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

            {/* 휴가 유형 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                휴가 유형 <Text style={styles.required}>*</Text>
              </Text>
              {vacationTypeOptions.length > 0 ? (
                <View style={styles.pickerContainer}>
                  {vacationTypeOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        vacationData.type === option.value && styles.pickerOptionSelected,
                      ]}
                      onPress={() => handleInputChange('type', option.value)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          vacationData.type === option.value && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <UnifiedLoading size="small" text="휴가 유형 로딩 중..." />
              )}
            </View>

            {/* 휴가 사유 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                휴가 사유 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textarea}
                value={vacationData.reason}
                onChangeText={(value) => handleInputChange('reason', value)}
                placeholder="휴가 사유를 입력해주세요"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* 에러 메시지 */}
            {error && (
              <View style={styles.errorBox}>
                <AlertTriangle size={SIZES.ICON.SM} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* 푸터 */}
          <View style={styles.footer}>
            <MGButton
              variant="outline"
              size="medium"
              onPress={handleClose}
              disabled={loading}
              style={styles.cancelButton}
            >
              <View style={styles.buttonContent}>
                <X size={SIZES.ICON.SM} color={COLORS.mediumGray} />
                <Text style={styles.buttonText}>취소</Text>
              </View>
            </MGButton>
            <MGButton
              variant="primary"
              size="medium"
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
              loadingText="설정 중..."
              style={styles.submitButton}
            >
              <View style={styles.buttonContent}>
                <CheckCircle size={SIZES.ICON.SM} color={COLORS.white} />
                <Text style={styles.buttonTextPrimary}>휴가 등록</Text>
              </View>
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
    borderRadius: BORDER_RADIUS.xl,
    width: '90%',
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  body: {
    padding: SPACING.md,
  },
  infoBox: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.mediumGray,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.dark,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  pickerContainer: {
    gap: SPACING.xs,
  },
  pickerOption: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  pickerOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  pickerOptionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
  },
  pickerOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  textarea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    minHeight: 80,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.errorLight,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    flex: 1,
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
  submitButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.mediumGray,
  },
  buttonTextPrimary: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.white,
  },
});

export default VacationModal;

