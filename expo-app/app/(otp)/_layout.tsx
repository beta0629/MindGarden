/**
 * Push-first OTP 그룹 — 보안 인증 흐름 전용 Stack.
 *
 * <p>{@code (auth)} 그룹과 분리하여 인증된 사용자가 push 로 받은 OTP 를 표시하는
 * `/(otp)/current` 화면을 호스팅한다. 화면 진입은 {@code NotificationService}
 * 의 `navigateToOtpDelivery` 분기를 통해서만 일어난다.</p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OtpLayout() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
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
