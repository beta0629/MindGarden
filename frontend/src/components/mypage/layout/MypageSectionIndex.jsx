/**
 * MypageSectionIndex — 「이 페이지」 목차 (sticky). IntersectionObserver 로 현재 섹션 표시.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MYPAGE_LAYOUT_COPY, MYPAGE_SECTION_LABELS } from '../../../constants/mypageRoleLayout';

/** 화면 위쪽 1/3 안에 들어온 섹션을 현재 섹션으로 본다 */
const OBSERVER_ROOT_MARGIN = '0px 0px -66% 0px';

/**
 * @param {object} props
 * @param {string[]} props.sections
 * @param {(sectionKey: string) => void} [props.onNavigate]
 */
const MypageSectionIndex = ({ sections, onNavigate }) => {
  const list = Array.isArray(sections) ? sections : [];
  const [activeKey, setActiveKey] = useState(list[0] || '');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') {
      return undefined;
    }
    const targets = list
      .map((key) => document.getElementById(key))
      .filter(Boolean);
    if (targets.length === 0) {
      return undefined;
    }
    const observer = new window.IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveKey(visible[0].target.id);
        }
      },
      { rootMargin: OBSERVER_ROOT_MARGIN }
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [list.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (list.length === 0) {
    return null;
  }

  const handleClick = (event, key) => {
    event.preventDefault();
    setActiveKey(key);
    if (onNavigate) {
      onNavigate(key);
    }
  };

  return (
    <nav
      className="mg-mypage-index mg-mypage-layout__card"
      aria-label={MYPAGE_LAYOUT_COPY.INDEX_ARIA}
      data-testid="mypage-section-index"
    >
      <h2 className="mg-mypage-index__title">{MYPAGE_LAYOUT_COPY.INDEX_TITLE}</h2>
      <ol className="mg-mypage-index__list">
        {list.map((key) => {
          const active = key === activeKey;
          return (
            <li key={key} className="mg-mypage-index__item">
              <a
                href={`#${key}`}
                className={[
                  'mg-mypage-index__link',
                  active ? 'mg-mypage-index__link--active' : ''
                ].filter(Boolean).join(' ')}
                aria-current={active ? 'location' : undefined}
                onClick={(event) => handleClick(event, key)}
                data-testid={`mypage-index-link-${key}`}
              >
                {MYPAGE_SECTION_LABELS[key]}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

MypageSectionIndex.propTypes = {
  sections: PropTypes.arrayOf(PropTypes.string).isRequired,
  onNavigate: PropTypes.func
};

export default MypageSectionIndex;
