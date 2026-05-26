import React from 'react';
import { FileText } from 'lucide-react';
import BadgeSelect from '../../common/BadgeSelect';
import { CONSULTATION_LOG_CLIENT_CONDITION_MAX_LENGTH } from '../../../constants/consultationLogAutosaveConstants';
import { useTranslation } from 'react-i18next';

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
}) => {
  const { t } = useTranslation(); return (
  <section
    className="mg-v2-form-section mg-v2-consultation-log-modal__form-panel"
    aria-label={t('common:consultant.ConsultationLogFormPanel.t_a0658140')}
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
          {t('common:consultant.ConsultationLogFormPanel.t_d57a09e8')}
        </h3>
      </div>
      <div className="mg-v2-consultation-log__superblock-stack">
        <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
          <label className="mg-v2-label" htmlFor="consultation-log-client-condition">{t('common:consultant.ConsultationLogFormPanel.t_9ac70e52')}</label>
          <textarea
            id="consultation-log-client-condition"
            name="clientCondition"
            value={formData.clientCondition}
            onChange={handleInputChange}
            maxLength={CONSULTATION_LOG_CLIENT_CONDITION_MAX_LENGTH}
            placeholder={t('common:consultant.ConsultationLogFormPanel.t_005dc7d0')}
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
          <label className="mg-v2-label" htmlFor="consultation-log-main-issues">{t('common:consultant.ConsultationLogFormPanel.t_745ec930')}</label>
          <textarea
            id="consultation-log-main-issues"
            name="mainIssues"
            value={formData.mainIssues}
            onChange={handleInputChange}
            placeholder={t('common:consultant.ConsultationLogFormPanel.t_334286d2')}
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
          <label className="mg-v2-label" htmlFor="consultation-log-intervention">{t('common:consultant.ConsultationLogFormPanel.t_5620da99')}</label>
          <textarea
            id="consultation-log-intervention"
            name="interventionMethods"
            value={formData.interventionMethods}
            onChange={handleInputChange}
            placeholder={t('common:consultant.ConsultationLogFormPanel.t_0f043ff9')}
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
          <label className="mg-v2-label" htmlFor="consultation-log-client-response">{t('common:consultant.ConsultationLogFormPanel.t_03054139')}</label>
          <textarea
            id="consultation-log-client-response"
            name="clientResponse"
            value={formData.clientResponse}
            onChange={handleInputChange}
            placeholder={t('common:consultant.ConsultationLogFormPanel.t_7feaaf9f')}
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

    <h3 className="mg-v2-consultation-log__section-heading">{t('common:consultant.ConsultationLogFormPanel.t_58052cef')}</h3>

    <div className="mg-v2-form-grid mg-v2-consultation-log-modal__form-grid">
      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-session-date">{t('common:consultant.ConsultationLogFormPanel.t_9d161eee')}</label>
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
        <label className="mg-v2-label" htmlFor="consultation-log-session-duration">{t('common:consultant.ConsultationLogFormPanel.t_1bc36f5f')}</label>
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
        <span className="mg-v2-label">{t('common:consultant.ConsultationLogFormPanel.t_19279be8')}</span>
        <BadgeSelect
          options={completionStatusOptions.map((o) => ({ value: o.value, label: o.label }))}
          value={formData.isSessionCompleted === true ? 'COMPLETED' : 'PENDING'}
          onChange={(v) => setFormData((prev) => ({ ...prev, isSessionCompleted: v === 'COMPLETED' }))}
          placeholder={t('common:consultant.ConsultationLogFormPanel.t_c2255771')}
          className="mg-v2-form-badge-select mg-v2-w-full"
          disabled
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <label className="mg-v2-label" htmlFor="consultation-log-next-session">{t('common:consultant.ConsultationLogFormPanel.t_6856fca3')}</label>
        <textarea
          id="consultation-log-next-session"
          name="nextSessionPlan"
          value={formData.nextSessionPlan}
          onChange={handleInputChange}
          placeholder={t('common:consultant.ConsultationLogFormPanel.t_0f0c4cbc')}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-homework">{t('common:consultant.ConsultationLogFormPanel.t_a6c7c7d5')}</label>
        <textarea
          id="consultation-log-homework"
          name="homeworkAssigned"
          value={formData.homeworkAssigned}
          onChange={handleInputChange}
          placeholder={t('common:consultant.ConsultationLogFormPanel.t_99abba3d')}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-homework-due">{t('common:consultant.ConsultationLogFormPanel.t_ec235921')}</label>
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
        <span className="mg-v2-label">{t('common:consultant.ConsultationLogFormPanel.t_92495efd')}</span>
        <BadgeSelect
          options={riskLevels.map((l) => ({
            value: l.value,
            label: l.label,
            icon: l.icon
          }))}
          value={formData.riskAssessment}
          onChange={(v) => handleInputChange({ target: { name: 'riskAssessment', value: v } })}
          placeholder={t('common:consultant.ConsultationLogFormPanel.t_39150dda')}
          aria-label={t('common:consultant.ConsultationLogFormPanel.t_327ab968')}
          className="mg-v2-form-badge-select mg-v2-w-full mg-v2-consultation-log-modal__badge-select-grid mg-v2-consultation-log-modal__badge-select-grid--5"
          disabled={loadingCodes}
          error={!!validationErrors.riskAssessment}
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-risk-factors">{t('common:consultant.ConsultationLogFormPanel.t_af04804c')}</label>
        <textarea
          id="consultation-log-risk-factors"
          name="riskFactors"
          value={formData.riskFactors}
          onChange={handleInputChange}
          placeholder={t('common:consultant.ConsultationLogFormPanel.t_eced8efb')}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-emergency">{t('common:consultant.ConsultationLogFormPanel.t_b42e785a')}</label>
        <textarea
          id="consultation-log-emergency"
          name="emergencyResponsePlan"
          value={formData.emergencyResponsePlan}
          onChange={handleInputChange}
          placeholder={t('common:consultant.ConsultationLogFormPanel.t_9fecf02e')}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group mg-v2-consultation-log-modal__form-group-full">
        <label className="mg-v2-label" htmlFor="consultation-log-progress-eval">{t('common:consultant.ConsultationLogFormPanel.t_ad582d54')}</label>
        <textarea
          id="consultation-log-progress-eval"
          name="progressEvaluation"
          value={formData.progressEvaluation}
          onChange={handleInputChange}
          placeholder={t('common:consultant.ConsultationLogFormPanel.t_139e8e66')}
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
        <span className="mg-v2-label">{t('common:consultant.ConsultationLogFormPanel.t_51041d7f')}</span>
        <BadgeSelect
          options={goalAchievementLevels.map((l) => ({ value: l.value, label: l.label }))}
          value={formData.goalAchievement}
          onChange={(v) => handleInputChange({ target: { name: 'goalAchievement', value: v } })}
          placeholder={t('common:consultant.ConsultationLogFormPanel.t_c2255771')}
          className="mg-v2-form-badge-select mg-v2-w-full mg-v2-consultation-log-modal__badge-select-grid mg-v2-consultation-log-modal__badge-select-grid--3"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-family">{t('common:consultant.ConsultationLogFormPanel.t_38576d81')}</label>
        <textarea
          id="consultation-log-family"
          name="familyRelationships"
          value={formData.familyRelationships}
          onChange={handleInputChange}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-social">{t('common:consultant.ConsultationLogFormPanel.t_293a0731')}</label>
        <textarea
          id="consultation-log-social"
          name="socialSupport"
          value={formData.socialSupport}
          onChange={handleInputChange}
          className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
        />
      </div>

      <div className="mg-v2-form-group">
        <label className="mg-v2-label" htmlFor="consultation-log-medical">{t('common:consultant.ConsultationLogFormPanel.t_dcfbe09c')}</label>
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
          <label className="mg-v2-label" htmlFor="consultation-log-incomplete">{t('common:consultant.ConsultationLogFormPanel.t_58561e6f')}</label>
          <textarea
            id="consultation-log-incomplete"
            name="incompletionReason"
            value={formData.incompletionReason}
            onChange={handleInputChange}
            placeholder={t('common:consultant.ConsultationLogFormPanel.t_085c53bc')}
            className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea"
          />
        </div>
      )}
    </div>
  </section>
);
};

export default ConsultationLogFormPanel;
