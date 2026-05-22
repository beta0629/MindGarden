/**
 * ShopProductImageUpload — SKU 대표 이미지 (mg-upload-area, react-dropzone)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import notificationManager from '../../../utils/notification';
import {
  ADMIN_SHOP_SKU_IMAGE_ACCEPT,
  ADMIN_SHOP_SKU_IMAGE_MAX_BYTES,
  ADMIN_SHOP_SKU_IMAGE_UPLOAD_HINT,
  ADMIN_SHOP_SKU_IMAGE_FORMAT_HINT,
  ADMIN_SHOP_SKU_IMAGE_SELECTION_NONE,
  ADMIN_SHOP_SKU_IMAGE_DROP_REJECTED_DEFAULT
} from '../../../constants/adminShopCatalog';
import '../../admin/psych-assessment/organisms/PsychUploadSection.css';
import './ShopProductImageUpload.css';
import { useTranslation } from 'react-i18next';

const ShopProductImageUpload = ({
  previewUrl,
  onFileSelect,
  onClear,
  disabled = false,
  testId = 'admin-sku-image-upload'
}) => {
  const { t } = useTranslation();
  const [localPreview, setLocalPreview] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const displayUrl = localPreview || previewUrl || null;

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const onDropRejectedHandler = useCallback((fileRejections) => {
    setUploadError('');
    const first = fileRejections[0];
    if (!first?.errors?.length) {
      const message = ADMIN_SHOP_SKU_IMAGE_DROP_REJECTED_DEFAULT;
      notificationManager.warning(message);
      setUploadError(message);
      return;
    }
    const message =
      first.errors.map((e) => e.message).join('. ') ||
      ADMIN_SHOP_SKU_IMAGE_DROP_REJECTED_DEFAULT;
    notificationManager.warning(message);
    setUploadError(message);
  }, []);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      setUploadError('');
      const file = acceptedFiles?.[0];
      if (!file) {
        return;
      }
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
      setLocalPreview(URL.createObjectURL(file));
      setSelectedFileName(file.name || '');
      onFileSelect(file);
    },
    [localPreview, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ADMIN_SHOP_SKU_IMAGE_ACCEPT,
    maxSize: ADMIN_SHOP_SKU_IMAGE_MAX_BYTES,
    multiple: false,
    disabled,
    noClick: false,
    onDrop: handleDrop,
    onDropRejected: onDropRejectedHandler
  });

  const handleClear = (ev) => {
    ev?.stopPropagation?.();
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    setSelectedFileName('');
    setUploadError('');
    onClear();
  };

  return (
    <div className="admin-shop-sku-image-upload" data-testid={testId}>
      <div
        {...getRootProps({
          className: `mg-upload-area admin-shop-sku-image-upload__dropzone ${
            isDragActive ? 'mg-upload-area--drag-over' : ''
          }`,
          'aria-label': '대표 이미지를 드래그하여 놓거나 클릭하여 선택'
        })}
      >
        <input
          {...getInputProps({
            accept: 'image/jpeg,image/png,image/webp',
            'aria-label': '대표 이미지 파일 선택'
          })}
        />
        <p>{ADMIN_SHOP_SKU_IMAGE_UPLOAD_HINT}</p>
        <p className="admin-shop-sku-image-upload__format-hint">{ADMIN_SHOP_SKU_IMAGE_FORMAT_HINT}</p>
        <p className="admin-shop-sku-image-upload__selection-feedback">
          {selectedFileName || ADMIN_SHOP_SKU_IMAGE_SELECTION_NONE}
        </p>
        {uploadError ? (
          <p className="admin-shop-sku-image-upload__error" role="alert">
            {uploadError}
          </p>
        ) : null}
      </div>

      {displayUrl ? (
        <figure className="admin-shop-sku-image-upload__preview-wrap">
          <img
            src={displayUrl}
            alt=""
            className="admin-shop-sku-image-upload__preview"
          />
          <div className="admin-shop-sku-image-upload__preview-actions">
            <MGButton
              type="button"
              className={`${buildErpMgButtonClassName('secondary')} admin-shop-sku-image-upload__action-btn`}
              disabled={disabled}
              onClick={handleClear}
            >
              {t('common.actions.delete', '삭제')}
            </MGButton>
          </div>
        </figure>
      ) : null}
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
