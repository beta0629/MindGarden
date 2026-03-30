/**
 * 공통 프로필 이미지 입력 컴포넌트 (리사이즈·크롭·용량 검사 포함)
 * @author Core Solution
 * @since 2025-02-26
 */

import React, { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { User } from 'lucide-react';
import { processProfileImage } from '../../utils/imageResizeCrop';

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_CROP_SIZE = 400;
const DEFAULT_MAX_SIZE = 512;
const DEFAULT_QUALITY = 0.85;

const ProfileImageInput = ({
  value,
  onChange,
  maxBytes = DEFAULT_MAX_BYTES,
  cropSize = DEFAULT_CROP_SIZE,
  maxSize = DEFAULT_MAX_SIZE,
  quality = DEFAULT_QUALITY,
  helpText = '이미지 파일만 가능, 최대 2MB',
  selectLabel = '사진 선택',
  removeLabel = '제거',
  disabled = false
}) => {
  const inputRef = useRef(null);

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

  const handleRemove = useCallback(() => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }, [onChange]);

  const inputId = useRef(`profile-photo-input-${Math.random().toString(36).slice(2, 9)}`).current;

  return (
    <div className="mg-v2-form-group mg-v2-profile-photo-group">
      <label htmlFor={inputId} className="mg-v2-form-label">프로필 사진</label>
      <div className="mg-v2-profile-photo-preview-wrap">
        <div className="mg-v2-profile-photo-preview" key={value ? 'has-image' : 'no-image'}>
          {value ? (
            <img
              src={value}
              alt="프로필 미리보기"
              decoding="async"
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span className="mg-v2-profile-photo-placeholder" aria-hidden="true">
              <User size={40} />
            </span>
          )}
        </div>
        <div className="mg-v2-profile-photo-actions">
          <label htmlFor={inputId} className="mg-v2-button mg-v2-button-secondary mg-v2-profile-photo-label">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mg-v2-profile-photo-input"
              disabled={disabled}
            />
            {selectLabel}
          </label>
          {value && (
            <button
              type="button"
              className="mg-v2-button mg-v2-button-outline"
              onClick={handleRemove}
              disabled={disabled}
            >
              {removeLabel}
            </button>
          )}
        </div>
      </div>
      {helpText && <small className="mg-v2-form-help">{helpText}</small>}
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
  disabled: PropTypes.bool
};

export default ProfileImageInput;
