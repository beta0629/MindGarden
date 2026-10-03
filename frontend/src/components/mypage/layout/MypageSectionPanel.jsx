/**
 * MypageSectionPanel — 마이페이지 섹션 패널 (앵커 id = 섹션 키)
 * 제목 h2 · 캡션 · 헤더 동작 슬롯 · 편집 상태 · 편집 중 하단 저장/취소 바
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import PropTypes from 'prop-types';
import MypageActionButton from './MypageActionButton';
import { MYPAGE_LAYOUT_COPY } from '../../../constants/mypageRoleLayout';

export const buildMypageSectionTitleId = (sectionKey) => `mypage-section-${sectionKey}-title`;

/**
 * @param {object} props
 * @param {string} props.sectionKey
 * @param {string} props.title
 * @param {string} [props.caption]
 * @param {import('react').ReactNode} [props.headerAction] 보기 상태 헤더 동작 (편집 가능 패널이면 생략)
 * @param {boolean} [props.editable] true 면 헤더에 「수정」 버튼
 * @param {boolean} [props.editing]
 * @param {boolean} [props.editDisabled] 다른 섹션 편집 중
 * @param {() => void} [props.onEdit]
 * @param {() => void} [props.onCancel]
 * @param {() => void} [props.onSave] formId 가 없을 때 저장 클릭
 * @param {string} [props.formId] 저장 버튼을 이 폼의 submit 으로 연결
 * @param {boolean} [props.saving]
 */
const MypageSectionPanel = ({
  sectionKey,
  title,
  caption = '',
  headerAction = null,
  editable = false,
  editing = false,
  editDisabled = false,
  onEdit,
  onCancel,
  onSave,
  formId,
  saving = false,
  children
}) => {
  const titleId = buildMypageSectionTitleId(sectionKey);
  const panelClass = ['mg-mypage-panel', editing ? 'mg-mypage-panel--editing' : '']
    .filter(Boolean)
    .join(' ');

  let headerSlot = headerAction;
  if (editable && !editing) {
    headerSlot = (
      <MypageActionButton
        variant="outline"
        onClick={onEdit}
        disabled={editDisabled}
        aria-label={`${title} ${MYPAGE_LAYOUT_COPY.EDIT}`}
        data-testid={`mypage-section-${sectionKey}-edit`}
      >
        {MYPAGE_LAYOUT_COPY.EDIT}
      </MypageActionButton>
    );
  } else if (editable && editing) {
    headerSlot = null;
  }

  return (
    <section
      id={sectionKey}
      className={panelClass}
      aria-labelledby={titleId}
      data-mypage-section={sectionKey}
      data-testid={`mypage-section-${sectionKey}`}
    >
      <header className="mg-mypage-panel__head">
        <div className="mg-mypage-panel__head-text">
          <h2 id={titleId} className="mg-mypage-panel__title">
            {title}
          </h2>
          {caption ? <p className="mg-mypage-panel__caption">{caption}</p> : null}
        </div>
        {headerSlot ? <div className="mg-mypage-panel__actions">{headerSlot}</div> : null}
      </header>
      <div className="mg-mypage-panel__body">{children}</div>
      {editable && editing ? (
        <footer className="mg-mypage-panel__footer">
          <MypageActionButton
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
            data-testid={`mypage-section-${sectionKey}-cancel`}
          >
            {MYPAGE_LAYOUT_COPY.CANCEL}
          </MypageActionButton>
          <MypageActionButton
            variant="primary"
            type={formId ? 'submit' : 'button'}
            form={formId}
            onClick={formId ? undefined : onSave}
            loading={saving}
            disabled={saving}
            data-testid={`mypage-section-${sectionKey}-save`}
          >
            {MYPAGE_LAYOUT_COPY.SAVE}
          </MypageActionButton>
        </footer>
      ) : null}
    </section>
  );
};

MypageSectionPanel.propTypes = {
  sectionKey: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  caption: PropTypes.string,
  headerAction: PropTypes.node,
  editable: PropTypes.bool,
  editing: PropTypes.bool,
  editDisabled: PropTypes.bool,
  onEdit: PropTypes.func,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  formId: PropTypes.string,
  saving: PropTypes.bool,
  children: PropTypes.node
};

export default MypageSectionPanel;
