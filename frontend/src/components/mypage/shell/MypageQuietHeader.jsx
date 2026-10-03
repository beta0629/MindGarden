/**
 * MypageQuietHeader — Clinic-OS quiet page header (h1 「마이페이지」 + 캡션 1줄, 오른쪽 버튼 없음)
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import { MYPAGE_TITLE_ID } from '../../../constants/mypageUi';
import { MYPAGE_LAYOUT_COPY } from '../../../constants/mypageRoleLayout';

const MypageQuietHeader = () => (
  <div className="mg-mypage-header" data-testid="mypage-quiet-header">
    <h1 id={MYPAGE_TITLE_ID} className="mg-mypage-header__title">
      {MYPAGE_LAYOUT_COPY.TITLE}
    </h1>
    <p className="mg-mypage-header__caption">{MYPAGE_LAYOUT_COPY.CAPTION}</p>
  </div>
);

export default MypageQuietHeader;
