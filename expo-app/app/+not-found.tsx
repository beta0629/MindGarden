import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/theme';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: '페이지를 찾을 수 없습니다' }} />
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.xl,
            },
          ]}
        >
          페이지를 찾을 수 없습니다
        </Text>
        <Link href="/" style={styles.link}>
          <Text
            style={[
              styles.linkText,
              {
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.base,
              },
            ]}
          >
            홈으로 돌아가기
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 16,
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  linkText: {},
});
