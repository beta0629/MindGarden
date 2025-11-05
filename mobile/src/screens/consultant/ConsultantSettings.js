/**
 * 상담사 설정 화면
 * 
 * 웹의 frontend/src/components/mypage/MyPage.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { User, Mail, Phone, Camera, Lock, Save, LogOut } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPut, apiUpload } from '../../api/client';
import { PROFILE_API } from '../../api/endpoints';
import NotificationService from '../../services/NotificationService';
import ImageService from '../../services/ImageService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ConsultantSettings = () => {
  const { user, checkSession, logout } = useSession();
  const navigation = useNavigation();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    nickname: '',
    profileImageUrl: '',
  });
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 프로필 데이터 로드 (웹의 MyPage.js와 동일한 API 사용)
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // 웹과 동일: /api/user/profile/{userId} (상담사용)
      const response = await apiGet(PROFILE_API.CONSULTANT.GET_INFO(user.id));

      // 웹의 MyPage.js와 동일한 응답 구조 처리
      const profileData = response?.data || response;
      
      if (profileData) {
        setProfile({
          name: profileData.username || profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || profileData.phoneNumber || '',
          nickname: profileData.nickname || '',
          profileImageUrl: profileData.profileImage || profileData.profileImageUrl || '',
        });
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      NotificationService.error(STRINGS.ERROR.LOAD_FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // 이미지 선택 처리
  const handleImageSelected = useCallback((imageUri) => {
    if (imageUri) {
      setSelectedImageUri(imageUri);
      setProfile((prev) => ({
        ...prev,
        profileImageUrl: imageUri,
      }));
    }
  }, []);

  // 프로필 이미지 변경 (카메라/갤러리 선택)
  const handleImagePicker = useCallback(() => {
    ImageService.showImagePickerActionSheet(handleImageSelected);
  }, [handleImageSelected]);

  // 프로필 이미지 업로드
  const uploadProfileImage = useCallback(async () => {
    if (!selectedImageUri || !user?.id) return;

    try {
      setIsUploadingImage(true);

      const formData = new FormData();
      const filename = selectedImageUri.split('/').pop();
      const fileType = filename.split('.').pop() || 'jpg';

      formData.append('image', {
        uri: selectedImageUri,
        name: `profile_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });

      // 상담사용 이미지 업로드 API
      const response = await apiUpload(PROFILE_API.CONSULTANT.UPLOAD_IMAGE(user.id), formData);

      if (response?.success || response?.imageUrl) {
        const imageUrl = response.imageUrl || response.data?.imageUrl || response.data;
        setProfile((prev) => ({
          ...prev,
          profileImageUrl: imageUrl,
        }));
        setSelectedImageUri(null);
        NotificationService.success('프로필 이미지가 업로드되었습니다.');
        await checkSession(true);
      } else {
        throw new Error(response.message || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error);
      NotificationService.error(error.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  }, [selectedImageUri, user?.id, checkSession]);

  // 로그아웃 처리
  const handleLogout = () => {
    Alert.alert(
      STRINGS.AUTH.LOGOUT_CONFIRM_TITLE || '로그아웃',
      STRINGS.AUTH.LOGOUT_CONFIRM_MESSAGE || '정말 로그아웃하시겠습니까?',
      [
        {
          text: STRINGS.COMMON.CANCEL || '취소',
          style: 'cancel',
        },
        {
          text: STRINGS.AUTH.LOGOUT || '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // AppNavigator의 조건부 렌더링이 자동으로 AuthStack으로 전환합니다
              // 별도의 네비게이션 호출이 필요 없습니다
            } catch (error) {
              console.error('로그아웃 실패:', error);
              Alert.alert('오류', '로그아웃에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 프로필 저장 시 이미지도 함께 업로드
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // 이미지가 선택되었으면 먼저 업로드
      if (selectedImageUri) {
        await uploadProfileImage();
      }

      // 웹의 MyPage.js와 동일한 업데이트 형식
      const updateData = {
        username: profile.name,
        nickname: profile.nickname,
        phone: profile.phone,
      };

      const response = await apiPut(PROFILE_API.CONSULTANT.UPDATE_INFO(user.id), updateData);

      if (response?.success !== false) {
        NotificationService.success(STRINGS.SUCCESS.SAVED);
        await checkSession(true);
      } else {
        throw new Error(response.message || STRINGS.ERROR.SAVE_FAILED);
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      NotificationService.error(error.message || STRINGS.ERROR.SAVE_FAILED);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CONSULTANT.SETTINGS_TITLE || '내 정보'}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.CONSULTANT.SETTINGS_TITLE || '내 정보'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* 프로필 이미지 */}
        <DashboardSection title={STRINGS.CLIENT.PROFILE_IMAGE} icon={<User size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
              {profile.profileImageUrl ? (
                <Image source={{ uri: profile.profileImageUrl }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <User size={SIZES.ICON['2XL']} color={COLORS.gray400} />
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={handleImagePicker}>
                <Camera size={SIZES.ICON.MD} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            {selectedImageUri && (
              <View style={styles.imageUploadSection}>
                <Text style={styles.imageUploadText}>이미지가 선택되었습니다. 저장 버튼을 눌러 업로드하세요.</Text>
              </View>
            )}
          </View>
        </DashboardSection>

        {/* 프로필 정보 */}
        <DashboardSection title={STRINGS.CLIENT.BASIC_INFO} icon={<User size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{STRINGS.PROFILE.NAME}</Text>
              <View style={styles.inputContainer}>
                <User size={SIZES.ICON.MD} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={profile.name}
                  onChangeText={(text) => setProfile({ ...profile, name: text })}
                  placeholder={STRINGS.PROFILE.ENTER_NAME}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{STRINGS.PROFILE.NICKNAME}</Text>
              <View style={styles.inputContainer}>
                <User size={SIZES.ICON.MD} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={profile.nickname}
                  onChangeText={(text) => setProfile({ ...profile, nickname: text })}
                  placeholder={STRINGS.PROFILE.ENTER_NICKNAME}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{STRINGS.PROFILE.EMAIL}</Text>
              <View style={styles.inputContainer}>
                <Mail size={SIZES.ICON.MD} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={profile.email}
                  editable={false}
                  placeholder={STRINGS.PROFILE.EMAIL}
                />
              </View>
              <Text style={styles.helpText}>{STRINGS.CLIENT.EMAIL_NOT_EDITABLE}</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{STRINGS.PROFILE.PHONE}</Text>
              <View style={styles.inputContainer}>
                <Phone size={SIZES.ICON.MD} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={profile.phone}
                  onChangeText={(text) => setProfile({ ...profile, phone: text })}
                  placeholder={STRINGS.PROFILE.ENTER_PHONE}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        </DashboardSection>

        {/* 저장 버튼 */}
        <MGButton
          variant="primary"
          size="large"
          fullWidth
          loading={isSaving}
          loadingText={STRINGS.PROFILE.SAVING}
          onPress={handleSave}
          style={styles.saveButton}
        >
          <Save size={SIZES.ICON.MD} color={COLORS.white} />
          <Text style={styles.saveButtonText}>{STRINGS.PROFILE.SAVE_BUTTON}</Text>
        </MGButton>

        {/* 로그아웃 버튼 */}
        <DashboardSection title={STRINGS.AUTH.ACCOUNT || '계정'} icon={<Lock size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <MGButton
            variant="danger"
            size="large"
            fullWidth
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <LogOut size={SIZES.ICON.MD} color={COLORS.white} />
            <Text style={styles.logoutButtonText}>{STRINGS.AUTH.LOGOUT || '로그아웃'}</Text>
          </MGButton>
        </DashboardSection>
      </ScrollView>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  profileImageSection: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: SIZES.PROFILE_IMAGE.LARGE,
    height: SIZES.PROFILE_IMAGE.LARGE,
    borderRadius: SIZES.PROFILE_IMAGE.LARGE / 2,
  },
  profileImagePlaceholder: {
    width: SIZES.PROFILE_IMAGE.LARGE,
    height: SIZES.PROFILE_IMAGE.LARGE,
    borderRadius: SIZES.PROFILE_IMAGE.LARGE / 2,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: SIZES.PROFILE_IMAGE.XS,
    height: SIZES.PROFILE_IMAGE.XS,
    borderRadius: SIZES.PROFILE_IMAGE.XS / 2,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  form: {
    gap: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: SIZES.BORDER_WIDTH.MEDIUM,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  inputDisabled: {
    backgroundColor: COLORS.gray100,
    color: COLORS.gray600,
  },
  helpText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
  },
  saveButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  saveButtonText: {
    marginLeft: SPACING.xs,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  logoutButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
  },
  logoutButtonText: {
    marginLeft: SPACING.xs,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  imageUploadSection: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.info + '20',
    borderRadius: BORDER_RADIUS.sm,
  },
  imageUploadText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.info,
    textAlign: 'center',
  },
});

export default ConsultantSettings;

