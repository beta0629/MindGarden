/**
 * 공통 아바타 컴포넌트 (웹 SSOT)
 *
 * - profileImageUrl/uri/imageUrl 중 하나로 이미지 지정 가능 (호환 alias)
 * - 모든 입력은 `resolveAvatarSourceUri` 로 정규화되어 origin 누락된
 *   상대 path 도 안정적으로 절대 URL 로 변환된다 (expo-app 동일 정책).
 * - 이미지 로드 실패(`onError`) 시 displayName 기반 이니셜 fallback.
 * - profileImageUrl 없음 / 정규화 결과 null → 이니셜만 표시.
 *
 * @author Core Solution
 * @since 2025-02-28
 * @updated 2026-06-10 — resolveAvatarSourceUri SSOT 적용
 */

import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import resolveAvatarSourceUri from '../../utils/resolveAvatarSourceUri';
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
  uri,
  imageUrl,
  displayName,
  className = '',
  size,
  alt = ''
}) => {
  const rawSrc = profileImageUrl ?? uri ?? imageUrl ?? null;
  const resolvedSrc = useMemo(() => resolveAvatarSourceUri(rawSrc), [rawSrc]);

  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [resolvedSrc]);

  const showImage = !!resolvedSrc && !imageLoadFailed;
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
          src={resolvedSrc}
          alt={alt || '프로필 사진'}
          className="mg-v2-avatar-img"
          onError={() => setImageLoadFailed(true)}
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
  uri: PropTypes.string,
  imageUrl: PropTypes.string,
  displayName: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  alt: PropTypes.string
};

Avatar.displayName = 'Avatar';

export default Avatar;
