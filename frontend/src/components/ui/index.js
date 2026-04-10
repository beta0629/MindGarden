/**
 * Core Solution 디자인 시스템 v2.0 - UI Components Library
 *
 * 모든 표준화된 UI 컴포넌트를 한 곳에서 import 가능
 *
 * @example
 * import { Button, Card, Modal, Loading } from '@/components/ui';
 *
 * @author Core Solution Team
 * @version 2.0.0
 * @since 2025-11-28
 */

// 기본 UI 컴포넌트들
export { default as Button } from './Button/Button';
export { default as Card } from './Card/Card';
/** @deprecated common/modals/UnifiedModal 사용 권장. Modal은 UnifiedModal re-export */
export { default as Modal } from './Modal/Modal';
export { default as Loading } from './Loading/Loading';

// 폼 컴포넌트들
export { default as Input } from './Input/Input';
export { default as Select } from './Select/Select';

// 데이터 표시
export { default as Table } from './Table/Table';

/**
 * 타입(JSDoc): `ButtonProps`는 `./Button/Button.js` 상단 @typedef 참고 (MGButton 계약 + icon/iconPosition/theme role).
 * ESLint 파서 호환을 위해 Flow `export type` 미사용.
 */
