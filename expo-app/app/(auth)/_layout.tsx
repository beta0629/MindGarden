import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/**
 * 인증 화면(로그인·회원가입·OAuth·tenant-select·legal-webview) Stack 레이아웃.
 *
 * <p>iPad 대응: `<ContentLetterbox>` 가 임계(744pt) 이상에서만 콘텐츠 컬럼을 가운데 정렬한다.
 * iPhone 등 임계 미만에서는 zero-cost 통과 — 기존 디자인 무변경.</p>
 */
export default function AuthLayout() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ContentLetterbox>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </ContentLetterbox>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
