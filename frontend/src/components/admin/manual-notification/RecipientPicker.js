/**
 * 수동 발송 수신자 다중 선택 분자(Molecule).
 *
 * - 검색 입력(debounce 300ms) + 검색 결과 리스트 + 선택된 수신자 칩(Chip)
 * - 공통 모듈 우선 정책: 선택 행위 자체는 `BadgeSelect multiple={true}` 위임.
 * - 50명 상한(`MANUAL_NOTIFICATION_MAX_RECIPIENTS`) 가드: 초과 시도 시
 *   `onLimitExceeded` 콜백을 트리거(부모가 인라인 경고 노출).
 * - 모든 표시 값은 `toDisplayString` 으로 React #130(객체 자식 렌더) 방어.
 * - 인라인 스타일 0건. 모든 토큰은 CSS 클래스 + `unified-design-tokens.css`.
 *
 * 사용 예:
 *   <RecipientPicker
 *     value={selectedUsers}
 *     onChange={setSelectedUsers}
 *     query={recipientQuery}
 *     onQueryChange={setRecipientQuery}
 *     options={recipientOptions}
 *     loading={recipientLoading}
 *     onLimitExceeded={() => setExceededWarning(true)}
 *   />
 *
 * @author MindGarden
 * @since 2026-05-23
 */

import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';
import { MANUAL_NOTIFICATION_MAX_RECIPIENTS } from '../../../api/admin/manualNotificationApi';

const RECIPIENT_PICKER_CLASS = 'mg-manual-notif-recipient-picker';

/**
 * 수신자 객체 정규화 (백엔드 RecipientSearchResponse 또는 일반 사용자 DTO 모두 수용).
 * - userId / id / pk 다중 후보 처리
 * - phoneMasked / phone / phoneNumber 다중 후보 처리
 * - role 필드는 표시용 문자열로 통일
 *
 * @param {*} raw
 * @returns {{ userId: (number|string|null), name: string, phoneMasked: string, role: string, hasPhone: boolean }|null}
 */
export const normalizeRecipient = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const userId = raw.userId ?? raw.id ?? raw.pk ?? null;
  if (userId == null) {
    return null;
  }
  const phoneMasked = raw.phoneMasked ?? raw.phoneNumberMasked ?? raw.phoneNumber ?? raw.phone ?? '';
  const hasPhoneFlag = raw.hasPhone;
  const hasPhone = typeof hasPhoneFlag === 'boolean'
    ? hasPhoneFlag
    : Boolean(phoneMasked && String(phoneMasked).trim());
  return {
    userId,
    name: toDisplayString(raw.name ?? raw.userName ?? raw.displayName, '이름 없음'),
    phoneMasked: toDisplayString(phoneMasked, '번호 없음'),
    role: toDisplayString(raw.role ?? raw.roleCode ?? raw.userRole, '역할 미지정'),
    hasPhone
  };
};

/**
 * 선택된 수신자 칩 단일 행.
 * @param {{ recipient: object, onRemove: function, removeAriaLabel: string }} props
 */
const RecipientChip = ({ recipient, onRemove, removeAriaLabel }) => (
  <span className={`${RECIPIENT_PICKER_CLASS}__chip`}>
    <span className={`${RECIPIENT_PICKER_CLASS}__chip-label`}>
      {toDisplayString(recipient.name, '이름 없음')}
      <span className={`${RECIPIENT_PICKER_CLASS}__chip-meta`}>
        {' · '}
        {toDisplayString(recipient.phoneMasked, '번호 없음')}
      </span>
    </span>
    <button
      type="button"
      className={`${RECIPIENT_PICKER_CLASS}__chip-remove`}
      onClick={() => onRemove(recipient)}
      aria-label={removeAriaLabel}
    >
      ×
    </button>
  </span>
);

