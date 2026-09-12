import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/**
 * Auth group layout — iPad letterbox wraps Stack (Apple G4).
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
