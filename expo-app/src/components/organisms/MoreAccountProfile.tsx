/**
 * 더보기 스택 — 프로필 요약(계정·알림·설정·로그아웃)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import type { ImagePickerOptions } from 'expo-image-picker';
import { Bell, ChevronLeft, LogOut, Settings } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Avatar } from '@/components/atoms/Avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from '@/services/AuthService';
import { toDisplayString } from '@/utils/safeDisplay';
import { useProfileImageUpload } from '@/api/hooks/useProfileImageUpload';
import { useProfileRemoteSync } from '@/api/hooks/useProfileRemoteSync';

const PROFILE_IMAGE_PICK_OPTIONS: ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.75,
  base64: true,
};

const NATIVE_IMAGE_PICKER_MISSING_HINT =
  'expo-image-picker가 포함된 네이티브 앱으로 다시 빌드해야 합니다.\n\n' +
  '• 로컬 개발: expo-app 폴더에서 npx expo run:ios 또는 npx expo run:android\n' +
  '• Expo Go: 스토어에서 Expo Go를 최신(SDK 54)으로 업데이트 후 npx expo start -c';

function getMutationErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim() !== '') {
      return m;
    }
  }
  return '프로필 사진을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.';
}

export interface MoreAccountProfileProps {
  readonly settingsHref: Href;
  readonly notificationSettingsHref: Href;
  readonly roleLabel: string;
}

export function MoreAccountProfile({
  settingsHref,
  notificationSettingsHref,
  roleLabel,
}: MoreAccountProfileProps) {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { mutate: uploadProfileImage, isPending: isUploadingProfile } =
    useProfileImageUpload();
  useProfileRemoteSync();

  const displayName = toDisplayString(
    user?.nickname?.trim() || user?.name,
    '로그인 계정',
  );
  const email = toDisplayString(user?.email, '—');
  const tenantLine =
    user?.tenantId != null && String(user.tenantId).trim() !== ''
      ? `테넌트: ${toDisplayString(user.tenantId)}`
      : undefined;

  const appVersion =
    Constants.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    '—';

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.logout();
            router.replace('/(auth)/login');
          } catch {
            await useAuthStore.getState().logout();
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };

  const runPicker = useCallback(
    async (source: 'library' | 'camera') => {
      if (isUploadingProfile) {
        return;
      }
      let ImagePicker: typeof import('expo-image-picker');
      try {
        ImagePicker = await import('expo-image-picker');
      } catch {
        Alert.alert('사진 기능을 사용할 수 없습니다', NATIVE_IMAGE_PICKER_MISSING_HINT);
        return;
      }
      try {
        if (source === 'library') {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert(
              '권한 필요',
              '사진 보관함 접근 권한을 허용한 뒤 다시 시도해주세요.',
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync(
            PROFILE_IMAGE_PICK_OPTIONS,
          );
          if (result.canceled || !result.assets?.[0]) {
            return;
          }
          const asset = result.assets[0];
          if (!asset.base64) {
            Alert.alert('오류', '이미지 데이터를 읽을 수 없습니다.');
            return;
          }
          const mime = asset.mimeType ?? 'image/jpeg';
          const dataUri = `data:${mime};base64,${asset.base64}`;
          uploadProfileImage(dataUri, {
            onError: (e) => {
              Alert.alert('업로드 실패', getMutationErrorMessage(e));
            },
          });
          return;
        }

        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          Alert.alert(
            '권한 필요',
            '카메라 접근 권한을 허용한 뒤 다시 시도해주세요.',
          );
          return;
        }
        const shot = await ImagePicker.launchCameraAsync(PROFILE_IMAGE_PICK_OPTIONS);
        if (shot.canceled || !shot.assets?.[0]) {
          return;
        }
        const asset = shot.assets[0];
        if (!asset.base64) {
          Alert.alert('오류', '이미지 데이터를 읽을 수 없습니다.');
          return;
        }
        const mime = asset.mimeType ?? 'image/jpeg';
        const dataUri = `data:${mime};base64,${asset.base64}`;
        uploadProfileImage(dataUri, {
          onError: (e) => {
            Alert.alert('업로드 실패', getMutationErrorMessage(e));
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('ExponentImagePicker') || msg.includes('native module')) {
          Alert.alert('사진 기능을 사용할 수 없습니다', NATIVE_IMAGE_PICKER_MISSING_HINT);
        } else {
          Alert.alert('오류', '사진을 불러오지 못했습니다.');
        }
      }
    },
    [isUploadingProfile, uploadProfileImage],
  );

  const handleAvatarPress = () => {
    if (isUploadingProfile) {
      return;
    }
    Alert.alert('프로필 사진', '사진 출처를 선택해주세요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '사진 보관함',
        onPress: () => {
          void runPicker('library');
        },
      },
      {
        text: '카메라',
        onPress: () => {
          void runPicker('camera');
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top', 'bottom']}
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
          }}
        >
          프로필
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              ...theme.shadows.sm,
            },
          ]}
        >
          <View style={styles.avatarRow}>
            <Pressable
              onPress={handleAvatarPress}
              disabled={isUploadingProfile}
              accessibilityRole="button"
              accessibilityLabel="프로필 사진 바꾸기"
              style={({ pressed }) => [
                styles.avatarPressable,
                { opacity: pressed || isUploadingProfile ? 0.7 : 1 },
              ]}
            >
              <Avatar
                uri={user?.profileImageUrl}
                name={displayName}
                size="lg"
                style={styles.avatarImage}
              />
              {isUploadingProfile ? (
                <View
                  style={[
                    styles.avatarLoading,
                    {
                      backgroundColor: theme.colors.surface,
                      opacity: 0.72,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              ) : null}
            </Pressable>
            <View style={styles.avatarText}>
              <Text
                style={{
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.bold,
                  fontSize: theme.fontSize.lg,
                }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  marginTop: 4,
                }}
                numberOfLines={1}
              >
                {roleLabel} · {email}
              </Text>
              {tenantLine ? (
                <Text
                  style={{
                    color: theme.colors.textTertiary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                    marginTop: 6,
                  }}
                  numberOfLines={2}
                >
                  {tenantLine}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
            },
          ]}
        >
          바로가기
        </Text>
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
        >
          <Pressable
            onPress={() => router.push(notificationSettingsHref)}
            style={({ pressed }) => [
              styles.menuRow,
              { backgroundColor: pressed ? theme.colors.accentSoft : 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="알림 설정"
          >
            <Bell size={20} color={theme.colors.primary} />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.base,
              }}
            >
              알림 설정
            </Text>
            <Text style={{ color: theme.colors.textTertiary, fontSize: theme.fontSize.lg }}>›</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
          <Pressable
            onPress={() => router.push(settingsHref)}
            style={({ pressed }) => [
              styles.menuRow,
              { backgroundColor: pressed ? theme.colors.accentSoft : 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="앱 설정"
          >
            <Settings size={20} color={theme.colors.primary} />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.base,
              }}
            >
              앱 설정
            </Text>
            <Text style={{ color: theme.colors.textTertiary, fontSize: theme.fontSize.lg }}>›</Text>
          </Pressable>
        </View>

        <Text
          style={[
            styles.version,
            {
              color: theme.colors.textTertiary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
            },
          ]}
        >
          앱 버전 {appVersion}
        </Text>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logout,
            {
              backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              borderColor: theme.colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="로그아웃"
        >
          <LogOut size={20} color={theme.colors.error} />
          <Text
            style={{
              marginLeft: 8,
              color: theme.colors.error,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            }}
          >
            로그아웃
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 20,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPressable: {
    position: 'relative',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  avatarText: {
    flex: 1,
    marginLeft: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
  version: {
    textAlign: 'center',
    marginBottom: 20,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
  },
});
