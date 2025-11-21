"use client";

import React, { useState, useCallback, ReactNode } from "react";
import styles from "./MGButton.module.css";

/**
 * MindGarden 공통 버튼 컴포넌트 (TypeScript)
 * - 중복 클릭 방지
 * - 로딩 상태 표시
 * - 다양한 스타일 지원
 * - 접근성 고려
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-XX
 */
interface MGButtonProps {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "outline";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  preventDoubleClick?: boolean;
  clickDelay?: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  className?: string;
  type?: "button" | "submit" | "reset";
  children: ReactNode;
  style?: React.CSSProperties;
  title?: string;
  fullWidth?: boolean;
}

export default function MGButton({
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  loadingText = "처리 중...",
  preventDoubleClick = true,
  clickDelay = 1000, // 1초 대기
  onClick,
  className = "",
  type = "button",
  children,
  style = {},
  title = "",
  fullWidth = false,
  ...props
}: MGButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      // 이미 처리 중이거나 비활성화된 경우 무시
      if (isProcessing || disabled || loading) {
        e.preventDefault();
        return;
      }

      // 중복 클릭 방지 활성화
      if (preventDoubleClick) {
        setIsProcessing(true);
      }

      try {
        // onClick 핸들러 실행
        if (onClick) {
          await onClick(e);
        }
      } catch (error) {
        console.error("Button click handler error:", error);
      } finally {
        // 클릭 후 대기 시간 적용
        if (preventDoubleClick) {
          setTimeout(() => {
            setIsProcessing(false);
          }, clickDelay);
        }
      }
    },
    [isProcessing, disabled, loading, preventDoubleClick, clickDelay, onClick]
  );

  // 버튼 클래스 구성
  const buttonClasses = [
    styles.mgButton,
    styles[`mgButton${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`mgButton${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled || loading || isProcessing ? styles.mgButtonDisabled : "",
    fullWidth ? styles.mgButtonFullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // 버튼 상태 확인
  const isDisabled = disabled || loading || isProcessing;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      style={style}
      title={title}
      {...props}
    >
      <span className={styles.mgButtonContent}>
        {loading && (
          <span className={styles.mgButtonLoading} aria-hidden="true">
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
          </span>
        )}
        <span
          className={`${styles.mgButtonText} ${loading ? styles.mgButtonTextLoading : ""}`}
        >
          {loading ? loadingText : children}
        </span>
      </span>
      {isProcessing && !loading && (
        <span className={styles.mgButtonProcessingOverlay} aria-hidden="true" />
      )}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}

