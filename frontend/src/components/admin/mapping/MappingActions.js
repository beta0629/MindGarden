import React from 'react';
import { 
    MAPPING_ACTIONS, 
    MAPPING_ACTION_BUTTONS 
} from '../../../constants/mapping';
import { toDisplayString } from '../../../utils/safeDisplay';
import MGButton from '../../common/MGButton';
import './MappingActions.css';

const BOOTSTRAP_CLASS_TO_MG_VARIANT = {
    'btn-success': 'success',
    'btn-danger': 'danger',
    'btn-warning': 'warning',
    'btn-info': 'info',
    'btn-secondary': 'secondary'
};

const getVariantFromBootstrapClass = (className) => {
    const found = Object.keys(BOOTSTRAP_CLASS_TO_MG_VARIANT).find((k) => className.includes(k));
    return found ? BOOTSTRAP_CLASS_TO_MG_VARIANT[found] : 'primary';
};

/**
 * 매핑 액션 컴포넌트
/**
 * - 매핑 관련 액션 버튼들
/**
 * - 승인, 거부, 수정, 삭제 등
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const MappingActions = ({ 
    mapping, 
    onApprove, 
    onReject, 
    onEdit, 
    onDelete, 
    onView,
    onExtend,
    onSuspend,
    onActivate
}) => {
    const getActionsForStatus = (status) => {
        switch (status) {
            case 'PENDING_PAYMENT':
                return [
                    { 
                        type: MAPPING_ACTIONS.APPROVE, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.APPROVE],
                        onClick: () => onApprove?.(mapping.id)
                    },
                    { 
                        type: MAPPING_ACTIONS.REJECT, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.REJECT],
                        onClick: () => onReject?.(mapping.id)
                    }
                ];
            case 'PAYMENT_CONFIRMED':
                return [
                    { 
                        type: MAPPING_ACTIONS.ACTIVATE, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.ACTIVATE],
                        onClick: () => onActivate?.(mapping.id)
                    },
                    { 
                        type: MAPPING_ACTIONS.REJECT, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.REJECT],
                        onClick: () => onReject?.(mapping.id)
                    }
                ];
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            case 'ACTIVE':
                return [
                    { 
                        type: MAPPING_ACTIONS.EDIT, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.EDIT],
                        onClick: () => onEdit?.(mapping)
                    },
                    { 
                        type: MAPPING_ACTIONS.EXTEND, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.EXTEND],
                        onClick: () => onExtend?.(mapping)
                    },
                    { 
                        type: MAPPING_ACTIONS.SUSPEND, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.SUSPEND],
                        onClick: () => onSuspend?.(mapping.id)
                    }
                ];
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            case 'SUSPENDED':
                return [
                    { 
                        type: MAPPING_ACTIONS.ACTIVATE, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.ACTIVATE],
                        onClick: () => onActivate?.(mapping.id)
                    },
                    { 
                        type: MAPPING_ACTIONS.EDIT, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.EDIT],
                        onClick: () => onEdit?.(mapping)
                    }
                ];
            case 'TERMINATED':
            case 'SESSIONS_EXHAUSTED':
                return [
                    { 
                        type: MAPPING_ACTIONS.VIEW, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.VIEW],
                        onClick: () => onView?.(mapping)
                    }
                ];
            default:
                return [
                    { 
                        type: MAPPING_ACTIONS.VIEW, 
                        ...MAPPING_ACTION_BUTTONS[MAPPING_ACTIONS.VIEW],
                        onClick: () => onView?.(mapping)
                    }
                ];
        }
    };

    const actions = getActionsForStatus(mapping.status);

    return (
        <div className="mapping-actions">
            <div className="actions-primary">
                {actions.map((action, index) => (
                    <MGButton
                        key={index}
                        type="button"
                        variant={getVariantFromBootstrapClass(action.className)}
                        size="small"
                        className={`btn ${action.className} btn-sm`}
                        onClick={action.onClick}
                        title={toDisplayString(action.label)}
                    >
                        <i className={action.icon} />
                        <span className="action-label">{toDisplayString(action.label)}</span>
                    </MGButton>
                ))}
            </div>
            
            <div className="actions-secondary">
                <MGButton
                    type="button"
                    variant="info"
                    size="small"
                    className="btn btn-outline-info btn-sm"
                    onClick={() => onView?.(mapping)}
                    title="상세보기"
                >
                    <i className="bi bi-eye" />
                </MGButton>
                
                {mapping.status !== 'TERMINATED' && mapping.status !== 'SESSIONS_EXHAUSTED' && (
                    <MGButton
                        type="button"
                        variant="danger"
                        size="small"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => onDelete?.(mapping.id)}
                        title="삭제"
                    >
                        <i className="bi bi-trash" />
                    </MGButton>
                )}
            </div>
        </div>
    );
};

export default MappingActions;
