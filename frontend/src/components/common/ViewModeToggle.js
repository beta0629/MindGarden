/**
 * ViewModeToggle - 목록 보기 전환용 공통 톱글 (큰 카드 / 작은 카드 / 리스트)
 * B0KlA pill 토글 스타일 사용. 사용자 관리·매칭 리스트 등 목록 블록 헤더에 배치.
 *
 * @author Core Solution
 * @since 2025-03-17
 * @see docs/project-management/USER_MANAGEMENT_VIEW_MODE_MEETING.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import { LayoutGrid, Grid2X2, List } from 'lucide-react';
import { toDisplayString } from '../../utils/safeDisplay';
import MGButton from './MGButton';

/** 기본 옵션: 큰 카드 / 작은 카드 / 리스트 (문서 §3.3) */
const DEFAULT_OPTIONS = [
  { value: 'largeCard', icon: LayoutGrid, label: '큰 카드' },
  { value: 'smallCard', icon: Grid2X2, label: '작은 카드' },
  { value: 'list', icon: List, label: '리스트' }
];

/**
 * @param {Object} props
 * @param {'largeCard'|'smallCard'|'list'} props.viewMode - 현재 보기 모드
 * @param {(mode: 'largeCard'|'smallCard'|'list') => void} props.onViewModeChange - 모드 변경 콜백
 * @param {Array<{ value: string, icon: React.ComponentType, label: string, title?: string }>} [props.options] - 옵션 목록(기본값: 큰카드/작은카드/리스트)
 * @param {string} [props.className] - 컨테이너 추가 클래스
 * @param {string} [props.ariaLabel] - 톱글 그룹 aria-label
 */
function ViewModeToggle({
  viewMode,
  onViewModeChange,
  options = DEFAULT_OPTIONS,
  className = '',
  ariaLabel = '목록 보기 전환'
}) {
  const baseClass = 'mg-v2-ad-b0kla__pill-toggle';
  const containerClass = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={containerClass}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = viewMode === opt.value;
        const title = toDisplayString(opt.title ?? opt.label);
        return (
          <MGButton
            key={opt.value}
            type="button"
            variant="outline"
            size="small"
            className={`mg-v2-ad-b0kla__pill ${isActive ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
            onClick={() => onViewModeChange(opt.value)}
            aria-pressed={isActive}
            aria-label={toDisplayString(opt.label)}
            title={title}
            preventDoubleClick={false}
          >
            <Icon size={16} />
          </MGButton>
        );
      })}
    </div>
  );
}

ViewModeToggle.propTypes = {
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      label: PropTypes.string.isRequired,
      title: PropTypes.string
    })
  ),
  className: PropTypes.string,
  ariaLabel: PropTypes.string
};

ViewModeToggle.defaultProps = {
  options: DEFAULT_OPTIONS,
  className: '',
  ariaLabel: '목록 보기 전환'
};

export default ViewModeToggle;
