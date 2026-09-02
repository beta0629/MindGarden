/**
 * 공통 프로필 이미지 입력 컴포넌트 (Clinic-OS SSOT)
 * 리사이즈·크롭·용량 검사 후 base64 data URL 을 onChange 로 전달한다.
 *
 * @author Core Solution
 * @since 2025-02-26
 */

import React, { useRef, useCallback, useId } from 'react';
import PropTypes from 'prop-types';
import { processProfileImage } from '../../utils/imageResizeCrop';
import { resolveAvatarSourceUri } from '../../utils/resolveAvatarSourceUri';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import './ProfileImageInput.css';

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_CROP_SIZE = 400;
const DEFAULT_MAX_SIZE = 512;
const DEFAULT_QUALITY = 0.85;
const DEFAULT_HELP_TEXT = 'JPG, PNG, WEBP (권장 2MB 이하)';

/**
 * @param {object} props
 * @param {string} [props.value] - 현재 이미지 URL·data URL (표시용)
 * @param {function} props.onChange - 처리된 data URL 또는 빈 문자열
 * @param {number} [props.maxBytes]
 * @param {number} [props.cropSize]
 * @param {number} [props.maxSize]
 * @param {number} [props.quality]
 * @param {string} [props.helpText]
 * @param {string} [props.selectLabel]
 * @param {string} [props.removeLabel]
 * @param {boolean} [props.disabled] - true 이면 액션 버튼 숨김
 * @param {boolean} [props.hideLabel] - true 이면 "프로필 사진" 라벨 숨김
 * @param {string} [props.className] - 루트 추가 클래스
 * @returns {JSX.Element}
 */
const ProfileImageInput = ({
  value,
  onChange,
  maxBytes = DEFAULT_MAX_BYTES,
  cropSize = DEFAULT_CROP_SIZE,
  maxSize = DEFAULT_MAX_SIZE,
  quality = DEFAULT_QUALITY,
  helpText = DEFAULT_HELP_TEXT,
  selectLabel = '사진 선택',
  removeLabel = '제거',
  disabled = false,
  hideLabel = false,
  className = ''
}) => {
  const inputRef = useRef(null);
  const reactId = useId();
  const inputId = `profile-photo-input-${reactId}`;

  const displaySrc = resolveAvatarSourceUri(value) || '';
  const hasImage = Boolean(displaySrc);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      e.target.value = '';

      processProfileImage(file, { maxSize, cropSize, quality, maxBytes })
        .then((result) => {
          onChange(result);
        })
        .catch((err) => {
          const isNonImage = err?.message === '이미지 파일만 선택할 수 있습니다.';
          globalThis.dispatchEvent(
            new CustomEvent('showNotification', {
              detail: {
                message: err?.message || '이미지 처리 중 오류가 발생했습니다.',
                type: isNonImage ? 'warning' : 'error'
              }
            })
          );
        });
    },
    [onChange, maxSize, cropSize, quality, maxBytes]
  );

  const handleSelectClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleRemove = useCallback(() => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }, [onChange]);

  const rootClassName = [
    'mg-v2-form-group',
    'mg-v2-profile-photo-group',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      {!hideLabel && (
        <label htmlFor={inputId} className="mg-v2-form-label">
          프로필 사진
        </label>
      )}
      <div className="mg-v2-profile-photo-preview-wrap">
        <div
          className="mg-v2-profile-photo-preview"
          key={hasImage ? 'has-image' : 'no-image'}
          aria-hidden={!hasImage}
        >
          {hasImage ? (
            <img
              src={displaySrc}
              alt="프로필 미리보기"
              decoding="async"
              className="mg-v2-profile-photo-img"
            />
          ) : (
            <span className="mg-v2-profile-photo-placeholder" aria-hidden="true" />
          )}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mg-v2-profile-photo-input"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
        />
        {!disabled && (
          <div className="mg-v2-profile-photo-actions">
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading: false
              })}
              onClick={handleSelectClick}
              preventDoubleClick={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              aria-controls={inputId}
            >
              {selectLabel}
            </MGButton>
            {hasImage && (
              <MGButton
                type="button"
                variant="outline"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'md',
                  loading: false
                })}
                onClick={handleRemove}
                preventDoubleClick={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                {removeLabel}
              </MGButton>
            )}
          </div>
        )}
      </div>
      {helpText ? <small className="mg-v2-form-help">{helpText}</small> : null}
    </div>
  );
};

ProfileImageInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  maxBytes: PropTypes.number,
  cropSize: PropTypes.number,
  maxSize: PropTypes.number,
  quality: PropTypes.number,
  helpText: PropTypes.string,
  selectLabel: PropTypes.string,
  removeLabel: PropTypes.string,
  disabled: PropTypes.bool,
  hideLabel: PropTypes.bool,
  className: PropTypes.string
};

export default ProfileImageInput;
