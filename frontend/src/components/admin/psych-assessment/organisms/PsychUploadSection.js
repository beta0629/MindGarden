/**
 * PsychUploadSection - PDF 업로드 섹션
 * ContentSection noCard + ContentCard, mg-upload-area (react-dropzone)
 *
 * @author Core Solution
 * @since 2026-02-27
 */

import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { Upload, Search, X } from 'lucide-react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import ContentCard from '../../../dashboard-v2/content/ContentCard';
import MGButton from '../../../common/MGButton';
import notificationManager from '../../../../utils/notification';
import './PsychUploadSection.css';

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB, 서버 검열과 동일

const CONTENT_TYPE_PDF = 'application/pdf';
const CONTENT_TYPE_JPEG = 'image/jpeg';
const CONTENT_TYPE_PNG = 'image/png';
const isPdf = (f) => f?.type === CONTENT_TYPE_PDF;
const isImage = (f) =>
  f?.type === CONTENT_TYPE_JPEG || f?.type === CONTENT_TYPE_PNG;

const getClientLabel = (c) => c.name || c.email || `내담자 #${c.id}`;

const PsychUploadSection = ({
  uploadType,
  onUploadTypeChange,
  uploadFiles,
  onFilePick,
  onUpload,
  uploading,
  fileInputId = 'psych-assessment-file-input',
  clientId,
  onClientIdChange,
  clients = [],
  clientsLoading = false
}) => {
  const [clientFilter, setClientFilter] = useState('');
  const [uploadError, setUploadError] = useState('');

  const validateAndPick = useCallback(
    (files) => {
      setUploadError('');
      if (!files?.length) return;
      const hasPdf = files.some(isPdf);
      const hasImage = files.some(isImage);
      if (hasPdf && hasImage) {
        setUploadError('한 건에는 PDF만 또는 이미지만 올릴 수 있습니다. PDF와 이미지를 함께 선택하지 마세요.');
        notificationManager.warning('한 건에는 PDF만 또는 이미지만 올릴 수 있습니다.');
        return;
      }
      if (hasPdf && files.length > 1) {
        setUploadError('PDF는 1개만 선택할 수 있습니다.');
        notificationManager.warning('PDF는 1개만 선택할 수 있습니다.');
        return;
      }
      onFilePick(files);
    },
    [onFilePick]
  );

  const onDropRejectedHandler = useCallback((fileRejections) => {
    setUploadError('');
    const first = fileRejections[0];
    if (!first?.errors?.length) {
      notificationManager.warning('PDF 또는 이미지 파일(JPG, PNG)만 업로드할 수 있습니다. 파일당 최대 50MB.');
      setUploadError('PDF 또는 이미지 파일(JPG, PNG)만 업로드할 수 있습니다.');
      return;
    }
    const message =
      first.errors.map((e) => e.message).join('. ') ||
      '파일 형식 또는 크기가 올바르지 않습니다. PDF, JPG, PNG만 가능하며 파일당 최대 50MB입니다.';
    notificationManager.warning(message);
    setUploadError(message);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        validateAndPick(acceptedFiles);
      }
    },
    onDropRejected: onDropRejectedHandler
  });

  const filteredClients = useMemo(() => {
    const trimmed = clientFilter.trim();
    if (trimmed === '') return clients;
    const q = trimmed.toLowerCase();
    return clients.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        String(c.id).toLowerCase().includes(q)
    );
  }, [clients, clientFilter]);

  const selectedClient = useMemo(() => {
    if (clientId == null) return null;
    return clients.find((c) => Number(c.id) === Number(clientId)) ?? null;
  }, [clients, clientId]);

  return (
    <ContentSection noCard className="mg-v2-psych-upload-section">
      <ContentCard className="mg-v2-psych-upload-section__card">
        <div className="mg-v2-psych-upload-section__header">
          <Upload size={16} />
          <h2 className="mg-v2-content-section__title">파일 업로드</h2>
        </div>
        <div className="mg-v2-psych-upload-section__body">
          <div
            {...getRootProps({
              className: `mg-upload-area ${isDragActive ? 'mg-upload-area--drag-over' : ''}`,
              'aria-label': '파일을 드래그하여 놓거나 클릭하여 선택'
            })}
          >
            <input
              {...getInputProps({
                id: fileInputId,
                accept: 'application/pdf,image/jpeg,image/png',
                'aria-label': 'PDF 또는 이미지 파일 선택'
              })}
            />
            <p>PDF 1개 또는 이미지(JPG, PNG) 여러 장을 올려주세요.</p>
            <p>여러 장 선택 시 선택한 순서대로 처리됩니다.</p>
            <p className="mg-v2-psych-upload-section__format-hint">
              지원 형식: PDF, JPG, PNG / 파일당 최대 50MB
            </p>
            <p className="mg-v2-psych-upload-section__selection-feedback">
              {uploadFiles?.length
                ? uploadFiles.length === 1 && isPdf(uploadFiles[0])
                  ? 'PDF 1개가 선택되었습니다.'
                  : uploadFiles.length === 1
                    ? '이미지 1장이 선택되었습니다.'
                    : `이미지 ${uploadFiles.length}장이 선택되었습니다. 선택한 순서대로 처리됩니다.`
                : '선택된 파일 없음'}
            </p>
            {uploadError && (
              <p className="mg-v2-psych-upload-section__error" role="alert">
                {uploadError}
              </p>
            )}
          </div>
          <div className="mg-v2-psych-upload-section__client-card">
            <div className="mg-v2-psych-upload-section__client-card-inner">
              <span className="mg-v2-psych-upload-section__client-card-title">내담자 선택</span>
              {/* 선택 시 해시태그처럼 표시되는 영역 */}
              <div className="mg-v2-psych-upload-section__client-filter-row">
                <div className="mg-v2-psych-upload-section__client-hashtag-row">
                  {selectedClient ? (
                    <div className="mg-v2-psych-upload-section__client-selected-tag">
                      <span className="mg-v2-psych-upload-section__client-selected-tag-hash" aria-hidden>#</span>
                      <span className="mg-v2-psych-upload-section__client-selected-tag-label">
                        {getClientLabel(selectedClient)}
                      </span>
                      <MGButton
                        type="button"
                        variant="outline"
                        size="small"
                        className="mg-v2-psych-upload-section__client-selected-tag-remove"
                        onClick={() => onClientIdChange(null)}
                        aria-label="내담자 선택 해제"
                        preventDoubleClick={false}
                      >
                        <X size={14} />
                      </MGButton>
                    </div>
                  ) : (
                    <div className="mg-v2-psych-upload-section__client-selected-tag mg-v2-psych-upload-section__client-selected-tag--none">
                      <span className="mg-v2-psych-upload-section__client-selected-tag-hash" aria-hidden>#</span>
                      <span className="mg-v2-psych-upload-section__client-selected-tag-label">선택 안 함</span>
                    </div>
                  )}
                </div>
                <div className="mg-v2-psych-upload-section__client-search">
                  <Search className="mg-v2-psych-upload-section__client-search-icon" size={16} aria-hidden />
                  <input
                    type="text"
                    className="mg-v2-psych-upload-section__client-search-input"
                    placeholder="# 이름·이메일로 검색 후 아래에서 선택"
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    disabled={clientsLoading}
                    aria-label="내담자 검색"
                  />
                </div>
              </div>
              <ul className="mg-v2-psych-upload-section__client-tags" aria-label="내담자 해시태그 필터">
                <li>
                  <MGButton
                    type="button"
                    variant="outline"
                    size="small"
                    className={`mg-v2-psych-upload-section__client-tag mg-v2-psych-upload-section__client-tag--none ${selectedClient ? '' : 'mg-v2-psych-upload-section__client-tag--selected'}`}
                    onClick={() => onClientIdChange(null)}
                    aria-pressed={!selectedClient}
                    disabled={clientsLoading}
                    preventDoubleClick={false}
                  >
                    <span className="mg-v2-psych-upload-section__tag-hash">#</span>
                    {' '}
                    선택 안 함
                  </MGButton>
                </li>
                {filteredClients.map((c) => {
                  const isSelected = selectedClient && Number(c.id) === Number(clientId);
                  return (
                    <li key={c.id}>
                      <MGButton
                        type="button"
                        variant="outline"
                        size="small"
                        className={`mg-v2-psych-upload-section__client-tag ${isSelected ? 'mg-v2-psych-upload-section__client-tag--selected' : ''}`}
                        onClick={() => onClientIdChange(Number(c.id))}
                        aria-pressed={isSelected}
                        disabled={clientsLoading}
                        preventDoubleClick={false}
                      >
                        <span className="mg-v2-psych-upload-section__tag-hash">#</span>
                        {getClientLabel(c)}
                      </MGButton>
                    </li>
                  );
                })}
                {filteredClients.length === 0 && !clientsLoading && (
                  <li className="mg-v2-psych-upload-section__client-tags-empty-wrap">
                    <span className="mg-v2-psych-upload-section__client-tags-empty">검색 결과 없음</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="mg-v2-psych-upload-section__form-row">
            <fieldset className="mg-v2-psych-upload-section__type-options" aria-label="검사 유형">
              <legend className="mg-v2-psych-upload-section__type-legend">검사 유형</legend>
                {['TCI', 'MMPI'].map((type) => {
                const isSelected = uploadType === type;
                return (
                  <MGButton
                    key={type}
                    type="button"
                    variant="outline"
                    size="small"
                    className={`mg-v2-psych-upload-section__type-option ${isSelected ? 'mg-v2-psych-upload-section__type-option--selected' : ''}`}
                    onClick={() => onUploadTypeChange(type)}
                    aria-pressed={isSelected}
                    aria-label={`검사 유형 ${type}${isSelected ? ' 선택됨' : ''}`}
                    preventDoubleClick={false}
                  >
                    {type}
                  </MGButton>
                );
              })}
            </fieldset>
            <MGButton
              type="button"
              variant="primary"
              className="mg-v2-button mg-v2-button-primary"
              onClick={onUpload}
              loading={uploading}
              disabled={!uploadFiles?.length}
              preventDoubleClick={true}
              loadingText="업로드 중..."
            >
              업로드
            </MGButton>
          </div>
          <p className="mg-v2-psych-upload-section__hint">
            PDF 또는 이미지 업로드 후 자동으로 추출 작업이 진행됩니다.
          </p>
        </div>
      </ContentCard>
    </ContentSection>
  );
};

PsychUploadSection.propTypes = {
  uploadType: PropTypes.oneOf(['TCI', 'MMPI']).isRequired,
  onUploadTypeChange: PropTypes.func.isRequired,
  uploadFiles: PropTypes.arrayOf(PropTypes.object),
  onFilePick: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  uploading: PropTypes.bool,
  fileInputId: PropTypes.string,
  clientId: PropTypes.number,
  onClientIdChange: PropTypes.func.isRequired,
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
      email: PropTypes.string
    })
  ),
  clientsLoading: PropTypes.bool,
  // 하위 호환용 (dropzone 내부 처리로 미사용)
  onDrop: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragLeave: PropTypes.func,
  isDragOver: PropTypes.bool
};

export default PsychUploadSection;
