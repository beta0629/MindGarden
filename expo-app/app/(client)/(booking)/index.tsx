/**
 * Step 1: 상담사 선택
 * SearchBar + 전문분야 필터 칩 + ConsultantProfileCard FlashList
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { ConsultantProfileCard } from '@/components/molecules/ConsultantProfileCard';
import { SearchBar } from '@/components/atoms/SearchBar';
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { useAvailableConsultants, type Consultant } from '@/api/hooks/useBooking';

const STEP_LABELS = ['상담사 선택', '시간 선택', '결제'];
const SPECIALTIES = ['전체', '우울', '불안', '가족', '학업', '대인관계', '자존감', '스트레스'];

export default function BookingConsultantSelect() {
  const theme = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('전체');

  const filters = {
    search: search || undefined,
    specialty: selectedSpecialty === '전체' ? undefined : selectedSpecialty,
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAvailableConsultants(filters);

  const consultants = data?.pages.flat() ?? [];

  const handleSelectConsultant = (consultant: Consultant) => {
    router.push({
      pathname: '/(client)/(booking)/time-select',
      params: {
        consultantId: String(consultant.id),
        consultantName: consultant.name,
        consultantImage: consultant.profileImageUrl ?? '',
        specialties: consultant.specialties.join(','),
      },
    });
  };

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: Consultant; index: number }) => (
      <ConsultantProfileCard
        consultant={item}
        index={index}
        onPress={() => handleSelectConsultant(item)}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="새로운 상담 예약" canGoBack />
      <ProgressBar currentStep={1} totalSteps={3} labels={STEP_LABELS} />

      <Animated.View entering={FadeInDown.springify()} style={styles.searchSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="상담사 이름, 전문분야 검색"
        />
      </Animated.View>

      <View style={styles.chipSection}>
        {SPECIALTIES.map((spec) => (
          <Chip
            key={spec}
            label={spec}
            selected={selectedSpecialty === spec}
            onPress={() => setSelectedSpecialty(spec)}
          />
        ))}
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : consultants.length === 0 ? (
          <EmptyState title="조건에 맞는 상담사가 없어요" description="검색 조건을 변경해보세요" />
        ) : (
          <FlashList
            data={consultants}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isFetchingNextPage ? <SkeletonCard lines={2} /> : null}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  chipSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  skeletonWrap: {
    gap: 12,
    paddingTop: 8,
  },
});
