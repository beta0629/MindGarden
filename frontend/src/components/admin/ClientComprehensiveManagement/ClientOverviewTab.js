import { User, Calendar, Users, MessageSquare } from 'lucide-react';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { SmallCardGrid, ListTableView, StatusBadge } from '../../common';
import SafeText from '../../common/SafeText';
import { ProfileCard } from '../../ui/Card/index';
import { getUserStatusKoreanNameSync, getUserGradeKoreanNameSync, maskEncryptedDisplay } from '../../../utils/codeHelper';
import { formatKoreanMobileForDisplay } from '../../../utils/koreanMobilePhone';
import { toDisplayString } from '../../../utils/safeDisplay';
import { useTranslation } from 'react-i18next';

/**
 * 내담자 개요 탭 컴포넌트
 */
const ClientOverviewTab = ({
    clients,
    onClientSelect,
    onEditClient,
    onDeleteClient,
    onResetPassword,
    consultants,
    mappings,
    consultations,
    viewMode = 'smallCard'
}) => {
    const { t } = useTranslation();
    /** 큰/작은 카드·목록에서 동일한 내담자 작업 버튼 (행·카드 클릭과 분리) */
    const renderClientActions = (client, { compact = false, table = false } = {}) => {
        const actionClass = [
            'mg-v2-profile-card__actions',
            'mg-v2-client-actions',
            compact && 'mg-v2-client-actions--compact',
            table && 'mg-v2-client-actions--table'
        ].filter(Boolean).join(' ');

        return (
            <div
                className={actionClass}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="group"
                aria-label="내담자 작업"
            >
                <MGButton
                    variant="secondary"
                    size="small"
                    className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => onClientSelect(client)}
                    preventDoubleClick={true}
                >
                    상세보기
                </MGButton>
                <MGButton
                    variant="primary"
                    size="small"
                    className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => onEditClient(client)}
                    preventDoubleClick={true}
                >
                    {t('common.actions.edit')}
                </MGButton>
                {onResetPassword && (
                    <MGButton
                        variant="secondary"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => onResetPassword(client)}
                        title="비밀번호 초기화"
                        preventDoubleClick={true}
                    >
                        비밀번호 초기화
                    </MGButton>
                )}
                <MGButton
                    variant="danger"
                    size="small"
                    className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => onDeleteClient(client)}
                    preventDoubleClick={true}
                >
                    {t('admin.actions.delete')}
                </MGButton>
            </div>
        );
    };

    const resolveClientStatus = (clientStatus) => {
        if (clientStatus === 'ACTIVE') return 'active';
        if (clientStatus === 'INACTIVE') return 'inactive';
        return 'pending';
    };

    const renderClientCard = (client) => {
        const statusKorean = getUserStatusKoreanNameSync(client?.status);
        const gradeKorean = getUserGradeKoreanNameSync(client.grade);
        const clientMappings = mappings.filter(mapping => mapping.clientId === client.id);
        const clientConsultations = consultations.filter(consultation => consultation.clientId === client.id);

        return (
            <ProfileCard
                key={client.id}
                variant="list"
                avatar={{ profileImageUrl: client.profileImageUrl, displayName: client.name, size: 48 }}
                name={<SafeText>{maskEncryptedDisplay(client.name, '이름')}</SafeText>}
                contactInfo={{
                    email: <SafeText>{maskEncryptedDisplay(client.email, '이메일')}</SafeText>,
                    phone: <SafeText>{formatKoreanMobileForDisplay(maskEncryptedDisplay(client.phone, '전화번호'))}</SafeText>
                }}
                badges={[
                    <StatusBadge key="status" status={client?.status}>{statusKorean}</StatusBadge>,
                    <span key="grade" className="mg-v2-grade-badge"><SafeText>{gradeKorean}</SafeText></span>
                ]}
                status={resolveClientStatus(client?.status)}
                riskLevel={client.riskLevel?.toLowerCase()}
                statsItems={[
                    {
                        label: '성별',
                        icon: <User size={14} />,
                        value: client.gender === 'MALE' ? '남성' : client.gender === 'FEMALE' ? '여성' : (
                            <SafeText fallback="-">{client.gender}</SafeText>
                        )
                    },
                    {
                        label: '등록일',
                        icon: <Calendar size={14} />,
                        value: client.createdAt
                            ? new Date(client.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                            : '-'
                    },
                    { label: '매칭 수', icon: <Users size={14} />, value: clientMappings.length },
                    { label: '상담 수', icon: <MessageSquare size={14} />, value: clientConsultations.length }
                ]}
                extraInfo={
                    client.notes && !toDisplayString(client.notes, '').startsWith('legacy::')
                        ? (
                            <>
                                <span className="mg-v2-profile-card__extra-label">특이사항:</span>
                                <span className="mg-v2-profile-card__extra-value"><SafeText>{client.notes}</SafeText></span>
                            </>
                        )
                        : undefined
                }
                renderActions={() => renderClientActions(client)}
            />
        );
    };

    const renderCompactClientCard = (client) => {
        const statusKorean = getUserStatusKoreanNameSync(client?.status);
        const gradeKorean = getUserGradeKoreanNameSync(client.grade);

        return (
            <ProfileCard
                key={client.id}
                variant="compact"
                avatar={{ profileImageUrl: client.profileImageUrl, displayName: client.name, size: 36 }}
                name={<SafeText>{maskEncryptedDisplay(client.name, '이름')}</SafeText>}
                contactInfo={{
                    email: <SafeText>{maskEncryptedDisplay(client.email, '이메일')}</SafeText>,
                    phone: <SafeText>{formatKoreanMobileForDisplay(maskEncryptedDisplay(client.phone, '전화번호'))}</SafeText>
                }}
                badges={[
                    <StatusBadge key="status" status={client?.status}>{statusKorean}</StatusBadge>,
                    <span key="grade" className="mg-v2-grade-badge"><SafeText>{gradeKorean}</SafeText></span>
                ]}
                onClick={() => onClientSelect(client)}
                renderActions={() => renderClientActions(client, { compact: true })}
            />
        );
    };

    return (
        <div className="mg-v2-client-list-block">
            {clients.length === 0 ? (
                <div className="mg-v2-mapping-list-block__empty">
                    <h3 className="mg-v2-mapping-list-block__empty-title">등록된 내담자가 없습니다</h3>
                    <p className="mg-v2-mapping-list-block__empty-desc">새로운 내담자를 등록해보세요.</p>
                </div>
            ) : viewMode === 'largeCard' ? (
                <div className="mg-v2-mapping-list-block__grid">
                    {clients.map(renderClientCard)}
                </div>
            ) : viewMode === 'smallCard' ? (
                <SmallCardGrid>
                    {clients.map(renderCompactClientCard)}
                </SmallCardGrid>
            ) : (
                <ListTableView
                    columns={[
                        { key: 'name', label: '이름' },
                        { key: 'email', label: '이메일' },
                        { key: 'status', label: '상태' },
                        { key: 'grade', label: '등급', hideOnMobile: true },
                        { key: 'createdAt', label: '등록일', hideOnMobile: true },
                        { key: '_actions', label: '작업' }
                    ]}
                    data={clients}
                    renderCell={(key, item) => {
                        if (key === '_actions') return renderClientActions(item, { table: true });
                        if (key === 'name') return maskEncryptedDisplay(item.name, '이름');
                        if (key === 'email') return maskEncryptedDisplay(item.email, '이메일');
                        if (key === 'status') return getUserStatusKoreanNameSync(item?.status);
                        if (key === 'grade') return getUserGradeKoreanNameSync(item.grade);
                        if (key === 'createdAt') return item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '-';
                        const v = item[key];
                        return toDisplayString(v, '-');
                    }}
                    onRowClick={onClientSelect}
                />
            )}
        </div>
    );
};

export default ClientOverviewTab;
