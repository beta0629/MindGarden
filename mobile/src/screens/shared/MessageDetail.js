/**
 * 메시지 상세 화면 (Client, Consultant 공통)
 * 
 * 웹의 frontend/src/components/client/ClientMessageScreen.js를 참고
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { X, Clock, AlertCircle, Star, Send, MessageCircle } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPut, apiPost } from '../../api/client';
import { MESSAGE_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const MessageDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useSession();
  const { messageId } = route.params || {};

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // 메시지 상세 조회
  const loadMessage = async () => {
    if (!messageId) return;

    try {
      setIsLoading(true);
      
      // 메시지 상세 조회 (자동 읽음 처리)
      const response = await apiGet(MESSAGE_API.GET_MESSAGE_DETAIL(messageId));
      
      if (response?.success && response?.data) {
        setMessage(response.data);
      } else {
        throw new Error(STRINGS.ERROR.LOAD_FAILED || '메시지를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('메시지 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessage();
  }, [messageId]);

  // 답장 전송
  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      return;
    }

    if (!message) return;

    try {
      setIsSending(true);
      
      const replyData = {
        title: `${STRINGS.MESSAGE.REPLY_PREFIX || 'Re:'} ${message.title}`,
        content: replyContent.trim(),
        messageType: 'GENERAL',
        isImportant: false,
        isUrgent: false,
      };

      const response = await apiPost(MESSAGE_API.SEND_REPLY(message.id), replyData);
      
      if (response?.success) {
        setReplyContent('');
        navigation.goBack();
      } else {
        throw new Error(STRINGS.ERROR.SEND_FAILED || '답장 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('답장 전송 실패:', error);
    } finally {
      setIsSending(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return STRINGS.TIME.TODAY;
    } else if (diffDays === 1) {
      return STRINGS.TIME.YESTERDAY;
    } else if (diffDays < 7) {
      return `${diffDays}${STRINGS.TIME.DAYS_AGO}`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.MESSAGE.TITLE}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  if (!message) {
    return (
      <SimpleLayout title={STRINGS.MESSAGE.TITLE}>
        <View style={styles.emptyState}>
          <MessageCircle size={SIZES.ICON['2XL']} color={COLORS.gray400} />
          <Text style={styles.emptyText}>{STRINGS.ERROR.NOT_FOUND || '메시지를 찾을 수 없습니다.'}</Text>
        </View>
      </SimpleLayout>
    );
  }

  const senderName = message.senderName || message.consultantName || message.clientName || STRINGS.GREETING.CONSULTANT_DEFAULT_NAME;
  const isFromConsultant = message.messageSource === 'CONSULTANT' || !message.clientId;
  const displayName = isFromConsultant 
    ? (message.consultantName || STRINGS.GREETING.CONSULTANT_DEFAULT_NAME)
    : (message.clientName || STRINGS.GREETING.CLIENT_DEFAULT_NAME);

  return (
    <SimpleLayout title={STRINGS.MESSAGE.DETAIL_TITLE || '메시지 상세'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{message.title}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <X size={SIZES.ICON.MD} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.meta}>
            <View style={styles.metaRow}>
              <Text style={styles.sender}>{STRINGS.MESSAGE.FROM}: {displayName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Clock size={SIZES.ICON.SM} color={COLORS.gray500} />
              <Text style={styles.date}>{formatDate(message.sentAt || message.createdAt)}</Text>
            </View>
            {(message.important || message.isImportant) && (
              <View style={styles.badge}>
                <Star size={SIZES.ICON.SM} color={COLORS.warning} />
                <Text style={styles.badgeText}>{STRINGS.MESSAGE.IMPORTANT}</Text>
              </View>
            )}
            {(message.urgent || message.isUrgent) && (
              <View style={[styles.badge, styles.badgeUrgent]}>
                <AlertCircle size={SIZES.ICON.SM} color={COLORS.error} />
                <Text style={styles.badgeText}>{STRINGS.MESSAGE.URGENT}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 내용 */}
        <View style={styles.contentSection}>
          <Text style={styles.content} selectable>{message.content}</Text>
        </View>

        {/* 답장 섹션 (상담사에게만 답장 가능) */}
        {isFromConsultant && (
          <View style={styles.replySection}>
            <Text style={styles.replyTitle}>{STRINGS.MESSAGE.REPLY || '답장'}</Text>
            <TextInput
              style={styles.replyInput}
              placeholder={STRINGS.MESSAGE.REPLY_PLACEHOLDER || '답장 내용을 입력하세요...'}
              placeholderTextColor={COLORS.gray400}
              multiline
              numberOfLines={4}
              value={replyContent}
              onChangeText={setReplyContent}
              textAlignVertical="top"
            />
            <MGButton
              variant="primary"
              size="medium"
              fullWidth
              loading={isSending}
              onPress={handleSendReply}
              style={styles.sendButton}
            >
              <View style={styles.sendButtonContent}>
                <Send size={SIZES.ICON.MD} color={COLORS.white} />
                <Text style={styles.sendButtonText}>{STRINGS.COMMON.SEND || '전송'}</Text>
              </View>
            </MGButton>
          </View>
        )}
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
  header: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginRight: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  meta: {
    gap: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sender: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  date: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  badgeUrgent: {
    backgroundColor: COLORS.errorLight,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  contentSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  content: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    lineHeight: (TYPOGRAPHY.lineHeight?.relaxed || 1.75) * TYPOGRAPHY.fontSize.base,
  },
  replySection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  replyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  replyInput: {
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    minHeight: SIZES.INPUT_HEIGHT.LG * 2, // 2줄 높이 (112)
    marginBottom: SPACING.md,
  },
  sendButton: {
    marginTop: SPACING.sm,
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginTop: SPACING.md,
  },
});

export default MessageDetail;

