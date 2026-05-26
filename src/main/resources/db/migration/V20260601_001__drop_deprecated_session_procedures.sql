-- 회기 관련 표준화 프로시저 5종 폐기 (1A 결정, ad4592ee8 합의서)
-- core_solution 스키마 단독 적용. mind_garden 스키마 미접촉.
DROP PROCEDURE IF EXISTS UseSessionForMapping;
DROP PROCEDURE IF EXISTS AddSessionsToMapping;
DROP PROCEDURE IF EXISTS ProcessRefundWithSessionAdjustment;
DROP PROCEDURE IF EXISTS ProcessPartialRefund;
DROP PROCEDURE IF EXISTS GetRefundableSessions;
