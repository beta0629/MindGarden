import { User, Calendar, Users, MessageSquare } from 'lucide-react';
import { SmallCardGrid, ListTableView, StatusBadge, EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../../common';
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

    const buildClientActionItems = (client) => {
        const items = [
            {
                id: 'edit',
                label: t('common.actions.edit'),
                onClick: () => onEditClient(client)
            }
        ];
        if (onResetPassword) {
            items.push({
                id: 'reset-password',
                label: '비밀번호 초기화',
                title: '비밀번호 초기화',
                onClick: () => onResetPassword(client)
            });
        }
        items.push({
            id: 'delete',
            label: t('admin.actions.delete'),
            onClick: () => onDeleteClient(client),
            variant: 'destructive'
        });
        return items;
    };

    const renderClientActions = (client, { layout = ENTITY_ROW_ACTIONS_LAYOUT.TABLE } = {}) => (
        <EntityRowActions
            layout={layout}
            ariaLabel="내담자 작업"
            items={buildClientActionItems(client)}
        />
    );

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
                onClick={() => onClientSelect(client)}
                renderActions={() => renderClientActions(client, { layout: ENTITY_ROW_ACTIONS_LAYOUT.CARD })}
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
                renderActions={() => renderClientActions(client, { layout: ENTITY_ROW_ACTIONS_LAYOUT.CORNER })}
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
                        if (key === '_actions') {
                            return renderClientActions(item, { layout: ENTITY_ROW_ACTIONS_LAYOUT.TABLE });
                        }
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
