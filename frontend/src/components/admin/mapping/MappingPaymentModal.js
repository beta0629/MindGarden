import React, { useState, useEffect } from 'react';
import { apiPost } from '../../../utils/ajax';
import { MAPPING_PAYMENT_METHOD_LABELS } from '../../../constants/billing';
import notificationManager from '../../../utils/notification';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import BadgeSelect from '../../common/BadgeSelect';
import { useTranslation } from 'react-i18next';

const ERR_PAYMENT_METHOD = '결제 방법을 선택해주세요.';
const ERR_PAYMENT_REFERENCE = '결제 참조번호를 입력해주세요.';
const ERR_PAYMENT_AMOUNT = '결제 금액은 1원 이상이어야 합니다.';

/**
 * 매칭 입금확인 모달 컴포넌트
 * - 결제 방법 선택 (계좌이체, 신용카드, 현금)
 * - 결제 참조번호 자동 생성 및 수정 가능
 * - 입금확인 처리
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-16
 */
const MappingPaymentModal = ({
    isOpen,
    onClose,
    mapping,
    onPaymentConfirmed
}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [paymentData, setPaymentData] = useState({
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: '',
        paymentAmount: 0
    });

    // 참조번호 생성 함수
    const generateReferenceNumber = (method = 'BANK_TRANSFER') => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

        if (method === 'CASH') {
            return `CASH_${timestamp}`;
        }
        if (method === 'CARD') {
            return `CARD_${timestamp}`;
        }
        if (method === 'CARD_TERMINAL') {
            return `TERM_${timestamp}`;
        }
        if (method === 'BANK_TRANSFER') {
            return `BANK_${timestamp}`;
        }
        return `${method}_${timestamp}`;
    };

    // 모달이 열릴 때 초기화
    useEffect(() => {
        if (isOpen && mapping) {
            const referenceNumber = generateReferenceNumber('BANK_TRANSFER');

            setPaymentData({
                paymentMethod: 'BANK_TRANSFER',
                paymentReference: referenceNumber,
                paymentAmount: mapping.packagePrice || 0
            });
            setErrors({});
        }
    }, [isOpen, mapping]);

    // 결제 방법 변경 시 참조번호 자동 생성
    const handlePaymentMethodChange = (method) => {
        const reference = generateReferenceNumber(method);

        setPaymentData(prev => ({
            ...prev,
            paymentMethod: method,
            paymentReference: reference
        }));
        if (errors.paymentMethod || errors.paymentReference) {
            setErrors((prev) => ({
                ...prev,
                paymentMethod: '',
                paymentReference: ''
            }));
        }
    };

    /**
     * 입금확인 전 JS validate. mapping 존재만으로 API 호출하지 않음.
     * @returns {boolean}
     */
    const validateForm = () => {
        const newErrors = {};
        if (!paymentData.paymentMethod) {
            newErrors.paymentMethod = ERR_PAYMENT_METHOD;
        }
        if (paymentData.paymentMethod !== 'CASH') {
            const ref = (paymentData.paymentReference || '').trim();
            if (!ref) {
                newErrors.paymentReference = ERR_PAYMENT_REFERENCE;
            }
        }
        const amount = Number(paymentData.paymentAmount);
        if (!Number.isFinite(amount) || amount < 1) {
            newErrors.paymentAmount = ERR_PAYMENT_AMOUNT;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 입금확인 처리
    const handleConfirmPayment = async() => {
        if (!mapping) return;
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await apiPost(`/api/v1/admin/mappings/${mapping.id}/confirm-payment`, {
                paymentMethod: paymentData.paymentMethod,
                paymentReference: paymentData.paymentMethod === 'CASH' ? null : paymentData.paymentReference,
                paymentAmount: paymentData.paymentAmount
            });

            // apiPost는 ApiResponse의 data만 반환하므로, response가 존재하면 성공
            if (response) {
                notificationManager.success('결제 확인 완료! ERP 시스템에 미수금 거래가 자동 등록되었습니다.');
                onPaymentConfirmed?.(mapping.id);
                onClose();
            } else {
                notificationManager.error('결제 확인에 실패했습니다.');
            }
        } catch (error) {
            console.error('결제 확인 실패:', error);
            const errorMessage = error.message || '결제 확인에 실패했습니다.';
            notificationManager.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !mapping) {
        return null;
    }

    // 모달이 열릴 때마다 참조번호 강제 생성
    const currentReference = paymentData.paymentReference || generateReferenceNumber(paymentData.paymentMethod);

    const paymentMethodOptions = [
        { value: 'BANK_TRANSFER', label: MAPPING_PAYMENT_METHOD_LABELS.BANK_TRANSFER },
        { value: 'CARD', label: MAPPING_PAYMENT_METHOD_LABELS.CARD },
        { value: 'CARD_TERMINAL', label: MAPPING_PAYMENT_METHOD_LABELS.CARD_TERMINAL },
        { value: 'CASH', label: MAPPING_PAYMENT_METHOD_LABELS.CASH }
    ];

    const referencePlaceholder = paymentData.paymentMethod === 'CARD_TERMINAL'
        ? '단말 승인번호 등으로 수정 (예: TERM_… 대신 실제 승인번호)'
        : '자동 생성됩니다 (필요 시 수정)';

    const referenceHelpText = paymentData.paymentMethod === 'CARD_TERMINAL'
        ? '단말기 영수증의 승인번호·거래일시를 참조번호에 입력하세요. 카드번호는 입력하지 마세요.'
        : paymentData.paymentMethod === 'CARD'
            ? '온라인 PG 승인 시 PG 거래번호 등을 입력할 수 있습니다. 자동 생성값을 덮어써도 됩니다.'
            : '자동으로 참조번호가 생성됩니다. 필요 시 수정할 수 있습니다.';

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title={t('admin.actions.paymentConfirm')}
            size="medium"
            className="mg-v2-ad-b0kla"
            backdropClick
            showCloseButton
            loading={loading}
            actions={
                <>
                    <MGButton
                        type="button"
                        variant="secondary"
                        size="medium"
                        className={buildErpMgButtonClassName({
                            variant: 'secondary',
                            size: 'md',
                            loading
                        })}
                        onClick={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();
                            onClose();
                        }}
                        disabled={loading}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                        {t('admin.actions.cancel')}
                    </MGButton>
                    <MGButton
                        type="button"
                        variant="primary"
                        size="medium"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading
                        })}
                        onClick={handleConfirmPayment}
                        disabled={loading}
                        loading={loading}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                        입금 확인
                    </MGButton>
                </>
            }
        >
            <div className="mg-v2-modal-body">
                <div className="mg-v2-ad-b0kla__card mg-v2-mapping-info-box">
                    <div className="mg-v2-mapping-info-content">
                        <div className="mg-v2-mapping-info-label">
                            매칭 정보
                        </div>
                        <div className="mg-v2-mapping-info-title">
                            {mapping.consultantName} → {mapping.clientName}
                        </div>
                        <div className="mg-v2-mapping-info-subtitle">
                            {mapping.packageName} - {mapping.packagePrice?.toLocaleString()}원
                        </div>
                    </div>
                </div>

                <div className="mg-v2-form-group">
                    <label className="mg-v2-form-label">
                        {t('admin.labels.paymentMethod')}
                        <span className="mg-v2-form-label-required">*</span>
                    </label>
                    <BadgeSelect
                        value={paymentData.paymentMethod}
                        onChange={(val) => handlePaymentMethodChange(val)}
                        options={paymentMethodOptions}
                        className="mg-v2-form-badge-select"
                        aria-label={t('admin.labels.paymentMethod')}
                    />
                    {errors.paymentMethod ? (
                        <span className="mg-v2-form-error" role="alert">{errors.paymentMethod}</span>
                    ) : null}
                </div>

                {paymentData.paymentMethod !== 'CASH' && (
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">
                            결제 참조번호
                            <span className="mg-v2-form-label-required">*</span>
                        </label>
                        <input
                            type="text"
                            value={currentReference}
                            onChange={(e) => {
                                setPaymentData(prev => ({
                                    ...prev,
                                    paymentReference: e.target.value
                                }));
                                if (errors.paymentReference) {
                                    setErrors((prev) => ({ ...prev, paymentReference: '' }));
                                }
                            }}
                            placeholder={referencePlaceholder}
                            className={`mg-v2-form-input${errors.paymentReference ? ' mg-v2-form-input-error' : ''}`}
                            aria-invalid={errors.paymentReference ? true : undefined}
                        />
                        <small className="mg-v2-form-help">
                            {referenceHelpText}
                        </small>
                        {errors.paymentReference ? (
                            <span className="mg-v2-form-error" role="alert">{errors.paymentReference}</span>
                        ) : null}
                    </div>
                )}

                <div className="mg-v2-form-group">
                    <label className="mg-v2-form-label">
                        결제 금액
                        <span className="mg-v2-form-label-required">*</span>
                    </label>
                    <input
                        type="number"
                        value={paymentData.paymentAmount}
                        onChange={(e) => {
                            setPaymentData(prev => ({
                                ...prev,
                                paymentAmount: parseInt(e.target.value, 10) || 0
                            }));
                            if (errors.paymentAmount) {
                                setErrors((prev) => ({ ...prev, paymentAmount: '' }));
                            }
                        }}
                        placeholder="결제 금액을 입력하세요"
                        className={`mg-v2-form-input${errors.paymentAmount ? ' mg-v2-form-input-error' : ''}`}
                        aria-invalid={errors.paymentAmount ? true : undefined}
                    />
                    {errors.paymentAmount ? (
                        <span className="mg-v2-form-error" role="alert">{errors.paymentAmount}</span>
                    ) : null}
                </div>
            </div>
        </UnifiedModal>
    );
};

export default MappingPaymentModal;
