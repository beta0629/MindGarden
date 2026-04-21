package com.coresolution.consultation.support;

import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_EXPERT_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_EXPERT_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_EXPERT_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_JUNIOR_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_JUNIOR_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_JUNIOR_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_MASTER_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_MASTER_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_MASTER_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_SENIOR_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_SENIOR_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.ADMIN_GRADE_SENIOR_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_ELITE_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_ELITE_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_ELITE_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_PREMIUM_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_PREMIUM_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_PREMIUM_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_STANDARD_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_STANDARD_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_STANDARD_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_VIP_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_VIP_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CLIENT_GRADE_VIP_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_EXPERT_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_EXPERT_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_EXPERT_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_JUNIOR_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_JUNIOR_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_JUNIOR_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_MASTER_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_MASTER_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_MASTER_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_EXPERT_BASE_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_EXPERT_BASE_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_EXPERT_BASE_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_JUNIOR_BASE_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_JUNIOR_BASE_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_JUNIOR_BASE_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_MASTER_BASE_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_MASTER_BASE_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_MASTER_BASE_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_SENIOR_BASE_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_SENIOR_BASE_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SALARY_SENIOR_BASE_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SENIOR_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SENIOR_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.CONSULTANT_GRADE_SENIOR_EXTRA_DATA;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_CASH_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_CASH_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_EXPENSE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_EXPENSE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_LIABILITY_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_LIABILITY_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_REVENUE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_REVENUE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_VAT_PAYABLE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_VAT_PAYABLE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_CONSULTING_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_CONSULTING_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_EQUIPMENT_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_EQUIPMENT_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_MARKETING_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_MARKETING_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_OFFICE_SUPPLIES_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_OFFICE_SUPPLIES_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_OTHER_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_OTHER_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_RENT_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_RENT_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_SALARY_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_SALARY_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_SOFTWARE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_SOFTWARE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_TAX_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_TAX_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_UTILITY_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_UTILITY_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ADMIN_SALARY_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ADMIN_SALARY_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_COMPUTER_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_COMPUTER_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CONSULTANT_SALARY_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CONSULTANT_SALARY_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CONSULTATION_REFUND_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CONSULTATION_REFUND_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CORPORATE_TAX_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CORPORATE_TAX_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ELECTRICITY_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ELECTRICITY_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_EXTERNAL_CONSULTING_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_EXTERNAL_CONSULTING_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_FURNITURE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_FURNITURE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_INCOME_TAX_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_INCOME_TAX_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_LICENSE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_LICENSE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_MAINTENANCE_FEE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_MAINTENANCE_FEE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OFFICE_RENT_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OFFICE_RENT_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OFFLINE_ADS_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OFFLINE_ADS_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ONLINE_ADS_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ONLINE_ADS_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OTHER_EXPENSE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OTHER_EXPENSE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_PRINTING_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_PRINTING_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_STATIONERY_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_STATIONERY_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_VAT_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_VAT_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_WATER_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_WATER_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_EXPERT_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_EXPERT_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_EXPERT_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_JUNIOR_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_JUNIOR_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_JUNIOR_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_MASTER_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_MASTER_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_MASTER_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_SENIOR_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_SENIOR_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.FREELANCE_BASE_RATE_SENIOR_EXTRA_DATA;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_CATEGORY_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_CATEGORY_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_CATEGORY_OTHER_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_CATEGORY_OTHER_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_CATEGORY_PACKAGE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_CATEGORY_PACKAGE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_ADDITIONAL_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_ADDITIONAL_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_BASIC_PACKAGE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_BASIC_PACKAGE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_GROUP_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_GROUP_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_INDIVIDUAL_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_INDIVIDUAL_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_PREMIUM_PACKAGE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_PREMIUM_PACKAGE_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_FAMILY_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_FAMILY_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_FAMILY_CONSULTATION_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_INITIAL_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_INITIAL_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_INITIAL_CONSULTATION_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_ONLINE_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_ONLINE_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_ONLINE_CONSULTATION_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_PHONE_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_PHONE_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_PHONE_CONSULTATION_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_TRAUMA_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_TRAUMA_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_TRAUMA_CONSULTATION_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_WEEKEND_CONSULTATION_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_WEEKEND_CONSULTATION_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_OPTION_WEEKEND_CONSULTATION_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_FIRST_DAY_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_FIRST_DAY_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_FIRST_DAY_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_FIFTEENTH_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_FIFTEENTH_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_FIFTEENTH_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_LAST_DAY_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_LAST_DAY_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_LAST_DAY_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_TENTH_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_TENTH_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_TENTH_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_TWENTIETH_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_TWENTIETH_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_TWENTIETH_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_TWENTY_FIFTH_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_TWENTY_FIFTH_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_PAY_DAY_TWENTY_FIFTH_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_TYPE_FREELANCE_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_TYPE_FREELANCE_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_TYPE_FREELANCE_EXTRA_DATA;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_TYPE_REGULAR_DESCRIPTION;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_TYPE_REGULAR_DISPLAY;
import static com.coresolution.consultation.constant.onboarding.TenantOnboardingSalaryAndFinancialSeedStrings.SALARY_TYPE_REGULAR_EXTRA_DATA;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.TRANSACTION_TYPE_EXPENSE_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.TRANSACTION_TYPE_EXPENSE_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.TRANSACTION_TYPE_INCOME_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.TRANSACTION_TYPE_INCOME_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.VAT_APPLICABLE_NO_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.VAT_APPLICABLE_NO_DISPLAY;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.VAT_APPLICABLE_YES_DESCRIPTION;
import static com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings.VAT_APPLICABLE_YES_DISPLAY;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 온보딩 시 신규 테넌트에 삽입할 급여·ERP 공통코드 시드 정의.
 * <p>
 * 프론트엔드 {@code TENANT_CODE_GROUPS} / {@code TENANT_WRITE_ISOLATED_GROUPS}와 동일 정책으로 동기화 —
 * {@code frontend/src/constants/tenantCodeConstants.js}.
 * </p>
 * <p>
 * <strong>동기화 단일 출처</strong>: 문자열·JSON은 아래와 동일하게 유지할 것. 변경 시 함께 갱신.
 * </p>
 * <ul>
 * <li>급여: {@link com.coresolution.consultation.service.impl.CodeInitializationServiceImpl}
 * (initializeSalaryPayDayOptions ~ initializeFreelanceBaseRates)</li>
 * <li>재무: {@link com.coresolution.consultation.service.impl.FinancialCommonCodeInitializer}</li>
 * </ul>
 * <p>
 * TENANT_WRITE_ISOLATED_GROUPS 중 탭({@code TENANT_CODE_GROUPS})에 없는 ERP 전용 그룹(예: {@code FINANCIAL_CATEGORY})은
 * 본 파일 또는 {@link com.coresolution.core.service.impl.OnboardingServiceImpl} 온보딩 공통코드 삽입 로직에서
 * 선택적으로 시드한다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-13
 */
