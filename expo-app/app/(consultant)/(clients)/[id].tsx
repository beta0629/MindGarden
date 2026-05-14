/**
 * 내담자 상세 화면
 * 프로필, 탭(기본정보/상담이력/메모)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Mail, Phone, Calendar as CalendarIcon, FileText } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useClientDetail } from '@/api/hooks/useClients';
import { Avatar } from '@/components/atoms/Avatar';
import { Chip } from '@/components/atoms/Chip';
import { SkeletonCard, SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';

type TabKey = 'info' | 'history' | 'memo';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: '기본정보' },
  { key: 'history', label: '상담이력' },
  { key: 'memo', label: '메모' },
];

export default function ConsultantClientDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const detailQuery = useClientDetail(id);
  const client = detailQuery.data;
  const isLoading = detailQuery.isLoading;

  const onRefresh = useCallback(() => {
    detailQuery.refetch();
  }, [detailQuery]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      {/* 헤더 */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomColor: theme.colors.divider,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <ArrowLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            marginLeft: theme.spacing.md,
          }}
        >
          내담자 상세
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={detailQuery.isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {isLoading ? (
          <>
            <SkeletonLoader width={64} height={64} borderRadius={32} />
            <SkeletonLoader height={20} style={{ marginTop: 12 }} />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : client ? (
          <>
            {/* 프로필 */}
            <View style={styles.profileSection}>
              <Avatar uri={client.profileImageUrl} name={client.name} size="xl" />
              <Text
                style={{
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.bold,
                  fontSize: theme.fontSize.xl,
                  marginTop: theme.spacing.md,
                }}
              >
                {client.name}
              </Text>
              <View style={[styles.contactRow, { marginTop: theme.spacing.sm }]}>
                {client.contactNumber ? (
                  <View style={styles.contactItem}>
                    <Phone size={14} color={theme.colors.textSecondary} />
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.sm,
                        marginLeft: theme.spacing.xs,
                      }}
                    >
                      {client.contactNumber}
                    </Text>
                  </View>
                ) : null}
                {client.email ? (
                  <View style={[styles.contactItem, { marginLeft: theme.spacing.lg }]}>
                    <Mail size={14} color={theme.colors.textSecondary} />
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.sm,
                        marginLeft: theme.spacing.xs,
                      }}
                    >
                      {client.email}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={{
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                  marginTop: theme.spacing.xs,
                }}
              >
                등록일: {client.registeredDate} · 총 {client.totalSessions}회 상담
              </Text>
            </View>

            {/* 탭 */}
            <View style={[styles.tabRow, { marginTop: theme.spacing.xl }]}>
              {TABS.map((tab) => (
                <Chip
                  key={tab.key}
                  label={tab.label}
                  selected={activeTab === tab.key}
                  onPress={() => setActiveTab(tab.key)}
                />
              ))}
            </View>

            {/* 탭 콘텐츠 */}
            <View style={[styles.tabContent, { marginTop: theme.spacing.lg }]}>
              {activeTab === 'info' && (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.xl,
                      padding: theme.spacing.lg,
                      ...theme.shadows.sm,
                    },
                  ]}
                >
                  {client.gender || client.birthDate || client.occupation ? (
                    <>
                      <InfoRow theme={theme} label="성별" value={client.gender ?? '-'} />
                      <InfoRow theme={theme} label="생년월일" value={client.birthDate ?? '-'} />
                      <InfoRow theme={theme} label="직업" value={client.occupation ?? '-'} />
                    </>
                  ) : null}
                  <InfoRow
                    theme={theme}
                    label="상담 목적"
                    value={client.consultationPurpose ?? '-'}
                  />
                  <InfoRow theme={theme} label="특이사항" value={client.specialNotes ?? '-'} />
                </View>
              )}

              {activeTab === 'history' && (
                <>
                  {client.sessionHistory.length === 0 ? (
                    <EmptyState
                      icon={<CalendarIcon size={32} color={theme.colors.textTertiary} />}
                      title="상담 이력이 없습니다"
                    />
                  ) : (
                    client.sessionHistory.map((session) => (
                      <View
                        key={session.id}
                        style={[
                          styles.historyItem,
                          {
                            borderLeftColor: theme.colors.primary,
                            paddingLeft: theme.spacing.md,
                            marginBottom: theme.spacing.lg,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: theme.colors.textMain,
                            fontFamily: theme.fontFamily.semibold,
                            fontSize: theme.fontSize.sm,
                          }}
                        >
                          {session.date} {session.startTime} - {session.endTime}
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontFamily: theme.fontFamily.regular,
                            fontSize: theme.fontSize.xs,
                            marginTop: theme.spacing['2xs'],
                          }}
                        >
                          {session.sessionNumber}회차 · {session.sessionType}
                        </Text>
                        {session.summary ? (
                          <Text
                            style={{
                              color: theme.colors.textSecondary,
                              fontFamily: theme.fontFamily.regular,
                              fontSize: theme.fontSize.sm,
                              marginTop: theme.spacing.sm,
                            }}
                            numberOfLines={2}
                          >
                            {session.summary}
                          </Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </>
              )}

              {activeTab === 'memo' && (
                <>
                  {client.memos.length === 0 ? (
                    <EmptyState
                      icon={<FileText size={32} color={theme.colors.textTertiary} />}
                      title="작성된 메모가 없습니다"
                      description="상담 중 메모를 남겨보세요."
                    />
                  ) : (
                    client.memos.map((m) => (
                      <View
                        key={m.id}
                        style={[
                          styles.card,
                          {
                            backgroundColor: theme.colors.surface,
                            borderRadius: theme.borderRadius.xl,
                            padding: theme.spacing.lg,
                            marginBottom: theme.spacing.md,
                            ...theme.shadows.sm,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: theme.colors.textMain,
                            fontFamily: theme.fontFamily.regular,
                            fontSize: theme.fontSize.sm,
                            lineHeight: 20,
                          }}
                        >
                          {m.content}
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.textTertiary,
                            fontFamily: theme.fontFamily.regular,
                            fontSize: theme.fontSize.xs,
                            marginTop: theme.spacing.sm,
                          }}
                        >
                          {m.updatedAt}
                        </Text>
                      </View>
                    ))
                  )}
                </>
              )}
            </View>

            <View style={{ height: 32 }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  theme,
  label,
  value,
}: {
  theme: ReturnType<typeof useTheme>;
  label: string;
  value: string;
}) {
  return (
    <View style={[infoRowStyles.row, { marginBottom: theme.spacing.md }]}>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
          width: 80,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
          flex: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  profileSection: {
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabContent: {},
  card: {},
  historyItem: {
    borderLeftWidth: 2,
  },
});
