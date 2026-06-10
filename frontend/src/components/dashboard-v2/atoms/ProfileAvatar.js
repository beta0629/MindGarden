/**
 * ProfileAvatar - 프로필 아바타 (Atom)
 *
 * 표시 SSOT: 공통 `resolveAvatarSourceUri` 를 거쳐 origin 누락 path 도
 * 안정적으로 절대화한다 (2026-06-10 SSOT 통일).
 *
 * @author CoreSolution
 * @since 2026-03-09
 * @updated 2026-06-10 — resolveAvatarSourceUri SSOT 적용
 */

import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import resolveAvatarSourceUri from '../../../utils/resolveAvatarSourceUri';
import './ProfileAvatar.css';

const ProfileAvatar = ({
  name = '',
  imageUrl = null,
  size = 'medium',
  className = ''
}) => {
  const sizeClass = `mg-v2-profile-avatar--${size}`;
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const resolvedSrc = useMemo(() => resolveAvatarSourceUri(imageUrl), [imageUrl]);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [resolvedSrc]);

  const showImage = !!resolvedSrc && !imageLoadFailed;

  return (
    <div className={`mg-v2-profile-avatar ${sizeClass} ${className}`}>
      {showImage ? (
        <img
          src={resolvedSrc}
          alt={name}
          className="mg-v2-profile-avatar__img"
          onError={(e) => {
            e.currentTarget.onerror = null;
            setImageLoadFailed(true);
          }}
        />
      ) : (
        <span className="mg-v2-profile-avatar__initial">{initial}</span>
      )}
    </div>
  );
};

ProfileAvatar.propTypes = {
  name: PropTypes.string,
  imageUrl: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium']),
  className: PropTypes.string
};

export default ProfileAvatar;
