/**
 * Step 1: 기본 정보 입력 컴포넌트 (순차적 진행 방식)
 * iOS/Android 설정 화면 스타일
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import ProgressiveInputField from "./ProgressiveInputField";
import EmailInputProgressive from "./EmailInputProgressive";
import type { OnboardingFormData } from "../../hooks/useOnboarding";
import type { CommonCode } from "../../utils/commonCodeUtils";

interface Step1BasicInfoProgressiveProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData | ((prev: OnboardingFormData) => OnboardingFormData)) => void;
  onStepComplete?: () => void;
  emailFormatError: string | null;
  emailDuplicateChecked: boolean;
  emailDuplicateChecking: boolean;
  emailDuplicateError: string | null;
  emailVerified: boolean;
  emailVerificationCode: string;
  emailVerificationSending: boolean;
  emailVerificationVerifying: boolean;
  emailVerificationTimeLeft: number | null;
  resendCooldown: number;
  setEmailVerified: (verified: boolean) => void;
  setEmailVerificationCode: (code: string) => void;
  setEmailDuplicateChecked: (checked: boolean) => void;
  setEmailDuplicateError: (error: string | null) => void;
  setEmailVerificationTimeLeft: (time: number | null) => void;
  setVerificationAttempts: (attempts: number) => void;
  sendEmailVerificationCode: (email: string) => void;
  verifyEmailCode: (email: string, code: string) => void;
  validateEmailFormat: (email: string) => { valid: boolean; error?: string };
  checkEmailDuplicate: (email: string) => Promise<{ 
    email: string; 
    isDuplicate: boolean; 
    available: boolean;
    message: string;
    status: string | null;
  }>;
  setError: (error: string | null) => void;
  setEmailFormatError: (error: string | null) => void;
  regionCodes: Array<{ codeValue: string; koreanName: string; codeLabel?: string }>;
  loadRegionCodes: () => Promise<void>;
}

export default function Step1BasicInfoProgressive({
  formData,
  setFormData,
  onStepComplete,
  emailFormatError,
  emailDuplicateChecked,
  emailDuplicateChecking,
  emailDuplicateError,
  emailVerified,
  emailVerificationCode,
  emailVerificationSending,
  emailVerificationVerifying,
  emailVerificationTimeLeft,
  resendCooldown,
  setEmailVerified,
  setEmailVerificationCode,
  setEmailDuplicateChecked,
  setEmailDuplicateError,
  setEmailVerificationTimeLeft,
  setVerificationAttempts,
  sendEmailVerificationCode,
  verifyEmailCode,
  validateEmailFormat,
  checkEmailDuplicate,
  setError,
  setEmailFormatError,
  regionCodes,
  loadRegionCodes,
}: Step1BasicInfoProgressiveProps) {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [completedFields, setCompletedFields] = useState<Set<number>>(new Set());
  // 렌더링 중 상태 업데이트 방지를 위한 ref
  const pendingFieldCompleteRef = useRef<{ fieldId: string; value: string; fieldIdx: number } | null>(null);

  // 지역 코드 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    if (regionCodes.length === 0) {
      loadRegionCodes();
    }
  }, [regionCodes.length, loadRegionCodes]);

  // 필드 정의 (regionCodes 및 formData.adminPassword가 변경될 때마다 재생성)
  const fields: Array<{
    id: string;
    label: string;
    required: boolean;
    validation: (value: string) => boolean;
    placeholder: string;
    hint?: string;
    isSelect?: boolean;
    options?: Array<{ value: string; label: string }>;
  }> = useMemo(() => [
    {
      id: 'tenantName',
      label: '회사 (상호)',
      required: true,
      validation: (value: string) => value.trim().length >= 2,
      placeholder: '회사명 또는 상호를 입력하세요',
      hint: '회사명 또는 상호를 입력하세요. 이 정보는 테넌트 식별에 사용됩니다.',
    },
    {
      id: 'brandName',
      label: '브랜드명 (화면 표시명)',
      required: false,
      validation: (value: string) => !value || value.trim().length >= 1,
      placeholder: '브랜드명을 입력하세요 (선택사항)',
      hint: '화면 헤더 등에 표시될 브랜드명입니다. 대부분의 경우 회사명과 동일하므로 입력하지 않으면 회사명이 자동으로 사용됩니다. (예: 회사명이 "주식회사 오케이교육"이고 브랜드명이 "오케이아카데미"인 경우에만 입력)',
    },
    {
      id: 'regionCode',
      label: '지역',
      required: false,
      validation: (value: string) => true, // 선택사항이므로 항상 유효
      placeholder: '지역을 선택하세요 (선택사항)',
      isSelect: true, // 드롭다운 필드
      options: (() => {
        // 중복 제거: codeValue 기준으로 중복 제거
        const uniqueCodes = new Map<string, typeof regionCodes[0]>();
        regionCodes.forEach(code => {
          if (!uniqueCodes.has(code.codeValue)) {
            uniqueCodes.set(code.codeValue, code);
          }
        });
        return Array.from(uniqueCodes.values())
          .sort((a, b) => {
            const sortA = (a as any).sortOrder || 0;
            const sortB = (b as any).sortOrder || 0;
            return sortA - sortB;
          })
          .map(code => ({
            value: code.codeValue,
            label: code.koreanName || code.codeLabel || code.codeValue,
          }));
      })(),
    },
    {
      id: 'contactEmail',
      label: '이메일',
      required: true,
      validation: (value: string) => {
        const result = validateEmailFormat(value);
        return result.valid && emailDuplicateChecked && emailVerified;
      },
      placeholder: 'example@email.com',
    },
    {
      id: 'contactPhone',
      label: '연락처',
      required: false,
      validation: (value: string) => !value || value.trim().length >= 10,
      placeholder: '010-1234-5678',
    },
    {
      id: 'adminPassword',
      label: '관리자 비밀번호',
      required: true,
      validation: (value: string) => value.length >= 8,
      placeholder: '최소 8자 이상',
      hint: '테넌트 승인 시 관리자 계정 생성에 사용됩니다.',
    },
    {
      id: 'adminPasswordConfirm',
      label: '관리자 비밀번호 확인',
      required: true,
      validation: (value: string) => value === formData.adminPassword && value.length >= 8,
      placeholder: '비밀번호를 다시 입력하세요',
    },
  ], [regionCodes, formData.adminPassword, emailDuplicateChecked, emailVerified, emailFormatError]);

  // 완료 필드 업데이트를 useEffect로 처리 (렌더링 완료 후)
  // fields 정의 이후에 위치해야 함
  useEffect(() => {
    if (pendingFieldCompleteRef.current) {
      const { fieldId, value, fieldIdx } = pendingFieldCompleteRef.current;
      pendingFieldCompleteRef.current = null;
      
      const field = fields[fieldIdx];
      if (field && field.validation && field.validation(value)) {
        setCompletedFields(prevFields => {
          const newSet = new Set(prevFields);
          newSet.add(fieldIdx);
          
          // 마지막 필드이고 모든 필수 필드가 완료되었는지 확인
          if (fieldIdx === fields.length - 1) {
            // 모든 필수 필드가 완료되었는지 확인
            const allRequiredCompleted = fields.every((f, idx) => {
              const fieldValue = idx === fieldIdx ? value : (formData as any)[f.id] || '';
              if (f.required) {
                const isCompleted = idx === fieldIdx || newSet.has(idx);
                return isCompleted && f.validation && f.validation(fieldValue);
              }
              const fieldValue2 = (formData as any)[f.id] || '';
              return !fieldValue2 || idx === fieldIdx || newSet.has(idx);
            });
            
            if (allRequiredCompleted && onStepComplete) {
              // 약간의 지연 후 다음 단계로 이동 (UI 업데이트 후)
              setTimeout(() => {
                onStepComplete();
              }, 300);
            }
          } else {
            // 다음 필드로 자동 이동 (마지막 필드가 아닌 경우)
            setTimeout(() => {
              setCurrentFieldIndex(fieldIdx + 1);
            }, 300);
          }
          
          return newSet;
        });
      }
    }
  }, [formData, fields, onStepComplete]);

  const handleFieldComplete = (fieldId: string, value: string) => {
    // 폼 데이터 업데이트만 수행 (렌더링 중 상태 업데이트 방지)
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));

    // 완료 필드 업데이트는 useEffect로 처리 (렌더링 완료 후)
    const currentFieldIdx = fields.findIndex(f => f.id === fieldId);
    if (currentFieldIdx >= 0) {
      const field = fields[currentFieldIdx];
      // 검증 통과 시에만 완료 표시
      if (field.validation && field.validation(value)) {
        // ref에 저장하여 useEffect에서 처리
        pendingFieldCompleteRef.current = {
          fieldId,
          value,
          fieldIdx: currentFieldIdx,
        };
      }
    }
  };

  const handleNextField = () => {
    // 현재 필드가 유효한지 확인
    if (!isCurrentFieldValid()) {
      return; // 유효하지 않으면 이동하지 않음
    }

    // 현재 필드를 완료 상태로 표시
    if (!completedFields.has(currentFieldIndex)) {
      setCompletedFields(prev => new Set(prev).add(currentFieldIndex));
    }

    // 다음 필드로 이동
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    }
  };

  const handlePreviousField = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));

    // 값이 변경되면 완료 상태 업데이트
    const fieldIdx = fields.findIndex(f => f.id === fieldId);
    if (fieldIdx >= 0) {
      const field = fields[fieldIdx];
      if (field.validation && field.validation(value)) {
        setCompletedFields(prev => new Set(prev).add(fieldIdx));
      } else {
        setCompletedFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(fieldIdx);
          return newSet;
        });
      }
    }
  };


  const getFieldValue = (fieldId: string): string => {
    return (formData as any)[fieldId] || '';
  };

  // 모든 필수 필드가 완료되었는지 확인
  const areAllRequiredFieldsCompleted = (): boolean => {
    return fields.every((field, index) => {
      const value = getFieldValue(field.id);
      if (field.required) {
        // 필수 필드는 완료 상태에 있어야 하고, 검증도 통과해야 함
        return completedFields.has(index) && field.validation(value);
      }
      // 선택 필드는 완료 상태이거나 값이 없어도 됨
      return !value || completedFields.has(index);
    });
  };

  // 현재 필드의 값이 유효한지 확인
  const isCurrentFieldValid = (): boolean => {
    const currentField = fields[currentFieldIndex];
    if (!currentField) return false;
    
    const value = getFieldValue(currentField.id);
    if (currentField.required && !value.trim()) {
      return false;
    }
    
    // 이메일 필드의 경우 최신 상태를 직접 확인
    if (currentField.id === 'contactEmail') {
      const emailFormatResult = validateEmailFormat(value);
      return emailFormatResult.valid && emailDuplicateChecked && emailVerified;
    }
    
    return currentField.validation ? currentField.validation(value) : true;
  };

  return (
    <div className={COMPONENT_CSS.ONBOARDING.STEP}>
      <h3 className="trinity-onboarding__step-title">기본 정보 입력</h3>
      <p className="trinity-onboarding__step-description">
        각 항목을 순서대로 입력해주세요.
      </p>

      <div className="trinity-progressive-fields">
        {fields.map((field, index) => (
          <ProgressiveInputField
            key={field.id}
            index={index}
            currentIndex={currentFieldIndex}
            label={field.label}
            required={field.required}
            validation={field.validation}
            onComplete={(value) => handleFieldComplete(field.id, value)}
            autoFocus={index === currentFieldIndex}
            placeholder={field.placeholder}
            hint={field.hint}
            isCompleted={completedFields.has(index)}
          >
            {field.id === 'adminPassword' || field.id === 'adminPasswordConfirm' ? (
              <input
                type="password"
                value={getFieldValue(field.id)}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  // 필수 필드는 값이 있어야 하고 검증 통과해야 함
                  if (field.required) {
                    if (value && field.validation && field.validation(value)) {
                      handleFieldComplete(field.id, value);
                    }
                  } else {
                    // 선택 필드: 값이 없거나 검증 통과하면 완료
                    if (!value || (field.validation && field.validation(value))) {
                      handleFieldComplete(field.id, value);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  const value = e.currentTarget.value;
                  if (e.key === 'Enter') {
                    if (field.required) {
                      // 필수 필드: 검증 통과하면 완료
                      if (value && field.validation && field.validation(value)) {
                        handleFieldComplete(field.id, value);
                      }
                    } else {
                      // 선택 필드: 값이 없거나 검증 통과하면 완료
                      if (!value || (field.validation && field.validation(value))) {
                        handleFieldComplete(field.id, value);
                      }
                    }
                  }
                }}
                placeholder={field.placeholder}
                className={COMPONENT_CSS.ONBOARDING.INPUT}
                required={field.required}
                minLength={field.id.includes('Password') ? 8 : undefined}
              />
            ) : field.id === 'regionCode' ? (
              <select
                value={getFieldValue(field.id)}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFieldChange(field.id, value);
                  // 선택사항이므로 값이 있으면 완료 처리, 없어도 완료 처리
                  handleFieldComplete(field.id, value);
                }}
                className={COMPONENT_CSS.ONBOARDING.INPUT}
              >
                <option value="">지역을 선택하세요 (선택사항)</option>
                {field.options && field.options.length > 0 ? (
                  field.options.map((option, optionIndex) => (
                    <option key={`${option.value}-${optionIndex}`} value={option.value}>
                      {option.label}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {regionCodes.length === 0 ? '지역 정보를 불러오는 중...' : '지역 정보가 없습니다'}
                  </option>
                )}
              </select>
            ) : field.id === 'contactEmail' ? (
              <EmailInputProgressive
                value={getFieldValue(field.id)}
                onChange={(value) => {
                  handleFieldChange(field.id, value);
                  // 이메일 형식 검증
                  if (value && value.includes('@')) {
                    const validation = validateEmailFormat(value);
                    if (!validation.valid) {
                      setEmailFormatError(validation.error || null);
                    } else {
                      setEmailFormatError(null);
                    }
                  } else {
                    setEmailFormatError(null);
                  }
                }}
                onValidationChange={(isValid) => {
                  // 검증 상태에 따라 completedFields 업데이트 (이메일 검증까지 완료된 경우만)
                  const fieldIdx = fields.findIndex(f => f.id === field.id);
                  if (fieldIdx >= 0) {
                    const emailValue = getFieldValue(field.id);
                    const emailFormatResult = validateEmailFormat(emailValue);
                    // 이메일 형식이 유효하고, 중복 확인 완료, 인증 완료일 때만 완료 처리
                    if (emailFormatResult.valid && emailDuplicateChecked && emailVerified) {
                      setCompletedFields(prev => {
                        const newSet = new Set(prev);
                        newSet.add(fieldIdx);
                        return newSet;
                      });
                      // 필드가 완료되면 자동으로 다음 필드로 이동
                      if (fieldIdx < fields.length - 1) {
                        setTimeout(() => {
                          setCurrentFieldIndex(fieldIdx + 1);
                        }, 300);
                      }
                    } else {
                      setCompletedFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(fieldIdx);
                        return newSet;
                      });
                    }
                  }
                }}
                validateEmailFormat={validateEmailFormat}
                placeholder={field.placeholder}
                emailFormatError={emailFormatError}
                emailDuplicateChecked={emailDuplicateChecked}
                emailDuplicateChecking={emailDuplicateChecking}
                emailDuplicateError={emailDuplicateError}
                emailVerified={emailVerified}
                emailVerificationCode={emailVerificationCode}
                emailVerificationSending={emailVerificationSending}
                emailVerificationVerifying={emailVerificationVerifying}
                emailVerificationTimeLeft={emailVerificationTimeLeft}
                resendCooldown={resendCooldown}
                onCheckDuplicate={async () => {
                  const email = getFieldValue(field.id);
                  if (email) {
                    try {
                      const result = await checkEmailDuplicate(email);
                      if (result.available) {
                        setEmailDuplicateChecked(true);
                        setEmailDuplicateError(null);
                      } else {
                        setEmailDuplicateError(result.message);
                        setEmailDuplicateChecked(false);
                      }
                    } catch (err) {
                      setEmailDuplicateError(err instanceof Error ? err.message : '이메일 중복 확인에 실패했습니다.');
                    }
                  }
                }}
                onResetDuplicate={() => {
                  setEmailDuplicateChecked(false);
                  setEmailDuplicateError(null);
                  setEmailVerified(false);
                  setEmailVerificationCode('');
                }}
                onSendVerificationCode={sendEmailVerificationCode}
                onVerifyCode={verifyEmailCode}
                setEmailVerificationCode={setEmailVerificationCode}
                setEmailFormatError={setEmailFormatError}
              />
            ) : (
              <input
                type={field.id === 'contactPhone' ? 'tel' : 'text'}
                value={getFieldValue(field.id)}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  // 필수 필드는 값이 있어야 하고, 선택 필드는 값이 있거나 없어도 됨
                  if (field.required) {
                    // 필수 필드: 값이 있고 검증 통과하면 완료
                    if (value && field.validation && field.validation(value)) {
                      handleFieldComplete(field.id, value);
                    }
                  } else {
                    // 선택 필드: 값이 없거나 검증 통과하면 완료
                    if (!value || (field.validation && field.validation(value))) {
                      handleFieldComplete(field.id, value);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  const value = e.currentTarget.value;
                  if (e.key === 'Enter') {
                    if (field.required) {
                      // 필수 필드: 검증 통과하면 완료
                      if (value && field.validation && field.validation(value)) {
                        handleFieldComplete(field.id, value);
                      }
                    } else {
                      // 선택 필드: 값이 없거나 검증 통과하면 완료
                      if (!value || (field.validation && field.validation(value))) {
                        handleFieldComplete(field.id, value);
                      }
                    }
                  }
                }}
                placeholder={field.placeholder}
                className={COMPONENT_CSS.ONBOARDING.INPUT}
                required={field.required}
              />
            )}
          </ProgressiveInputField>
        ))}
      </div>

      {/* 진행 상황 표시 */}
      <div className="trinity-progressive-fields__progress">
        <div className="trinity-progressive-fields__progress-bar">
          <div
            className="trinity-progressive-fields__progress-fill"
            style={{ 
              width: `${(fields.filter((f, idx) => f.required && completedFields.has(idx)).length / fields.filter(f => f.required).length) * 100}%` 
            }}
          />
        </div>
        <div className="trinity-progressive-fields__progress-text">
          필수 필드 {fields.filter((f, idx) => f.required && completedFields.has(idx)).length} / {fields.filter(f => f.required).length} 완료
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="trinity-progressive-fields__navigation">
        <button
          type="button"
          onClick={handlePreviousField}
          disabled={currentFieldIndex === 0}
          className="trinity-progressive-fields__nav-button trinity-progressive-fields__nav-button--previous"
        >
          ← 이전
        </button>
        <button
          type="button"
          onClick={() => {
            // 현재 필드가 유효하지 않으면 아무것도 하지 않음
            if (!isCurrentFieldValid()) {
              return;
            }

            // 현재 필드를 완료 상태로 표시
            if (!completedFields.has(currentFieldIndex)) {
              setCompletedFields(prev => new Set(prev).add(currentFieldIndex));
            }

            // 마지막 필드이고 모든 필수 필드가 완료되었을 때만 다음 단계로 이동
            if (currentFieldIndex === fields.length - 1) {
              if (areAllRequiredFieldsCompleted()) {
                if (onStepComplete) {
                  onStepComplete();
                }
              }
            } else {
              // 다음 필드로 이동
              handleNextField();
            }
          }}
          disabled={
            !isCurrentFieldValid() || 
            (currentFieldIndex === fields.length - 1 && !areAllRequiredFieldsCompleted())
          }
          className="trinity-progressive-fields__nav-button trinity-progressive-fields__nav-button--next"
        >
          {currentFieldIndex === fields.length - 1 && areAllRequiredFieldsCompleted()
            ? "다음 단계 →"
            : "다음 →"}
        </button>
      </div>
    </div>
  );
}

