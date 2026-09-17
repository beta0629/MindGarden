/**
 * Client Lobby — 포토 스트립 (실사 없을 때 soft gradient 폴백)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';

const ClientLobbyPhotoStrip = ({ imageSrc = null }) => {
  if (!imageSrc) {
    return (
      <div
        className="client-lobby__photo-strip client-lobby__photo-strip--fallback"
        aria-hidden="true"
        data-testid="client-lobby-photo-strip"
      />
    );
  }

  return (
    <div className="client-lobby__photo-strip" aria-hidden="true" data-testid="client-lobby-photo-strip">
      <img src={imageSrc} alt="" />
    </div>
  );
};

ClientLobbyPhotoStrip.propTypes = {
  imageSrc: PropTypes.string
};

export default ClientLobbyPhotoStrip;