public final class TenantOnboardingSalaryAndFinancialSeedDefinitions {

    private TenantOnboardingSalaryAndFinancialSeedDefinitions() {
    }

    /**
     * 테넌트 온보딩 시 추가할 급여·ERP 공통코드 한 행.
     *
     * @param parentCodeGroup 하위 분류용 상위 그룹 (없으면 null)
     * @param parentCodeValue 하위 분류용 상위 값 (없으면 null)
     */
    public record SeedRow(String codeGroup, String codeValue, String koreanName, String codeLabel,
            String description, String extraData, Integer sortOrder, String parentCodeGroup,
            String parentCodeValue) {
    }

    private static final List<SeedRow> ROWS;

    static {
        List<SeedRow> rows = new ArrayList<>();

        // --- SALARY_PAY_DAY (CodeInitializationServiceImpl.initializeSalaryPayDayOptions) ---
        rows.add(new SeedRow("SALARY_PAY_DAY", "TENTH", SALARY_PAY_DAY_TENTH_DISPLAY, SALARY_PAY_DAY_TENTH_DISPLAY,
                SALARY_PAY_DAY_TENTH_DESCRIPTION,
                SALARY_PAY_DAY_TENTH_EXTRA_DATA, 1,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "FIFTEENTH", SALARY_PAY_DAY_FIFTEENTH_DISPLAY,
                SALARY_PAY_DAY_FIFTEENTH_DISPLAY,
                SALARY_PAY_DAY_FIFTEENTH_DESCRIPTION,
                SALARY_PAY_DAY_FIFTEENTH_EXTRA_DATA, 2,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "TWENTIETH", SALARY_PAY_DAY_TWENTIETH_DISPLAY,
                SALARY_PAY_DAY_TWENTIETH_DISPLAY,
                SALARY_PAY_DAY_TWENTIETH_DESCRIPTION,
                SALARY_PAY_DAY_TWENTIETH_EXTRA_DATA, 3,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "TWENTY_FIFTH", SALARY_PAY_DAY_TWENTY_FIFTH_DISPLAY,
                SALARY_PAY_DAY_TWENTY_FIFTH_DISPLAY,
                SALARY_PAY_DAY_TWENTY_FIFTH_DESCRIPTION,
                SALARY_PAY_DAY_TWENTY_FIFTH_EXTRA_DATA, 4,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "LAST_DAY", SALARY_PAY_DAY_LAST_DAY_DISPLAY,
                SALARY_PAY_DAY_LAST_DAY_DISPLAY,
                SALARY_PAY_DAY_LAST_DAY_DESCRIPTION,
                SALARY_PAY_DAY_LAST_DAY_EXTRA_DATA, 5,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "FIRST_DAY", SALARY_PAY_DAY_FIRST_DAY_DISPLAY,
                SALARY_PAY_DAY_FIRST_DAY_DISPLAY,
                SALARY_PAY_DAY_FIRST_DAY_DESCRIPTION,
                SALARY_PAY_DAY_FIRST_DAY_EXTRA_DATA, 6,
                null, null));

        // --- CONSULTANT_GRADE ---
        rows.add(new SeedRow("CONSULTANT_GRADE", "CONSULTANT_JUNIOR", CONSULTANT_GRADE_JUNIOR_DISPLAY,
                CONSULTANT_GRADE_JUNIOR_DISPLAY,
                CONSULTANT_GRADE_JUNIOR_DESCRIPTION,
                CONSULTANT_GRADE_JUNIOR_EXTRA_DATA,
                1, null, null));
        rows.add(new SeedRow("CONSULTANT_GRADE", "CONSULTANT_SENIOR", CONSULTANT_GRADE_SENIOR_DISPLAY,
                CONSULTANT_GRADE_SENIOR_DISPLAY,
                CONSULTANT_GRADE_SENIOR_DESCRIPTION,
                CONSULTANT_GRADE_SENIOR_EXTRA_DATA,
                2, null, null));
        rows.add(new SeedRow("CONSULTANT_GRADE", "CONSULTANT_EXPERT", CONSULTANT_GRADE_EXPERT_DISPLAY,
                CONSULTANT_GRADE_EXPERT_DISPLAY,
                CONSULTANT_GRADE_EXPERT_DESCRIPTION,
                CONSULTANT_GRADE_EXPERT_EXTRA_DATA,
                3, null, null));
        rows.add(new SeedRow("CONSULTANT_GRADE", "CONSULTANT_MASTER", CONSULTANT_GRADE_MASTER_DISPLAY,
                CONSULTANT_GRADE_MASTER_DISPLAY,
                CONSULTANT_GRADE_MASTER_DESCRIPTION,
                CONSULTANT_GRADE_MASTER_EXTRA_DATA,
                4, null, null));

        // --- CLIENT_GRADE (CONSULTANT_GRADE와 동일 extraData 패턴) ---
        rows.add(new SeedRow("CLIENT_GRADE", "CLIENT_STANDARD", CLIENT_GRADE_STANDARD_DISPLAY,
                CLIENT_GRADE_STANDARD_DISPLAY,
                CLIENT_GRADE_STANDARD_DESCRIPTION,
                CLIENT_GRADE_STANDARD_EXTRA_DATA,
                1, null, null));
        rows.add(new SeedRow("CLIENT_GRADE", "CLIENT_PREMIUM", CLIENT_GRADE_PREMIUM_DISPLAY,
                CLIENT_GRADE_PREMIUM_DISPLAY,
                CLIENT_GRADE_PREMIUM_DESCRIPTION,
                CLIENT_GRADE_PREMIUM_EXTRA_DATA,
                2, null, null));
        rows.add(new SeedRow("CLIENT_GRADE", "CLIENT_VIP", CLIENT_GRADE_VIP_DISPLAY, CLIENT_GRADE_VIP_DISPLAY,
                CLIENT_GRADE_VIP_DESCRIPTION,
                CLIENT_GRADE_VIP_EXTRA_DATA,
                3, null, null));
        rows.add(new SeedRow("CLIENT_GRADE", "CLIENT_ELITE", CLIENT_GRADE_ELITE_DISPLAY,
                CLIENT_GRADE_ELITE_DISPLAY,
                CLIENT_GRADE_ELITE_DESCRIPTION,
                CLIENT_GRADE_ELITE_EXTRA_DATA,
                4, null, null));

        // --- ADMIN_GRADE ---
        rows.add(new SeedRow("ADMIN_GRADE", "ADMIN_JUNIOR", ADMIN_GRADE_JUNIOR_DISPLAY, ADMIN_GRADE_JUNIOR_DISPLAY,
                ADMIN_GRADE_JUNIOR_DESCRIPTION,
                ADMIN_GRADE_JUNIOR_EXTRA_DATA,
                1, null, null));
        rows.add(new SeedRow("ADMIN_GRADE", "ADMIN_SENIOR", ADMIN_GRADE_SENIOR_DISPLAY, ADMIN_GRADE_SENIOR_DISPLAY,
                ADMIN_GRADE_SENIOR_DESCRIPTION,
                ADMIN_GRADE_SENIOR_EXTRA_DATA,
                2, null, null));
        rows.add(new SeedRow("ADMIN_GRADE", "ADMIN_EXPERT", ADMIN_GRADE_EXPERT_DISPLAY, ADMIN_GRADE_EXPERT_DISPLAY,
                ADMIN_GRADE_EXPERT_DESCRIPTION,
                ADMIN_GRADE_EXPERT_EXTRA_DATA,
                3, null, null));
        rows.add(new SeedRow("ADMIN_GRADE", "ADMIN_MASTER", ADMIN_GRADE_MASTER_DISPLAY, ADMIN_GRADE_MASTER_DISPLAY,
                ADMIN_GRADE_MASTER_DESCRIPTION,
                ADMIN_GRADE_MASTER_EXTRA_DATA,
                4, null, null));

        // --- SALARY_TYPE ---
        rows.add(new SeedRow("SALARY_TYPE", "FREELANCE", SALARY_TYPE_FREELANCE_DISPLAY, SALARY_TYPE_FREELANCE_DISPLAY,
                SALARY_TYPE_FREELANCE_DESCRIPTION,
                SALARY_TYPE_FREELANCE_EXTRA_DATA,
                1, null, null));
        rows.add(new SeedRow("SALARY_TYPE", "REGULAR", SALARY_TYPE_REGULAR_DISPLAY, SALARY_TYPE_REGULAR_DISPLAY,
                SALARY_TYPE_REGULAR_DESCRIPTION,
                SALARY_TYPE_REGULAR_EXTRA_DATA, 2,
                null, null));

        // --- SALARY_OPTION_TYPE ---
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "FAMILY_CONSULTATION", SALARY_OPTION_FAMILY_CONSULTATION_DISPLAY,
                SALARY_OPTION_FAMILY_CONSULTATION_DISPLAY,
                SALARY_OPTION_FAMILY_CONSULTATION_DESCRIPTION,
                SALARY_OPTION_FAMILY_CONSULTATION_EXTRA_DATA,
                1, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "INITIAL_CONSULTATION", SALARY_OPTION_INITIAL_CONSULTATION_DISPLAY,
                SALARY_OPTION_INITIAL_CONSULTATION_DISPLAY,
                SALARY_OPTION_INITIAL_CONSULTATION_DESCRIPTION,
                SALARY_OPTION_INITIAL_CONSULTATION_EXTRA_DATA,
                2, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "WEEKEND_CONSULTATION", SALARY_OPTION_WEEKEND_CONSULTATION_DISPLAY,
                SALARY_OPTION_WEEKEND_CONSULTATION_DISPLAY,
                SALARY_OPTION_WEEKEND_CONSULTATION_DESCRIPTION,
                SALARY_OPTION_WEEKEND_CONSULTATION_EXTRA_DATA,
                3, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "ONLINE_CONSULTATION", SALARY_OPTION_ONLINE_CONSULTATION_DISPLAY,
                SALARY_OPTION_ONLINE_CONSULTATION_DISPLAY,
                SALARY_OPTION_ONLINE_CONSULTATION_DESCRIPTION,
                SALARY_OPTION_ONLINE_CONSULTATION_EXTRA_DATA,
                4, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "PHONE_CONSULTATION", SALARY_OPTION_PHONE_CONSULTATION_DISPLAY,
                SALARY_OPTION_PHONE_CONSULTATION_DISPLAY,
                SALARY_OPTION_PHONE_CONSULTATION_DESCRIPTION,
                SALARY_OPTION_PHONE_CONSULTATION_EXTRA_DATA,
                5, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "TRAUMA_CONSULTATION", SALARY_OPTION_TRAUMA_CONSULTATION_DISPLAY,
                SALARY_OPTION_TRAUMA_CONSULTATION_DISPLAY,
                SALARY_OPTION_TRAUMA_CONSULTATION_DESCRIPTION,
                SALARY_OPTION_TRAUMA_CONSULTATION_EXTRA_DATA,
                6, null, null));

        // --- CONSULTANT_GRADE_SALARY ---
        rows.add(new SeedRow("CONSULTANT_GRADE_SALARY", "JUNIOR_BASE", CONSULTANT_GRADE_SALARY_JUNIOR_BASE_DISPLAY,
                CONSULTANT_GRADE_SALARY_JUNIOR_BASE_DISPLAY,
                CONSULTANT_GRADE_SALARY_JUNIOR_BASE_DESCRIPTION,
                CONSULTANT_GRADE_SALARY_JUNIOR_BASE_EXTRA_DATA, 1, null,
                null));
        rows.add(new SeedRow("CONSULTANT_GRADE_SALARY", "SENIOR_BASE", CONSULTANT_GRADE_SALARY_SENIOR_BASE_DISPLAY,
                CONSULTANT_GRADE_SALARY_SENIOR_BASE_DISPLAY,
                CONSULTANT_GRADE_SALARY_SENIOR_BASE_DESCRIPTION,
                CONSULTANT_GRADE_SALARY_SENIOR_BASE_EXTRA_DATA, 2, null,
                null));
        rows.add(new SeedRow("CONSULTANT_GRADE_SALARY", "EXPERT_BASE", CONSULTANT_GRADE_SALARY_EXPERT_BASE_DISPLAY,
                CONSULTANT_GRADE_SALARY_EXPERT_BASE_DISPLAY,
                CONSULTANT_GRADE_SALARY_EXPERT_BASE_DESCRIPTION,
                CONSULTANT_GRADE_SALARY_EXPERT_BASE_EXTRA_DATA, 3, null,
                null));
        rows.add(new SeedRow("CONSULTANT_GRADE_SALARY", "MASTER_BASE", CONSULTANT_GRADE_SALARY_MASTER_BASE_DISPLAY,
                CONSULTANT_GRADE_SALARY_MASTER_BASE_DISPLAY,
                CONSULTANT_GRADE_SALARY_MASTER_BASE_DESCRIPTION,
                CONSULTANT_GRADE_SALARY_MASTER_BASE_EXTRA_DATA, 4, null,
                null));

        // --- FREELANCE_BASE_RATE ---
        rows.add(new SeedRow("FREELANCE_BASE_RATE", "JUNIOR_RATE", FREELANCE_BASE_RATE_JUNIOR_DISPLAY,
                FREELANCE_BASE_RATE_JUNIOR_DISPLAY,
                FREELANCE_BASE_RATE_JUNIOR_DESCRIPTION,
                FREELANCE_BASE_RATE_JUNIOR_EXTRA_DATA, 1,
                null, null));
        rows.add(new SeedRow("FREELANCE_BASE_RATE", "SENIOR_RATE", FREELANCE_BASE_RATE_SENIOR_DISPLAY,
                FREELANCE_BASE_RATE_SENIOR_DISPLAY,
                FREELANCE_BASE_RATE_SENIOR_DESCRIPTION,
                FREELANCE_BASE_RATE_SENIOR_EXTRA_DATA, 2,
                null, null));
        rows.add(new SeedRow("FREELANCE_BASE_RATE", "EXPERT_RATE", FREELANCE_BASE_RATE_EXPERT_DISPLAY,
                FREELANCE_BASE_RATE_EXPERT_DISPLAY,
                FREELANCE_BASE_RATE_EXPERT_DESCRIPTION,
                FREELANCE_BASE_RATE_EXPERT_EXTRA_DATA, 3,
                null, null));
        rows.add(new SeedRow("FREELANCE_BASE_RATE", "MASTER_RATE", FREELANCE_BASE_RATE_MASTER_DISPLAY,
                FREELANCE_BASE_RATE_MASTER_DISPLAY,
                FREELANCE_BASE_RATE_MASTER_DESCRIPTION,
                FREELANCE_BASE_RATE_MASTER_EXTRA_DATA, 4,
                null, null));

        // --- FinancialCommonCodeInitializer (테넌트 ERP 최소 세트) ---
        rows.add(new SeedRow("TRANSACTION_TYPE", "INCOME", TRANSACTION_TYPE_INCOME_DISPLAY,
                TRANSACTION_TYPE_INCOME_DISPLAY, TRANSACTION_TYPE_INCOME_DESCRIPTION, null, 1, null,
                null));
        rows.add(new SeedRow("TRANSACTION_TYPE", "EXPENSE", TRANSACTION_TYPE_EXPENSE_DISPLAY,
                TRANSACTION_TYPE_EXPENSE_DISPLAY, TRANSACTION_TYPE_EXPENSE_DESCRIPTION, null, 2, null,
                null));

        rows.add(new SeedRow("INCOME_CATEGORY", "CONSULTATION", INCOME_CATEGORY_CONSULTATION_DISPLAY,
                INCOME_CATEGORY_CONSULTATION_DISPLAY, INCOME_CATEGORY_CONSULTATION_DESCRIPTION, null,
                1, null, null));
        rows.add(new SeedRow("INCOME_CATEGORY", "PACKAGE", INCOME_CATEGORY_PACKAGE_DISPLAY,
                INCOME_CATEGORY_PACKAGE_DISPLAY, INCOME_CATEGORY_PACKAGE_DESCRIPTION, null,
                2, null, null));
        rows.add(new SeedRow("INCOME_CATEGORY", "OTHER", INCOME_CATEGORY_OTHER_DISPLAY,
                INCOME_CATEGORY_OTHER_DISPLAY, INCOME_CATEGORY_OTHER_DESCRIPTION, null, 3,
                null, null));

        rows.add(new SeedRow("EXPENSE_CATEGORY", "SALARY", EXPENSE_CATEGORY_SALARY_DISPLAY,
                EXPENSE_CATEGORY_SALARY_DISPLAY, EXPENSE_CATEGORY_SALARY_DESCRIPTION, null, 1, null,
                null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "RENT", EXPENSE_CATEGORY_RENT_DISPLAY,
                EXPENSE_CATEGORY_RENT_DISPLAY, EXPENSE_CATEGORY_RENT_DESCRIPTION, null, 2,
                null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "UTILITY", EXPENSE_CATEGORY_UTILITY_DISPLAY,
                EXPENSE_CATEGORY_UTILITY_DISPLAY, EXPENSE_CATEGORY_UTILITY_DESCRIPTION, null, 3,
                null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "OFFICE_SUPPLIES", EXPENSE_CATEGORY_OFFICE_SUPPLIES_DISPLAY,
                EXPENSE_CATEGORY_OFFICE_SUPPLIES_DISPLAY, EXPENSE_CATEGORY_OFFICE_SUPPLIES_DESCRIPTION,
                null, 4, null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "TAX", EXPENSE_CATEGORY_TAX_DISPLAY, EXPENSE_CATEGORY_TAX_DISPLAY,
                EXPENSE_CATEGORY_TAX_DESCRIPTION, null, 5, null,
                null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "MARKETING", EXPENSE_CATEGORY_MARKETING_DISPLAY,
                EXPENSE_CATEGORY_MARKETING_DISPLAY, EXPENSE_CATEGORY_MARKETING_DESCRIPTION, null, 6,
                null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "EQUIPMENT", EXPENSE_CATEGORY_EQUIPMENT_DISPLAY,
                EXPENSE_CATEGORY_EQUIPMENT_DISPLAY, EXPENSE_CATEGORY_EQUIPMENT_DESCRIPTION, null, 7, null,
                null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "SOFTWARE", EXPENSE_CATEGORY_SOFTWARE_DISPLAY,
                EXPENSE_CATEGORY_SOFTWARE_DISPLAY, EXPENSE_CATEGORY_SOFTWARE_DESCRIPTION,
                null, 8, null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "CONSULTING", EXPENSE_CATEGORY_CONSULTING_DISPLAY,
                EXPENSE_CATEGORY_CONSULTING_DISPLAY, EXPENSE_CATEGORY_CONSULTING_DESCRIPTION, null,
                9, null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "OTHER", EXPENSE_CATEGORY_OTHER_DISPLAY,
                EXPENSE_CATEGORY_OTHER_DISPLAY, EXPENSE_CATEGORY_OTHER_DESCRIPTION, null, 10,
                null, null));

        rows.add(new SeedRow("INCOME_SUBCATEGORY", "INDIVIDUAL_CONSULTATION",
                INCOME_SUBCATEGORY_INDIVIDUAL_CONSULTATION_DISPLAY,
                INCOME_SUBCATEGORY_INDIVIDUAL_CONSULTATION_DISPLAY,
                INCOME_SUBCATEGORY_INDIVIDUAL_CONSULTATION_DESCRIPTION, null, 1, "INCOME_CATEGORY", "CONSULTATION"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "GROUP_CONSULTATION", INCOME_SUBCATEGORY_GROUP_CONSULTATION_DISPLAY,
                INCOME_SUBCATEGORY_GROUP_CONSULTATION_DISPLAY,
                INCOME_SUBCATEGORY_GROUP_CONSULTATION_DESCRIPTION, null, 2, "INCOME_CATEGORY", "CONSULTATION"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "ADDITIONAL_CONSULTATION",
                INCOME_SUBCATEGORY_ADDITIONAL_CONSULTATION_DISPLAY,
                INCOME_SUBCATEGORY_ADDITIONAL_CONSULTATION_DISPLAY,
                INCOME_SUBCATEGORY_ADDITIONAL_CONSULTATION_DESCRIPTION, null, 3, "INCOME_CATEGORY", "CONSULTATION"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "BASIC_PACKAGE", INCOME_SUBCATEGORY_BASIC_PACKAGE_DISPLAY,
                INCOME_SUBCATEGORY_BASIC_PACKAGE_DISPLAY,
                INCOME_SUBCATEGORY_BASIC_PACKAGE_DESCRIPTION, null, 4, "INCOME_CATEGORY", "PACKAGE"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "PREMIUM_PACKAGE", INCOME_SUBCATEGORY_PREMIUM_PACKAGE_DISPLAY,
                INCOME_SUBCATEGORY_PREMIUM_PACKAGE_DISPLAY,
                INCOME_SUBCATEGORY_PREMIUM_PACKAGE_DESCRIPTION, null, 5, "INCOME_CATEGORY", "PACKAGE"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "OTHER_INCOME", INCOME_CATEGORY_OTHER_DISPLAY,
                INCOME_CATEGORY_OTHER_DISPLAY, INCOME_CATEGORY_OTHER_DESCRIPTION,
                null, 6, "INCOME_CATEGORY", "OTHER"));

        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "CONSULTANT_SALARY", EXPENSE_SUBCATEGORY_CONSULTANT_SALARY_DISPLAY,
                EXPENSE_SUBCATEGORY_CONSULTANT_SALARY_DISPLAY,
                EXPENSE_SUBCATEGORY_CONSULTANT_SALARY_DESCRIPTION, null, 1, "EXPENSE_CATEGORY", "SALARY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "ADMIN_SALARY", EXPENSE_SUBCATEGORY_ADMIN_SALARY_DISPLAY,
                EXPENSE_SUBCATEGORY_ADMIN_SALARY_DISPLAY,
                EXPENSE_SUBCATEGORY_ADMIN_SALARY_DESCRIPTION, null, 2, "EXPENSE_CATEGORY", "SALARY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "OFFICE_RENT", EXPENSE_SUBCATEGORY_OFFICE_RENT_DISPLAY,
                EXPENSE_SUBCATEGORY_OFFICE_RENT_DISPLAY,
                EXPENSE_SUBCATEGORY_OFFICE_RENT_DESCRIPTION, null, 3, "EXPENSE_CATEGORY", "RENT"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "MAINTENANCE_FEE", EXPENSE_SUBCATEGORY_MAINTENANCE_FEE_DISPLAY,
                EXPENSE_SUBCATEGORY_MAINTENANCE_FEE_DISPLAY,
                EXPENSE_SUBCATEGORY_MAINTENANCE_FEE_DESCRIPTION, null, 4, "EXPENSE_CATEGORY", "UTILITY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "ELECTRICITY", EXPENSE_SUBCATEGORY_ELECTRICITY_DISPLAY,
                EXPENSE_SUBCATEGORY_ELECTRICITY_DISPLAY,
                EXPENSE_SUBCATEGORY_ELECTRICITY_DESCRIPTION, null, 5, "EXPENSE_CATEGORY", "UTILITY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "WATER", EXPENSE_SUBCATEGORY_WATER_DISPLAY,
                EXPENSE_SUBCATEGORY_WATER_DISPLAY,
                EXPENSE_SUBCATEGORY_WATER_DESCRIPTION, null, 6,
                "EXPENSE_CATEGORY", "UTILITY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "STATIONERY", EXPENSE_SUBCATEGORY_STATIONERY_DISPLAY,
                EXPENSE_SUBCATEGORY_STATIONERY_DISPLAY,
                EXPENSE_SUBCATEGORY_STATIONERY_DESCRIPTION, null, 7, "EXPENSE_CATEGORY", "OFFICE_SUPPLIES"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "PRINTING", EXPENSE_SUBCATEGORY_PRINTING_DISPLAY,
                EXPENSE_SUBCATEGORY_PRINTING_DISPLAY,
                EXPENSE_SUBCATEGORY_PRINTING_DESCRIPTION, null, 8, "EXPENSE_CATEGORY", "OFFICE_SUPPLIES"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "INCOME_TAX", EXPENSE_SUBCATEGORY_INCOME_TAX_DISPLAY,
                EXPENSE_SUBCATEGORY_INCOME_TAX_DISPLAY,
                EXPENSE_SUBCATEGORY_INCOME_TAX_DESCRIPTION, null, 9,
                "EXPENSE_CATEGORY", "TAX"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "VAT", EXPENSE_SUBCATEGORY_VAT_DISPLAY,
                EXPENSE_SUBCATEGORY_VAT_DISPLAY,
                EXPENSE_SUBCATEGORY_VAT_DESCRIPTION, null, 10,
                "EXPENSE_CATEGORY", "TAX"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "CORPORATE_TAX", EXPENSE_SUBCATEGORY_CORPORATE_TAX_DISPLAY,
                EXPENSE_SUBCATEGORY_CORPORATE_TAX_DISPLAY,
                EXPENSE_SUBCATEGORY_CORPORATE_TAX_DESCRIPTION, null, 11,
                "EXPENSE_CATEGORY", "TAX"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "ONLINE_ADS", EXPENSE_SUBCATEGORY_ONLINE_ADS_DISPLAY,
                EXPENSE_SUBCATEGORY_ONLINE_ADS_DISPLAY,
                EXPENSE_SUBCATEGORY_ONLINE_ADS_DESCRIPTION, null, 12, "EXPENSE_CATEGORY", "MARKETING"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "OFFLINE_ADS", EXPENSE_SUBCATEGORY_OFFLINE_ADS_DISPLAY,
                EXPENSE_SUBCATEGORY_OFFLINE_ADS_DISPLAY,
                EXPENSE_SUBCATEGORY_OFFLINE_ADS_DESCRIPTION, null, 13, "EXPENSE_CATEGORY", "MARKETING"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "COMPUTER", EXPENSE_SUBCATEGORY_COMPUTER_DISPLAY,
                EXPENSE_SUBCATEGORY_COMPUTER_DISPLAY,
                EXPENSE_SUBCATEGORY_COMPUTER_DESCRIPTION, null, 14, "EXPENSE_CATEGORY", "EQUIPMENT"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "FURNITURE", EXPENSE_SUBCATEGORY_FURNITURE_DISPLAY,
                EXPENSE_SUBCATEGORY_FURNITURE_DISPLAY,
                EXPENSE_SUBCATEGORY_FURNITURE_DESCRIPTION, null, 15,
                "EXPENSE_CATEGORY", "EQUIPMENT"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "LICENSE", EXPENSE_SUBCATEGORY_LICENSE_DISPLAY,
                EXPENSE_SUBCATEGORY_LICENSE_DISPLAY,
                EXPENSE_SUBCATEGORY_LICENSE_DESCRIPTION, null, 16, "EXPENSE_CATEGORY", "SOFTWARE"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "EXTERNAL_CONSULTING",
                EXPENSE_SUBCATEGORY_EXTERNAL_CONSULTING_DISPLAY,
                EXPENSE_SUBCATEGORY_EXTERNAL_CONSULTING_DISPLAY,
                EXPENSE_SUBCATEGORY_EXTERNAL_CONSULTING_DESCRIPTION, null, 17, "EXPENSE_CATEGORY", "CONSULTING"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "CONSULTATION_REFUND",
                EXPENSE_SUBCATEGORY_CONSULTATION_REFUND_DISPLAY,
                EXPENSE_SUBCATEGORY_CONSULTATION_REFUND_DISPLAY,
                EXPENSE_SUBCATEGORY_CONSULTATION_REFUND_DESCRIPTION, null, 18, "EXPENSE_CATEGORY", "CONSULTATION"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "OTHER_EXPENSE", EXPENSE_SUBCATEGORY_OTHER_EXPENSE_DISPLAY,
                EXPENSE_SUBCATEGORY_OTHER_EXPENSE_DISPLAY,
                EXPENSE_SUBCATEGORY_OTHER_EXPENSE_DESCRIPTION, null, 19,
                "EXPENSE_CATEGORY", "OTHER"));

        rows.add(new SeedRow("VAT_APPLICABLE", "APPLICABLE", VAT_APPLICABLE_YES_DISPLAY, VAT_APPLICABLE_YES_DISPLAY,
                VAT_APPLICABLE_YES_DESCRIPTION, null, 1, null, null));
        rows.add(new SeedRow("VAT_APPLICABLE", "NOT_APPLICABLE", VAT_APPLICABLE_NO_DISPLAY,
                VAT_APPLICABLE_NO_DISPLAY,
                VAT_APPLICABLE_NO_DESCRIPTION, null, 2, null, null));

        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "REVENUE", ERP_ACCOUNT_TYPE_REVENUE_DISPLAY,
                ERP_ACCOUNT_TYPE_REVENUE_DISPLAY, ERP_ACCOUNT_TYPE_REVENUE_DESCRIPTION, null, 1,
                null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "EXPENSE", ERP_ACCOUNT_TYPE_EXPENSE_DISPLAY,
                ERP_ACCOUNT_TYPE_EXPENSE_DISPLAY, ERP_ACCOUNT_TYPE_EXPENSE_DESCRIPTION, null, 2,
                null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "CASH", ERP_ACCOUNT_TYPE_CASH_DISPLAY, ERP_ACCOUNT_TYPE_CASH_DISPLAY,
                ERP_ACCOUNT_TYPE_CASH_DESCRIPTION, null, 3, null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "LIABILITY", ERP_ACCOUNT_TYPE_LIABILITY_DISPLAY,
                ERP_ACCOUNT_TYPE_LIABILITY_DISPLAY,
                ERP_ACCOUNT_TYPE_LIABILITY_DESCRIPTION, null, 4, null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "VAT_PAYABLE", ERP_ACCOUNT_TYPE_VAT_PAYABLE_DISPLAY,
                ERP_ACCOUNT_TYPE_VAT_PAYABLE_DISPLAY,
                ERP_ACCOUNT_TYPE_VAT_PAYABLE_DESCRIPTION, null, 5, null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "WITHHOLDING_PAYABLE",
                ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DISPLAY,
                ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DISPLAY,
                ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DESCRIPTION, null, 6, null, null));

        ROWS = Collections.unmodifiableList(rows);
    }

    /**
     * 급여·ERP 온보딩 시드 전체 (순서는 카테고리 선행 후 서브카테고리).
     *
     * @return 불변 목록
     */
    public static List<SeedRow> allRows() {
        return ROWS;
    }
}
