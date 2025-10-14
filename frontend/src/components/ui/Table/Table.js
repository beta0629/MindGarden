/**
 * MindGarden 디자인 시스템 v2.0 - Table Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 * @reference /docs/design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md (Table 섹션)
 * @reference http://localhost:3000/design-system (TableShowcase)
 * 
 * ⚠️ 중요: 모든 <td>에 data-label 속성 필수 (모바일 반응형)
 */

import React from 'react';

/**
 * 재사용 가능한 테이블 컴포넌트
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 테이블 내용 (thead, tbody)
 * @param {boolean} [props.striped=false] - 줄무늬 스타일
 * @param {boolean} [props.hoverable=true] - 호버 효과
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <Table striped>
 *   <thead>
 *     <tr>
 *       <th>이름</th>
 *       <th>이메일</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td data-label="이름">김민지</td>
 *       <td data-label="이메일">minji@example.com</td>
 *     </tr>
 *   </tbody>
 * </Table>
 */
const Table = ({
  children,
  striped = false,
  hoverable = true,
  className = '',
  ...props
}) => {
  const baseClass = 'mg-table';
  const stripedClass = striped ? 'mg-table-striped' : '';
  const hoverClass = hoverable ? 'mg-table-hover' : '';

  const allClasses = [
    baseClass,
    stripedClass,
    hoverClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="mg-table-container">
      <table className={allClasses} {...props}>
        {children}
      </table>
    </div>
  );
};

export default Table;

