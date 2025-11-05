/**
 * 프로필 사진 관리 화면
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Camera, Image as ImageIcon, Trash2, Upload } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import MGButton from '../../components/MGButton';
import imageService from '../../services/ImageService';
import { useSession } from '../../contexts/SessionContext';
import { apiPost } from '../../api/client';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ProfilePhotoScreen = () => {
  const { user, updateUser } = useSession();
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(user?.profileImageUrl || null);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 이미지 선택 핸들러
  const handleImageSelected = async (imageUri) => {
    try {
      setIsProcessing(true);
      setSelectedImageUri(imageUri);

      // 이미지 처리 (크롭 및 리사이즈)
      const processedUri = await imageService.processImage(imageUri, {
        enableCrop: true,
        enableResize: true,
        cropOptions: {
          width: 300,
          height: 300,
          cropperCircleOverlay: true,
        },
        resizeOptions: {
          maxWidth: 500,
          maxHeight: 500,
          quality: 85,
        },
      });

      setSelectedImageUri(processedUri);
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      Alert.alert(STRINGS.ERROR.ERROR, STRINGS.IMAGE.PROCESS_ERROR);
    } finally {
      setIsProcessing(false);
    }
  };

  // 이미지 선택 액션 시트 표시
  const showImagePickerOptions = () => {
    imageService.showImagePickerActionSheet(handleImageSelected);
  };

  // 이미지 업로드
  const uploadImage = async () => {
    if (!selectedImageUri) return;

    try {
      setIsUploading(true);

      // 서버로 이미지 업로드
      const imageUrl = await imageService.uploadImage(selectedImageUri, {
        userId: user?.id,
      });

      // 사용자 프로필 업데이트
      await updateUser({ profileImageUrl: imageUrl });

      setCurrentPhotoUrl(imageUrl);
      setSelectedImageUri(null);

      Alert.alert(
        STRINGS.SUCCESS.SUCCESS,
        STRINGS.IMAGE.UPLOAD_SUCCESS
      );
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      Alert.alert(STRINGS.ERROR.ERROR, STRINGS.IMAGE.UPLOAD_ERROR);
    } finally {
      setIsUploading(false);
    }
  };

  // 이미지 삭제
  const deleteImage = () => {
    Alert.alert(
      STRINGS.COMMON.CONFIRM,
      STRINGS.IMAGE.DELETE_CONFIRM,
      [
        { text: STRINGS.COMMON.CANCEL, style: 'cancel' },
        {
          text: STRINGS.COMMON.DELETE,
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);

              // 서버에서 이미지 삭제
              await apiPost('/api/user/profile/remove-image', {
                userId: user?.id,
              });

              // 로컬 상태 업데이트
              await updateUser({ profileImageUrl: null });
              setCurrentPhotoUrl(null);
              setSelectedImageUri(null);

              Alert.alert(
                STRINGS.SUCCESS.SUCCESS,
                STRINGS.IMAGE.DELETE_SUCCESS
              );
            } catch (error) {
              console.error('이미지 삭제 실패:', error);
              Alert.alert(STRINGS.ERROR.ERROR, STRINGS.IMAGE.DELETE_ERROR);
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  // 선택 취소
  const cancelSelection = () => {
    setSelectedImageUri(null);
    imageService.cleanup();
  };

  // 현재 표시할 이미지 결정
  const displayImageUri = selectedImageUri || currentPhotoUrl;

  return (
    <SimpleLayout title={STRINGS.PROFILE.PROFILE_PHOTO}>
      <View style={styles.container}>
        {/* 현재 프로필 사진 표시 */}
        <View style={styles.photoContainer}>
          {displayImageUri ? (
            <Image
              source={{ uri: displayImageUri }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <ImageIcon size={SIZES.ICON['3XL']} color={COLORS.gray400} />
              <Text style={styles.placeholderText}>
                {STRINGS.IMAGE.NO_PROFILE_PHOTO}
              </Text>
            </View>
          )}

          {/* 처리 중 오버레이 */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={styles.processingText}>
                {STRINGS.IMAGE.PROCESSING}
              </Text>
            </View>
          )}
        </View>

        {/* 선택된 이미지 미리보기 표시 */}
        {selectedImageUri && !isProcessing && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>
              {STRINGS.IMAGE.SELECTED_IMAGE}
            </Text>
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* 액션 버튼들 */}
        <View style={styles.actionsContainer}>
          {!selectedImageUri ? (
            // 이미지 선택 버튼들
            <>
              <MGButton
                variant="primary"
                size="large"
                fullWidth
                onPress={showImagePickerOptions}
                style={styles.actionButton}
                disabled={isUploading}
              >
                <View style={styles.buttonContent}>
                  <Camera size={SIZES.ICON.MD} color={COLORS.white} />
                  <Text style={styles.buttonText}>
                    {STRINGS.IMAGE.CHANGE_PHOTO}
                  </Text>
                </View>
              </MGButton>

              {currentPhotoUrl && (
                <MGButton
                  variant="danger"
                  size="medium"
                  fullWidth
                  onPress={deleteImage}
                  style={styles.actionButton}
                  disabled={isUploading}
                >
                  <View style={styles.buttonContent}>
                    <Trash2 size={SIZES.ICON.MD} color={COLORS.white} />
                    <Text style={styles.buttonText}>
                      {STRINGS.IMAGE.DELETE_PHOTO}
                    </Text>
                  </View>
                </MGButton>
              )}
            </>
          ) : (
            // 업로드/취소 버튼들
            <>
              <MGButton
                variant="success"
                size="large"
                fullWidth
                onPress={uploadImage}
                loading={isUploading}
                style={styles.actionButton}
              >
                <View style={styles.buttonContent}>
                  <Upload size={SIZES.ICON.MD} color={COLORS.white} />
                  <Text style={styles.buttonText}>
                    {STRINGS.IMAGE.UPLOAD_PHOTO}
                  </Text>
                </View>
              </MGButton>

              <MGButton
                variant="secondary"
                size="medium"
                fullWidth
                onPress={cancelSelection}
                style={styles.actionButton}
                disabled={isUploading}
              >
                <Text style={styles.cancelButtonText}>
                  {STRINGS.COMMON.CANCEL}
                </Text>
              </MGButton>
            </>
          )}
        </View>

        {/* 안내 텍스트 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>
            {STRINGS.IMAGE.PHOTO_GUIDELINES}
          </Text>
          <View style={styles.guidelinesList}>
            <Text style={styles.guidelineText}>
              • {STRINGS.IMAGE.GUIDELINE_1}
            </Text>
            <Text style={styles.guidelineText}>
              • {STRINGS.IMAGE.GUIDELINE_2}
            </Text>
            <Text style={styles.guidelineText}>
              • {STRINGS.IMAGE.GUIDELINE_3}
            </Text>
            <Text style={styles.guidelineText}>
              • {STRINGS.IMAGE.GUIDELINE_4}
            </Text>
          </View>
        </View>
      </View>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  profileImage: {
    width: SIZES.PROFILE_IMAGE.XLARGE, // 모바일 최적화 크기
    height: SIZES.PROFILE_IMAGE.XLARGE,
    borderRadius: SIZES.PROFILE_IMAGE.XLARGE / 2, // 완전 원형
    borderWidth: SIZES.BORDER_WIDTH.MEDIUM,
    borderColor: COLORS.primary,
    ...SHADOWS.md, // 적절한 그림자
  },
  placeholderContainer: {
    width: SIZES.PROFILE_IMAGE.XLARGE,
    height: SIZES.PROFILE_IMAGE.XLARGE,
    borderRadius: SIZES.PROFILE_IMAGE.XLARGE / 2,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: SIZES.BORDER_WIDTH.MEDIUM,
    borderColor: COLORS.gray300,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: SIZES.PROFILE_IMAGE.XLARGE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginTop: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  previewContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  previewTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  actionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    marginBottom: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  infoContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  guidelinesList: {
    gap: SPACING.xs,
  },
  guidelineText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
});

export default ProfilePhotoScreen;
