/**
 * 내담자 — 대화 목록 화면
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { SafeAreaView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ConversationListScreen } from '@/components/organisms/ConversationListScreen';

export default function ClientMessagesScreen() {
  const theme = useTheme();
  const router = useRouter();

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
          메시지
        </Text>
      </View>
      <ConversationListScreen basePath="/(client)/(more)/messages" />
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
