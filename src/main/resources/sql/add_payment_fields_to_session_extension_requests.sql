-- session_extension_requests 테이블에 결제 정보 컬럼 추가
ALTER TABLE session_extension_requests 
ADD COLUMN payment_method VARCHAR(50) COMMENT '결제 방법 (CARD, BANK_TRANSFER, CASH 등)',
ADD COLUMN payment_reference VARCHAR(200) COMMENT '결제 참조번호 (현금의 경우 null 허용)',
ADD COLUMN payment_date DATETIME COMMENT '결제일시';
