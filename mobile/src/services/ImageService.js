/**
 * 이미지 처리 서비스
 * 프로필 사진 촬영, 선택, 편집, 업로드 기능
 */

import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ImagePicker from 'react-native-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import ImageResizer from 'react-native-image-resizer';
import { STRINGS } from '../constants/strings';

class ImageService {
  constructor() {
    this.currentImageUri = null;
  }

  /**
   * 카메라 권한 확인 및 요청
   */
  async requestCameraPermission() {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.CAMERA);
        return result === RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: STRINGS.IMAGE.CAMERA_PERMISSION_TITLE,
            message: STRINGS.IMAGE.CAMERA_PERMISSION_MESSAGE,
            buttonNeutral: STRINGS.COMMON.CANCEL,
            buttonNegative: STRINGS.COMMON.DENY,
            buttonPositive: STRINGS.COMMON.ALLOW,
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('카메라 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * 갤러리 권한 확인 및 요청
   */
  async requestGalleryPermission() {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        return result === RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: STRINGS.IMAGE.GALLERY_PERMISSION_TITLE,
            message: STRINGS.IMAGE.GALLERY_PERMISSION_MESSAGE,
            buttonNeutral: STRINGS.COMMON.CANCEL,
            buttonNegative: STRINGS.COMMON.DENY,
            buttonPositive: STRINGS.COMMON.ALLOW,
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('갤러리 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * 카메라로 사진 촬영 (네이티브 카메라 직접 호출)
   */
  async takePhotoFromCamera(options = {}) {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          STRINGS.ERROR.ERROR,
          STRINGS.IMAGE.CAMERA_PERMISSION_DENIED
        );
        return null;
      }

      // react-native-image-crop-picker를 사용하여 네이티브 카메라 직접 호출
      const defaultOptions = {
        cropping: false, // 즉시 촬영 (크롭 옵션)
        width: 2000,
        height: 2000,
        compressImageMaxWidth: 2000,
        compressImageMaxHeight: 2000,
        compressImageQuality: 0.8,
        includeBase64: false,
        mediaType: 'photo',
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // 네이티브 카메라 앱 직접 호출
      const image = await ImageCropPicker.openCamera(mergedOptions);
      
      // 응답 형식: { path: string, width: number, height: number, ... }
      if (image && image.path) {
        const imageUri = image.path;
        this.currentImageUri = imageUri;
        return imageUri;
      }
      
      return null;
    } catch (error) {
      console.error('카메라 촬영 실패:', error);
      // 사용자가 취소한 경우는 에러로 처리하지 않음
      if (error.message !== 'User cancelled image selection' && error.message !== 'User canceled') {
        Alert.alert(STRINGS.ERROR.ERROR, STRINGS.IMAGE.CAMERA_ERROR);
      }
      return null;
    }
  }

  /**
   * 갤러리에서 사진 선택 (네이티브 갤러리 직접 호출)
   */
  async selectPhotoFromGallery(options = {}) {
    try {
      const hasPermission = await this.requestGalleryPermission();
      if (!hasPermission) {
        Alert.alert(
          STRINGS.ERROR.ERROR,
          STRINGS.IMAGE.GALLERY_PERMISSION_DENIED
        );
        return null;
      }

      // react-native-image-crop-picker를 사용하여 네이티브 갤러리 직접 호출
      const defaultOptions = {
        cropping: false, // 선택만 (크롭 옵션)
        width: 2000,
        height: 2000,
        compressImageMaxWidth: 2000,
        compressImageMaxHeight: 2000,
        compressImageQuality: 0.8,
        includeBase64: false,
        mediaType: 'photo',
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // 네이티브 갤러리 앱 직접 호출
      const image = await ImageCropPicker.openPicker(mergedOptions);
      
      // 응답 형식: { path: string, width: number, height: number, ... }
      if (image && image.path) {
        const imageUri = image.path;
        this.currentImageUri = imageUri;
        return imageUri;
      }
      
      return null;
    } catch (error) {
      console.error('갤러리 선택 실패:', error);
      // 사용자가 취소한 경우는 에러로 처리하지 않음
      if (error.message !== 'User cancelled image selection' && error.message !== 'User canceled') {
        Alert.alert(STRINGS.ERROR.ERROR, STRINGS.IMAGE.GALLERY_ERROR);
      }
      return null;
    }
  }

  /**
   * 이미지 크롭
   */
  async cropImage(imageUri, cropOptions = {}) {
    try {
      const defaultOptions = {
        cropping: true,
        width: 300,
        height: 300,
        cropperCircleOverlay: true,
        compressImageMaxWidth: 300,
        compressImageMaxHeight: 300,
        compressImageQuality: 0.8,
        includeBase64: false,
        cropperToolbarTitle: STRINGS.IMAGE.CROP_TITLE,
        cropperChooseText: STRINGS.COMMON.CONFIRM,
        cropperCancelText: STRINGS.COMMON.CANCEL,
      };

      const mergedOptions = { ...defaultOptions, ...cropOptions };

      const croppedImage = await ImageCropPicker.openCropper({
        path: imageUri,
        ...mergedOptions,
      });

      return croppedImage.path;
    } catch (error) {
      console.error('이미지 크롭 실패:', error);
      if (error.message !== 'User cancelled image selection') {
        Alert.alert(STRINGS.ERROR.ERROR, STRINGS.IMAGE.CROP_ERROR);
      }
      return null;
    }
  }

  /**
   * 이미지 리사이즈 및 압축
   */
  async resizeImage(imageUri, options = {}) {
    try {
      const defaultOptions = {
        maxWidth: 800,
        maxHeight: 800,
        compressFormat: 'JPEG',
        quality: 80,
        rotation: 0,
        outputPath: null,
        keepAspectRatio: true,
      };

      const mergedOptions = { ...defaultOptions, ...options };

      const resizedImage = await ImageResizer.createResizedImage(
        imageUri,
        mergedOptions.maxWidth,
        mergedOptions.maxHeight,
        mergedOptions.compressFormat,
        mergedOptions.quality,
        mergedOptions.rotation,
        mergedOptions.outputPath,
        mergedOptions.keepAspectRatio
      );

      return resizedImage.uri;
    } catch (error) {
      console.error('이미지 리사이즈 실패:', error);
      return imageUri; // 리사이즈 실패 시 원본 반환
    }
  }

  /**
   * 이미지 처리 파이프라인 (촬영/선택 → 크롭 → 리사이즈)
   */
  async processImage(imageUri, processOptions = {}) {
    try {
      let processedUri = imageUri;

      // 크롭 적용
      if (processOptions.enableCrop !== false) {
        const croppedUri = await this.cropImage(processedUri, processOptions.cropOptions);
        if (croppedUri) {
          processedUri = croppedUri;
        }
      }

      // 리사이즈 적용
      if (processOptions.enableResize !== false) {
        const resizedUri = await this.resizeImage(processedUri, processOptions.resizeOptions);
        if (resizedUri) {
          processedUri = resizedUri;
        }
      }

      return processedUri;
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      return imageUri;
    }
  }

  /**
   * 서버로 이미지 업로드
   */
  async uploadImage(imageUri, uploadOptions = {}) {
    try {
      const formData = new FormData();

      // 이미지 파일 정보 생성
      const filename = imageUri.split('/').pop();
      const fileType = filename.split('.').pop();

      formData.append('image', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: filename,
        type: `image/${fileType}`,
      });

      // 추가 데이터
      if (uploadOptions.userId) {
        formData.append('userId', uploadOptions.userId);
      }

      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return result.imageUrl;
      } else {
        throw new Error(STRINGS.ERROR.SAVE_FAILED);
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 이미지 선택 액션 시트 표시
   */
  showImagePickerActionSheet(onImageSelected) {
    const options = [
      { text: STRINGS.IMAGE.TAKE_PHOTO, onPress: () => this.handleTakePhoto(onImageSelected) },
      { text: STRINGS.IMAGE.CHOOSE_FROM_GALLERY, onPress: () => this.handleChooseFromGallery(onImageSelected) },
      { text: STRINGS.COMMON.CANCEL, style: 'cancel' },
    ];

    if (Platform.OS === 'ios') {
      // iOS는 ActionSheetIOS 사용
      const ActionSheetIOS = require('react-native').ActionSheetIOS;
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options.map(opt => opt.text),
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          const selectedOption = options[buttonIndex];
          if (selectedOption && selectedOption.onPress) {
            selectedOption.onPress();
          }
        }
      );
    } else {
      // Android는 Alert 사용
      Alert.alert(
        STRINGS.IMAGE.SELECT_IMAGE,
        STRINGS.IMAGE.SELECT_IMAGE_MESSAGE,
        [
          { text: STRINGS.IMAGE.TAKE_PHOTO, onPress: () => this.handleTakePhoto(onImageSelected) },
          { text: STRINGS.IMAGE.CHOOSE_FROM_GALLERY, onPress: () => this.handleChooseFromGallery(onImageSelected) },
          { text: STRINGS.COMMON.CANCEL, style: 'cancel' },
        ]
      );
    }
  }

  /**
   * 카메라 촬영 핸들러
   */
  async handleTakePhoto(onImageSelected) {
    try {
      const imageUri = await this.takePhotoFromCamera();
      if (imageUri && onImageSelected) {
        onImageSelected(imageUri);
      }
    } catch (error) {
      console.error('카메라 촬영 핸들러 실패:', error);
    }
  }

  /**
   * 갤러리 선택 핸들러
   */
  async handleChooseFromGallery(onImageSelected) {
    try {
      const imageUri = await this.selectPhotoFromGallery();
      if (imageUri && onImageSelected) {
        onImageSelected(imageUri);
      }
    } catch (error) {
      console.error('갤러리 선택 핸들러 실패:', error);
    }
  }

  /**
   * 현재 선택된 이미지 URI 가져오기
   */
  getCurrentImageUri() {
    return this.currentImageUri;
  }

  /**
   * 이미지 정리
   */
  cleanup() {
    this.currentImageUri = null;
  }

  /**
   * 싱글톤 인스턴스
   */
  static getInstance() {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }
}

// 싱글톤 내보내기
const imageService = new ImageService();
export default imageService;
