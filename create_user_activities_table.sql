-- 사용자 활동 내역 샘플 데이터 삽입 (테스트용)
-- Hibernate가 자동으로 테이블을 생성하므로 데이터만 삽입
INSERT INTO user_activities (user_id, activity_type, title, description, status, icon, color, related_id, related_type) VALUES
(83, 'CONSULTATION', '김선희 상담사와의 상담 일정 등록', '2025년 1월 15일 오후 2시 상담 예약이 완료되었습니다.', 'COMPLETED', 'bi-calendar-check', '#28a745', 1, 'CONSULTATION'),
(83, 'CONSULTATION', '상담 일정 확정', '김선희 상담사와의 상담이 확정되었습니다.', 'COMPLETED', 'bi-check-circle', '#007bff', 1, 'CONSULTATION'),
(83, 'PAYMENT', '상담 패키지 결제 완료', '5회 상담 패키지 (150,000원) 결제가 완료되었습니다.', 'COMPLETED', 'bi-credit-card', '#6f42c1', 1, 'PAYMENT'),
(83, 'SYSTEM', '상담 리마인더 알림', '내일 오후 2시 상담 일정이 있습니다.', 'INFO', 'bi-bell', '#ffc107', 1, 'CONSULTATION'),
(83, 'CONSULTATION', '상담사 피드백 수신', '김선희 상담사님으로부터 상담 후 피드백을 받았습니다.', 'COMPLETED', 'bi-chat-dots', '#17a2b8', 1, 'CONSULTATION'),
(83, 'SYSTEM', '프로필 정보 업데이트', '연락처 정보가 성공적으로 변경되었습니다.', 'COMPLETED', 'bi-person-gear', '#6c757d', 83, 'PROFILE'),
(83, 'PAYMENT', '환불 요청 접수', '미사용 상담 회기에 대한 환불 요청이 접수되었습니다.', 'PENDING', 'bi-arrow-clockwise', '#fd7e14', 2, 'PAYMENT'),
(83, 'CONSULTATION', '상담 일정 변경', '기존 상담 일정이 1월 20일 오후 3시로 변경되었습니다.', 'COMPLETED', 'bi-calendar-event', '#20c997', 1, 'CONSULTATION');
