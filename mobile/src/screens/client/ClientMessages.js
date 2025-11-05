/**
 * 내담자 메시지 화면
 * 
 * 웹의 frontend/src/components/client/ClientMessageScreen.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { MessageCircle, Clock, AlertCircle, Send } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import StatCard from '../../components/StatCard';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPut } from '../../api/client';
import { MESSAGE_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
import { CLIENT_SCREENS } from '../../constants/navigation';
import { useNavigation } from '@react-navigation/native';

const ClientMessages = () => {
  const { user } = useSession();
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [importantCount, setImportantCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 메시지 데이터 로드
  const loadMessages = useCallback(async () => {
    if (!user?.id) {
      const { Platform } = require('react-native');
      if (Platform.OS === 'ios') {
        console.warn('⚠️ iOS - 메시지 로드: user.id가 없습니다.');
      }
      return;
    }

    try {
      setIsLoading(true);
      
      // iOS 디버깅: 세션 정보 확인
      const { Platform } = require('react-native');
      if (Platform.OS === 'ios') {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const sessionId = await AsyncStorage.getItem('sessionId');
        console.log('🍎 iOS - 메시지 로드 시도: userId=', user.id, ', sessionId=', sessionId);
      }
      
      const endpoint = MESSAGE_API.GET_MESSAGES_BY_CLIENT(user.id);
      const response = await apiGet(endpoint);

      // iOS 디버깅: 응답 확인
      if (Platform.OS === 'ios') {
        console.log('🍎 iOS - 메시지 응답:', response ? '성공' : '실패', response?.success, response?.data?.length || 0, '개');
      }

      if (response?.success && response?.data) {
        setMessages(response.data);
        setUnreadCount(response.data.filter((m) => !m.read).length);
        setImportantCount(response.data.filter((m) => m.important).length);
        setUrgentCount(response.data.filter((m) => m.urgent).length);
        
        // iOS 디버깅: 데이터 로드 성공
        if (Platform.OS === 'ios') {
          console.log('🍎 iOS - 메시지 데이터 로드 성공:', {
            total: response.data.length,
            unread: response.data.filter((m) => !m.read).length,
            important: response.data.filter((m) => m.important).length,
            urgent: response.data.filter((m) => m.urgent).length,
          });
        }
      } else {
        // iOS 디버깅: 데이터 없음
        if (Platform.OS === 'ios') {
          console.warn('⚠️ iOS - 메시지 데이터가 없습니다. response:', response);
        }
      }
    } catch (error) {
      const { Platform } = require('react-native');
      if (Platform.OS === 'ios') {
        console.error('🍎 iOS - 메시지 로드 실패:', {
          message: error?.message,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
        });
      } else {
        console.error('메시지 로드 실패:', error);
      }
      
      // 에러 상태는 빈 배열로 설정 (앱이 계속 동작하도록)
      setMessages([]);
      setUnreadCount(0);
      setImportantCount(0);
      setUrgentCount(0);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMessages();
  }, [loadMessages]);

  // 메시지 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return STRINGS.TIME.YESTERDAY;
    } else if (days < 7) {
      return `${days}${STRINGS.TIME.DAYS_AGO}`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CLIENT.MESSAGES_TITLE}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.CLIENT.MESSAGES_TITLE}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 통계 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<MessageCircle size={SIZES.ICON.MD} color={COLORS.primary} />}
            value={messages.length}
            label={STRINGS.MESSAGE.TITLE}
            style={styles.statCard}
          />
          <StatCard
            icon={<AlertCircle size={SIZES.ICON.MD} color={COLORS.error} />}
            value={unreadCount}
            label={STRINGS.MESSAGE.UNREAD}
            style={styles.statCard}
          />
          <StatCard
            icon={<AlertCircle size={SIZES.ICON.MD} color={COLORS.warning} />}
            value={importantCount}
            label={STRINGS.MESSAGE.IMPORTANT}
            style={styles.statCard}
          />
          <StatCard
            icon={<AlertCircle size={SIZES.ICON.MD} color={COLORS.error} />}
            value={urgentCount}
            label={STRINGS.MESSAGE.URGENT}
            style={styles.statCard}
          />
        </View>

        {/* 메시지 목록 */}
        <DashboardSection title={STRINGS.MESSAGE.TITLE} icon={<MessageCircle size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {messages.length > 0 ? (
            <View style={styles.messageList}>
              {messages.map((message, index) => (
                <TouchableOpacity
                  key={message.id || index}
                  style={[
                    styles.messageItem,
                    !message.read && styles.messageItemUnread,
                    message.urgent && styles.messageItemUrgent,
                  ]}
                  onPress={async () => {
                    // 읽지 않은 메시지인 경우 읽음 처리
                    if (!message.read) {
                      try {
                        await apiPut(MESSAGE_API.MARK_AS_READ(message.id));
                        // 로컬 상태 업데이트
                        setMessages(prev => prev.map(m => 
                          m.id === message.id ? { ...m, read: true, readAt: new Date().toISOString() } : m
                        ));
                        // 읽지 않은 메시지 수 업데이트
                        setUnreadCount(prev => Math.max(0, prev - 1));
                      } catch (error) {
                        console.error('읽음 처리 오류:', error);
                      }
                    }
                    navigation.navigate(CLIENT_SCREENS.MESSAGE_DETAIL, { messageId: message.id });
                  }}
                >
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageSender}>
                      {message.senderName || message.consultantName || STRINGS.GREETING.CONSULTANT_DEFAULT_NAME}
                    </Text>
                    <View style={styles.messageBadges}>
                      {message.urgent && (
                        <View style={[styles.badge, styles.badgeUrgent]}>
                          <Text style={styles.badgeText}>{STRINGS.MESSAGE.URGENT}</Text>
                        </View>
                      )}
                      {message.important && (
                        <View style={[styles.badge, styles.badgeImportant]}>
                          <Text style={styles.badgeText}>{STRINGS.MESSAGE.IMPORTANT}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.messageTitle} numberOfLines={2}>
                    {message.title || message.content}
                  </Text>
                  <View style={styles.messageFooter}>
                    <View style={styles.messageTimeRow}>
                      <Clock size={SIZES.ICON.SM} color={COLORS.gray500} />
                      <Text style={styles.messageTime}>{formatDate(message.createdAt)}</Text>
                    </View>
                    {!message.read && <View style={styles.unreadDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MessageCircle size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>{STRINGS.CLIENT.NO_MESSAGES}</Text>
            </View>
          )}
        </DashboardSection>
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
  statsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
  messageList: {
    gap: SPACING.sm,
  },
  messageItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  messageItemUnread: {
    borderLeftWidth: SIZES.BORDER_WIDTH.THICK,
    borderLeftColor: COLORS.primary,
  },
  messageItemUrgent: {
    borderLeftWidth: SIZES.BORDER_WIDTH.THICK,
    borderLeftColor: COLORS.error,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  messageSender: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    flex: 1,
  },
  messageBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeUrgent: {
    backgroundColor: COLORS.error,
  },
  badgeImportant: {
    backgroundColor: COLORS.warning,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  messageTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  messageTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  unreadDot: {
    width: SIZES.ICON.XS,
    height: SIZES.ICON.XS,
    borderRadius: SIZES.ICON.XS / 2,
    backgroundColor: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});

export default ClientMessages;

