import React, { useState, useEffect } from 'react';
import { 
    Modal, Form, Button, Row, Col, Alert, 
    FormSelect, FormControl
} from 'react-bootstrap';
import { FaExchangeAlt, FaUsers, FaBuilding } from 'react-icons/fa';
import { apiGet, apiPost } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import { getBranchNameByCode } from '../../utils/branchUtils';
import './BranchUserTransfer.css';

/**
 * 지점 간 사용자 이동 컴포넌트
 * - 사용자 선택 및 대상 지점 선택
 * - 이동 사유 입력
 * - 일괄 이동 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const BranchUserTransfer = ({ 
    show, 
    onHide, 
    selectedUsers, 
    sourceBranch, 
    branches,
    onTransferComplete 
}) => {
    // 폼 데이터
    const [transferForm, setTransferForm] = useState({
        targetBranchCode: '',
        reason: ''
    });

    // UI 상태
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // 모달이 열릴 때 폼 초기화
    useEffect(() => {
        if (show) {
            setTransferForm({
                targetBranchCode: '',
                reason: ''
            });
            setErrors({});
        }
    }, [show]);

    // 입력 필드 변경 핸들러
    const handleInputChange = (field, value) => {
        setTransferForm(prev => ({
            ...prev,
            [field]: value
        }));
        
        // 에러 클리어
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // 폼 유효성 검사
    const validateForm = () => {
        const newErrors = {};

        if (!transferForm.targetBranchCode) {
            newErrors.targetBranchCode = '대상 지점을 선택해주세요';
        }

        if (selectedUsers.length === 0) {
            newErrors.users = '이동할 사용자를 선택해주세요';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 사용자 이동 실행
    const handleTransfer = async () => {
        if (!validateForm()) {
            showNotification('입력 정보를 확인해주세요.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                userIds: selectedUsers,
                targetBranchCode: transferForm.targetBranchCode,
                reason: transferForm.reason || '지점 이동'
            };

            const response = await apiPost('/api/hq/branches/users/transfer', requestData);
            
            if (response.success) {
                showNotification(`성공적으로 ${selectedUsers.length}명의 사용자를 이동했습니다.`, 'success');
                onTransferComplete && onTransferComplete(response.data);
                onHide();
            } else {
                showNotification(response.message || '사용자 이동에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('사용자 이동 실패:', error);
            showNotification('사용자 이동에 실패했습니다: ' + (error.message || '알 수 없는 오류'), 'error');
        } finally {
            setLoading(false);
        }
    };

    // 대상 지점 목록 (현재 지점 제외)
    const availableBranches = branches.filter(branch => 
        branch.branchCode !== sourceBranch?.branchCode && branch.isActive
    );

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaExchangeAlt className="me-2" />
                    사용자 지점 이동
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                {/* 선택된 사용자 정보 */}
                <Alert variant="info" className="mb-4">
                    <div className="d-flex align-items-center">
                        <FaUsers className="me-2" />
                        <div>
                            <strong>{selectedUsers.length}명의 사용자</strong>를 다른 지점으로 이동합니다.
                            {sourceBranch && (
                                <div className="small text-muted mt-1">
                                    출발 지점: {sourceBranch.name} ({sourceBranch.code})
                                </div>
                            )}
                        </div>
                    </div>
                </Alert>

                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    <FaBuilding className="me-1" />
                                    대상 지점 *
                                </Form.Label>
                                <FormSelect
                                    value={transferForm.targetBranchCode}
                                    onChange={(e) => handleInputChange('targetBranchCode', e.target.value)}
                                    isInvalid={!!errors.targetBranchCode}
                                    className="form-control-modern"
                                >
                                    <option value="">지점을 선택하세요</option>
                                    {availableBranches.map(branch => (
                                        <option key={branch.id} value={branch.branchCode}>
                                            {branch.branchName} ({branch.branchCode})
                                        </option>
                                    ))}
                                </FormSelect>
                                {errors.targetBranchCode && (
                                    <Form.Control.Feedback type="invalid">
                                        {errors.targetBranchCode}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>이동 사유</Form.Label>
                                <FormControl
                                    type="text"
                                    placeholder="이동 사유를 입력하세요 (선택사항)"
                                    value={transferForm.reason}
                                    onChange={(e) => handleInputChange('reason', e.target.value)}
                                    className="form-control-modern"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* 이동 대상 지점 정보 */}
                    {transferForm.targetBranchCode && (
                        <Alert variant="success" className="mt-3">
                            <div className="d-flex align-items-center">
                                <FaBuilding className="me-2" />
                                <div>
                                    <strong>이동 대상 지점:</strong>
                                    {availableBranches.find(b => b.code === transferForm.targetBranchCode)?.name}
                                    <div className="small text-muted">
                                        코드: {transferForm.targetBranchCode}
                                    </div>
                                </div>
                            </div>
                        </Alert>
                    )}
                </Form>
            </Modal.Body>
            
            <Modal.Footer>
                <Button 
                    variant="secondary" 
                    onClick={onHide}
                    disabled={loading}
                >
                    취소
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleTransfer}
                    disabled={loading || selectedUsers.length === 0}
                    className="transfer-btn"
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            이동 중...
                        </>
                    ) : (
                        <>
                            <FaExchangeAlt className="me-2" />
                            {selectedUsers.length}명 이동 실행
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default BranchUserTransfer;
