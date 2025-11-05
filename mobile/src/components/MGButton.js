/**
 * MindGarden 공통 버튼 컴포넌트 (React Native)
 * 
 * 웹의 frontend/src/components/common/MGButton.js를 참고하여 모바일용으로 변환
 * 
 * 주요 변경사항:
 * - <button> → <TouchableOpacity> 또는 <Pressable>
 * - className → style (StyleSheet)
 * - CSS 클래스 → StyleSheet 객체
 * 
 * @param {Object} props
 * @param {string} props.variant - primary, secondary, success, danger, warning, info, outline
 * @param {string} props.size - small, medium, large
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.loadingText - 로딩 중 표시 텍스트
 * @param {boolean} props.preventDoubleClick - 중복 클릭 방지
 * @param {Function} props.onPress - 클릭 핸들러
 * @param {React.ReactNode} props.children - 버튼 내용
 * @param {boolean} props.fullWidth - 전체 너비 사용
 */

import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY, SIZES } from '../constants/theme';
import { STRINGS } from '../constants/strings';

const MGButton = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  loadingText = STRINGS.COMMON.LOADING,
  preventDoubleClick = true,
  clickDelay = 1000,
  onPress,
  children,
  style,
  fullWidth = false,
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePress = useCallback(async () => {
    // 이미 처리 중이거나 비활성화된 경우 무시
    if (isProcessing || disabled || loading) {
      return;
    }

    // 중복 클릭 방지 활성화
    if (preventDoubleClick) {
      setIsProcessing(true);
    }

    try {
      // onPress 핸들러 실행
      if (onPress) {
        const result = onPress();
        // Promise인 경우 await, 아닌 경우 즉시 처리
        if (result && typeof result.then === 'function') {
          await result;
        }
      }
    } catch (error) {
      console.error('Button press handler error:', error);
    } finally {
      // 클릭 후 대기 시간 적용
      if (preventDoubleClick) {
        setTimeout(() => {
          setIsProcessing(false);
        }, clickDelay);
      } else {
        // preventDoubleClick이 false면 즉시 리셋
        setIsProcessing(false);
      }
    }
  }, [isProcessing, disabled, loading, preventDoubleClick, clickDelay, onPress]);

  // 버튼 스타일 구성
  // 외부 style prop의 borderWidth와 그림자를 제거하여 통일성 유지
  const customStyle = style ? {
    ...style,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: undefined,
    shadowOffset: undefined,
    shadowOpacity: undefined,
    shadowRadius: undefined,
    elevation: undefined,
  } : null;
  
  const baseStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled || loading || isProcessing ? styles.disabled : null,
    fullWidth ? styles.fullWidth : null,
    customStyle, // 외부 스타일 적용 (그림자 제거)
  ];
  
  // 항상 마지막에 테두리 및 그림자 제거 (통일성 유지)
  const buttonStyle = [
    ...baseStyle,
    { 
      borderWidth: 0, 
      borderColor: 'transparent',
      // 그림자 제거 - 모든 버튼 통일
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  ];

  // 텍스트 스타일 구성
  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled || loading || isProcessing ? styles.disabledText : null,
  ];

  const isDisabled = disabled || loading || isProcessing;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            color={variant === 'outline' ? COLORS[variant] || COLORS.primary : COLORS.white}
            size="small"
            style={styles.loading}
          />
        )}
        <Text style={textStyle}>
          {loading ? loadingText : children}
        </Text>
      </View>
      
      {/* 처리 중 오버레이 */}
      {isProcessing && !loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color={COLORS.white} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.sm, // 모바일에 더 적합한 둥글기
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 0, // 모든 버튼에서 테두리 제거
    borderColor: 'transparent', // 테두리 색상 제거
    // 그림자는 buttonStyle에서 통일 적용
  },
  
  // Variants
  primary: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  success: {
    backgroundColor: COLORS.success,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.error,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  warning: {
    backgroundColor: COLORS.warning,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  info: {
    backgroundColor: COLORS.info,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  
  // Sizes (모바일 터치 타겟 최적화)
  small: {
    paddingVertical: SPACING.button.padding.vertical,
    paddingHorizontal: SPACING.button.padding.horizontal,
    minHeight: SIZES.BUTTON_HEIGHT.SM, // 터치 타겟 크기 준수
    minWidth: SIZES.TOUCH_TARGET.MINIMUM,
  },
  medium: {
    paddingVertical: SPACING.button.padding.vertical,
    paddingHorizontal: SPACING.button.padding.horizontal,
    minHeight: SIZES.BUTTON_HEIGHT.MD, // 터치 타겟 크기 준수
    minWidth: SIZES.TOUCH_TARGET.MINIMUM,
  },
  large: {
    paddingVertical: SPACING.button.padding.vertical,
    paddingHorizontal: SPACING.button.padding.horizontal,
    minHeight: SIZES.BUTTON_HEIGHT.LG, // 터치 타겟 크기 준수
    minWidth: SIZES.TOUCH_TARGET.MINIMUM,
  },
  
  // States
  disabled: {
    opacity: 0.6,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  successText: {
    color: COLORS.white,
  },
  dangerText: {
    color: COLORS.white,
  },
  warningText: {
    color: COLORS.white,
  },
  infoText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  
  smallText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  mediumText: {
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  largeText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  
  disabledText: {
    opacity: 0.7,
  },
  
  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loading: {
    marginRight: SPACING.button.gap, // 버튼 내 요소 간격
  },
  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayDark,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MGButton;

