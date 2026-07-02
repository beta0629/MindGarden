/**
 * StaffOverviewTab — 스태ff list/card 뷰 + Side Peek 행 클릭
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { User, Mail, Phone } from 'lucide-react';
import {
  SmallCardGrid,
  ListTableView,
  StatusBadge,
  EntityRowActions,
  ENTITY_ROW_ACTIONS_LAYOUT,
  USER_MANAGEMENT_DEFAULT_VIEW_MODE
} from '../../common';
import { ProfileCard } from '../../ui/Card/index';
import { maskEncryptedDisplay } from '../../../utils/codeHelper';
import { formatKoreanMobileForDisplay } from '../../../utils/koreanMobilePhone';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  STAFF_MGMT_ARIA,
  STAFF_MGMT_BUTTON,
  STAFF_MGMT_MASK,
  STAFF_MGMT_PAGE,
  STAFF_MGMT_ROLE_LABELS,
  STAFF_MGMT_STATUS,
  STAFF_MGMT_TABLE
} from '../../../constants/staffManagementStrings';
import { USER_ROLES } from '../../../constants/roles';

const roleOf = (staff) => (typeof staff?.role === 'string' ? staff.role : staff?.role?.name) || '';

const StaffOverviewTab = ({
  staffList,
  onStaffPeek,
  onStaffSelect,
  onEditStaff,
  onRoleChange,
  onDeleteStaff,
  sessionUserId,
  viewMode = USER_MANAGEMENT_DEFAULT_VIEW_MODE
}) => {
  const handleRowPeek = useCallback((staff) => {
    if (onStaffPeek) {
      onStaffPeek(staff);
      return;
    }
    if (onStaffSelect) {
      onStaffSelect(staff);
    }
  }, [onStaffPeek, onStaffSelect]);

  const buildStaffActionItems = useCallback((staff) => {
    const isSelf = sessionUserId != null && staff?.id != null
      && Number(sessionUserId) === Number(staff.id);
    return [
      {
        id: 'detail',
        label: STAFF_MGMT_BUTTON.DETAIL,
        onClick: () => handleRowPeek(staff)
      },
      {
        id: 'edit',
        label: STAFF_MGMT_BUTTON.EDIT,
        onClick: () => onEditStaff(staff)
      },
      {
        id: 'role-change',
        label: STAFF_MGMT_BUTTON.ROLE_CHANGE,
        onClick: () => onRoleChange(staff)
      },
      {
        id: 'delete',
        label: STAFF_MGMT_BUTTON.DELETE,
        onClick: () => onDeleteStaff(staff),
        variant: 'destructive',
        disabled: isSelf,
        title: isSelf ? '자기 자신은 삭제할 수 없습니다.' : undefined
      }
    ];
  }, [handleRowPeek, onEditStaff, onRoleChange, onDeleteStaff, sessionUserId]);

  const renderStaffActions = useCallback((staff, { layout = ENTITY_ROW_ACTIONS_LAYOUT.TABLE } = {}) => (
    <EntityRowActions
      layout={layout}
      ariaLabel={STAFF_MGMT_ARIA.STAFF_ACTIONS}
      items={buildStaffActionItems(staff)}
    />
  ), [buildStaffActionItems]);

  if (staffList.length === 0) {
    return (
      <div className="mg-v2-mapping-list-block__empty">
        <div className="mg-v2-mapping-list-block__empty-icon">
          <User size={48} />
        </div>
        <h3 className="mg-v2-mapping-list-block__empty-title">
          {STAFF_MGMT_PAGE.EMPTY_NO_SEARCH_TITLE}
        </h3>
        <p className="mg-v2-mapping-list-block__empty-desc">
          {STAFF_MGMT_PAGE.EMPTY_NO_SEARCH_DESC}
        </p>
      </div>
    );
  }

  if (viewMode === 'largeCard') {
    return (
      <div className="mg-v2-mapping-list-block__grid">
        {staffList.map((staff) => (
          <ProfileCard
            key={staff.id}
            variant="list"
            avatar={{ profileImageUrl: staff.profileImageUrl, displayName: toDisplayString(staff.name), size: 48 }}
            name={maskEncryptedDisplay(staff.name, STAFF_MGMT_MASK.NAME)}
            contactInfo={{
              email: <><Mail size={12} /> {maskEncryptedDisplay(staff.email, STAFF_MGMT_MASK.EMAIL)}</>,
              phone: <><Phone size={12} /> {formatKoreanMobileForDisplay(maskEncryptedDisplay(staff.phone, STAFF_MGMT_MASK.PHONE_NONE))}</>
            }}
            badges={[
              <StatusBadge key="role" variant={staff.role === USER_ROLES.ADMIN ? 'info' : 'neutral'}>
                {STAFF_MGMT_ROLE_LABELS[staff.role] || staff.role}
              </StatusBadge>,
              <StatusBadge key="status" variant={staff.isActive ? 'success' : 'neutral'}>
                {staff.isActive ? STAFF_MGMT_STATUS.ACTIVE : STAFF_MGMT_STATUS.INACTIVE}
              </StatusBadge>
            ]}
            onClick={() => handleRowPeek(staff)}
            renderActions={() => renderStaffActions(staff, { layout: ENTITY_ROW_ACTIONS_LAYOUT.CARD })}
          />
        ))}
      </div>
    );
  }

  if (viewMode === 'smallCard') {
    return (
      <SmallCardGrid>
        {staffList.map((staff) => (
          <ProfileCard
            key={staff.id}
            variant="compact"
            avatar={{ profileImageUrl: staff.profileImageUrl, displayName: toDisplayString(staff.name), size: 36 }}
            name={maskEncryptedDisplay(staff.name, STAFF_MGMT_MASK.NAME)}
            contactInfo={{
              email: <><Mail size={12} /> {maskEncryptedDisplay(staff.email, STAFF_MGMT_MASK.EMAIL)}</>,
              phone: <><Phone size={12} /> {formatKoreanMobileForDisplay(maskEncryptedDisplay(staff.phone, STAFF_MGMT_MASK.PHONE_NONE))}</>
            }}
            badges={[
              <StatusBadge key="role" variant={staff.role === USER_ROLES.ADMIN ? 'info' : 'neutral'}>
                {STAFF_MGMT_ROLE_LABELS[staff.role] || staff.role}
              </StatusBadge>,
              <StatusBadge key="status" variant={staff.isActive ? 'success' : 'neutral'}>
                {staff.isActive ? STAFF_MGMT_STATUS.ACTIVE : STAFF_MGMT_STATUS.INACTIVE}
              </StatusBadge>
            ]}
            onClick={() => handleRowPeek(staff)}
            renderActions={() => renderStaffActions(staff, { layout: ENTITY_ROW_ACTIONS_LAYOUT.CORNER })}
          />
        ))}
      </SmallCardGrid>
    );
  }

  return (
    <ListTableView
      columns={[
        { key: 'name', label: STAFF_MGMT_TABLE.COL_NAME },
        { key: 'email', label: STAFF_MGMT_TABLE.COL_EMAIL },
        { key: 'role', label: STAFF_MGMT_TABLE.COL_ROLE },
        { key: 'isActive', label: STAFF_MGMT_TABLE.COL_STATUS },
        { key: '_actions', label: STAFF_MGMT_TABLE.COL_ACTIONS }
      ]}
      data={staffList}
      renderCell={(key, item) => {
        if (key === '_actions') {
          return renderStaffActions(item, { layout: ENTITY_ROW_ACTIONS_LAYOUT.TABLE });
        }
        if (key === 'role') return STAFF_MGMT_ROLE_LABELS[item.role] || item.role;
        if (key === 'isActive') return item.isActive ? STAFF_MGMT_STATUS.ACTIVE : STAFF_MGMT_STATUS.INACTIVE;
        if (key === 'name') return maskEncryptedDisplay(item.name, STAFF_MGMT_MASK.NAME);
        if (key === 'email') return maskEncryptedDisplay(item.email, STAFF_MGMT_MASK.EMAIL);
        const v = item[key];
        return v != null ? String(v) : '-';
      }}
      onRowClick={handleRowPeek}
    />
  );
};

StaffOverviewTab.propTypes = {
  staffList: PropTypes.arrayOf(PropTypes.object).isRequired,
  onStaffPeek: PropTypes.func,
  onStaffSelect: PropTypes.func,
  onEditStaff: PropTypes.func.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  onDeleteStaff: PropTypes.func.isRequired,
  sessionUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  viewMode: PropTypes.oneOf(['largeCard', 'smallCard', 'list'])
};

StaffOverviewTab.defaultProps = {
  onStaffPeek: null,
  onStaffSelect: null,
  sessionUserId: null,
  viewMode: USER_MANAGEMENT_DEFAULT_VIEW_MODE
};

export default StaffOverviewTab;
