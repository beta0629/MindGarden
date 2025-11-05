/**
 * 알림 설정 화면
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Bell, MessageSquare, Calendar, CreditCard, Settings, Volume2, Vibrate } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import notificationService from '../../services/NotificationService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    messageNotifications: true,
    scheduleNotifications: true,
    paymentNotifications: true,
    systemNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  // 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await notificationService.getNotificationSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('알림 설정 로드 실패:', error);
    }
  };

  // 설정 토글
  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 설정 저장
  const saveSettings = async () => {
    try {
      setIsLoading(true);
      await notificationService.saveNotificationSettings(settings);
      Alert.alert(
        STRINGS.SUCCESS.SUCCESS,
        STRINGS.NOTIFICATION.SETTINGS_SAVED || '알림 설정이 저장되었습니다.'
      );
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      Alert.alert(
        STRINGS.ERROR.ERROR,
        STRINGS.ERROR.SAVE_FAILED || '설정 저장에 실패했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 알림 전송
  const sendTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Alert.alert(
        STRINGS.SUCCESS.SUCCESS,
        STRINGS.NOTIFICATION.TEST_SENT || '테스트 알림이 전송되었습니다.'
      );
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      Alert.alert(
        STRINGS.ERROR.ERROR,
        STRINGS.NOTIFICATION.TEST_FAILED || '테스트 알림 전송에 실패했습니다.'
      );
    }
  };

  const notificationTypes = [
    {
      key: 'messageNotifications',
      title: STRINGS.NOTIFICATION.MESSAGE_NOTIFICATIONS || '메시지 알림',
      description: STRINGS.NOTIFICATION.MESSAGE_DESC || '새 메시지가 도착했을 때 알림을 받습니다.',
      icon: <MessageSquare size={SIZES.ICON.MD} color={COLORS.primary} />,
    },
    {
      key: 'scheduleNotifications',
      title: STRINGS.NOTIFICATION.SCHEDULE_NOTIFICATIONS || '일정 알림',
      description: STRINGS.NOTIFICATION.SCHEDULE_DESC || '상담 일정이 변경되거나 예정되었을 때 알림을 받습니다.',
      icon: <Calendar size={SIZES.ICON.MD} color={COLORS.info} />,
    },
    {
      key: 'paymentNotifications',
      title: STRINGS.NOTIFICATION.PAYMENT_NOTIFICATIONS || '결제 알림',
      description: STRINGS.NOTIFICATION.PAYMENT_DESC || '결제 관련 알림을 받습니다.',
      icon: <CreditCard size={SIZES.ICON.MD} color={COLORS.success} />,
    },
    {
      key: 'systemNotifications',
      title: STRINGS.NOTIFICATION.SYSTEM_NOTIFICATIONS || '시스템 알림',
      description: STRINGS.NOTIFICATION.SYSTEM_DESC || '시스템 공지 및 중요 알림을 받습니다.',
      icon: <Settings size={SIZES.ICON.MD} color={COLORS.warning} />,
    },
  ];

  const soundSettings = [
    {
      key: 'soundEnabled',
      title: STRINGS.NOTIFICATION.SOUND || '알림음',
      description: STRINGS.NOTIFICATION.SOUND_DESC || '알림 시 소리를 재생합니다.',
      icon: <Volume2 size={SIZES.ICON.MD} color={COLORS.primary} />,
    },
    {
      key: 'vibrationEnabled',
      title: STRINGS.NOTIFICATION.VIBRATION || '진동',
      description: STRINGS.NOTIFICATION.VIBRATION_DESC || '알림 시 기기를 진동시킵니다.',
      icon: <Vibrate size={SIZES.ICON.MD} color={COLORS.primary} />,
    },
  ];

  return (
    <SimpleLayout title={STRINGS.NOTIFICATION.SETTINGS_TITLE || '알림 설정'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* 알림 유형 설정 */}
        <DashboardSection title={STRINGS.NOTIFICATION.NOTIFICATION_TYPES || '알림 유형'} icon={<Bell size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.settingsList}>
            {notificationTypes.map((type) => (
              <View key={type.key} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingHeader}>
                    {type.icon}
                    <Text style={styles.settingTitle}>{type.title}</Text>
                  </View>
                  <Text style={styles.settingDescription}>{type.description}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    settings[type.key] && styles.toggleButtonActive,
                  ]}
                  onPress={() => toggleSetting(type.key)}
                >
                  <View style={[
                    styles.toggleIndicator,
                    settings[type.key] && styles.toggleIndicatorActive,
                  ]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </DashboardSection>

        {/* 소리 및 진동 설정 */}
        <DashboardSection title={STRINGS.NOTIFICATION.SOUND_VIBRATION || '소리 및 진동'} icon={<Volume2 size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.settingsList}>
            {soundSettings.map((setting) => (
              <View key={setting.key} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingHeader}>
                    {setting.icon}
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                  </View>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    settings[setting.key] && styles.toggleButtonActive,
                  ]}
                  onPress={() => toggleSetting(setting.key)}
                >
                  <View style={[
                    styles.toggleIndicator,
                    settings[setting.key] && styles.toggleIndicatorActive,
                  ]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </DashboardSection>

        {/* 테스트 알림 */}
        <DashboardSection title={STRINGS.NOTIFICATION.TEST_NOTIFICATIONS || '테스트'} icon={<Bell size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.testSection}>
            <Text style={styles.testDescription}>
              {STRINGS.NOTIFICATION.TEST_DESC || '알림 설정이 제대로 작동하는지 확인하려면 테스트 알림을 전송하세요.'}
            </Text>
            <MGButton
              variant="secondary"
              size="medium"
              fullWidth
              onPress={sendTestNotification}
              style={styles.testButton}
            >
              <View style={styles.testButtonContent}>
                <Bell size={SIZES.ICON.MD} color={COLORS.primary} />
                <Text style={styles.testButtonText}>
                  {STRINGS.NOTIFICATION.SEND_TEST || '테스트 알림 전송'}
                </Text>
              </View>
            </MGButton>
          </View>
        </DashboardSection>

        {/* 저장 버튼 */}
        <View style={styles.saveSection}>
          <MGButton
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            onPress={saveSettings}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>
              {STRINGS.NOTIFICATION.SAVE_SETTINGS || '설정 저장'}
            </Text>
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
  settingsList: {
    gap: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gray300,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },
  testSection: {
    gap: SPACING.md,
  },
  testDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
  testButton: {
    marginTop: SPACING.sm,
  },
  testButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  testButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  saveSection: {
    marginTop: SPACING.lg,
  },
  saveButton: {
    marginBottom: 0,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default NotificationSettings;
