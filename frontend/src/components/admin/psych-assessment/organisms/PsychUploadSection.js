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
import notificationManager from '../../../../utils/notification';
import './PsychUploadSection.css';

const PDF_ACCEPT = { 'application/pdf': ['.pdf'] };
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB, 서버 검열과 동일

const getClientLabel = (c) => c.name || c.email || `내담자 #${c.id}`;

const PsychUploadSection = ({
  uploadType,
  onUploadTypeChange,
  uploadFile,
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

  const onDropRejectedHandler = useCallback((fileRejections) => {
    const first = fileRejections[0];
    if (!first?.errors?.length) {
      notificationManager.warning('파일을 선택할 수 없습니다. PDF 파일(50MB 이하)만 가능합니다.');
      return;
    }
    const message = first.errors.map((e) => e.message).join('. ') || '파일 형식 또는 크기가 올바르지 않습니다.';
    notificationManager.warning(message);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: PDF_ACCEPT,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFilePick(acceptedFiles[0]);
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
          <h2 className="mg-v2-content-section__title">PDF 업로드</h2>
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
                accept: 'application/pdf',
                'aria-label': 'PDF 파일 선택'
              })}
            />
            <p>파일을 여기로 드래그&드롭 하거나 클릭하여 선택하세요.</p>
            <p>{uploadFile ? `선택됨: ${uploadFile.name}` : '선택된 파일 없음'}</p>
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
                      <button
                        type="button"
                        className="mg-v2-psych-upload-section__client-selected-tag-remove"
                        onClick={() => onClientIdChange(null)}
                        aria-label="내담자 선택 해제"
                      >
                        <X size={14} />
                      </button>
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
                  <button
                    type="button"
                    className={`mg-v2-psych-upload-section__client-tag mg-v2-psych-upload-section__client-tag--none ${selectedClient ? '' : 'mg-v2-psych-upload-section__client-tag--selected'}`}
                    onClick={() => onClientIdChange(null)}
                    aria-pressed={!selectedClient}
                    disabled={clientsLoading}
                  >
                    <span className="mg-v2-psych-upload-section__tag-hash">#</span>
                    {' '}
                    선택 안 함
                  </button>
                </li>
                {filteredClients.map((c) => {
                  const isSelected = selectedClient && Number(c.id) === Number(clientId);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`mg-v2-psych-upload-section__client-tag ${isSelected ? 'mg-v2-psych-upload-section__client-tag--selected' : ''}`}
                        onClick={() => onClientIdChange(Number(c.id))}
                        aria-pressed={isSelected}
                        disabled={clientsLoading}
                      >
                        <span className="mg-v2-psych-upload-section__tag-hash">#</span>
                        {getClientLabel(c)}
                      </button>
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
                  <button
                    key={type}
                    type="button"
                    className={`mg-v2-psych-upload-section__type-option ${isSelected ? 'mg-v2-psych-upload-section__type-option--selected' : ''}`}
                    onClick={() => onUploadTypeChange(type)}
                    aria-pressed={isSelected}
                    aria-label={`검사 유형 ${type}${isSelected ? ' 선택됨' : ''}`}
                  >
                    {type}
                  </button>
                );
              })}
            </fieldset>
            <button
              type="button"
              className="mg-v2-button mg-v2-button-primary"
              onClick={onUpload}
              disabled={uploading}
            >
              업로드
            </button>
          </div>
          <p className="mg-v2-psych-upload-section__hint">
            스캔 PDF 업로드 후 자동으로 추출 작업이 진행됩니다.
          </p>
        </div>
      </ContentCard>
    </ContentSection>
  );
};

PsychUploadSection.propTypes = {
  uploadType: PropTypes.oneOf(['TCI', 'MMPI']).isRequired,
  onUploadTypeChange: PropTypes.func.isRequired,
  uploadFile: PropTypes.object,
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
