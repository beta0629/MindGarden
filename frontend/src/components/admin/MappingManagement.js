/**
 * 매칭 관리 페이지 - 아토믹 구조 래퍼
 * 실제 구현은 mapping-management/MappingManagementPage에서 수행
 *
 * @author MindGarden
 * @since 2024-12-19
 * @updated 2025-02-22 - 아토믹 디자인 리팩터링
 */

import React from 'react';
import { MappingManagementPage } from './mapping-management';

const MappingManagement = () => {
  return <MappingManagementPage />;
};

export default MappingManagement;
