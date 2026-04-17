-- tenant_pg_configurations.pg_provider 체크 제약에 KICC(KICC 이지페이) 추가
-- V11__create_tenant_pg_configuration_tables.sql 의 chk_tenant_pg_provider 갱신

ALTER TABLE tenant_pg_configurations
DROP CHECK chk_tenant_pg_provider;

ALTER TABLE tenant_pg_configurations
ADD CONSTRAINT chk_tenant_pg_provider CHECK (pg_provider IN (
    'TOSS', 'IAMPORT', 'KAKAO', 'NAVER', 'PAYPAL', 'STRIPE', 'KICC'
));
