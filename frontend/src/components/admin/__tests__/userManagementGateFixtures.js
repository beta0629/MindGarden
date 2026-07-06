/**
 * G2 QA gate — 사용자 관리 OverviewTab 공통 픽스처
 */
import { USER_ROLES } from '../../../constants/roles';

export const G2_ROW_VISIBILITY_MIN = 21;

export const buildManyClients = (count = G2_ROW_VISIBILITY_MIN) =>
  Array.from({ length: count }, (_, i) => ({
    id: 1000 + i,
    name: `내담자${String(i + 1).padStart(2, '0')}`,
    email: `client${i}@example.com`,
    phone: `0101234${String(i).padStart(4, '0')}`,
    status: 'ACTIVE',
    grade: 'BRONZE',
    createdAt: '2026-01-15T00:00:00.000Z'
  }));

export const buildManyConsultants = (count = G2_ROW_VISIBILITY_MIN) =>
  Array.from({ length: count }, (_, i) => ({
    id: 2000 + i,
    name: `상담사${String(i + 1).padStart(2, '0')}`,
    email: `consultant${i}@example.com`,
    phone: `0109876${String(i).padStart(4, '0')}`,
    status: 'ACTIVE',
    professionalProviderTypeCode: 'COUNSELOR',
    createdAt: '2026-01-15T00:00:00.000Z',
    currentClients: i % 5
  }));

export const buildManyStaff = (count = G2_ROW_VISIBILITY_MIN) =>
  Array.from({ length: count }, (_, i) => ({
    id: 3000 + i,
    name: `스태프${String(i + 1).padStart(2, '0')}`,
    email: `staff${i}@example.com`,
    phone: `0101111${String(i).padStart(4, '0')}`,
    role: USER_ROLES.STAFF,
    isActive: true,
    createdAt: '2026-01-15T00:00:00.000Z'
  }));
