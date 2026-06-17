/**
 * Step 1: 기본 정보 입력 컴포넌트 (순차적 진행 방식)
 * 휴대폰 SMS 인증 — Core Solution /api/v1/auth/sms/*
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import ProgressiveInputField from "./ProgressiveInputField";
import PhoneInputProgressive from "./PhoneInputProgressive";
import type { OnboardingFormData } from "../../hooks/useOnboarding";
import { validatePhoneFormat } from "../../utils/phoneUtils";

interface Step1BasicInfoProgressiveProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData | ((prev: OnboardingFormData) => OnboardingFormData)) => void;
  onStepComplete?: () => void;
  phoneFormatError: string | null;
  phoneVerified: boolean;
  phoneVerificationCode: string;
  phoneVerificationSending: boolean;
  phoneVerificationVerifying: boolean;
  phoneVerificationTimeLeft: number | null;
  resendCooldown: number;
  phoneOtpSentMessage: string | null;
  setPhoneVerified: (verified: boolean) => void;
  setPhoneVerificationCode: (code: string) => void;
  setPhoneVerificationTimeLeft: (time: number | null) => void;
  setVerificationAttempts: (attempts: number) => void;
  sendPhoneVerificationCode: (phone: string) => void;
  verifyPhoneCode: (phone: string, code: string) => void;
  resetPhoneVerification: () => void;
  validateEmailFormat: (email: string) => { valid: boolean; error?: string };
  setPhoneFormatError: (error: string | null) => void;
  subdomainDuplicateChecked: boolean;
  subdomainDuplicateChecking: boolean;
  subdomainDuplicateError: string | null;
  subdomainPreview: string | null;
  setSubdomainDuplicateChecked: (checked: boolean) => void;
  setSubdomainDuplicateError: (error: string | null) => void;
  setSubdomainPreview: (preview: string | null) => void;
  checkSubdomainDuplicate: (subdomain: string) => Promise<void>;
  setError: (error: string | null) => void;
  regionCodes: Array<{ codeValue: string; koreanName: string; codeLabel?: string }>;
  loadRegionCodes: () => Promise<void>;
}

export default function Step1BasicInfoProgressive({
  formData,
  setFormData,
  onStepComplete,
  phoneFormatError,
  phoneVerified,
  phoneVerificationCode,
  phoneVerificationSending,
  phoneVerificationVerifying,
  phoneVerificationTimeLeft,
  resendCooldown,
  phoneOtpSentMessage,
  setPhoneVerified,
  setPhoneVerificationCode,
  setPhoneVerificationTimeLeft,
  setVerificationAttempts,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  resetPhoneVerification,
  validateEmailFormat,
  setPhoneFormatError,
  subdomainDuplicateChecked,
  subdomainDuplicateChecking,
  subdomainDuplicateError,
  subdomainPreview,
  setSubdomainDuplicateChecked,
  setSubdomainDuplicateError,
  setSubdomainPreview,
  checkSubdomainDuplicate,
  setError,
  regionCodes,
  loadRegionCodes,
}: Step1BasicInfoProgressiveProps) {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [completedFields, setCompletedFields] = useState<Set<number>>(new Set());
  const [emailFormatError, setEmailFormatError] = useState<string | null>(null);
  const pendingFieldCompleteRef = useRef<{ fieldId: string; value: string; fieldIdx: number } | null>(null);

  useEffect(() => {
    if (regionCodes.length === 0) {
      loadRegionCodes();
    }
  }, [regionCodes.length, loadRegionCodes]);

  const getFieldValue = (fieldId: string): string => {
    return String((formData as unknown as Record<string, unknown>)[fieldId] ?? '');
  };

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
      hint: '화면 헤더 등에 표시될 브랜드명입니다. 대부분의 경우 회사명과 동일하므로 입력하지 않으면 회사명이 자동으로 사용됩니다.',
    },
    {
      id: 'regionCode',
      label: '지역',
      required: false,
      validation: () => true,
      placeholder: '지역을 선택하세요 (선택사항)',
      isSelect: true,
      options: (() => {
        const uniqueCodes = new Map<string, typeof regionCodes[0]>();
        regionCodes.forEach(code => {
          if (!uniqueCodes.has(code.codeValue)) {
            uniqueCodes.set(code.codeValue, code);
          }
        });
        return Array.from(uniqueCodes.values())
          .sort((a, b) => {
            const sortA = (a as { sortOrder?: number }).sortOrder || 0;
            const sortB = (b as { sortOrder?: number }).sortOrder || 0;
            return sortA - sortB;
          })
          .map(code => ({
            value: code.codeValue,
            label: code.koreanName || code.codeLabel || code.codeValue,
          }));
      })(),
    },
    {
      id: 'subdomain',
      label: '서브도메인 (선택사항)',
      required: false,
      validation: (value: string) => {
        if (!value || value.trim().length === 0) {
          return true;
        }
        if (value.trim().length > 63) {
          return false;
        }
        if (!/^[a-z0-9-]+$/.test(value)) {
          return false;
        }
        return subdomainDuplicateChecked && !subdomainDuplicateError;
      },
      placeholder: 'mycompany (영문, 숫자, 하이픈만, 최대 63자)',
      hint: '와일드카드 도메인 테스트용 서브도메인입니다.',
    },
    {
      id: 'contactPhone',
      label: '휴대폰 번호',
      required: true,
      validation: (value: string) => {
        const result = validatePhoneFormat(value);
        return result.valid && phoneVerified;
      },
      placeholder: TRINITY_CONSTANTS.PHONE.PLACEHOLDER,
      hint: 'SMS로 인증번호를 발송합니다. 한국 휴대폰 번호(010)를 입력해주세요.',
    },
    {
      id: 'contactEmail',
      label: '이메일 (선택)',
      required: false,
      validation: (value: string) => {
        if (!value || !value.trim()) {
          return true;
        }
        return validateEmailFormat(value).valid;
      },
      placeholder: TRINITY_CONSTANTS.MESSAGES.PLACEHOLDER_EMAIL_OPTIONAL,
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
  ], [regionCodes, formData.adminPassword, phoneVerified, subdomainDuplicateChecked, subdomainDuplicateError, validateEmailFormat]);

  useEffect(() => {
    if (pendingFieldCompleteRef.current) {
      const { fieldId, value, fieldIdx } = pendingFieldCompleteRef.current;
      pendingFieldCompleteRef.current = null;

      const field = fields[fieldIdx];
      if (field && field.validation && field.validation(value)) {
        setCompletedFields(prevFields => {
          const newSet = new Set(prevFields);
          newSet.add(fieldIdx);

          if (fieldIdx === fields.length - 1) {
            const allRequiredCompleted = fields.every((f, idx) => {
              const fieldValue = idx === fieldIdx ? value : getFieldValue(f.id);
              if (f.required) {
                const isCompleted = idx === fieldIdx || newSet.has(idx);
                return isCompleted && f.validation && f.validation(fieldValue);
              }
              const optionalValue = getFieldValue(f.id);
              return !optionalValue || idx === fieldIdx || newSet.has(idx);
            });

            if (allRequiredCompleted && onStepComplete) {
              setTimeout(() => {
                onStepComplete();
              }, 300);
            }
          } else {
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
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));

    const currentFieldIdx = fields.findIndex(f => f.id === fieldId);
    if (currentFieldIdx >= 0) {
      const field = fields[currentFieldIdx];
      if (field.validation && field.validation(value)) {
        pendingFieldCompleteRef.current = {
          fieldId,
          value,
          fieldIdx: currentFieldIdx,
        };
      }
    }
  };

  const handleNextField = () => {
    if (!isCurrentFieldValid()) {
      return;
    }

    if (!completedFields.has(currentFieldIndex)) {
      setCompletedFields(prev => new Set(prev).add(currentFieldIndex));
    }

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

  const areAllRequiredFieldsCompleted = (): boolean => {
    return fields.every((field, index) => {
      const fieldValue = getFieldValue(field.id);
      if (field.required) {
        return completedFields.has(index) && field.validation(fieldValue);
      }
      return !fieldValue || completedFields.has(index);
    });
  };

  const isCurrentFieldValid = (): boolean => {
    const currentField = fields[currentFieldIndex];
    if (!currentField) return false;

    const value = getFieldValue(currentField.id);
    if (currentField.required && !value.trim()) {
      return false;
    }

    if (currentField.id === 'contactPhone') {
      const phoneResult = validatePhoneFormat(value);
      return phoneResult.valid && phoneVerified;
    }

    if (currentField.id === 'contactEmail' && value.trim()) {
      return validateEmailFormat(value).valid;
    }

    if (currentField.id === 'subdomain') {
      if (!value || value.trim().length === 0) {
        return true;
      }
      if (value.trim().length > 63) {
        return false;
      }
      if (!/^[a-z0-9-]+$/.test(value)) {
        return false;
      }
      return subdomainDuplicateChecked && !subdomainDuplicateError;
    }

    return currentField.validation ? currentField.validation(value) : true;
  };

  return (
    <div className={COMPONENT_CSS.ONBOARDING.STEP}>
      <h3 className="trinity-onboarding__step-title">기본 정보 입력</h3>
      <p className="trinity-onboarding__step-description">
        각 항목을 순서대로 입력해주세요. 휴대폰 인증이 필요합니다.
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
                  const inputValue = e.target.value;
                  if (field.required) {
                    if (inputValue && field.validation && field.validation(inputValue)) {
                      handleFieldComplete(field.id, inputValue);
                    }
                  } else if (!inputValue || (field.validation && field.validation(inputValue))) {
                    handleFieldComplete(field.id, inputValue);
                  }
                }}
                onKeyDown={(e) => {
                  const inputValue = e.currentTarget.value;
                  if (e.key === 'Enter') {
                    if (field.required) {
                      if (inputValue && field.validation && field.validation(inputValue)) {
                        handleFieldComplete(field.id, inputValue);
                      }
                    } else if (!inputValue || (field.validation && field.validation(inputValue))) {
                      handleFieldComplete(field.id, inputValue);
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
                  const selectValue = e.target.value;
                  handleFieldChange(field.id, selectValue);
                  handleFieldComplete(field.id, selectValue);
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
            ) : field.id === 'subdomain' ? (
              <div className="trinity-onboarding__subdomain-field">
                <div className="trinity-onboarding__subdomain-row">
                  <input
                    type="text"
                    value={getFieldValue(field.id)}
                    onChange={(e) => {
                      let inputValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      inputValue = inputValue.replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
                      if (inputValue.length > 63) {
                        inputValue = inputValue.substring(0, 63);
                      }
                      handleFieldChange(field.id, inputValue);
                      setSubdomainDuplicateChecked(false);
                      setSubdomainDuplicateError(null);
                      setSubdomainPreview(null);
                    }}
                    onBlur={async (e) => {
                      const inputValue = e.target.value.trim();
                      if (inputValue) {
                        try {
                          await checkSubdomainDuplicate(inputValue);
                          if (field.validation && field.validation(inputValue)) {
                            handleFieldComplete(field.id, inputValue);
                          }
                        } catch (err) {
                          console.error('서브도메인 중복 확인 실패:', err);
                        }
                      } else {
                        setSubdomainDuplicateChecked(false);
                        setSubdomainDuplicateError(null);
                        setSubdomainPreview(null);
                        handleFieldComplete(field.id, inputValue);
                      }
                    }}
                    placeholder={field.placeholder}
                    className={COMPONENT_CSS.ONBOARDING.INPUT}
                    maxLength={63}
                    pattern="[a-z0-9-]+"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const inputValue = getFieldValue(field.id).trim();
                      if (inputValue) {
                        checkSubdomainDuplicate(inputValue);
                      }
                    }}
                    disabled={subdomainDuplicateChecking || !getFieldValue(field.id).trim()}
                    className="trinity-onboarding__subdomain-check-button"
                  >
                    {subdomainDuplicateChecking ? '확인 중...' : '중복 확인'}
                  </button>
                </div>
                {subdomainDuplicateError && (
                  <div className={COMPONENT_CSS.ONBOARDING.ERROR_TEXT}>{subdomainDuplicateError}</div>
                )}
                {subdomainPreview && !subdomainDuplicateError && (
                  <div className={COMPONENT_CSS.ONBOARDING.SUCCESS_TEXT}>사용 가능: {subdomainPreview}</div>
                )}
              </div>
            ) : field.id === 'contactPhone' ? (
              <PhoneInputProgressive
                value={getFieldValue(field.id)}
                onChange={(phoneValue) => handleFieldChange(field.id, phoneValue)}
                onValidationChange={(isValid) => {
                  const fieldIdx = fields.findIndex(f => f.id === field.id);
                  if (fieldIdx < 0) {
                    return;
                  }
                  const phoneValue = getFieldValue(field.id);
                  const phoneResult = validatePhoneFormat(phoneValue);
                  if (phoneResult.valid && phoneVerified) {
                    setCompletedFields(prev => {
                      const newSet = new Set(prev);
                      newSet.add(fieldIdx);
                      return newSet;
                    });
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
                  if (isValid) {
                    setError(null);
                  }
                }}
                phoneFormatError={phoneFormatError}
                phoneVerified={phoneVerified}
                phoneVerificationCode={phoneVerificationCode}
                phoneVerificationSending={phoneVerificationSending}
                phoneVerificationVerifying={phoneVerificationVerifying}
                phoneVerificationTimeLeft={phoneVerificationTimeLeft}
                resendCooldown={resendCooldown}
                otpSentMessage={phoneOtpSentMessage}
                onSendVerificationCode={sendPhoneVerificationCode}
                onVerifyCode={verifyPhoneCode}
                setPhoneVerificationCode={setPhoneVerificationCode}
                setPhoneFormatError={setPhoneFormatError}
                onPhoneChangeReset={() => {
                  resetPhoneVerification();
                  setPhoneVerified(false);
                  setPhoneVerificationTimeLeft(null);
                  setVerificationAttempts(0);
                }}
              />
            ) : (
              <input
                type={field.id === 'contactEmail' ? 'email' : 'text'}
                value={getFieldValue(field.id)}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  handleFieldChange(field.id, inputValue);
                  if (field.id === 'contactEmail' && inputValue.trim()) {
                    const emailValidation = validateEmailFormat(inputValue);
                    setEmailFormatError(emailValidation.valid ? null : emailValidation.error || null);
                  } else if (field.id === 'contactEmail') {
                    setEmailFormatError(null);
                  }
                }}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  if (field.required) {
                    if (inputValue && field.validation && field.validation(inputValue)) {
                      handleFieldComplete(field.id, inputValue);
                    }
                  } else if (!inputValue || (field.validation && field.validation(inputValue))) {
                    handleFieldComplete(field.id, inputValue);
                  }
                }}
                onKeyDown={(e) => {
                  const inputValue = e.currentTarget.value;
                  if (e.key === 'Enter') {
                    if (field.required) {
                      if (inputValue && field.validation && field.validation(inputValue)) {
                        handleFieldComplete(field.id, inputValue);
                      }
                    } else if (!inputValue || (field.validation && field.validation(inputValue))) {
                      handleFieldComplete(field.id, inputValue);
                    }
                  }
                }}
                placeholder={field.placeholder}
                className={COMPONENT_CSS.ONBOARDING.INPUT}
                required={field.required}
              />
            )}
            {field.id === 'contactEmail' && emailFormatError && (
              <div className={COMPONENT_CSS.ONBOARDING.ERROR_BOX}>
                <small className={COMPONENT_CSS.ONBOARDING.ERROR_TEXT}>⚠️ {emailFormatError}</small>
              </div>
            )}
          </ProgressiveInputField>
        ))}
      </div>

      <div className="trinity-progressive-fields__progress">
        <div className="trinity-progressive-fields__progress-bar">
          <div
            className="trinity-progressive-fields__progress-fill"
            style={{
              width: `${(fields.filter((f, idx) => f.required && completedFields.has(idx)).length / fields.filter(f => f.required).length) * 100}%`,
            }}
          />
        </div>
        <div className="trinity-progressive-fields__progress-text">
          필수 필드 {fields.filter((f, idx) => f.required && completedFields.has(idx)).length} / {fields.filter(f => f.required).length} 완료
        </div>
      </div>

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
            if (!isCurrentFieldValid()) {
              return;
            }

            if (!completedFields.has(currentFieldIndex)) {
              setCompletedFields(prev => new Set(prev).add(currentFieldIndex));
            }

            if (currentFieldIndex === fields.length - 1) {
              if (areAllRequiredFieldsCompleted()) {
                onStepComplete?.();
              }
            } else {
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
            ? '다음 단계 →'
            : '다음 →'}
        </button>
      </div>
    </div>
  );
}
