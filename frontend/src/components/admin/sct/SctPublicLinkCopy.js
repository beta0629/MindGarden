/**
 * SCT one-shot 공개 링크 복사 UI
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import notificationManager from '../../../utils/notification';
import { SCT_CSS, SCT_UI } from '../../../constants/sctOnline';

/**
 * @param {{ publicUrl: string, className?: string }} props
 */
const SctPublicLinkCopy = ({ publicUrl, className = '' }) => {
  const handleCopy = useCallback(async() => {
    if (!publicUrl) return;
    const full = publicUrl.startsWith('http')
      ? publicUrl
      : `${window.location.origin}${publicUrl}`;
    try {
      await navigator.clipboard.writeText(full);
      notificationManager.success(SCT_UI.COPY_LINK_SUCCESS);
    } catch {
      notificationManager.show(SCT_UI.COPY_LINK_FAIL, 'error');
    }
  }, [publicUrl]);

  if (!publicUrl) {
    return null;
  }

  return (
    <div className={`mg-v2-sct-public-link ${className}`.trim()} role="status">
      <p className={SCT_CSS.CAPTION}>{SCT_UI.PUBLIC_LINK_HINT}</p>
      <p className="mg-v2-sct-public-link__url">
        <SafeText>{publicUrl}</SafeText>
      </p>
      <MGButton
        type="button"
        variant="outline"
        size="small"
        preventDoubleClick={false}
        data-testid="sct-copy-public-link"
        onClick={handleCopy}
      >
        {SCT_UI.COPY_LINK}
      </MGButton>
    </div>
  );
};

SctPublicLinkCopy.propTypes = {
  publicUrl: PropTypes.string,
  className: PropTypes.string
};

export default SctPublicLinkCopy;