/**
 * @param {{
 *   value: Array<{userId:(number|string), name:string, phoneMasked:string, role:string, hasPhone?:boolean}>,
 *   onChange: function,
 *   query: string,
 *   onQueryChange: function,
 *   options: Array<object>,
 *   loading?: boolean,
 *   maxCount?: number,
 *   onLimitExceeded?: function,
 *   disabled?: boolean
 * }} props
 */
const RecipientPicker = ({
  value = [],
  onChange,
  query = '',
  onQueryChange,
  options = [],
  loading = false,
  maxCount = MANUAL_NOTIFICATION_MAX_RECIPIENTS,
  onLimitExceeded,
  disabled = false
}) => {
  const { t } = useTranslation('admin');

  const selectedIds = useMemo(() => new Set(value.map((u) => String(u.userId))), [value]);

  const normalizedOptions = useMemo(() => {
    return (Array.isArray(options) ? options : [])
      .map((raw) => normalizeRecipient(raw))
      .filter(Boolean);
  }, [options]);

  const visibleAddable = useMemo(() => {
    return normalizedOptions.filter((opt) => !selectedIds.has(String(opt.userId)));
  }, [normalizedOptions, selectedIds]);

  const tryAdd = useCallback((recipient) => {
    if (disabled) {
      return;
    }
    if (!recipient || !recipient.hasPhone) {
      return;
    }
    if (selectedIds.has(String(recipient.userId))) {
      return;
    }
    if (value.length >= maxCount) {
      if (typeof onLimitExceeded === 'function') {
        onLimitExceeded();
      }
      return;
    }
    onChange([...value, recipient]);
  }, [disabled, selectedIds, value, maxCount, onLimitExceeded, onChange]);

  const handleRemove = useCallback((recipient) => {
    if (disabled) {
      return;
    }
    onChange(value.filter((u) => String(u.userId) !== String(recipient.userId)));
  }, [disabled, value, onChange]);

  const handleAddAllVisible = useCallback(() => {
    if (disabled) {
      return;
    }
    const remaining = maxCount - value.length;
    if (remaining <= 0) {
      if (typeof onLimitExceeded === 'function') {
        onLimitExceeded();
      }
      return;
    }
    const addable = visibleAddable.filter((opt) => opt.hasPhone).slice(0, remaining);
    if (addable.length === 0) {
      return;
    }
    if (visibleAddable.filter((opt) => opt.hasPhone).length > remaining
      && typeof onLimitExceeded === 'function') {
      onLimitExceeded();
    }
    onChange([...value, ...addable]);
  }, [disabled, maxCount, value, visibleAddable, onLimitExceeded, onChange]);

  const handleClearAll = useCallback(() => {
    if (disabled) {
      return;
    }
    if (value.length === 0) {
      return;
    }
    onChange([]);
  }, [disabled, value, onChange]);

  return (
    <div className={RECIPIENT_PICKER_CLASS}>
      <div className={`${RECIPIENT_PICKER_CLASS}__search-row`}>
        <label
          className={`${RECIPIENT_PICKER_CLASS}__search-label`}
          htmlFor="mg-manual-notif-recipient-search"
        >
          {t('manualNotification.recipient.searchLabel', '수신자 검색')}
        </label>
        <input
          id="mg-manual-notif-recipient-search"
          type="search"
          className={`${RECIPIENT_PICKER_CLASS}__search-input`}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('manualNotification.recipient.searchPlaceholder', '이름·이메일·전화 검색')}
          disabled={disabled}
          autoComplete="off"
        />
        <span className={`${RECIPIENT_PICKER_CLASS}__counter`}>
          {t('manualNotification.recipient.counter', {
            count: value.length,
            max: maxCount,
            defaultValue: '선택됨 {{count}} / {{max}}'
          })}
        </span>
      </div>

      <div className={`${RECIPIENT_PICKER_CLASS}__actions-row`}>
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: `${RECIPIENT_PICKER_CLASS}__action-btn`
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          disabled={disabled || visibleAddable.length === 0 || value.length >= maxCount}
          onClick={handleAddAllVisible}
        >
          {t('manualNotification.recipient.addAllVisible', '검색 결과 모두 추가')}
        </MGButton>
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: `${RECIPIENT_PICKER_CLASS}__action-btn`
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          disabled={disabled || value.length === 0}
          onClick={handleClearAll}
        >
          {t('manualNotification.recipient.clearAll', '전체 해제')}
        </MGButton>
      </div>

      <div className={`${RECIPIENT_PICKER_CLASS}__results`} aria-live="polite">
        {loading && (
          <p className={`${RECIPIENT_PICKER_CLASS}__results-empty`}>
            {t('manualNotification.recipient.loading', '사용자 검색 중...')}
          </p>
        )}
        {!loading && normalizedOptions.length === 0 && (
          <p className={`${RECIPIENT_PICKER_CLASS}__results-empty`}>
            {query.trim()
              ? t('manualNotification.recipient.empty', '검색 결과가 없습니다.')
              : t('manualNotification.recipient.noResultsHint', '이름·이메일·전화 일부를 입력해 검색하세요.')}
          </p>
        )}
        {!loading && normalizedOptions.length > 0 && (
          <ul className={`${RECIPIENT_PICKER_CLASS}__results-list`}>
            {normalizedOptions.map((opt) => {
              const selected = selectedIds.has(String(opt.userId));
              const cantSelect = !opt.hasPhone;
              return (
                <li
                  key={String(opt.userId)}
                  className={`${RECIPIENT_PICKER_CLASS}__result-row${selected ? ` ${RECIPIENT_PICKER_CLASS}__result-row--selected` : ''}${cantSelect ? ` ${RECIPIENT_PICKER_CLASS}__result-row--disabled` : ''}`}
                >
                  <div className={`${RECIPIENT_PICKER_CLASS}__result-text`}>
                    <span className={`${RECIPIENT_PICKER_CLASS}__result-name`}>
                      {toDisplayString(opt.name, '이름 없음')}
                    </span>
                    <span className={`${RECIPIENT_PICKER_CLASS}__result-meta`}>
                      {toDisplayString(opt.role, '역할 미지정')}
                      {' · '}
                      {cantSelect
                        ? t('manualNotification.recipient.noPhone', '전화번호 없음')
                        : toDisplayString(opt.phoneMasked, '번호 없음')}
                    </span>
                  </div>
                  <MGButton
                    type="button"
                    variant={selected ? 'secondary' : 'outline'}
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: selected ? 'secondary' : 'outline',
                      size: 'sm',
                      loading: false,
                      className: `${RECIPIENT_PICKER_CLASS}__result-action`
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    disabled={disabled || cantSelect || selected || value.length >= maxCount}
                    onClick={() => tryAdd(opt)}
                  >
                    {selected ? '선택됨' : '추가'}
                  </MGButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={`${RECIPIENT_PICKER_CLASS}__selected`}>
        <h4 className={`${RECIPIENT_PICKER_CLASS}__selected-title`}>
          {t('manualNotification.recipient.selectedListTitle', '선택된 수신자')}
          {' '}
          <span className={`${RECIPIENT_PICKER_CLASS}__selected-count`}>
            ({value.length})
          </span>
        </h4>
        {value.length === 0 ? (
          <p className={`${RECIPIENT_PICKER_CLASS}__selected-empty`}>
            {t('manualNotification.recipient.atLeastOne', '수신자를 최소 1명 이상 선택해 주세요.')}
          </p>
        ) : (
          <div className={`${RECIPIENT_PICKER_CLASS}__chip-list`}>
            {value.map((recipient) => (
              <RecipientChip
                key={String(recipient.userId)}
                recipient={recipient}
                onRemove={handleRemove}
                removeAriaLabel={t('manualNotification.recipient.removeChip', '선택 해제')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientPicker;
