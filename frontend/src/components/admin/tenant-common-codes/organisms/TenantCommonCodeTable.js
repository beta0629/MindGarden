/**
 * TenantCommonCodeTable — ListTableView + EntityRowActions (G5-02)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ListTableView,
  StatusBadge,
  EntityRowActions,
  ENTITY_ROW_ACTIONS_LAYOUT,
  EmptyState
} from '../../common';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  TENANT_COMMON_CODE_TABLE_COLUMNS,
  TENANT_COMMON_CODE_TABLE_COLUMN_KEYS,
  TENANT_COMMON_CODE_ROW_ACTIONS,
  TENANT_COMMON_CODE_TABLE_ARIA
} from '../../../constants/tenantCommonCodeTableConstants';
import { getOverrideStatusLabel } from '../../../utils/tenantCommonCodeDiff';
import './TenantCommonCodeTable.css';

const TABLE_COLUMNS = [
  { key: TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.CODE_VALUE, label: TENANT_COMMON_CODE_TABLE_COLUMNS.CODE_ID },
  { key: TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.CODE_LABEL, label: TENANT_COMMON_CODE_TABLE_COLUMNS.CODE_NAME },
  {
    key: TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.CODE_GROUP,
    label: TENANT_COMMON_CODE_TABLE_COLUMNS.GROUP_NAME,
    hideOnMobile: true
  },
  { key: TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.OVERRIDE, label: TENANT_COMMON_CODE_TABLE_COLUMNS.OVERRIDE },
  { key: TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.IS_ACTIVE, label: TENANT_COMMON_CODE_TABLE_COLUMNS.STATUS },
  { key: TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.ACTIONS, label: TENANT_COMMON_CODE_TABLE_COLUMNS.ACTIONS }
];

/**
 * @param {object} code
 * @param {object} handlers
 * @returns {{ primaryAction: object, items: object[] }}
 */
export const buildTenantCommonCodeRowActions = (code, handlers) => {
  const { onEdit, onDelete, onToggleActive, onResetGlobal } = handlers;
  const isActive = code.isActive !== false;
  const canReset = code.overrideStatus === 'override' || code.overrideStatus === 'global_match';

  const items = [
    {
      id: 'toggle-active',
      label: isActive ? TENANT_COMMON_CODE_ROW_ACTIONS.DEACTIVATE : TENANT_COMMON_CODE_ROW_ACTIONS.ACTIVATE,
      onClick: () => onToggleActive(code)
    },
    {
      id: 'reset-global',
      label: TENANT_COMMON_CODE_ROW_ACTIONS.RESET_GLOBAL,
      onClick: () => onResetGlobal(code),
      hidden: !canReset
    },
    {
      id: 'delete',
      label: TENANT_COMMON_CODE_ROW_ACTIONS.DELETE,
      onClick: () => onDelete(code),
      variant: 'destructive'
    }
  ];

  return {
    primaryAction: {
      label: TENANT_COMMON_CODE_ROW_ACTIONS.EDIT,
      onClick: () => onEdit(code)
    },
    items
  };
};

const TenantCommonCodeTable = ({
  codes,
  loading,
  groupLabelByName,
  onRowClick,
  onEdit,
  onDelete,
  onToggleActive,
  onResetGlobal
}) => {
  const actionHandlers = useMemo(() => ({
    onEdit,
    onDelete,
    onToggleActive,
    onResetGlobal
  }), [onEdit, onDelete, onToggleActive, onResetGlobal]);

  const renderRowActions = useCallback((code) => {
    const config = buildTenantCommonCodeRowActions(code, actionHandlers);
    return (
      <EntityRowActions
        layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
        ariaLabel={TENANT_COMMON_CODE_TABLE_ARIA.ROW_ACTIONS}
        {...config}
      />
    );
  }, [actionHandlers]);

  const renderCell = useCallback((columnKey, code) => {
    if (columnKey === TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.ACTIONS) {
      return renderRowActions(code);
    }
    if (columnKey === TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.CODE_VALUE) {
      return <SafeText tag="span">{toDisplayString(code.codeValue, '—')}</SafeText>;
    }
    if (columnKey === TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.CODE_LABEL) {
      const label = code.codeLabel || code.koreanName || code.codeValue;
      return <SafeText tag="span">{toDisplayString(label, '—')}</SafeText>;
    }
    if (columnKey === TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.CODE_GROUP) {
      const groupName = code.codeGroup || '';
      const display = groupLabelByName?.[groupName] || groupName;
      return <SafeText tag="span">{toDisplayString(display, '—')}</SafeText>;
    }
    if (columnKey === TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.OVERRIDE) {
      const label = getOverrideStatusLabel(code.overrideStatus);
      const variant = code.overrideStatus === 'override'
        ? 'warning'
        : code.overrideStatus === 'tenant_only'
          ? 'info'
          : 'neutral';
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    }
    if (columnKey === TENANT_COMMON_CODE_TABLE_COLUMN_KEYS.IS_ACTIVE) {
      const isActive = code.isActive !== false;
      return (
        <StatusBadge variant={isActive ? 'success' : 'neutral'}>
          {isActive ? '활성' : '비활성'}
        </StatusBadge>
      );
    }
    return <SafeText tag="span">—</SafeText>;
  }, [groupLabelByName, renderRowActions]);

  if (loading && codes.length === 0) {
    return <UnifiedLoading type="inline" text="불러오는 중..." />;
  }

  if (!loading && codes.length === 0) {
    return (
      <EmptyState
        title="등록된 코드가 없습니다"
        description="코드 추가 버튼으로 테넌트 전용 코드를 등록하세요."
      />
    );
  }

  return (
    <ListTableView
      columns={TABLE_COLUMNS}
      data={codes}
      renderCell={renderCell}
      onRowClick={onRowClick}
      className="mg-v2-ad-b0kla__data-table--comfortable tenant-common-code-table"
      rowKeyField="id"
    />
  );
};

TenantCommonCodeTable.propTypes = {
  codes: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  groupLabelByName: PropTypes.object,
  onRowClick: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleActive: PropTypes.func.isRequired,
  onResetGlobal: PropTypes.func.isRequired
};

TenantCommonCodeTable.defaultProps = {
  codes: [],
  loading: false,
  groupLabelByName: {},
  onRowClick: null
};

export default TenantCommonCodeTable;
