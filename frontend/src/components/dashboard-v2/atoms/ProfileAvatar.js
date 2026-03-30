/**
 * ProfileAvatar - 프로필 아바타 (Atom)
 * 
 * @author CoreSolution
 * @since 2026-03-09
 */

import React from 'react';
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

  return (
    <div className={`mg-v2-profile-avatar ${sizeClass} ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name} 
          className="mg-v2-profile-avatar__img"
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
