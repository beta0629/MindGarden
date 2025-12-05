#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JavaDoc 주석 형식 오류 일괄 수정 스크립트
"""

import os
import re
import sys
from pathlib import Path

# 인코딩 설정
if sys.platform == 'win32':
    sys.stdout = open(sys.stdout.buffer.fileno(), 'w', encoding='utf-8', errors='replace')
    sys.stderr = open(sys.stderr.buffer.fileno(), 'w', encoding='utf-8', errors='replace')

def fix_javadoc_in_file(file_path):
    """파일에서 JavaDoc 주석 형식 오류 수정"""
    try:
        file_path_str = str(file_path)
        with open(file_path_str, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        fixed_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # 패턴 1: ` * 설명` 형태로 시작하는 주석 (/** 누락)
            # 이전 줄이 비어있거나 import/package가 아닌 경우
            if re.match(r'^\s+\* [^*]', line) and i > 0:
                prev_line = lines[i-1].strip()
                # 이전 줄이 비어있거나 import/package/annotation이 아닌 경우
                if (not prev_line or 
                    (not prev_line.startswith('import') and 
                     not prev_line.startswith('package') and
                     not prev_line.startswith('@') and
                     not prev_line.startswith('//') and
                     '*/' not in prev_line)):
                    # /** 추가
                    indent = len(line) - len(line.lstrip())
                    fixed_lines.append(' ' * indent + '/**\n')
            
            fixed_lines.append(line)
            i += 1
        
        content = ''.join(fixed_lines)
        
        # 패턴 2: 클래스/메서드 바로 위의 주석 블록이 /** 없이 시작하는 경우
        # ` * 설명` 형태의 연속된 주석 블록 찾기
        content = re.sub(
            r'(\n\s+)\* ([^*\n]+)\n(\s+\* [^*\n]+\n)+',
            lambda m: m.group(1) + '/**\n' + m.group(0).lstrip(),
            content,
            flags=re.MULTILINE
        )
        
        # 원본과 비교
        with open(file_path_str, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        if content != original_content:
            with open(file_path_str, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ 오류 발생 ({file_path_str}): {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

def main():
    """메인 함수"""
    base_dir = Path(__file__).parent.parent
    
    # 수정할 파일 목록 (문법 오류가 있는 파일들)
    target_files = [
        'src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ErpServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/SessionSyncServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/BankTransferServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/StatisticsServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ConsultantRatingServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ConsultationServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/BranchServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/FinancialTransactionServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/PaymentServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/StatisticsSchedulerServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ClientStatsServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/StatisticsTestDataServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/DiscountAccountingServiceImpl.java',
        'src/main/java/com/coresolution/core/service/billing/impl/SubscriptionPlanChangeServiceImpl.java',
        'src/main/java/com/coresolution/core/service/billing/impl/SubscriptionExpirationServiceImpl.java',
        'src/main/java/com/coresolution/core/service/billing/impl/SubscriptionRefundServiceImpl.java',
        'src/main/java/com/coresolution/core/service/impl/TenantPgConfigurationServiceImpl.java',
        'src/main/java/com/coresolution/core/service/impl/OnboardingServiceImpl.java',
        'src/main/java/com/coresolution/core/service/ops/DashboardService.java',
        'src/main/java/com/coresolution/consultation/entity/PerformanceAlert.java',
        'src/main/java/com/coresolution/consultation/entity/AccountingEntry.java',
        'src/main/java/com/coresolution/consultation/entity/Budget.java',
        'src/main/java/com/coresolution/consultation/entity/Branch.java',
        'src/main/java/com/coresolution/consultation/entity/ConsultantRating.java',
        'src/main/java/com/coresolution/consultation/entity/ConsultantClientMapping.java',
        'src/main/java/com/coresolution/consultation/entity/ConsultationRecordAlert.java',
        'src/main/java/com/coresolution/consultation/entity/DiscountAccountingTransaction.java',
        'src/main/java/com/coresolution/consultation/entity/ErpSyncLog.java',
        'src/main/java/com/coresolution/consultation/entity/FinancialTransaction.java',
        'src/main/java/com/coresolution/consultation/entity/PurchaseOrder.java',
        'src/main/java/com/coresolution/consultation/entity/PurchaseRequest.java',
        'src/main/java/com/coresolution/consultation/entity/SessionExtensionRequest.java',
        'src/main/java/com/coresolution/consultation/service/BranchCodeInitService.java',
        'src/main/java/com/coresolution/core/controller/OnboardingController.java',
        'src/main/java/com/coresolution/core/controller/academy/AcademyConsultationController.java',
        'src/main/java/com/coresolution/core/controller/academy/AcademyEnrollmentController.java',
        'src/main/java/com/coresolution/core/domain/Tenant.java',
        'src/main/java/com/coresolution/core/domain/TenantComponent.java',
        'src/main/java/com/coresolution/core/domain/TenantPgConfiguration.java',
        'src/main/java/com/coresolution/core/domain/TenantSubscription.java',
        'src/main/java/com/coresolution/core/domain/academy/AcademyInvoice.java',
        'src/main/java/com/coresolution/core/domain/academy/AcademySettlement.java',
        'src/main/java/com/coresolution/core/domain/academy/AcademyTuitionPayment.java',
        'src/main/java/com/coresolution/core/domain/academy/Class.java',
        'src/main/java/com/coresolution/core/domain/academy/ClassEnrollment.java',
        'src/main/java/com/coresolution/core/domain/onboarding/OnboardingRequest.java',
        'src/main/java/com/coresolution/core/service/academy/impl/AcademySettlementServiceImpl.java',
        'src/main/java/com/coresolution/core/service/academy/impl/ClassEnrollmentServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ErpDiscountIntegrationServiceImpl.java',
        'src/main/java/com/coresolution/consultation/controller/AdminController.java',
        'src/main/java/com/coresolution/consultation/controller/TestDataController.java',
        'src/main/java/com/coresolution/consultation/service/impl/BranchPermissionServiceImpl.java',
    ]
    
    fixed_count = 0
    error_count = 0
    
    for rel_path in target_files:
        file_path = base_dir / rel_path
        if file_path.exists():
            print(f"수정 중: {rel_path}")
            if fix_javadoc_in_file(file_path):
                fixed_count += 1
                print(f"✅ 수정 완료: {rel_path}")
            else:
                print(f"ℹ️  변경사항 없음: {rel_path}")
        else:
            print(f"⚠️  파일 없음: {rel_path}")
            error_count += 1
    
    print(f"\n✅ 수정 완료: {fixed_count}개 파일")
    if error_count > 0:
        print(f"⚠️  파일 없음: {error_count}개")

if __name__ == '__main__':
    main()

