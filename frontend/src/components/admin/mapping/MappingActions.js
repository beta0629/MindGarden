import React from 'react';
import { 
    MAPPING_ACTIONS, 
    MAPPING_ACTION_BUTTONS 
} from '../../../constants/mapping';
import './MappingActions.css';

/**
 * 매핑 액션 컴포넌트
/**
 * - 매핑 관련 액션 버튼들
/**
 * - 승인, 거부, 수정, 삭제 등
/**
 * 
/**
 * @author MindGarden
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
                    <button
                        key={index}
                        className={`btn ${action.className} btn-sm`}
                        onClick={action.onClick}
                        title={action.label}
                    >
                        <i className={action.icon}></i>
                        <span className="action-label">{action.label}</span>
                    </button>
                ))}
            </div>
            
            <div className="actions-secondary">
                <button
                    className="btn btn-outline-info btn-sm"
                    onClick={() => onView?.(mapping)}
                    title="상세보기"
                >
                    <i className="bi bi-eye"></i>
                </button>
                
                {mapping.status !== 'TERMINATED' && mapping.status !== 'SESSIONS_EXHAUSTED' && (
                    <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => onDelete?.(mapping.id)}
                        title="삭제"
                    >
                        <i className="bi bi-trash"></i>
                    </button>
                )}
            </div>
        </div>
    );
};

export default MappingActions;
