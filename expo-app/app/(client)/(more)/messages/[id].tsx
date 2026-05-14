/**
 * 내담자 — 채팅 화면
 *
 * @author MindGarden
 * @since 2026-05-12
 * @since 2026-05-13 — partnerId·헤더 표시명 쿼리 정합
 */
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ChatScreen } from '@/components/organisms/ChatScreen';
import { toDisplayString } from '@/utils/safeDisplay';

export default function ClientChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id, partnerName } = useLocalSearchParams<{
    id: string;
    partnerName?: string;
  }>();

  const partnerId = Number(id);
  let decodedName = '';
  if (typeof partnerName === 'string' && partnerName.length > 0) {
    try {
      decodedName = decodeURIComponent(partnerName);
    } catch {
      decodedName = partnerName;
    }
  }
  const headerTitle = toDisplayString(decodedName, '상담 대화');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            marginLeft: 8,
          }}
          numberOfLines={1}
        >
          {headerTitle}
        </Text>
      </View>
      <ChatScreen partnerId={partnerId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
