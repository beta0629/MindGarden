/**
 * 공개 /legal/* 스택 (웹 crawl 경로 패리티)
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LegalLayout() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
