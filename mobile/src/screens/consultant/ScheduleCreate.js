/**
 * 새 스케줄 생성 화면
 *
 * 웹의 frontend/src/components/schedule/UnifiedScheduleComponent.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Calendar, Clock, User, FileText } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost } from '../../api/client';
import { SCHEDULE_API, ADMIN_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ScheduleCreate = () => {
  const navigation = useNavigation();
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // 폼 데이터
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    clientId: '',
    consultationType: 'INDIVIDUAL',
    title: '',
    notes: '',
  });

  // 내담자 목록 조회
  const loadClients = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await apiGet(ADMIN_API.GET_CLIENTS_BY_CONSULTANT(user.id));

      if (response?.success && response?.data) {
        setClients(response.data);
      }
    } catch (error) {
      console.error('내담자 로드 실패:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // 폼 데이터 업데이트
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'clientId') {
      const client = clients.find(c => c.id === value);
      setSelectedClient(client);
    }
  };

  // 스케줄 생성
  const handleCreateSchedule = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.clientId) {
      Alert.alert(STRINGS.ERROR.ERROR, STRINGS.SCHEDULE.FILL_REQUIRED_FIELDS || '필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      const scheduleData = {
        consultantId: user.id,
        clientId: formData.clientId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        consultationType: formData.consultationType,
        title: formData.title || `${selectedClient?.name || '내담자'} 상담`,
        notes: formData.notes,
        status: 'SCHEDULED',
      };

      const response = await apiPost(SCHEDULE_API.SCHEDULE_CREATE, scheduleData);

      if (response?.success) {
        Alert.alert(
          STRINGS.SUCCESS.SUCCESS,
          STRINGS.SCHEDULE.SCHEDULE_CREATED || '스케줄이 생성되었습니다.',
          [
            {
              text: STRINGS.COMMON.CONFIRM,
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(STRINGS.ERROR.CREATE_FAILED || '스케줄 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('스케줄 생성 실패:', error);
      Alert.alert(STRINGS.ERROR.ERROR, STRINGS.ERROR.CREATE_FAILED || '스케줄 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 날짜 포맷 (YYYY-MM-DD)
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 현재 시간 포맷 (HH:MM)
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  // 1시간 후 시간
  const getEndTime = (startTime) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <SimpleLayout title={STRINGS.CONSULTANT.CREATE_SCHEDULE}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* 기본 정보 */}
        <DashboardSection title={STRINGS.CONSULTANT.BASIC_INFO} icon={<Calendar size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{STRINGS.SCHEDULE.DATE} *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={(value) => updateFormData('date', value)}
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          <View style={styles.timeRow}>
            <View style={[styles.formGroup, styles.timeInput]}>
              <Text style={styles.label}>{STRINGS.SCHEDULE.START_TIME} *</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={formData.startTime}
                onChangeText={(value) => {
                  updateFormData('startTime', value);
                  if (!formData.endTime) {
                    updateFormData('endTime', getEndTime(value));
                  }
                }}
                placeholderTextColor={COLORS.gray400}
              />
            </View>

            <View style={[styles.formGroup, styles.timeInput]}>
              <Text style={styles.label}>{STRINGS.SCHEDULE.END_TIME} *</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={formData.endTime}
                onChangeText={(value) => updateFormData('endTime', value)}
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>
        </DashboardSection>

        {/* 내담자 선택 */}
        <DashboardSection title={STRINGS.CONSULTANT.CLIENT_SELECTION} icon={<User size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.clientList}>
            {clients.length > 0 ? (
              clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[
                    styles.clientItem,
                    formData.clientId === client.id && styles.clientItemSelected,
                  ]}
                  onPress={() => updateFormData('clientId', client.id)}
                >
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.name || STRINGS.CONSULTANT.NO_INFO}</Text>
                    <Text style={styles.clientEmail}>{client.email || STRINGS.CONSULTANT.NO_INFO}</Text>
                  </View>
                  {formData.clientId === client.id && (
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <User size={SIZES.ICON['2XL']} color={COLORS.gray400} />
                <Text style={styles.emptyText}>{STRINGS.CONSULTANT.NO_CLIENTS}</Text>
              </View>
            )}
          </View>
        </DashboardSection>

        {/* 추가 정보 */}
        <DashboardSection title={STRINGS.CONSULTANT.ADDITIONAL_INFO} icon={<FileText size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{STRINGS.SCHEDULE.TITLE}</Text>
            <TextInput
              style={styles.input}
              placeholder={STRINGS.SCHEDULE.TITLE_PLACEHOLDER || '상담 제목을 입력하세요'}
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{STRINGS.SCHEDULE.NOTES}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={STRINGS.SCHEDULE.NOTES_PLACEHOLDER || '상담 내용을 간단히 적어주세요'}
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={COLORS.gray400}
            />
          </View>
        </DashboardSection>

        {/* 버튼 */}
        <View style={styles.buttonContainer}>
          <MGButton
            variant="secondary"
            size="medium"
            fullWidth
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            <View style={styles.buttonContent}>
              <ArrowLeft size={SIZES.ICON.MD} color={COLORS.primary} />
              <Text style={styles.buttonTextSecondary}>{STRINGS.COMMON.CANCEL}</Text>
            </View>
          </MGButton>

          <MGButton
            variant="primary"
            size="medium"
            fullWidth
            loading={isLoading}
            onPress={handleCreateSchedule}
            style={styles.button}
          >
            <View style={styles.buttonContent}>
              <Calendar size={SIZES.ICON.MD} color={COLORS.white} />
              <Text style={styles.buttonText}>{STRINGS.CONSULTANT.CREATE_SCHEDULE}</Text>
            </View>
          </MGButton>
        </View>
      </ScrollView>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 80,
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timeInput: {
    flex: 1,
  },
  clientList: {
    gap: SPACING.sm,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    borderColor: COLORS.border,
  },
  clientItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  clientEmail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  button: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  buttonTextSecondary: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

export default ScheduleCreate;

