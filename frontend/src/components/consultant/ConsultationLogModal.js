import React, { useState, useEffect } from 'react';
import './ConsultationLogModal.css';

const ConsultationLogModal = ({ consultation, isOpen, onClose, onSave, mode = 'add' }) => {
  const [formData, setFormData] = useState({
    consultationDate: '',
    startTime: '',
    endTime: '',
    consultationType: '',
    mainIssues: '',
    consultationContent: '',
    clientResponse: '',
    progressNotes: '',
    nextPlan: '',
    recommendations: '',
    mood: '',
    riskAssessment: '',
    notes: ''
  });

  useEffect(() => {
    if (consultation) {
      setFormData({
        consultationDate: consultation.startTime ? consultation.startTime.split('T')[0] : '',
        startTime: consultation.startTime ? consultation.startTime.split('T')[1] : '',
        endTime: consultation.endTime ? consultation.endTime.split('T')[1] : '',
        consultationType: consultation.consultationType || '',
        mainIssues: consultation.mainIssues || '',
        consultationContent: consultation.consultationContent || '',
        clientResponse: consultation.clientResponse || '',
        progressNotes: consultation.progressNotes || '',
        nextPlan: consultation.nextPlan || '',
        recommendations: consultation.recommendations || '',
        mood: consultation.mood || '',
        riskAssessment: consultation.riskAssessment || '',
        notes: consultation.notes || ''
      });
    } else {
      // 새 상담 일지인 경우 현재 날짜와 시간 설정
      const now = new Date();
      setFormData(prev => ({
        ...prev,
        consultationDate: now.toISOString().split('T')[0],
        startTime: now.toTimeString().slice(0, 5)
      }));
    }
  }, [consultation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 시작 시간과 종료 시간을 ISO 형식으로 변환
    const startDateTime = `${formData.consultationDate}T${formData.startTime}:00`;
    const endDateTime = `${formData.consultationDate}T${formData.endTime}:00`;
    
    const consultationData = {
      ...formData,
      startTime: startDateTime,
      endTime: endDateTime,
      consultationDate: formData.consultationDate
    };
    
    onSave(consultationData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content consultation-log-modal">
        <div className="modal-header">
          <h2>
            {mode === 'add' ? '📝 상담 일지 작성' : '📝 상담 일지 수정'}
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-sections">
            {/* 상담 기본 정보 */}
            <div className="form-section">
              <h3 className="section-title">📅 상담 기본 정보</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>상담 날짜 *</label>
                  <input
                    type="date"
                    name="consultationDate"
                    value={formData.consultationDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>상담 유형</label>
                  <select
                    name="consultationType"
                    value={formData.consultationType}
                    onChange={handleInputChange}
                  >
                    <option value="">선택하세요</option>
                    <option value="초기상담">초기상담</option>
                    <option value="진행상담">진행상담</option>
                    <option value="종결상담">종결상담</option>
                    <option value="긴급상담">긴급상담</option>
                    <option value="사후관리">사후관리</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>시작 시간 *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>종료 시간 *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 상담 내용 */}
            <div className="form-section">
              <h3 className="section-title">💭 상담 내용</h3>
              <div className="form-group">
                <label>주요 문제점 *</label>
                <textarea
                  name="mainIssues"
                  value={formData.mainIssues}
                  onChange={handleInputChange}
                  required
                  placeholder="이번 상담에서 다룬 주요 문제점이나 이슈를 기록해주세요"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>상담 내용 *</label>
                <textarea
                  name="consultationContent"
                  value={formData.consultationContent}
                  onChange={handleInputChange}
                  required
                  placeholder="상담 중 진행된 내용, 사용한 기법, 내담자의 반응 등을 상세히 기록해주세요"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>내담자 반응</label>
                <textarea
                  name="clientResponse"
                  value={formData.clientResponse}
                  onChange={handleInputChange}
                  placeholder="내담자의 감정적 반응, 태도 변화, 참여도 등을 기록해주세요"
                  rows="3"
                />
              </div>
            </div>

            {/* 진행 상황 및 계획 */}
            <div className="form-section">
              <h3 className="section-title">📈 진행 상황 및 계획</h3>
              <div className="form-group">
                <label>진행 상황</label>
                <textarea
                  name="progressNotes"
                  value={formData.progressNotes}
                  onChange={handleInputChange}
                  placeholder="이전 상담 대비 진행 상황, 개선된 점, 지속되는 문제 등을 기록해주세요"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>다음 상담 계획</label>
                <textarea
                  name="nextPlan"
                  value={formData.nextPlan}
                  onChange={handleInputChange}
                  placeholder="다음 상담에서 다룰 내용, 과제, 목표 등을 기록해주세요"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>권고사항</label>
                <textarea
                  name="recommendations"
                  value={formData.recommendations}
                  onChange={handleInputChange}
                  placeholder="내담자에게 권고한 사항, 생활 습관 개선, 추가 활동 등을 기록해주세요"
                  rows="3"
                />
              </div>
            </div>

            {/* 평가 및 메모 */}
            <div className="form-section">
              <h3 className="section-title">📊 평가 및 메모</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>내담자 기분/상태</label>
                  <select
                    name="mood"
                    value={formData.mood}
                    onChange={handleInputChange}
                  >
                    <option value="">선택하세요</option>
                    <option value="매우 좋음">매우 좋음</option>
                    <option value="좋음">좋음</option>
                    <option value="보통">보통</option>
                    <option value="나쁨">나쁨</option>
                    <option value="매우 나쁨">매우 나쁨</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>위험도 평가</label>
                  <select
                    name="riskAssessment"
                    value={formData.riskAssessment}
                    onChange={handleInputChange}
                  >
                    <option value="">선택하세요</option>
                    <option value="낮음">낮음</option>
                    <option value="보통">보통</option>
                    <option value="높음">높음</option>
                    <option value="매우 높음">매우 높음</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>추가 메모</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="기타 특이사항이나 추가로 기록하고 싶은 내용을 자유롭게 작성해주세요"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="save-btn">
              {mode === 'add' ? '일지 저장' : '일지 수정'}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationLogModal;
