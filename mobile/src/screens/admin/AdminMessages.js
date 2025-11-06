/**
 * 관리자 메시지 관리 화면
 * 모든 상담사-내담자 메시지를 조회하고 관리할 수 있는 화면
 * 
 * 웹의 frontend/src/components/admin/AdminMessages.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { MessageSquare, Search, Filter, Users, User, X } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiGet } from '../../api/client';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
import { ADMIN_SCREENS } from '../../constants/navigation';

const AdminMessages = () => {
  const { user } = useSession();
  const { unreadCount } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  
  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50; // 한 번에 가져올 메시지 개수

  // 메시지 유형 옵션
  const MESSAGE_TYPES = {
    ALL: { label: '전체', color: COLORS.gray500 },
    GENERAL: { label: '일반', color: COLORS.info || COLORS.primary },
    FOLLOW_UP: { label: '후속 조치', color: COLORS.primary },
    HOMEWORK: { label: '과제 안내', color: COLORS.success || COLORS.green },
    REMINDER: { label: '알림', color: COLORS.warning || COLORS.orange },
    URGENT: { label: '긴급', color: COLORS.danger || COLORS.error || '#FF4444' }
  };

  // 전체 메시지 데이터 (한 번만 로드)
  const [allMessages, setAllMessages] = useState([]);
  
  // 메시지 로드 (클라이언트 사이드 페이지네이션)
  const loadMessages = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      if (__DEV__) {
        console.log('📨 관리자 메시지 목록 로드', { page: pageNum, size: PAGE_SIZE, append });
      }
      
      // 초기 로드 시에만 전체 메시지 가져오기
      if (!append && allMessages.length === 0) {
        // 관리자는 모든 메시지 조회 (백엔드가 페이지네이션 미지원)
        const response = await apiGet('/api/consultation-messages/all');
        
        if (__DEV__) {
          console.log('📨 API 응답:', { 
            success: response?.success, 
            dataLength: response?.data?.length || 0
          });
        }
        
        if (response?.success) {
          const fetchedMessages = response.data || [];
          // 최신순 정렬 (createdAt 기준)
          const sortedMessages = [...fetchedMessages].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA; // 내림차순
          });
          
          setAllMessages(sortedMessages);
          
          // 첫 페이지만 표시
          const firstPageMessages = sortedMessages.slice(0, PAGE_SIZE);
          setMessages(firstPageMessages);
          setHasMore(sortedMessages.length > PAGE_SIZE);
          
          if (__DEV__) {
            console.log('📊 초기 로드 완료:', {
              total: sortedMessages.length,
              displayed: firstPageMessages.length,
              hasMore: sortedMessages.length > PAGE_SIZE
            });
          }
        } else {
          if (__DEV__) {
            console.error('❌ 메시지 목록 로드 실패:', response?.message);
          }
          Alert.alert('오류', response?.message || '메시지 목록을 불러오는데 실패했습니다.');
        }
      } else if (append && allMessages.length > 0) {
        // 추가 로드: 클라이언트 사이드에서 다음 페이지 가져오기
        const startIndex = pageNum * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const nextPageMessages = allMessages.slice(startIndex, endIndex);
        
        if (__DEV__) {
          console.log('📊 추가 로드 계산:', {
            pageNum,
            startIndex,
            endIndex,
            allMessagesCount: allMessages.length,
            nextPageMessagesCount: nextPageMessages.length
          });
        }
        
        if (nextPageMessages.length > 0) {
          setMessages(prev => {
            const updated = [...prev, ...nextPageMessages];
            const hasMoreData = endIndex < allMessages.length;
            setHasMore(hasMoreData);
            
            if (__DEV__) {
              console.log('📊 추가 로드 완료:', {
                prevCount: prev.length,
                newCount: nextPageMessages.length,
                updatedCount: updated.length,
                total: allMessages.length,
                hasMore: hasMoreData
              });
            }
            
            return updated;
          });
        } else {
          setHasMore(false);
          if (__DEV__) {
            console.log('📊 더 이상 로드할 메시지 없음');
          }
        }
      } else if (append && allMessages.length === 0) {
        if (__DEV__) {
          console.warn('⚠️ 추가 로드 시도했지만 allMessages가 비어있음');
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ 메시지 로드 중 오류:', error);
      if (!append) {
        Alert.alert('오류', '메시지를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [allMessages.length, PAGE_SIZE]);

  // 데이터 로드
  useEffect(() => {
    if (user?.id) {
      setPage(0);
      setHasMore(true);
      setAllMessages([]); // 전체 메시지 초기화
      loadMessages(0, false);
    }
  }, [user?.id]);

  // 새로고침
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    setAllMessages([]); // 전체 메시지 초기화하여 다시 로드
    loadMessages(0, false);
  }, [loadMessages]);

  // 더 많은 메시지 로드 (무한 스크롤)
  const loadMoreMessages = useCallback(() => {
    if (!loadingMore && hasMore && allMessages.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      
      if (__DEV__) {
        console.log('📜 더 많은 메시지 로드 시도:', {
          currentPage: page,
          nextPage,
          allMessagesCount: allMessages.length,
          currentMessagesCount: messages.length,
          hasMore
        });
      }
      
      loadMessages(nextPage, true);
    } else {
      if (__DEV__) {
        console.log('📜 더 많은 메시지 로드 스킵:', {
          loadingMore,
          hasMore,
          allMessagesCount: allMessages.length
        });
      }
    }
  }, [page, loadingMore, hasMore, allMessages.length, messages.length, loadMessages]);

  // 메시지 필터링
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.receiverName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'ALL' || message.messageType === filterType;
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'UNREAD' && !message.isRead) ||
                         (filterStatus === 'READ' && message.isRead);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // 메시지 상세 보기
  const handleMessageClick = async (message) => {
    try {
      // 상세 조회 API 호출 (자동 읽음 처리)
      const response = await apiGet(`/api/consultation-messages/${message.id}`);
      
      if (__DEV__) {
        console.log('📨 메시지 상세 API 응답:', response);
      }
      
      if (response?.success) {
        const detailData = response.data;
        // API 응답 데이터 구조 확인 및 정규화
        const normalizedMessage = {
          ...detailData,
          // 다양한 필드명 지원
          senderName: detailData.senderName || detailData.sender?.name || detailData.consultantName || detailData.consultant?.name || '알 수 없음',
          receiverName: detailData.receiverName || detailData.receiver?.name || detailData.clientName || detailData.client?.name || '알 수 없음',
          content: detailData.content || detailData.message || detailData.body || '',
        };
        
        if (__DEV__) {
          console.log('📨 정규화된 메시지 데이터:', normalizedMessage);
        }
        
        setSelectedMessage(normalizedMessage);
      } else {
        // 실패 시 기존 데이터 사용 (정규화 포함)
        const normalizedMessage = {
          ...message,
          senderName: message.senderName || message.sender?.name || message.consultantName || '알 수 없음',
          receiverName: message.receiverName || message.receiver?.name || message.clientName || '알 수 없음',
          content: message.content || message.message || message.body || '',
        };
        setSelectedMessage(normalizedMessage);
      }
    } catch (error) {
      console.error('❌ 메시지 상세 조회 오류:', error);
      // 오류 시 기존 데이터 사용 (정규화 포함)
      const normalizedMessage = {
        ...message,
        senderName: message.senderName || message.sender?.name || message.consultantName || '알 수 없음',
        receiverName: message.receiverName || message.receiver?.name || message.clientName || '알 수 없음',
        content: message.content || message.message || message.body || '',
      };
      setSelectedMessage(normalizedMessage);
    }
  };

  // 모달 닫기
  const closeModal = async () => {
    setSelectedMessage(null);
    // 목록 새로고침 (읽음 상태 반영) - 전체 메시지 다시 로드
    setPage(0);
    setHasMore(true);
    setAllMessages([]); // 전체 메시지 초기화하여 다시 로드
    await loadMessages(0, false);
  };

  // 메시지 유형별 색상
  const getMessageTypeColor = (type) => {
    return MESSAGE_TYPES[type]?.color || MESSAGE_TYPES.GENERAL.color;
  };

  // 로딩 상태
  if (loading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.MESSAGES || '메시지 관리'}>
        <UnifiedLoading text="메시지를 불러오는 중..." />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.MESSAGES || '메시지 관리'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 100; // 트리거 거리 증가
          const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
          
          if (__DEV__) {
            if (isNearBottom) {
              console.log('📜 스크롤 하단 근처 도달:', {
                layoutHeight: layoutMeasurement.height,
                contentOffsetY: contentOffset.y,
                contentHeight: contentSize.height,
                distance: contentSize.height - (layoutMeasurement.height + contentOffset.y)
              });
            }
          }
          
          // 스크롤이 하단 근처에 도달하면 더 많은 메시지 로드
          if (isNearBottom) {
            loadMoreMessages();
          }
        }}
        scrollEventThrottle={200}
      >
        {/* 헤더 정보 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            전체 메시지 {messages.length}개
            {unreadCount > 0 && ` · 읽지 않음 ${unreadCount}개`}
          </Text>
        </View>

        {/* 필터 및 검색 */}
        <View style={styles.filtersCard}>
          {/* 검색 */}
          <View style={styles.searchContainer}>
            <Search size={SIZES.ICON.SM} color={COLORS.gray500} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="제목, 내용, 발신자, 수신자로 검색..."
              placeholderTextColor={COLORS.gray400}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {/* 필터 */}
          <View style={styles.filterRow}>
            <View style={styles.filterContainer}>
              <Filter size={SIZES.ICON.SM} color={COLORS.gray500} style={styles.filterIcon} />
              <Text style={styles.filterLabel}>유형:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {Object.entries(MESSAGE_TYPES).map(([value, { label, color }]) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.filterChip,
                      filterType === value && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => setFilterType(value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filterType === value && { color: COLORS.white },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>상태:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {['ALL', 'UNREAD', 'READ'].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.filterChip,
                      filterStatus === value && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                    ]}
                    onPress={() => setFilterStatus(value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filterStatus === value && { color: COLORS.white },
                      ]}
                    >
                      {value === 'ALL' ? '전체' : value === 'UNREAD' ? '읽지 않음' : '읽음'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* 메시지 목록 */}
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={COLORS.gray400} />
            <Text style={styles.emptyText}>메시지가 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.messagesList}>
            {filteredMessages.map((message) => (
              <TouchableOpacity
                key={message.id}
                style={[
                  styles.messageCard,
                  !message.isRead && styles.messageCardUnread,
                ]}
                onPress={() => handleMessageClick(message)}
              >
                {/* 상단: 상태 + 유형 배지 */}
                <View style={styles.messageHeader}>
                  <View style={[
                    styles.badge,
                    !message.isRead ? styles.badgePrimary : styles.badgeSecondary,
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      !message.isRead && styles.badgeTextPrimary,
                    ]}>
                      {!message.isRead ? '읽지 않음' : '읽음'}
                    </Text>
                  </View>
                  <View style={[
                    styles.badge,
                    { backgroundColor: getMessageTypeColor(message.messageType) },
                  ]}>
                    <Text style={styles.badgeTextWhite}>
                      {MESSAGE_TYPES[message.messageType]?.label || '일반'}
                    </Text>
                  </View>
                  {message.isImportant && (
                    <View style={[styles.badge, styles.badgeWarning]}>
                      <Text style={styles.badgeTextWhite}>중요</Text>
                    </View>
                  )}
                  {message.isUrgent && (
                    <View style={[styles.badge, styles.badgeDanger]}>
                      <Text style={styles.badgeTextWhite}>긴급</Text>
                    </View>
                  )}
                </View>

                {/* 제목 */}
                <Text style={[
                  styles.messageTitle,
                  !message.isRead && styles.messageTitleUnread,
                ]}>
                  {message.title}
                </Text>

                {/* 발신자/수신자 */}
                <View style={styles.messageParticipants}>
                  <View style={styles.participant}>
                    <User size={14} color={COLORS.gray500} />
                    <Text style={styles.participantText}>발신: {message.senderName}</Text>
                  </View>
                  <View style={styles.participant}>
                    <Users size={14} color={COLORS.gray500} />
                    <Text style={styles.participantText}>수신: {message.receiverName}</Text>
                  </View>
                </View>

                {/* 날짜 */}
                <Text style={styles.messageDate}>
                  {new Date(message.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* 더 보기 로딩 인디케이터 */}
        {loadingMore && (
          <View style={styles.loadMoreContainer}>
            <Text style={styles.loadMoreText}>더 많은 메시지를 불러오는 중...</Text>
          </View>
        )}
        
        {/* 더 이상 없음 표시 */}
        {!hasMore && messages.length > 0 && (
          <View style={styles.loadMoreContainer}>
            <Text style={styles.loadMoreText}>모든 메시지를 불러왔습니다.</Text>
          </View>
        )}
      </ScrollView>

      {/* 메시지 상세 모달 */}
      <Modal
        visible={!!selectedMessage}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay} onTouchEnd={closeModal}>
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMessage?.title}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                <X size={SIZES.ICON.MD} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedMessage && (
                <>
                  <View style={styles.modalBadges}>
                    <View style={[
                      styles.badge,
                      { backgroundColor: getMessageTypeColor(selectedMessage.messageType) },
                    ]}>
                      <Text style={styles.badgeTextWhite}>
                        {MESSAGE_TYPES[selectedMessage.messageType]?.label || '일반'}
                      </Text>
                    </View>
                    {selectedMessage.isImportant && (
                      <View style={[styles.badge, styles.badgeWarning]}>
                        <Text style={styles.badgeTextWhite}>중요</Text>
                      </View>
                    )}
                    {selectedMessage.isUrgent && (
                      <View style={[styles.badge, styles.badgeDanger]}>
                        <Text style={styles.badgeTextWhite}>긴급</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.modalInfo}>
                    <View style={styles.modalInfoItem}>
                      <Text style={styles.modalInfoLabel}>발신자:</Text>
                      <Text style={styles.modalInfoValue}>{selectedMessage.senderName}</Text>
                    </View>
                    <View style={styles.modalInfoItem}>
                      <Text style={styles.modalInfoLabel}>수신자:</Text>
                      <Text style={styles.modalInfoValue}>{selectedMessage.receiverName}</Text>
                    </View>
                    <View style={styles.modalInfoItem}>
                      <Text style={styles.modalInfoLabel}>발송일:</Text>
                      <Text style={styles.modalInfoValue}>
                        {new Date(selectedMessage.createdAt).toLocaleString('ko-KR')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalContent}>
                    <Text 
                      style={styles.modalContentText}
                      selectable
                    >
                      {selectedMessage.content || '내용이 없습니다.'}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <MGButton variant="outline" onPress={closeModal}>
                닫기
              </MGButton>
            </View>
          </View>
        </View>
      </Modal>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  filtersCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    paddingVertical: SPACING.sm,
  },
  filterRow: {
    gap: SPACING.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  filterIcon: {
    marginRight: SPACING.xs,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginRight: SPACING.xs,
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    marginRight: SPACING.xs,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray700,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginTop: SPACING.md,
  },
  messagesList: {
    gap: SPACING.md,
  },
  messageCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  messageCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray200,
  },
  badgePrimary: {
    backgroundColor: COLORS.primary,
  },
  badgeSecondary: {
    backgroundColor: COLORS.gray200,
  },
  badgeWarning: {
    backgroundColor: COLORS.warning || COLORS.orange,
  },
  badgeDanger: {
    backgroundColor: COLORS.danger || COLORS.error || '#FF4444',
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray700,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  badgeTextPrimary: {
    color: COLORS.white,
  },
  badgeTextWhite: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  messageTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  messageTitleUnread: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  messageParticipants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  participantText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  messageDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalBody: {
    padding: SPACING.md,
  },
  modalBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  modalInfo: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalInfoItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  modalInfoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
    minWidth: 60,
    flexShrink: 0,
  },
  modalInfoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark,
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  modalContent: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.md,
  },
  modalContentText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    lineHeight: 24, // 고정 lineHeight로 텍스트 겹침 방지
    textAlign: 'left',
    flexWrap: 'wrap',
  },
  modalActions: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  loadMoreContainer: {
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
});

export default AdminMessages;

