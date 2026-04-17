/**
 * ProfileAvatar - 프로필 아바타 (Atom)
 * 
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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

  useEffect(() => {
    setImageLoadFailed(false);
  }, [imageUrl]);

  return (
    <div className={`mg-v2-profile-avatar ${sizeClass} ${className}`}>
      {imageUrl && !imageLoadFailed ? (
        <img 
          src={imageUrl} 
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
