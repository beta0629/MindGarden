"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import "../../styles/components/progressive-input-field.css";

interface ProgressiveInputFieldProps {
  index: number;
  currentIndex: number;
  label: string;
  children: ReactNode;
  required?: boolean;
  validation?: (value: string) => boolean;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  hint?: string;
  isCompleted?: boolean;
}

/**
 * 순차적 진행 입력 필드 컴포넌트
 * iOS/Android 설정 화면 스타일의 하나씩 나타나는 입력 필드
 * 
 * @author Trinity Team
 * @version 1.0.0
 * @since 2025-12-09
 */
export default function ProgressiveInputField({
  index,
  currentIndex,
  label,
  children,
  required = false,
  validation,
  onComplete,
  autoFocus = false,
  placeholder,
  hint,
  isCompleted = false,
}: ProgressiveInputFieldProps) {
  const [isVisible, setIsVisible] = useState(index === 0 || index <= currentIndex);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 현재 인덱스까지 모두 표시 (수정 가능하도록)
    if (currentIndex >= index) {
      setIsVisible(true);
      
      // 자동 포커스
      if (currentIndex === index && autoFocus && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      }
    }
  }, [currentIndex, index, autoFocus]);


  if (!isVisible) {
    return null;
  }

  const isActive = currentIndex === index;
  const isPast = currentIndex > index;

  return (
    <div
      className={`trinity-progressive-field ${
        isActive ? "trinity-progressive-field--active" : ""
      } ${isPast ? "trinity-progressive-field--completed" : ""}`}
      data-index={index}
    >
      <label className="trinity-progressive-field__label">
        {label}
        {required && <span className="trinity-progressive-field__required"> *</span>}
      </label>
      <div className="trinity-progressive-field__input-wrapper">
        {children}
        {isCompleted && (
          <div className="trinity-progressive-field__checkmark">✓</div>
        )}
      </div>
      {hint && (
        <div className="trinity-progressive-field__hint">{hint}</div>
      )}
    </div>
  );
}

