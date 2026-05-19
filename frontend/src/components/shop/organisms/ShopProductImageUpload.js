/**
 * ShopProductImageUpload — SKU 대표 이미지 (1:1, react-dropzone)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { ImageIcon } from 'lucide-react';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import notificationManager from '../../../utils/notification';
import {
  ADMIN_SHOP_SKU_IMAGE_ACCEPT,
  ADMIN_SHOP_SKU_IMAGE_MAX_BYTES,
  ADMIN_SHOP_SKU_IMAGE_UPLOAD_HINT
} from '../../../constants/adminShopCatalog';
import './ShopProductImageUpload.css';

const ShopProductImageUpload = ({
  previewUrl,
  onFileSelect,
  onClear,
  disabled = false,
  testId = 'admin-sku-image-upload'
}) => {
  const [localPreview, setLocalPreview] = useState(null);

  const displayUrl = localPreview || previewUrl || null;

  const onDropRejectedHandler = useCallback((fileRejections) => {
    const first = fileRejections[0];
    const message =
      first?.errors?.map((e) => e.message).join('. ') ||
      'JPEG, PNG, WebP만 업로드할 수 있으며 최대 5MB입니다.';
    notificationManager.warning(message);
  }, []);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      if (!file) {
        return;
      }
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
      setLocalPreview(URL.createObjectURL(file));
      onFileSelect(file);
    },
    [localPreview, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: ADMIN_SHOP_SKU_IMAGE_ACCEPT,
    maxSize: ADMIN_SHOP_SKU_IMAGE_MAX_BYTES,
    multiple: false,
    disabled,
    noClick: Boolean(displayUrl),
    onDrop: handleDrop,
    onDropRejected: onDropRejectedHandler
  });

  const handleClear = (ev) => {
    ev?.stopPropagation?.();
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    onClear();
  };

  const rootClassName = [
    'admin-shop-sku-image-upload',
    isDragActive ? 'admin-shop-sku-image-upload--drag-over' : '',
    displayUrl ? 'admin-shop-sku-image-upload--has-preview' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={rootClassName}
      data-testid={testId}
      {...getRootProps()}
    >
      <input {...getInputProps()} aria-label="대표 이미지 업로드" />
      {displayUrl ? (
        <>
          <img
            src={displayUrl}
            alt=""
            className="admin-shop-sku-image-upload__preview"
          />
          <div className="admin-shop-sku-image-upload__overlay">
            <MGButton
              type="button"
              className={`${buildErpMgButtonClassName('secondary')} admin-shop-sku-image-upload__overlay-btn`}
              disabled={disabled}
              onClick={(ev) => {
                ev.stopPropagation();
                open();
              }}
            >
              변경
            </MGButton>
            <MGButton
              type="button"
              className={`${buildErpMgButtonClassName('secondary')} admin-shop-sku-image-upload__overlay-btn`}
              disabled={disabled}
              onClick={handleClear}
            >
              삭제
            </MGButton>
          </div>
        </>
      ) : (
        <div className="admin-shop-sku-image-upload__placeholder">
          <ImageIcon size={32} aria-hidden />
          <span>{ADMIN_SHOP_SKU_IMAGE_UPLOAD_HINT}</span>
        </div>
      )}
    </div>
  );
};

ShopProductImageUpload.propTypes = {
  previewUrl: PropTypes.string,
  onFileSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  testId: PropTypes.string
};

export default ShopProductImageUpload;
