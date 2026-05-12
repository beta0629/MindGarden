/**
 * 내담자 — 채팅 화면
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { SafeAreaView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ChatScreen } from '@/components/organisms/ChatScreen';

export default function ClientChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const conversationId = Number(id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
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
        >
          상담 대화
        </Text>
      </View>
      <ChatScreen
        conversationId={conversationId}
        receiverId={0}
        partnerName=""
      />
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
