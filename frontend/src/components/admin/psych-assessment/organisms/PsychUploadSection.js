/**
 * PsychUploadSection - PDF 업로드 섹션
 * ContentSection noCard + ContentCard, mg-upload-area
 *
 * @author Core Solution
 * @since 2026-02-27
 */

import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Upload } from 'lucide-react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import ContentCard from '../../../dashboard-v2/content/ContentCard';
import './PsychUploadSection.css';

const PsychUploadSection = ({
  uploadType,
  onUploadTypeChange,
  uploadFile,
  onFilePick,
  onDrop,
  onDragOver,
  onDragLeave,
  onUpload,
  uploading,
  isDragOver,
  fileInputId = 'psych-assessment-file-input',
  clientId,
  onClientIdChange,
  clients = [],
  clientsLoading = false
}) => {
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  const currentClientId = clientId === null || clientId === undefined ? '' : String(clientId);

  return (
    <ContentSection noCard className="mg-v2-psych-upload-section">
      <ContentCard className="mg-v2-psych-upload-section__card">
        <div className="mg-v2-psych-upload-section__header">
          <Upload size={16} />
          <h2 className="mg-v2-content-section__title">PDF 업로드</h2>
        </div>
        <div className="mg-v2-psych-upload-section__body">
          <div
            className={`mg-upload-area ${isDragOver ? 'mg-upload-area--drag-over' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onKeyDown={handleKeyDown}
            onClick={handleAreaClick}
            role="button"
            tabIndex={0}
            aria-label="파일을 드래그하여 놓거나 클릭하여 선택"
          >
            <p>파일을 여기로 드래그&드롭 하거나 아래에서 선택하세요.</p>
            <p>{uploadFile ? `선택됨: ${uploadFile.name}` : '선택된 파일 없음'}</p>
          </div>
          <div className="mg-v2-psych-upload-section__form-row mg-v2-psych-upload-section__form-row--client">
            <label className="mg-v2-psych-upload-section__label" htmlFor="psych-upload-client-select">
              내담자 선택
            </label>
            <select
              id="psych-upload-client-select"
              className="mg-select mg-v2-psych-upload-section__client-select"
              value={currentClientId}
              onChange={(e) => {
                const v = e.target.value;
                onClientIdChange(v === '' ? null : Number(v));
              }}
              disabled={clientsLoading}
              aria-label="내담자 선택 (선택 사항)"
            >
              <option value="">선택 안 함</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email || `내담자 #${c.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="mg-v2-psych-upload-section__form-row">
            <select
              className="mg-select"
              value={uploadType}
              onChange={(e) => onUploadTypeChange(e.target.value)}
            >
              <option value="TCI">TCI</option>
              <option value="MMPI">MMPI</option>
            </select>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept="application/pdf"
              className="mg-input"
              onChange={(e) => onFilePick(e.target.files?.[0] || null)}
            />
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
  onDrop: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  uploading: PropTypes.bool,
  isDragOver: PropTypes.bool,
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
  clientsLoading: PropTypes.bool
};

export default PsychUploadSection;
