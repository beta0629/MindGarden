/**
 * 공통 아바타 컴포넌트
 * - profileImageUrl 있음: 원 안에 이미지만 표시 (이니셜 DOM 없음)
 * - 이미지 로드 실패 시: 이니셜로 전환
 * - profileImageUrl 없음: 이니셜만 표시
 *
 * @author Core Solution
 * @since 2025-02-28
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Avatar.css';

/** displayName에서 이니셜 추출 */
export function getAvatarInitial(displayName) {
  if (!displayName || typeof displayName !== 'string') return '?';
  const name = displayName.trim();
  if (!name) return '?';
  if (/[가-힣]/.test(name)) {
    const parts = name.split(/\s+/);
    if (parts.length > 1) return (parts[0].charAt(0) + parts[1].charAt(0)).slice(0, 2);
    return name.charAt(0);
  }
  return name.charAt(0).toUpperCase();
}

const Avatar = ({
  profileImageUrl,
  displayName,
  className = '',
  size,
  alt = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(true);
  const showImage = profileImageUrl && imageLoaded;
  const initial = getAvatarInitial(displayName);
  const sizeStyle = size != null
    ? { '--avatar-size': typeof size === 'number' ? `${size}px` : String(size) }
    : undefined;
  const a11yProps = showImage
    ? {}
    : { role: 'img', 'aria-label': `${displayName || '사용자'} 이니셜` };

  return (
    <div
      className={`mg-v2-avatar ${className}`.trim()}
      style={sizeStyle}
      {...a11yProps}
    >
      {showImage ? (
        <img
          src={profileImageUrl}
          alt={alt || '프로필 사진'}
          className="mg-v2-avatar-img"
          onError={() => setImageLoaded(false)}
        />
      ) : (
        <span className="mg-v2-avatar-fallback" aria-hidden="true">
          {initial}
        </span>
      )}
    </div>
  );
};

Avatar.propTypes = {
  profileImageUrl: PropTypes.string,
  displayName: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  alt: PropTypes.string
};

Avatar.displayName = 'Avatar';

export default Avatar;
