import React from 'react';
import MGButton from '../MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

/**
 * 휴대폰 입력 + (선택) 중복확인 버튼 + 상태/에러 메시지 (도메인 로직·API는 부모).
 *
 * `mode="withDuplicate"`(기본)일 때만 {@link onDuplicateClick}, {@link duplicateButtonLabel}이 필수입니다.
 * `mode="inputOnly"`에서는 중복확인 UI·`checkStatus` 안내 small이 렌더되지 않습니다.
 *
 * @param {Object} props
 * @param {'withDuplicate'|'inputOnly'} [props.mode='withDuplicate']
 * @param {string} props.label 라벨 텍스트 (htmlFor=id)
 * @param {string} [props.labelClassName='mg-v2-form-label']
 * @param {string} [props.containerClassName='mg-v2-form-group'] 루트 래퍼 클래스
 * @param {React.ReactNode} [props.children] inputOnly에서 도움말 등 추가 블록
 * @param {string} props.value
 * @param {function(React.ChangeEvent<HTMLInputElement>): void} props.onChange
 * @param {string} props.name input name
 * @param {string} props.id input id (E2E #phone 등)
 * @param {string} [props.placeholder]
 * @param {number|string} [props.maxLength]
 * @param {boolean} [props.required]
 * @param {boolean} [props.readOnly]
 * @param {boolean} [props.disabled]
 * @param {string} [props.autoComplete]
 * @param {string} [props.inputClassName] 기본 `mg-v2-form-input`
 * @param {function(React.FocusEvent<HTMLInputElement>): void} [props.onBlur]
 * @param {function(): void} [props.onDuplicateClick] **withDuplicate 전용(필수)**
 * @param {boolean} [props.duplicateDisabled] 버튼 비활성 추가 조건
 * @param {boolean} [props.isCheckingDuplicate] 중복확인 진행 중(로딩)
 * @param {string} [props.duplicateButtonLabel] **withDuplicate 전용(필수)**
 * @param {string} [props.duplicateButtonDataAction] withDuplicate: 중복확인 버튼 `data-action` (E2E·자동화 셀렉터, 접근성 보조 도구용). 미지정 시 **`phone-duplicate-check`**. 동일 페이지에 여러 인스턴스가 있으면 소비자에서 화면별 고유 문자열 전달.
 * @param {null|'duplicate'|'available'} [props.checkStatus] withDuplicate: 인라인 성공/중복 안내
 * @param {string} [props.messageDuplicate] checkStatus duplicate 시 표시
 * @param {string} [props.messageAvailable] checkStatus available 시 표시
 * @param {string} [props.errorText] 필드 검증 오류 (mg-v2-error-text)
 */
const KoreanMobileDuplicateField = ({
  mode = 'withDuplicate',
  label,
  labelClassName = 'mg-v2-form-label',
  containerClassName = 'mg-v2-form-group',
  children = null,
  value,
  onChange,
  name,
  id,
  placeholder,
  maxLength,
  required = false,
  readOnly = false,
  disabled = false,
  autoComplete,
  inputClassName = '',
  onBlur,
  onDuplicateClick,
  duplicateDisabled = false,
  isCheckingDuplicate = false,
  duplicateButtonLabel,
  duplicateButtonDataAction,
  checkStatus = null,
  messageDuplicate = '',
  messageAvailable = '',
  errorText = ''
}) => {
  const trimmedValue = String(value ?? '').trim();
  const resolvedDuplicateButtonDataAction =
    duplicateButtonDataAction != null && String(duplicateButtonDataAction).trim() !== ''
      ? String(duplicateButtonDataAction).trim()
      : 'phone-duplicate-check';
  const duplicateButtonDisabled =
    isCheckingDuplicate || duplicateDisabled || !trimmedValue;
  const resolvedInputClassName = inputClassName || 'mg-v2-form-input';

  if (mode === 'inputOnly') {
    return (
      <div className={containerClassName}>
        <label htmlFor={id} className={labelClassName}>{label}</label>
        <input
          type="tel"
          id={id}
          name={name}
          className={resolvedInputClassName}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          maxLength={maxLength}
          readOnly={readOnly}
          disabled={disabled}
          autoComplete={autoComplete}
        />
        {errorText ? <span className="mg-v2-error-text">{errorText}</span> : null}
        {children}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <label htmlFor={id} className={labelClassName}>{label}</label>
      <div className="mg-v2-form-email-row">
        <div className="mg-v2-form-email-row__input-wrap">
          <input
            type="tel"
            id={id}
            name={name}
            className={resolvedInputClassName}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            maxLength={maxLength}
            readOnly={readOnly}
            disabled={disabled}
            autoComplete={autoComplete}
          />
        </div>
        <MGButton
          type="button"
          variant="secondary"
          data-action={resolvedDuplicateButtonDataAction}
          onClick={onDuplicateClick}
          disabled={duplicateButtonDisabled}
          className={`${buildErpMgButtonClassName({
            variant: 'secondary',
            size: 'md',
            loading: isCheckingDuplicate
          })} mg-v2-button mg-v2-button-secondary mg-v2-auth-email-check-btn`}
          loading={isCheckingDuplicate}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
        >
          {duplicateButtonLabel}
        </MGButton>
      </div>
      {checkStatus === 'duplicate' && (
        <small className="mg-v2-form-help mg-v2-form-help--error">{messageDuplicate}</small>
      )}
      {checkStatus === 'available' && (
        <small className="mg-v2-form-help mg-v2-form-help--success">{messageAvailable}</small>
      )}
      {errorText ? <span className="mg-v2-error-text">{errorText}</span> : null}
      {children}
    </div>
  );
};

export default KoreanMobileDuplicateField;
