import React from 'react';
import { FileText } from 'lucide-react';
import BadgeSelect from '../../common/BadgeSelect';

/**
 * 상담일지 작성 폼 — 상담 내용 슈퍼블록(안 B) + 추가 기록 그리드
 * (state·핸들러는 부모)
 */
const ConsultationLogFormPanel = ({
  formData,
  handleInputChange,
  setFormData,
  validationErrors,
  riskLevels,
  goalAchievementLevels,
  completionStatusOptions,
  loadingCodes
}) => (
  <section
    className="mg-v2-form-section mg-v2-consultation-log-modal__form-panel"
    aria-label="상담일지 작성"
  >
    <section
      className="mg-v2-consultation-log__content-superblock"
      aria-labelledby="consultation-log-superblock-title"
    >
      <div className="mg-v2-consultation-log__superblock-head">
        <span className="mg-v2-consultation-log__superblock-accent" aria-hidden="true" />
        <h3
          id="consultation-log-superblock-title"
          className="mg-v2-consultation-log__superblock-title"
        >
          <FileText size={20} className="mg-v2-text-primary" aria-hidden="true" />
          상담 내용
        </h3>
      </div>
      <div className="mg-v2-consultation-log__superblock-stack">
        <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
          <label className="mg-v2-label" htmlFor="consultation-log-client-condition">내담자 상태 *</label>
          <textarea
            id="consultation-log-client-condition"
            name="clientCondition"
            value={formData.clientCondition}
            onChange={handleInputChange}
            placeholder="내담자의 현재 상태를 기록해주세요."
            className={[
              'mg-v2-input',
              'mg-v2-w-full',
              'mg-v2-consultation-log-modal__textarea',
              'mg-v2-consultation-log__textarea--primary',
              validationErrors.clientCondition ? 'mg-v2-consultation-log-modal__input-error' : ''
            ].filter(Boolean).join(' ')}
            required
          />
        </div>

        <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
          <label className="mg-v2-label" htmlFor="consultation-log-main-issues">주요 이슈 *</label>
          <textarea
            id="consultation-log-main-issues"
            name="mainIssues"
            value={formData.mainIssues}
            onChange={handleInputChange}
            placeholder="이번 세션에서 다룬 주요 이슈를 기록해주세요."
            className={[
              'mg-v2-input',
              'mg-v2-w-full',
              'mg-v2-consultation-log-modal__textarea',
              validationErrors.mainIssues ? 'mg-v2-consultation-log-modal__input-error' : ''
            ].filter(Boolean).join(' ')}
            required
          />
        </div>

        <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
          <label className="mg-v2-label" htmlFor="consultation-log-intervention">개입 방법 *</label>
          <textarea
            id="consultation-log-intervention"
            name="interventionMethods"
            value={formData.interventionMethods}
            onChange={handleInputChange}
            placeholder="사용한 상담 기법이나 개입 방법을 기록해주세요."
            className={[
              'mg-v2-input',
              'mg-v2-w-full',
              'mg-v2-consultation-log-modal__textarea',
              validationErrors.interventionMethods ? 'mg-v2-consultation-log-modal__input-error' : ''
            ].filter(Boolean).join(' ')}
            required
          />
        </div>

        <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
          <label className="mg-v2-label" htmlFor="consultation-log-client-response">내담자 반응 *</label>
          <textarea
            id="consultation-log-client-response"
            name="clientResponse"
            value={formData.clientResponse}
            onChange={handleInputChange}
            placeholder="내담자의 반응이나 변화를 기록해주세요."
            className={[
              'mg-v2-input',
              'mg-v2-w-full',
              'mg-v2-consultation-log-modal__textarea',
              validationErrors.clientResponse ? 'mg-v2-consultation-log-modal__input-error' : ''
            ].filter(Boolean).join(' ')}
            required
          />
        </div>
      </div>
    </section>

    <h3 className="mg-v2-consultation-log__section-heading">추가 기록·세션 메타</h3>

    <div className="mg-v2-form-grid mg-v2-consultation-log-modal__form-grid">
      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-session-date">세션 일자 *</label>
        <input
          id="consultation-log-session-date"
          type="date"
          name="sessionDate"
          value={formData.sessionDate}
          onChange={handleInputChange}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__input-readonly"
          required
          disabled
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-session-duration">세션 시간 (분) *</label>
        <input
          id="consultation-log-session-duration"
          type="number"
          name="sessionDurationMinutes"
          value={formData.sessionDurationMinutes}
          onChange={handleInputChange}
          min="1"
          max="180"
          className={[
            'mg-v2-input',
            'mg-v2-w-full',
            validationErrors.sessionDurationMinutes ? 'mg-v2-consultation-log-modal__input-error' : ''
          ].filter(Boolean).join(' ')}
          required
        />
      </div>

      <div className="mg-v2-form-group">
        <span className="mg-v2-label">세션 완료 여부</span>
        <BadgeSelect
          options={completionStatusOptions.map((o) => ({ value: o.value, label: o.label }))}
          value={formData.isSessionCompleted === true ? 'COMPLETED' : 'PENDING'}
          onChange={(v) => setFormData((prev) => ({ ...prev, isSessionCompleted: v === 'COMPLETED' }))}
          placeholder="선택하세요"
          className="mg-v2-form-badge-select mg-v2-w-full"
          disabled
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <label className="mg-v2-label" htmlFor="consultation-log-next-session">다음 세션 계획</label>
        <textarea
          id="consultation-log-next-session"
          name="nextSessionPlan"
          value={formData.nextSessionPlan}
          onChange={handleInputChange}
          placeholder="다음 세션에서 다룰 내용을 기록해주세요."
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-homework">과제 부여</label>
        <textarea
          id="consultation-log-homework"
          name="homeworkAssigned"
          value={formData.homeworkAssigned}
          onChange={handleInputChange}
          placeholder="부여한 과제나 숙제를 기록해주세요."
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-homework-due">과제 제출 기한</label>
        <input
          id="consultation-log-homework-due"
          type="date"
          name="homeworkDueDate"
          value={formData.homeworkDueDate}
          onChange={handleInputChange}
          className="mg-v2-input mg-v2-w-full"
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <span className="mg-v2-label">위험도 평가 *</span>
        <BadgeSelect
          options={riskLevels.map((l) => ({
            value: l.value,
            label: l.label,
            icon: l.icon
          }))}
          value={formData.riskAssessment}
          onChange={(v) => handleInputChange({ target: { name: 'riskAssessment', value: v } })}
          placeholder="위험도를 선택하세요"
          aria-label="위험도 평가 필수 선택"
          className="mg-v2-form-badge-select mg-v2-w-full mg-v2-consultation-log-modal__badge-select-grid mg-v2-consultation-log-modal__badge-select-grid--5"
          disabled={loadingCodes}
          error={!!validationErrors.riskAssessment}
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-risk-factors">위험 요인</label>
        <textarea
          id="consultation-log-risk-factors"
          name="riskFactors"
          value={formData.riskFactors}
          onChange={handleInputChange}
          placeholder="발견된 위험 요인을 기록해주세요."
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-emergency">응급 대응 계획</label>
        <textarea
          id="consultation-log-emergency"
          name="emergencyResponsePlan"
          value={formData.emergencyResponsePlan}
          onChange={handleInputChange}
          placeholder="응급 상황 시 대응 계획을 기록해주세요."
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <label className="mg-v2-label" htmlFor="consultation-log-progress-eval">진행 평가 *</label>
        <textarea
          id="consultation-log-progress-eval"
          name="progressEvaluation"
          value={formData.progressEvaluation}
          onChange={handleInputChange}
          placeholder="전반적인 진행 상황을 평가해주세요."
          className={[
            'mg-v2-input',
            'mg-v2-w-full',
            'mg-v2-consultation-log-modal__textarea',
            validationErrors.progressEvaluation ? 'mg-v2-consultation-log-modal__input-error' : ''
          ].filter(Boolean).join(' ')}
          required
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <label className="mg-v2-label" htmlFor="consultation-log-progress-score">
          진행 점수 ({formData.progressScore}점)
        </label>
        <input
          id="consultation-log-progress-score"
          type="range"
          name="progressScore"
          value={formData.progressScore}
          onChange={handleInputChange}
          min="0"
          max="100"
          className="mg-v2-input mg-v2-w-full"
        />
      </div>

      <div className="mg-v2-form-group">
        <span className="mg-v2-label">목표 달성도</span>
        <BadgeSelect
          options={goalAchievementLevels.map((l) => ({ value: l.value, label: l.label }))}
          value={formData.goalAchievement}
          onChange={(v) => handleInputChange({ target: { name: 'goalAchievement', value: v } })}
          placeholder="선택하세요"
          className="mg-v2-form-badge-select mg-v2-w-full mg-v2-consultation-log-modal__badge-select-grid mg-v2-consultation-log-modal__badge-select-grid--3"
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <label className="mg-v2-label" htmlFor="consultation-log-goal-details">목표 달성 세부사항</label>
        <textarea
          id="consultation-log-goal-details"
          name="goalAchievementDetails"
          value={formData.goalAchievementDetails}
          onChange={handleInputChange}
          placeholder="목표 달성에 대한 구체적인 내용을 기록해주세요."
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <label className="mg-v2-label" htmlFor="consultation-log-observations">상담사 관찰</label>
        <textarea
          id="consultation-log-observations"
          name="consultantObservations"
          value={formData.consultantObservations}
          onChange={handleInputChange}
          placeholder="내담자에 대한 관찰 내용을 기록해주세요."
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <label className="mg-v2-label" htmlFor="consultation-log-assessment">상담사 평가</label>
        <textarea
          id="consultation-log-assessment"
          name="consultantAssessment"
          value={formData.consultantAssessment}
          onChange={handleInputChange}
          placeholder="전문적인 관점에서의 평가를 기록해주세요."
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <label className="mg-v2-label" htmlFor="consultation-log-special">특별 고려사항 (다음 상담 시 주의사항)</label>
        <textarea
          id="consultation-log-special"
          name="specialConsiderations"
          value={formData.specialConsiderations}
          onChange={handleInputChange}
          placeholder="다음 상담 시 참고할 특이사항, 주의사항을 기록해주세요. (내담자 메모·일정 메모와 함께 상단에 표시됩니다)"
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-family">가족 관계</label>
        <textarea
          id="consultation-log-family"
          name="familyRelationships"
          value={formData.familyRelationships}
          onChange={handleInputChange}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-social">사회적 지지</label>
        <textarea
          id="consultation-log-social"
          name="socialSupport"
          value={formData.socialSupport}
          onChange={handleInputChange}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-medical">의료/복용 약물</label>
        <textarea
          id="consultation-log-medical"
          name="medicalInformation"
          value={formData.medicalInformation}
          onChange={handleInputChange}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      {!formData.isSessionCompleted && (
        <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
          <label className="mg-v2-label" htmlFor="consultation-log-incomplete">미완료 사유</label>
          <textarea
            id="consultation-log-incomplete"
            name="incompletionReason"
            value={formData.incompletionReason}
            onChange={handleInputChange}
            placeholder="세션이 미완료된 사유를 기록해주세요."
            className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
          />
        </div>
      )}
    </div>
  </section>
);

export default ConsultationLogFormPanel;
