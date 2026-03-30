-- MySQL dump 10.13  Distrib 9.2.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: mind_garden
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accounting_entries`
--

DROP TABLE IF EXISTS `accounting_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounting_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `approval_comment` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approval_status` enum('PENDING','APPROVED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `approver_id` bigint DEFAULT NULL,
  `balance_sheet_category` enum('ASSETS_CURRENT','ASSETS_FIXED','LIABILITIES_CURRENT','LIABILITIES_LONG_TERM','EQUITY','REVENUE','EXPENSES') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entry_date` date NOT NULL,
  `entry_type` enum('DEBIT','CREDIT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `related_transaction_id` bigint DEFAULT NULL,
  `related_transaction_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subcategory` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_accounting_entry_date` (`entry_date`),
  KEY `idx_accounting_entry_type` (`entry_type`),
  KEY `idx_accounting_entry_account` (`account_code`),
  KEY `idx_accounting_entry_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounting_entries`
--

LOCK TABLES `accounting_entries` WRITE;
/*!40000 ALTER TABLE `accounting_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounting_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_holder` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `is_primary` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accumulated_depreciations`
--

DROP TABLE IF EXISTS `accumulated_depreciations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accumulated_depreciations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `accumulated_depreciation` decimal(15,2) DEFAULT NULL,
  `acquisition_cost` decimal(15,2) NOT NULL,
  `acquisition_date` date NOT NULL,
  `annual_depreciation` decimal(15,2) DEFAULT NULL,
  `asset_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asset_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `book_value` decimal(15,2) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depreciation_end_date` date DEFAULT NULL,
  `depreciation_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `depreciation_rate` decimal(5,4) DEFAULT NULL,
  `depreciation_start_date` date DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `is_depreciating` bit(1) NOT NULL,
  `salvage_value` decimal(15,2) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `useful_life_years` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accumulated_depreciations`
--

LOCK TABLES `accumulated_depreciations` WRITE;
/*!40000 ALTER TABLE `accumulated_depreciations` DISABLE KEYS */;
/*!40000 ALTER TABLE `accumulated_depreciations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alerts`
--

DROP TABLE IF EXISTS `alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alerts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `archived_at` datetime(6) DEFAULT NULL,
  `auto_dismiss_seconds` int DEFAULT NULL,
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel_config` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `dismissed_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_dismissible` bit(1) DEFAULT NULL,
  `is_recurring` bit(1) DEFAULT NULL,
  `is_sent` bit(1) DEFAULT NULL,
  `is_sticky` bit(1) DEFAULT NULL,
  `last_sent_at` datetime(6) DEFAULT NULL,
  `link_target` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_retry_count` int DEFAULT NULL,
  `max_send_count` int DEFAULT NULL,
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `next_retry_at` datetime(6) DEFAULT NULL,
  `next_send_at` datetime(6) DEFAULT NULL,
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `recurrence_end_date` datetime(6) DEFAULT NULL,
  `recurrence_interval` int DEFAULT NULL,
  `recurrence_pattern` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `related_entity_id` bigint DEFAULT NULL,
  `related_entity_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retry_count` int DEFAULT NULL,
  `scheduled_at` datetime(6) DEFAULT NULL,
  `send_count` int DEFAULT NULL,
  `send_error` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_alerts_user_id` (`user_id`),
  KEY `idx_alerts_type` (`type`),
  KEY `idx_alerts_priority` (`priority`),
  KEY `idx_alerts_status` (`status`),
  KEY `idx_alerts_created_at` (`created_at`),
  KEY `idx_alerts_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alerts`
--

LOCK TABLES `alerts` WRITE;
/*!40000 ALTER TABLE `alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_detail` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_settings` text COLLATE utf8mb4_unicode_ci,
  `branch_status` enum('PLANNING','PREPARING','ACTIVE','SUSPENDED','CLOSED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_type` enum('MAIN','FRANCHISE','DIRECT','PARTNER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `closed_days` text COLLATE utf8mb4_unicode_ci,
  `closing_date` date DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fax_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_clients` int DEFAULT NULL,
  `max_consultants` int DEFAULT NULL,
  `opening_date` date DEFAULT NULL,
  `operating_end_time` time(6) DEFAULT NULL,
  `operating_start_time` time(6) DEFAULT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website_url` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_id` bigint DEFAULT NULL,
  `parent_branch_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_aqmyw20ht3aku27r3oorfaw43` (`branch_code`),
  KEY `FKaxphe54ft6x2k2ndo8t5vsvjo` (`manager_id`),
  KEY `FKtp47j5rwpnpo1c3771sy5v991` (`parent_branch_id`),
  CONSTRAINT `FKaxphe54ft6x2k2ndo8t5vsvjo` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKtp47j5rwpnpo1c3771sy5v991` FOREIGN KEY (`parent_branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,'2025-09-12 14:48:22.247422',NULL,_binary '\0','2025-09-12 14:48:22.247422',0,'서울시 강남구',NULL,'MAIN001','본점',NULL,'PLANNING','MAIN',NULL,NULL,NULL,'main@mindgarden.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'02-1234-5678',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `budget_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `end_date` datetime(6) DEFAULT NULL,
  `month` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remaining_budget` decimal(15,2) NOT NULL,
  `start_date` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','EXHAUSTED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_budget` decimal(15,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `used_budget` decimal(15,2) NOT NULL,
  `version` int NOT NULL,
  `year` int NOT NULL,
  `manager_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9fg8q4s58swywn9eenpsf7329` (`manager_id`),
  CONSTRAINT `FK9fg8q4s58swywn9eenpsf7329` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3005 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES (3001,'BUD-2024-001','OPERATING','2025-09-15 09:14:03.000000','2024년 운영비 예산','2024-12-31 00:00:00.000000',1,'2024년 운영비','연간 운영비',85000000.00,'2024-01-01 00:00:00.000000','ACTIVE',100000000.00,'2025-09-15 09:14:03.000000',15000000.00,0,2024,1),(3002,'BUD-2024-002','MARKETING','2025-09-15 09:14:03.000000','2024년 마케팅비 예산','2024-12-31 00:00:00.000000',1,'2024년 마케팅비','연간 마케팅비',42000000.00,'2024-01-01 00:00:00.000000','ACTIVE',50000000.00,'2025-09-15 09:14:03.000000',8000000.00,0,2024,1),(3003,'BUD-2024-003','EQUIPMENT','2025-09-15 09:14:03.000000','2024년 장비비 예산','2024-12-31 00:00:00.000000',1,'2024년 장비비','연간 장비비',18000000.00,'2024-01-01 00:00:00.000000','ACTIVE',30000000.00,'2025-09-15 09:14:03.000000',12000000.00,0,2024,1),(3004,'BUD-2024-004','PERSONNEL','2025-09-15 09:14:03.000000','2024년 인사비 예산','2024-12-31 00:00:00.000000',1,'2024년 인사비','연간 인사비',155000000.00,'2024-01-01 00:00:00.000000','ACTIVE',200000000.00,'2025-09-15 09:14:03.000000',45000000.00,0,2024,1);
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_consultant_mappings`
--

DROP TABLE IF EXISTS `client_consultant_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_consultant_mappings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `cancelled_sessions` int DEFAULT NULL,
  `client_feedback` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` bigint NOT NULL,
  `client_satisfaction_rating` int DEFAULT NULL,
  `completed_sessions` int DEFAULT NULL,
  `consultant_evaluation_details` text COLLATE utf8mb4_unicode_ci,
  `consultant_evaluation_score` int DEFAULT NULL,
  `consultant_id` bigint NOT NULL,
  `emergency_expiry_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `evaluation_date` date DEFAULT NULL,
  `goal_achievement` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `goal_achievement_details` text COLLATE utf8mb4_unicode_ci,
  `is_auto_renewal` bit(1) DEFAULT NULL,
  `is_emergency_mapping` bit(1) DEFAULT NULL,
  `last_session_date` date DEFAULT NULL,
  `last_supervision_date` date DEFAULT NULL,
  `mapping_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mapping_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `next_renewal_date` date DEFAULT NULL,
  `next_session_date` date DEFAULT NULL,
  `next_supervision_date` date DEFAULT NULL,
  `progress_score` int DEFAULT NULL,
  `renewal_period_months` int DEFAULT NULL,
  `special_considerations` text COLLATE utf8mb4_unicode_ci,
  `start_date` date NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supervision_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supervision_notes` text COLLATE utf8mb4_unicode_ci,
  `supervision_plan` text COLLATE utf8mb4_unicode_ci,
  `supervisor_id` bigint DEFAULT NULL,
  `termination_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_sessions` int DEFAULT NULL,
  `transfer_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_client_consultant_mappings_client_id` (`client_id`),
  KEY `idx_client_consultant_mappings_consultant_id` (`consultant_id`),
  KEY `idx_client_consultant_mappings_status` (`status`),
  KEY `idx_client_consultant_mappings_start_date` (`start_date`),
  KEY `idx_client_consultant_mappings_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_consultant_mappings`
--

LOCK TABLES `client_consultant_mappings` WRITE;
/*!40000 ALTER TABLE `client_consultant_mappings` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_consultant_mappings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `version` bigint DEFAULT '0',
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_detail` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `allergies` text COLLATE utf8mb4_unicode_ci,
  `cancelled_sessions` int DEFAULT NULL,
  `client_satisfaction_rating` int DEFAULT NULL,
  `completed_sessions` int DEFAULT NULL,
  `consultation_goals` text COLLATE utf8mb4_unicode_ci,
  `consultation_history` text COLLATE utf8mb4_unicode_ci,
  `consultation_priority` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_purpose` text COLLATE utf8mb4_unicode_ci,
  `current_medications` text COLLATE utf8mb4_unicode_ci,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_relationship` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_consultation_date` date DEFAULT NULL,
  `goal_achievement_rate` int DEFAULT NULL,
  `insurance_info` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_insurance_covered` bit(1) DEFAULT NULL,
  `last_consultation_date` date DEFAULT NULL,
  `medical_information` text COLLATE utf8mb4_unicode_ci,
  `name` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT 'Unknown Client',
  `next_consultation_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_consultation_method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_consultation_time` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progress_score` int DEFAULT NULL,
  `referral_details` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referral_source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registered_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'ADMIN',
  `registration_date` date DEFAULT (curdate()),
  `risk_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `special_considerations` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_sessions` int DEFAULT NULL,
  `emergency_contact_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_emergency_contact` bit(1) DEFAULT NULL,
  `medical_history` text COLLATE utf8mb4_unicode_ci,
  `medications` text COLLATE utf8mb4_unicode_ci,
  `preferred_language` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_clients_risk_level` (`risk_level`),
  KEY `idx_clients_is_deleted` (`is_deleted`),
  CONSTRAINT `FK1hgwdp9vl25xl9i7s354sifey` FOREIGN KEY (`id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'2025-08-28 09:08:03',NULL,0,'2025-08-28 09:08:03',0,'서울시 서초구','매핑테스트로 2020',35,NULL,NULL,NULL,NULL,NULL,'매핑 테스트 이력 003',NULL,'매핑 테스트 상담 003',NULL,'mapping_test_client_003@mindgarden.com','매핑테스트비상연락처003',NULL,'010-3030-3030',NULL,NULL,NULL,NULL,NULL,NULL,'매핑테스트내담자003',NULL,'매핑 테스트용 내담자 003','010-2020-2020','06202',NULL,NULL,NULL,NULL,NULL,'1','2025-08-28',NULL,NULL,'ACTIVE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'2025-08-28 09:08:37',NULL,0,'2025-08-28 09:08:37',0,'서울시 서초구','매핑테스트로 5050',40,NULL,NULL,NULL,NULL,NULL,'매핑 테스트 이력 004',NULL,'매핑 테스트 상담 004',NULL,'mapping_test_client_004@mindgarden.com','매핑테스트비상연락처004',NULL,'010-6060-6060',NULL,NULL,NULL,NULL,NULL,NULL,'매핑테스트내담자004',NULL,'매핑 테스트용 내담자 004','010-5050-5050','06505',NULL,NULL,NULL,NULL,NULL,'1','2025-08-28',NULL,NULL,'ACTIVE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(20,'2025-08-29 02:01:53',NULL,0,'2025-08-29 02:01:53',0,NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,NULL,'Unknown Client',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'ADMIN','2025-08-29','LOW',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(34,'2025-09-02 06:05:58',NULL,0,'2025-09-02 06:05:58',0,NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,NULL,'Unknown Client',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'ADMIN','2025-09-02','LOW',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(35,'2025-09-02 06:06:03',NULL,0,'2025-09-02 06:06:03',0,NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,NULL,'Unknown Client',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'ADMIN','2025-09-02','LOW',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(36,'2025-09-02 06:06:09',NULL,0,'2025-09-02 06:06:09',0,NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,NULL,'Unknown Client',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'ADMIN','2025-09-02','LOW',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(46,'2025-09-04 13:00:35',NULL,0,'2025-09-04 13:00:35',0,NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,NULL,'Unknown Client',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'ADMIN','2025-09-04','LOW',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(48,'2025-09-12 15:50:19',NULL,NULL,'2025-09-12 15:50:19',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'trinity2012@kakao.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'김선희',NULL,NULL,'01042858570',NULL,NULL,NULL,NULL,NULL,NULL,'ADMIN','2025-09-13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MAIN001'),(50,'2025-09-12 16:01:29',NULL,NULL,'2025-09-12 16:01:29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'test2@kakao.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'테스트사용자2',NULL,NULL,'01012345679',NULL,NULL,NULL,NULL,NULL,NULL,'ADMIN','2025-09-13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MAIN001');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `code_group_metadata`
--

DROP TABLE IF EXISTS `code_group_metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `code_group_metadata` (
  `group_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_code` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `icon` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `korean_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`group_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `code_group_metadata`
--

LOCK TABLES `code_group_metadata` WRITE;
/*!40000 ALTER TABLE `code_group_metadata` DISABLE KEYS */;
INSERT INTO `code_group_metadata` VALUES ('ADDRESS_TYPE','#fd7e14','주소 유형을 나타내는 코드',69,'🏠',_binary '','주소유형'),('ADMIN_MENU','#20c997','관리자 메뉴를 나타내는 코드',70,'⚙️',_binary '','관리자메뉴'),('APPROVAL_STATUS','#e83e8c','승인 상태를 나타내는 코드',71,'✅',_binary '','승인상태'),('BANK','#6c757d','은행을 나타내는 코드',72,'🏦',_binary '','은행'),('BRANCH_SUPER_ADMIN_MENU','#007bff','지점 수퍼관리자 메뉴를 나타내는 코드',73,'👑',_binary '','지점수퍼관리자메뉴'),('BRANCH_TYPE','#6b7280','지점 분류',23,'🏢',_binary '','지점 유형'),('BUDGET_CATEGORY','#6f42c1','예산 카테고리를 나타내는 코드',23,'📈',_binary '','예산카테고리'),('BUDGET_STATUS','#fd7e14','예산 상태를 나타내는 코드',24,'📊',_binary '','예산상태'),('CHART_TYPE_FILTER','#28a745','차트 유형 필터를 나타내는 코드',74,'📈',_binary '','차트유형필터'),('CLIENT_MENU','#ffc107','내담자 메뉴를 나타내는 코드',75,'👥',_binary '','내담자메뉴'),('CLIENT_STATUS','#6f42c1','내담자의 상태를 나타내는 코드',5,'👥',_binary '','내담자상태'),('COMMON_CODE_GROUP','#17a2b8','공통 코드 그룹을 나타내는 코드',76,'📋',_binary '','공통코드그룹'),('COMMON_MENU','#6f42c1','공통 메뉴를 나타내는 코드',77,'🔧',_binary '','공통메뉴'),('CONSULTANT_GRADE','#17a2b8','상담사의 등급을 나타내는 코드',4,'👨‍⚕️',_binary '','상담사등급'),('CONSULTANT_GRADE_SALARY','#fd7e14','상담사 등급별 급여를 나타내는 코드',78,'💵',_binary '','상담사등급급여'),('CONSULTANT_MENU','#20c997','상담사 메뉴를 나타내는 코드',79,'👨‍⚕️',_binary '','상담사메뉴'),('CONSULTATION_DURATION','#f59e0b','상담 소요 시간',11,'⏰',_binary '','상담 시간'),('CONSULTATION_FEE','#e83e8c','상담료를 나타내는 코드',80,'💳',_binary '','상담료'),('CONSULTATION_LOCATION','#6f42c1','상담 장소를 나타내는 코드',34,'🏢',_binary '','상담장소'),('CONSULTATION_METHOD','#17a2b8','상담 방법을 나타내는 코드',33,'📞',_binary '','상담방법'),('CONSULTATION_MODE','#6c757d','상담 모드를 나타내는 코드',81,'🔄',_binary '','상담모드'),('CONSULTATION_PACKAGE','#007bff','상담 패키지를 나타내는 코드',30,'📦',_binary '','상담패키지'),('CONSULTATION_SESSION','#fd7e14','상담 세션을 나타내는 코드',35,'⏰',_binary '','상담세션'),('CONSULTATION_STATUS','#28a745','상담 상태를 나타내는 코드',31,'🔄',_binary '','상담상태'),('CONSULTATION_TYPE','#ffc107','상담 유형을 나타내는 코드',32,'🎯',_binary '','상담유형'),('CURRENCY','#007bff','통화를 나타내는 코드',82,'💱',_binary '','통화'),('DATE_RANGE','#007bff','날짜 범위를 나타내는 코드',63,'🗓️',_binary '','날짜범위'),('DATE_RANGE_FILTER','#007bff','날짜 범위 필터 옵션을 나타내는 코드',64,'📅',_binary '','날짜범위필터'),('DURATION','#28a745','기간을 나타내는 코드',65,'⏱️',_binary '','기간'),('EDUCATION_LEVEL','#8b5cf6','교육 수준',26,'🎓',_binary '','학력'),('EMPLOYMENT_TYPE','#6b7280','고용 형태',25,'📋',_binary '','고용 유형'),('EXPENSE_CATEGORY','#f59e0b','지출 항목 분류',3,'💸',_binary '','지출 카테고리'),('EXPENSE_SUBCATEGORY','#ffc107','지출 하위 카테고리를 나타내는 코드',66,'📊',_binary '','지출하위카테고리'),('FILE_TYPE','#17a2b8','파일 유형을 나타내는 코드',67,'📄',_binary '','파일유형'),('FINANCIAL_CATEGORY','#6f42c1','재무 카테고리를 나타내는 코드',68,'💰',_binary '','재무카테고리'),('FINANCIAL_STATUS','#ffc107','재무 상태를 나타내는 코드',42,'💼',_binary '','재무상태'),('FREELANCE_BASE_RATE','#28a745','프리랜서 기본 요율을 나타내는 코드',83,'💼',_binary '','프리랜서기본요율'),('GENDER','#e83e8c','성별을 나타내는 코드',13,'⚧',_binary '','성별'),('HQ_ADMIN_MENU','#ffc107','본사 관리자 메뉴를 나타내는 코드',84,'🏢',_binary '','본사관리자메뉴'),('INCOME_CATEGORY','#17a2b8','수입 카테고리를 나타내는 코드',85,'📈',_binary '','수입카테고리'),('INCOME_SUBCATEGORY','#6f42c1','수입 하위 카테고리를 나타내는 코드',86,'📊',_binary '','수입하위카테고리'),('ITEM_CATEGORY','#fd7e14','항목 카테고리를 나타내는 코드',87,'📦',_binary '','항목카테고리'),('LANGUAGE','#20c997','언어를 나타내는 코드',88,'🌐',_binary '','언어'),('MAPPING_STATUS','#20c997','상담사-내담자 매핑 상태를 나타내는 코드',12,'🔗',_binary '','매핑상태'),('MARITAL_STATUS','#ef4444','결혼 여부',27,'💍',_binary '','결혼 상태'),('MENU','#e83e8c','메뉴를 나타내는 코드',89,'📋',_binary '','메뉴'),('MENU_CATEGORY','#6c757d','메뉴 카테고리를 나타내는 코드',90,'🗂️',_binary '','메뉴카테고리'),('MESSAGE_TYPE','#007bff','메시지 유형을 나타내는 코드',91,'💬',_binary '','메시지유형'),('MONTH_RANGE','#6c757d','월 범위를 나타내는 코드',62,'📆',_binary '','월범위'),('NOTIFICATION_CHANNEL','#28a745','알림 채널을 나타내는 코드',92,'🔔',_binary '','알림채널'),('NOTIFICATION_TYPE','#ffc107','알림 유형을 나타내는 코드',93,'📢',_binary '','알림유형'),('PACKAGE_TYPE','#17a2b8','패키지 유형을 나타내는 코드',94,'📦',_binary '','패키지유형'),('PAYMENT_METHOD','#28a745','결제 방법을 나타내는 코드',20,'💳',_binary '','결제방법'),('PAYMENT_PROVIDER','#6f42c1','결제 제공자를 나타내는 코드',95,'💳',_binary '','결제제공자'),('PAYMENT_STATUS','#ffc107','결제 상태를 나타내는 코드',21,'💰',_binary '','결제상태'),('PERMISSION','#fd7e14','권한을 나타내는 코드',96,'🔐',_binary '','권한'),('PRIORITY','#fd7e14','우선순위를 나타내는 코드',11,'⚡',_binary '','우선순위'),('PRIORITY_LEVEL','#ffc107','우선순위 레벨을 나타내는 코드',71,'⚡',_binary '','우선순위레벨'),('PURCHASE_CATEGORY','#28a745','구매 카테고리를 나타내는 코드',41,'📦',_binary '','구매카테고리'),('PURCHASE_STATUS','#007bff','구매 상태를 나타내는 코드',40,'🛒',_binary '','구매상태'),('REPORT_PERIOD','#fd7e14','보고서 기간을 나타내는 코드',60,'📊',_binary '','보고서기간'),('RESPONSIBILITY','#28a745','담당 분야를 나타내는 코드',70,'🎯',_binary '','담당분야'),('ROLE','#20c997','역할을 나타내는 코드',97,'👤',_binary '','역할'),('ROLE_PERMISSION','#e83e8c','역할 권한을 나타내는 코드',98,'🔑',_binary '','역할권한'),('SALARY_OPTION_TYPE','#6c757d','급여 옵션 유형을 나타내는 코드',99,'💰',_binary '','급여옵션유형'),('SALARY_PAY_DAY','#007bff','급여 지급일을 나타내는 코드',100,'📅',_binary '','급여지급일'),('SALARY_STATUS','#17a2b8','급여 상태를 나타내는 코드',22,'💵',_binary '','급여상태'),('SALARY_TYPE','#28a745','급여 유형을 나타내는 코드',101,'💵',_binary '','급여유형'),('SCHEDULE_FILTER','#ffc107','스케줄 필터를 나타내는 코드',102,'🔍',_binary '','스케줄필터'),('SCHEDULE_SORT','#17a2b8','스케줄 정렬을 나타내는 코드',103,'📊',_binary '','스케줄정렬'),('SCHEDULE_STATUS','#20c997','스케줄 상태를 나타내는 코드',36,'📅',_binary '','스케줄상태'),('SCHEDULE_TYPE','#e83e8c','스케줄 유형을 나타내는 코드',37,'📋',_binary '','스케줄유형'),('SESSION_PACKAGE','#6c757d','회기 패키지를 나타내는 코드',38,'🎫',_binary '','회기패키지'),('SORT_OPTION','#6f42c1','정렬 옵션을 나타내는 코드',104,'🔄',_binary '','정렬옵션'),('SPECIALTY','#fd7e14','전문 분야를 나타내는 코드',105,'🎯',_binary '','전문분야'),('STATUS','#6c757d','일반적인 상태를 나타내는 코드',10,'📊',_binary '','상태'),('TAX_CALCULATION','#20c997','세금 계산을 나타내는 코드',106,'🧮',_binary '','세금계산'),('TAX_CATEGORY','#17a2b8','세무 카테고리를 나타내는 코드',43,'🧾',_binary '','세무카테고리'),('TEST_GROUP','#ff6b6b','동적 처리 시스템 테스트용',99,'🧪',_binary '','테스트 그룹'),('TIMEZONE','#e83e8c','시간대를 나타내는 코드',107,'🌍',_binary '','시간대'),('TRANSACTION_TYPE','#6c757d','거래 유형을 나타내는 코드',108,'💸',_binary '','거래유형'),('USER_GRADE','#ffc107','사용자의 등급을 나타내는 코드',3,'⭐',_binary '','사용자등급'),('USER_ROLE','#007bff','시스템 사용자의 역할을 나타내는 코드',1,'👤',_binary '','사용자역할'),('USER_STATUS','#28a745','사용자의 활성/비활성 상태를 나타내는 코드',2,'🟢',_binary '','사용자상태'),('VACATION_STATUS','#6f42c1','휴가 상태를 나타내는 코드',51,'📝',_binary '','휴가상태'),('VACATION_TYPE','#20c997','휴가 유형을 나타내는 코드',50,'🏖️',_binary '','휴가유형'),('VAT_APPLICABLE','#007bff','부가세 적용을 나타내는 코드',109,'🧾',_binary '','부가세적용'),('WORK_STATUS','#10b981','직원 근무 상태',24,'👷',_binary '','근무 상태'),('YEAR_RANGE','#e83e8c','년도 범위를 나타내는 코드',61,'📅',_binary '','년도범위');
/*!40000 ALTER TABLE `code_group_metadata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `common_codes`
--

DROP TABLE IF EXISTS `common_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `common_codes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `code_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code_group` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_value` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `extra_data` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `parent_code_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_code_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `color_code` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `korean_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_common_code_group` (`code_group`),
  KEY `idx_common_code_value` (`code_value`),
  KEY `idx_common_code_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=702 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `common_codes`
--

LOCK TABLES `common_codes` WRITE;
/*!40000 ALTER TABLE `common_codes` DISABLE KEYS */;
INSERT INTO `common_codes` VALUES (10,'2025-09-11 10:12:09.752293',NULL,_binary '\0','2025-09-11 10:12:09.752293',0,'날짜 오름차순 정렬','SCHEDULE_SORT','날짜 오름차순','DATE_ASC',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(11,'2025-09-11 10:12:09.758906',NULL,_binary '\0','2025-09-11 10:12:09.758906',0,'날짜 내림차순 정렬','SCHEDULE_SORT','날짜 내림차순','DATE_DESC',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(12,'2025-09-11 10:12:09.759683',NULL,_binary '\0','2025-09-11 10:12:09.759683',0,'제목 오름차순 정렬','SCHEDULE_SORT','제목 오름차순','TITLE_ASC',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(13,'2025-09-11 10:12:09.760236',NULL,_binary '\0','2025-09-11 10:12:09.760236',0,'제목 내림차순 정렬','SCHEDULE_SORT','제목 내림차순','TITLE_DESC',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(14,'2025-09-11 10:12:09.760889',NULL,_binary '\0','2025-09-11 10:12:09.760889',0,'상태 오름차순 정렬','SCHEDULE_SORT','상태 오름차순','STATUS_ASC',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(15,'2025-09-11 10:12:09.761425',NULL,_binary '\0','2025-09-11 10:12:09.761425',0,'상태 내림차순 정렬','SCHEDULE_SORT','상태 내림차순','STATUS_DESC',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(16,'2025-09-11 10:12:09.762077',NULL,_binary '\0','2025-09-11 10:12:09.762077',0,'모든 일정','SCHEDULE_FILTER','전체','ALL',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(17,'2025-09-11 10:12:09.762619',NULL,_binary '\0','2025-09-11 10:12:09.762619',0,'오늘 일정','SCHEDULE_FILTER','오늘','TODAY',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(18,'2025-09-11 10:12:09.763195',NULL,_binary '\0','2025-09-11 10:12:09.763195',0,'이번 주 일정','SCHEDULE_FILTER','이번 주','THIS_WEEK',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(19,'2025-09-11 10:12:09.763726',NULL,_binary '\0','2025-09-11 10:12:09.763726',0,'이번 달 일정','SCHEDULE_FILTER','이번 달','THIS_MONTH',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(20,'2025-09-11 10:12:09.764164',NULL,_binary '\0','2025-09-11 10:12:09.764164',0,'예정된 일정','SCHEDULE_FILTER','예정된 일정','UPCOMING',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(21,'2025-09-11 10:12:09.764745',NULL,_binary '\0','2025-09-11 10:12:09.764745',0,'완료된 일정','SCHEDULE_FILTER','완료된 일정','COMPLETED',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(22,'2025-09-11 10:12:09.765284',NULL,_binary '\0','2025-09-11 10:12:09.765284',0,'상담 패키지 유형','COMMON_CODE_GROUP','패키지 유형','PACKAGE_TYPE',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(23,'2025-09-11 10:12:09.765796',NULL,_binary '\0','2025-09-11 10:12:09.765796',0,'결제 수단','COMMON_CODE_GROUP','결제 방법','PAYMENT_METHOD',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(24,'2025-09-11 10:12:09.766647',NULL,_binary '\0','2025-09-11 10:12:09.766647',0,'책임 및 역할','COMMON_CODE_GROUP','책임','RESPONSIBILITY',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(25,'2025-09-11 10:12:09.767308',NULL,_binary '\0','2025-09-11 10:12:09.767308',0,'상담의 유형','COMMON_CODE_GROUP','상담 유형','CONSULTATION_TYPE',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(26,'2025-09-11 10:12:09.767913',NULL,_binary '\0','2025-09-11 10:12:09.767913',0,'사용자 성별','COMMON_CODE_GROUP','성별','GENDER',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(27,'2025-09-11 10:12:09.768323',NULL,_binary '\0','2025-09-11 10:12:09.768323',0,'사용자 역할','COMMON_CODE_GROUP','역할','ROLE',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(28,'2025-09-11 10:12:09.768883',NULL,_binary '\0','2025-09-11 10:12:09.768883',0,'일반적인 상태','COMMON_CODE_GROUP','상태','STATUS',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(29,'2025-09-11 10:12:09.769387',NULL,_binary '\0','2025-09-11 10:12:09.769387',0,'우선순위 구분','COMMON_CODE_GROUP','우선순위','PRIORITY',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(30,'2025-09-11 10:12:09.769897',NULL,_binary '\0','2025-09-11 10:12:09.769897',0,'알림의 유형','COMMON_CODE_GROUP','알림 유형','NOTIFICATION_TYPE',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(31,'2025-09-11 10:12:09.770421',NULL,_binary '\0','2025-09-11 10:12:09.770421',0,'일정의 상태','COMMON_CODE_GROUP','일정 상태','SCHEDULE_STATUS',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(32,'2025-09-11 10:12:09.770823',NULL,_binary '\0','2025-09-11 10:12:09.770823',0,'날짜 오름차순 정렬','SORT_OPTION','날짜 오름차순','DATE_ASC',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(33,'2025-09-11 10:12:09.771157',NULL,_binary '\0','2025-09-11 10:12:09.771157',0,'날짜 내림차순 정렬','SORT_OPTION','날짜 내림차순','DATE_DESC',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(34,'2025-09-11 10:12:09.771490',NULL,_binary '\0','2025-09-11 10:12:09.771490',0,'이름 오름차순 정렬','SORT_OPTION','이름 오름차순','NAME_ASC',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(35,'2025-09-11 10:12:09.771918',NULL,_binary '\0','2025-09-11 10:12:09.771918',0,'이름 내림차순 정렬','SORT_OPTION','이름 내림차순','NAME_DESC',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(36,'2025-09-11 10:12:09.772400',NULL,_binary '\0','2025-09-11 10:12:09.772400',0,'값 오름차순 정렬','SORT_OPTION','값 오름차순','VALUE_ASC',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(37,'2025-09-11 10:12:09.772868',NULL,_binary '\0','2025-09-11 10:12:09.772868',0,'값 내림차순 정렬','SORT_OPTION','값 내림차순','VALUE_DESC',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(38,'2025-09-11 10:12:09.773302',NULL,_binary '\0','2025-09-11 10:12:09.773302',0,'상태 오름차순 정렬','SORT_OPTION','상태 오름차순','STATUS_ASC',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(39,'2025-09-11 10:12:09.773731',NULL,_binary '\0','2025-09-11 10:12:09.773731',0,'상태 내림차순 정렬','SORT_OPTION','상태 내림차순','STATUS_DESC',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(40,'2025-09-11 10:12:09.774176',NULL,_binary '\0','2025-09-11 10:12:09.774176',0,'막대 차트','CHART_TYPE_FILTER','막대 차트','BAR',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(41,'2025-09-11 10:12:09.774594',NULL,_binary '\0','2025-09-11 10:12:09.774594',0,'선 차트','CHART_TYPE_FILTER','선 차트','LINE',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(42,'2025-09-11 10:12:09.775015',NULL,_binary '\0','2025-09-11 10:12:09.775015',0,'원형 차트','CHART_TYPE_FILTER','원형 차트','PIE',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(43,'2025-09-11 10:12:09.775424',NULL,_binary '\0','2025-09-11 10:12:09.775424',0,'도넛 차트','CHART_TYPE_FILTER','도넛 차트','DOUGHNUT',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(44,'2025-09-11 10:12:09.775872',NULL,_binary '\0','2025-09-11 10:12:09.775872',0,'영역 차트','CHART_TYPE_FILTER','영역 차트','AREA',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(45,'2025-09-11 10:12:09.776303',NULL,_binary '\0','2025-09-11 10:12:09.776303',0,'산점도','CHART_TYPE_FILTER','산점도','SCATTER',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(46,'2025-09-11 10:12:09.776725',NULL,_binary '\0','2025-09-11 10:12:09.776725',0,'레이더 차트','CHART_TYPE_FILTER','레이더 차트','RADAR',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(47,'2025-09-11 10:12:09.777161',NULL,_binary '\0','2025-09-11 10:12:09.777161',0,'테이블 형태','CHART_TYPE_FILTER','테이블','TABLE',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(48,'2025-09-11 10:12:09.777591',NULL,_binary '\0','2025-09-11 10:12:09.777591',0,'오늘','DATE_RANGE_FILTER','오늘','TODAY',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(49,'2025-09-11 10:12:09.778043',NULL,_binary '\0','2025-09-11 10:12:09.778043',0,'어제','DATE_RANGE_FILTER','어제','YESTERDAY',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(50,'2025-09-11 10:12:09.778465',NULL,_binary '\0','2025-09-11 10:12:09.778465',0,'이번 주','DATE_RANGE_FILTER','이번 주','THIS_WEEK',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(51,'2025-09-11 10:12:09.778831',NULL,_binary '\0','2025-09-11 10:12:09.778831',0,'지난 주','DATE_RANGE_FILTER','지난 주','LAST_WEEK',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(52,'2025-09-11 10:12:09.779367',NULL,_binary '\0','2025-09-11 10:12:09.779367',0,'이번 달','DATE_RANGE_FILTER','이번 달','THIS_MONTH',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(53,'2025-09-11 10:12:09.779707',NULL,_binary '\0','2025-09-11 10:12:09.779707',0,'지난 달','DATE_RANGE_FILTER','지난 달','LAST_MONTH',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(54,'2025-09-11 10:12:09.780064',NULL,_binary '\0','2025-09-11 10:12:09.780064',0,'올해','DATE_RANGE_FILTER','올해','THIS_YEAR',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(55,'2025-09-11 10:12:09.780514',NULL,_binary '\0','2025-09-11 10:12:09.780514',0,'사용자 정의 날짜 범위','DATE_RANGE_FILTER','사용자 정의','CUSTOM',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(56,'2025-09-11 10:12:09.780993',NULL,_binary '\0','2025-09-11 10:12:09.780993',0,'KB국민은행','BANK','KB국민은행','004',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(57,'2025-09-11 10:12:09.781463',NULL,_binary '\0','2025-09-11 10:12:09.781463',0,'신한은행','BANK','신한은행','088',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(58,'2025-09-11 10:12:09.781898',NULL,_binary '\0','2025-09-11 10:12:09.781898',0,'우리은행','BANK','우리은행','020',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(59,'2025-09-11 10:12:09.782322',NULL,_binary '\0','2025-09-11 10:12:09.782322',0,'하나은행','BANK','하나은행','081',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(60,'2025-09-11 10:12:09.782751',NULL,_binary '\0','2025-09-11 10:12:09.782751',0,'NH농협은행','BANK','NH농협은행','011',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(61,'2025-09-11 10:12:09.783184',NULL,_binary '\0','2025-09-11 10:12:09.783184',0,'카카오뱅크','BANK','카카오뱅크','090',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(62,'2025-09-11 10:12:09.783647',NULL,_binary '\0','2025-09-11 10:12:09.783647',0,'토스뱅크','BANK','토스뱅크','092',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(73,'2025-09-11 10:12:09.788521',NULL,_binary '\0','2025-09-11 10:12:09.788521',0,'심리 상담','SCHEDULE_TYPE','상담','CONSULTATION',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(74,'2025-09-11 10:12:09.788930',NULL,_binary '\0','2025-09-11 10:12:09.788930',0,'팀 회의','SCHEDULE_TYPE','회의','MEETING',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(75,'2025-09-11 10:12:09.789271',NULL,_binary '\0','2025-09-11 10:12:09.789271',0,'교육 및 훈련','SCHEDULE_TYPE','교육','TRAINING',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(76,'2025-09-11 10:12:09.789629',NULL,_binary '\0','2025-09-11 10:12:09.789629',0,'휴식 시간','SCHEDULE_TYPE','휴식','BREAK',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(77,'2025-09-11 10:12:09.790083',NULL,_binary '\0','2025-09-11 10:12:09.790083',0,'예약 불가 시간','SCHEDULE_TYPE','차단','BLOCKED',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(78,'2025-09-11 10:12:09.790559',NULL,_binary '\0','2025-09-11 10:12:09.790559',0,'1:1 개인 심리 상담','CONSULTATION_TYPE','개인상담','INDIVIDUAL','{\"durationMinutes\": 50}',_binary '',NULL,NULL,1,'#3b82f6',NULL,NULL),(79,'2025-09-11 10:12:09.791046',NULL,_binary '\0','2025-09-11 10:12:09.791046',0,'가족 구성원을 대상으로 한 상담','CONSULTATION_TYPE','가족상담','FAMILY','{\"durationMinutes\": 100}',_binary '',NULL,NULL,2,'#10b981',NULL,NULL),(80,'2025-09-11 10:12:09.791510',NULL,_binary '\0','2025-09-11 10:12:09.791510',0,'부부를 대상으로 한 상담','CONSULTATION_TYPE','부부상담','COUPLE','{\"durationMinutes\": 80}',_binary '',NULL,NULL,3,'#ec4899',NULL,NULL),(81,'2025-09-11 10:12:09.791947',NULL,_binary '\0','2025-09-11 10:12:09.791947',0,'첫 상담 및 상담 시작','CONSULTATION_TYPE','초기상담','INITIAL','{\"durationMinutes\": 60}',_binary '',NULL,NULL,4,'#f59e0b',NULL,NULL),(82,'2025-09-11 10:12:09.792362',NULL,_binary '\0','2025-09-11 10:12:09.792362',0,'여러 명이 함께하는 집단 상담','CONSULTATION_TYPE','집단상담','GROUP','{\"durationMinutes\": 90}',_binary '',NULL,NULL,5,'#8b5cf6',NULL,NULL),(83,'2025-09-11 10:12:09.792776',NULL,_binary '\0','2025-09-11 10:12:09.792776',0,'기본적인 10회기 상담 패키지','PACKAGE_TYPE','기본 10회기 패키지','basic_10',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(84,'2025-09-11 10:12:09.793198',NULL,_binary '\0','2025-09-11 10:12:09.793198',0,'프리미엄 20회기 상담 패키지','PACKAGE_TYPE','프리미엄 20회기 패키지','premium_20',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(85,'2025-09-11 10:12:09.793699',NULL,_binary '\0','2025-09-11 10:12:09.793699',0,'기본적인 20회기 상담 패키지','PACKAGE_TYPE','기본 20회기 패키지','basic_20',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(86,'2025-09-11 10:12:09.794170',NULL,_binary '\0','2025-09-11 10:12:09.794170',0,'프리미엄 10회기 상담 패키지','PACKAGE_TYPE','프리미엄 10회기 패키지','premium_10',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(87,'2025-09-11 10:12:09.794607',NULL,_binary '\0','2025-09-11 10:12:09.794607',0,'집중적인 5회기 상담 패키지','PACKAGE_TYPE','집중 5회기 패키지','intensive_5',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(88,'2025-09-11 10:12:09.795032',NULL,_binary '\0','2025-09-11 10:12:09.795032',0,'집중적인 15회기 상담 패키지','PACKAGE_TYPE','집중 15회기 패키지','intensive_15',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(89,'2025-09-11 10:12:09.795467',NULL,_binary '\0','2025-09-11 10:12:09.795467',0,'가족 상담 10회기 패키지','PACKAGE_TYPE','가족 상담 10회기 패키지','family_10',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(90,'2025-09-11 10:12:09.795881',NULL,_binary '\0','2025-09-11 10:12:09.795881',0,'부부 상담 8회기 패키지','PACKAGE_TYPE','부부 상담 8회기 패키지','couple_8',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(91,'2025-09-11 10:12:09.796330',NULL,_binary '\0','2025-09-11 10:12:09.796330',0,'우울증 상담 및 치료','SPECIALTY','우울증','DEPRESSION',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(92,'2025-09-11 10:12:09.796743',NULL,_binary '\0','2025-09-11 10:12:09.796743',0,'불안장애 상담 및 치료','SPECIALTY','불안장애','ANXIETY',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(93,'2025-09-11 10:12:09.797177',NULL,_binary '\0','2025-09-11 10:12:09.797177',0,'외상 후 스트레스 장애 상담','SPECIALTY','트라우마','TRAUMA',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(94,'2025-09-11 10:12:09.797657',NULL,_binary '\0','2025-09-11 10:12:09.797657',0,'인간관계 및 대인관계 상담','SPECIALTY','인간관계','RELATIONSHIP',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(95,'2025-09-11 10:12:09.798142',NULL,_binary '\0','2025-09-11 10:12:09.798142',0,'가족 문제 및 가족 상담','SPECIALTY','가족상담','FAMILY',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(96,'2025-09-11 10:12:09.798691',NULL,_binary '\0','2025-09-11 10:12:09.798691',0,'부부 관계 및 결혼 상담','SPECIALTY','부부상담','COUPLE',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(97,'2025-09-11 10:12:09.799008',NULL,_binary '\0','2025-09-11 10:12:09.799008',0,'아동 및 청소년 상담','SPECIALTY','아동상담','CHILD',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(98,'2025-09-11 10:12:09.799329',NULL,_binary '\0','2025-09-11 10:12:09.799329',0,'청소년 문제 및 상담','SPECIALTY','청소년상담','ADOLESCENT',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(99,'2025-09-11 10:12:09.799632',NULL,_binary '\0','2025-09-11 10:12:09.799632',0,'알코올, 도박 등 중독 상담','SPECIALTY','중독상담','ADDICTION',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(100,'2025-09-11 10:12:09.800098',NULL,_binary '\0','2025-09-11 10:12:09.800098',0,'섭식장애 상담 및 치료','SPECIALTY','섭식장애','EATING',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(101,'2025-09-11 10:12:09.800549',NULL,_binary '\0','2025-09-11 10:12:09.800549',0,'수면 문제 및 불면증 상담','SPECIALTY','수면장애','SLEEP',NULL,_binary '',NULL,NULL,11,NULL,NULL,NULL),(102,'2025-09-11 10:12:09.801001',NULL,_binary '\0','2025-09-11 10:12:09.801001',0,'상실과 슬픔 상담','SPECIALTY','상실상담','GRIEF',NULL,_binary '',NULL,NULL,12,NULL,NULL,NULL),(103,'2025-09-11 10:12:09.801450',NULL,_binary '\0','2025-09-11 10:12:09.801450',0,'진로 및 직업 상담','SPECIALTY','진로상담','CAREER',NULL,_binary '',NULL,NULL,13,NULL,NULL,NULL),(104,'2025-09-11 10:12:09.801835',NULL,_binary '\0','2025-09-11 10:12:09.801835',0,'스트레스 관리 및 상담','SPECIALTY','스트레스','STRESS',NULL,_binary '',NULL,NULL,14,NULL,NULL,NULL),(105,'2025-09-11 10:12:09.802213',NULL,_binary '\0','2025-09-11 10:12:09.802213',0,'자존감 향상 상담','SPECIALTY','자존감','SELF_ESTEEM',NULL,_binary '',NULL,NULL,15,NULL,NULL,NULL),(106,'2025-09-11 10:12:09.802586',NULL,_binary '\0','2025-09-11 10:12:09.802586',0,'남성','GENDER','남성','MALE',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(107,'2025-09-11 10:12:09.802972',NULL,_binary '\0','2025-09-11 10:12:09.802972',0,'여성','GENDER','여성','FEMALE',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(108,'2025-09-11 10:12:09.803367',NULL,_binary '\0','2025-09-11 10:12:09.803367',0,'기타','GENDER','기타','OTHER',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(109,'2025-09-11 10:12:09.803814',NULL,_binary '\0','2025-09-11 10:12:09.803814',0,'신용카드 결제','PAYMENT_METHOD','신용카드','card',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(110,'2025-09-11 10:12:09.804219',NULL,_binary '\0','2025-09-11 10:12:09.804219',0,'계좌이체 결제','PAYMENT_METHOD','계좌이체','bank_transfer',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(111,'2025-09-11 10:12:09.804651',NULL,_binary '\0','2025-09-11 10:12:09.804651',0,'카카오페이 결제','PAYMENT_METHOD','카카오페이','kakao_pay',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(112,'2025-09-11 10:12:09.804988',NULL,_binary '\0','2025-09-11 10:12:09.804988',0,'가상계좌 결제','PAYMENT_METHOD','가상계좌','VIRTUAL_ACCOUNT',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(113,'2025-09-11 10:12:09.805312',NULL,_binary '\0','2025-09-11 10:12:09.805312',0,'모바일 결제','PAYMENT_METHOD','모바일결제','MOBILE',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(114,'2025-09-11 10:12:09.805722',NULL,_binary '\0','2025-09-11 10:12:09.805722',0,'네이버페이 결제','PAYMENT_METHOD','네이버페이','naver_pay',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(115,'2025-09-11 10:12:09.806108',NULL,_binary '\0','2025-09-11 10:12:09.806108',0,'토스페이 결제','PAYMENT_METHOD','토스페이','toss',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(116,'2025-09-11 10:12:09.806516',NULL,_binary '\0','2025-09-11 10:12:09.806516',0,'현금 결제','PAYMENT_METHOD','현금','CASH',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(117,'2025-09-11 10:12:09.806922',NULL,_binary '\0','2025-09-11 10:12:09.806922',0,'페이팔 결제','PAYMENT_METHOD','페이팔','PAYPAL',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(118,'2025-09-11 10:12:09.807304',NULL,_binary '\0','2025-09-11 10:12:09.807304',0,'기타 결제 방법','PAYMENT_METHOD','기타','OTHER',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(119,'2025-09-11 10:12:09.807688',NULL,_binary '\0','2025-09-11 10:12:09.807688',0,'정신건강 관련 상담','RESPONSIBILITY','정신건강 상담','mental_health',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(120,'2025-09-11 10:12:09.808051',NULL,_binary '\0','2025-09-11 10:12:09.808051',0,'가족 상담','RESPONSIBILITY','가족 상담','family_counseling',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(121,'2025-09-11 10:12:09.808409',NULL,_binary '\0','2025-09-11 10:12:09.808409',0,'부부 상담','RESPONSIBILITY','부부 상담','couple_counseling',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(122,'2025-09-11 10:12:09.808782',NULL,_binary '\0','2025-09-11 10:12:09.808782',0,'아동 상담','RESPONSIBILITY','아동 상담','child_counseling',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(123,'2025-09-11 10:12:09.809163',NULL,_binary '\0','2025-09-11 10:12:09.809163',0,'청소년 상담','RESPONSIBILITY','청소년 상담','adolescent_counseling',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(124,'2025-09-11 10:12:09.809519',NULL,_binary '\0','2025-09-11 10:12:09.809519',0,'진로 상담','RESPONSIBILITY','진로 상담','career_counseling',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(125,'2025-09-11 10:12:09.809913',NULL,_binary '\0','2025-09-11 10:12:09.809913',0,'중독 상담','RESPONSIBILITY','중독 상담','addiction_counseling',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(126,'2025-09-11 10:12:09.810356',NULL,_binary '\0','2025-09-11 10:12:09.810356',0,'트라우마 상담','RESPONSIBILITY','트라우마 상담','trauma_counseling',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(127,'2025-09-11 10:12:09.810769',NULL,_binary '\0','2025-09-11 10:12:09.810769',0,'불안 상담','RESPONSIBILITY','불안 상담','anxiety_counseling',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(128,'2025-09-11 10:12:09.811184',NULL,_binary '\0','2025-09-11 10:12:09.811184',0,'우울 상담','RESPONSIBILITY','우울 상담','depression_counseling',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(129,'2025-09-11 10:12:09.811685',NULL,_binary '\0','2025-09-11 10:12:09.811685',0,'스트레스 관리','RESPONSIBILITY','스트레스 관리','stress_management',NULL,_binary '',NULL,NULL,11,NULL,NULL,NULL),(130,'2025-09-11 10:12:09.812062',NULL,_binary '\0','2025-09-11 10:12:09.812062',0,'분노 관리','RESPONSIBILITY','분노 관리','anger_management',NULL,_binary '',NULL,NULL,12,NULL,NULL,NULL),(131,'2025-09-11 10:12:09.812832',NULL,_binary '\0','2025-09-11 10:12:09.812832',0,'상실 상담','RESPONSIBILITY','상실 상담','grief_counseling',NULL,_binary '',NULL,NULL,13,NULL,NULL,NULL),(132,'2025-09-11 10:12:09.813230',NULL,_binary '\0','2025-09-11 10:12:09.813230',0,'인간관계 상담','RESPONSIBILITY','인간관계 상담','relationship_counseling',NULL,_binary '',NULL,NULL,14,NULL,NULL,NULL),(133,'2025-09-11 10:12:09.813777',NULL,_binary '\0','2025-09-11 10:12:09.813777',0,'자존감 향상','RESPONSIBILITY','자존감 향상','self_esteem',NULL,_binary '',NULL,NULL,15,NULL,NULL,NULL),(142,'2025-09-11 10:12:09.817865',NULL,_binary '\0','2025-09-11 10:12:09.817865',0,'오후 휴가 - 4시간','VACATION_TYPE','오후 휴가 (14:00-18:00)','AFTERNOON',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(143,'2025-09-11 10:12:09.818203',NULL,_binary '\0','2025-09-11 10:12:09.818203',0,'오전 반반차 휴무 (09:00-10:30)','VACATION_TYPE','오전 반반차','MORNING_HALF',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(144,'2025-09-11 10:12:09.818591',NULL,_binary '\0','2025-09-11 10:12:09.818591',0,'오전 반반차 1 - 2시간','VACATION_TYPE','오전 반반차 1 (09:00-11:00)','MORNING_HALF_1',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(145,'2025-09-11 10:12:09.818966',NULL,_binary '\0','2025-09-11 10:12:09.818966',0,'오후 반반차 휴무 (15:30-18:00)','VACATION_TYPE','오후 반반차','AFTERNOON_HALF',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(146,'2025-09-11 10:12:09.819340',NULL,_binary '\0','2025-09-11 10:12:09.819340',0,'오전 반반차 2 - 2시간','VACATION_TYPE','오전 반반차 2 (11:00-13:00)','MORNING_HALF_2',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(147,'2025-09-11 10:12:09.819713',NULL,_binary '\0','2025-09-11 10:12:09.819713',0,'사용자 정의 휴가','VACATION_TYPE','사용자 정의 휴가','CUSTOM_TIME',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(148,'2025-09-11 10:12:09.820101',NULL,_binary '\0','2025-09-11 10:12:09.820101',0,'오후 반반차 1 - 2시간','VACATION_TYPE','오후 반반차 1 (14:00-16:00)','AFTERNOON_HALF_1',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(149,'2025-09-11 10:12:09.820458',NULL,_binary '\0','2025-09-11 10:12:09.820458',0,'하루 종일 휴가','VACATION_TYPE','하루 종일 휴가','ALL_DAY',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(150,'2025-09-11 10:12:09.821291',NULL,_binary '\0','2025-09-11 10:12:09.821291',0,'오후 반반차 2 - 2시간','VACATION_TYPE','오후 반반차 2 (16:00-18:00)','AFTERNOON_HALF_2',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(151,'2025-09-11 10:12:09.821589',NULL,_binary '\0','2025-09-11 10:12:09.821589',0,'하루 종일 휴가','VACATION_TYPE','하루 종일 휴가','FULL_DAY',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(152,'2025-09-11 10:12:09.821897',NULL,_binary '\0','2025-09-11 10:12:09.821897',0,'휴가 신청 대기 상태','VACATION_STATUS','대기중','PENDING',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(153,'2025-09-11 10:12:09.822233',NULL,_binary '\0','2025-09-11 10:12:09.822233',0,'휴가 승인 상태','VACATION_STATUS','승인','APPROVED',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(154,'2025-09-11 10:12:09.822574',NULL,_binary '\0','2025-09-11 10:12:09.822574',0,'휴가 거부 상태','VACATION_STATUS','거부','REJECTED',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(155,'2025-09-11 10:12:09.822928',NULL,_binary '\0','2025-09-11 10:12:09.822928',0,'휴가 취소 상태','VACATION_STATUS','취소','CANCELLED',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(163,'2025-09-11 10:12:09.825777',NULL,_binary '\0','2025-09-11 10:12:09.825777',0,'부분 환불','PAYMENT_STATUS','부분환불','PARTIAL_REFUND',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(164,'2025-09-11 10:12:09.826134',NULL,_binary '\0','2025-09-11 10:12:09.826134',0,'30분 상담','DURATION','30분','30_MIN','{\"durationMinutes\": 30}',_binary '',NULL,NULL,1,'#f59e0b',NULL,NULL),(165,'2025-09-11 10:12:09.826470',NULL,_binary '\0','2025-09-11 10:12:09.826470',0,'50분 상담','DURATION','50분','50_MIN','{\"durationMinutes\": 50}',_binary '',NULL,NULL,2,'#3b82f6',NULL,NULL),(166,'2025-09-11 10:12:09.826798',NULL,_binary '\0','2025-09-11 10:12:09.826798',0,'60분 상담','DURATION','60분','60_MIN','{\"durationMinutes\": 60}',_binary '',NULL,NULL,3,'#10b981',NULL,NULL),(167,'2025-09-11 10:12:09.827143',NULL,_binary '\0','2025-09-11 10:12:09.827143',0,'80분 상담','DURATION','80분','80_MIN','{\"durationMinutes\": 80}',_binary '',NULL,NULL,4,'#ec4899',NULL,NULL),(168,'2025-09-11 10:12:09.827500',NULL,_binary '\0','2025-09-11 10:12:09.827500',0,'90분 상담','DURATION','90분','90_MIN','{\"durationMinutes\": 90}',_binary '',NULL,NULL,5,'#8b5cf6',NULL,NULL),(169,'2025-09-11 10:12:09.827845',NULL,_binary '\0','2025-09-11 10:12:09.827845',0,'100분 상담','DURATION','100분','100_MIN','{\"durationMinutes\": 100}',_binary '',NULL,NULL,6,'#f97316',NULL,NULL),(170,'2025-09-11 10:12:09.828201',NULL,_binary '\0','2025-09-11 10:12:09.828201',0,'120분 상담','DURATION','120분','120_MIN','{\"durationMinutes\": 120}',_binary '',NULL,NULL,7,'#ef4444',NULL,NULL),(171,'2025-09-11 10:12:09.828542',NULL,_binary '\0','2025-09-11 10:12:09.828542',0,'사용자가 직접 설정하는 상담 시간','DURATION','사용자 정의','CUSTOM','{\"durationMinutes\": 0}',_binary '',NULL,NULL,8,'#6b7280',NULL,NULL),(172,'2025-09-11 10:12:09.828905',NULL,_binary '\0','2025-09-11 10:12:09.828905',0,'자택 주소','ADDRESS_TYPE','집','HOME',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(173,'2025-09-11 10:12:09.829211',NULL,_binary '\0','2025-09-11 10:12:09.829211',0,'직장 주소','ADDRESS_TYPE','회사','WORK',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(174,'2025-09-11 10:12:09.829524',NULL,_binary '\0','2025-09-11 10:12:09.829524',0,'사무실 주소','ADDRESS_TYPE','사무실','OFFICE',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(175,'2025-09-11 10:12:09.829851',NULL,_binary '\0','2025-09-11 10:12:09.829851',0,'지점 주소','ADDRESS_TYPE','지점','BRANCH',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(176,'2025-09-11 10:12:09.830184',NULL,_binary '\0','2025-09-11 10:12:09.830184',0,'비상연락처 주소','ADDRESS_TYPE','비상연락처','EMERGENCY',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(177,'2025-09-11 10:12:09.830521',NULL,_binary '\0','2025-09-11 10:12:09.830521',0,'기타 주소','ADDRESS_TYPE','기타','OTHER',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(178,'2025-09-11 10:12:09.830847',NULL,_binary '\0','2025-09-11 10:12:09.830847',0,'사무용품 및 문구류','ITEM_CATEGORY','사무용품','OFFICE_SUPPLIES',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(179,'2025-09-11 10:12:09.831196',NULL,_binary '\0','2025-09-11 10:12:09.831196',0,'상담에 사용되는 도구 및 자료','ITEM_CATEGORY','상담 도구','COUNSELING_TOOLS',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(180,'2025-09-11 10:12:09.831529',NULL,_binary '\0','2025-09-11 10:12:09.831529',0,'전자기기 및 IT 장비','ITEM_CATEGORY','전자제품','ELECTRONICS',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(181,'2025-09-11 10:12:09.831874',NULL,_binary '\0','2025-09-11 10:12:09.831874',0,'사무용 가구 및 인테리어','ITEM_CATEGORY','가구','FURNITURE',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(182,'2025-09-11 10:12:09.832237',NULL,_binary '\0','2025-09-11 10:12:09.832237',0,'도서 및 참고자료','ITEM_CATEGORY','도서','BOOKS',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(183,'2025-09-11 10:12:09.832560',NULL,_binary '\0','2025-09-11 10:12:09.832560',0,'의료 및 건강 관련 용품','ITEM_CATEGORY','의료용품','MEDICAL_SUPPLIES',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(184,'2025-09-11 10:12:09.832871',NULL,_binary '\0','2025-09-11 10:12:09.832871',0,'청소 및 위생용품','ITEM_CATEGORY','청소용품','CLEANING_SUPPLIES',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(185,'2025-09-11 10:12:09.833184',NULL,_binary '\0','2025-09-11 10:12:09.833184',0,'기타 아이템','ITEM_CATEGORY','기타','OTHER',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(186,'2025-09-11 10:12:09.833476',NULL,_binary '\0','2025-09-11 10:12:09.833476',0,'일반적인 메시지','MESSAGE_TYPE','일반 메시지','GENERAL',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(187,'2025-09-11 10:12:09.833804',NULL,_binary '\0','2025-09-11 10:12:09.833804',0,'후속 조치 안내 메시지','MESSAGE_TYPE','후속 조치','FOLLOW_UP',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(188,'2025-09-11 10:12:09.834123',NULL,_binary '\0','2025-09-11 10:12:09.834123',0,'과제 및 숙제 안내 메시지','MESSAGE_TYPE','과제 안내','HOMEWORK',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(189,'2025-09-11 10:12:09.834421',NULL,_binary '\0','2025-09-11 10:12:09.834421',0,'약속 및 일정 안내 메시지','MESSAGE_TYPE','약속 안내','APPOINTMENT',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(190,'2025-09-11 10:12:09.834760',NULL,_binary '\0','2025-09-11 10:12:09.834760',0,'긴급 상황 안내 메시지','MESSAGE_TYPE','긴급 안내','EMERGENCY',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(191,'2025-09-11 10:12:09.835103',NULL,_binary '\0','2025-09-11 10:12:09.835103',0,'상담을 받는 내담자','ROLE','내담자','CLIENT',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(192,'2025-09-11 10:12:09.835432',NULL,_binary '\0','2025-09-11 10:12:09.835432',0,'상담을 제공하는 상담사','ROLE','상담사','CONSULTANT',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(193,'2025-09-11 10:12:09.835767',NULL,_binary '\0','2025-09-11 10:12:09.835767',0,'시스템 관리자','ROLE','관리자','ADMIN',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(194,'2025-09-11 10:12:09.836077',NULL,_binary '\0','2025-09-11 10:12:09.836077',0,'본사 총관리자','ROLE','본사총관리자','HQ_MASTER',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(195,'2025-09-11 10:12:09.836658',NULL,_binary '\0','2025-09-11 10:12:09.836658',0,'성공 알림','NOTIFICATION_TYPE','성공','SUCCESS',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(196,'2025-09-11 10:12:09.836989',NULL,_binary '\0','2025-09-11 10:12:09.836989',0,'오류 알림','NOTIFICATION_TYPE','오류','ERROR',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(197,'2025-09-11 10:12:09.837308',NULL,_binary '\0','2025-09-11 10:12:09.837308',0,'경고 알림','NOTIFICATION_TYPE','경고','WARNING',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(198,'2025-09-11 10:12:09.837618',NULL,_binary '\0','2025-09-11 10:12:09.837618',0,'정보 알림','NOTIFICATION_TYPE','정보','INFO',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(199,'2025-09-11 10:12:09.837923',NULL,_binary '\0','2025-09-11 10:12:09.837923',0,'기본 상담료','CONSULTATION_FEE','기본','STANDARD',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(200,'2025-09-11 10:12:09.838264',NULL,_binary '\0','2025-09-11 10:12:09.838264',0,'프리미엄 상담료','CONSULTATION_FEE','프리미엄','PREMIUM',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(201,'2025-09-11 10:12:09.838609',NULL,_binary '\0','2025-09-11 10:12:09.838609',0,'할인 상담료','CONSULTATION_FEE','할인','DISCOUNT',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(202,'2025-09-11 10:12:09.838938',NULL,_binary '\0','2025-09-11 10:12:09.838938',0,'무료 상담','CONSULTATION_FEE','무료','FREE',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(203,'2025-09-11 10:12:09.839276',NULL,_binary '\0','2025-09-11 10:12:09.839276',0,'월별 보고서','REPORT_PERIOD','월별','MONTH',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(204,'2025-09-11 10:12:09.839610',NULL,_binary '\0','2025-09-11 10:12:09.839610',0,'년별 보고서','REPORT_PERIOD','년별','YEAR',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(205,'2025-09-11 10:12:09.840012',NULL,_binary '\0','2025-09-11 10:12:09.840012',0,'분기별 보고서','REPORT_PERIOD','분기별','QUARTER',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(206,'2025-09-11 10:12:09.840392',NULL,_binary '\0','2025-09-11 10:12:09.840392',0,'주별 보고서','REPORT_PERIOD','주별','WEEK',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(207,'2025-09-11 10:12:09.840699',NULL,_binary '\0','2025-09-11 10:12:09.840699',0,'매핑이 있는 상태','MAPPING_STATUS','매핑 있음','HAS_MAPPING',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(208,'2025-09-11 10:12:09.841009',NULL,_binary '\0','2025-09-11 10:12:09.841009',0,'활성화된 매핑 상태','MAPPING_STATUS','활성 매핑','ACTIVE_MAPPING',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(209,'2025-09-11 10:12:09.841291',NULL,_binary '\0','2025-09-11 10:12:09.841291',0,'매핑이 없는 상태','MAPPING_STATUS','매핑 없음','NO_MAPPING',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(210,'2025-09-11 10:12:09.841570',NULL,_binary '\0','2025-09-11 10:12:09.841570',0,'매핑 대기 중인 상태','MAPPING_STATUS','매핑 대기','PENDING_MAPPING',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(211,'2025-09-11 10:12:09.841844',NULL,_binary '\0','2025-09-11 10:12:09.841844',0,'비활성화된 매핑 상태','MAPPING_STATUS','비활성 매핑','INACTIVE_MAPPING',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(212,'2025-09-11 10:12:09.842171',NULL,_binary '\0','2025-09-11 10:12:09.842171',0,'온라인 상담 세션','CONSULTATION_SESSION','온라인','ONLINE',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(213,'2025-09-11 10:12:09.842462',NULL,_binary '\0','2025-09-11 10:12:09.842462',0,'오프라인 상담 세션','CONSULTATION_SESSION','오프라인','OFFLINE',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(214,'2025-09-11 10:12:09.842767',NULL,_binary '\0','2025-09-11 10:12:09.842767',0,'전화 상담 세션','CONSULTATION_SESSION','전화','PHONE',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(215,'2025-09-11 10:12:09.843047',NULL,_binary '\0','2025-09-11 10:12:09.843047',0,'화상 상담 세션','CONSULTATION_SESSION','화상','VIDEO',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(216,'2025-09-11 10:12:09.843331',NULL,_binary '\0','2025-09-11 10:12:09.843331',0,'채팅 상담 세션','CONSULTATION_SESSION','채팅','CHAT',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(217,'2025-09-11 10:12:09.843606',NULL,_binary '\0','2025-09-11 10:12:09.843606',0,'낮은 우선순위','PRIORITY','낮음','LOW',NULL,_binary '',NULL,NULL,1,'#10b981','🟢',NULL),(218,'2025-09-11 10:12:09.843936',NULL,_binary '\0','2025-09-11 10:12:09.843936',0,'보통 우선순위','PRIORITY','보통','MEDIUM',NULL,_binary '',NULL,NULL,2,'#f59e0b','🟡',NULL),(219,'2025-09-11 10:12:09.844241',NULL,_binary '\0','2025-09-11 10:12:09.844241',0,'높은 우선순위','PRIORITY','높음','HIGH',NULL,_binary '',NULL,NULL,3,'#dc2626','🔴',NULL),(220,'2025-09-11 10:12:09.844524',NULL,_binary '\0','2025-09-11 10:12:09.844524',0,'긴급 우선순위','PRIORITY','긴급','URGENT',NULL,_binary '',NULL,NULL,4,'#dc2626','⚡',NULL),(221,'2025-09-11 10:12:09.844825',NULL,_binary '\0','2025-09-11 10:12:09.844825',0,'위험 우선순위','PRIORITY','위험','CRITICAL',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(222,'2025-09-11 10:12:09.845109',NULL,_binary '\0','2025-09-11 10:12:09.845109',0,'활성 상태','STATUS','활성','ACTIVE',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(223,'2025-09-11 10:12:09.845404',NULL,_binary '\0','2025-09-11 10:12:09.845404',0,'비활성 상태','STATUS','비활성','INACTIVE',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(224,'2025-09-11 10:12:09.845714',NULL,_binary '\0','2025-09-11 10:12:09.845714',0,'대기 상태','STATUS','대기','PENDING',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(225,'2025-09-11 10:12:09.846011',NULL,_binary '\0','2025-09-11 10:12:09.846011',0,'일시정지 상태','STATUS','일시정지','SUSPENDED',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(226,'2025-09-11 10:12:09.846299',NULL,_binary '\0','2025-09-11 10:12:09.846299',0,'삭제된 상태','STATUS','삭제','DELETED',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(227,'2025-09-11 10:12:09.846602',NULL,_binary '\0','2025-09-11 10:12:09.846602',0,'완료된 상태','STATUS','완료','COMPLETED',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(228,'2025-09-11 10:12:09.846877',NULL,_binary '\0','2025-09-11 10:12:09.846877',0,'한국 표준시 (UTC+9)','TIMEZONE','한국 표준시','KST',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(229,'2025-09-11 10:12:09.847190',NULL,_binary '\0','2025-09-11 10:12:09.847190',0,'협정 세계시 (UTC+0)','TIMEZONE','협정 세계시','UTC',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(230,'2025-09-11 10:12:09.847510',NULL,_binary '\0','2025-09-11 10:12:09.847510',0,'미국 동부 표준시 (UTC-5)','TIMEZONE','동부 표준시','EST',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(231,'2025-09-11 10:12:09.847837',NULL,_binary '\0','2025-09-11 10:12:09.847837',0,'미국 태평양 표준시 (UTC-8)','TIMEZONE','태평양 표준시','PST',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(232,'2025-09-11 10:12:09.848181',NULL,_binary '\0','2025-09-11 10:12:09.848181',0,'일본 표준시 (UTC+9)','TIMEZONE','일본 표준시','JST',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(233,'2025-09-11 10:12:09.848491',NULL,_binary '\0','2025-09-11 10:12:09.848491',0,'중국 표준시 (UTC+8)','TIMEZONE','중국 표준시','CST',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(234,'2025-09-11 10:12:09.848776',NULL,_binary '\0','2025-09-11 10:12:09.848776',0,'그리니치 표준시 (UTC+0)','TIMEZONE','그리니치 표준시','GMT',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(235,'2025-09-11 10:12:09.849076',NULL,_binary '\0','2025-09-11 10:12:09.849076',0,'중앙 유럽 시간 (UTC+1)','TIMEZONE','중앙 유럽 시간','CET',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(236,'2025-09-11 10:12:09.849355',NULL,_binary '\0','2025-09-11 10:12:09.849355',0,'한국어','LANGUAGE','한국어','KO',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(237,'2025-09-11 10:12:09.849630',NULL,_binary '\0','2025-09-11 10:12:09.849630',0,'English','LANGUAGE','영어','EN',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(238,'2025-09-11 10:12:09.849907',NULL,_binary '\0','2025-09-11 10:12:09.849907',0,'日本語','LANGUAGE','일본어','JA',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(239,'2025-09-11 10:12:09.850176',NULL,_binary '\0','2025-09-11 10:12:09.850176',0,'中文','LANGUAGE','중국어','ZH',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(240,'2025-09-11 10:12:09.850464',NULL,_binary '\0','2025-09-11 10:12:09.850464',0,'Español','LANGUAGE','스페인어','ES',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(241,'2025-09-11 10:12:09.850750',NULL,_binary '\0','2025-09-11 10:12:09.850750',0,'Français','LANGUAGE','프랑스어','FR',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(242,'2025-09-11 10:12:09.851046',NULL,_binary '\0','2025-09-11 10:12:09.851046',0,'Deutsch','LANGUAGE','독일어','DE',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(243,'2025-09-11 10:12:09.851352',NULL,_binary '\0','2025-09-11 10:12:09.851352',0,'Русский','LANGUAGE','러시아어','RU',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(244,'2025-09-11 10:12:09.851638',NULL,_binary '\0','2025-09-11 10:12:09.851638',0,'대한민국 원화','CURRENCY','한국 원','KRW',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(245,'2025-09-11 10:12:09.851937',NULL,_binary '\0','2025-09-11 10:12:09.851937',0,'United States Dollar','CURRENCY','미국 달러','USD',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(246,'2025-09-11 10:12:09.852309',NULL,_binary '\0','2025-09-11 10:12:09.852309',0,'Euro','CURRENCY','유로','EUR',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(247,'2025-09-11 10:12:09.852618',NULL,_binary '\0','2025-09-11 10:12:09.852618',0,'Japanese Yen','CURRENCY','일본 엔','JPY',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(248,'2025-09-11 10:12:09.852931',NULL,_binary '\0','2025-09-11 10:12:09.852931',0,'British Pound Sterling','CURRENCY','영국 파운드','GBP',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(249,'2025-09-11 10:12:09.853226',NULL,_binary '\0','2025-09-11 10:12:09.853226',0,'Chinese Yuan','CURRENCY','중국 위안','CNY',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(250,'2025-09-11 10:12:09.853575',NULL,_binary '\0','2025-09-11 10:12:09.853575',0,'Australian Dollar','CURRENCY','호주 달러','AUD',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(251,'2025-09-11 10:12:09.853918',NULL,_binary '\0','2025-09-11 10:12:09.853918',0,'Canadian Dollar','CURRENCY','캐나다 달러','CAD',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(252,'2025-09-11 10:12:09.854205',NULL,_binary '\0','2025-09-11 10:12:09.854205',0,'Portable Document Format','FILE_TYPE','PDF 문서','PDF',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(253,'2025-09-11 10:12:09.854499',NULL,_binary '\0','2025-09-11 10:12:09.854499',0,'Microsoft Word Document','FILE_TYPE','Word 문서','DOC',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(254,'2025-09-11 10:12:09.854864',NULL,_binary '\0','2025-09-11 10:12:09.854864',0,'Microsoft Word Document (XML)','FILE_TYPE','Word 문서 (새 형식)','DOCX',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(255,'2025-09-11 10:12:09.855190',NULL,_binary '\0','2025-09-11 10:12:09.855190',0,'Microsoft Excel Spreadsheet','FILE_TYPE','Excel 스프레드시트','XLS',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(256,'2025-09-11 10:12:09.855526',NULL,_binary '\0','2025-09-11 10:12:09.855526',0,'Microsoft Excel Spreadsheet (XML)','FILE_TYPE','Excel 스프레드시트 (새 형식)','XLSX',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(257,'2025-09-11 10:12:09.855866',NULL,_binary '\0','2025-09-11 10:12:09.855866',0,'Microsoft PowerPoint Presentation','FILE_TYPE','PowerPoint 프레젠테이션','PPT',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(258,'2025-09-11 10:12:09.856207',NULL,_binary '\0','2025-09-11 10:12:09.856207',0,'Microsoft PowerPoint Presentation (XML)','FILE_TYPE','PowerPoint 프레젠테이션 (새 형식)','PPTX',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(259,'2025-09-11 10:12:09.856647',NULL,_binary '\0','2025-09-11 10:12:09.856647',0,'Image Files (JPG, PNG, GIF, etc.)','FILE_TYPE','이미지 파일','IMAGE',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(260,'2025-09-11 10:12:09.856998',NULL,_binary '\0','2025-09-11 10:12:09.856998',0,'Video Files (MP4, AVI, MOV, etc.)','FILE_TYPE','비디오 파일','VIDEO',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(261,'2025-09-11 10:12:09.857306',NULL,_binary '\0','2025-09-11 10:12:09.857306',0,'Audio Files (MP3, WAV, etc.)','FILE_TYPE','오디오 파일','AUDIO',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(262,'2025-09-11 10:12:09.857602',NULL,_binary '\0','2025-09-11 10:12:09.857602',0,'Plain Text File','FILE_TYPE','텍스트 파일','TXT',NULL,_binary '',NULL,NULL,11,NULL,NULL,NULL),(263,'2025-09-11 10:12:09.857905',NULL,_binary '\0','2025-09-11 10:12:09.857905',0,'Compressed Archive (ZIP, RAR, etc.)','FILE_TYPE','압축 파일','ZIP',NULL,_binary '',NULL,NULL,12,NULL,NULL,NULL),(264,'2025-09-11 10:12:09.858239',NULL,_binary '\0','2025-09-11 10:12:09.858239',0,'승인 대기 중','APPROVAL_STATUS','대기','PENDING',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(265,'2025-09-11 10:12:09.858586',NULL,_binary '\0','2025-09-11 10:12:09.858586',0,'승인 완료','APPROVAL_STATUS','승인','APPROVED',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(266,'2025-09-11 10:12:09.858993',NULL,_binary '\0','2025-09-11 10:12:09.858993',0,'승인 거부','APPROVAL_STATUS','거부','REJECTED',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(267,'2025-09-11 10:12:09.859341',NULL,_binary '\0','2025-09-11 10:12:09.859341',0,'승인 취소','APPROVAL_STATUS','취소','CANCELLED',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(268,'2025-09-11 10:12:09.859626',NULL,_binary '\0','2025-09-11 10:12:09.859626',0,'승인 검토 중','APPROVAL_STATUS','검토중','REVIEWING',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(269,'2025-09-11 10:12:09.859908',NULL,_binary '\0','2025-09-11 10:12:09.859908',0,'수정 후 재제출 필요','APPROVAL_STATUS','수정요청','REQUIRES_REVISION',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(270,'2025-09-11 10:12:09.860176',NULL,_binary '\0','2025-09-11 10:12:09.860176',0,'승인 기간 만료','APPROVAL_STATUS','만료','EXPIRED',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(271,'2025-09-11 10:12:09.860451',NULL,_binary '\0','2025-09-11 10:12:09.860451',0,'승인 요청 철회','APPROVAL_STATUS','철회','WITHDRAWN',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(272,'2025-09-11 10:12:09.860734',NULL,_binary '\0','2025-09-11 10:12:09.860734',0,'이메일 알림','NOTIFICATION_CHANNEL','이메일','EMAIL',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(273,'2025-09-11 10:12:09.861019',NULL,_binary '\0','2025-09-11 10:12:09.861019',0,'문자 메시지 알림','NOTIFICATION_CHANNEL','SMS','SMS',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(274,'2025-09-11 10:12:09.861299',NULL,_binary '\0','2025-09-11 10:12:09.861299',0,'모바일 푸시 알림','NOTIFICATION_CHANNEL','푸시 알림','PUSH',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(275,'2025-09-11 10:12:09.861580',NULL,_binary '\0','2025-09-11 10:12:09.861580',0,'앱 내부 알림','NOTIFICATION_CHANNEL','앱 내 알림','IN_APP',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(276,'2025-09-11 10:12:09.861860',NULL,_binary '\0','2025-09-11 10:12:09.861860',0,'웹훅 알림','NOTIFICATION_CHANNEL','웹훅','WEBHOOK',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(277,'2025-09-11 10:12:09.862166',NULL,_binary '\0','2025-09-11 10:12:09.862166',0,'슬랙 알림','NOTIFICATION_CHANNEL','슬랙','SLACK',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(278,'2025-09-11 10:12:09.862472',NULL,_binary '\0','2025-09-11 10:12:09.862472',0,'디스코드 알림','NOTIFICATION_CHANNEL','디스코드','DISCORD',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(279,'2025-09-11 10:12:09.862765',NULL,_binary '\0','2025-09-11 10:12:09.862765',0,'텔레그램 알림','NOTIFICATION_CHANNEL','텔레그램','TELEGRAM',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(286,'2025-09-11 10:12:09.864822',NULL,_binary '\0','2025-09-11 10:12:09.864822',0,'실시간 상담 모드','CONSULTATION_MODE','실시간','REAL_TIME',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(287,'2025-09-11 10:12:09.865116',NULL,_binary '\0','2025-09-11 10:12:09.865116',0,'비동기 상담 모드','CONSULTATION_MODE','비동기','ASYNC',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(288,'2025-09-11 10:12:09.865394',NULL,_binary '\0','2025-09-11 10:12:09.865394',0,'채팅 상담 모드','CONSULTATION_MODE','채팅','CHAT',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(289,'2025-09-11 10:12:09.865682',NULL,_binary '\0','2025-09-11 10:12:09.865682',0,'음성 상담 모드','CONSULTATION_MODE','음성','VOICE',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(290,'2025-09-11 10:12:09.865943',NULL,_binary '\0','2025-09-11 10:12:09.865943',0,'화상 상담 모드','CONSULTATION_MODE','화상','VIDEO',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(291,'2025-09-11 10:12:09.866207',NULL,_binary '\0','2025-09-11 10:12:09.866207',0,'텍스트 상담 모드','CONSULTATION_MODE','텍스트','TEXT',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(292,'2025-09-11 10:12:09.866477',NULL,_binary '\0','2025-09-11 10:12:09.866477',0,'혼합 상담 모드','CONSULTATION_MODE','혼합','MIXED',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(293,'2025-09-11 10:12:09.866735',NULL,_binary '\0','2025-09-11 10:12:09.866735',0,'오프라인 상담 모드','CONSULTATION_MODE','오프라인','OFFLINE',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(302,'2025-09-11 13:36:14.024339',NULL,_binary '\0','2025-09-11 13:36:14.024339',0,'매월 10일에 급여 지급 (기본)','SALARY_PAY_DAY','10일 지급','TENTH','{\"dayOfMonth\": 10, \"description\": \"매월 10일 지급\", \"isDefault\": true}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(303,'2025-09-11 13:36:14.043850',NULL,_binary '\0','2025-09-11 13:36:14.043850',0,'매월 15일에 급여 지급','SALARY_PAY_DAY','15일 지급','FIFTEENTH','{\"dayOfMonth\": 15, \"description\": \"매월 15일 지급\", \"isDefault\": false}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(304,'2025-09-11 13:36:14.044892',NULL,_binary '\0','2025-09-11 13:36:14.044892',0,'매월 20일에 급여 지급','SALARY_PAY_DAY','20일 지급','TWENTIETH','{\"dayOfMonth\": 20, \"description\": \"매월 20일 지급\", \"isDefault\": false}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(305,'2025-09-11 13:36:14.045713',NULL,_binary '\0','2025-09-11 13:36:14.045713',0,'매월 25일에 급여 지급','SALARY_PAY_DAY','25일 지급','TWENTY_FIFTH','{\"dayOfMonth\": 25, \"description\": \"매월 25일 지급\", \"isDefault\": false}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(306,'2025-09-11 13:36:14.046432',NULL,_binary '\0','2025-09-11 13:36:14.046432',0,'매월 말일에 급여 지급','SALARY_PAY_DAY','말일 지급','LAST_DAY','{\"dayOfMonth\": 0, \"description\": \"매월 말일 지급\", \"isDefault\": false}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(307,'2025-09-11 13:36:14.047030',NULL,_binary '\0','2025-09-11 13:36:14.047030',0,'매월 1일에 급여 지급','SALARY_PAY_DAY','1일 지급','FIRST_DAY','{\"dayOfMonth\": 1, \"description\": \"매월 1일 지급\", \"isDefault\": false}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(308,'2025-09-11 14:18:54.298261',NULL,_binary '\0','2025-09-11 14:18:54.298261',0,'신입 상담사 (1-2년 경력)','CONSULTANT_GRADE','주니어 상담사','CONSULTANT_JUNIOR','{\"level\": 1, \"experience\": \"1-2년\", \"description\": \"신입 상담사\", \"multiplier\": 1.0}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(309,'2025-09-11 14:18:54.304343',NULL,_binary '\0','2025-09-11 14:18:54.304343',0,'중급 상담사 (3-5년 경력)','CONSULTANT_GRADE','시니어 상담사','CONSULTANT_SENIOR','{\"level\": 2, \"experience\": \"3-5년\", \"description\": \"중급 상담사\", \"multiplier\": 1.2}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(310,'2025-09-11 14:18:54.305301',NULL,_binary '\0','2025-09-11 14:18:54.305301',0,'고급 상담사 (6-10년 경력)','CONSULTANT_GRADE','엑스퍼트 상담사','CONSULTANT_EXPERT','{\"level\": 3, \"experience\": \"6-10년\", \"description\": \"고급 상담사\", \"multiplier\": 1.4}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(311,'2025-09-11 14:18:54.305995',NULL,_binary '\0','2025-09-11 14:18:54.305995',0,'최고급 상담사 (10년 이상 경력)','CONSULTANT_GRADE','마스터 상담사','CONSULTANT_MASTER','{\"level\": 4, \"experience\": \"10년 이상\", \"description\": \"최고급 상담사\", \"multiplier\": 1.6}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(312,'2025-09-11 14:18:54.307702',NULL,_binary '\0','2025-09-11 14:18:54.307702',0,'프리랜서 상담사 급여','SALARY_TYPE','프리랜서','FREELANCE','{\"type\": \"FREELANCE\", \"description\": \"프리랜서 상담사\", \"taxType\": \"WITHHOLDING\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(313,'2025-09-11 14:18:54.308319',NULL,_binary '\0','2025-09-11 14:18:54.308319',0,'정규직 상담사 급여','SALARY_TYPE','정규직','REGULAR','{\"type\": \"REGULAR\", \"description\": \"정규직 상담사\", \"taxType\": \"INCOME_TAX\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(314,'2025-09-11 14:18:54.309838',NULL,_binary '\0','2025-09-11 14:18:54.309838',0,'가족상담 시 추가 급여','SALARY_OPTION_TYPE','가족상담','FAMILY_CONSULTATION','{\"type\": \"FAMILY_CONSULTATION\", \"baseAmount\": 3000, \"description\": \"가족상담 추가 급여\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(315,'2025-09-11 14:18:54.310362',NULL,_binary '\0','2025-09-11 14:18:54.310362',0,'초기상담 시 추가 급여','SALARY_OPTION_TYPE','초기상담','INITIAL_CONSULTATION','{\"type\": \"INITIAL_CONSULTATION\", \"baseAmount\": 5000, \"description\": \"초기상담 추가 급여\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(316,'2025-09-11 14:18:54.311048',NULL,_binary '\0','2025-09-11 14:18:54.311048',0,'주말상담 시 추가 급여','SALARY_OPTION_TYPE','주말상담','WEEKEND_CONSULTATION','{\"type\": \"WEEKEND_CONSULTATION\", \"baseAmount\": 2000, \"description\": \"주말상담 추가 급여\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(317,'2025-09-11 14:18:54.311674',NULL,_binary '\0','2025-09-11 14:18:54.311674',0,'온라인상담 시 추가 급여','SALARY_OPTION_TYPE','온라인상담','ONLINE_CONSULTATION','{\"type\": \"ONLINE_CONSULTATION\", \"baseAmount\": 1000, \"description\": \"온라인상담 추가 급여\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(318,'2025-09-11 14:18:54.312191',NULL,_binary '\0','2025-09-11 14:18:54.312191',0,'전화상담 시 추가 급여','SALARY_OPTION_TYPE','전화상담','PHONE_CONSULTATION','{\"type\": \"PHONE_CONSULTATION\", \"baseAmount\": 1500, \"description\": \"전화상담 추가 급여\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(319,'2025-09-11 14:18:54.312764',NULL,_binary '\0','2025-09-11 14:18:54.312764',0,'트라우마상담 시 추가 급여','SALARY_OPTION_TYPE','트라우마상담','TRAUMA_CONSULTATION','{\"type\": \"TRAUMA_CONSULTATION\", \"baseAmount\": 4000, \"description\": \"트라우마상담 추가 급여\"}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(320,'2025-09-11 14:18:54.314216',NULL,_binary '\0','2025-09-11 14:18:54.314216',0,'주니어 상담사 기본 급여','CONSULTANT_GRADE_SALARY','주니어 기본급','JUNIOR_BASE','{\"baseAmount\": 3000000, \"grade\": \"CONSULTANT_JUNIOR\", \"level\": 1}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(321,'2025-09-11 14:18:54.315248',NULL,_binary '\0','2025-09-11 14:18:54.315248',0,'시니어 상담사 기본 급여','CONSULTANT_GRADE_SALARY','시니어 기본급','SENIOR_BASE','{\"baseAmount\": 4000000, \"grade\": \"CONSULTANT_SENIOR\", \"level\": 2}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(322,'2025-09-11 14:18:54.315884',NULL,_binary '\0','2025-09-11 14:18:54.315884',0,'엑스퍼트 상담사 기본 급여','CONSULTANT_GRADE_SALARY','엑스퍼트 기본급','EXPERT_BASE','{\"baseAmount\": 5000000, \"grade\": \"CONSULTANT_EXPERT\", \"level\": 3}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(323,'2025-09-11 14:18:54.316639',NULL,_binary '\0','2025-09-11 14:18:54.316639',0,'마스터 상담사 기본 급여','CONSULTANT_GRADE_SALARY','마스터 기본급','MASTER_BASE','{\"baseAmount\": 6000000, \"grade\": \"CONSULTANT_MASTER\", \"level\": 4}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(324,'2025-09-11 14:18:54.318241',NULL,_binary '\0','2025-09-11 14:18:54.318241',0,'주니어 프리랜서 기본 상담료','FREELANCE_BASE_RATE','주니어 기본상담료','JUNIOR_RATE','{\"rate\": 30000, \"grade\": \"CONSULTANT_JUNIOR\", \"duration\": 50, \"level\": 1}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(325,'2025-09-11 14:18:54.318795',NULL,_binary '\0','2025-09-11 14:18:54.318795',0,'시니어 프리랜서 기본 상담료','FREELANCE_BASE_RATE','시니어 기본상담료','SENIOR_RATE','{\"rate\": 35000, \"grade\": \"CONSULTANT_SENIOR\", \"duration\": 50, \"level\": 2}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(326,'2025-09-11 14:18:54.319314',NULL,_binary '\0','2025-09-11 14:18:54.319314',0,'엑스퍼트 프리랜서 기본 상담료','FREELANCE_BASE_RATE','엑스퍼트 기본상담료','EXPERT_RATE','{\"rate\": 40000, \"grade\": \"CONSULTANT_EXPERT\", \"duration\": 50, \"level\": 3}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(327,'2025-09-11 14:18:54.319783',NULL,_binary '\0','2025-09-11 14:18:54.319783',0,'마스터 프리랜서 기본 상담료','FREELANCE_BASE_RATE','마스터 기본상담료','MASTER_RATE','{\"rate\": 45000, \"grade\": \"CONSULTANT_MASTER\", \"duration\": 50, \"level\": 4}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(328,'2025-09-12 11:16:28.018451',NULL,_binary '\0','2025-09-12 11:16:28.018451',0,'수입 거래','TRANSACTION_TYPE','수입','INCOME',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(329,'2025-09-12 11:16:28.023804',NULL,_binary '\0','2025-09-12 11:16:28.023804',0,'지출 거래','TRANSACTION_TYPE','지출','EXPENSE',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(330,'2025-09-12 11:16:28.024979',NULL,_binary '\0','2025-09-12 11:16:28.024979',0,'상담 서비스 수익','INCOME_CATEGORY','상담료','CONSULTATION',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(331,'2025-09-12 11:16:28.025678',NULL,_binary '\0','2025-09-12 11:16:28.025678',0,'상담 패키지 판매 수익','INCOME_CATEGORY','패키지','PACKAGE',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(332,'2025-09-12 11:16:28.026234',NULL,_binary '\0','2025-09-12 11:16:28.026234',0,'기타 수입 항목','INCOME_CATEGORY','기타수입','OTHER',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(333,'2025-09-12 11:16:28.027325',NULL,_binary '\0','2025-09-12 11:16:28.027325',0,'직원 급여','EXPENSE_CATEGORY','급여','SALARY',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(334,'2025-09-12 11:16:28.027879',NULL,_binary '\0','2025-09-12 11:16:28.027879',0,'사무실 임대료','EXPENSE_CATEGORY','임대료','RENT',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(335,'2025-09-12 11:16:28.028485',NULL,_binary '\0','2025-09-12 11:16:28.028485',0,'시설 관리비','EXPENSE_CATEGORY','관리비','UTILITY',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(336,'2025-09-12 11:16:28.028997',NULL,_binary '\0','2025-09-12 11:16:28.028997',0,'사무용품 구매','EXPENSE_CATEGORY','사무용품','OFFICE_SUPPLIES',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(337,'2025-09-12 11:16:28.029456',NULL,_binary '\0','2025-09-12 11:16:28.029456',0,'각종 세금','EXPENSE_CATEGORY','세금','TAX',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(338,'2025-09-12 11:16:28.029896',NULL,_binary '\0','2025-09-12 11:16:28.029896',0,'마케팅 비용','EXPENSE_CATEGORY','마케팅','MARKETING',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(339,'2025-09-12 11:16:28.030322',NULL,_binary '\0','2025-09-12 11:16:28.030322',0,'장비 구매','EXPENSE_CATEGORY','장비','EQUIPMENT',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(340,'2025-09-12 11:16:28.030752',NULL,_binary '\0','2025-09-12 11:16:28.030752',0,'소프트웨어 라이선스','EXPENSE_CATEGORY','소프트웨어','SOFTWARE',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(341,'2025-09-12 11:16:28.031223',NULL,_binary '\0','2025-09-12 11:16:28.031223',0,'외부 컨설팅 비용','EXPENSE_CATEGORY','컨설팅','CONSULTING',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(342,'2025-09-12 11:16:28.031721',NULL,_binary '\0','2025-09-12 11:16:28.031721',0,'기타 지출 항목','EXPENSE_CATEGORY','기타잡비','OTHER',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(343,'2025-09-12 11:16:28.032707',NULL,_binary '\0','2025-09-12 11:16:28.032707',0,'개인 상담 서비스','INCOME_SUBCATEGORY','개인상담','INDIVIDUAL_CONSULTATION',NULL,_binary '','INCOME_CATEGORY','CONSULTATION',1,NULL,NULL,NULL),(344,'2025-09-12 11:16:28.033268',NULL,_binary '\0','2025-09-12 11:16:28.033268',0,'그룹 상담 서비스','INCOME_SUBCATEGORY','그룹상담','GROUP_CONSULTATION',NULL,_binary '','INCOME_CATEGORY','CONSULTATION',2,NULL,NULL,NULL),(345,'2025-09-12 11:16:28.033790',NULL,_binary '\0','2025-09-12 11:16:28.033790',0,'기본 상담 패키지','INCOME_SUBCATEGORY','기본패키지','BASIC_PACKAGE',NULL,_binary '','INCOME_CATEGORY','PACKAGE',3,NULL,NULL,NULL),(346,'2025-09-12 11:16:28.034241',NULL,_binary '\0','2025-09-12 11:16:28.034241',0,'프리미엄 상담 패키지','INCOME_SUBCATEGORY','프리미엄패키지','PREMIUM_PACKAGE',NULL,_binary '','INCOME_CATEGORY','PACKAGE',4,NULL,NULL,NULL),(347,'2025-09-12 11:16:28.034687',NULL,_binary '\0','2025-09-12 11:16:28.034687',0,'기타 수입 항목','INCOME_SUBCATEGORY','기타수입','OTHER_INCOME',NULL,_binary '','INCOME_CATEGORY','OTHER',5,NULL,NULL,NULL),(348,'2025-09-12 11:16:28.035613',NULL,_binary '\0','2025-09-12 11:16:28.035613',0,'상담사 급여','EXPENSE_SUBCATEGORY','상담사급여','CONSULTANT_SALARY',NULL,_binary '','EXPENSE_CATEGORY','SALARY',1,NULL,NULL,NULL),(349,'2025-09-12 11:16:28.036069',NULL,_binary '\0','2025-09-12 11:16:28.036069',0,'관리자 급여','EXPENSE_SUBCATEGORY','관리자급여','ADMIN_SALARY',NULL,_binary '','EXPENSE_CATEGORY','SALARY',2,NULL,NULL,NULL),(350,'2025-09-12 11:16:28.036504',NULL,_binary '\0','2025-09-12 11:16:28.036504',0,'사무실 임대료','EXPENSE_SUBCATEGORY','사무실임대료','OFFICE_RENT',NULL,_binary '','EXPENSE_CATEGORY','RENT',3,NULL,NULL,NULL),(351,'2025-09-12 11:16:28.036937',NULL,_binary '\0','2025-09-12 11:16:28.036937',0,'시설 관리비','EXPENSE_SUBCATEGORY','시설관리비','MAINTENANCE_FEE',NULL,_binary '','EXPENSE_CATEGORY','UTILITY',4,NULL,NULL,NULL),(352,'2025-09-12 11:16:28.037410',NULL,_binary '\0','2025-09-12 11:16:28.037410',0,'전기 요금','EXPENSE_SUBCATEGORY','전기요금','ELECTRICITY',NULL,_binary '','EXPENSE_CATEGORY','UTILITY',5,NULL,NULL,NULL),(353,'2025-09-12 11:16:28.037822',NULL,_binary '\0','2025-09-12 11:16:28.037822',0,'수도 요금','EXPENSE_SUBCATEGORY','수도요금','WATER',NULL,_binary '','EXPENSE_CATEGORY','UTILITY',6,NULL,NULL,NULL),(354,'2025-09-12 11:16:28.038253',NULL,_binary '\0','2025-09-12 11:16:28.038253',0,'사무용 문구류','EXPENSE_SUBCATEGORY','문구류','STATIONERY',NULL,_binary '','EXPENSE_CATEGORY','OFFICE_SUPPLIES',7,NULL,NULL,NULL),(355,'2025-09-12 11:16:28.038686',NULL,_binary '\0','2025-09-12 11:16:28.038686',0,'인쇄 관련 비용','EXPENSE_SUBCATEGORY','인쇄비','PRINTING',NULL,_binary '','EXPENSE_CATEGORY','OFFICE_SUPPLIES',8,NULL,NULL,NULL),(356,'2025-09-12 11:16:28.039132',NULL,_binary '\0','2025-09-12 11:16:28.039132',0,'소득세','EXPENSE_SUBCATEGORY','소득세','INCOME_TAX',NULL,_binary '','EXPENSE_CATEGORY','TAX',9,NULL,NULL,NULL),(357,'2025-09-12 11:16:28.039586',NULL,_binary '\0','2025-09-12 11:16:28.039586',0,'부가가치세','EXPENSE_SUBCATEGORY','부가가치세','VAT',NULL,_binary '','EXPENSE_CATEGORY','TAX',10,NULL,NULL,NULL),(358,'2025-09-12 11:16:28.040033',NULL,_binary '\0','2025-09-12 11:16:28.040033',0,'법인세','EXPENSE_SUBCATEGORY','법인세','CORPORATE_TAX',NULL,_binary '','EXPENSE_CATEGORY','TAX',11,NULL,NULL,NULL),(359,'2025-09-12 11:16:28.040474',NULL,_binary '\0','2025-09-12 11:16:28.040474',0,'온라인 광고비','EXPENSE_SUBCATEGORY','온라인광고','ONLINE_ADS',NULL,_binary '','EXPENSE_CATEGORY','MARKETING',12,NULL,NULL,NULL),(360,'2025-09-12 11:16:28.040909',NULL,_binary '\0','2025-09-12 11:16:28.040909',0,'오프라인 광고비','EXPENSE_SUBCATEGORY','오프라인광고','OFFLINE_ADS',NULL,_binary '','EXPENSE_CATEGORY','MARKETING',13,NULL,NULL,NULL),(361,'2025-09-12 11:16:28.041368',NULL,_binary '\0','2025-09-12 11:16:28.041368',0,'컴퓨터 장비','EXPENSE_SUBCATEGORY','컴퓨터장비','COMPUTER',NULL,_binary '','EXPENSE_CATEGORY','EQUIPMENT',14,NULL,NULL,NULL),(362,'2025-09-12 11:16:28.041826',NULL,_binary '\0','2025-09-12 11:16:28.041826',0,'사무용 가구','EXPENSE_SUBCATEGORY','가구','FURNITURE',NULL,_binary '','EXPENSE_CATEGORY','EQUIPMENT',15,NULL,NULL,NULL),(363,'2025-09-12 11:16:28.042826',NULL,_binary '\0','2025-09-12 11:16:28.042826',0,'소프트웨어 라이선스','EXPENSE_SUBCATEGORY','소프트웨어라이선스','LICENSE',NULL,_binary '','EXPENSE_CATEGORY','SOFTWARE',16,NULL,NULL,NULL),(364,'2025-09-12 11:16:28.043386',NULL,_binary '\0','2025-09-12 11:16:28.043386',0,'외부 컨설팅','EXPENSE_SUBCATEGORY','외부컨설팅','EXTERNAL_CONSULTING',NULL,_binary '','EXPENSE_CATEGORY','CONSULTING',17,NULL,NULL,NULL),(365,'2025-09-12 11:16:28.043909',NULL,_binary '\0','2025-09-12 11:16:28.043909',0,'기타 지출','EXPENSE_SUBCATEGORY','기타','OTHER_EXPENSE',NULL,_binary '','EXPENSE_CATEGORY','OTHER',18,NULL,NULL,NULL),(366,'2025-09-12 11:16:28.045018',NULL,_binary '\0','2025-09-12 11:16:28.045018',0,'부가세가 적용되는 항목','VAT_APPLICABLE','부가세 적용','APPLICABLE',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(367,'2025-09-12 11:16:28.045462',NULL,_binary '\0','2025-09-12 11:16:28.045462',0,'부가세가 적용되지 않는 항목 (급여 등)','VAT_APPLICABLE','부가세 미적용','NOT_APPLICABLE',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(368,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'주별 리포트 기간','REPORT_PERIOD','주별','WEEK',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(369,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'월별 리포트 기간','REPORT_PERIOD','월별','MONTH',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(370,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'분기별 리포트 기간','REPORT_PERIOD','분기별','QUARTER',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(371,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'년별 리포트 기간','REPORT_PERIOD','년별','YEAR',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(372,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2015년도','YEAR_RANGE','2015년','2015',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(373,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2016년도','YEAR_RANGE','2016년','2016',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(374,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2017년도','YEAR_RANGE','2017년','2017',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(375,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2018년도','YEAR_RANGE','2018년','2018',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(376,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2019년도','YEAR_RANGE','2019년','2019',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(377,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2020년도','YEAR_RANGE','2020년','2020',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(378,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2021년도','YEAR_RANGE','2021년','2021',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(379,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2022년도','YEAR_RANGE','2022년','2022',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(380,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2023년도','YEAR_RANGE','2023년','2023',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(381,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2024년도','YEAR_RANGE','2024년','2024',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(382,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2025년도','YEAR_RANGE','2025년','2025',NULL,_binary '',NULL,NULL,11,NULL,NULL,NULL),(383,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'1월','MONTH_RANGE','1월','1',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(384,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'2월','MONTH_RANGE','2월','2',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(385,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'3월','MONTH_RANGE','3월','3',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(386,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'4월','MONTH_RANGE','4월','4',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(387,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'5월','MONTH_RANGE','5월','5',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(388,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'6월','MONTH_RANGE','6월','6',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(389,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'7월','MONTH_RANGE','7월','7',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(390,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'8월','MONTH_RANGE','8월','8',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(391,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'9월','MONTH_RANGE','9월','9',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(392,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'10월','MONTH_RANGE','10월','10',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(393,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'11월','MONTH_RANGE','11월','11',NULL,_binary '',NULL,NULL,11,NULL,NULL,NULL),(394,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'12월','MONTH_RANGE','12월','12',NULL,_binary '',NULL,NULL,12,NULL,NULL,NULL),(395,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'오늘 날짜 범위','DATE_RANGE','오늘','TODAY',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(396,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'어제 날짜 범위','DATE_RANGE','어제','YESTERDAY',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(397,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'이번 주 날짜 범위','DATE_RANGE','이번 주','THIS_WEEK',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(398,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'지난 주 날짜 범위','DATE_RANGE','지난 주','LAST_WEEK',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(399,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'이번 달 날짜 범위','DATE_RANGE','이번 달','THIS_MONTH',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(400,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'지난 달 날짜 범위','DATE_RANGE','지난 달','LAST_MONTH',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(401,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'이번 분기 날짜 범위','DATE_RANGE','이번 분기','THIS_QUARTER',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(402,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'지난 분기 날짜 범위','DATE_RANGE','지난 분기','LAST_QUARTER',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(403,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'올해 날짜 범위','DATE_RANGE','올해','THIS_YEAR',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(404,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'작년 날짜 범위','DATE_RANGE','작년','LAST_YEAR',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(405,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'최근 30일 날짜 범위','DATE_RANGE','최근 30일','LAST_30_DAYS',NULL,_binary '',NULL,NULL,11,NULL,NULL,NULL),(406,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'최근 90일 날짜 범위','DATE_RANGE','최근 90일','LAST_90_DAYS',NULL,_binary '',NULL,NULL,12,NULL,NULL,NULL),(407,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'매핑이 존재하는 상태','MAPPING_STATUS','매핑 있음','HAS_MAPPING',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(408,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'활성화된 매핑 상태','MAPPING_STATUS','활성 매핑','ACTIVE_MAPPING',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(409,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'매핑이 없는 상태','MAPPING_STATUS','매핑 없음','NO_MAPPING',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(410,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'매핑 대기 중인 상태','MAPPING_STATUS','매핑 대기','PENDING_MAPPING',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(411,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'비활성화된 매핑 상태','MAPPING_STATUS','비활성 매핑','INACTIVE_MAPPING',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(412,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'온라인 상담 세션','CONSULTATION_SESSION','온라인','ONLINE',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(413,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'오프라인 상담 세션','CONSULTATION_SESSION','오프라인','OFFLINE',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(414,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'전화 상담 세션','CONSULTATION_SESSION','전화','PHONE',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(415,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'화상 상담 세션','CONSULTATION_SESSION','화상','VIDEO',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(416,'2025-09-12 13:24:03.000000',NULL,_binary '\0','2025-09-12 13:24:03.000000',0,'채팅 상담 세션','CONSULTATION_SESSION','채팅','CHAT',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(422,'2025-09-12 22:29:27.000000',NULL,_binary '\0','2025-09-12 22:29:27.000000',1,'지점 수퍼 관리자','ROLE','지점수퍼관리자','BRANCH_SUPER_ADMIN',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(423,'2025-09-12 22:29:27.000000',NULL,_binary '\0','2025-09-12 22:29:27.000000',1,'본사 관리자','ROLE','본사관리자','HQ_ADMIN',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(424,'2025-09-12 22:29:27.000000',NULL,_binary '\0','2025-09-12 22:29:27.000000',1,'본사 고급 관리자','ROLE','본사고급관리자','SUPER_HQ_ADMIN',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(425,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'ERD 메뉴 접근 권한','PERMISSION','ERD 접근','ACCESS_ERD',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(426,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'결제 메뉴 접근 권한','PERMISSION','결제 접근','ACCESS_PAYMENT',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(427,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'비품구매 요청 권한','PERMISSION','비품구매 요청','REQUEST_SUPPLY_PURCHASE',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(428,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'결제 요청 권한','PERMISSION','결제 요청','REQUEST_PAYMENT_APPROVAL',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(429,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'결제 승인 권한','PERMISSION','결제 승인','APPROVE_PAYMENT',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(430,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'스케줄러 등록 권한','PERMISSION','스케줄러 등록','REGISTER_SCHEDULER',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(431,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'스케줄러 상담사 조회 권한','PERMISSION','스케줄러 상담사 조회','VIEW_SCHEDULER_CONSULTANTS',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(432,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'지점 내역 조회 권한','PERMISSION','지점 내역 조회','VIEW_BRANCH_DETAILS',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(433,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'지점 관리 권한','PERMISSION','지점 관리','MANAGE_BRANCH',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(434,'2025-09-12 22:29:34.000000',NULL,_binary '\0','2025-09-12 22:29:34.000000',1,'시스템 관리 권한','PERMISSION','시스템 관리','MANAGE_SYSTEM',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(435,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'지점수퍼관리자의 ERD 접근 권한','ROLE_PERMISSION','지점수퍼관리자-ERD접근','BRANCH_SUPER_ADMIN-ACCESS_ERD',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(436,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'관리자의 결제 접근 권한','ROLE_PERMISSION','관리자-결제접근','ADMIN-ACCESS_PAYMENT',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(437,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'지점수퍼관리자의 결제 접근 권한','ROLE_PERMISSION','지점수퍼관리자-결제접근','BRANCH_SUPER_ADMIN-ACCESS_PAYMENT',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(438,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'상담사의 비품구매 요청 권한','ROLE_PERMISSION','상담사-비품구매요청','CONSULTANT-REQUEST_SUPPLY_PURCHASE',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(439,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'관리자의 결제 요청 권한','ROLE_PERMISSION','관리자-결제요청','ADMIN-REQUEST_PAYMENT_APPROVAL',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL),(440,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'지점수퍼관리자의 결제 승인 권한','ROLE_PERMISSION','지점수퍼관리자-결제승인','BRANCH_SUPER_ADMIN-APPROVE_PAYMENT',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(441,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'관리자의 스케줄러 등록 권한','ROLE_PERMISSION','관리자-스케줄러등록','ADMIN-REGISTER_SCHEDULER',NULL,_binary '',NULL,NULL,7,NULL,NULL,NULL),(442,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'지점수퍼관리자의 스케줄러 등록 권한','ROLE_PERMISSION','지점수퍼관리자-스케줄러등록','BRANCH_SUPER_ADMIN-REGISTER_SCHEDULER',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(443,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'관리자의 스케줄러 상담사 조회 권한','ROLE_PERMISSION','관리자-스케줄러상담사조회','ADMIN-VIEW_SCHEDULER_CONSULTANTS',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(444,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'지점수퍼관리자의 스케줄러 상담사 조회 권한','ROLE_PERMISSION','지점수퍼관리자-스케줄러상담사조회','BRANCH_SUPER_ADMIN-VIEW_SCHEDULER_CONSULTANTS',NULL,_binary '',NULL,NULL,10,NULL,NULL,NULL),(445,'2025-09-12 22:29:47.000000',NULL,_binary '\0','2025-09-12 22:29:47.000000',1,'본사총관리자의 지점 내역 조회 권한','ROLE_PERMISSION','본사총관리자-지점내역조회','HQ_MASTER-VIEW_BRANCH_DETAILS',NULL,_binary '',NULL,NULL,11,NULL,NULL,NULL),(457,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'브론즈 등급 클라이언트','USER_GRADE','브론즈','CLIENT_BRONZE',NULL,_binary '',NULL,NULL,1,'#cd7f32','🥉',NULL),(458,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'실버 등급 클라이언트','USER_GRADE','실버','CLIENT_SILVER',NULL,_binary '',NULL,NULL,2,'#c0c0c0','🥈',NULL),(459,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'골드 등급 클라이언트','USER_GRADE','골드','CLIENT_GOLD',NULL,_binary '',NULL,NULL,3,'#ffd700','🥇',NULL),(460,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'플래티넘 등급 클라이언트','USER_GRADE','플래티넘','CLIENT_PLATINUM',NULL,_binary '',NULL,NULL,4,'#e5e4e2','💎',NULL),(461,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'다이아몬드 등급 클라이언트','USER_GRADE','다이아몬드','CLIENT_DIAMOND',NULL,_binary '',NULL,NULL,5,'#b9f2ff','💠',NULL),(462,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'주니어 상담사','USER_GRADE','주니어','CONSULTANT_JUNIOR',NULL,_binary '',NULL,NULL,6,'#f59e0b','⭐',NULL),(463,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'시니어 상담사','USER_GRADE','시니어','CONSULTANT_SENIOR',NULL,_binary '',NULL,NULL,7,'#f59e0b','⭐⭐',NULL),(464,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'전문가 상담사','USER_GRADE','전문가','CONSULTANT_EXPERT',NULL,_binary '',NULL,NULL,8,'#f59e0b','⭐⭐⭐',NULL),(465,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'일반 관리자','USER_GRADE','관리자','ADMIN',NULL,_binary '',NULL,NULL,9,'#8b5cf6','👑',NULL),(466,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'지점 수퍼 관리자','USER_GRADE','수퍼관리자','BRANCH_SUPER_ADMIN',NULL,_binary '',NULL,NULL,10,'#8b5cf6','👑👑',NULL),(467,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'본사 관리자','USER_GRADE','본사 관리자','HQ_ADMIN',NULL,_binary '',NULL,NULL,11,'#3b82f6','🏢',NULL),(468,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'본사 수퍼 관리자','USER_GRADE','본사 수퍼 관리자','SUPER_HQ_ADMIN',NULL,_binary '',NULL,NULL,12,'#3b82f6','🏢👑',NULL),(469,'2025-09-14 15:24:19.000000',NULL,_binary '\0','2025-09-14 15:24:19.000000',0,'본사 총관리자','USER_GRADE','본사 총관리자','HQ_MASTER',NULL,_binary '',NULL,NULL,13,'#dc2626','��🏢',NULL),(480,'2025-09-14 15:54:00.000000',NULL,_binary '\0','2025-09-14 15:54:00.000000',0,'결제 대기 중인 매핑','MAPPING_STATUS','결제 대기','PENDING_PAYMENT',NULL,_binary '',NULL,NULL,1,'#ffc107','⏳',NULL),(481,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'결제가 요청되어 대기 중인 상태','PAYMENT_STATUS','결제 대기','PENDING','{\"icon\": \"bi-clock\", \"color\": \"warning\", \"priority\": 3}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(482,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'결제가 처리되고 있는 상태','PAYMENT_STATUS','결제 처리중','PROCESSING','{\"icon\": \"bi-arrow-repeat\", \"color\": \"info\", \"priority\": 2}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(483,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'결제가 성공적으로 승인된 상태','PAYMENT_STATUS','결제 승인','APPROVED','{\"icon\": \"bi-check-circle\", \"color\": \"success\", \"priority\": 1}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(484,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'결제 처리 중 오류가 발생한 상태','PAYMENT_STATUS','결제 실패','FAILED','{\"icon\": \"bi-x-circle\", \"color\": \"danger\", \"priority\": 4}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(485,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'결제가 취소된 상태','PAYMENT_STATUS','결제 취소','CANCELLED','{\"icon\": \"bi-dash-circle\", \"color\": \"secondary\", \"priority\": 5}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(486,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'결제 금액이 환불된 상태','PAYMENT_STATUS','환불 완료','REFUNDED','{\"icon\": \"bi-arrow-counterclockwise\", \"color\": \"primary\", \"priority\": 3}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(487,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'결제 시간이 만료된 상태','PAYMENT_STATUS','결제 만료','EXPIRED','{\"icon\": \"bi-clock-history\", \"color\": \"muted\", \"priority\": 5}',_binary '',NULL,NULL,7,NULL,NULL,NULL),(493,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'토스페이먼츠 결제 대행사','PAYMENT_PROVIDER','토스페이먼츠','TOSS','{\"icon\": \"bi-lightning\", \"color\": \"primary\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(494,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'아임포트 결제 대행사','PAYMENT_PROVIDER','아임포트','IAMPORT','{\"icon\": \"bi-credit-card-2-front\", \"color\": \"info\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(495,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'카카오페이 결제','PAYMENT_PROVIDER','카카오페이','KAKAO','{\"icon\": \"bi-chat-dots\", \"color\": \"warning\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(496,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'네이버페이 결제','PAYMENT_PROVIDER','네이버페이','NAVER','{\"icon\": \"bi-search\", \"color\": \"success\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(497,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'페이팔 결제','PAYMENT_PROVIDER','페이팔','PAYPAL','{\"icon\": \"bi-paypal\", \"color\": \"primary\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(498,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'이메일 알림','NOTIFICATION_TYPE','이메일','EMAIL','{\"icon\": \"bi-envelope\", \"color\": \"primary\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(499,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'SMS 문자 알림','NOTIFICATION_TYPE','SMS','SMS','{\"icon\": \"bi-chat-text\", \"color\": \"success\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(500,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'앱 푸시 알림','NOTIFICATION_TYPE','푸시 알림','PUSH','{\"icon\": \"bi-bell\", \"color\": \"warning\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(501,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'웹소켓 실시간 알림','NOTIFICATION_TYPE','실시간 알림','WEBSOCKET','{\"icon\": \"bi-broadcast\", \"color\": \"info\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(507,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'급여 관련 거래','FINANCIAL_CATEGORY','급여','SALARY','{\"icon\": \"bi-person-badge\", \"color\": \"primary\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(508,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'세금 관련 거래','FINANCIAL_CATEGORY','세금','TAX','{\"icon\": \"bi-calculator\", \"color\": \"warning\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(509,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'구매 관련 거래','FINANCIAL_CATEGORY','구매','PURCHASE','{\"icon\": \"bi-cart\", \"color\": \"info\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(510,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'예산 관련 거래','FINANCIAL_CATEGORY','예산','BUDGET','{\"icon\": \"bi-pie-chart\", \"color\": \"success\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(511,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'결제 관련 거래','FINANCIAL_CATEGORY','결제','PAYMENT','{\"icon\": \"bi-credit-card\", \"color\": \"primary\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(521,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'모든 역할에서 공통으로 사용하는 메뉴','MENU_CATEGORY','공통 메뉴','COMMON','{\"type\": \"common\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(522,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'관리자 전용 메뉴','MENU_CATEGORY','관리자 메뉴','ADMIN','{\"type\": \"admin\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(523,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 관리 메뉴','MENU_CATEGORY','시스템 메뉴','SYSTEM','{\"type\": \"system\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(524,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'일반 사용자 메뉴','MENU_CATEGORY','사용자 메뉴','USER','{\"type\": \"user\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(525,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'재무 관리 메뉴','MENU_CATEGORY','재무 메뉴','FINANCE','{\"type\": \"finance\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(526,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'ERP 시스템 메뉴','MENU_CATEGORY','ERP 메뉴','ERP','{\"type\": \"erp\"}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(527,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'메인 대시보드','COMMON_MENU','대시보드','DASHBOARD','{\"icon\": \"bi-house\", \"path\": \"/dashboard\", \"category\": \"COMMON\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(528,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'개인정보 관리','COMMON_MENU','마이페이지','MYPAGE','{\"icon\": \"bi-person\", \"path\": \"/mypage\", \"category\": \"COMMON\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(529,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'상담 이력 조회','COMMON_MENU','상담 내역','CONSULTATION_HISTORY','{\"icon\": \"bi-clock-history\", \"path\": \"/consultation-history\", \"category\": \"COMMON\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(530,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'상담 결과 리포트','COMMON_MENU','상담 리포트','CONSULTATION_REPORT','{\"icon\": \"bi-file-text\", \"path\": \"/consultation-report\", \"category\": \"COMMON\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(531,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'관리자 메인 기능','ADMIN_MENU','관리자 기능','ADMIN_MAIN','{\"icon\": \"bi-gear\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(532,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'사용자 관리 메인','ADMIN_MENU','사용자 관리','USERS_MAIN','{\"icon\": \"bi-people\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(533,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 관리 메인','ADMIN_MENU','시스템 관리','SYSTEM_MAIN','{\"icon\": \"bi-tools\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(534,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'관리자 전용 대시보드','ADMIN_MENU','관리자 대시보드','ADMIN_DASHBOARD','{\"icon\": \"bi-speedometer2\", \"path\": \"/admin/dashboard\", \"parent\": \"ADMIN_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,11,NULL,NULL,NULL),(535,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'관리자 통계','ADMIN_MENU','통계 보기','ADMIN_STATISTICS','{\"icon\": \"bi-graph-up\", \"path\": \"/admin/statistics\", \"parent\": \"ADMIN_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,12,NULL,NULL,NULL),(536,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'통계 전용 대시보드','ADMIN_MENU','통계 대시보드','ADMIN_STATISTICS_DASHBOARD','{\"icon\": \"bi-bar-chart\", \"path\": \"/admin/statistics-dashboard\", \"parent\": \"ADMIN_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,13,NULL,NULL,NULL),(537,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'모든 스케줄 관리','ADMIN_MENU','전체 스케줄','ADMIN_SCHEDULES','{\"icon\": \"bi-calendar-check\", \"path\": \"/admin/schedules\", \"parent\": \"ADMIN_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,14,NULL,NULL,NULL),(538,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'관리자 환경설정','ADMIN_MENU','관리자 설정','ADMIN_SETTINGS','{\"icon\": \"bi-gear-fill\", \"path\": \"/admin/settings\", \"parent\": \"ADMIN_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,15,NULL,NULL,NULL),(539,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'상담사 종합 관리','ADMIN_MENU','상담사 관리','ADMIN_CONSULTANTS','{\"icon\": \"bi-person-badge\", \"path\": \"/admin/consultant-comprehensive\", \"parent\": \"USERS_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,21,NULL,NULL,NULL),(540,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'내담자 종합 관리','ADMIN_MENU','내담자 관리','ADMIN_CLIENTS','{\"icon\": \"bi-person-check\", \"path\": \"/admin/client-comprehensive\", \"parent\": \"USERS_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,22,NULL,NULL,NULL),(541,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'사용자 계좌 관리','ADMIN_MENU','계좌 관리','ADMIN_ACCOUNTS','{\"icon\": \"bi-bank\", \"path\": \"/admin/accounts\", \"parent\": \"USERS_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,23,NULL,NULL,NULL),(542,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'사용자 매핑 관리','ADMIN_MENU','매핑 관리','ADMIN_MAPPING','{\"icon\": \"bi-link\", \"path\": \"/admin/mapping-management\", \"parent\": \"USERS_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,24,NULL,NULL,NULL),(543,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 공통코드 관리','ADMIN_MENU','공통코드 관리','ADMIN_CODES','{\"icon\": \"bi-code\", \"path\": \"/admin/common-codes\", \"parent\": \"SYSTEM_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,31,NULL,NULL,NULL),(544,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 관리 도구','ADMIN_MENU','시스템 도구','ADMIN_SYSTEM','{\"icon\": \"bi-tools\", \"path\": \"/admin/system\", \"parent\": \"SYSTEM_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,32,NULL,NULL,NULL),(545,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 로그 조회','ADMIN_MENU','시스템 로그','ADMIN_LOGS','{\"icon\": \"bi-file-text\", \"path\": \"/admin/logs\", \"parent\": \"SYSTEM_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,33,NULL,NULL,NULL),(546,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 통합 테스트','ADMIN_MENU','통합 테스트','ADMIN_INTEGRATION_TEST','{\"icon\": \"bi-check-circle\", \"path\": \"/test/integration\", \"parent\": \"SYSTEM_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,34,NULL,NULL,NULL),(547,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'본사 관리 메인','HQ_ADMIN_MENU','본사 관리','HQ_ADMIN_MAIN','{\"icon\": \"bi-building\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(548,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'사용자 관리 메인','HQ_ADMIN_MENU','사용자 관리','HQ_USERS_MAIN','{\"icon\": \"bi-people\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(549,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 관리 메인','HQ_ADMIN_MENU','시스템 관리','HQ_SYSTEM_MAIN','{\"icon\": \"bi-tools\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(550,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'지점 관리 메인','HQ_ADMIN_MENU','지점 관리','HQ_BRANCHES_MAIN','{\"icon\": \"bi-buildings\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(551,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'본사 전용 대시보드','HQ_ADMIN_MENU','본사 대시보드','HQ_DASHBOARD','{\"icon\": \"bi-speedometer2\", \"path\": \"/super_admin/dashboard\", \"parent\": \"HQ_ADMIN_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,11,NULL,NULL,NULL),(552,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'본사 통계','HQ_ADMIN_MENU','통계 보기','HQ_STATISTICS','{\"icon\": \"bi-graph-up\", \"path\": \"/admin/statistics\", \"parent\": \"HQ_ADMIN_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,12,NULL,NULL,NULL),(553,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'전체 스케줄 관리','HQ_ADMIN_MENU','전체 스케줄','HQ_SCHEDULES','{\"icon\": \"bi-calendar-check\", \"path\": \"/admin/schedules\", \"parent\": \"HQ_ADMIN_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,13,NULL,NULL,NULL),(554,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'상담사 종합 관리','HQ_ADMIN_MENU','상담사 관리','HQ_CONSULTANTS','{\"icon\": \"bi-person-badge\", \"path\": \"/admin/consultant-comprehensive\", \"parent\": \"HQ_USERS_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,21,NULL,NULL,NULL),(555,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'내담자 종합 관리','HQ_ADMIN_MENU','내담자 관리','HQ_CLIENTS','{\"icon\": \"bi-person-check\", \"path\": \"/admin/client-comprehensive\", \"parent\": \"HQ_USERS_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,22,NULL,NULL,NULL),(556,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'사용자 계좌 관리','HQ_ADMIN_MENU','계좌 관리','HQ_ACCOUNTS','{\"icon\": \"bi-bank\", \"path\": \"/admin/accounts\", \"parent\": \"HQ_USERS_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,23,NULL,NULL,NULL),(557,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 공통코드 관리','HQ_ADMIN_MENU','공통코드 관리','HQ_CODES','{\"icon\": \"bi-code\", \"path\": \"/admin/common-codes\", \"parent\": \"HQ_SYSTEM_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,31,NULL,NULL,NULL),(558,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 관리 도구','HQ_ADMIN_MENU','시스템 도구','HQ_SYSTEM','{\"icon\": \"bi-tools\", \"path\": \"/admin/system\", \"parent\": \"HQ_SYSTEM_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,32,NULL,NULL,NULL),(559,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'시스템 로그 조회','HQ_ADMIN_MENU','시스템 로그','HQ_LOGS','{\"icon\": \"bi-file-text\", \"path\": \"/admin/logs\", \"parent\": \"HQ_SYSTEM_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,33,NULL,NULL,NULL),(560,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'지점 목록 조회','HQ_ADMIN_MENU','지점 목록','HQ_BRANCH_LIST','{\"icon\": \"bi-list\", \"path\": \"/admin/branches\", \"parent\": \"HQ_BRANCHES_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,41,NULL,NULL,NULL),(561,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'새 지점 등록','HQ_ADMIN_MENU','지점 등록','HQ_BRANCH_CREATE','{\"icon\": \"bi-plus-circle\", \"path\": \"/admin/branches/create\", \"parent\": \"HQ_BRANCHES_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,42,NULL,NULL,NULL),(562,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'지점장 관리','HQ_ADMIN_MENU','지점장 관리','HQ_BRANCH_MANAGERS','{\"icon\": \"bi-person-badge\", \"path\": \"/admin/branch-managers\", \"parent\": \"HQ_BRANCHES_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,43,NULL,NULL,NULL),(563,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'상담사 전용 기능','CONSULTANT_MENU','상담사 기능','CONSULTANT_MAIN','{\"icon\": \"bi-person-heart\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(564,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'상담 일정 관리','CONSULTANT_MENU','상담 스케줄','CONSULTANT_SCHEDULE','{\"icon\": \"bi-calendar\", \"path\": \"/consultant/schedule\", \"parent\": \"CONSULTANT_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,11,NULL,NULL,NULL),(565,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'담당 내담자 관리','CONSULTANT_MENU','내담자 관리','CONSULTANT_CLIENTS','{\"icon\": \"bi-people\", \"path\": \"/consultant/clients\", \"parent\": \"CONSULTANT_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,12,NULL,NULL,NULL),(566,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'상담 기록 작성','CONSULTANT_MENU','상담 기록','CONSULTANT_REPORTS','{\"icon\": \"bi-file-text\", \"path\": \"/consultant/reports\", \"parent\": \"CONSULTANT_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,13,NULL,NULL,NULL),(567,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'내담자와의 메시지','CONSULTANT_MENU','메시지','CONSULTANT_MESSAGES','{\"icon\": \"bi-chat-dots\", \"path\": \"/consultant/messages\", \"parent\": \"CONSULTANT_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,14,NULL,NULL,NULL),(568,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'내담자 전용 기능','CLIENT_MENU','내담자 기능','CLIENT_MAIN','{\"icon\": \"bi-person\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(569,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 21:49:18.000000',1,'상담 예약 및 관리','CLIENT_MENU','상담 예약','CLIENT_CONSULTATION','{\"icon\": \"bi-calendar-plus\", \"path\": \"/client/consultation\", \"parent\": \"CLIENT_MAIN\", \"type\": \"sub\"}',_binary '\0',NULL,NULL,11,NULL,NULL,NULL),(570,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 21:49:18.000000',1,'나의 상담 내역','CLIENT_MENU','상담 내역','CLIENT_HISTORY','{\"icon\": \"bi-clock-history\", \"path\": \"/consultation-history\", \"type\": \"sub\", \"parent\": \"CLIENT_MAIN\"}',_binary '',NULL,NULL,12,NULL,NULL,NULL),(571,'2025-09-14 18:42:55.000000',NULL,_binary '\0','2025-09-14 18:42:55.000000',1,'개인 설정','CLIENT_MENU','설정','CLIENT_SETTINGS','{\"icon\": \"bi-gear\", \"path\": \"/client/settings\", \"parent\": \"CLIENT_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,13,NULL,NULL,NULL),(578,'2025-09-14 19:03:22.000000',NULL,_binary '\0','2025-09-14 19:03:22.000000',1,'ERP 관련 기능들 (본점 수퍼어드민 전용)','BRANCH_SUPER_ADMIN_MENU','ERP 관리','ERP_MAIN','{\"icon\": \"bi-building\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,10,NULL,NULL,NULL),(579,'2025-09-14 19:03:22.000000',NULL,_binary '\0','2025-09-14 19:03:22.000000',1,'ERP 종합 대시보드','BRANCH_SUPER_ADMIN_MENU','ERP 대시보드','ERP_DASHBOARD','{\"icon\": \"bi-graph-up-arrow\", \"path\": \"/admin/erp/dashboard\", \"parent\": \"ERP_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,11,NULL,NULL,NULL),(580,'2025-09-14 19:03:22.000000',NULL,_binary '\0','2025-09-14 19:03:22.000000',1,'구매 요청 및 승인 관리','BRANCH_SUPER_ADMIN_MENU','구매 관리','ERP_PURCHASE','{\"icon\": \"bi-cart\", \"path\": \"/admin/erp/purchase\", \"parent\": \"ERP_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,12,NULL,NULL,NULL),(581,'2025-09-14 19:03:22.000000',NULL,_binary '\0','2025-09-14 19:03:22.000000',1,'예산 계획 및 실행 관리','BRANCH_SUPER_ADMIN_MENU','예산 관리','ERP_BUDGET','{\"icon\": \"bi-calculator\", \"path\": \"/admin/erp/budget\", \"parent\": \"ERP_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,13,NULL,NULL,NULL),(582,'2025-09-14 19:03:22.000000',NULL,_binary '\0','2025-09-14 19:03:22.000000',1,'재무 거래 및 회계 관리','BRANCH_SUPER_ADMIN_MENU','재무 관리','ERP_FINANCIAL','{\"icon\": \"bi-currency-dollar\", \"path\": \"/admin/erp/financial\", \"parent\": \"ERP_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,14,NULL,NULL,NULL),(583,'2025-09-14 19:03:22.000000',NULL,_binary '\0','2025-09-14 19:03:22.000000',1,'ERP 관련 각종 보고서','BRANCH_SUPER_ADMIN_MENU','ERP 보고서','ERP_REPORTS','{\"icon\": \"bi-file-earmark-bar-graph\", \"path\": \"/admin/erp/reports\", \"parent\": \"ERP_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,15,NULL,NULL,NULL),(584,'2025-09-14 21:51:59.000000',NULL,_binary '\0','2025-09-14 21:51:59.000000',1,'상담사로부터 받은 메시지 확인','CLIENT_MENU','상담사 메시지','CLIENT_MESSAGES','{\"icon\": \"bi-chat-dots\", \"path\": \"/client/messages\", \"parent\": \"CLIENT_MAIN\", \"type\": \"sub\"}',_binary '',NULL,NULL,14,NULL,NULL,NULL),(585,'2025-09-15 08:52:03.000000',NULL,_binary '\0','2025-09-15 08:52:03.000000',0,'ERP 시스템 관리 메뉴','MENU','ERP 관리','ERP_MAIN','{\"icon\": \"bi-gear\", \"path\": \"/erp\", \"type\": \"main\", \"hasSubMenu\": true}',_binary '',NULL,NULL,50,NULL,NULL,NULL),(586,'2025-09-15 08:52:03.000000',NULL,_binary '\0','2025-09-15 08:52:03.000000',0,'비품 구매 요청 및 주문 관리','MENU','구매 관리','ERP_PURCHASE','{\"icon\": \"bi-cart-check\", \"path\": \"/erp/purchase\", \"type\": \"sub\", \"parent\": \"ERP_MAIN\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(587,'2025-09-15 08:52:03.000000',NULL,_binary '\0','2025-09-15 08:52:03.000000',0,'재무 거래 및 회계 관리','MENU','재무 관리','ERP_FINANCIAL','{\"icon\": \"bi-graph-up\", \"path\": \"/erp/financial\", \"type\": \"sub\", \"parent\": \"ERP_MAIN\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(588,'2025-09-15 08:52:03.000000',NULL,_binary '\0','2025-09-15 08:52:03.000000',0,'예산 계획 및 관리','MENU','예산 관리','ERP_BUDGET','{\"icon\": \"bi-piggy-bank\", \"path\": \"/erp/budget\", \"type\": \"sub\", \"parent\": \"ERP_MAIN\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(589,'2025-09-15 08:52:03.000000',NULL,_binary '\0','2025-09-15 08:52:03.000000',0,'재고 현황 및 관리','MENU','재고 관리','ERP_INVENTORY','{\"icon\": \"bi-box\", \"path\": \"/erp/inventory\", \"type\": \"sub\", \"parent\": \"ERP_MAIN\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(590,'2025-09-15 08:53:29.000000',NULL,_binary '\0','2025-09-15 08:53:29.000000',0,'ERP 시스템 전체 접근 권한','PERMISSION','ERP 접근','ERP_ACCESS','{\"description\": \"ERP 시스템에 접근할 수 있는 권한\", \"level\": \"system\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(591,'2025-09-15 08:53:29.000000',NULL,_binary '\0','2025-09-15 08:53:29.000000',0,'구매 관리 페이지 조회 권한','PERMISSION','구매 관리 조회','ERP_PURCHASE_VIEW','{\"description\": \"구매 관리 페이지를 조회할 수 있는 권한\", \"level\": \"page\", \"parent\": \"ERP_ACCESS\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(592,'2025-09-15 08:53:29.000000',NULL,_binary '\0','2025-09-15 08:53:29.000000',0,'구매 관리 데이터 편집 권한','PERMISSION','구매 관리 편집','ERP_PURCHASE_EDIT','{\"description\": \"구매 요청 및 주문을 편집할 수 있는 권한\", \"level\": \"data\", \"parent\": \"ERP_ACCESS\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(593,'2025-09-15 08:53:29.000000',NULL,_binary '\0','2025-09-15 08:53:29.000000',0,'재무 관리 페이지 조회 권한','PERMISSION','재무 관리 조회','ERP_FINANCIAL_VIEW','{\"description\": \"재무 관리 페이지를 조회할 수 있는 권한\", \"level\": \"page\", \"parent\": \"ERP_ACCESS\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(594,'2025-09-15 08:53:29.000000',NULL,_binary '\0','2025-09-15 08:53:29.000000',0,'재무 거래 데이터 편집 권한','PERMISSION','재무 관리 편집','ERP_FINANCIAL_EDIT','{\"description\": \"재무 거래를 편집할 수 있는 권한\", \"level\": \"data\", \"parent\": \"ERP_ACCESS\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(595,'2025-09-15 08:53:29.000000',NULL,_binary '\0','2025-09-15 08:53:29.000000',0,'예산 관리 페이지 조회 권한','PERMISSION','예산 관리 조회','ERP_BUDGET_VIEW','{\"description\": \"예산 관리 페이지를 조회할 수 있는 권한\", \"level\": \"page\", \"parent\": \"ERP_ACCESS\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(596,'2025-09-15 08:53:29.000000',NULL,_binary '\0','2025-09-15 08:53:29.000000',0,'예산 데이터 편집 권한','PERMISSION','예산 관리 편집','ERP_BUDGET_EDIT','{\"description\": \"예산을 편집할 수 있는 권한\", \"level\": \"data\", \"parent\": \"ERP_ACCESS\"}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(597,'2025-09-15 08:53:29.000000',NULL,_binary '\0','2025-09-15 08:53:29.000000',0,'재고 관리 페이지 조회 권한','PERMISSION','재고 관리 조회','ERP_INVENTORY_VIEW','{\"description\": \"재고 관리 페이지를 조회할 수 있는 권한\", \"level\": \"page\", \"parent\": \"ERP_ACCESS\"}',_binary '',NULL,NULL,7,NULL,NULL,NULL),(598,'2025-09-15 08:53:29.000000',NULL,_binary '\0','2025-09-15 08:53:29.000000',0,'재고 데이터 편집 권한','PERMISSION','재고 관리 편집','ERP_INVENTORY_EDIT','{\"description\": \"재고를 편집할 수 있는 권한\", \"level\": \"data\", \"parent\": \"ERP_ACCESS\"}',_binary '',NULL,NULL,8,NULL,NULL,NULL),(599,'2025-09-15 08:53:41.000000',NULL,_binary '\0','2025-09-15 08:53:41.000000',0,'HQ_MASTER의 ERP 전체 접근 권한','ROLE_PERMISSION','HQ_MASTER ERP 접근','HQ_MASTER_ERP_ACCESS','{\"role\": \"HQ_MASTER\", \"permission\": \"ERP_ACCESS\", \"level\": \"full\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(600,'2025-09-15 08:53:41.000000',NULL,_binary '\0','2025-09-15 08:53:41.000000',0,'HQ_MASTER의 구매 관리 권한','ROLE_PERMISSION','HQ_MASTER 구매 관리','HQ_MASTER_ERP_PURCHASE','{\"role\": \"HQ_MASTER\", \"permission\": \"ERP_PURCHASE_VIEW,ERP_PURCHASE_EDIT\", \"level\": \"full\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(601,'2025-09-15 08:53:41.000000',NULL,_binary '\0','2025-09-15 08:53:41.000000',0,'HQ_MASTER의 재무 관리 권한','ROLE_PERMISSION','HQ_MASTER 재무 관리','HQ_MASTER_ERP_FINANCIAL','{\"role\": \"HQ_MASTER\", \"permission\": \"ERP_FINANCIAL_VIEW,ERP_FINANCIAL_EDIT\", \"level\": \"full\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(602,'2025-09-15 08:53:41.000000',NULL,_binary '\0','2025-09-15 08:53:41.000000',0,'HQ_MASTER의 예산 관리 권한','ROLE_PERMISSION','HQ_MASTER 예산 관리','HQ_MASTER_ERP_BUDGET','{\"role\": \"HQ_MASTER\", \"permission\": \"ERP_BUDGET_VIEW,ERP_BUDGET_EDIT\", \"level\": \"full\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(603,'2025-09-15 08:53:41.000000',NULL,_binary '\0','2025-09-15 08:53:41.000000',0,'HQ_MASTER의 재고 관리 권한','ROLE_PERMISSION','HQ_MASTER 재고 관리','HQ_MASTER_ERP_INVENTORY','{\"role\": \"HQ_MASTER\", \"permission\": \"ERP_INVENTORY_VIEW,ERP_INVENTORY_EDIT\", \"level\": \"full\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(604,'2025-09-15 08:53:41.000000',NULL,_binary '\0','2025-09-15 08:53:41.000000',0,'BRANCH_SUPER_ADMIN의 구매 관리 권한','ROLE_PERMISSION','BRANCH_SUPER_ADMIN 구매 관리','BRANCH_SUPER_ADMIN_ERP_PURCHASE','{\"role\": \"BRANCH_SUPER_ADMIN\", \"permission\": \"ERP_PURCHASE_VIEW,ERP_PURCHASE_EDIT\", \"level\": \"limited\"}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(605,'2025-09-15 08:53:41.000000',NULL,_binary '\0','2025-09-15 08:53:41.000000',0,'BRANCH_SUPER_ADMIN의 재무 관리 권한','ROLE_PERMISSION','BRANCH_SUPER_ADMIN 재무 관리','BRANCH_SUPER_ADMIN_ERP_FINANCIAL','{\"role\": \"BRANCH_SUPER_ADMIN\", \"permission\": \"ERP_FINANCIAL_VIEW,ERP_FINANCIAL_EDIT\", \"level\": \"limited\"}',_binary '',NULL,NULL,7,NULL,NULL,NULL),(606,'2025-09-15 08:53:41.000000',NULL,_binary '\0','2025-09-15 08:53:41.000000',0,'BRANCH_ADMIN의 구매 관리 조회 권한','ROLE_PERMISSION','BRANCH_ADMIN 구매 관리','BRANCH_ADMIN_ERP_PURCHASE','{\"role\": \"BRANCH_ADMIN\", \"permission\": \"ERP_PURCHASE_VIEW\", \"level\": \"readonly\"}',_binary '',NULL,NULL,8,NULL,NULL,NULL),(607,'2025-09-15 08:59:25.000000',NULL,_binary '\0','2025-09-15 08:59:25.000000',0,'일반적인 운영 비용','BUDGET_CATEGORY','운영비','OPERATING','{\"description\": \"사무용품, 전화비, 인터넷비 등 운영에 필요한 비용\", \"color\": \"#007bff\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(608,'2025-09-15 08:59:25.000000',NULL,_binary '\0','2025-09-15 08:59:25.000000',0,'마케팅 및 홍보 비용','BUDGET_CATEGORY','마케팅','MARKETING','{\"description\": \"광고비, 홍보물 제작비, 이벤트 비용 등\", \"color\": \"#28a745\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(609,'2025-09-15 08:59:25.000000',NULL,_binary '\0','2025-09-15 08:59:25.000000',0,'직원 교육 및 훈련 비용','BUDGET_CATEGORY','교육훈련','TRAINING','{\"description\": \"교육비, 세미나 참가비, 자격증 취득비 등\", \"color\": \"#ffc107\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(610,'2025-09-15 08:59:25.000000',NULL,_binary '\0','2025-09-15 08:59:25.000000',0,'장비 구매 및 유지보수 비용','BUDGET_CATEGORY','장비','EQUIPMENT','{\"description\": \"컴퓨터, 사무용품, 장비 구매 및 수리비\", \"color\": \"#dc3545\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(611,'2025-09-15 08:59:25.000000',NULL,_binary '\0','2025-09-15 08:59:25.000000',0,'출장 및 교통비','BUDGET_CATEGORY','출장비','TRAVEL','{\"description\": \"출장비, 교통비, 숙박비 등\", \"color\": \"#6f42c1\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(612,'2025-09-15 08:59:25.000000',NULL,_binary '\0','2025-09-15 08:59:25.000000',0,'전기, 가스, 수도 등 공과금','BUDGET_CATEGORY','공과금','UTILITIES','{\"description\": \"전기료, 가스료, 수도료, 관리비 등\", \"color\": \"#17a2b8\"}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(613,'2025-09-15 08:59:25.000000',NULL,_binary '\0','2025-09-15 08:59:25.000000',0,'사무실 및 시설 임대료','BUDGET_CATEGORY','임대료','RENT','{\"description\": \"사무실 임대료, 시설 사용료 등\", \"color\": \"#fd7e14\"}',_binary '',NULL,NULL,7,NULL,NULL,NULL),(614,'2025-09-15 08:59:25.000000',NULL,_binary '\0','2025-09-15 08:59:25.000000',0,'기타 비용','BUDGET_CATEGORY','기타','OTHER','{\"description\": \"분류되지 않은 기타 비용\", \"color\": \"#6c757d\"}',_binary '',NULL,NULL,8,NULL,NULL,NULL),(615,'2025-09-15 09:03:25.000000',NULL,_binary '\0','2025-09-15 09:03:25.000000',0,'부가가치세 관련 세금','TAX_CATEGORY','부가가치세','VAT','{\"description\": \"부가가치세 계산 및 신고\", \"taxRate\": 10, \"color\": \"#007bff\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(616,'2025-09-15 09:03:25.000000',NULL,_binary '\0','2025-09-15 09:03:25.000000',0,'소득세 관련 세금','TAX_CATEGORY','소득세','INCOME_TAX','{\"description\": \"소득세 계산 및 신고\", \"taxRate\": 6, \"color\": \"#28a745\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(617,'2025-09-15 09:03:25.000000',NULL,_binary '\0','2025-09-15 09:03:25.000000',0,'법인세 관련 세금','TAX_CATEGORY','법인세','CORPORATE_TAX','{\"description\": \"법인세 계산 및 신고\", \"taxRate\": 20, \"color\": \"#ffc107\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(618,'2025-09-15 09:03:25.000000',NULL,_binary '\0','2025-09-15 09:03:25.000000',0,'지방세 관련 세금','TAX_CATEGORY','지방세','LOCAL_TAX','{\"description\": \"지방소득세, 지방소비세 등\", \"taxRate\": 0.1, \"color\": \"#dc3545\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(619,'2025-09-15 09:03:25.000000',NULL,_binary '\0','2025-09-15 09:03:25.000000',0,'건강보험료 관련','TAX_CATEGORY','건강보험료','HEALTH_INSURANCE','{\"description\": \"건강보험료 계산 및 납부\", \"taxRate\": 3.545, \"color\": \"#6f42c1\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(620,'2025-09-15 09:03:25.000000',NULL,_binary '\0','2025-09-15 09:03:25.000000',0,'국민연금 관련','TAX_CATEGORY','국민연금','PENSION','{\"description\": \"국민연금 계산 및 납부\", \"taxRate\": 4.5, \"color\": \"#17a2b8\"}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(621,'2025-09-15 09:03:25.000000',NULL,_binary '\0','2025-09-15 09:03:25.000000',0,'고용보험료 관련','TAX_CATEGORY','고용보험료','EMPLOYMENT_INSURANCE','{\"description\": \"고용보험료 계산 및 납부\", \"taxRate\": 0.9, \"color\": \"#fd7e14\"}',_binary '',NULL,NULL,7,NULL,NULL,NULL),(622,'2025-09-15 09:03:25.000000',NULL,_binary '\0','2025-09-15 09:03:25.000000',0,'산재보험료 관련','TAX_CATEGORY','산재보험료','WORKERS_COMPENSATION','{\"description\": \"산업재해보상보험료 계산 및 납부\", \"taxRate\": 0.7, \"color\": \"#6c757d\"}',_binary '',NULL,NULL,8,NULL,NULL,NULL),(623,'2025-09-15 09:03:25.000000',NULL,_binary '\0','2025-09-15 09:03:25.000000',0,'기타 세금 및 수수료','TAX_CATEGORY','기타 세금','OTHER_TAX','{\"description\": \"기타 세금 및 수수료\", \"taxRate\": 0, \"color\": \"#6c757d\"}',_binary '',NULL,NULL,9,NULL,NULL,NULL),(624,'2025-09-15 09:14:03.000000',NULL,_binary '\0','2025-09-15 09:14:03.000000',0,'2024년 1월 부가가치세 계산','TAX_CALCULATION','부가가치세 2024-01','VAT_2024_001','{\"baseAmount\": 5000000, \"taxRate\": 10, \"taxAmount\": 500000, \"dueDate\": \"2024-02-25\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(625,'2025-09-15 09:14:03.000000',NULL,_binary '\0','2025-09-15 09:14:03.000000',0,'2024년 1월 소득세 계산','TAX_CALCULATION','소득세 2024-01','INCOME_TAX_2024_001','{\"baseAmount\": 45000000, \"taxRate\": 15, \"taxAmount\": 6750000, \"dueDate\": \"2024-03-10\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(626,'2025-09-15 09:14:03.000000',NULL,_binary '\0','2025-09-15 09:14:03.000000',0,'2024년 1월 법인세 계산','TAX_CALCULATION','법인세 2024-01','CORPORATE_TAX_2024_001','{\"baseAmount\": 10000000, \"taxRate\": 20, \"taxAmount\": 2000000, \"dueDate\": \"2024-03-31\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(627,'2025-09-15 09:18:18.000000',NULL,_binary '\0','2025-09-15 09:18:18.000000',0,'세무 관리 메뉴','MENU','세무 관리','ERP_TAX','{\"icon\": \"bi-calculator\", \"path\": \"/erp/tax\", \"type\": \"sub\", \"parent\": \"ERP_MAIN\"}',_binary '',NULL,NULL,55,NULL,NULL,NULL),(632,'2025-09-15 10:31:33.005690',NULL,_binary '\0','2025-09-15 10:52:22.936885',1,'200000','CONSULTATION_PACKAGE','기본 패키지','BASIC','{\"sessions\": 20}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(633,'2025-09-15 10:31:36.159724',NULL,_binary '\0','2025-09-15 10:52:26.774606',1,'400000','CONSULTATION_PACKAGE','표준 패키지','STANDARD','{\"sessions\": 20}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(634,'2025-09-15 10:31:39.245227',NULL,_binary '\0','2025-09-15 10:52:31.105102',1,'600000','CONSULTATION_PACKAGE','프리미엄 패키지','PREMIUM','{\"sessions\": 20}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(635,'2025-09-15 10:31:42.189048',NULL,_binary '\0','2025-09-15 10:52:35.082634',1,'1000000','CONSULTATION_PACKAGE','VIP 패키지','VIP','{\"sessions\": 20}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(636,'2025-09-15 10:34:43.866144',NULL,_binary '\0','2025-09-15 10:34:43.866144',0,'승인된 상태','STATUS','승인됨','APPROVED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(637,'2025-09-15 10:34:47.050864',NULL,_binary '\0','2025-09-15 10:34:47.050864',0,'거부된 상태','STATUS','거부됨','REJECTED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(638,'2025-09-15 10:34:50.051199',NULL,_binary '\0','2025-09-15 10:34:50.051199',0,'결제가 확인된 상태','STATUS','결제확인','PAYMENT_CONFIRMED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(639,'2025-09-15 10:34:53.022412',NULL,_binary '\0','2025-09-15 10:34:53.022412',0,'결제 대기 중인 상태','STATUS','결제대기','PAYMENT_PENDING',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(640,'2025-09-15 10:34:56.176040',NULL,_binary '\0','2025-09-15 10:34:56.176040',0,'결제가 거부된 상태','STATUS','결제거부','PAYMENT_REJECTED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(641,'2025-09-15 10:35:00.146386',NULL,_binary '\0','2025-09-15 10:35:00.146386',0,'종료된 상태','STATUS','종료됨','TERMINATED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(642,'2025-09-15 10:35:11.345071',NULL,_binary '\0','2025-09-15 10:35:11.345071',0,'요청된 상태','STATUS','요청됨','REQUESTED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(643,'2025-09-15 10:35:14.832625',NULL,_binary '\0','2025-09-15 10:35:14.832625',0,'예약된 상태','STATUS','예약됨','BOOKED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(644,'2025-09-15 10:35:18.310281',NULL,_binary '\0','2025-09-15 10:35:18.310281',0,'진행 중인 상태','STATUS','진행중','IN_PROGRESS',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(645,'2025-09-15 10:35:21.642885',NULL,_binary '\0','2025-09-15 10:35:21.642885',0,'취소된 상태','STATUS','취소됨','CANCELLED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(646,'2025-09-15 10:35:25.170026',NULL,_binary '\0','2025-09-15 10:35:25.170026',0,'무단결석 상태','STATUS','무단결석','NO_SHOW',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(647,'2025-09-15 10:35:28.361931',NULL,_binary '\0','2025-09-15 10:35:28.361931',0,'재예약된 상태','STATUS','재예약','RESCHEDULED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(648,'2025-09-15 10:35:39.523239',NULL,_binary '\0','2025-09-15 10:35:39.523239',0,'사용 가능한 상태','STATUS','가능','AVAILABLE',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(649,'2025-09-15 10:35:43.936382',NULL,_binary '\0','2025-09-15 10:35:43.936382',0,'확인된 상태','STATUS','확인됨','CONFIRMED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(650,'2025-09-15 10:35:47.454965',NULL,_binary '\0','2025-09-15 10:35:47.454965',0,'대기 중인 상태','STATUS','대기중','WAITING',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(651,'2025-09-15 10:35:51.018794',NULL,_binary '\0','2025-09-15 10:35:51.018794',0,'만료된 상태','STATUS','만료됨','EXPIRED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(652,'2025-09-15 10:35:54.529074',NULL,_binary '\0','2025-09-15 10:35:54.529074',0,'차단된 상태','STATUS','차단됨','BLOCKED',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(653,'2025-09-15 10:35:58.381393',NULL,_binary '\0','2025-09-15 10:35:58.381393',0,'점검 중인 상태','STATUS','점검중','MAINTENANCE',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(654,'2025-09-15 10:40:51.997122',NULL,_binary '\0','2025-09-15 10:40:51.997122',0,'최소 우선순위','PRIORITY','최소','MINIMAL',NULL,_binary '',NULL,NULL,6,NULL,NULL,NULL),(655,'2025-09-15 10:42:27.644959',NULL,_binary '\0','2025-09-15 10:42:27.644959',0,'아임포트 결제','PAYMENT_METHOD','아임포트','IAMPORT',NULL,_binary '',NULL,NULL,11,NULL,NULL,NULL),(656,'2025-09-15 10:42:30.906204',NULL,_binary '\0','2025-09-15 10:42:30.906204',0,'스트라이프 결제','PAYMENT_METHOD','스트라이프','STRIPE',NULL,_binary '',NULL,NULL,12,NULL,NULL,NULL),(657,'2025-09-15 10:42:34.076510',NULL,_binary '\0','2025-09-15 10:42:34.076510',0,'스퀘어 결제','PAYMENT_METHOD','스퀘어','SQUARE',NULL,_binary '',NULL,NULL,13,NULL,NULL,NULL),(658,'2025-09-15 10:45:25.161145',NULL,_binary '\0','2025-09-15 10:45:25.161145',0,'본사 최고 관리자','ROLE','본사최고관리자','HQ_SUPER_ADMIN',NULL,_binary '',NULL,NULL,8,NULL,NULL,NULL),(659,'2025-09-15 10:45:29.033425',NULL,_binary '\0','2025-09-15 10:45:29.033425',0,'지점장','ROLE','지점장','BRANCH_MANAGER',NULL,_binary '',NULL,NULL,9,NULL,NULL,NULL),(660,'2025-09-16 10:44:41.000000',NULL,_binary '\0','2025-09-16 10:44:41.000000',0,'4.2','SATISFACTION','í‰ê·  ë§Œì¡±ë„','AVERAGE','{\"value\": 4.2, \"scale\": 5}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(661,'2025-09-16 10:44:41.000000',NULL,_binary '\0','2025-09-16 10:44:41.000000',0,'150','SATISFACTION','ì´ ì‘ë‹µ ìˆ˜','TOTAL_RESPONSES','{\"count\": 150}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(662,'2025-09-16 10:44:41.000000',NULL,_binary '\0','2025-09-16 10:44:41.000000',0,'45','SATISFACTION','5ì ','SCORE_5','{\"score\": 5, \"count\": 45}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(663,'2025-09-16 10:44:41.000000',NULL,_binary '\0','2025-09-16 10:44:41.000000',0,'60','SATISFACTION','4ì ','SCORE_4','{\"score\": 4, \"count\": 60}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(664,'2025-09-16 10:44:41.000000',NULL,_binary '\0','2025-09-16 10:44:41.000000',0,'30','SATISFACTION','3ì ','SCORE_3','{\"score\": 3, \"count\": 30}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(665,'2025-09-16 10:44:41.000000',NULL,_binary '\0','2025-09-16 10:44:41.000000',0,'10','SATISFACTION','2ì ','SCORE_2','{\"score\": 2, \"count\": 10}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(666,'2025-09-16 10:44:41.000000',NULL,_binary '\0','2025-09-16 10:44:41.000000',0,'5','SATISFACTION','1ì ','SCORE_1','{\"score\": 1, \"count\": 5}',_binary '',NULL,NULL,7,NULL,NULL,NULL),(667,'2025-09-16 14:19:35.879219',NULL,_binary '\0','2025-09-16 14:19:35.879219',0,'오전반차 - 5시간','VACATION_TYPE','오전반차 (09:00-14:00)','MORNING_HALF_DAY',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(668,'2025-09-16 14:19:39.561927',NULL,_binary '\0','2025-09-16 14:19:39.561927',0,'오후반차 - 4시간','VACATION_TYPE','오후반차 (14:00-18:00)','AFTERNOON_HALF_DAY',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(669,'2025-09-16 15:15:41.661861',NULL,_binary '\0','2025-09-16 15:15:41.661861',0,'휴가로 인한 비활성','STATUS','휴가','VACATION',NULL,_binary '',NULL,NULL,0,NULL,NULL,NULL),(670,'2025-09-16 15:30:31.811835',NULL,_binary '\0','2025-09-16 15:30:31.811835',0,'BRANCH_SUPER_ADMIN의 스케줄 접근 권한','ROLE_PERMISSION','BRANCH_SUPER_ADMIN 스케줄 접근','BRANCH_SUPER_ADMIN_SCHEDULE_ACCESS','{\"role\": \"BRANCH_SUPER_ADMIN\", \"permission\": \"SCHEDULE_ACCESS\", \"level\": \"full\"}',_binary '',NULL,NULL,10,NULL,NULL,NULL),(671,'2025-09-16 15:30:35.680532',NULL,_binary '\0','2025-09-16 15:30:35.680532',0,'BRANCH_SUPER_ADMIN의 관리자 접근 권한','ROLE_PERMISSION','BRANCH_SUPER_ADMIN 관리자 접근','BRANCH_SUPER_ADMIN_ADMIN_ACCESS','{\"role\": \"BRANCH_SUPER_ADMIN\", \"permission\": \"ADMIN_ACCESS\", \"level\": \"full\"}',_binary '',NULL,NULL,11,NULL,NULL,NULL),(672,'2025-09-17 10:22:40.013485',NULL,_binary '\0','2025-09-17 10:22:40.013485',0,NULL,'REFUND_PERIOD','오늘','TODAY','{\"days\":1}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(673,'2025-09-17 10:22:40.018029',NULL,_binary '\0','2025-09-17 10:22:40.018029',0,NULL,'REFUND_PERIOD','최근 7일','WEEK','{\"days\":7}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(674,'2025-09-17 10:22:40.018771',NULL,_binary '\0','2025-09-17 10:22:40.018771',0,NULL,'REFUND_PERIOD','최근 1개월','MONTH','{\"months\":1}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(675,'2025-09-17 10:22:40.019691',NULL,_binary '\0','2025-09-17 10:22:40.019691',0,NULL,'REFUND_PERIOD','최근 3개월','QUARTER','{\"months\":3}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(676,'2025-09-17 10:22:40.020337',NULL,_binary '\0','2025-09-17 10:22:40.020337',0,NULL,'REFUND_PERIOD','최근 1년','YEAR','{\"years\":1}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(677,'2025-09-17 10:22:40.022541',NULL,_binary '\0','2025-09-17 10:22:40.022541',0,NULL,'REFUND_REASON','고객 요청','CUSTOMER_REQUEST','{\"keywords\":\"고객,요청,개인사정\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(678,'2025-09-17 10:22:40.023534',NULL,_binary '\0','2025-09-17 10:22:40.023534',0,NULL,'REFUND_REASON','서비스 불만족','SERVICE_UNSATISFIED','{\"keywords\":\"불만족,서비스,품질\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(679,'2025-09-17 10:22:40.024175',NULL,_binary '\0','2025-09-17 10:22:40.024175',0,NULL,'REFUND_REASON','상담사 변경','CONSULTANT_CHANGE','{\"keywords\":\"상담사,변경,교체\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(680,'2025-09-17 10:22:40.024996',NULL,_binary '\0','2025-09-17 10:22:40.024996',0,NULL,'REFUND_REASON','일정 충돌','SCHEDULE_CONFLICT','{\"keywords\":\"일정,시간,충돌\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(681,'2025-09-17 10:22:40.025913',NULL,_binary '\0','2025-09-17 10:22:40.025913',0,NULL,'REFUND_REASON','건강상 이유','HEALTH_ISSUE','{\"keywords\":\"건강,병원,치료\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(682,'2025-09-17 10:22:40.026624',NULL,_binary '\0','2025-09-17 10:22:40.026624',0,NULL,'REFUND_REASON','이사/이전','RELOCATION','{\"keywords\":\"이사,이전,거리\"}',_binary '',NULL,NULL,6,NULL,NULL,NULL),(683,'2025-09-17 10:22:40.027606',NULL,_binary '\0','2025-09-17 10:22:40.027606',0,NULL,'REFUND_REASON','경제적 어려움','FINANCIAL_DIFFICULTY','{\"keywords\":\"경제,재정,돈\"}',_binary '',NULL,NULL,7,NULL,NULL,NULL),(684,'2025-09-17 10:22:40.028576',NULL,_binary '\0','2025-09-17 10:22:40.028576',0,NULL,'REFUND_REASON','관리자 결정','ADMIN_DECISION','{\"keywords\":\"관리자,결정,정책\"}',_binary '',NULL,NULL,8,NULL,NULL,NULL),(685,'2025-09-17 10:22:40.032294',NULL,_binary '\0','2025-09-17 10:22:40.032294',0,NULL,'REFUND_REASON','기타','OTHER','{\"keywords\":\"기타,etc\"}',_binary '',NULL,NULL,9,NULL,NULL,NULL),(686,'2025-09-17 10:22:40.034775',NULL,_binary '\0','2025-09-17 10:22:40.034775',0,NULL,'REFUND_STATUS','환불 요청','REQUESTED','{\"color\":\"#ffc107\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(687,'2025-09-17 10:22:40.035406',NULL,_binary '\0','2025-09-17 10:22:40.035406',0,NULL,'REFUND_STATUS','환불 승인','APPROVED','{\"color\":\"#28a745\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(688,'2025-09-17 10:22:40.036705',NULL,_binary '\0','2025-09-17 10:22:40.036705',0,NULL,'REFUND_STATUS','환불 처리중','PROCESSING','{\"color\":\"#17a2b8\"}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(689,'2025-09-17 10:22:40.037251',NULL,_binary '\0','2025-09-17 10:22:40.037251',0,NULL,'REFUND_STATUS','환불 완료','COMPLETED','{\"color\":\"#6f42c1\"}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(690,'2025-09-17 10:22:40.037862',NULL,_binary '\0','2025-09-17 10:22:40.037862',0,NULL,'REFUND_STATUS','환불 거부','REJECTED','{\"color\":\"#dc3545\"}',_binary '',NULL,NULL,5,NULL,NULL,NULL),(691,'2025-09-17 14:37:07.188019',NULL,_binary '\0','2025-09-17 14:37:07.188019',0,NULL,'ALIMTALK_CONFIG','활성화','ENABLED','{\"value\":true}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(692,'2025-09-17 14:37:07.193566',NULL,_binary '\0','2025-09-17 14:37:07.193566',0,NULL,'ALIMTALK_CONFIG','SMS 대체 발송','FALLBACK_TO_SMS','{\"value\":true}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(693,'2025-09-17 14:37:07.195640',NULL,_binary '\0','2025-09-17 14:37:07.195640',0,NULL,'ALIMTALK_CONFIG','최대 재시도 횟수','MAX_RETRY_COUNT','{\"value\":3}',_binary '',NULL,NULL,3,NULL,NULL,NULL),(694,'2025-09-17 14:37:07.197188',NULL,_binary '\0','2025-09-17 14:37:07.197188',0,NULL,'ALIMTALK_CONFIG','타임아웃 시간','TIMEOUT_SECONDS','{\"value\":30}',_binary '',NULL,NULL,4,NULL,NULL,NULL),(695,'2025-09-17 14:47:23.000000',NULL,_binary '\0','2025-09-17 14:47:23.000000',0,NULL,'ALIMTALK_TEMPLATE','상담확정: #{consultantName}, #{consultationDate} #{consultationTime}','CONSULTATION_CONFIRMED','{\"category\":\"consultation\"}',_binary '',NULL,NULL,1,NULL,NULL,NULL),(696,'2025-09-17 14:47:23.000000',NULL,_binary '\0','2025-09-17 14:47:23.000000',0,NULL,'ALIMTALK_TEMPLATE','환불완료: #{refundSessions}회, #{refundAmount}원','REFUND_COMPLETED','{\"category\":\"payment\"}',_binary '',NULL,NULL,2,NULL,NULL,NULL),(697,'2025-09-18 10:25:30.000000',NULL,_binary '\0','2025-09-18 10:25:30.000000',0,'ë³¸ì ','BRANCH','ë³¸ì ','MAIN001',NULL,_binary '',NULL,NULL,1,NULL,NULL,NULL),(698,'2025-09-18 10:25:30.000000',NULL,_binary '\0','2025-09-18 10:25:30.000000',0,'ê°•ë‚¨ì§€ì ','BRANCH','ê°•ë‚¨ì ','GANGNAM',NULL,_binary '',NULL,NULL,2,NULL,NULL,NULL),(699,'2025-09-18 10:25:30.000000',NULL,_binary '\0','2025-09-18 10:25:30.000000',0,'í™ëŒ€ì§€ì ','BRANCH','í™ëŒ€ì ','HONGDAE',NULL,_binary '',NULL,NULL,3,NULL,NULL,NULL),(700,'2025-09-18 10:25:30.000000',NULL,_binary '\0','2025-09-18 10:25:30.000000',0,'ìž ì‹¤ì§€ì ','BRANCH','ìž ì‹¤ì ','JAMSIL',NULL,_binary '',NULL,NULL,4,NULL,NULL,NULL),(701,'2025-09-18 10:25:30.000000',NULL,_binary '\0','2025-09-18 10:25:30.000000',0,'ì‹ ì´Œì§€ì ','BRANCH','ì‹ ì´Œì ','SINCHON',NULL,_binary '',NULL,NULL,5,NULL,NULL,NULL);
/*!40000 ALTER TABLE `common_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultant_availability`
--

DROP TABLE IF EXISTS `consultant_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultant_availability` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `consultant_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `day_of_week` enum('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_minutes` int NOT NULL,
  `end_time` time(6) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` time(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKs0u154sus60nvpdn892qyjh0w` (`consultant_id`),
  CONSTRAINT `FKs0u154sus60nvpdn892qyjh0w` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultant_availability`
--

LOCK TABLES `consultant_availability` WRITE;
/*!40000 ALTER TABLE `consultant_availability` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultant_availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultant_client_mappings`
--

DROP TABLE IF EXISTS `consultant_client_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultant_client_mappings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `assigned_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancelled_sessions` int DEFAULT NULL,
  `client_feedback` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_satisfaction_rating` int DEFAULT NULL,
  `completed_sessions` int DEFAULT NULL,
  `consultant_evaluation_details` text COLLATE utf8mb4_unicode_ci,
  `consultant_evaluation_score` int DEFAULT NULL,
  `emergency_expiry_date` date DEFAULT NULL,
  `end_date` datetime(6) DEFAULT NULL,
  `evaluation_date` date DEFAULT NULL,
  `goal_achievement` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `goal_achievement_details` text COLLATE utf8mb4_unicode_ci,
  `is_auto_renewal` bit(1) DEFAULT NULL,
  `is_emergency_mapping` bit(1) DEFAULT NULL,
  `last_session_date` date DEFAULT NULL,
  `last_supervision_date` date DEFAULT NULL,
  `mapping_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mapping_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `next_renewal_date` date DEFAULT NULL,
  `next_session_date` date DEFAULT NULL,
  `next_supervision_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `progress_score` int DEFAULT NULL,
  `renewal_period_months` int DEFAULT NULL,
  `responsibility` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `special_considerations` text COLLATE utf8mb4_unicode_ci,
  `start_date` datetime(6) NOT NULL,
  `status` enum('PENDING_PAYMENT','PAYMENT_CONFIRMED','ACTIVE','INACTIVE','SUSPENDED','TERMINATED','SESSIONS_EXHAUSTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `supervision_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supervision_notes` text COLLATE utf8mb4_unicode_ci,
  `supervision_plan` text COLLATE utf8mb4_unicode_ci,
  `supervisor_id` bigint DEFAULT NULL,
  `termination_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_sessions` int DEFAULT NULL,
  `transfer_date` date DEFAULT NULL,
  `client_id` bigint NOT NULL,
  `consultant_id` bigint NOT NULL,
  `assigned_at` datetime(6) DEFAULT NULL,
  `terminated_at` datetime(6) DEFAULT NULL,
  `terminated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_approval_date` datetime(6) DEFAULT NULL,
  `approved_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `package_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `package_price` bigint DEFAULT NULL,
  `payment_amount` bigint DEFAULT NULL,
  `payment_date` datetime(6) DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_reference` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('PENDING','CONFIRMED','APPROVED','REJECTED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `remaining_sessions` int NOT NULL,
  `used_sessions` int DEFAULT NULL,
  `branch_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mapping_consultant` (`consultant_id`),
  KEY `idx_mapping_client` (`client_id`),
  KEY `idx_mapping_status` (`status`),
  KEY `idx_mapping_start_date` (`start_date`),
  KEY `idx_mapping_payment_status` (`payment_status`),
  KEY `idx_mapping_remaining_sessions` (`remaining_sessions`),
  CONSTRAINT `FK1oayismjrosvitfoewb9p4ow3` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKqy1hxcffmbxlnkat9nww6qsex` FOREIGN KEY (`consultant_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultant_client_mappings`
--

LOCK TABLES `consultant_client_mappings` WRITE;
/*!40000 ALTER TABLE `consultant_client_mappings` DISABLE KEYS */;
INSERT INTO `consultant_client_mappings` VALUES (1,'2025-08-28 18:08:10.799894',NULL,_binary '\0','2025-09-02 17:15:11.416654',3,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'스키마 문제 해결 후 매핑 테스트 성공',NULL,NULL,'정신건강 상담','IT 업계 종사자, 야근이 잦음','2025-08-28 00:00:00.000000','INACTIVE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,'2025-09-02 15:33:06.228811',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',0,NULL,'MAIN001'),(2,'2025-08-28 18:08:44.362339',NULL,_binary '\0','2025-09-02 15:33:06.241161',2,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'새로운 상담사-내담자 매핑 테스트 성공',NULL,NULL,'정신건강 상담','중년층 상담','2025-08-28 00:00:00.000000','TERMINATED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,2,NULL,'2025-09-02 15:33:06.240798',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',0,NULL,'MAIN001'),(3,'2025-08-29 11:03:29.413087',NULL,_binary '\0','2025-09-02 15:33:06.252485',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'테스트용 매핑 생성',NULL,NULL,NULL,NULL,'2025-08-29 11:03:29.412235','TERMINATED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,20,1,'2025-08-29 11:03:29.412235','2025-09-02 15:33:06.252299',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',0,NULL,'MAIN001'),(4,'2025-08-29 11:21:33.789221',NULL,_binary '\0','2025-09-02 15:33:06.263906',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'테스트 매핑입니다.',NULL,NULL,NULL,NULL,'2025-08-29 11:21:33.781617','TERMINATED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,20,1,'2025-08-29 11:21:33.781616','2025-09-02 15:33:06.263564',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',0,NULL,'MAIN001'),(5,'2025-09-02 09:49:15.550779',NULL,_binary '\0','2025-09-02 15:33:06.275180',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-02 09:49:15.541191','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,1,1,'2025-09-02 09:49:15.554046','2025-09-02 15:33:06.275026',NULL,'2025-09-02 09:49:15.541272','테스트 관리자','테스트 패키지',500000,500000,'2025-09-02 09:49:15.541203','테스트 결제','TEST-1756774155541','APPROVED',10,0,'MAIN001'),(6,'2025-09-02 10:15:35.760183',NULL,_binary '\0','2025-09-02 15:33:06.286214',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-02 10:15:35.758349','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,1,1,'2025-09-02 10:15:35.761248','2025-09-02 15:33:06.286063',NULL,'2025-09-02 10:15:35.758690','테스트 관리자','테스트 패키지',500000,500000,'2025-09-02 10:15:35.758365','테스트 결제','TEST-1756775735758','APPROVED',10,0,'MAIN001'),(7,'2025-09-02 11:07:34.105598',NULL,_binary '\0','2025-09-02 15:33:06.297615',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-02 11:07:34.104000','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,1,1,'2025-09-02 11:07:34.106671','2025-09-02 15:33:06.297433',NULL,'2025-09-02 11:07:34.104325','테스트 관리자','테스트 패키지',500000,500000,'2025-09-02 11:07:34.104017','테스트 결제','TEST-1756778854104','APPROVED',10,0,'MAIN001'),(8,'2025-09-02 12:51:00.050176',NULL,_binary '\0','2025-09-02 15:33:06.310149',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-02 12:51:00.048481','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,1,1,'2025-09-02 12:51:00.051250','2025-09-02 15:33:06.309974',NULL,'2025-09-02 12:51:00.048826','테스트 관리자','테스트 패키지',500000,500000,'2025-09-02 12:51:00.048497','테스트 결제','TEST-1756785060048','APPROVED',10,0,'MAIN001'),(9,'2025-09-02 12:51:01.749294',NULL,_binary '\0','2025-09-02 15:33:06.321203',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-02 12:51:01.748891','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,1,1,'2025-09-02 12:51:01.749334','2025-09-02 15:33:06.321059',NULL,'2025-09-02 12:51:01.748904','테스트 관리자','테스트 패키지',500000,500000,'2025-09-02 12:51:01.748892','테스트 결제','TEST-1756785061748','APPROVED',10,0,'MAIN001'),(10,'2025-09-02 12:51:02.512689',NULL,_binary '\0','2025-09-02 15:33:06.333258',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-02 12:51:02.512263','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,1,1,'2025-09-02 12:51:02.512724','2025-09-02 15:33:06.333102',NULL,'2025-09-02 12:51:02.512279','테스트 관리자','테스트 패키지',500000,500000,'2025-09-02 12:51:02.512265','테스트 결제','TEST-1756785062512','APPROVED',10,0,'MAIN001'),(11,'2025-09-02 15:07:07.490947',NULL,_binary '\0','2025-09-02 17:05:35.098306',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'테스트 매핑',NULL,NULL,NULL,NULL,'2025-09-02 15:07:07.489909','INACTIVE',NULL,NULL,NULL,NULL,NULL,10,NULL,34,25,'2025-09-02 15:07:07.489920',NULL,NULL,NULL,NULL,'10회기 패키지',500000,NULL,NULL,NULL,NULL,'PENDING',10,NULL,'MAIN001'),(12,'2025-09-02 17:24:22.930837',NULL,_binary '\0','2025-09-02 17:24:22.930837',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'테스트 매핑',NULL,NULL,NULL,NULL,'2025-09-02 17:24:22.929391','ACTIVE',NULL,NULL,NULL,NULL,NULL,10,NULL,34,1,'2025-09-02 17:24:22.929401',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',10,NULL,'MAIN001'),(13,'2025-09-02 17:25:23.475335',NULL,_binary '\0','2025-09-02 17:25:23.475335',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'테스트 매핑',NULL,NULL,NULL,NULL,'2025-09-02 17:25:23.466664','ACTIVE',NULL,NULL,NULL,NULL,NULL,10,NULL,34,1,'2025-09-02 17:25:23.466679',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',10,NULL,'MAIN001'),(14,'2025-09-03 09:21:56.495804',NULL,_binary '\0','2025-09-17 09:38:17.913974',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'중복 매핑 통합으로 종료됨',NULL,NULL,NULL,NULL,'2025-09-03 09:21:56.494993','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,1,1,'2025-09-03 09:21:56.495861',NULL,NULL,'2025-09-03 09:21:56.495098','테스트 관리자','테스트 패키지',500000,500000,'2025-09-03 09:21:56.495008','테스트 결제','TEST-1756858916495','APPROVED',9,1,'MAIN001'),(15,'2025-09-03 09:22:01.930295',NULL,_binary '\0','2025-09-03 09:22:01.930295',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'테스트 매핑',NULL,NULL,NULL,NULL,'2025-09-03 09:22:01.930098','ACTIVE',NULL,NULL,NULL,NULL,NULL,10,NULL,34,41,'2025-09-03 09:22:01.930114',NULL,NULL,NULL,NULL,'테스트 패키지',500000,NULL,NULL,NULL,NULL,'PENDING',10,NULL,'MAIN001'),(16,'2025-09-03 09:30:37.408393',NULL,_binary '\0','2025-09-17 14:02:35.683948',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'중복 매핑 통합으로 생성됨\n[2025-09-17 14:02 강제 종료] 고객요청으로 환불 (환불: 19회기, 475,000원)',NULL,NULL,NULL,NULL,'2025-09-03 09:30:37.406910','TERMINATED',NULL,NULL,NULL,NULL,NULL,20,NULL,1,1,'2025-09-03 09:30:37.409471','2025-09-17 14:02:35.673968',NULL,'2025-09-03 09:30:37.407248','테스트 관리자','테스트 패키지',500000,500000,'2025-09-03 09:30:37.406925','테스트 결제','TEST-1756859437406','APPROVED',0,20,'MAIN001'),(17,'2025-09-03 10:03:31.899956',NULL,_binary '\0','2025-09-03 10:03:31.899956',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'테스트 매핑',NULL,NULL,'정신건강 상담','테스트용','2025-09-03 00:00:00.000000','ACTIVE',NULL,NULL,NULL,NULL,NULL,10,NULL,35,1,'2025-09-03 10:03:31.898630',NULL,NULL,NULL,NULL,'기본 10회기 패키지',500000,500000,NULL,'신용카드','TEST-123456','PENDING',10,0,'MAIN001'),(18,'2025-09-03 10:06:12.700710',NULL,_binary '\0','2025-09-14 16:30:23.180045',3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'관리자 거부',NULL,NULL,'부부 상담','','2025-09-03 00:00:00.000000','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,35,41,'2025-09-03 10:06:12.699234','2025-09-14 16:30:23.179729',NULL,NULL,NULL,'기본 10회기 패키지',500000,500000,'2025-09-04 11:30:48.496811','테스트 결제','TEST-123456','CONFIRMED',10,0,'MAIN001'),(19,'2025-09-04 10:15:38.291154',NULL,_binary '\0','2025-09-17 13:46:04.075764',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[2025-09-17 13:46 강제 종료] 이사로 인한 환불 (환불: 7회기, 350,000원)',NULL,NULL,'정신건강 상담','','2025-09-04 11:24:24.444605','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,36,41,'2025-09-04 10:15:38.288803','2025-09-17 13:46:04.075109',NULL,'2025-09-04 11:24:24.444604','관리자','기본 10회기 패키지',500000,500000,'2025-09-04 11:22:22.262033','신용카드','PAY-1756952542246','APPROVED',0,10,'MAIN001'),(20,'2025-09-04 17:33:41.694581',NULL,_binary '\0','2025-09-17 09:38:17.915210',16,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'중복 매핑 통합으로 종료됨',NULL,NULL,'정신건강 상담','','2025-09-04 17:47:23.197369','TERMINATED',NULL,NULL,NULL,NULL,NULL,8,NULL,34,43,'2025-09-04 17:33:41.692998',NULL,NULL,'2025-09-04 17:47:23.197368','시스템 관리자','부부 상담 8회기 패키지',480000,300000,'2025-09-04 17:46:57.535158','신용카드','PAY-TEST-2025-09-04-2','APPROVED',4,4,'MAIN001'),(21,'2025-09-04 17:43:15.742024',NULL,_binary '\0','2025-09-17 09:38:17.915239',3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'중복 매핑 통합으로 종료됨',NULL,NULL,'정신건강 상담','','2025-09-04 17:48:17.895608','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,34,43,'2025-09-04 17:43:15.734383',NULL,NULL,'2025-09-04 17:48:17.895607','관리자','가족 상담 10회기 패키지',600000,300000,'2025-09-04 17:48:13.968735','신용카드','PAY-1756975693956','APPROVED',10,0,'MAIN001'),(22,'2025-09-04 20:32:21.385771',NULL,_binary '\0','2025-09-17 11:09:05.158170',4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'중복 매핑 통합으로 생성됨',NULL,NULL,'정신건강 상담','','2025-09-04 20:32:36.179983','ACTIVE',NULL,NULL,NULL,NULL,NULL,26,NULL,34,43,'2025-09-04 20:32:21.383348',NULL,NULL,'2025-09-04 20:32:36.179981','관리자','부부 상담 8회기 패키지',480000,300000,'2025-09-04 20:32:27.681432','신용카드','PAY-1756985547661','APPROVED',20,6,'MAIN001'),(24,'2025-09-04 21:40:49.610414',NULL,_binary '\0','2025-09-04 21:49:50.921130',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-04 21:49:50.885604',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,'2025-09-04 00:00:00.000000','TERMINATED',NULL,NULL,NULL,NULL,'상담사 변경: 김선희 -> 김선희. 사유: 내담자 요청으로 상담사 변경',10,NULL,23,43,'2025-09-04 21:40:49.610249','2025-09-04 21:49:50.885603','관리자',NULL,NULL,'기본 패키지',0,0,NULL,NULL,NULL,'PENDING',10,0,'MAIN001'),(25,'2025-09-04 21:49:50.893909',NULL,_binary '\0','2025-09-04 21:58:30.903641',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-04 21:58:30.894622',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'상담사 변경으로 생성된 매핑. 기존 매핑 ID: 24',NULL,NULL,NULL,NULL,'2025-09-04 21:49:50.889028','TERMINATED',NULL,NULL,NULL,NULL,'상담사 변경: 김선희 -> 김선희2. 사유: 11',10,NULL,23,43,'2025-09-04 21:49:50.889165','2025-09-04 21:58:30.894621','관리자',NULL,NULL,'기본 패키지',0,0,NULL,NULL,NULL,'APPROVED',10,0,'MAIN001'),(26,'2025-09-04 21:58:30.896007',NULL,_binary '\0','2025-09-05 12:18:40.605291',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'상담사 변경으로 생성된 매핑. 기존 매핑 ID: 25',NULL,NULL,NULL,'11','2025-09-04 21:58:30.895091','ACTIVE',NULL,NULL,NULL,NULL,NULL,10,NULL,23,45,'2025-09-04 21:58:30.895103',NULL,NULL,NULL,NULL,'기본 패키지',0,0,NULL,NULL,NULL,'APPROVED',9,1,'MAIN001'),(27,'2025-09-04 22:02:12.832089',NULL,_binary '\0','2025-09-16 11:00:48.736070',4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,'정신건강 상담','','2025-09-04 22:02:24.763478','ACTIVE',NULL,NULL,NULL,NULL,NULL,10,NULL,46,45,'2025-09-04 22:02:12.831184',NULL,NULL,'2025-09-04 22:02:24.763478','관리자','프리미엄 10회기 패키지',700000,300000,'2025-09-04 22:02:17.191492','신용카드','PAY-1756990937176','APPROVED',7,3,'MAIN001'),(28,'2025-09-08 08:52:37.608715',NULL,_binary '\0','2025-09-15 16:56:42.871641',11,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-15 16:56:42.864269',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,'정신건강 상담','','2025-09-08 08:53:04.360004','SESSIONS_EXHAUSTED',NULL,NULL,NULL,NULL,NULL,10,NULL,23,43,'2025-09-08 08:52:37.606056',NULL,NULL,'2025-09-08 08:53:04.360003','관리자','프리미엄 10회기 패키지',700000,300000,'2025-09-08 08:53:02.599920','신용카드','PAY-1757289182586','APPROVED',0,10,'MAIN001'),(29,'2025-09-08 17:41:51.025662',NULL,_binary '\0','2025-09-17 09:38:17.915300',5,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'중복 매핑 통합으로 종료됨',NULL,NULL,'정신건강 상담','','2025-09-08 17:41:58.521242','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,23,43,'2025-09-08 17:41:51.013035',NULL,NULL,'2025-09-08 17:41:58.521242','관리자','가족 상담 10회기 패키지',600000,300000,'2025-09-08 17:41:54.524022','신용카드','PAY-1757320914514','APPROVED',6,4,'MAIN001'),(30,'2025-09-12 16:21:37.601936',NULL,_binary '\0','2025-09-17 09:38:17.915326',3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'중복 매핑 통합으로 종료됨',NULL,NULL,'정신건강 상담','','2025-09-12 16:21:46.575191','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,23,43,'2025-09-12 16:21:37.599707',NULL,NULL,'2025-09-12 16:21:46.575190','관리자','(10회기, 500,000원)',500000,300000,'2025-09-12 16:21:43.427487','신용카드','PAY-1757661703408','APPROVED',10,0,'MAIN001'),(31,'2025-09-12 17:53:07.352471',NULL,_binary '\0','2025-09-17 09:31:49.198943',3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-17 09:31:49.177227',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,'가족 상담','','2025-09-12 17:57:48.746201','TERMINATED',NULL,NULL,NULL,NULL,'상담사 삭제로 인한 이전: 상담 -> 김선희. 사유: 퇴사',10,NULL,68,67,'2025-09-12 17:53:07.350391','2025-09-17 09:31:49.177226','SYSTEM_AUTO_TRANSFER','2025-09-12 17:57:48.746199','관리자','(10회기, 500,000원)',500000,300000,'2025-09-12 17:57:46.530868','신용카드','PAY-1757667466516','APPROVED',10,0,'MAIN001'),(32,'2025-09-12 17:56:32.807278',NULL,_binary '\0','2025-09-12 17:56:32.807278',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'테스트 매핑',NULL,NULL,'상담',NULL,'2025-09-12 17:56:32.805668','ACTIVE',NULL,NULL,NULL,NULL,NULL,10,NULL,34,1,'2025-09-12 17:56:32.805683',NULL,NULL,NULL,NULL,'테스트 패키지',500000,NULL,NULL,'CASH',NULL,'PENDING',10,0,'MAIN001'),(33,'2025-09-12 17:57:23.992141',NULL,_binary '\0','2025-09-17 09:31:49.199050',4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-17 09:31:49.193052',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,'정신건강 상담','','2025-09-12 17:57:33.531807','TERMINATED',NULL,NULL,NULL,NULL,'상담사 삭제로 인한 이전: 상담 -> 김선희. 사유: 퇴사',10,NULL,46,67,'2025-09-12 17:57:23.989923','2025-09-17 09:31:49.193050','SYSTEM_AUTO_TRANSFER','2025-09-12 17:57:33.531806','관리자','(10회기, 500,000원)',500000,300000,'2025-09-12 17:57:28.594931','신용카드','PAY-1757667448577','APPROVED',9,1,'MAIN001'),(34,'2025-09-12 23:29:54.625516',NULL,_binary '\0','2025-09-17 13:41:10.213514',3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[2025-09-17 13:41 강제 종료] 이사감 (환불: 10회기, 500,000원)',NULL,NULL,'정신건강 상담','','2025-09-12 23:30:02.350668','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,60,43,'2025-09-12 23:29:54.622868','2025-09-17 13:41:10.211832',NULL,'2025-09-12 23:30:02.350667','관리자','(10회기, 500,000원)',500000,300000,'2025-09-12 23:30:00.354414','신용카드','PAY-1757687400337','APPROVED',0,10,'MAIN001'),(35,'2025-09-14 16:22:36.552987',NULL,_binary '\0','2025-09-17 09:30:04.933097',5,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-17 09:30:04.887128',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,'스트레스 관리','','2025-09-14 16:30:07.629464','TERMINATED',NULL,NULL,NULL,NULL,'상담사 삭제로 인한 이전: 이르 -> 상담2. 사유: 테스트 이전',15,NULL,75,71,'2025-09-14 16:22:36.552683','2025-09-17 09:30:04.887127','SYSTEM_AUTO_TRANSFER','2025-09-14 16:30:07.629463','관리자','추가 회기 패키지',500000,300000,'2025-09-14 16:30:04.343102','신용카드','PAY-1757835004320','APPROVED',14,1,'MAIN001'),(36,'2025-09-15 10:05:38.350384',NULL,_binary '\0','2025-09-17 09:38:17.915357',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'중복 매핑 통합으로 생성됨',NULL,NULL,NULL,NULL,'2025-09-15 10:05:38.349824','ACTIVE',NULL,NULL,NULL,NULL,NULL,98,NULL,23,43,'2025-09-15 10:05:38.349841',NULL,NULL,NULL,NULL,'VIP',1000000,NULL,NULL,NULL,NULL,'PENDING',94,4,'MAIN001'),(37,'2025-09-17 09:30:04.888576',NULL,_binary '\0','2025-09-17 09:30:04.888576',0,'SYSTEM_AUTO_TRANSFER',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'상담사 이전: 상담사 삭제로 인한 이전: 이르 -> 상담2. 사유: 테스트 이전',NULL,NULL,NULL,NULL,'2025-09-14 16:30:07.629464','TERMINATED',NULL,NULL,NULL,NULL,NULL,15,NULL,75,70,'2025-09-17 09:30:04.887688',NULL,NULL,NULL,NULL,'추가 회기 패키지',500000,300000,'2025-09-14 16:30:04.343102','신용카드','PAY-1757835004320','APPROVED',14,1,'MAIN001'),(38,'2025-09-17 09:31:49.180290',NULL,_binary '\0','2025-09-17 09:31:49.180290',0,'SYSTEM_AUTO_TRANSFER',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'상담사 이전: 상담사 삭제로 인한 이전: 상담 -> 김선희. 사유: 퇴사',NULL,NULL,NULL,NULL,'2025-09-12 17:57:48.746201','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,68,43,'2025-09-17 09:31:49.178268',NULL,NULL,NULL,NULL,'(10회기, 500,000원)',500000,300000,'2025-09-12 17:57:46.530868','신용카드','PAY-1757667466516','APPROVED',10,0,'MAIN001'),(39,'2025-09-17 09:31:49.193481',NULL,_binary '\0','2025-09-17 09:31:49.193481',0,'SYSTEM_AUTO_TRANSFER',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'상담사 이전: 상담사 삭제로 인한 이전: 상담 -> 김선희. 사유: 퇴사',NULL,NULL,NULL,NULL,'2025-09-12 17:57:33.531807','TERMINATED',NULL,NULL,NULL,NULL,NULL,10,NULL,46,43,'2025-09-17 09:31:49.193281',NULL,NULL,NULL,NULL,'(10회기, 500,000원)',500000,300000,'2025-09-12 17:57:28.594931','신용카드','PAY-1757667448577','APPROVED',9,1,'MAIN001');
/*!40000 ALTER TABLE `consultant_client_mappings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultant_mood_tracking`
--

DROP TABLE IF EXISTS `consultant_mood_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultant_mood_tracking` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `consultant_id` bigint NOT NULL COMMENT '상담사 ID',
  `mood_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '기분 상태',
  `stress_level` int DEFAULT '0' COMMENT '스트레스 레벨 (1-10)',
  `workload_level` int DEFAULT '0' COMMENT '업무량 레벨 (1-10)',
  `satisfaction_level` int DEFAULT '0' COMMENT '만족도 레벨 (1-10)',
  `note` text COLLATE utf8mb4_unicode_ci COMMENT '추가 메모',
  `recorded_date` date NOT NULL COMMENT '기록 날짜',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_consultant_date` (`consultant_id`,`recorded_date`),
  KEY `idx_consultant` (`consultant_id`),
  KEY `idx_date` (`recorded_date`),
  CONSTRAINT `consultant_mood_tracking_ibfk_1` FOREIGN KEY (`consultant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상담사 기분 상태 추적';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultant_mood_tracking`
--

LOCK TABLES `consultant_mood_tracking` WRITE;
/*!40000 ALTER TABLE `consultant_mood_tracking` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultant_mood_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultant_ratings`
--

DROP TABLE IF EXISTS `consultant_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultant_ratings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `comment` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `heart_score` int NOT NULL,
  `is_anonymous` bit(1) DEFAULT NULL,
  `rated_at` datetime(6) DEFAULT NULL,
  `rating_tags` json DEFAULT NULL,
  `status` enum('ACTIVE','HIDDEN','REPORTED','DELETED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` bigint NOT NULL,
  `consultant_id` bigint NOT NULL,
  `schedule_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKf5yabw1wnypl3m6l3uu0hkip0` (`client_id`),
  KEY `FKeheqfhul4c64xm6eyr05llu32` (`consultant_id`),
  KEY `FKefakiefwp2fafqabb4kxm5c1r` (`schedule_id`),
  CONSTRAINT `FKefakiefwp2fafqabb4kxm5c1r` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`),
  CONSTRAINT `FKeheqfhul4c64xm6eyr05llu32` FOREIGN KEY (`consultant_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKf5yabw1wnypl3m6l3uu0hkip0` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultant_ratings`
--

LOCK TABLES `consultant_ratings` WRITE;
/*!40000 ALTER TABLE `consultant_ratings` DISABLE KEYS */;
INSERT INTO `consultant_ratings` VALUES (1,'2025-09-17 16:52:11.078517',NULL,_binary '\0','2025-09-17 16:52:11.078517',0,'테스트 평가입니다',5,_binary '\0','2025-09-17 16:52:11.077084','[\"친절해요\", \"전문적이에요\"]','ACTIVE',23,25,1),(2,'2025-09-17 17:03:07.293535',NULL,_binary '\0','2025-09-17 17:03:07.293535',0,'상담 고맙습니다.',5,_binary '\0','2025-09-17 17:03:07.292665','[\"친절해요\", \"전문적이에요\", \"신뢰가 가요\", \"편안해요\", \"적극적이에요\"]','ACTIVE',23,43,34),(3,'2025-09-17 22:32:32.968504',NULL,_binary '\0','2025-09-17 22:32:32.968504',0,'감사합니다.',5,_binary '\0','2025-09-17 22:32:32.967114','[\"친절해요\", \"전문적이에요\", \"도움이 되었어요\", \"신뢰가 가요\", \"편안해요\"]','ACTIVE',23,43,44);
/*!40000 ALTER TABLE `consultant_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultant_salary_options`
--

DROP TABLE IF EXISTS `consultant_salary_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultant_salary_options` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `option_amount` decimal(10,2) NOT NULL,
  `option_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salary_profile_id` bigint NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_consultant_salary_option_profile_id` (`salary_profile_id`),
  KEY `idx_consultant_salary_option_type` (`option_type`),
  KEY `idx_consultant_salary_option_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultant_salary_options`
--

LOCK TABLES `consultant_salary_options` WRITE;
/*!40000 ALTER TABLE `consultant_salary_options` DISABLE KEYS */;
INSERT INTO `consultant_salary_options` VALUES (1,'2025-09-11 14:28:24.293692',_binary '',5000.00,'가족상담','FAMILY_CONSULTATION',3,'2025-09-11 14:28:24.293692'),(2,'2025-09-11 14:28:24.299305',_binary '',7000.00,'초기상담','INITIAL_CONSULTATION',3,'2025-09-11 14:28:24.299305'),(3,'2025-09-11 14:37:21.663033',_binary '',5000.00,'가족상담','FAMILY_CONSULTATION',4,'2025-09-11 14:37:21.663034'),(4,'2025-09-11 14:37:21.667665',_binary '',7000.00,'초기상담','INITIAL_CONSULTATION',4,'2025-09-11 14:37:21.667665'),(5,'2025-09-11 14:44:59.286164',_binary '',5000.00,'가족상담','FAMILY_CONSULTATION',5,'2025-09-11 14:44:59.286165'),(6,'2025-09-11 14:44:59.291270',_binary '',7000.00,'초기상담','INITIAL_CONSULTATION',5,'2025-09-11 14:44:59.291270'),(7,'2025-09-11 16:02:47.424549',_binary '',3000.00,'가족상담','FAMILY_CONSULTATION',6,'2025-09-11 16:02:47.424549'),(8,'2025-09-11 16:02:47.428871',_binary '',5000.00,'초기상담','INITIAL_CONSULTATION',6,'2025-09-11 16:02:47.428871'),(9,'2025-09-11 16:03:22.368842',_binary '',3000.00,'가족상담','FAMILY_CONSULTATION',7,'2025-09-11 16:03:22.368843'),(10,'2025-09-11 16:03:22.371321',_binary '',5000.00,'초기상담','INITIAL_CONSULTATION',7,'2025-09-11 16:03:22.371321'),(11,'2025-09-11 16:03:48.378510',_binary '',3000.00,'가족상담','FAMILY_CONSULTATION',8,'2025-09-11 16:03:48.378510'),(12,'2025-09-11 16:03:48.383695',_binary '',5000.00,'초기상담','INITIAL_CONSULTATION',8,'2025-09-11 16:03:48.383695'),(13,'2025-09-11 16:04:07.507557',_binary '',3000.00,'가족상담','FAMILY_CONSULTATION',9,'2025-09-11 16:04:07.507558'),(14,'2025-09-11 16:04:07.511736',_binary '',5000.00,'초기상담','INITIAL_CONSULTATION',9,'2025-09-11 16:04:07.511737'),(15,'2025-09-11 16:32:00.934326',_binary '',3000.00,'가족상담','FAMILY_CONSULTATION',11,'2025-09-11 16:32:00.934327'),(16,'2025-09-11 16:32:00.940195',_binary '',5000.00,'초기상담','INITIAL_CONSULTATION',11,'2025-09-11 16:32:00.940197'),(17,'2025-09-11 16:43:34.668871',_binary '',3000.00,'가족상담','FAMILY_CONSULTATION',12,'2025-09-11 16:43:34.668879'),(18,'2025-09-11 16:43:34.675674',_binary '',5000.00,'초기상담','INITIAL_CONSULTATION',12,'2025-09-11 16:43:34.675680');
/*!40000 ALTER TABLE `consultant_salary_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultant_salary_profiles`
--

DROP TABLE IF EXISTS `consultant_salary_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultant_salary_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `base_salary` decimal(10,2) DEFAULT NULL,
  `consultant_id` bigint NOT NULL,
  `contract_end_date` datetime(6) DEFAULT NULL,
  `contract_start_date` datetime(6) DEFAULT NULL,
  `contract_terms` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `payment_cycle` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `is_business_registered` bit(1) DEFAULT NULL,
  `business_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_registration_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_consultant_salary_consultant_id` (`consultant_id`),
  KEY `idx_consultant_salary_type` (`salary_type`),
  KEY `idx_consultant_salary_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultant_salary_profiles`
--

LOCK TABLES `consultant_salary_profiles` WRITE;
/*!40000 ALTER TABLE `consultant_salary_profiles` DISABLE KEYS */;
INSERT INTO `consultant_salary_profiles` VALUES (1,30000.00,43,NULL,NULL,'프리랜서 상담사 - 기본 상담료 30,000원','2025-09-11 13:47:21.553391',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 13:51:15.776198',NULL,NULL,NULL),(2,30000.00,43,NULL,NULL,'프리랜서 상담사 - 기본 상담료 30,000원','2025-09-11 13:51:15.773380',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 14:28:24.287530',NULL,NULL,NULL),(3,35000.00,43,NULL,NULL,'','2025-09-11 14:28:24.282610',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 14:37:21.656000',NULL,NULL,NULL),(4,35000.00,43,NULL,NULL,'','2025-09-11 14:37:21.652881',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 14:44:59.281276',_binary '\0',NULL,NULL),(5,35000.00,43,NULL,NULL,'','2025-09-11 14:44:59.277949',NULL,_binary '',NULL,'FREELANCE','2025-09-11 14:44:59.277950',_binary '\0',NULL,NULL),(6,30000.00,45,NULL,NULL,'','2025-09-11 16:02:47.416442',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 16:03:22.366280',_binary '\0',NULL,NULL),(7,30000.00,45,NULL,NULL,'','2025-09-11 16:03:22.365170',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 16:43:34.661220',_binary '\0',NULL,NULL),(8,30000.00,41,NULL,NULL,'','2025-09-11 16:03:48.374668',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 16:04:07.501249',_binary '\0',NULL,NULL),(9,30000.00,41,NULL,NULL,'','2025-09-11 16:04:07.500132',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 16:31:27.990581',_binary '\0',NULL,NULL),(10,30000.00,41,NULL,NULL,'프리랜서 기본 상담료 30,000원','2025-09-11 16:31:27.987953',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 16:32:00.928073',_binary '\0',NULL,NULL),(11,30000.00,41,NULL,NULL,'','2025-09-11 16:32:00.926363',NULL,_binary '',NULL,'FREELANCE','2025-09-11 16:32:00.926364',_binary '\0',NULL,NULL),(12,30000.00,45,NULL,NULL,'','2025-09-11 16:43:34.651314',NULL,_binary '',NULL,'FREELANCE','2025-09-11 16:43:34.651325',_binary '\0',NULL,NULL),(13,30000.00,31,NULL,NULL,'','2025-09-11 17:19:02.011290',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 17:21:45.630326',_binary '\0',NULL,NULL),(14,30000.00,31,NULL,NULL,'','2025-09-11 17:21:45.628778',NULL,_binary '\0',NULL,'FREELANCE','2025-09-11 17:34:51.381230',_binary '\0',NULL,NULL),(15,30000.00,31,NULL,NULL,'','2025-09-11 17:34:51.373334',NULL,_binary '',NULL,'FREELANCE','2025-09-11 17:34:51.373334',_binary '\0',NULL,NULL);
/*!40000 ALTER TABLE `consultant_salary_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultants`
--

DROP TABLE IF EXISTS `consultants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultants` (
  `average_rating` double DEFAULT NULL,
  `awards_achievements` text COLLATE utf8mb4_unicode_ci,
  `break_between_sessions` int DEFAULT NULL,
  `break_time` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certification` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_hours` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_clients` int DEFAULT NULL,
  `education` text COLLATE utf8mb4_unicode_ci,
  `is_available` bit(1) DEFAULT NULL,
  `is_supervisor` bit(1) DEFAULT NULL,
  `last_consultation_date` date DEFAULT NULL,
  `max_clients` int DEFAULT NULL,
  `next_available_date` date DEFAULT NULL,
  `preferred_consultation_methods` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `professional_background` text COLLATE utf8mb4_unicode_ci,
  `research_publications` text COLLATE utf8mb4_unicode_ci,
  `session_duration` int DEFAULT NULL,
  `specialty` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialty_details` text COLLATE utf8mb4_unicode_ci,
  `success_rate` double DEFAULT NULL,
  `supervision_required` bit(1) DEFAULT NULL,
  `supervisor_id` bigint DEFAULT NULL,
  `total_clients` int DEFAULT NULL,
  `total_ratings` int DEFAULT NULL,
  `work_history` text COLLATE utf8mb4_unicode_ci,
  `years_of_experience` int DEFAULT NULL,
  `id` bigint NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `grade` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'CONSULTANT',
  PRIMARY KEY (`id`),
  KEY `idx_consultants_specialty` (`specialty`),
  KEY `idx_consultants_is_deleted` (`is_deleted`),
  KEY `idx_consultants_grade` (`grade`),
  CONSTRAINT `FKr01523mxgyc6q96skwno14yy9` FOREIGN KEY (`id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultants`
--

LOCK TABLES `consultants` WRITE;
/*!40000 ALTER TABLE `consultants` DISABLE KEYS */;
INSERT INTO `consultants` VALUES (NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'부부상담,아동상담,청소년상담',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,31,0,'CONSULTANT'),(0,NULL,10,NULL,NULL,NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,NULL,NULL,0,_binary '\0',NULL,0,0,NULL,0,41,0,'CONSULTANT'),(0,NULL,10,NULL,NULL,NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,NULL,NULL,0,_binary '\0',NULL,0,0,NULL,0,43,0,'CONSULTANT'),(0,NULL,10,NULL,NULL,NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,'DEPRESSION,ANXIETY,TRAUMA,SLEEP',NULL,0,_binary '\0',NULL,0,0,NULL,0,45,0,'CONSULTANT'),(0,NULL,10,NULL,'상담심리사 1급',NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,'심리상담',NULL,0,_binary '\0',NULL,0,0,NULL,0,56,0,'CONSULTANT'),(0,NULL,10,NULL,'상담심리사 1급',NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,'심리상담',NULL,0,_binary '\0',NULL,0,0,NULL,0,57,0,'CONSULTANT'),(0,NULL,10,NULL,NULL,NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,NULL,NULL,0,_binary '\0',NULL,0,0,NULL,0,63,0,'CONSULTANT'),(0,NULL,10,NULL,NULL,NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,NULL,NULL,0,_binary '\0',NULL,0,0,NULL,0,66,0,'CONSULTANT'),(0,NULL,10,NULL,NULL,NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,'ANXIETY,TRAUMA,RELATIONSHIP',NULL,0,_binary '\0',NULL,0,0,NULL,0,67,0,'CONSULTANT'),(0,NULL,10,NULL,NULL,NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,'ANXIETY,TRAUMA,RELATIONSHIP',NULL,0,_binary '\0',NULL,0,0,NULL,0,70,0,'CONSULTANT'),(0,NULL,10,NULL,NULL,NULL,0,NULL,_binary '',_binary '\0',NULL,20,NULL,NULL,NULL,NULL,50,'TRAUMA,RELATIONSHIP',NULL,0,_binary '\0',NULL,0,0,NULL,0,71,0,'CONSULTANT');
/*!40000 ALTER TABLE `consultants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_logs`
--

DROP TABLE IF EXISTS `consultation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `client_response` text COLLATE utf8mb4_unicode_ci,
  `client_satisfaction` int DEFAULT NULL,
  `consultant_self_evaluation` int DEFAULT NULL,
  `consultation_content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `consultation_date` date NOT NULL,
  `consultation_feedback` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_goals` text COLLATE utf8mb4_unicode_ci,
  `consultation_rating` int DEFAULT NULL,
  `consultation_type` enum('INITIAL','PROGRESS','COMPLETION','EMERGENCY','FOLLOW_UP','SUPERVISION','GROUP','FAMILY','COUPLE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `crisis_intervention` text COLLATE utf8mb4_unicode_ci,
  `end_time` datetime(6) DEFAULT NULL,
  `follow_up_plan` text COLLATE utf8mb4_unicode_ci,
  `follow_up_required` bit(1) DEFAULT NULL,
  `goal_achievement_rate` int DEFAULT NULL,
  `homework_assigned` text COLLATE utf8mb4_unicode_ci,
  `homework_completion_status` enum('NOT_ASSIGNED','ASSIGNED','IN_PROGRESS','COMPLETED','PARTIALLY_COMPLETED','NOT_COMPLETED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `homework_due_date` date DEFAULT NULL,
  `homework_feedback` text COLLATE utf8mb4_unicode_ci,
  `is_first_session` bit(1) DEFAULT NULL,
  `is_urgent_follow_up` bit(1) DEFAULT NULL,
  `main_issues` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `mood` enum('VERY_GOOD','GOOD','NORMAL','BAD','VERY_BAD') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `next_consultation_date` date DEFAULT NULL,
  `next_plan` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `progress_notes` text COLLATE utf8mb4_unicode_ci,
  `recommendations` text COLLATE utf8mb4_unicode_ci,
  `referral_details` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referral_made` bit(1) DEFAULT NULL,
  `risk_assessment` enum('LOW','MEDIUM','HIGH','VERY_HIGH') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_number` int DEFAULT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `supervision_date` date DEFAULT NULL,
  `supervision_notes` text COLLATE utf8mb4_unicode_ci,
  `supervisor_id` bigint DEFAULT NULL,
  `client_id` bigint NOT NULL,
  `consultant_id` bigint NOT NULL,
  `consultation_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKd66rcgiifdi5d7iq3lodt48jb` (`client_id`),
  KEY `FKds9auyohprnioypneu9erykct` (`consultant_id`),
  KEY `FK7oqxupgviej13uwgo3yior0ej` (`consultation_id`),
  CONSTRAINT `FK7oqxupgviej13uwgo3yior0ej` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`),
  CONSTRAINT `FKd66rcgiifdi5d7iq3lodt48jb` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `FKds9auyohprnioypneu9erykct` FOREIGN KEY (`consultant_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_logs`
--

LOCK TABLES `consultation_logs` WRITE;
/*!40000 ALTER TABLE `consultation_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_messages`
--

DROP TABLE IF EXISTS `consultation_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `archived_at` datetime(6) DEFAULT NULL,
  `attachments` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` bigint NOT NULL,
  `consultant_id` bigint NOT NULL,
  `consultation_id` bigint DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivered_at` datetime(6) DEFAULT NULL,
  `delivery_channel` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_result` text COLLATE utf8mb4_unicode_ci,
  `is_archived` bit(1) DEFAULT NULL,
  `is_delivered` bit(1) DEFAULT NULL,
  `is_important` bit(1) DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `is_urgent` bit(1) DEFAULT NULL,
  `message_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `read_at` datetime(6) DEFAULT NULL,
  `receiver_id` bigint NOT NULL,
  `replied_at` datetime(6) DEFAULT NULL,
  `reply_to_message_id` bigint DEFAULT NULL,
  `scheduled_send_at` datetime(6) DEFAULT NULL,
  `sender_id` bigint NOT NULL,
  `sender_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_consultation_messages_consultant_id` (`consultant_id`),
  KEY `idx_consultation_messages_client_id` (`client_id`),
  KEY `idx_consultation_messages_consultation_id` (`consultation_id`),
  KEY `idx_consultation_messages_sender_type` (`sender_type`),
  KEY `idx_consultation_messages_created_at` (`created_at`),
  KEY `idx_consultation_messages_is_deleted` (`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_messages`
--

LOCK TABLES `consultation_messages` WRITE;
/*!40000 ALTER TABLE `consultation_messages` DISABLE KEYS */;
INSERT INTO `consultation_messages` VALUES (1,'2025-09-09 09:41:05.827072',NULL,_binary '\0','2025-09-09 09:41:05.827072',0,NULL,NULL,1,41,30,'테스트 내용',NULL,'SYSTEM',NULL,_binary '\0',_binary '\0',_binary '\0',_binary '\0',_binary '\0','GENERAL',NULL,NULL,1,NULL,NULL,NULL,41,'CONSULTANT','2025-09-09 09:41:05.818591','SENT','테스트 메시지'),(2,'2025-09-09 09:44:40.985448',NULL,_binary '\0','2025-09-09 09:44:40.985448',0,NULL,NULL,36,41,30,'안녕하세요 테스트내담자003님,\n\n상담 일지가 작성되었습니다.\n\n상담 일시: 2025. 9. 26. 오후 5:30:00\n\n추가 문의사항이 있으시면 언제든지 연락주세요.\n\n감사합니다.',NULL,'SYSTEM',NULL,_binary '\0',_binary '\0',_binary '\0',_binary '\0',_binary '\0','GENERAL',NULL,NULL,36,NULL,NULL,NULL,41,'CONSULTANT','2025-09-09 09:44:40.984745','SENT','상담 일지 작성 완료 - 김상담신규 - 테스트내담자003'),(3,'2025-09-09 10:02:14.910605',NULL,_binary '\0','2025-09-09 10:02:14.910605',0,NULL,NULL,36,41,27,'안녕하세요 테스트내담자003님,\n\n상담 일지가 작성되었습니다.\n\n상담 일시: 2025. 9. 23. 오후 4:00:00\n\n추가 문의사항이 있으시면 언제든지 연락주세요.\n\n감사합니다.',NULL,'SYSTEM',NULL,_binary '\0',_binary '\0',_binary '\0',_binary '\0',_binary '\0','GENERAL',NULL,NULL,36,NULL,NULL,NULL,41,'CONSULTANT','2025-09-09 10:02:14.908953','SENT','상담 일지 작성 완료 - 김상담신규 - 테스트내담자003'),(4,'2025-09-09 11:14:02.836914',NULL,_binary '\0','2025-09-09 11:17:24.057061',1,NULL,NULL,23,43,35,'안녕하세요 이재학님,\n\n상담 일지가 작성되었습니다.\n\n상담 일시: 2025. 9. 24. 오후 4:30:00\n\n추가 문의사항이 있으시면 언제든지 연락주세요.\n\n감사합니다.',NULL,'SYSTEM',NULL,_binary '\0',_binary '\0',_binary '\0',_binary '',_binary '\0','GENERAL',NULL,'2025-09-09 11:17:24.055981',23,NULL,NULL,NULL,43,'CONSULTANT','2025-09-09 11:14:02.834245','READ','상담 일지 작성 완료 - 김선희 - 이재학'),(5,'2025-09-12 23:42:25.932840',NULL,_binary '\0','2025-09-13 00:00:36.716680',1,NULL,NULL,23,43,36,'안녕하세요 미지정님,\n\n상담 일지가 작성되었습니다.\n\n상담 일시: 2025. 9. 23. 오후 2:00:00\n\n추가 문의사항이 있으시면 언제든지 연락주세요.\n\n감사합니다.',NULL,'SYSTEM',NULL,_binary '\0',_binary '\0',_binary '\0',_binary '',_binary '\0','GENERAL',NULL,'2025-09-13 00:00:36.714820',23,NULL,NULL,NULL,43,'CONSULTANT','2025-09-12 23:42:25.929590','READ','상담 일지 작성 완료 - 김선희 - 이재학');
/*!40000 ALTER TABLE `consultation_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_records`
--

DROP TABLE IF EXISTS `consultation_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `client_condition` text COLLATE utf8mb4_unicode_ci,
  `client_id` bigint NOT NULL,
  `client_response` text COLLATE utf8mb4_unicode_ci,
  `completion_time` datetime(6) DEFAULT NULL,
  `consultant_assessment` text COLLATE utf8mb4_unicode_ci,
  `consultant_id` bigint NOT NULL,
  `consultant_observations` text COLLATE utf8mb4_unicode_ci,
  `consultation_id` bigint NOT NULL,
  `emergency_response_plan` text COLLATE utf8mb4_unicode_ci,
  `environmental_factors` text COLLATE utf8mb4_unicode_ci,
  `family_relationships` text COLLATE utf8mb4_unicode_ci,
  `follow_up_actions` text COLLATE utf8mb4_unicode_ci,
  `follow_up_due_date` date DEFAULT NULL,
  `goal_achievement` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `goal_achievement_details` text COLLATE utf8mb4_unicode_ci,
  `homework_assigned` text COLLATE utf8mb4_unicode_ci,
  `homework_due_date` date DEFAULT NULL,
  `incompletion_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `intervention_methods` text COLLATE utf8mb4_unicode_ci,
  `is_session_completed` bit(1) DEFAULT NULL,
  `main_issues` text COLLATE utf8mb4_unicode_ci,
  `medical_information` text COLLATE utf8mb4_unicode_ci,
  `medication_info` text COLLATE utf8mb4_unicode_ci,
  `next_session_date` date DEFAULT NULL,
  `next_session_plan` text COLLATE utf8mb4_unicode_ci,
  `progress_evaluation` text COLLATE utf8mb4_unicode_ci,
  `progress_score` int DEFAULT NULL,
  `risk_assessment` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `risk_factors` text COLLATE utf8mb4_unicode_ci,
  `session_date` date NOT NULL,
  `session_duration_minutes` int DEFAULT NULL,
  `session_number` int DEFAULT NULL,
  `social_support` text COLLATE utf8mb4_unicode_ci,
  `special_considerations` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_consultation_records_consultation_id` (`consultation_id`),
  KEY `idx_consultation_records_client_id` (`client_id`),
  KEY `idx_consultation_records_consultant_id` (`consultant_id`),
  KEY `idx_consultation_records_session_date` (`session_date`),
  KEY `idx_consultation_records_is_deleted` (`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_records`
--

LOCK TABLES `consultation_records` WRITE;
/*!40000 ALTER TABLE `consultation_records` DISABLE KEYS */;
INSERT INTO `consultation_records` VALUES (1,'2025-09-09 10:01:04.709873',NULL,_binary '\0','2025-09-09 10:04:29.007445',1,'1',36,'1','2025-09-09 10:04:28.998733','',41,'',27,'','','','',NULL,'MEDIUM','','1',NULL,'','1',_binary '','','','',NULL,'1','',50,'LOW','','2025-09-23',60,1,'',''),(2,'2025-09-09 10:01:18.614176',NULL,_binary '\0','2025-09-09 10:01:18.614176',0,'1',36,'1','2025-09-09 10:01:18.613900','',41,'',27,'','','','',NULL,'MEDIUM','','1',NULL,'','1',_binary '','','','',NULL,'1','',50,'LOW','','2025-09-23',60,1,'',''),(3,'2025-09-12 23:42:07.122385',NULL,_binary '\0','2025-09-14 23:39:35.855872',1,NULL,23,NULL,'2025-09-14 23:39:35.844783',NULL,43,'\n[시스템 정리] 불일치 데이터 복구 - 2025-09-14T23:39:35.840617',36,NULL,NULL,NULL,NULL,NULL,'MEDIUM',NULL,NULL,NULL,NULL,NULL,_binary '',NULL,NULL,NULL,NULL,NULL,NULL,50,'LOW',NULL,'2025-09-23',60,1,NULL,NULL),(4,'2025-09-12 23:42:10.292653',NULL,_binary '\0','2025-09-12 23:42:10.292653',0,'',23,'','2025-09-12 23:42:10.292137','',43,'',36,'','111','111','',NULL,'MEDIUM','','',NULL,'','',_binary '','','','111',NULL,'','',50,'LOW','','2025-09-23',60,1,'','');
/*!40000 ALTER TABLE `consultation_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations`
--

DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `cancellation_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancelled_at` datetime(6) DEFAULT NULL,
  `cancelled_by` bigint DEFAULT NULL,
  `client_preparation_notes` text COLLATE utf8mb4_unicode_ci,
  `consultant_notes` text COLLATE utf8mb4_unicode_ci,
  `consultant_preparation_notes` text COLLATE utf8mb4_unicode_ci,
  `consultation_date` date DEFAULT NULL,
  `consultation_feedback` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_goals` text COLLATE utf8mb4_unicode_ci,
  `consultation_method` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_rating` int DEFAULT NULL,
  `consultation_summary` text COLLATE utf8mb4_unicode_ci,
  `consultation_type` enum('INITIAL','PROGRESS','COMPLETION','EMERGENCY','FOLLOW_UP','SUPERVISION','GROUP','FAMILY','COUPLE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_minutes` int DEFAULT NULL,
  `emergency_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `end_time` time(6) NOT NULL,
  `homework_assigned` text COLLATE utf8mb4_unicode_ci,
  `is_emergency` bit(1) DEFAULT NULL,
  `is_first_session` bit(1) DEFAULT NULL,
  `location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `next_consultation_plan` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `preparation_notes` text COLLATE utf8mb4_unicode_ci,
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reminder_sent` bit(1) DEFAULT NULL,
  `reminder_sent_at` datetime(6) DEFAULT NULL,
  `rescheduled_from` bigint DEFAULT NULL,
  `rescheduled_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `risk_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_number` int DEFAULT NULL,
  `special_considerations` text COLLATE utf8mb4_unicode_ci,
  `start_time` time(6) NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` bigint NOT NULL,
  `consultant_id` bigint NOT NULL,
  `cancellation_date` datetime(6) DEFAULT NULL,
  `client_feedback` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_satisfaction_rating` int DEFAULT NULL,
  `confirmation_date` datetime(6) DEFAULT NULL,
  `consultation_content` text COLLATE utf8mb4_unicode_ci,
  `consultation_location` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `homework_due_date` date DEFAULT NULL,
  `next_consultation_date` date DEFAULT NULL,
  `request_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_consultations_client_id` (`client_id`),
  KEY `idx_consultations_consultant_id` (`consultant_id`),
  KEY `idx_consultations_status` (`status`),
  KEY `idx_consultations_consultation_date` (`consultation_date`),
  KEY `idx_consultations_is_deleted` (`is_deleted`),
  CONSTRAINT `FKpdlcsxkv3o4um0q5f33w5kkl0` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `FKr574x6oti66vw9m4kwfic0qif` FOREIGN KEY (`consultant_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations`
--

LOCK TABLES `consultations` WRITE;
/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
INSERT INTO `consultations` VALUES (4,'2025-09-11 14:46:58.000000',NULL,_binary '\0','2025-09-11 14:46:58.000000',0,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-10',NULL,NULL,NULL,NULL,NULL,'INITIAL',60,NULL,'15:00:00.000000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'14:00:00.000000','COMPLETED','테스트 상담 1',1,43,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'2025-09-11 14:46:58.000000',NULL,_binary '\0','2025-09-11 14:46:58.000000',0,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-11',NULL,NULL,NULL,NULL,NULL,'INITIAL',90,NULL,'11:30:00.000000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'10:00:00.000000','COMPLETED','테스트 상담 2',2,43,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'2025-09-11 14:46:58.000000',NULL,_binary '\0','2025-09-11 14:46:58.000000',0,NULL,NULL,NULL,NULL,NULL,NULL,'2025-09-11',NULL,NULL,NULL,NULL,NULL,'INITIAL',120,NULL,'17:00:00.000000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'15:00:00.000000','COMPLETED','테스트 상담 3',1,43,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `consultations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `css_color_settings`
--

DROP TABLE IF EXISTS `css_color_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `css_color_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `theme_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테마명',
  `color_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '색상 키 (예: PRIMARY, SUCCESS)',
  `color_value` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '색상 값 (예: #667eea)',
  `color_type` enum('hex','rgb','rgba','gradient') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hex' COMMENT '색상 타입',
  `color_category` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '색상 카테고리 (PRIMARY, SECONDARY, STATUS, FUNCTIONAL)',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '색상 설명',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '활성 여부',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `version` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_theme_color` (`theme_name`,`color_key`),
  KEY `idx_theme_name` (`theme_name`),
  KEY `idx_color_category` (`color_category`),
  CONSTRAINT `css_color_settings_ibfk_1` FOREIGN KEY (`theme_name`) REFERENCES `css_theme_metadata` (`theme_name`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CSS 색상 설정';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `css_color_settings`
--

LOCK TABLES `css_color_settings` WRITE;
/*!40000 ALTER TABLE `css_color_settings` DISABLE KEYS */;
INSERT INTO `css_color_settings` VALUES (1,'default','PRIMARY','#667eea','hex','PRIMARY','주요 브랜드 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(2,'default','PRIMARY_DARK','#764ba2','hex','PRIMARY','주요 브랜드 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(3,'default','PRIMARY_GRADIENT','linear-gradient(135deg, #667eea 0%, #764ba2 100%)','gradient','PRIMARY','주요 브랜드 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(4,'default','SECONDARY','#6c757d','hex','SECONDARY','보조 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(5,'default','SECONDARY_LIGHT','#e9ecef','hex','SECONDARY','보조 색상 밝은 버전',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(6,'default','SUCCESS','#00b894','hex','STATUS','성공 상태 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(7,'default','SUCCESS_LIGHT','#d4edda','hex','STATUS','성공 상태 밝은 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(8,'default','SUCCESS_DARK','#00a085','hex','STATUS','성공 상태 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(9,'default','SUCCESS_GRADIENT','linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)','gradient','STATUS','성공 상태 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(10,'default','DANGER','#ff6b6b','hex','STATUS','위험 상태 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(11,'default','DANGER_LIGHT','#f8d7da','hex','STATUS','위험 상태 밝은 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(12,'default','DANGER_DARK','#ee5a24','hex','STATUS','위험 상태 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(13,'default','DANGER_GRADIENT','linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)','gradient','STATUS','위험 상태 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(14,'default','INFO','#74b9ff','hex','STATUS','정보 상태 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(15,'default','INFO_LIGHT','#d1ecf1','hex','STATUS','정보 상태 밝은 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(16,'default','INFO_DARK','#0984e3','hex','STATUS','정보 상태 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(17,'default','INFO_GRADIENT','linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)','gradient','STATUS','정보 상태 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(18,'default','WARNING','#f093fb','hex','STATUS','경고 상태 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(19,'default','WARNING_LIGHT','#fff3cd','hex','STATUS','경고 상태 밝은 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(20,'default','WARNING_DARK','#f5576c','hex','STATUS','경고 상태 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(21,'default','WARNING_GRADIENT','linear-gradient(135deg, #f093fb 0%, #f5576c 100%)','gradient','STATUS','경고 상태 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(22,'default','CONSULTANT','#a29bfe','hex','FUNCTIONAL','상담사 관련 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(23,'default','CONSULTANT_DARK','#6c5ce7','hex','FUNCTIONAL','상담사 관련 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(24,'default','CONSULTANT_GRADIENT','linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)','gradient','FUNCTIONAL','상담사 관련 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(25,'default','CLIENT','#00b894','hex','FUNCTIONAL','내담자 관련 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(26,'default','CLIENT_DARK','#00a085','hex','FUNCTIONAL','내담자 관련 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(27,'default','CLIENT_GRADIENT','linear-gradient(135deg, #00b894 0%, #00a085 100%)','gradient','FUNCTIONAL','내담자 관련 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(28,'default','FINANCE','#f39c12','hex','FUNCTIONAL','재정 관련 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(29,'default','FINANCE_DARK','#e67e22','hex','FUNCTIONAL','재정 관련 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(30,'default','FINANCE_GRADIENT','linear-gradient(135deg, #f39c12 0%, #e67e22 100%)','gradient','FUNCTIONAL','재정 관련 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(31,'corporate','PRIMARY','#1e3a8a','hex','PRIMARY','기업용 주요 색상 (네이비)',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(32,'corporate','PRIMARY_DARK','#1e40af','hex','PRIMARY','기업용 주요 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(33,'corporate','PRIMARY_GRADIENT','linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)','gradient','PRIMARY','기업용 주요 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(34,'corporate','SUCCESS','#059669','hex','STATUS','기업용 성공 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(35,'corporate','DANGER','#dc2626','hex','STATUS','기업용 위험 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(36,'corporate','INFO','#0284c7','hex','STATUS','기업용 정보 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(37,'corporate','WARNING','#d97706','hex','STATUS','기업용 경고 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(38,'corporate','CONSULTANT','#7c3aed','hex','FUNCTIONAL','기업용 상담사 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(39,'corporate','CLIENT','#059669','hex','FUNCTIONAL','기업용 내담자 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(40,'corporate','FINANCE','#ea580c','hex','FUNCTIONAL','기업용 재정 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(41,'warm','PRIMARY','#ea580c','hex','PRIMARY','따뜻한 주요 색상 (오렌지)',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(42,'warm','PRIMARY_DARK','#c2410c','hex','PRIMARY','따뜻한 주요 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(43,'warm','PRIMARY_GRADIENT','linear-gradient(135deg, #ea580c 0%, #f97316 100%)','gradient','PRIMARY','따뜻한 주요 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(44,'warm','SUCCESS','#16a34a','hex','STATUS','따뜻한 성공 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(45,'warm','DANGER','#dc2626','hex','STATUS','따뜻한 위험 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(46,'warm','INFO','#0891b2','hex','STATUS','따뜻한 정보 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(47,'warm','WARNING','#ca8a04','hex','STATUS','따뜻한 경고 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(48,'warm','CONSULTANT','#9333ea','hex','FUNCTIONAL','따뜻한 상담사 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(49,'warm','CLIENT','#16a34a','hex','FUNCTIONAL','따뜻한 내담자 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(50,'warm','FINANCE','#dc2626','hex','FUNCTIONAL','따뜻한 재정 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(51,'cool','PRIMARY','#0891b2','hex','PRIMARY','시원한 주요 색상 (청록)',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(52,'cool','PRIMARY_DARK','#0e7490','hex','PRIMARY','시원한 주요 어두운 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(53,'cool','PRIMARY_GRADIENT','linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)','gradient','PRIMARY','시원한 주요 그라데이션',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(54,'cool','SUCCESS','#059669','hex','STATUS','시원한 성공 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(55,'cool','DANGER','#dc2626','hex','STATUS','시원한 위험 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(56,'cool','INFO','#0284c7','hex','STATUS','시원한 정보 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(57,'cool','WARNING','#d97706','hex','STATUS','시원한 경고 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(58,'cool','CONSULTANT','#7c3aed','hex','FUNCTIONAL','시원한 상담사 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(59,'cool','CLIENT','#059669','hex','FUNCTIONAL','시원한 내담자 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),(60,'cool','FINANCE','#0891b2','hex','FUNCTIONAL','시원한 재정 색상',1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0);
/*!40000 ALTER TABLE `css_color_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `css_theme_metadata`
--

DROP TABLE IF EXISTS `css_theme_metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `css_theme_metadata` (
  `theme_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테마 표시명',
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '테마 설명',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '활성 여부',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT '기본 테마 여부',
  `display_order` int DEFAULT '0' COMMENT '표시 순서',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `version` bigint NOT NULL,
  PRIMARY KEY (`theme_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CSS 테마 메타데이터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `css_theme_metadata`
--

LOCK TABLES `css_theme_metadata` WRITE;
/*!40000 ALTER TABLE `css_theme_metadata` DISABLE KEYS */;
INSERT INTO `css_theme_metadata` VALUES ('cool','시원한 테마','시원한 청록-파랑 테마',1,0,4,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),('corporate','기업 테마','기업용 블루 테마',1,0,2,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),('default','기본 테마','MindGarden 기본 테마 (보라-파랑 그라데이션)',1,1,1,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0),('warm','따뜻한 테마','따뜻한 오렌지-빨강 테마',1,0,3,'2025-09-14 06:49:36','2025-09-14 06:49:36',NULL,_binary '\0',0);
/*!40000 ALTER TABLE `css_theme_metadata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_humor`
--

DROP TABLE IF EXISTS `daily_humor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_humor` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consultant_role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_humor`
--

LOCK TABLES `daily_humor` WRITE;
/*!40000 ALTER TABLE `daily_humor` DISABLE KEYS */;
INSERT INTO `daily_humor` VALUES (1,'WORK','CONSULTANT','상담사: \"오늘은 어떤 기분이세요?\"\n내담자: \"좋지 않아요...\"\n상담사: \"그럼 좋지 않은 기분을 자세히 말씀해주세요.\"\n내담자: \"상담사님이 너무 예뻐서 집중이 안 돼요.\"\n상담사: \"...그럼 오늘은 여기까지 하겠습니다.\"',NULL,NULL,NULL),(2,'WORK','CONSULTANT','상담사가 가장 많이 듣는 말 TOP 3:\n1. \"상담사님은 항상 차분하시네요.\"\n2. \"상담사님은 이해심이 많으시네요.\"\n3. \"상담사님은 진짜 상담사 맞나요?\"',NULL,NULL,NULL),(3,'WORK','CONSULTANT','상담사: \"우울할 때는 밝은 곳에 나가보세요.\"\n내담자: \"상담사님 얼굴만 봐도 충분히 밝아져요!\"\n상담사: \"그럼 제가 조명을 끄고 상담하겠습니다.\"',NULL,NULL,NULL),(4,'LIFE','CONSULTANT','상담사 생활의 현실:\n- 아침: \"오늘은 힘든 내담자 없이 평화로운 하루가 되길...\"\n- 오후: \"아, 오늘도 힘든 하루구나...\"\n- 저녁: \"내일은 더 좋은 하루가 될 거야...\"',NULL,NULL,NULL),(5,'LIFE','CONSULTANT','상담사가 가장 두려워하는 것:\n1. \"상담사님도 힘드시죠?\"\n2. \"상담사님은 상담받으시나요?\"\n3. \"상담사님은 완벽하시네요.\"',NULL,NULL,NULL),(6,'WORK','CLIENT','내담자가 가장 많이 하는 말 TOP 3:\n1. \"상담사님은 이해하실 것 같아요.\"\n2. \"이런 말씀 드려도 될까요?\"\n3. \"상담사님은 정말 신기해요.\"',NULL,NULL,NULL),(7,'WORK','CLIENT','상담 첫날 내담자: \"상담사님은 정말 신기해요.\"\n상담사: \"어떤 점이 신기하신가요?\"\n내담자: \"제 마음을 다 알고 계시네요!\"\n상담사: \"저는 그냥 듣고 있을 뿐인데요...\"',NULL,NULL,NULL),(8,'LIFE','CLIENT','내담자: \"상담을 받으니까 마음이 편해져요.\"\n상담사: \"그렇다니 다행이에요.\"\n내담자: \"그런데 집에 가면 또 힘들어져요.\"\n상담사: \"그럴 때마다 생각해보세요...\"\n내담자: \"생각하면 더 힘들어져요.\"',NULL,NULL,NULL),(9,'LIFE','CLIENT','상담 받는 내담자의 마음:\n- 상담실 입장 전: \"오늘은 진짜 열심히 해야지!\"\n- 상담 중: \"아, 또 울고 말았네...\"\n- 상담 후: \"역시 상담은 힘들어...\"',NULL,NULL,NULL),(10,'LIFE','CLIENT','내담자가 가장 두려워하는 것:\n1. \"상담사님이 실망하실까봐...\"\n2. \"내 문제가 너무 사소할까봐...\"\n3. \"상담사님도 힘드실까봐...\"',NULL,NULL,NULL),(11,'WORK','CONSULTANT','상담사: \"오늘은 어떤 기분이세요?\"\n내담자: \"좋지 않아요...\"\n상담사: \"그럼 좋지 않은 기분을 자세히 말씀해주세요.\"\n내담자: \"상담사님이 너무 예뻐서 집중이 안 돼요.\"\n상담사: \"...그럼 오늘은 여기까지 하겠습니다.\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000'),(12,'WORK','CONSULTANT','상담사가 가장 많이 듣는 말 TOP 3:\n1. \"상담사님은 항상 차분하시네요.\"\n2. \"상담사님은 이해심이 많으시네요.\"\n3. \"상담사님은 진짜 상담사 맞나요?\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000'),(13,'WORK','CONSULTANT','상담사: \"우울할 때는 밝은 곳에 나가보세요.\"\n내담자: \"상담사님 얼굴만 봐도 충분히 밝아져요!\"\n상담사: \"그럼 제가 조명을 끄고 상담하겠습니다.\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000'),(14,'LIFE','CONSULTANT','상담사 생활의 현실:\n- 아침: \"오늘은 힘든 내담자 없이 평화로운 하루가 되길...\"\n- 오후: \"아, 오늘도 힘든 하루구나...\"\n- 저녁: \"내일은 더 좋은 하루가 될 거야...\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000'),(15,'LIFE','CONSULTANT','상담사가 가장 두려워하는 것:\n1. \"상담사님도 힘드시죠?\"\n2. \"상담사님은 상담받으시나요?\"\n3. \"상담사님은 완벽하시네요.\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000'),(16,'WORK','CLIENT','내담자가 가장 많이 하는 말 TOP 3:\n1. \"상담사님은 이해하실 것 같아요.\"\n2. \"이런 말씀 드려도 될까요?\"\n3. \"상담사님은 정말 신기해요.\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000'),(17,'WORK','CLIENT','상담 첫날 내담자: \"상담사님은 정말 신기해요.\"\n상담사: \"어떤 점이 신기하신가요?\"\n내담자: \"제 마음을 다 알고 계시네요!\"\n상담사: \"저는 그냥 듣고 있을 뿐인데요...\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000'),(18,'LIFE','CLIENT','내담자: \"상담을 받으니까 마음이 편해져요.\"\n상담사: \"그렇다니 다행이에요.\"\n내담자: \"그런데 집에 가면 또 힘들어져요.\"\n상담사: \"그럴 때마다 생각해보세요...\"\n내담자: \"생각하면 더 힘들어져요.\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000'),(19,'LIFE','CLIENT','상담 받는 내담자의 마음:\n- 상담실 입장 전: \"오늘은 진짜 열심히 해야지!\"\n- 상담 중: \"아, 또 울고 말았네...\"\n- 상담 후: \"역시 상담은 힘들어...\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000'),(20,'LIFE','CLIENT','내담자가 가장 두려워하는 것:\n1. \"상담사님이 실망하실까봐...\"\n2. \"내 문제가 너무 사소할까봐...\"\n3. \"상담사님도 힘드실까봐...\"','2025-09-14 21:55:17.000000',_binary '','2025-09-14 21:55:17.000000');
/*!40000 ALTER TABLE `daily_humor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discounts`
--

DROP TABLE IF EXISTS `discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `applied_at` datetime(6) NOT NULL,
  `applied_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consultation_id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `discount_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKpclb09it42c244ahi4vhfjuto` (`consultation_id`),
  CONSTRAINT `FKpclb09it42c244ahi4vhfjuto` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discounts`
--

LOCK TABLES `discounts` WRITE;
/*!40000 ALTER TABLE `discounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `erp_budgets`
--

DROP TABLE IF EXISTS `erp_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `erp_budgets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `month` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remaining_budget` decimal(15,2) NOT NULL,
  `total_budget` decimal(15,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `used_budget` decimal(15,2) NOT NULL,
  `year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `manager_id` bigint DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','EXHAUSTED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjd2wyicy10a3xgy2c4qi8c9xe` (`manager_id`),
  CONSTRAINT `FKjd2wyicy10a3xgy2c4qi8c9xe` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `erp_budgets`
--

LOCK TABLES `erp_budgets` WRITE;
/*!40000 ALTER TABLE `erp_budgets` DISABLE KEYS */;
INSERT INTO `erp_budgets` VALUES (1,'OPERATING','2025-09-15 09:41:55.000000','일반적인 운영 비용',_binary '','01','2024년 운영비',6500000.00,10000000.00,'2025-09-15 09:41:55.000000',3500000.00,'2024',1,'ACTIVE'),(2,'MARKETING','2025-09-15 09:41:55.000000','마케팅 및 홍보 비용',_binary '','01','2024년 마케팅비',3800000.00,5000000.00,'2025-09-15 09:41:55.000000',1200000.00,'2024',1,'ACTIVE'),(3,'EQUIPMENT','2025-09-15 09:41:55.000000','장비 구매 및 유지보수 비용',_binary '','01','2024년 장비비',2000000.00,8000000.00,'2025-09-15 09:41:55.000000',6000000.00,'2024',1,'ACTIVE');
/*!40000 ALTER TABLE `erp_budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `erp_items`
--

DROP TABLE IF EXISTS `erp_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `erp_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock_quantity` int NOT NULL,
  `supplier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `branch_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `erp_items`
--

LOCK TABLES `erp_items` WRITE;
/*!40000 ALTER TABLE `erp_items` DISABLE KEYS */;
INSERT INTO `erp_items` VALUES (1,'office_supplies','2025-09-10 13:13:17.000000',NULL,'일반 A4 복사용지 500매',_binary '',_binary '\0','A4용지',100,'한국문구','박스',5000.00,'2025-09-10 13:13:17.000000',NULL),(2,'office_supplies','2025-09-10 13:13:17.000000',NULL,'일반 볼펜 검정색 12자루',_binary '',_binary '\0','볼펜 (검정)',50,'한국문구','세트',3000.00,'2025-09-10 13:13:17.000000',NULL),(3,'office_supplies','2025-09-10 13:13:17.000000',NULL,'화이트보드용 마커펜 4색 세트',_binary '',_binary '\0','마커펜',30,'한국문구','세트',8000.00,'2025-09-10 13:13:17.000000',NULL),(4,'counseling_tools','2025-09-10 13:13:17.000000',NULL,'상담 기록용 노트 A4 100매',_binary '',_binary '\0','상담용 노트',25,'상담용품','권',12000.00,'2025-09-10 13:13:17.000000',NULL),(5,'counseling_tools','2025-09-10 13:13:17.000000',NULL,'아동 상담용 감정 표현 카드',_binary '',_binary '\0','감정카드',15,'상담용품','세트',25000.00,'2025-09-10 13:13:17.000000',NULL),(6,'counseling_tools','2025-09-10 13:13:17.000000',NULL,'모래놀이 치료용 트레이',_binary '',_binary '\0','샌드트레이',8,'상담용품','개',45000.00,'2025-09-10 13:13:17.000000',NULL),(7,'furniture','2025-09-10 13:13:17.000000',NULL,'인체공학적 사무용 의자',_binary '',_binary '\0','사무용 의자',5,'가구전문점','개',150000.00,'2025-09-10 13:13:17.000000',NULL),(8,'furniture','2025-09-10 13:13:17.000000',NULL,'1인용 사무용 책상',_binary '',_binary '\0','책상',3,'가구전문점','개',200000.00,'2025-09-10 13:13:17.000000',NULL),(9,'electronics','2025-09-10 13:13:17.000000',NULL,'24인치 LED 모니터',_binary '',_binary '\0','모니터',10,'전자제품','대',180000.00,'2025-09-10 13:13:17.000000',NULL),(10,'books','2025-09-10 13:13:17.000000',NULL,'상담 심리학 교재',_binary '',_binary '\0','상담 심리학',20,'출판사','권',35000.00,'2025-09-10 13:13:17.000000',NULL),(11,'OFFICE_SUPPLIES','2025-09-10 13:38:52.952808',NULL,'테스트',_binary '',_binary '\0','테스트',1,'테스트',NULL,1000.00,'2025-09-10 13:38:52.952858',NULL);
/*!40000 ALTER TABLE `erp_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `erp_purchase_orders`
--

DROP TABLE IF EXISTS `erp_purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `erp_purchase_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `delivered_at` datetime(6) DEFAULT NULL,
  `expected_delivery_date` datetime(6) DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ordered_at` datetime(6) DEFAULT NULL,
  `status` enum('PENDING','ORDERED','IN_TRANSIT','DELIVERED','CANCELLED','RETURNED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_contact` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `purchase_request_id` bigint NOT NULL,
  `purchaser_id` bigint DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_fl2ts1mi4vtudpabndubd413m` (`purchase_request_id`),
  KEY `FKon0hdeh6vjarartlr2yska8l8` (`purchaser_id`),
  CONSTRAINT `FKon0hdeh6vjarartlr2yska8l8` FOREIGN KEY (`purchaser_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKsj3er7xvdmd0p58ql7inul5k6` FOREIGN KEY (`purchase_request_id`) REFERENCES `erp_purchase_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `erp_purchase_orders`
--

LOCK TABLES `erp_purchase_orders` WRITE;
/*!40000 ALTER TABLE `erp_purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `erp_purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `erp_purchase_requests`
--

DROP TABLE IF EXISTS `erp_purchase_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `erp_purchase_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_approved_at` datetime(6) DEFAULT NULL,
  `admin_comment` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `quantity` int NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','ADMIN_APPROVED','ADMIN_REJECTED','SUPER_ADMIN_APPROVED','SUPER_ADMIN_REJECTED','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `super_admin_approved_at` datetime(6) DEFAULT NULL,
  `super_admin_comment` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `admin_approver_id` bigint DEFAULT NULL,
  `item_id` bigint NOT NULL,
  `requester_id` bigint NOT NULL,
  `super_admin_approver_id` bigint DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK7ojpvic0pxdrsaassvo3iyi6u` (`admin_approver_id`),
  KEY `FK3531t7mg64sn17u0bs1vdnwqg` (`item_id`),
  KEY `FKiid65g40fgp92ohky9bc8l3pk` (`requester_id`),
  KEY `FKh100lxg5812hx78ts3kmks79h` (`super_admin_approver_id`),
  CONSTRAINT `FK3531t7mg64sn17u0bs1vdnwqg` FOREIGN KEY (`item_id`) REFERENCES `erp_items` (`id`),
  CONSTRAINT `FK7ojpvic0pxdrsaassvo3iyi6u` FOREIGN KEY (`admin_approver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKh100lxg5812hx78ts3kmks79h` FOREIGN KEY (`super_admin_approver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKiid65g40fgp92ohky9bc8l3pk` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `erp_purchase_requests`
--

LOCK TABLES `erp_purchase_requests` WRITE;
/*!40000 ALTER TABLE `erp_purchase_requests` DISABLE KEYS */;
INSERT INTO `erp_purchase_requests` VALUES (1,'2025-09-10 13:17:52.062232','','2025-09-10 13:14:08.246972',1,'비품','ADMIN_APPROVED',NULL,NULL,12000.00,12000.00,'2025-09-10 13:17:52.082554',1,4,1,NULL,_binary '');
/*!40000 ALTER TABLE `erp_purchase_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `error_messages`
--

DROP TABLE IF EXISTS `error_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `error_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `alert_priority` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `average_occurrence_interval` bigint DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_language` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deprecated_at` datetime(6) DEFAULT NULL,
  `deprecation_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `developer_message` text COLLATE utf8mb4_unicode_ci,
  `documentation_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_group` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_subgroup` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_occurrence` datetime(6) DEFAULT NULL,
  `http_status_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_alerted` bit(1) DEFAULT NULL,
  `is_deprecated` bit(1) DEFAULT NULL,
  `is_localized` bit(1) DEFAULT NULL,
  `is_logged` bit(1) DEFAULT NULL,
  `is_monitored` bit(1) DEFAULT NULL,
  `is_resolved` bit(1) DEFAULT NULL,
  `is_user_friendly` bit(1) DEFAULT NULL,
  `last_occurrence` datetime(6) DEFAULT NULL,
  `localized_messages` text COLLATE utf8mb4_unicode_ci,
  `log_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `migration_guide` text COLLATE utf8mb4_unicode_ci,
  `occurrence_count` bigint DEFAULT NULL,
  `occurrence_pattern` text COLLATE utf8mb4_unicode_ci,
  `prevention` text COLLATE utf8mb4_unicode_ci,
  `replacement_error_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolution_method` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime(6) DEFAULT NULL,
  `resolved_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `severity` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `solution` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `support_contact` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_message` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_doithhvade5qe4v90b91i5vgc` (`error_code`),
  KEY `idx_error_messages_code` (`error_code`),
  KEY `idx_error_messages_severity` (`severity`),
  KEY `idx_error_messages_status` (`status`),
  KEY `idx_error_messages_created_at` (`created_at`),
  KEY `idx_error_messages_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `error_messages`
--

LOCK TABLES `error_messages` WRITE;
/*!40000 ALTER TABLE `error_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `error_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financial_transactions`
--

DROP TABLE IF EXISTS `financial_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financial_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(15,2) NOT NULL,
  `amount_before_tax` decimal(15,2) DEFAULT NULL,
  `approval_comment` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `project_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `related_entity_id` bigint DEFAULT NULL,
  `related_entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subcategory` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_amount` decimal(15,2) DEFAULT NULL,
  `tax_included` bit(1) NOT NULL,
  `transaction_date` date NOT NULL,
  `transaction_type` enum('INCOME','EXPENSE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `approver_id` bigint DEFAULT NULL,
  `category_code_id` bigint DEFAULT NULL,
  `subcategory_code_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_financial_transaction_date` (`transaction_date`),
  KEY `idx_financial_transaction_type` (`transaction_type`),
  KEY `idx_financial_transaction_category` (`category`),
  KEY `idx_financial_transaction_status` (`status`),
  KEY `idx_financial_transaction_created_at` (`created_at`),
  KEY `FKagviohskpwc16pqkpgva07giy` (`approver_id`),
  KEY `FKlxoa9k3ahcar6a045ngo9iehv` (`category_code_id`),
  KEY `FKjxufrdnbi72mvph74sdl28e41` (`subcategory_code_id`),
  CONSTRAINT `FKagviohskpwc16pqkpgva07giy` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKjxufrdnbi72mvph74sdl28e41` FOREIGN KEY (`subcategory_code_id`) REFERENCES `common_codes` (`id`),
  CONSTRAINT `FKlxoa9k3ahcar6a045ngo9iehv` FOREIGN KEY (`category_code_id`) REFERENCES `common_codes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4006 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financial_transactions`
--

LOCK TABLES `financial_transactions` WRITE;
/*!40000 ALTER TABLE `financial_transactions` DISABLE KEYS */;
INSERT INTO `financial_transactions` VALUES (4001,7500000.00,6818181.82,'승인','2025-09-15 09:14:03.000000','EQUIPMENT','2025-09-15 09:14:03.000000','IT팀','노트북 구매',_binary '\0','PRJ-001',2001,'PURCHASE_ORDER','개발용 노트북 5대 구매','COMPLETED','COMPUTER',681818.18,_binary '','2024-01-20','EXPENSE','2025-09-15 09:14:03.000000',1,NULL,NULL),(4002,3000000.00,2727272.73,'승인','2025-09-15 09:14:03.000000','EQUIPMENT','2025-09-15 09:14:03.000000','IT팀','모니터 구매',_binary '\0','PRJ-001',2002,'PURCHASE_ORDER','24인치 모니터 10대 구매','COMPLETED','MONITOR',272727.27,_binary '','2024-01-21','EXPENSE','2025-09-15 09:14:03.000000',1,NULL,NULL),(4003,45000000.00,45000000.00,'승인','2025-09-15 09:14:03.000000','PERSONNEL','2025-09-15 09:14:03.000000','인사팀','월급 지급',_binary '\0','PRJ-002',NULL,NULL,'2024년 1월 직원 월급','COMPLETED','SALARY',0.00,_binary '\0','2024-01-25','EXPENSE','2025-09-15 09:14:03.000000',1,NULL,NULL),(4004,5000000.00,4545454.55,'승인','2025-09-15 09:14:03.000000','CONSULTATION','2025-09-15 09:14:03.000000','상담팀','상담 수익',_binary '\0','PRJ-003',NULL,NULL,'2024년 1월 상담 수익','COMPLETED','SERVICE',454545.45,_binary '','2024-01-30','INCOME','2025-09-15 09:14:03.000000',1,NULL,NULL),(4005,2000000.00,1818181.82,'승인','2025-09-15 09:14:03.000000','MARKETING','2025-09-15 09:14:03.000000','마케팅팀','마케팅 비용',_binary '\0','PRJ-004',NULL,NULL,'온라인 광고비','COMPLETED','ADVERTISING',181818.18,_binary '','2024-02-01','EXPENSE','2025-09-15 09:14:03.000000',1,NULL,NULL);
/*!40000 ALTER TABLE `financial_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `is_approved` bit(1) NOT NULL,
  `min_stock_level` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock_quantity` int NOT NULL,
  `supplier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_contact` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` int NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5005 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (5001,'EQUIPMENT','2025-09-15 09:14:03.000000','개발용 노트북',_binary '',_binary '',2,'노트북',5,'삼성전자','02-1234-5678','대',1500000.00,'2025-09-15 09:14:03.000000',0,NULL,_binary '\0'),(5002,'EQUIPMENT','2025-09-15 09:14:03.000000','24인치 모니터',_binary '',_binary '',5,'모니터',10,'LG전자','02-2345-6789','대',300000.00,'2025-09-15 09:14:03.000000',0,NULL,_binary '\0'),(5003,'FURNITURE','2025-09-15 09:14:03.000000','사무용 의자',_binary '',_binary '',10,'의자',20,'이케아','02-3456-7890','개',200000.00,'2025-09-15 09:14:03.000000',0,NULL,_binary '\0'),(5004,'FURNITURE','2025-09-15 09:14:03.000000','사무용 책상',_binary '',_binary '',5,'책상',15,'이케아','02-3456-7890','개',500000.00,'2025-09-15 09:14:03.000000',0,NULL,_binary '\0');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `author_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consultation_id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `is_important` bit(1) DEFAULT NULL,
  `is_private` bit(1) DEFAULT NULL,
  `note_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `note_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK3dfvmsc5eicbys2y0dbe3dnr3` (`consultation_id`),
  CONSTRAINT `FK3dfvmsc5eicbys2y0dbe3dnr3` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `used` bit(1) NOT NULL,
  `used_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_71lqwbwtklmljk3qlsugr1mig` (`token`),
  KEY `FKk3ndxg5xp6v7wd4gjyusp15gq` (`user_id`),
  CONSTRAINT `FKk3ndxg5xp6v7wd4gjyusp15gq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES (1,'2025-09-17 22:28:37.781576','beta74@live.co.kr','2025-09-18 22:28:37.779503','a8bc1c72-6307-4674-be85-3a868e0d507e','2025-09-17 22:31:39.630594',_binary '','2025-09-17 22:31:39.624862',23),(2,'2025-09-17 23:16:15.541964','admin@mindgarden.com','2025-09-18 23:16:15.541282','85f3c794-9526-40f1-a5e9-a5ec187b4e0a','2025-09-17 23:16:15.541968',_binary '\0',NULL,24);
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(19,2) NOT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `branch_id` bigint DEFAULT NULL,
  `cancelled_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `external_response` text COLLATE utf8mb4_unicode_ci,
  `failure_reason` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `method` enum('CARD','BANK_TRANSFER','VIRTUAL_ACCOUNT','MOBILE','CASH') COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payer_id` bigint NOT NULL,
  `payment_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` enum('TOSS','IAMPORT','KAKAO','NAVER','PAYPAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_id` bigint DEFAULT NULL,
  `refunded_at` datetime(6) DEFAULT NULL,
  `status` enum('PENDING','PROCESSING','APPROVED','FAILED','CANCELLED','REFUNDED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint DEFAULT NULL,
  `webhook_data` text COLLATE utf8mb4_unicode_ci,
  `virtual_account_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failed_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_t4ffsaqe8d6i83gs100u2y3l1` (`payment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,100000.00,'2025-09-12 09:58:03.791751',1,NULL,'2025-09-08 09:17:13.193127','테스트 결제 - CARD TOSS','2025-09-08 09:47:13.191816',NULL,NULL,_binary '\0','CARD','TEST_ORDER_1757290633181',1,'PAY_1757290633190_c567c5d1','TOSS',1,NULL,'APPROVED','2025-09-12 09:58:03.792580',1,NULL,NULL,NULL),(2,50000.00,'2025-09-12 09:58:03.796385',1,NULL,'2025-09-08 09:17:18.431039','시나리오 테스트: 카드 결제 성공','2025-09-08 09:47:18.430775',NULL,NULL,_binary '\0','CARD','SCENARIO_1757290638426',1,'PAY_1757290638430_ccc965b0','TOSS',1,NULL,'APPROVED','2025-09-12 09:58:03.796903',1,NULL,NULL,NULL),(3,100000.00,'2025-09-12 09:58:03.798471',1,NULL,'2025-09-08 09:17:18.435824','시나리오 테스트: 계좌이체 결제','2025-09-08 09:47:18.435698',NULL,NULL,_binary '\0','BANK_TRANSFER','SCENARIO_1757290638433',1,'PAY_1757290638435_2fae9c37','IAMPORT',1,NULL,'APPROVED','2025-09-12 09:58:03.798872',1,NULL,NULL,NULL),(4,200000.00,'2025-09-08 09:17:59.158718',1,NULL,'2025-09-08 09:17:18.439502','시나리오 테스트: 가상계좌 결제 (자동 확인)','2025-09-08 09:47:18.439362',NULL,NULL,_binary '\0','VIRTUAL_ACCOUNT','SCENARIO_1757290638437',1,'PAY_1757290638439_ceb679d2','TOSS',1,NULL,'APPROVED','2025-09-08 09:17:59.159348',1,NULL,NULL,NULL),(5,75000.00,'2025-09-12 09:58:03.800050',1,NULL,'2025-09-08 09:17:18.442966','시나리오 테스트: 모바일 결제','2025-09-08 09:47:18.442891',NULL,NULL,_binary '\0','MOBILE','SCENARIO_1757290638441',1,'PAY_1757290638442_1f25fe42','KAKAO',1,NULL,'APPROVED','2025-09-12 09:58:03.800469',1,NULL,NULL,NULL),(6,100000.00,'2025-09-12 09:58:03.801900',1,NULL,'2025-09-08 09:28:28.302570','테스트 결제 - CARD TOSS','2025-09-08 09:58:28.300824',NULL,NULL,_binary '\0','CARD','TEST_ORDER_1757291308293',1,'PAY_1757291308300_8a498922','TOSS',1,NULL,'APPROVED','2025-09-12 09:58:03.802078',1,NULL,NULL,NULL),(7,100000.00,'2025-09-12 09:53:58.559857',1,NULL,'2025-09-12 09:53:40.308875','테스트 결제 - CARD TOSS','2025-09-12 10:23:40.308001',NULL,NULL,_binary '\0','CARD','TEST_ORDER_1757638420301',1,'PAY_1757638420307_8ebcc5f6','TOSS',1,NULL,'APPROVED','2025-09-12 09:53:58.560674',1,NULL,NULL,NULL),(8,100000.00,'2025-09-12 10:58:41.876750',1,NULL,'2025-09-12 09:58:25.708399','테스트 결제 - CARD TOSS','2025-09-12 10:28:25.707662',NULL,NULL,_binary '\0','CARD','TEST_ORDER_1757638705702',1,'PAY_1757638705707_6672611b','TOSS',1,NULL,'APPROVED','2025-09-12 10:58:41.877644',1,NULL,NULL,NULL),(9,100000.00,'2025-09-12 11:00:16.786620',1,NULL,'2025-09-12 10:00:00.137457','테스트 결제 - CARD TOSS','2025-09-12 10:30:00.136469',NULL,NULL,_binary '\0','CARD','TEST_ORDER_1757638800133',1,'PAY_1757638800136_3a041c30','TOSS',1,NULL,'APPROVED','2025-09-12 11:00:16.787505',1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provisions`
--

DROP TABLE IF EXISTS `provisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provisions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `calculation_base` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_amount` decimal(15,2) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `end_date` date DEFAULT NULL,
  `estimated_amount` decimal(15,2) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `provision_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provision_rate` decimal(5,4) DEFAULT NULL,
  `provision_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `used_amount` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provisions`
--

LOCK TABLES `provisions` WRITE;
/*!40000 ALTER TABLE `provisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `provisions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actual_delivery_date` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `delivery_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expected_delivery_date` datetime(6) DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_date` datetime(6) DEFAULT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `status` enum('CREATED','ORDERED','SHIPPED','DELIVERED','RECEIVED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_contact` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `tracking_number` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` int NOT NULL,
  `item_id` bigint NOT NULL,
  `purchase_request_id` bigint NOT NULL,
  `purchaser_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKn4bel2dg3jfjy63bt296lm3is` (`item_id`),
  KEY `FKt0bohvsr1b3smgdx2tsjtgb6a` (`purchase_request_id`),
  KEY `FKpdie77wngk4xkgrl59lqfqkqo` (`purchaser_id`),
  CONSTRAINT `FKn4bel2dg3jfjy63bt296lm3is` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  CONSTRAINT `FKpdie77wngk4xkgrl59lqfqkqo` FOREIGN KEY (`purchaser_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKt0bohvsr1b3smgdx2tsjtgb6a` FOREIGN KEY (`purchase_request_id`) REFERENCES `purchase_requests` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (2001,NULL,'2025-09-15 09:14:03.000000','서울시 강남구','2024-01-25 00:00:00.000000','노트북 5대 주문','2024-01-20 00:00:00.000000','PO-2024-001',5,'ORDERED','삼성전자','02-1234-5678',7500000.00,'TRK001',1500000.00,'2025-09-15 09:14:03.000000',0,5001,1001,1),(2002,'2024-01-26 00:00:00.000000','2025-09-15 09:14:03.000000','서울시 강남구','2024-01-26 00:00:00.000000','모니터 10대 주문','2024-01-21 00:00:00.000000','PO-2024-002',10,'DELIVERED','LG전자','02-2345-6789',3000000.00,'TRK002',300000.00,'2025-09-15 09:14:03.000000',0,5002,1002,1),(2003,NULL,'2025-09-15 09:14:03.000000','서울시 강남구','2024-01-27 00:00:00.000000','의자 20개 주문 (취소됨)','2024-01-22 00:00:00.000000','PO-2024-003',20,'CANCELLED','이케아','02-3456-7890',4000000.00,NULL,200000.00,'2025-09-15 09:14:03.000000',0,5003,1003,1);
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_requests`
--

DROP TABLE IF EXISTS `purchase_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `approval_comments` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejected_at` datetime(6) DEFAULT NULL,
  `request_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_at` datetime(6) DEFAULT NULL,
  `review_comments` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `status` enum('PENDING','UNDER_REVIEW','APPROVED','REJECTED','PURCHASED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` int NOT NULL,
  `approver_id` bigint DEFAULT NULL,
  `item_id` bigint NOT NULL,
  `requester_id` bigint NOT NULL,
  `reviewer_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKbpf88p0d03dyqi1ehn0s7gse3` (`approver_id`),
  KEY `FKl6mt6l8q4gr6wi5h9dn5q4wb2` (`item_id`),
  KEY `FKrpjxt7ct1el56f3vsoqwwgx1i` (`requester_id`),
  KEY `FKf7f1bj4g6uv2nf7g3uw7h2lvx` (`reviewer_id`),
  CONSTRAINT `FKbpf88p0d03dyqi1ehn0s7gse3` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKf7f1bj4g6uv2nf7g3uw7h2lvx` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKl6mt6l8q4gr6wi5h9dn5q4wb2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  CONSTRAINT `FKrpjxt7ct1el56f3vsoqwwgx1i` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_requests`
--

LOCK TABLES `purchase_requests` WRITE;
/*!40000 ALTER TABLE `purchase_requests` DISABLE KEYS */;
INSERT INTO `purchase_requests` VALUES (1001,NULL,NULL,'2025-09-15 09:14:03.000000','급하게 필요함',5,'개발팀 노트북 구매',NULL,'PR-2024-001','2025-09-15 09:14:03.000000',NULL,NULL,'PENDING',7500000.00,'2025-09-15 09:14:03.000000',0,NULL,5001,1,NULL),(1002,'승인','2025-09-15 09:14:03.000000','2025-09-15 09:14:03.000000','기존 모니터 노후화',10,'모니터 교체',NULL,'PR-2024-002','2025-09-15 09:14:03.000000','검토 완료','2025-09-15 09:14:03.000000','APPROVED',3000000.00,'2025-09-15 09:14:03.000000',0,1,5002,1,1),(1003,NULL,NULL,'2025-09-15 09:14:03.000000','사무실 의자 교체',20,'의자 교체','2025-09-15 09:14:03.000000','PR-2024-003','2025-09-15 09:14:03.000000','예산 부족','2025-09-15 09:14:03.000000','REJECTED',4000000.00,'2025-09-15 09:14:03.000000',0,1,5003,1,1);
/*!40000 ALTER TABLE `purchase_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quality_evaluations`
--

DROP TABLE IF EXISTS `quality_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quality_evaluations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_satisfaction_score` double NOT NULL,
  `communication_score` double NOT NULL,
  `consultant_id` bigint NOT NULL,
  `consultation_id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `effectiveness_score` double NOT NULL,
  `evaluation_notes` text COLLATE utf8mb4_unicode_ci,
  `evaluation_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `evaluator_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluator_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `improvement_suggestions` text COLLATE utf8mb4_unicode_ci,
  `is_deleted` bit(1) DEFAULT NULL,
  `overall_score` double NOT NULL,
  `professionalism_score` double NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKn8u794wcx3tyxejoot1rbylqq` (`consultant_id`),
  KEY `FK4096uy3u1ch8px6uc0qv7l8ye` (`consultation_id`),
  CONSTRAINT `FK4096uy3u1ch8px6uc0qv7l8ye` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`),
  CONSTRAINT `FKn8u794wcx3tyxejoot1rbylqq` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quality_evaluations`
--

LOCK TABLES `quality_evaluations` WRITE;
/*!40000 ALTER TABLE `quality_evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `quality_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurring_expenses`
--

DROP TABLE IF EXISTS `recurring_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurring_expenses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `auto_process` bit(1) NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` date NOT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `end_date` date DEFAULT NULL,
  `expense_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expense_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` bit(1) NOT NULL,
  `is_vat_applicable` bit(1) NOT NULL,
  `last_processed_date` date DEFAULT NULL,
  `next_due_date` date DEFAULT NULL,
  `notification_days_before` int NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recurrence_day` int NOT NULL,
  `recurrence_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `subcategory` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_contact` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_processed_count` int DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurring_expenses`
--

LOCK TABLES `recurring_expenses` WRITE;
/*!40000 ALTER TABLE `recurring_expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurring_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refund_requests`
--

DROP TABLE IF EXISTS `refund_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refund_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `approved_at` datetime(6) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `erp_reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `erp_response_message` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `erp_status` enum('PENDING','SENT','CONFIRMED','FAILED','RETRY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refund_amount` decimal(15,2) NOT NULL,
  `refund_reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `refund_sessions` int NOT NULL,
  `rejected_at` datetime(6) DEFAULT NULL,
  `rejection_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_at` datetime(6) NOT NULL,
  `status` enum('REQUESTED','APPROVED','PROCESSING','COMPLETED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `approved_by` bigint DEFAULT NULL,
  `mapping_id` bigint NOT NULL,
  `requested_by` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKtbd0hil9deg0nwj8ifoatsyab` (`approved_by`),
  KEY `FK1igo76ofnaso5nlt0dcymnrtf` (`mapping_id`),
  KEY `FKvqqjrp6lluxf3vku9rpkj3qk` (`requested_by`),
  CONSTRAINT `FK1igo76ofnaso5nlt0dcymnrtf` FOREIGN KEY (`mapping_id`) REFERENCES `consultant_client_mappings` (`id`),
  CONSTRAINT `FKtbd0hil9deg0nwj8ifoatsyab` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKvqqjrp6lluxf3vku9rpkj3qk` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refund_requests`
--

LOCK TABLES `refund_requests` WRITE;
/*!40000 ALTER TABLE `refund_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `refund_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reserve_funds`
--

DROP TABLE IF EXISTS `reserve_funds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reserve_funds` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `auto_deduct` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_amount` decimal(15,2) DEFAULT NULL,
  `deduct_from` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `end_date` date DEFAULT NULL,
  `fund_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fund_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` bit(1) NOT NULL,
  `reserve_rate` decimal(5,4) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `target_amount` decimal(15,2) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reserve_funds`
--

LOCK TABLES `reserve_funds` WRITE;
/*!40000 ALTER TABLE `reserve_funds` DISABLE KEYS */;
/*!40000 ALTER TABLE `reserve_funds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_id` bigint NOT NULL,
  `consultant_id` bigint NOT NULL,
  `consultation_id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_anonymous` bit(1) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `is_verified` bit(1) DEFAULT NULL,
  `rating` int NOT NULL,
  `review_text` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime(6) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKo2cmyvyjrvumg4b3de9dcvfxa` (`client_id`),
  KEY `FKiqpvknnk5rmaft3bcjma7hdw8` (`consultant_id`),
  KEY `FK8n2okxtr2eebfrbhhk3jainwg` (`consultation_id`),
  CONSTRAINT `FK8n2okxtr2eebfrbhhk3jainwg` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`),
  CONSTRAINT `FKiqpvknnk5rmaft3bcjma7hdw8` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`),
  CONSTRAINT `FKo2cmyvyjrvumg4b3de9dcvfxa` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salary_calculations`
--

DROP TABLE IF EXISTS `salary_calculations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_calculations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `approved_at` datetime(6) DEFAULT NULL,
  `base_salary` decimal(10,2) NOT NULL,
  `calculated_at` datetime(6) DEFAULT NULL,
  `calculation_details` text COLLATE utf8mb4_unicode_ci,
  `calculation_period` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consultant_id` bigint NOT NULL,
  `consultation_count` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `option_salary` decimal(10,2) DEFAULT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `remarks` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_profile_id` bigint NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_hours` decimal(5,2) DEFAULT NULL,
  `total_salary` decimal(10,2) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `pay_date` date DEFAULT NULL,
  `work_end_date` date DEFAULT NULL,
  `work_start_date` date DEFAULT NULL,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_salary_calculation_consultant_id` (`consultant_id`),
  KEY `idx_salary_calculation_period` (`calculation_period`),
  KEY `idx_salary_calculation_status` (`status`),
  KEY `idx_salary_calculation_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salary_calculations`
--

LOCK TABLES `salary_calculations` WRITE;
/*!40000 ALTER TABLE `salary_calculations` DISABLE KEYS */;
INSERT INTO `salary_calculations` VALUES (3,NULL,0.00,'2025-09-11 16:03:29.996955','{options=[{amount=3000.00, type=FAMILY_CONSULTATION, description=가족상담}, {amount=5000.00, type=INITIAL_CONSULTATION, description=초기상담}], consultations=[], calculatedAt=2025-09-11T16:03:29.996880}\n=== 세금 계산 ===\n총 급여 (세전): 0.00원\n총 세금: 0원\n실지급액 (세후): 0.00원\n- 원천징수 (3.3%): 0원\n','2025-09',45,0,'2025-09-11 16:03:29.997179',0.00,NULL,NULL,7,'CALCULATED',0.00,0.00,'2025-09-11 16:03:29.997179','2025-10-10','2025-09-30','2025-09-01',0.00),(6,NULL,90000.00,'2025-09-11 16:36:17.090703','{options=[{type=FAMILY_CONSULTATION, description=가족상담, amount=3000.00}, {type=INITIAL_CONSULTATION, description=초기상담, amount=5000.00}], consultations=[], calculatedAt=2025-09-11T16:36:17.090654}\n=== 세금 계산 ===\n총 급여 (세전): 114000.00원\n총 세금: 3762원\n실지급액 (세후): 110238.00원\n- 원천징수 (3.3%): 3762원\n','2025-09',41,3,'2025-09-11 16:36:17.090837',24000.00,NULL,NULL,11,'CALCULATED',0.00,114000.00,'2025-09-11 16:36:17.090837','2025-10-10','2025-09-30','2025-09-01',3762.00),(9,NULL,35000.00,'2025-09-11 16:42:14.903106','{options=[{type=FAMILY_CONSULTATION, description=가족상담, amount=5000.00}, {type=INITIAL_CONSULTATION, description=초기상담, amount=7000.00}], consultations=[], calculatedAt=2025-09-11T16:42:14.908429}\n=== 세금 계산 ===\n총 급여 (세전): 47000.00원\n총 세금: 1551원\n실지급액 (세후): 45449.00원\n- 원천징수 (3.3%): 1551원\n','2025-09',43,1,'2025-09-11 16:42:14.903238',12000.00,NULL,NULL,5,'CALCULATED',0.00,47000.00,'2025-09-11 16:42:14.908716','2025-10-10','2025-09-30','2025-09-01',1551.00),(10,NULL,60000.00,'2025-09-11 17:35:09.710392','{options=[], consultations=[], calculatedAt=2025-09-11T17:35:09.717936}\n=== 세금 계산 ===\n총 급여 (세전): 60000.00원\n총 세금: 1980원\n실지급액 (세후): 58020.00원\n- 원천징수 (3.3%): 1980원\n','2025-09',31,2,'2025-09-11 17:35:09.710712',0.00,NULL,NULL,15,'CALCULATED',0.00,60000.00,'2025-09-11 17:35:09.718249','2025-10-10','2025-09-30','2025-09-01',1980.00);
/*!40000 ALTER TABLE `salary_calculations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salary_tax_calculations`
--

DROP TABLE IF EXISTS `salary_tax_calculations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_tax_calculations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `calculation_details` text COLLATE utf8mb4_unicode_ci,
  `calculation_id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `tax_amount` decimal(10,2) NOT NULL,
  `tax_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_rate` decimal(5,4) NOT NULL,
  `tax_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taxable_amount` decimal(10,2) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_salary_tax_calculation_id` (`calculation_id`),
  KEY `idx_salary_tax_type` (`tax_type`),
  KEY `idx_salary_tax_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salary_tax_calculations`
--

LOCK TABLES `salary_tax_calculations` WRITE;
/*!40000 ALTER TABLE `salary_tax_calculations` DISABLE KEYS */;
INSERT INTO `salary_tax_calculations` VALUES (1,NULL,1,'2025-09-11 14:36:55.457347',_binary '',0.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',0.00,'2025-09-11 14:36:55.472362'),(2,NULL,1,'2025-09-11 14:36:55.471111',_binary '',0.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',0.00,'2025-09-11 14:36:55.471111'),(3,NULL,2,'2025-09-11 15:53:09.926908',_binary '',4653.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',141000.00,'2025-09-11 15:53:09.943006'),(4,NULL,2,'2025-09-11 15:53:09.941560',_binary '',4653.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',141000.00,'2025-09-11 15:53:09.941560'),(5,NULL,3,'2025-09-11 16:03:29.991631',_binary '',0.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',0.00,'2025-09-11 16:03:30.001725'),(6,NULL,3,'2025-09-11 16:03:30.000489',_binary '',0.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',0.00,'2025-09-11 16:03:30.000489'),(7,NULL,4,'2025-09-11 16:04:14.182754',_binary '',0.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',0.00,'2025-09-11 16:04:14.189289'),(8,NULL,4,'2025-09-11 16:04:14.188612',_binary '',0.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',0.00,'2025-09-11 16:04:14.188612'),(9,NULL,5,'2025-09-11 16:31:31.073752',_binary '',2970.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',90000.00,'2025-09-11 16:31:31.082225'),(10,NULL,5,'2025-09-11 16:31:31.081493',_binary '',2970.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',90000.00,'2025-09-11 16:31:31.081493'),(11,NULL,6,'2025-09-11 16:36:17.084972',_binary '',3762.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',114000.00,'2025-09-11 16:36:17.093610'),(12,NULL,7,'2025-09-11 16:39:59.020199',_binary '',1551.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',47000.00,'2025-09-11 16:39:59.025733'),(13,NULL,8,'2025-09-11 16:41:00.046116',_binary '',1551.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',47000.00,'2025-09-11 16:41:00.046116'),(14,NULL,9,'2025-09-11 16:42:14.906001',_binary '',1551.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',47000.00,'2025-09-11 16:42:14.906001'),(15,NULL,10,'2025-09-11 17:35:09.715149',_binary '',1980.00,'프리랜서 원천징수 3.3%','원천징수',0.0330,'WITHHOLDING_TAX',60000.00,'2025-09-11 17:35:09.715149');
/*!40000 ALTER TABLE `salary_tax_calculations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `client_id` bigint DEFAULT NULL,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultant_id` bigint NOT NULL,
  `consultation_id` bigint DEFAULT NULL,
  `consultation_location` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_method` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `date` date NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `duration_minutes` int DEFAULT NULL,
  `end_time` time(6) NOT NULL,
  `is_all_day` bit(1) DEFAULT NULL,
  `is_private` bit(1) DEFAULT NULL,
  `is_recurring` bit(1) DEFAULT NULL,
  `is_reminder_sent` bit(1) DEFAULT NULL,
  `last_modified_by` bigint DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `priority` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recurrence_end_date` date DEFAULT NULL,
  `recurrence_interval` int DEFAULT NULL,
  `recurrence_pattern` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reminder_time` datetime(6) DEFAULT NULL,
  `schedule_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` time(6) NOT NULL,
  `status` enum('AVAILABLE','BOOKED','CONFIRMED','VACATION','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_schedules_consultant_id` (`consultant_id`),
  KEY `idx_schedules_date` (`date`),
  KEY `idx_schedules_status` (`status`),
  KEY `idx_schedules_is_deleted` (`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
INSERT INTO `schedules` VALUES (1,'2025-09-02 09:36:50.480658',NULL,_binary '\0','2025-09-05 09:27:10.063621',3,23,NULL,25,NULL,NULL,NULL,NULL,'2025-09-02','테스트 상담입니다\n[관리자 확정] 입금 확인 완료',NULL,'18:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','17:30:00.000000','COMPLETED','테스트 상담','FAMILY',NULL),(2,'2025-09-02 09:38:53.378425',NULL,_binary '\0','2025-09-02 15:20:00.007427',3,3,NULL,25,NULL,NULL,NULL,NULL,'2025-09-02','테스트 상담입니다\n[관리자 확정] 입금 확인 완료',NULL,'15:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:30:00.000000','COMPLETED','11','INDIVIDUAL',NULL),(4,'2025-09-02 09:50:48.143053',NULL,_binary '\0','2025-09-05 09:34:27.839077',2,1,NULL,25,NULL,NULL,NULL,NULL,'2025-09-03','테스트 상담입니다',NULL,'10:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','10:00:00.000000','COMPLETED','테스트 상담','FAMILY',NULL),(5,'2025-09-02 09:59:38.023508',NULL,_binary '\0','2025-09-05 09:34:27.843877',2,1,NULL,25,NULL,NULL,NULL,NULL,'2025-09-03','테스트 상담입니다',NULL,'14:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','13:30:00.000000','COMPLETED','11','INDIVIDUAL',NULL),(6,'2025-09-02 10:00:17.736188',NULL,_binary '\0','2025-09-05 09:34:27.843951',2,1,NULL,25,NULL,NULL,NULL,NULL,'2025-09-03','테스트 상담입니다',NULL,'15:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','15:00:00.000000','COMPLETED','테스트 상담','FAMILY',NULL),(7,'2025-09-02 10:02:08.285443',NULL,_binary '\0','2025-09-05 09:34:27.844003',3,1,NULL,25,NULL,NULL,NULL,NULL,'2025-09-03','사용자에 의해 취소됨',NULL,'18:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','17:30:00.000000','COMPLETED','22','INDIVIDUAL',NULL),(8,'2025-09-02 10:10:19.611902',NULL,_binary '\0','2025-09-05 09:34:27.844050',2,1,NULL,25,NULL,NULL,NULL,NULL,'2025-09-04','테스트 상담입니다',NULL,'12:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','11:30:00.000000','COMPLETED','33','FAMILY',NULL),(9,'2025-09-02 10:10:30.726731',NULL,_binary '\0','2025-09-17 14:20:00.011538',3,1,NULL,25,NULL,NULL,NULL,NULL,'2025-09-17','테스트 상담입니다\n[관리자 확정] 입금 확인 완료',NULL,'14:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','13:30:00.000000','COMPLETED','55','INDIVIDUAL',NULL),(10,'2025-09-02 10:11:07.465023',NULL,_binary '\0','2025-09-05 09:34:27.844104',2,1,NULL,25,NULL,NULL,NULL,NULL,'2025-09-03','테스트 상담입니다',NULL,'11:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','11:00:00.000000','COMPLETED','66','FAMILY',NULL),(11,'2025-09-02 10:15:40.522559',NULL,_binary '\0','2025-09-05 09:34:27.844154',2,1,NULL,31,NULL,NULL,NULL,NULL,'2025-09-04','이상담 상담사 테스트',NULL,'10:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','10:00:00.000000','COMPLETED','이상담 - 테스트 상담','FAMILY',NULL),(12,'2025-09-02 10:15:47.130249',NULL,_binary '\0','2025-09-05 09:34:27.844201',2,1,NULL,32,NULL,NULL,NULL,NULL,'2025-09-04','박상담 상담사 테스트',NULL,'14:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:00:00.000000','COMPLETED','박상담 - 테스트 상담','INDIVIDUAL',NULL),(13,'2025-09-02 10:15:53.840183',NULL,_binary '\0','2025-09-05 09:34:27.844249',2,1,NULL,33,NULL,NULL,NULL,NULL,'2025-09-04','테스트 상담입니다',NULL,'16:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','16:00:00.000000','COMPLETED','최상담 - 테스트 상담','INDIVIDUAL',NULL),(14,'2025-09-02 10:41:01.028433',NULL,_binary '\0','2025-09-02 10:52:33.873464',1,1,NULL,31,NULL,NULL,NULL,NULL,'2025-09-25','테스트 상담입니다',NULL,'10:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','09:30:00.000000','BOOKED','11','FAMILY',NULL),(15,'2025-09-02 10:52:39.546528',NULL,_binary '\0','2025-09-02 10:52:39.546528',0,1,NULL,33,NULL,NULL,NULL,NULL,'2025-09-30','99',NULL,'13:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','12:30:00.000000','BOOKED','88',NULL,NULL),(16,'2025-09-02 10:55:06.890923',NULL,_binary '\0','2025-09-06 00:57:49.587846',1,1,NULL,31,NULL,NULL,NULL,NULL,'2025-09-05','상담 유형 테스트',NULL,'15:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:00:00.000000','COMPLETED','테스트 상담 (새로 생성)','FAMILY',NULL),(17,'2025-09-02 10:55:52.023596',NULL,_binary '\0','2025-09-16 10:55:20.155801',1,1,NULL,32,NULL,NULL,NULL,NULL,'2025-09-15','333',NULL,'17:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','16:30:00.000000','COMPLETED','22','COUPLE',NULL),(18,'2025-09-02 12:37:06.015233',NULL,_binary '\0','2025-09-13 00:00:00.016824',1,1,NULL,32,NULL,NULL,NULL,NULL,'2025-09-12','888',NULL,'14:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','13:30:00.000000','COMPLETED','77','COUPLE',NULL),(19,'2025-09-02 12:45:30.516432',NULL,_binary '\0','2025-09-11 00:03:41.415191',3,1,NULL,33,NULL,NULL,NULL,NULL,'2025-09-10','ㅈㅈ',NULL,'10:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','09:30:00.000000','COMPLETED','ㅂㅂ','INDIVIDUAL',NULL),(20,'2025-09-02 12:48:57.895746',NULL,_binary '\0','2025-09-03 15:21:25.623566',1,1,NULL,32,NULL,NULL,NULL,NULL,'2025-09-03','',NULL,'10:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','09:30:00.000000','COMPLETED','박상담 - 매핑테스트상담사003','INDIVIDUAL',NULL),(21,'2025-09-02 12:49:20.995654',NULL,_binary '\0','2025-09-03 15:21:35.791291',1,1,NULL,33,NULL,NULL,NULL,NULL,'2025-09-03','',NULL,'10:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','09:30:00.000000','COMPLETED','최상담 - 매핑테스트상담사003','INDIVIDUAL',NULL),(22,'2025-09-03 09:18:08.539325',NULL,_binary '\0','2025-09-03 15:21:40.796354',1,34,NULL,41,NULL,NULL,NULL,NULL,'2025-09-03','테스트 상담 일정',NULL,'11:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','10:00:00.000000','COMPLETED','테스트 상담','진행상담',NULL),(23,'2025-09-03 09:18:17.341177',NULL,_binary '\0','2025-09-05 09:34:27.844295',1,35,NULL,41,NULL,NULL,NULL,NULL,'2025-09-03','오후 상담 일정',NULL,'15:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:00:00.000000','COMPLETED','오후 상담','진행상담',NULL),(24,'2025-09-03 09:18:21.638706',NULL,_binary '\0','2025-09-05 09:34:27.844480',1,36,NULL,41,NULL,NULL,NULL,NULL,'2025-09-04','내일 상담 일정',NULL,'10:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','09:00:00.000000','COMPLETED','내일 상담','진행상담',NULL),(25,'2025-09-03 09:22:18.828505',NULL,_binary '\0','2025-09-16 15:18:22.822256',2,1,NULL,1,NULL,NULL,NULL,NULL,'2025-09-03','테스트 상담 일정',NULL,'11:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','10:00:00.000000','VACATION','테스트 상담','진행상담',NULL),(26,'2025-09-04 09:34:45.619585',NULL,_binary '\0','2025-09-04 09:34:45.619585',0,1,NULL,32,NULL,NULL,NULL,NULL,'2025-09-19','',NULL,'12:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','11:30:00.000000','BOOKED','박상담 - 매핑테스트상담사003','INDIVIDUAL',NULL),(27,'2025-09-04 12:00:25.847087',NULL,_binary '\0','2025-09-17 14:18:20.000000',1,36,NULL,43,NULL,NULL,NULL,NULL,'2025-09-23','[관리자 확정] 입금 확인 완료\n[상담사 이전] 김상담신규 -> 김선희',NULL,'16:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,'\n[관리자 직접 취소 - 삭제된 상담사와의 스케줄]','NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','16:00:00.000000','CANCELLED','김상담신규 - 테스트내담자003','INDIVIDUAL',NULL),(29,'2025-09-04 13:00:01.325505',NULL,_binary '\0','2025-09-17 14:18:20.000000',0,36,NULL,43,NULL,NULL,NULL,NULL,'2025-09-29','\n[상담사 이전] 김상담신규 -> 김선희',NULL,'18:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,'\n[관리자 직접 취소 - 삭제된 상담사와의 스케줄]','NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','17:30:00.000000','CANCELLED','김상담신규 - 테스트내담자003','INDIVIDUAL',NULL),(30,'2025-09-04 13:03:08.435179',NULL,_binary '\0','2025-09-17 14:18:20.000000',0,36,NULL,43,NULL,NULL,NULL,NULL,'2025-09-26','\n[상담사 이전] 김상담신규 -> 김선희',NULL,'18:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,'\n[관리자 직접 취소 - 삭제된 상담사와의 스케줄]','NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','17:30:00.000000','CANCELLED','김상담신규 - 테스트내담자003','INDIVIDUAL',NULL),(31,'2025-09-04 17:48:51.125534',NULL,_binary '\0','2025-09-04 17:49:00.973641',1,34,NULL,43,NULL,NULL,NULL,NULL,'2025-10-01','[관리자 확정] 입금 확인 완료',NULL,'18:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','17:30:00.000000','CONFIRMED','김선희 - 테스트내담자001','INDIVIDUAL',NULL),(32,'2025-09-04 20:33:44.839778',NULL,_binary '\0','2025-09-04 20:33:44.839778',0,34,NULL,43,NULL,NULL,NULL,NULL,'2025-10-03','',NULL,'16:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','16:00:00.000000','BOOKED','김선희 - 테스트내담자001','INDIVIDUAL',NULL),(33,'2025-09-05 12:18:40.581024',NULL,_binary '\0','2025-09-05 12:19:17.871683',1,23,NULL,45,NULL,NULL,NULL,NULL,'2025-10-02','[관리자 확정] 입금 확인 완료',NULL,'15:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','15:00:00.000000','CONFIRMED','김선희2 - 이재학','INDIVIDUAL',NULL),(34,'2025-09-08 08:53:32.303925',NULL,_binary '\0','2025-09-09 00:13:57.409566',1,23,NULL,43,NULL,NULL,NULL,NULL,'2025-09-08','',NULL,'17:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','17:00:00.000000','COMPLETED','김선희 - 이재학','INDIVIDUAL',NULL),(35,'2025-09-08 18:18:13.410111',NULL,_binary '\0','2025-09-17 09:53:00.735218',1,23,NULL,43,NULL,NULL,NULL,NULL,'2025-09-24','[관리자 확정] 입금 확인 완료',NULL,'17:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','16:30:00.000000','CONFIRMED','김선희 - 이재학','INDIVIDUAL',NULL),(36,'2025-09-08 22:26:55.452342',NULL,_binary '\0','2025-09-17 09:52:52.317253',1,23,NULL,43,NULL,NULL,NULL,NULL,'2025-09-23','[관리자 확정] 입금 확인 완료',NULL,'14:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:00:00.000000','CONFIRMED','김선희 - 이재학','INDIVIDUAL',NULL),(37,'2025-09-09 14:54:08.468406',NULL,_binary '\0','2025-09-09 14:54:08.468406',0,1,NULL,43,NULL,NULL,NULL,NULL,'2025-09-27','휴가가 아닌 날 스케줄 등록 테스트',NULL,'11:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','10:00:00.000000','BOOKED','정상 스케줄 테스트','INDIVIDUAL',NULL),(38,'2025-09-09 15:04:13.948377',NULL,_binary '\0','2025-09-09 15:04:13.948377',0,1,NULL,43,NULL,NULL,NULL,NULL,'2025-09-26','오전 반반차 휴가 후 스케줄 등록 테스트',NULL,'12:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','11:00:00.000000','BOOKED','오전 반반차 휴가 후 스케줄 테스트','INDIVIDUAL',NULL),(39,'2025-09-09 15:04:26.844571',NULL,_binary '\0','2025-09-09 15:04:26.844571',0,1,NULL,43,NULL,NULL,NULL,NULL,'2025-09-26','오후 반반차 휴가 전 스케줄 등록 테스트',NULL,'11:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','10:00:00.000000','BOOKED','오후 반반차 휴가 전 스케줄 테스트','INDIVIDUAL',NULL),(40,'2025-09-09 15:04:42.854110',NULL,_binary '\0','2025-09-09 15:04:42.854110',0,1,NULL,43,NULL,NULL,NULL,NULL,'2025-09-26','사용자 정의 휴가 전 스케줄 등록 테스트',NULL,'14:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','13:00:00.000000','BOOKED','사용자 정의 휴가 전 스케줄 테스트','INDIVIDUAL',NULL),(41,'2025-09-09 15:10:29.775375',NULL,_binary '\0','2025-09-09 15:10:29.775375',0,1,NULL,43,NULL,NULL,NULL,NULL,'2025-09-27','관리자가 등록한 휴가 후 스케줄 등록 테스트',NULL,'15:00:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:00:00.000000','BOOKED','관리자 등록 휴가 후 스케줄 테스트','INDIVIDUAL',NULL),(42,'2025-09-09 17:55:52.389965',NULL,_binary '\0','2025-09-17 09:53:22.587718',1,23,NULL,43,NULL,NULL,NULL,NULL,'2025-10-08','[관리자 확정] 입금 확인 완료',NULL,'15:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:30:00.000000','CONFIRMED','김선희 - 이재학','INDIVIDUAL',NULL),(43,'2025-09-11 10:24:33.885256',NULL,_binary '\0','2025-09-11 10:42:01.183726',1,23,NULL,43,NULL,NULL,NULL,NULL,'2025-10-07','사용자에 의해 취소됨',NULL,'15:30:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:00:00.000000','CANCELLED','김선희 - 이재학','INDIVIDUAL',NULL),(44,'2025-09-11 11:05:20.135737',NULL,_binary '\0','2025-09-12 12:06:10.460331',1,23,NULL,43,NULL,NULL,NULL,NULL,'2025-09-11','',NULL,'16:40:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','15:00:00.000000','COMPLETED','김선희 - 이재학','INDIVIDUAL',NULL),(45,'2025-09-11 11:11:19.155632',NULL,_binary '\0','2025-09-12 12:06:10.461649',1,46,NULL,45,NULL,NULL,NULL,NULL,'2025-09-11','',NULL,'15:30:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:00:00.000000','COMPLETED','김선희2 - 이재욱','INDIVIDUAL',NULL),(46,'2025-09-12 17:59:22.764839',NULL,_binary '\0','2025-09-17 09:31:49.200469',1,46,NULL,43,NULL,NULL,NULL,NULL,'2025-09-25','\n[상담사 이전] 상담 -> 김선희',NULL,'10:20:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','09:30:00.000000','BOOKED','상담 - 이재욱','INDIVIDUAL','MAIN001'),(47,'2025-09-12 23:25:22.747925',NULL,_binary '\0','2025-09-12 23:25:22.747925',0,23,NULL,43,NULL,NULL,NULL,NULL,'2025-09-25','',NULL,'17:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','17:00:00.000000','BOOKED','김선희 - 이재학','INDIVIDUAL','MAIN001'),(48,'2025-09-14 16:21:28.975026',NULL,_binary '\0','2025-09-17 09:52:57.898560',1,23,NULL,43,NULL,NULL,NULL,NULL,'2025-09-24','[관리자 확정] 입금 확인 완료',NULL,'15:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','15:00:00.000000','CONFIRMED','김선희 - 이재학','INDIVIDUAL','MAIN001'),(49,'2025-09-15 16:56:42.848363',NULL,_binary '\0','2025-09-15 16:56:42.848363',0,23,NULL,43,NULL,NULL,NULL,NULL,'2025-10-13','',NULL,'15:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','15:00:00.000000','BOOKED','김선희 - 이재학','INDIVIDUAL','MAIN001'),(50,'2025-09-16 11:00:48.718269',NULL,_binary '\0','2025-09-16 11:00:48.718269',0,46,NULL,45,NULL,NULL,NULL,NULL,'2025-09-25','',NULL,'15:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','15:00:00.000000','BOOKED','김선희2 - 이재욱','INDIVIDUAL','MAIN001'),(51,'2025-09-16 11:15:02.179726',NULL,_binary '\0','2025-09-16 17:10:00.021996',3,23,NULL,43,NULL,NULL,NULL,NULL,'2025-09-16','[관리자 확정] 입금 확인 완료\n[관리자 확정] 입금 확인 완료',NULL,'14:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','14:00:00.000000','COMPLETED','김선희 - 이재학','INDIVIDUAL','MAIN001'),(52,'2025-09-16 11:27:30.333853',NULL,_binary '\0','2025-09-16 17:10:00.024910',3,34,NULL,43,NULL,NULL,NULL,NULL,'2025-09-16','[관리자 확정] 입금 확인 완료\n[관리자 확정] 입금 확인 완료',NULL,'16:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','16:00:00.000000','COMPLETED','김선희 - 테스트내담자001','INDIVIDUAL','MAIN001'),(53,'2025-09-16 17:52:13.297023',NULL,_binary '\0','2025-09-17 09:52:48.060608',1,23,NULL,43,NULL,NULL,NULL,NULL,'2025-09-23','[관리자 확정] 입금 확인 완료',NULL,'11:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','11:00:00.000000','CONFIRMED','김선희 - 이재학','INDIVIDUAL','MAIN001'),(54,'2025-09-17 11:09:05.141888',NULL,_binary '\0','2025-09-17 11:09:05.141888',0,34,NULL,43,NULL,NULL,NULL,NULL,'2025-10-15','',NULL,'16:50:00.000000',_binary '\0',_binary '\0',_binary '\0',_binary '\0',NULL,NULL,'NORMAL',NULL,NULL,NULL,NULL,'CONSULTATION','16:00:00.000000','BOOKED','김선희 - 테스트내담자001','INDIVIDUAL','MAIN001');
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session_extension_requests`
--

DROP TABLE IF EXISTS `session_extension_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_extension_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `additional_sessions` int NOT NULL COMMENT '추가할 회기 수',
  `admin_comment` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '관리자 코멘트',
  `approved_at` datetime(6) DEFAULT NULL COMMENT '승인일시',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '생성일시',
  `package_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '패키지명',
  `package_price` decimal(15,2) NOT NULL COMMENT '패키지 가격',
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '요청 사유',
  `rejected_at` datetime(6) DEFAULT NULL COMMENT '거부일시',
  `rejection_reason` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '거부 사유',
  `status` enum('PENDING','PAYMENT_CONFIRMED','ADMIN_APPROVED','REJECTED','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING' COMMENT '요청 상태',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '수정일시',
  `approved_by` bigint DEFAULT NULL COMMENT '승인한 관리자 ID',
  `mapping_id` bigint NOT NULL COMMENT '매핑 ID',
  `requester_id` bigint NOT NULL COMMENT '요청자 ID',
  `payment_date` datetime(6) DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_reference` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKl4sq1qvb5her93hrk3y3ml5a0` (`approved_by`),
  KEY `FKb9fmcr2267ptecsvr86xihlce` (`mapping_id`),
  KEY `FKsuui7x7xplbtbfl0pjx4txbwy` (`requester_id`),
  CONSTRAINT `FKb9fmcr2267ptecsvr86xihlce` FOREIGN KEY (`mapping_id`) REFERENCES `consultant_client_mappings` (`id`),
  CONSTRAINT `FKl4sq1qvb5her93hrk3y3ml5a0` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKsuui7x7xplbtbfl0pjx4txbwy` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회기 추가 요청 테이블 - 입금 확인 및 관리자 승인 워크플로우 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session_extension_requests`
--

LOCK TABLES `session_extension_requests` WRITE;
/*!40000 ALTER TABLE `session_extension_requests` DISABLE KEYS */;
INSERT INTO `session_extension_requests` VALUES (1,5,'테스트용 회기 추가 승인','2025-09-15 10:05:22.748476','2025-09-15 10:05:07.263948','추가 회기 패키지',500000.00,'테스트용 회기 추가 요청',NULL,NULL,'COMPLETED','2025-09-15 10:05:26.285526',1,35,71,NULL,NULL,NULL),(2,20,'','2025-09-15 11:07:53.079870','2025-09-15 11:04:50.144906','STANDARD',400000.00,'회기 추가 요청',NULL,NULL,'ADMIN_APPROVED','2025-09-15 11:07:53.080067',1,36,1,NULL,NULL,NULL),(3,5,'현금 결제 확인 완료','2025-09-15 11:09:44.848600','2025-09-15 11:08:49.721630','BASIC',200000.00,'현금 결제 테스트',NULL,NULL,'COMPLETED','2025-09-15 11:09:47.282987',1,36,1,'2025-09-15 11:08:52.555083','CASH',NULL),(4,3,'동기화 테스트 승인','2025-09-15 11:11:28.477352','2025-09-15 11:11:22.446250','PREMIUM',600000.00,'동기화 테스트',NULL,NULL,'COMPLETED','2025-09-15 11:11:56.037950',1,36,1,'2025-09-15 11:11:25.529290','CASH',NULL),(5,20,'','2025-09-15 11:13:39.755232','2025-09-15 11:13:08.563895','STANDARD',400000.00,'회기 추가 요청',NULL,NULL,'COMPLETED','2025-09-15 11:15:32.409519',1,36,1,'2025-09-15 11:13:25.414627','CASH',NULL),(6,20,'','2025-09-15 11:23:22.171864','2025-09-15 11:17:40.789962','VIP',1000000.00,'회기 추가 요청',NULL,NULL,'COMPLETED','2025-09-15 11:23:29.389399',1,36,1,'2025-09-15 11:23:15.173665','CASH',NULL),(7,20,'','2025-09-15 11:23:52.282319','2025-09-15 11:22:04.519557','VIP',1000000.00,'회기 추가 요청',NULL,NULL,'COMPLETED','2025-09-15 11:23:55.440890',1,36,1,'2025-09-15 11:23:47.181139','CARD','CARD_20250915_112345');
/*!40000 ALTER TABLE `session_extension_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_accounts`
--

DROP TABLE IF EXISTS `social_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `access_token` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` bit(1) NOT NULL,
  `is_verified` bit(1) NOT NULL,
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_user_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `refresh_token` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_expires_in` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_accounts`
--

LOCK TABLES `social_accounts` WRITE;
/*!40000 ALTER TABLE `social_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `address_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail_address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_primary` bit(1) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `postal_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_addresses_user_id` (`user_id`),
  KEY `idx_user_addresses_address_type` (`address_type`),
  KEY `idx_user_addresses_is_primary` (`is_primary`),
  KEY `idx_user_addresses_is_deleted` (`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (1,'2025-09-01 16:37:06.836246',NULL,_binary '\0','2025-09-01 16:37:06.836246',0,'HOME','미추홀구','116동3305호','낙섬동로 134',_binary '',NULL,NULL,'22184','인천',NULL,23);
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `end_reason` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ended_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `last_activity_at` datetime(6) NOT NULL,
  `login_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `social_provider` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_bjoac5vd2jt3pnrfrdeb49014` (`session_id`),
  KEY `idx_user_sessions_user_id` (`user_id`),
  KEY `idx_user_sessions_session_id` (`session_id`),
  KEY `idx_user_sessions_is_active` (`is_active`),
  KEY `idx_user_sessions_created_at` (`created_at`),
  KEY `idx_user_sessions_expires_at` (`expires_at`),
  KEY `idx_user_sessions_client_ip` (`client_ip`),
  CONSTRAINT `FK8klxsgb8dcjjklmqebqp1twd5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=391 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` VALUES (1,'0:0:0:0:0:0:0:1','2025-09-10 08:54:42.544880','DUPLICATE_LOGIN','2025-09-10 08:55:39.975467','2025-09-10 09:24:42.544880',_binary '\0','2025-09-10 08:54:42.544880','NORMAL','879A33DF75E3790266627719EE1E73B4',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(6,'0:0:0:0:0:0:0:1','2025-09-10 08:58:02.355737','EXPIRED','2025-09-10 09:28:09.741707','2025-09-10 09:28:02.355737',_binary '\0','2025-09-10 08:58:02.355737','NORMAL','B1A54A84140513C3B514A3B479325069',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(7,'0:0:0:0:0:0:0:1','2025-09-10 09:28:55.317597','LOGOUT','2025-09-10 09:30:04.914997','2025-09-10 09:58:55.317597',_binary '\0','2025-09-10 09:28:55.317597','NORMAL','F2F15CC360FE39139CB0F8F0DF1455CA',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(19,'0:0:0:0:0:0:0:1','2025-09-10 12:17:02.552706','DUPLICATE_LOGIN','2025-09-10 12:17:22.497720','2025-09-10 12:47:02.552706',_binary '\0','2025-09-10 12:17:02.552706','NORMAL','4C4558D6F408A13EC5DA774EF5DF63A3',NULL,'curl/8.7.1',48),(21,'0:0:0:0:0:0:0:1','2025-09-10 12:20:00.179569','DUPLICATE_LOGIN','2025-09-10 12:23:41.307196','2025-09-10 12:50:00.179569',_binary '\0','2025-09-10 12:20:00.179569','NORMAL','0B625F983602DB0C51A5E68AB6E29759',NULL,'curl/8.7.1',48),(28,'0:0:0:0:0:0:0:1','2025-09-10 12:39:42.960415','EXPIRED','2025-09-10 13:10:30.204743','2025-09-10 13:09:42.960415',_binary '\0','2025-09-10 12:39:42.960415','NORMAL','3782A33F6768A38C0B8CEF1891F5C654',NULL,'curl/8.7.1',48),(29,'0:0:0:0:0:0:0:1','2025-09-10 12:39:50.785798','EXPIRED','2025-09-10 13:10:30.204743','2025-09-10 13:09:50.785798',_binary '\0','2025-09-10 12:39:50.785798','NORMAL','FC8A3D9BF5788BE105DDD4BFEB10C6F0',NULL,'curl/8.7.1',48),(31,'0:0:0:0:0:0:0:1','2025-09-10 12:40:19.725660','EXPIRED','2025-09-10 13:10:30.204743','2025-09-10 13:10:19.725660',_binary '\0','2025-09-10 12:40:19.725660','NORMAL','88BAAC316602D62A7204CC44E978C576',NULL,'curl/8.7.1',48),(33,'0:0:0:0:0:0:0:1','2025-09-10 12:40:55.445196','EXPIRED','2025-09-10 13:11:09.177404','2025-09-10 13:10:55.445196',_binary '\0','2025-09-10 12:40:55.445196','NORMAL','E9692F75134A4F38695E6D032DDA8B99',NULL,'curl/8.7.1',48),(35,'0:0:0:0:0:0:0:1','2025-09-10 12:41:41.388987','EXPIRED','2025-09-10 13:15:09.796487','2025-09-10 13:11:41.388987',_binary '\0','2025-09-10 12:41:41.388987','NORMAL','B3B77AA1221ACE7F4894C975C644C3FB',NULL,'curl/8.7.1',48),(37,'0:0:0:0:0:0:0:1','2025-09-10 12:42:18.992937','EXPIRED','2025-09-10 13:15:09.796487','2025-09-10 13:12:18.992937',_binary '\0','2025-09-10 12:42:18.992937','NORMAL','ECFD91580561437D27262BC52ED5B2B6',NULL,'curl/8.7.1',48),(39,'0:0:0:0:0:0:0:1','2025-09-10 12:43:04.101478','EXPIRED','2025-09-10 13:15:09.796487','2025-09-10 13:13:04.101478',_binary '\0','2025-09-10 12:43:04.101478','NORMAL','D8C8B53E7C6C068552B75B40540121B0',NULL,'curl/8.7.1',48),(41,'0:0:0:0:0:0:0:1','2025-09-10 12:43:43.099151','EXPIRED','2025-09-10 13:15:09.796487','2025-09-10 13:13:43.099151',_binary '\0','2025-09-10 12:43:43.099151','NORMAL','A57F17EA2483B74B54917BF939D81571',NULL,'curl/8.7.1',48),(43,'0:0:0:0:0:0:0:1','2025-09-10 12:44:21.833395','EXPIRED','2025-09-10 13:15:09.796487','2025-09-10 13:14:21.833395',_binary '\0','2025-09-10 12:44:21.833395','NORMAL','3591BC033374D58FA50EC483E7260DEE',NULL,'curl/8.7.1',48),(45,'0:0:0:0:0:0:0:1','2025-09-10 12:46:59.727625','EXPIRED','2025-09-10 13:17:07.992463','2025-09-10 13:16:59.727625',_binary '\0','2025-09-10 12:46:59.727625','NORMAL','E21868D279B890DE7611F90722160A67',NULL,'curl/8.7.1',48),(47,'0:0:0:0:0:0:0:1','2025-09-10 12:47:15.761637','EXPIRED','2025-09-10 13:17:47.087299','2025-09-10 13:17:15.761637',_binary '\0','2025-09-10 12:47:15.761637','NORMAL','847D93DBF1B83E3846CE44A3D97F9BE8',NULL,'curl/8.7.1',48),(49,'0:0:0:0:0:0:0:1','2025-09-10 12:47:59.977309','EXPIRED','2025-09-10 13:22:47.092725','2025-09-10 13:17:59.977309',_binary '\0','2025-09-10 12:47:59.977309','NORMAL','A9993181890051D52D7086525C4B4981',NULL,'curl/8.7.1',48),(51,'0:0:0:0:0:0:0:1','2025-09-10 12:48:09.983289','EXPIRED','2025-09-10 13:22:47.092725','2025-09-10 13:18:09.983289',_binary '\0','2025-09-10 12:48:09.983289','NORMAL','0F734F596A81AE0B6F1F5AC10D58FF25',NULL,'curl/8.7.1',48),(55,'0:0:0:0:0:0:0:1','2025-09-10 12:50:43.158271','EXPIRED','2025-09-10 13:22:47.092725','2025-09-10 13:20:43.158271',_binary '\0','2025-09-10 12:50:43.158271','NORMAL','18DB6394B0CCA0F0525A68EBC4544617',NULL,'curl/8.7.1',48),(64,'0:0:0:0:0:0:0:1','2025-09-10 13:17:59.322685','LOGOUT','2025-09-10 13:18:19.656397','2025-09-10 13:47:59.322685',_binary '\0','2025-09-10 13:17:59.322685','NORMAL','9D804EDA2E648BA2B010698B81895102',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(65,'0:0:0:0:0:0:0:1','2025-09-10 13:18:29.147101','LOGOUT','2025-09-10 13:37:31.614926','2025-09-10 13:48:29.147101',_binary '\0','2025-09-10 13:18:29.147101','NORMAL','4813169C94335CBDFF01AB9A6738B03B',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',43),(66,'0:0:0:0:0:0:0:1','2025-09-10 13:37:38.151605','LOGOUT','2025-09-10 13:37:59.157661','2025-09-10 14:07:38.151605',_binary '\0','2025-09-10 13:37:38.151605','NORMAL','405A8C671C8F2B8AB12B6BDF24593A22',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(67,'0:0:0:0:0:0:0:1','2025-09-10 13:38:03.719708','LOGOUT','2025-09-10 13:41:44.964771','2025-09-10 14:08:03.719708',_binary '\0','2025-09-10 13:38:03.719708','NORMAL','F6A668ADDE9E66849D742C9FD65F8813',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(68,'0:0:0:0:0:0:0:1','2025-09-10 13:41:48.448966','EXPIRED','2025-09-10 15:04:25.452701','2025-09-10 14:11:48.448966',_binary '\0','2025-09-10 13:41:48.448966','NORMAL','950BE6EC35A498F91B7DC893DCFCF838',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(69,'0:0:0:0:0:0:0:1','2025-09-10 15:29:27.416637','LOGOUT','2025-09-10 15:29:36.059381','2025-09-10 15:59:27.416637',_binary '\0','2025-09-10 15:29:27.416637','NORMAL','2A2F81B4D07D01941980C277046E1F4E',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(70,'0:0:0:0:0:0:0:1','2025-09-10 15:31:10.876536','LOGOUT','2025-09-10 15:31:21.740376','2025-09-10 16:01:10.876536',_binary '\0','2025-09-10 15:31:10.876536','NORMAL','FAECC8B233831B11AFD19CC4E28CBFF7',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',43),(71,'0:0:0:0:0:0:0:1','2025-09-10 16:30:24.507325','LOGOUT','2025-09-10 16:34:21.607309','2025-09-10 17:00:24.507325',_binary '\0','2025-09-10 16:30:24.507325','NORMAL','121DE6E657487DD03E8769FC6F3D8CEF',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',43),(72,'0:0:0:0:0:0:0:1','2025-09-10 16:34:26.209401','LOGOUT','2025-09-10 16:35:05.471580','2025-09-10 17:04:26.209401',_binary '\0','2025-09-10 16:34:26.209401','NORMAL','F9D7997211D9498F00F098C76FC1C102',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(73,'0:0:0:0:0:0:0:1','2025-09-10 16:35:10.335349','LOGOUT','2025-09-10 16:35:17.955090','2025-09-10 17:05:10.335349',_binary '\0','2025-09-10 16:35:10.335349','NORMAL','01C0718EAFC6AC9F0F4BE22F8EAB7BFF',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(74,'0:0:0:0:0:0:0:1','2025-09-10 16:35:22.492657','EXPIRED','2025-09-10 17:05:51.023273','2025-09-10 17:05:22.492657',_binary '\0','2025-09-10 16:35:22.492657','NORMAL','19BE5684C4DF80FEB4C88F4228445102',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(75,'0:0:0:0:0:0:0:1','2025-09-10 17:14:15.286085','EXPIRED','2025-09-10 17:45:45.615097','2025-09-10 17:44:15.286085',_binary '\0','2025-09-10 17:14:15.286085','NORMAL','218DCDACD2813971CBABA9832658FD42',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(76,'0:0:0:0:0:0:0:1','2025-09-10 19:01:37.985516','LOGOUT','2025-09-10 19:02:01.350120','2025-09-10 19:31:37.985516',_binary '\0','2025-09-10 19:01:37.985516','NORMAL','A614D8B6C53471EFDC10D404C30A9A9B',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(77,'0:0:0:0:0:0:0:1','2025-09-11 10:03:07.737083','DUPLICATE_LOGIN','2025-09-11 10:21:30.615616','2025-09-11 10:33:07.737083',_binary '\0','2025-09-11 10:03:07.737083','NORMAL','03B484EF66C2BB67E390593CAEAB9F77',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(79,'0:0:0:0:0:0:0:1','2025-09-11 10:25:09.536538','DUPLICATE_LOGIN','2025-09-11 10:41:44.162107','2025-09-11 10:55:09.536538',_binary '\0','2025-09-11 10:25:09.536538','NORMAL','50A8563E33E6C2D3A35B6F0B8778038B',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(80,'0:0:0:0:0:0:0:1','2025-09-11 10:41:44.168276','EXPIRED','2025-09-11 11:15:23.372688','2025-09-11 11:11:44.168276',_binary '\0','2025-09-11 10:41:44.168276','NORMAL','F90B110DD9CC0A6B5595C853875BB985',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',24),(82,'0:0:0:0:0:0:0:1','2025-09-11 12:34:55.040305','DUPLICATE_LOGIN','2025-09-11 12:39:05.013626','2025-09-11 13:04:55.040305',_binary '\0','2025-09-11 12:34:55.040305','NORMAL','3342E5422ABEF571595202E53C69A19F',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(85,'0:0:0:0:0:0:0:1','2025-09-11 13:29:45.822918','DUPLICATE_LOGIN','2025-09-11 13:41:39.083555','2025-09-11 13:59:45.822918',_binary '\0','2025-09-11 13:29:45.822918','NORMAL','86131155D482496149D04ACEAA8E0E3F',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(89,'0:0:0:0:0:0:0:1','2025-09-11 13:54:00.526031','LOGOUT','2025-09-11 14:12:13.025403','2025-09-11 14:24:00.526031',_binary '\0','2025-09-11 13:54:00.526031','NORMAL','46CA4A38AC6A688B8011279D5426E7D7',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(91,'0:0:0:0:0:0:0:1','2025-09-11 14:21:35.252589','DUPLICATE_LOGIN','2025-09-11 14:34:59.189479','2025-09-11 14:51:35.252589',_binary '\0','2025-09-11 14:21:35.252589','NORMAL','3DE1A1839AE9792DEB981C1AF7FF8522',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(98,'0:0:0:0:0:0:0:1','2025-09-11 15:20:53.587450','DUPLICATE_LOGIN','2025-09-11 15:28:45.303447','2025-09-11 15:50:53.587450',_binary '\0','2025-09-11 15:20:53.587450','NORMAL','C752FA070C69DE1B348565212D11E40A',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(103,'0:0:0:0:0:0:0:1','2025-09-11 16:16:39.696126','LOGOUT','2025-09-11 16:16:46.676796','2025-09-11 16:46:39.696126',_binary '\0','2025-09-11 16:16:39.696126','NORMAL','02737450F25CCC499B2703D329B1BF5F',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(104,'0:0:0:0:0:0:0:1','2025-09-11 16:16:50.715813','DUPLICATE_LOGIN','2025-09-11 16:23:15.877132','2025-09-11 16:46:50.715813',_binary '\0','2025-09-11 16:16:50.715813','NORMAL','F69B930C1D6A4547FF6E906C93ABBA77',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(111,'0:0:0:0:0:0:0:1','2025-09-11 17:34:15.647189','EXPIRED','2025-09-11 20:08:19.665332','2025-09-11 18:04:15.647189',_binary '\0','2025-09-11 17:34:15.647189','NORMAL','FC6AF25B06A0FE2D7F17305B0082C30D',NULL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',48),(114,'0:0:0:0:0:0:0:1','2025-09-12 10:22:30.144906','DUPLICATE_LOGIN','2025-09-12 10:48:53.716379','2025-09-12 10:52:30.144906',_binary '\0','2025-09-12 10:22:30.144906','NORMAL','656FD800A56AB497DF52B7C46E7CFBDA',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(116,'0:0:0:0:0:0:0:1','2025-09-12 11:10:24.056478','EXPIRED','2025-09-12 11:42:14.383009','2025-09-12 11:40:24.056478',_binary '\0','2025-09-12 11:10:24.056478','NORMAL','C7E2F3B7326EAF11B452CBEA02DA2DC4',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(117,'0:0:0:0:0:0:0:1','2025-09-12 11:54:07.823204','LOGOUT','2025-09-12 12:03:49.749049','2025-09-12 12:24:07.823204',_binary '\0','2025-09-12 11:54:07.823204','NORMAL','D5B6C3A34E644A16526FF0F1C87D9C12',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(118,'0:0:0:0:0:0:0:1','2025-09-12 12:03:53.667959','LOGOUT','2025-09-12 12:04:10.249608','2025-09-12 12:33:53.667959',_binary '\0','2025-09-12 12:03:53.667959','NORMAL','01CD4850961F157120E6F4B771518050',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(120,'0:0:0:0:0:0:0:1','2025-09-12 13:24:22.843841','EXPIRED','2025-09-12 14:24:15.256396','2025-09-12 13:54:22.843841',_binary '\0','2025-09-12 13:24:22.843841','NORMAL','8D91087B43862AAC1153450CEB9F82AF',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(121,'0:0:0:0:0:0:0:1','2025-09-12 15:03:18.385552','DUPLICATE_LOGIN','2025-09-12 15:06:52.569302','2025-09-12 15:33:18.385552',_binary '\0','2025-09-12 15:03:18.385552','NORMAL','AF65A0E6D7D3228112676D7A11FA8DD2',NULL,'curl&#x2F;8.7.1',24),(122,'0:0:0:0:0:0:0:1','2025-09-12 15:06:52.574572','DUPLICATE_LOGIN','2025-09-12 15:08:57.844250','2025-09-12 15:36:52.574572',_binary '\0','2025-09-12 15:06:52.574572','NORMAL','4084B88D80F6E1EE0E6C9BE0F4B3DE99',NULL,'curl&#x2F;8.7.1',24),(123,'0:0:0:0:0:0:0:1','2025-09-12 15:08:57.850275','DUPLICATE_LOGIN','2025-09-12 15:16:06.225433','2025-09-12 15:38:57.850275',_binary '\0','2025-09-12 15:08:57.850275','NORMAL','280A0141579EA26B6BEB8D74711EE2A1',NULL,'curl&#x2F;8.7.1',24),(124,'0:0:0:0:0:0:0:1','2025-09-12 15:10:48.827358','DUPLICATE_LOGIN','2025-09-12 15:15:56.888501','2025-09-12 15:40:48.827358',_binary '\0','2025-09-12 15:10:48.827358','NORMAL','DC90C47D86414F64859F4E0040DF73FE',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(125,'0:0:0:0:0:0:0:1','2025-09-12 15:15:56.898844','LOGOUT','2025-09-12 15:16:02.045149','2025-09-12 15:45:56.898844',_binary '\0','2025-09-12 15:15:56.898844','NORMAL','A5005AD089FACA75920A711C1F7AF0F3',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(126,'0:0:0:0:0:0:0:1','2025-09-12 15:16:06.229041','LOGOUT','2025-09-12 15:16:16.453051','2025-09-12 15:46:06.229041',_binary '\0','2025-09-12 15:16:06.229041','NORMAL','6C994EFFC8F341A719DA27A08552A875',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(127,'0:0:0:0:0:0:0:1','2025-09-12 15:16:20.499501','LOGOUT','2025-09-12 15:21:23.332993','2025-09-12 15:46:20.499501',_binary '\0','2025-09-12 15:16:20.499501','NORMAL','BAECBF66BC4BEE114811EE57BA2C5445',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(128,'0:0:0:0:0:0:0:1','2025-09-12 15:21:25.570251','LOGOUT','2025-09-12 15:21:50.451643','2025-09-12 15:51:25.570251',_binary '\0','2025-09-12 15:21:25.570251','NORMAL','0BD06EA41858CF65D8673C878E188016',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(129,'0:0:0:0:0:0:0:1','2025-09-12 15:22:56.001844','LOGOUT','2025-09-12 15:24:31.955368','2025-09-12 15:52:56.001844',_binary '\0','2025-09-12 15:22:56.001844','NORMAL','88A1790A0AFF4A6FA51799CECAD44F12',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(130,'0:0:0:0:0:0:0:1','2025-09-12 15:25:08.091092','LOGOUT','2025-09-12 15:26:48.201521','2025-09-12 15:55:08.091092',_binary '\0','2025-09-12 15:25:08.091092','NORMAL','AC9D643A596825B3AAEB0770AE1DC4FB',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(131,'0:0:0:0:0:0:0:1','2025-09-12 15:27:06.024032','LOGOUT','2025-09-12 15:28:02.500476','2025-09-12 15:57:06.024032',_binary '\0','2025-09-12 15:27:06.024032','NORMAL','C7DC8CF86B566536A1D1E367A8939F01',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(133,'0:0:0:0:0:0:0:1','2025-09-12 15:40:43.203697','LOGOUT','2025-09-12 15:41:16.632451','2025-09-12 16:10:43.203697',_binary '\0','2025-09-12 15:40:43.203697','NORMAL','45AFD0366B8A55A67DE4D587480CC010',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(138,'0:0:0:0:0:0:0:1','2025-09-12 16:18:58.071020','DUPLICATE_LOGIN','2025-09-12 16:43:05.865583','2025-09-12 16:48:58.071020',_binary '\0','2025-09-12 16:18:58.071020','NORMAL','F82EC3159D2B834B3A02E83D3555E892',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(139,'0:0:0:0:0:0:0:1','2025-09-12 16:43:05.871652','DUPLICATE_LOGIN','2025-09-12 16:44:52.019355','2025-09-12 17:13:05.871652',_binary '\0','2025-09-12 16:43:05.871652','NORMAL','98E79B49AB0D007CC289E5F9D80933DB',NULL,'curl&#x2F;8.7.1',48),(141,'0:0:0:0:0:0:0:1','2025-09-12 16:49:28.118794','DUPLICATE_LOGIN','2025-09-12 16:51:28.299617','2025-09-12 17:19:28.118794',_binary '\0','2025-09-12 16:49:28.118794','NORMAL','1002BCC6103BF15C6C77DC544E3279B9',NULL,'curl&#x2F;8.7.1',48),(142,'0:0:0:0:0:0:0:1','2025-09-12 16:51:28.302850','DUPLICATE_LOGIN','2025-09-12 16:51:45.256016','2025-09-12 17:21:28.302850',_binary '\0','2025-09-12 16:51:28.302850','NORMAL','6E8205F4FFF474608D51B8F19EE688C2',NULL,'curl&#x2F;8.7.1',48),(144,'0:0:0:0:0:0:0:1','2025-09-12 17:00:26.714786','DUPLICATE_LOGIN','2025-09-12 17:27:51.808777','2025-09-12 17:30:26.714786',_binary '\0','2025-09-12 17:00:26.714786','NORMAL','6786D64C7466512CDEBD5F96F14A8F48',NULL,'curl&#x2F;8.7.1',24),(146,'0:0:0:0:0:0:0:1','2025-09-12 17:25:34.694110','LOGOUT','2025-09-12 17:27:47.915043','2025-09-12 17:55:34.694110',_binary '\0','2025-09-12 17:25:34.694110','NORMAL','4BCFFDB376401DE69B621BB1090A032D',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(147,'0:0:0:0:0:0:0:1','2025-09-12 17:27:51.811341','LOGOUT','2025-09-12 17:28:29.458050','2025-09-12 17:57:51.811341',_binary '\0','2025-09-12 17:27:51.811341','NORMAL','045A2D39983A9039F0C6C8B8E3AA73F8',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(148,'0:0:0:0:0:0:0:1','2025-09-12 17:30:43.760496','DUPLICATE_LOGIN','2025-09-12 17:33:23.051955','2025-09-12 18:00:43.760496',_binary '\0','2025-09-12 17:30:43.760496','NORMAL','28EB3D59E68DA871F1D8D10A2635EAC9',NULL,'curl&#x2F;8.7.1',24),(149,'0:0:0:0:0:0:0:1','2025-09-12 17:33:23.055651','DUPLICATE_LOGIN','2025-09-12 17:34:43.312665','2025-09-12 18:03:23.055651',_binary '\0','2025-09-12 17:33:23.055651','NORMAL','38012F5C3B8D638957B14B0CC8A0712C',NULL,'curl&#x2F;8.7.1',24),(150,'0:0:0:0:0:0:0:1','2025-09-12 17:34:43.316083','DUPLICATE_LOGIN','2025-09-12 17:35:42.710965','2025-09-12 18:04:43.316083',_binary '\0','2025-09-12 17:34:43.316083','NORMAL','13BAFCA13C6AFEE81DB6D7BD3390F91C',NULL,'curl&#x2F;8.7.1',24),(151,'0:0:0:0:0:0:0:1','2025-09-12 17:35:42.715077','DUPLICATE_LOGIN','2025-09-12 17:36:13.353276','2025-09-12 18:05:42.715077',_binary '\0','2025-09-12 17:35:42.715077','NORMAL','093F211CEFDE755B91AED21BD3F7A2E6',NULL,'curl&#x2F;8.7.1',24),(153,'0:0:0:0:0:0:0:1','2025-09-12 17:37:29.274746','DUPLICATE_LOGIN','2025-09-12 17:39:17.685983','2025-09-12 18:07:29.274746',_binary '\0','2025-09-12 17:37:29.274746','NORMAL','B7CDE4122B090BE53138BDA7EEB3BC77',NULL,'curl&#x2F;8.7.1',24),(154,'0:0:0:0:0:0:0:1','2025-09-12 17:39:17.690450','DUPLICATE_LOGIN','2025-09-12 17:39:49.711757','2025-09-12 18:09:17.690450',_binary '\0','2025-09-12 17:39:17.690450','NORMAL','7B690C37FE409398AADFB311A00AF1B4',NULL,'curl&#x2F;8.7.1',24),(155,'0:0:0:0:0:0:0:1','2025-09-12 17:39:49.714914','DUPLICATE_LOGIN','2025-09-12 17:40:54.588529','2025-09-12 18:09:49.714914',_binary '\0','2025-09-12 17:39:49.714914','NORMAL','37C45D605A96E04CFD3A12DBA91880D3',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(156,'0:0:0:0:0:0:0:1','2025-09-12 17:40:54.595741','DUPLICATE_LOGIN','2025-09-12 17:42:04.185041','2025-09-12 18:10:54.595741',_binary '\0','2025-09-12 17:40:54.595741','NORMAL','7A096DFC5124E91228CD79FFC9F1BC40',NULL,'curl&#x2F;8.7.1',24),(157,'0:0:0:0:0:0:0:1','2025-09-12 17:42:04.188082','DUPLICATE_LOGIN','2025-09-12 17:43:19.691531','2025-09-12 18:12:04.188082',_binary '\0','2025-09-12 17:42:04.188082','NORMAL','223991DE1C0440CC52A09C2691D44BC9',NULL,'curl&#x2F;8.7.1',24),(158,'0:0:0:0:0:0:0:1','2025-09-12 17:43:19.695030','DUPLICATE_LOGIN','2025-09-12 17:46:53.973086','2025-09-12 18:13:19.695030',_binary '\0','2025-09-12 17:43:19.695030','NORMAL','60F289E8CDACCF74B1731CC0971499FB',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(159,'0:0:0:0:0:0:0:1','2025-09-12 17:46:53.978295','DUPLICATE_LOGIN','2025-09-12 17:48:09.604370','2025-09-12 18:16:53.978295',_binary '\0','2025-09-12 17:46:53.978295','NORMAL','DC0945D61185412C40301BC8E8FF57BA',NULL,'curl&#x2F;8.7.1',24),(160,'0:0:0:0:0:0:0:1','2025-09-12 17:48:09.611099','DUPLICATE_LOGIN','2025-09-12 17:48:25.593571','2025-09-12 18:18:09.611099',_binary '\0','2025-09-12 17:48:09.611099','NORMAL','E3E41D1AC3E73BA71DBA73904F30F938',NULL,'curl&#x2F;8.7.1',24),(162,'0:0:0:0:0:0:0:1','2025-09-12 17:48:36.528551','DUPLICATE_LOGIN','2025-09-12 17:49:38.975251','2025-09-12 18:18:36.528551',_binary '\0','2025-09-12 17:48:36.528551','NORMAL','BB0763A4536D767F698D46C9C7D81BB0',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(163,'0:0:0:0:0:0:0:1','2025-09-12 17:49:38.980984','DUPLICATE_LOGIN','2025-09-12 17:49:46.756088','2025-09-12 18:19:38.980984',_binary '\0','2025-09-12 17:49:38.980984','NORMAL','544E6A114C5C9924EE7B28682DD44AF3',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(164,'0:0:0:0:0:0:0:1','2025-09-12 17:49:46.759504','DUPLICATE_LOGIN','2025-09-12 17:50:47.895178','2025-09-12 18:19:46.759504',_binary '\0','2025-09-12 17:49:46.759504','NORMAL','D96DE4B6C4BA90C1F34EBACDFE9D6573',NULL,'curl&#x2F;8.7.1',24),(165,'0:0:0:0:0:0:0:1','2025-09-12 17:50:47.898142','DUPLICATE_LOGIN','2025-09-12 17:51:57.685243','2025-09-12 18:20:47.898142',_binary '\0','2025-09-12 17:50:47.898142','NORMAL','7C0A619993F1656B3A4D6046E8AE9C77',NULL,'curl&#x2F;8.7.1',24),(166,'0:0:0:0:0:0:0:1','2025-09-12 17:51:57.691883','DUPLICATE_LOGIN','2025-09-12 17:52:28.380204','2025-09-12 18:21:57.691883',_binary '\0','2025-09-12 17:51:57.691883','NORMAL','642F65D4DE2F176DD398D4DF3265FE17',NULL,'curl&#x2F;8.7.1',24),(168,'0:0:0:0:0:0:0:1','2025-09-12 17:55:34.518555','DUPLICATE_LOGIN','2025-09-12 17:56:29.679302','2025-09-12 18:25:34.518555',_binary '\0','2025-09-12 17:55:34.518555','NORMAL','7414FD9B9592125ABB262245DA8FB4DC',NULL,'curl&#x2F;8.7.1',24),(169,'0:0:0:0:0:0:0:1','2025-09-12 17:56:29.685859','DUPLICATE_LOGIN','2025-09-12 17:57:01.639188','2025-09-12 18:26:29.685859',_binary '\0','2025-09-12 17:56:29.685859','NORMAL','04E3E500FFE08222AF59472B63DFC08A',NULL,'curl&#x2F;8.7.1',24),(170,'0:0:0:0:0:0:0:1','2025-09-12 17:57:01.643708','LOGOUT','2025-09-12 18:02:25.793720','2025-09-12 18:27:01.643708',_binary '\0','2025-09-12 17:57:01.643708','NORMAL','2E2BEE00ECCE176A2F05BA36BCC1AC61',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(171,'0:0:0:0:0:0:0:1','2025-09-12 18:01:49.796932','DUPLICATE_LOGIN','2025-09-12 18:03:48.878292','2025-09-12 18:31:49.796932',_binary '\0','2025-09-12 18:01:49.796932','NORMAL','0026015DFBA22391C520FA081CC82520',NULL,'curl&#x2F;8.7.1',24),(173,'0:0:0:0:0:0:0:1','2025-09-12 18:03:48.881435','EXPIRED','2025-09-12 20:55:43.093615','2025-09-12 18:33:48.881435',_binary '\0','2025-09-12 18:03:48.881435','NORMAL','EDAE6664A71928B31B30C85DA0B85FB6',NULL,'curl&#x2F;8.7.1',24),(177,'0:0:0:0:0:0:0:1','2025-09-12 18:21:04.715056','EXPIRED','2025-09-12 20:55:43.093615','2025-09-12 18:51:04.715056',_binary '\0','2025-09-12 18:21:04.715056','NORMAL','02A67E09B3DD7EB4F22FFB8B3B5EF8E5',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(180,'0:0:0:0:0:0:0:1','2025-09-12 21:04:32.245716','EXPIRED','2025-09-12 21:36:36.017729','2025-09-12 21:34:32.245716',_binary '\0','2025-09-12 21:04:32.245716','NORMAL','B5FB3E06F38FDE04465452669DE3ED28',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(181,'0:0:0:0:0:0:0:1','2025-09-12 21:55:58.966659','DUPLICATE_LOGIN','2025-09-12 22:25:32.651445','2025-09-12 22:25:58.966659',_binary '\0','2025-09-12 21:55:58.966659','NORMAL','2B54AD65D3BF1BB0B25887B7D3603CA1',NULL,'curl&#x2F;8.7.1',48),(182,'0:0:0:0:0:0:0:1','2025-09-12 22:25:32.658863','DUPLICATE_LOGIN','2025-09-12 22:39:19.810535','2025-09-12 22:55:32.658863',_binary '\0','2025-09-12 22:25:32.658863','NORMAL','AFD18DE69E5637258F5CFA8C50261FD1',NULL,'curl&#x2F;8.7.1',48),(183,'0:0:0:0:0:0:0:1','2025-09-12 22:39:19.817596','LOGOUT','2025-09-12 22:47:47.014053','2025-09-12 23:09:19.817596',_binary '\0','2025-09-12 22:39:19.817596','NORMAL','5C81CCCFE8F6312CD99928E9693B0B63',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(184,'0:0:0:0:0:0:0:1','2025-09-12 22:47:10.558113','DUPLICATE_LOGIN','2025-09-12 22:47:48.631918','2025-09-12 23:17:10.558113',_binary '\0','2025-09-12 22:47:10.558113','NORMAL','081BE572D0B933E311E7BB34F4463695',NULL,'curl&#x2F;8.7.1',48),(185,'0:0:0:0:0:0:0:1','2025-09-12 22:47:33.672904','DUPLICATE_LOGIN','2025-09-12 22:52:39.622055','2025-09-12 23:17:33.672904',_binary '\0','2025-09-12 22:47:33.672904','NORMAL','98AA22E45C1B96445B627B0EC2E31408',NULL,'curl&#x2F;8.7.1',24),(186,'0:0:0:0:0:0:0:1','2025-09-12 22:47:48.634445','LOGOUT','2025-09-12 22:51:52.622495','2025-09-12 23:17:48.634445',_binary '\0','2025-09-12 22:47:48.634445','NORMAL','F0C91893BF60EDB5CC2EBCEEC87A657E',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(187,'0:0:0:0:0:0:0:1','2025-09-12 22:51:54.048146','LOGOUT','2025-09-12 22:52:42.466551','2025-09-12 23:21:54.048146',_binary '\0','2025-09-12 22:51:54.048146','NORMAL','A3B9577B6D0EF84A0504287F22EBD372',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(188,'0:0:0:0:0:0:0:1','2025-09-12 22:52:22.751899','DUPLICATE_LOGIN','2025-09-12 22:52:31.405672','2025-09-12 23:22:22.751899',_binary '\0','2025-09-12 22:52:22.751899','NORMAL','94C9369D0875163AB0ED0DA569D72561',NULL,'curl&#x2F;8.7.1',48),(189,'0:0:0:0:0:0:0:1','2025-09-12 22:52:31.408553','DUPLICATE_LOGIN','2025-09-12 22:52:43.754465','2025-09-12 23:22:31.408553',_binary '\0','2025-09-12 22:52:31.408553','NORMAL','8C8A216DB28ED0F85367B7F3561D3DF8',NULL,'curl&#x2F;8.7.1',48),(190,'0:0:0:0:0:0:0:1','2025-09-12 22:52:39.624811','DUPLICATE_LOGIN','2025-09-12 23:08:25.132105','2025-09-12 23:22:39.624811',_binary '\0','2025-09-12 22:52:39.624811','NORMAL','E31A5BAAC173BAF56E7A2B08F0EBB92B',NULL,'curl&#x2F;8.7.1',24),(191,'0:0:0:0:0:0:0:1','2025-09-12 22:52:43.757107','LOGOUT','2025-09-12 22:53:02.463542','2025-09-12 23:22:43.757107',_binary '\0','2025-09-12 22:52:43.757107','NORMAL','59B39BB22F06C657B4C820888DABB8B3',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(192,'0:0:0:0:0:0:0:1','2025-09-12 22:53:04.514940','LOGOUT','2025-09-12 22:53:14.170546','2025-09-12 23:23:04.514940',_binary '\0','2025-09-12 22:53:04.514940','NORMAL','6A0808877D3AA9EB4B9B3C26C55925D5',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(193,'0:0:0:0:0:0:0:1','2025-09-12 22:53:17.737963','LOGOUT','2025-09-12 22:58:58.494042','2025-09-12 23:23:17.737963',_binary '\0','2025-09-12 22:53:17.737963','NORMAL','B417A46EB6EE9FD426D1C708F15486C9',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(194,'0:0:0:0:0:0:0:1','2025-09-12 22:59:01.822245','LOGOUT','2025-09-12 22:59:36.382841','2025-09-12 23:29:01.822245',_binary '\0','2025-09-12 22:59:01.822245','NORMAL','BB6E0922814231C0A9C41EF0E481CB97',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(195,'0:0:0:0:0:0:0:1','2025-09-12 23:00:12.419901','DUPLICATE_LOGIN','2025-09-12 23:03:45.665175','2025-09-12 23:30:12.419901',_binary '\0','2025-09-12 23:00:12.419901','NORMAL','19DE9BB1A3A6141C1A5586D9280E3A98',NULL,'curl&#x2F;8.7.1',48),(196,'0:0:0:0:0:0:0:1','2025-09-12 23:03:45.674297','DUPLICATE_LOGIN','2025-09-12 23:11:32.566399','2025-09-12 23:33:45.674297',_binary '\0','2025-09-12 23:03:45.674297','NORMAL','3BFB9E081F29ED81278C3847E3717853',NULL,'curl&#x2F;8.7.1',48),(197,'0:0:0:0:0:0:0:1','2025-09-12 23:08:25.137220','DUPLICATE_LOGIN','2025-09-12 23:11:57.751575','2025-09-12 23:38:25.137220',_binary '\0','2025-09-12 23:08:25.137220','NORMAL','11F9E81C0C4E5412BF3B88D89C2DC98E',NULL,'curl&#x2F;8.7.1',24),(198,'0:0:0:0:0:0:0:1','2025-09-12 23:10:53.193406','EXPIRED','2025-09-12 23:41:39.720368','2025-09-12 23:40:53.193406',_binary '\0','2025-09-12 23:10:53.193406','NORMAL','37EDCE443780479FB54114FC08115323',NULL,'curl&#x2F;8.7.1',51),(199,'0:0:0:0:0:0:0:1','2025-09-12 23:11:32.571535','LOGOUT','2025-09-12 23:11:54.123472','2025-09-12 23:41:32.571535',_binary '\0','2025-09-12 23:11:32.571535','NORMAL','65889D884508A7E284C244714A2CF967',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(200,'0:0:0:0:0:0:0:1','2025-09-12 23:11:57.755131','LOGOUT','2025-09-12 23:12:31.381458','2025-09-12 23:41:57.755131',_binary '\0','2025-09-12 23:11:57.755131','NORMAL','86AB071D1B49127A0A150939E8086974',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(201,'0:0:0:0:0:0:0:1','2025-09-12 23:12:46.061428','LOGOUT','2025-09-12 23:13:01.128343','2025-09-12 23:42:46.061428',_binary '\0','2025-09-12 23:12:46.061428','NORMAL','68A8AC90A6C62EEF028084D1ED94E638',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(202,'0:0:0:0:0:0:0:1','2025-09-12 23:13:02.993868','LOGOUT','2025-09-12 23:13:09.484142','2025-09-12 23:43:02.993868',_binary '\0','2025-09-12 23:13:02.993868','NORMAL','3258188567D0CF4FA65567E6E180AF41',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(203,'0:0:0:0:0:0:0:1','2025-09-12 23:13:15.502236','LOGOUT','2025-09-12 23:22:14.742159','2025-09-12 23:43:15.502236',_binary '\0','2025-09-12 23:13:15.502236','NORMAL','1145F53B37D2BA72AD329ACF2ED5F1C0',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(204,'0:0:0:0:0:0:0:1','2025-09-12 23:16:34.241975','DUPLICATE_LOGIN','2025-09-12 23:21:38.609848','2025-09-12 23:46:34.241975',_binary '\0','2025-09-12 23:16:34.241975','NORMAL','DD4C6FA81A1D3F0D02F62EE35670CE55',NULL,'curl&#x2F;8.7.1',48),(205,'0:0:0:0:0:0:0:1','2025-09-12 23:21:38.613654','DUPLICATE_LOGIN','2025-09-12 23:22:16.375924','2025-09-12 23:51:38.613654',_binary '\0','2025-09-12 23:21:38.613654','NORMAL','556D0102851E1EB587FC96BF71FD0B21',NULL,'curl&#x2F;8.7.1',48),(208,'0:0:0:0:0:0:0:1','2025-09-12 23:37:36.114705','LOGOUT','2025-09-12 23:38:13.785364','2025-09-13 00:07:36.114705',_binary '\0','2025-09-12 23:37:36.114705','NORMAL','596AA1D72C85D6F4D378CBF76CF12940',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(209,'0:0:0:0:0:0:0:1','2025-09-12 23:38:18.638045','LOGOUT','2025-09-12 23:39:12.446170','2025-09-13 00:08:18.638045',_binary '\0','2025-09-12 23:38:18.638045','NORMAL','2EFFED53CBE63F74989A46B1D68DCCA9',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(210,'0:0:0:0:0:0:0:1','2025-09-12 23:39:36.210812','LOGOUT','2025-09-12 23:42:35.402470','2025-09-13 00:09:36.210812',_binary '\0','2025-09-12 23:39:36.210812','NORMAL','C9599D8261F5E796B2AD8F4D22C44965',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(211,'0:0:0:0:0:0:0:1','2025-09-12 23:44:26.535236','LOGOUT','2025-09-12 23:50:46.516102','2025-09-13 00:14:26.535236',_binary '\0','2025-09-12 23:44:26.535236','NORMAL','97C3CF8FDFE313F505C8135DA7E8652B',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;537.36 (KHTML, like Gecko) Chrome&#x2F;138.0.0.0 Whale&#x2F;4.33.325.17 Safari&#x2F;537.36',48),(212,'0:0:0:0:0:0:0:1','2025-09-12 23:50:52.287303','LOGOUT','2025-09-12 23:51:47.087160','2025-09-13 00:20:52.287303',_binary '\0','2025-09-12 23:50:52.287303','NORMAL','0705091404A2F943DC6CBAE859BC0367',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(213,'0:0:0:0:0:0:0:1','2025-09-12 23:51:51.904972','LOGOUT','2025-09-12 23:55:33.954279','2025-09-13 00:21:51.904972',_binary '\0','2025-09-12 23:51:51.904972','NORMAL','95551555C82B441E854F9FFDA6AB38BC',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(215,'0:0:0:0:0:0:0:1','2025-09-12 23:58:20.897328','LOGOUT','2025-09-12 23:59:51.995780','2025-09-13 00:28:20.897328',_binary '\0','2025-09-12 23:58:20.897328','NORMAL','4F6088DE3B9E93BE6FB62F94FD9852B4',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(216,'0:0:0:0:0:0:0:1','2025-09-13 00:00:57.566751','LOGOUT','2025-09-13 00:01:34.274046','2025-09-13 00:30:57.566751',_binary '\0','2025-09-13 00:00:57.566751','NORMAL','514BC780F8D2819A468C9350BD386654',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(218,'0:0:0:0:0:0:0:1','2025-09-13 00:04:33.972672','DUPLICATE_LOGIN','2025-09-13 00:05:20.092489','2025-09-13 00:34:33.972672',_binary '\0','2025-09-13 00:04:33.972672','NORMAL','3056DD9050F3F7B4260B435E0E55FF20',NULL,'curl&#x2F;8.7.1',48),(220,'0:0:0:0:0:0:0:1','2025-09-13 00:12:40.606522','DUPLICATE_LOGIN','2025-09-13 00:13:53.692918','2025-09-13 00:42:40.606522',_binary '\0','2025-09-13 00:12:40.606522','NORMAL','34CE47C2CB1E866D345C6C6C3E54801A',NULL,'curl&#x2F;8.7.1',48),(221,'0:0:0:0:0:0:0:1','2025-09-13 00:13:53.695799','LOGOUT','2025-09-13 00:14:49.981469','2025-09-13 00:43:53.695799',_binary '\0','2025-09-13 00:13:53.695799','NORMAL','EE080A37E9BA8D34F2A10F42B8DA3A85',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(222,'0:0:0:0:0:0:0:1','2025-09-13 01:22:16.860689','LOGOUT','2025-09-13 01:24:46.553541','2025-09-13 01:52:16.860689',_binary '\0','2025-09-13 01:22:16.860689','NORMAL','F2970A8B9EB9CCBFA4C4FE5C82B9DE73',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(224,'0:0:0:0:0:0:0:1','2025-09-14 15:16:31.807619','EXPIRED','2025-09-14 15:50:20.432295','2025-09-14 15:46:31.807619',_binary '\0','2025-09-14 15:16:31.807619','NORMAL','AE8ECAC06DAF546319C64AE50F18EF93',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(225,'0:0:0:0:0:0:0:1','2025-09-14 15:49:47.137010','DUPLICATE_LOGIN','2025-09-14 15:55:49.755383','2025-09-14 16:19:47.137010',_binary '\0','2025-09-14 15:49:47.137010','NORMAL','789CE6F26924B76FCE1BE42733BEEC0D',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(227,'0:0:0:0:0:0:0:1','2025-09-14 15:59:18.088834','DUPLICATE_LOGIN','2025-09-14 16:02:56.961361','2025-09-14 16:29:18.088834',_binary '\0','2025-09-14 15:59:18.088834','NORMAL','7A97E55F682FAE70409802EEC544DDCA',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(228,'0:0:0:0:0:0:0:1','2025-09-14 16:02:56.968784','LOGOUT','2025-09-14 16:05:53.949326','2025-09-14 16:32:56.968784',_binary '\0','2025-09-14 16:02:56.968784','NORMAL','57B44967CD5545D358BE9E0C4766D188',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(229,'0:0:0:0:0:0:0:1','2025-09-14 16:05:55.473466','LOGOUT','2025-09-14 16:07:26.845370','2025-09-14 16:35:55.473466',_binary '\0','2025-09-14 16:05:55.473466','NORMAL','E12523584E43DF3EC57A698AA3D2F369',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(230,'0:0:0:0:0:0:0:1','2025-09-14 16:07:28.250677','LOGOUT','2025-09-14 16:17:29.821250','2025-09-14 16:37:28.250677',_binary '\0','2025-09-14 16:07:28.250677','NORMAL','0923E854B19AEA8554647120108CF0E3',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(231,'0:0:0:0:0:0:0:1','2025-09-14 16:17:31.540909','LOGOUT','2025-09-14 16:26:58.335860','2025-09-14 16:47:31.540909',_binary '\0','2025-09-14 16:17:31.540909','NORMAL','794F4D8D5E1034EEDF517C6F2DBDDE30',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(232,'0:0:0:0:0:0:0:1','2025-09-14 16:26:59.877082','DUPLICATE_LOGIN','2025-09-14 16:29:46.418797','2025-09-14 16:56:59.877082',_binary '\0','2025-09-14 16:26:59.877082','NORMAL','E407A5AECE70A086998C5EDF438F6C80',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(233,'0:0:0:0:0:0:0:1','2025-09-14 16:29:46.425813','EXPIRED','2025-09-14 17:46:42.838256','2025-09-14 16:59:46.425813',_binary '\0','2025-09-14 16:29:46.425813','NORMAL','F5D8F905CFB0EE21EADD88C3DCCCF800',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(234,'0:0:0:0:0:0:0:1','2025-09-14 17:46:58.246559','LOGOUT','2025-09-14 17:47:12.128616','2025-09-14 18:16:58.246559',_binary '\0','2025-09-14 17:46:58.246559','NORMAL','A9F7BAA676FF0DB80A0BAF79EC8491FB',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(235,'0:0:0:0:0:0:0:1','2025-09-14 17:47:15.585070','EXPIRED','2025-09-14 18:40:25.660515','2025-09-14 18:17:15.585070',_binary '\0','2025-09-14 17:47:15.585070','NORMAL','AAB5DAD7EA58663D8C2F2159996CAF79',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(238,'0:0:0:0:0:0:0:1','2025-09-14 18:50:30.140917','LOGOUT','2025-09-14 18:51:08.403194','2025-09-14 19:20:30.140917',_binary '\0','2025-09-14 18:50:30.140917','NORMAL','6D149486693C90D0D1D33A266C8C7CE4',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(239,'0:0:0:0:0:0:0:1','2025-09-14 18:51:12.072851','LOGOUT','2025-09-14 18:52:01.443098','2025-09-14 19:21:12.072851',_binary '\0','2025-09-14 18:51:12.072851','NORMAL','97EBE51CA3D07D3B232D7A6B9DDA7E9F',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(240,'0:0:0:0:0:0:0:1','2025-09-14 18:52:08.595926','LOGOUT','2025-09-14 18:53:34.067358','2025-09-14 19:22:08.595926',_binary '\0','2025-09-14 18:52:08.595926','NORMAL','C3E484D295CD011669BF6FBA072BA41F',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(242,'0:0:0:0:0:0:0:1','2025-09-14 19:06:38.525210','EXPIRED','2025-09-14 19:41:01.422927','2025-09-14 19:36:38.525210',_binary '\0','2025-09-14 19:06:38.525210','NORMAL','7B7A99E2F149BBDC7EE9A55C9DD95948',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(243,'0:0:0:0:0:0:0:1','2025-09-14 21:18:21.857792','LOGOUT','2025-09-14 21:19:44.698866','2025-09-14 21:48:21.857792',_binary '\0','2025-09-14 21:18:21.857792','NORMAL','FECEC4F48CDAD62FC97EFF6B5159172E',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(245,'0:0:0:0:0:0:0:1','2025-09-14 21:43:31.827680','LOGOUT','2025-09-14 21:44:04.192298','2025-09-14 22:13:31.827680',_binary '\0','2025-09-14 21:43:31.827680','NORMAL','530982656C9FCA91BA5D9968C5551FB8',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(246,'0:0:0:0:0:0:0:1','2025-09-14 21:49:42.215907','LOGOUT','2025-09-14 21:52:56.310422','2025-09-14 22:19:42.215907',_binary '\0','2025-09-14 21:49:42.215907','NORMAL','F701560194A88B83AF1F5E8846CE51E6',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(248,'0:0:0:0:0:0:0:1','2025-09-14 22:02:06.936954','DUPLICATE_LOGIN','2025-09-14 22:02:43.218688','2025-09-14 22:32:06.936954',_binary '\0','2025-09-14 22:02:06.936954','NORMAL','7139F8371E7654FBFA1C0D98D221D617',NULL,'curl&#x2F;8.7.1',1),(249,'0:0:0:0:0:0:0:1','2025-09-14 22:02:43.223008','DUPLICATE_LOGIN','2025-09-14 22:04:25.477387','2025-09-14 22:32:43.223008',_binary '\0','2025-09-14 22:02:43.223008','NORMAL','38CFCEBE3446AD958CCC76E2AEC1D24B',NULL,'curl&#x2F;8.7.1',1),(250,'0:0:0:0:0:0:0:1','2025-09-14 22:03:11.285483','LOGOUT','2025-09-14 22:11:05.619857','2025-09-14 22:33:11.285483',_binary '\0','2025-09-14 22:03:11.285483','NORMAL','C43A1F31B1A847FCDD661D01D2F2C031',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(251,'0:0:0:0:0:0:0:1','2025-09-14 22:04:25.480140','EXPIRED','2025-09-14 22:34:26.700684','2025-09-14 22:34:25.480140',_binary '\0','2025-09-14 22:04:25.480140','NORMAL','5FE16924BA3EE7395B99351E6CDD7918',NULL,'curl&#x2F;8.7.1',1),(252,'0:0:0:0:0:0:0:1','2025-09-14 22:12:01.875344','DUPLICATE_LOGIN','2025-09-14 22:12:50.372791','2025-09-14 22:42:01.875344',_binary '\0','2025-09-14 22:12:01.875344','NORMAL','61C91A1176E031740FA198FE0B679C2A',NULL,'curl&#x2F;8.7.1',43),(254,'0:0:0:0:0:0:0:1','2025-09-14 22:34:42.019110','LOGOUT','2025-09-14 22:49:01.433546','2025-09-14 23:04:42.019110',_binary '\0','2025-09-14 22:34:42.019110','NORMAL','5490A696DDD0D507DF206DA9535E9EE6',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(255,'0:0:0:0:0:0:0:1','2025-09-14 22:49:16.194443','DUPLICATE_LOGIN','2025-09-14 23:18:58.175025','2025-09-14 23:19:16.194443',_binary '\0','2025-09-14 22:49:16.194443','NORMAL','3021BF4BBD032CD4A224DFB72EAB2D80',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(256,'0:0:0:0:0:0:0:1','2025-09-14 23:18:58.182735','DUPLICATE_LOGIN','2025-09-14 23:39:55.059806','2025-09-14 23:48:58.182735',_binary '\0','2025-09-14 23:18:58.182735','NORMAL','CD3FE243466330D12910714DA3856B50',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(260,'0:0:0:0:0:0:0:1','2025-09-14 23:51:52.812644','EXPIRED','2025-09-15 04:30:34.044172','2025-09-15 00:21:52.812644',_binary '\0','2025-09-14 23:51:52.812644','NORMAL','1F958D30B03DFA3F408A4CED828F971D',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(262,'0:0:0:0:0:0:0:1','2025-09-15 09:04:46.574723','LOGOUT','2025-09-15 09:14:59.133202','2025-09-15 09:34:46.574723',_binary '\0','2025-09-15 09:04:46.574723','NORMAL','BB174DF982FBA431CA405ABC3B2035E3',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(264,'0:0:0:0:0:0:0:1','2025-09-15 09:16:09.961405','DUPLICATE_LOGIN','2025-09-15 09:25:35.944303','2025-09-15 09:46:09.961405',_binary '\0','2025-09-15 09:16:09.961405','NORMAL','E6DE124415A4B0BDC9F8F5E73C58C2BF',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(265,'0:0:0:0:0:0:0:1','2025-09-15 09:25:35.949912','LOGOUT','2025-09-15 09:38:38.844343','2025-09-15 09:55:35.949912',_binary '\0','2025-09-15 09:25:35.949912','NORMAL','B93E3D0433D6C83EA96CDAC010BD2591',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(267,'0:0:0:0:0:0:0:1','2025-09-15 10:05:03.773317','DUPLICATE_LOGIN','2025-09-15 10:14:22.551442','2025-09-15 10:35:03.773317',_binary '\0','2025-09-15 10:05:03.773317','NORMAL','CF39AA82EB6E1DFA0453C30097B02E24',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(271,'0:0:0:0:0:0:0:1','2025-09-15 11:12:33.137578','DUPLICATE_LOGIN','2025-09-15 11:21:45.435006','2025-09-15 11:42:33.137578',_binary '\0','2025-09-15 11:12:33.137578','NORMAL','C620299458F802B6D7B8C10015864567',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(272,'0:0:0:0:0:0:0:1','2025-09-15 11:21:45.439039','EXPIRED','2025-09-15 11:55:12.449280','2025-09-15 11:51:45.439039',_binary '\0','2025-09-15 11:21:45.439039','NORMAL','FF524DB72DCFE5B70A583469B2DACF50',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(273,'0:0:0:0:0:0:0:1','2025-09-15 12:53:33.541117','EXPIRED','2025-09-15 13:26:40.647794','2025-09-15 13:23:33.541117',_binary '\0','2025-09-15 12:53:33.541117','NORMAL','06A144CC4F6DF8E4762E0F6EF6782265',NULL,'curl&#x2F;8.7.1',24),(274,'0:0:0:0:0:0:0:1','2025-09-15 14:20:27.825448','EXPIRED','2025-09-15 14:51:40.580924','2025-09-15 14:50:27.825448',_binary '\0','2025-09-15 14:20:27.825448','NORMAL','2A88133CB92EDCAB289C4DFB33C5A19D',NULL,'curl&#x2F;8.7.1',24),(278,'0:0:0:0:0:0:0:1','2025-09-15 15:09:29.807992','DUPLICATE_LOGIN','2025-09-15 15:20:48.381111','2025-09-15 15:39:29.807992',_binary '\0','2025-09-15 15:09:29.807992','NORMAL','E9ABB9EADB3199C269840F258646109B',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(279,'0:0:0:0:0:0:0:1','2025-09-15 15:16:36.093260','DUPLICATE_LOGIN','2025-09-15 15:20:22.341042','2025-09-15 15:46:36.093260',_binary '\0','2025-09-15 15:16:36.093260','NORMAL','AEC83FF44F2A11C6CDCC74CE160E78BF',NULL,'curl&#x2F;8.7.1',24),(280,'0:0:0:0:0:0:0:1','2025-09-15 15:20:22.346494','DUPLICATE_LOGIN','2025-09-15 15:28:41.946603','2025-09-15 15:50:22.346494',_binary '\0','2025-09-15 15:20:22.346494','NORMAL','EDDE30928C80F03DE2F8070E8ADB720D',NULL,'curl&#x2F;8.7.1',24),(282,'0:0:0:0:0:0:0:1','2025-09-15 15:26:57.926248','EXPIRED','2025-09-15 16:01:37.194962','2025-09-15 15:56:57.926248',_binary '\0','2025-09-15 15:26:57.926248','NORMAL','47AF06C5FD9BD4C3C224BC2E19B5B529',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(283,'0:0:0:0:0:0:0:1','2025-09-15 15:28:41.949410','EXPIRED','2025-09-15 16:01:37.194962','2025-09-15 15:58:41.949410',_binary '\0','2025-09-15 15:28:41.949410','NORMAL','6EB6B4A21B40AB6E83E934EB40C4EE51',NULL,'curl&#x2F;8.7.1',24),(284,'0:0:0:0:0:0:0:1','2025-09-15 16:22:43.832744','LOGOUT','2025-09-15 16:28:11.810937','2025-09-15 16:52:43.832744',_binary '\0','2025-09-15 16:22:43.832744','NORMAL','BF814A17805116713319C9CF01784B7C',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(289,'0:0:0:0:0:0:0:1','2025-09-15 17:28:40.016669','DUPLICATE_LOGIN','2025-09-15 17:31:10.685128','2025-09-15 17:58:40.016669',_binary '\0','2025-09-15 17:28:40.016669','NORMAL','01563E66BEEBE1C636BE103648D00B53',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(290,'0:0:0:0:0:0:0:1','2025-09-15 17:31:10.687485','LOGOUT','2025-09-15 17:43:00.441414','2025-09-15 18:01:10.687485',_binary '\0','2025-09-15 17:31:10.687485','NORMAL','6D338351C0F5FA19E7795F1B626C33C4',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(292,'0:0:0:0:0:0:0:1','2025-09-15 17:59:24.780434','EXPIRED','2025-09-15 19:36:13.196771','2025-09-15 18:29:24.780434',_binary '\0','2025-09-15 17:59:24.780434','NORMAL','71459C44DDC8BD7053CF2CF849285639',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(294,'0:0:0:0:0:0:0:1','2025-09-16 09:38:37.285792','DUPLICATE_LOGIN','2025-09-16 09:53:55.802814','2025-09-16 10:08:37.285792',_binary '\0','2025-09-16 09:38:37.285792','NORMAL','2C7EC51D036AF891F49457C51410658A',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(295,'0:0:0:0:0:0:0:1','2025-09-16 09:53:55.807750','EXPIRED','2025-09-16 10:53:59.078890','2025-09-16 10:23:55.807750',_binary '\0','2025-09-16 09:53:55.807750','NORMAL','66818EE1FD56018252C4782EB42F1491',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(296,'0:0:0:0:0:0:0:1','2025-09-16 10:54:43.838560','DUPLICATE_LOGIN','2025-09-16 10:59:54.932333','2025-09-16 11:24:43.838560',_binary '\0','2025-09-16 10:54:43.838560','NORMAL','9A08E617460C5FEFDD474DB59F3AA2AC',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(298,'0:0:0:0:0:0:0:1','2025-09-16 11:09:26.000566','LOGOUT','2025-09-16 11:12:19.131815','2025-09-16 11:39:26.000566',_binary '\0','2025-09-16 11:09:26.000566','NORMAL','7686ACF3389C259B109D7A7E3CD9F334',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(299,'0:0:0:0:0:0:0:1','2025-09-16 11:12:25.283587','LOGOUT','2025-09-16 11:14:33.904914','2025-09-16 11:42:25.283587',_binary '\0','2025-09-16 11:12:25.283587','NORMAL','EBC904F4A755716AF383BE2FAF24467F',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(300,'0:0:0:0:0:0:0:1','2025-09-16 11:14:36.893839','LOGOUT','2025-09-16 11:15:09.559727','2025-09-16 11:44:36.893839',_binary '\0','2025-09-16 11:14:36.893839','NORMAL','5E77A344DA7B0F096F49C1E8E6BFFFC9',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(301,'0:0:0:0:0:0:0:1','2025-09-16 11:15:13.890390','DUPLICATE_LOGIN','2025-09-16 11:20:21.911608','2025-09-16 11:45:13.890390',_binary '\0','2025-09-16 11:15:13.890390','NORMAL','DA3F5447658C69C18D86D7AE29FCFF78',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(302,'0:0:0:0:0:0:0:1','2025-09-16 11:20:21.917640','LOGOUT','2025-09-16 11:24:44.843567','2025-09-16 11:50:21.917640',_binary '\0','2025-09-16 11:20:21.917640','NORMAL','D9659BDC3C805BE7EC35B8D4B3433558',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(303,'0:0:0:0:0:0:0:1','2025-09-16 11:24:47.964418','LOGOUT','2025-09-16 11:27:39.498242','2025-09-16 11:54:47.964418',_binary '\0','2025-09-16 11:24:47.964418','NORMAL','FD787F2DF3116FC3617071269D764515',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(304,'0:0:0:0:0:0:0:1','2025-09-16 11:27:48.233956','LOGOUT','2025-09-16 12:21:58.583263','2025-09-16 11:57:48.233956',_binary '\0','2025-09-16 11:27:48.233956','NORMAL','155449001C5751F65EA774582632B189',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(305,'0:0:0:0:0:0:0:1','2025-09-16 12:22:05.978792','LOGOUT','2025-09-16 12:22:12.589760','2025-09-16 12:52:05.978792',_binary '\0','2025-09-16 12:22:05.978792','NORMAL','05190AA39876C157EE1CE19198F9DFA2',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(306,'0:0:0:0:0:0:0:1','2025-09-16 12:22:17.087322','EXPIRED','2025-09-16 12:56:33.438150','2025-09-16 12:52:17.087322',_binary '\0','2025-09-16 12:22:17.087322','NORMAL','01E53A38C526E63589ACD38A074931DC',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(307,'0:0:0:0:0:0:0:1','2025-09-16 12:38:35.173061','LOGOUT','2025-09-16 12:40:30.087232','2025-09-16 13:08:35.173061',_binary '\0','2025-09-16 12:38:35.173061','NORMAL','E9AD9A418A2A70AD0CE663BAC487E449',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(310,'0:0:0:0:0:0:0:1','2025-09-16 13:31:31.212088','DUPLICATE_LOGIN','2025-09-16 13:41:51.237325','2025-09-16 14:01:31.212088',_binary '\0','2025-09-16 13:31:31.212088','NORMAL','4E3025B1A8BB9CC6DFC3AD396E2167C4',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(311,'0:0:0:0:0:0:0:1','2025-09-16 13:41:51.242035','EXPIRED','2025-09-16 14:15:46.366757','2025-09-16 14:11:51.242035',_binary '\0','2025-09-16 13:41:51.242035','NORMAL','B25CC972DAAEE8ECC83E15B1E923AB39',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(320,'0:0:0:0:0:0:0:1','2025-09-16 15:20:10.509647','LOGOUT','2025-09-16 15:20:21.373879','2025-09-16 15:50:10.509647',_binary '\0','2025-09-16 15:20:10.509647','NORMAL','F81CF1CB722436AEE108DB392DE3BC61',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(324,'0:0:0:0:0:0:0:1','2025-09-16 15:28:08.072170','DUPLICATE_LOGIN','2025-09-16 15:29:51.336315','2025-09-16 15:58:08.072170',_binary '\0','2025-09-16 15:28:08.072170','NORMAL','C05DC7518453DA627926D57BADF878CF',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(326,'0:0:0:0:0:0:0:1','2025-09-16 15:31:57.305011','LOGOUT','2025-09-16 15:41:34.807273','2025-09-16 16:01:57.305011',_binary '\0','2025-09-16 15:31:57.305011','NORMAL','D94BC097E143561271727D8186FBDEFF',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(330,'0:0:0:0:0:0:0:1','2025-09-16 16:12:47.111203','EXPIRED','2025-09-16 16:43:45.460381','2025-09-16 16:42:47.111203',_binary '\0','2025-09-16 16:12:47.111203','NORMAL','209DD828DA38D21F505011820B28022C',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(332,'0:0:0:0:0:0:0:1','2025-09-16 16:44:27.177132','LOGOUT','2025-09-16 16:49:12.583167','2025-09-16 17:14:27.177132',_binary '\0','2025-09-16 16:44:27.177132','NORMAL','D88C5E32F604F98C15EA6756E0562EC9',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(333,'0:0:0:0:0:0:0:1','2025-09-16 16:49:15.728123','LOGOUT','2025-09-16 16:49:34.878940','2025-09-16 17:19:15.728123',_binary '\0','2025-09-16 16:49:15.728123','NORMAL','334D2BDA7392F6647E7386C7613F6B68',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(337,'0:0:0:0:0:0:0:1','2025-09-16 17:32:08.605211','EXPIRED','2025-09-16 21:17:30.450775','2025-09-16 18:02:08.605211',_binary '\0','2025-09-16 17:32:08.605211','NORMAL','3CB992AB16493728AD882241582B4E6C',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(346,'0:0:0:0:0:0:0:1','2025-09-17 09:47:19.391043','LOGOUT','2025-09-17 09:49:57.920815','2025-09-17 10:17:19.391043',_binary '\0','2025-09-17 09:47:19.391043','NORMAL','CD9190DD91572B3C25942E038861CE44',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(347,'0:0:0:0:0:0:0:1','2025-09-17 09:50:02.753914','LOGOUT','2025-09-17 09:51:03.352488','2025-09-17 10:20:02.753914',_binary '\0','2025-09-17 09:50:02.753914','NORMAL','DF2172C04C445DA8D792615E75220A1D',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(349,'0:0:0:0:0:0:0:1','2025-09-17 10:06:57.174052','LOGOUT','2025-09-17 10:07:02.769508','2025-09-17 10:36:57.174052',_binary '\0','2025-09-17 10:06:57.174052','NORMAL','35D98C4A22E8F970E1E9953EDEB7D9C7',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(354,'0:0:0:0:0:0:0:1','2025-09-17 10:48:17.859533','DUPLICATE_LOGIN','2025-09-17 11:08:28.706661','2025-09-17 11:18:17.859533',_binary '\0','2025-09-17 10:48:17.859533','NORMAL','9E6D7D735872DE6035070B5EAD8BFE8E',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(355,'0:0:0:0:0:0:0:1','2025-09-17 11:08:28.711798','LOGOUT','2025-09-17 11:16:55.837135','2025-09-17 11:38:28.711798',_binary '\0','2025-09-17 11:08:28.711798','NORMAL','7646E89C24316E0D8BC1B1CBACF1006A',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(358,'0:0:0:0:0:0:0:1','2025-09-17 12:13:03.976484','DUPLICATE_LOGIN','2025-09-17 12:20:42.644016','2025-09-17 12:43:03.976484',_binary '\0','2025-09-17 12:13:03.976484','NORMAL','27C243147366216EC0ABE7121AD19759',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(363,'0:0:0:0:0:0:0:1','2025-09-17 12:34:19.595255','DUPLICATE_LOGIN','2025-09-17 13:00:07.711590','2025-09-17 13:04:19.595255',_binary '\0','2025-09-17 12:34:19.595255','NORMAL','3BE955F18A88E9A68B63893561E9444A',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(365,'0:0:0:0:0:0:0:1','2025-09-17 13:34:49.343891','DUPLICATE_LOGIN','2025-09-17 13:41:53.874668','2025-09-17 14:04:49.343891',_binary '\0','2025-09-17 13:34:49.343891','NORMAL','7792DA90E62FE247F25FAB8DD3344E32',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(369,'0:0:0:0:0:0:0:1','2025-09-17 14:22:38.985886','EXPIRED','2025-09-17 14:55:21.270931','2025-09-17 14:52:38.985886',_binary '\0','2025-09-17 14:22:38.985886','NORMAL','9356059AB5DF83891CD92C23CBBB3330',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(370,'0:0:0:0:0:0:0:1','2025-09-17 15:13:43.943987','LOGOUT','2025-09-17 15:14:09.258069','2025-09-17 15:43:43.943987',_binary '\0','2025-09-17 15:13:43.943987','NORMAL','23BA895AE217EF9BA5E4BD9C8F3AA976',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(371,'0:0:0:0:0:0:0:1','2025-09-17 15:17:22.224304','LOGOUT','2025-09-17 15:18:13.482231','2025-09-17 15:47:22.224304',_binary '\0','2025-09-17 15:17:22.224304','NORMAL','64E8EB13521A1E08D27863A30E0E3A3F',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(372,'0:0:0:0:0:0:0:1','2025-09-17 15:21:38.441565','EXPIRED','2025-09-17 15:56:29.845151','2025-09-17 15:51:38.441565',_binary '\0','2025-09-17 15:21:38.441565','NORMAL','B4CE4DBE01296E904936528833D2CF1E',NULL,'curl&#x2F;8.7.1',24),(373,'0:0:0:0:0:0:0:1','2025-09-17 15:55:07.765199','LOGOUT','2025-09-17 15:55:17.919442','2025-09-17 16:25:07.765199',_binary '\0','2025-09-17 15:55:07.765199','NORMAL','74212BCFD2A5E9B92ECA356752792805',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(374,'0:0:0:0:0:0:0:1','2025-09-17 15:55:37.295024','LOGOUT','2025-09-17 15:55:45.381353','2025-09-17 16:25:37.295024',_binary '\0','2025-09-17 15:55:37.295024','NORMAL','C38F3A83A4D617398F10236334B6AB0E',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(375,'0:0:0:0:0:0:0:1','2025-09-17 16:01:00.938129','LOGOUT','2025-09-17 16:01:07.247873','2025-09-17 16:31:00.938129',_binary '\0','2025-09-17 16:01:00.938129','NORMAL','F86CA1D3EBA2D8233AD95FEE7219668F',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(376,'0:0:0:0:0:0:0:1','2025-09-17 16:04:28.109206','LOGOUT','2025-09-17 16:04:51.295193','2025-09-17 16:34:28.109206',_binary '\0','2025-09-17 16:04:28.109206','NORMAL','736CB0485B0511C52E7CD5FFA9BC2DE3',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(377,'0:0:0:0:0:0:0:1','2025-09-17 16:20:23.340610','LOGOUT','2025-09-17 16:22:54.208679','2025-09-17 16:50:23.340610',_binary '\0','2025-09-17 16:20:23.340610','NORMAL','3F1E11AE896A997DBBB97B80CE30E68B',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(378,'0:0:0:0:0:0:0:1','2025-09-17 16:48:30.508612','LOGOUT','2025-09-17 16:49:14.959441','2025-09-17 17:18:30.508612',_binary '\0','2025-09-17 16:48:30.508612','NORMAL','7A1C11A3BC9E36C70D5CD8C092AF422E',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(381,'0:0:0:0:0:0:0:1','2025-09-17 17:20:32.132256','LOGOUT','2025-09-17 17:46:35.597102','2025-09-17 17:50:32.132256',_binary '\0','2025-09-17 17:20:32.132256','NORMAL','1CAF213EEBEF9D371F32C0CC84FFDA8B',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(382,'0:0:0:0:0:0:0:1','2025-09-17 23:12:39.076565','LOGOUT','2025-09-17 23:13:00.085769','2025-09-17 23:42:39.076565',_binary '\0','2025-09-17 23:12:39.076565','NORMAL','52A3DCDA631378628101C86BEB2EA117',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(383,'0:0:0:0:0:0:0:1','2025-09-17 23:15:28.028785','DUPLICATE_LOGIN','2025-09-17 23:16:39.379927','2025-09-17 23:45:28.028785',_binary '\0','2025-09-17 23:15:28.028785','NORMAL','BF985A75273E5DD5526D48DBBF61E672',NULL,'curl&#x2F;8.7.1',24),(385,'0:0:0:0:0:0:0:1','2025-09-17 23:17:33.273454','LOGOUT','2025-09-17 23:17:44.445191','2025-09-17 23:47:33.273454',_binary '\0','2025-09-17 23:17:33.273454','NORMAL','45BF9A872883E1A16B6EE62CB0B1D7BC',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24),(386,'0:0:0:0:0:0:0:1','2025-09-17 23:17:48.521266','LOGOUT','2025-09-17 23:18:26.499476','2025-09-17 23:47:48.521266',_binary '\0','2025-09-17 23:17:48.521266','NORMAL','2C3FD3D74F9E3FEBD1CB4C8F22F96A65',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',48),(387,'0:0:0:0:0:0:0:1','2025-09-17 23:18:57.371429','LOGOUT','2025-09-17 23:19:25.841442','2025-09-17 23:48:57.371429',_binary '\0','2025-09-17 23:18:57.371429','NORMAL','FB78A2925EB1AA9B4833AB9743289083',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(388,'0:0:0:0:0:0:0:1','2025-09-17 23:27:16.398203','EXPIRED','2025-09-18 00:01:28.630572','2025-09-17 23:57:16.398203',_binary '\0','2025-09-17 23:27:16.398203','NORMAL','08A3366BE3E7A02D35C86DDA0470B326',NULL,'curl&#x2F;8.7.1',24),(389,'0:0:0:0:0:0:0:1','2025-09-18 12:20:30.698518','LOGOUT','2025-09-18 12:20:41.274269','2025-09-18 12:50:30.698518',_binary '\0','2025-09-18 12:20:30.698518','NORMAL','0507669AE84C50C56FB6200689A09BA0',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',43),(390,'0:0:0:0:0:0:0:1','2025-09-18 12:20:44.804531','EXPIRED','2025-09-18 12:51:19.335930','2025-09-18 12:50:44.804531',_binary '\0','2025-09-18 12:20:44.804531','NORMAL','035CFDA97A68EF537ECC4D5580A208D3',NULL,'Mozilla&#x2F;5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit&#x2F;605.1.15 (KHTML, like Gecko) Version&#x2F;16.0 Safari&#x2F;605.1.15',24);
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_social_accounts`
--

DROP TABLE IF EXISTS `user_social_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_social_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `access_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disconnect_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disconnected_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_primary` bit(1) DEFAULT NULL,
  `is_token_valid` bit(1) DEFAULT NULL,
  `is_verified` bit(1) DEFAULT NULL,
  `last_login_at` datetime(6) DEFAULT NULL,
  `last_token_refresh` datetime(6) DEFAULT NULL,
  `login_count` int DEFAULT NULL,
  `provider` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_metadata` text COLLATE utf8mb4_unicode_ci,
  `provider_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_profile_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_user_id` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_username` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_token_expires_at` datetime(6) DEFAULT NULL,
  `token_expires_at` datetime(6) DEFAULT NULL,
  `token_refresh_count` int DEFAULT NULL,
  `verification_date` datetime(6) DEFAULT NULL,
  `verification_method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_social_accounts_user_id` (`user_id`),
  KEY `idx_user_social_accounts_provider` (`provider`),
  KEY `idx_user_social_accounts_provider_user_id` (`provider_user_id`),
  KEY `idx_user_social_accounts_is_deleted` (`is_deleted`),
  CONSTRAINT `FKbgx256ax3u7afnmixgorqa7im` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_social_accounts`
--

LOCK TABLES `user_social_accounts` WRITE;
/*!40000 ALTER TABLE `user_social_accounts` DISABLE KEYS */;
INSERT INTO `user_social_accounts` VALUES (1,'2025-08-29 18:16:33.832835',NULL,_binary '\0','2025-09-18 12:56:56.307442',172,'AAAAOCSQ58vszG_nuR9XrTcVthnU79Kvw-BAaSivRdeNXWNu2HVYeUdzMQhNRcYV3YTA8P7SIA3w2AyTBZtSyZCVJ4s',NULL,NULL,_binary '',NULL,NULL,NULL,'2025-09-18 12:56:56.306123',NULL,172,'NAVER',NULL,NULL,NULL,'https://phinf.pstatic.net/contact/20250409_296/17442042144434dG9t_JPEG/Gemini_Generated_Image_9dqpsn9dqpsn9dqp.jpg','BebFa9hCX2ZopHhGQE96Ic87BM292YRkL9NzPsxldIY','반짝반짝',NULL,NULL,NULL,NULL,NULL,NULL,23),(2,'2025-08-29 18:17:43.071451',NULL,_binary '\0','2025-09-18 02:19:05.354248',24,'P30cVGCIlcZGOrijkzhRbrFfhgG02N34AAAAAQoXAVAAAAGZWK_gU7ZbzBbpXusm',NULL,NULL,_binary '',_binary '\0',NULL,_binary '','2025-09-18 02:19:05.352927',NULL,24,'KAKAO',NULL,NULL,NULL,'http://k.kakaocdn.net/dn/Ap8nc/btslTTyECFz/oU4gdsbt4w3oMV1cmmorI1/m1.jpg','4414427574','학',NULL,NULL,NULL,NULL,NULL,NULL,23),(3,'2025-09-13 00:50:18.565305','2025-09-13 01:10:36.945152',_binary '','2025-09-13 01:10:36.945650',1,NULL,NULL,NULL,_binary '',NULL,NULL,NULL,NULL,NULL,NULL,'KAKAO',NULL,NULL,NULL,'','','hHQv9MKUXdmEz+p195i7uNr4+FFojV+8LcNsWrpYpSs=',NULL,NULL,NULL,NULL,NULL,NULL,73),(4,'2025-09-13 00:50:21.115217','2025-09-13 01:10:41.757477',_binary '','2025-09-13 01:10:41.758101',6,'QVyp3lHko07lO7CEUzEu-2z4ORi_U2Z0AAAAAQoNFN0AAAGZPrExsIh6dPOEuoNF',NULL,NULL,_binary '',_binary '\0',NULL,_binary '','2025-09-13 01:10:24.259880',NULL,5,'KAKAO',NULL,NULL,NULL,NULL,'4443586436','모든 것이 은혜',NULL,NULL,NULL,NULL,NULL,NULL,73),(5,'2025-09-13 01:01:28.735585',NULL,_binary '\0','2025-09-13 01:01:28.735585',0,NULL,NULL,NULL,_binary '',NULL,NULL,NULL,NULL,NULL,NULL,'KAKAO',NULL,NULL,NULL,NULL,'test456','qErkut9PhsFiU/PybTOYb1/P3JB2kd6CYwcrRnORKto=',NULL,NULL,NULL,NULL,NULL,NULL,75),(6,'2025-09-13 01:10:50.731578',NULL,_binary '\0','2025-09-17 15:14:27.887719',3,'dj4NrlYo0SpM9VAsbFuWDIU3kWABWvSvAAAAAQoXNd0AAAGZVk9kxoh6dPOEuoNF',NULL,NULL,_binary '',_binary '\0',NULL,_binary '','2025-09-17 15:14:27.875364',NULL,3,'KAKAO',NULL,NULL,NULL,NULL,'4443586436','!',NULL,NULL,NULL,NULL,NULL,NULL,73);
/*!40000 ALTER TABLE `user_social_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_detail` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age_group` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verification_expires_at` datetime(6) DEFAULT NULL,
  `email_verification_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_points` bigint DEFAULT NULL,
  `gender` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `is_email_verified` bit(1) NOT NULL,
  `last_grade_update` datetime(6) DEFAULT NULL,
  `last_login_at` datetime(6) DEFAULT NULL,
  `memo` text COLLATE utf8mb4_unicode_ci,
  `name` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `password` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_reset_expires_at` datetime(6) DEFAULT NULL,
  `password_reset_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` longtext COLLATE utf8mb4_unicode_ci,
  `qualifications` text COLLATE utf8mb4_unicode_ci,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specialization` text COLLATE utf8mb4_unicode_ci,
  `total_consultations` int DEFAULT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_image_url` text COLLATE utf8mb4_unicode_ci,
  `age` int DEFAULT NULL,
  `is_social_account` bit(1) NOT NULL,
  `social_linked_at` datetime(6) DEFAULT NULL,
  `social_provider` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_provider_user_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_id` bigint DEFAULT NULL,
  `branch_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auto_reminder` bit(1) DEFAULT NULL,
  `data_sharing` bit(1) DEFAULT NULL,
  `email_notification` bit(1) DEFAULT NULL,
  `preferred_session_duration` int DEFAULT NULL,
  `profile_visibility` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `push_notification` bit(1) DEFAULT NULL,
  `sms_notification` bit(1) DEFAULT NULL,
  `kakao_alimtalk_notification` bit(1) DEFAULT NULL,
  `notification_preferences` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_6dotkott2kjsp8vw4d0m25fb7` (`email`),
  UNIQUE KEY `UK_r43af9ap4edm43mmtq01oddj6` (`username`),
  KEY `idx_users_username` (`username`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_phone` (`phone`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_grade` (`grade`),
  KEY `idx_users_is_deleted` (`is_deleted`),
  KEY `FK9o70sp9ku40077y38fk4wieyk` (`branch_id`),
  CONSTRAINT `FK9o70sp9ku40077y38fk4wieyk` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'2025-08-28 18:07:55.390109',NULL,_binary '\0','2025-09-17 09:10:42.244365',6,'서울시 강남구','매핑테스트로 1010',NULL,NULL,'mapping_test_consultant_003@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,'2025-09-14 22:04:25.483296',NULL,'매핑테스트상담사003',NULL,'매핑 테스트용 상담사 003','$2a$12$r9R8Y9Is4HKmOlvnMDWXGOfNHYR4OjNcrAAkh7NP6jO1wH350/6a6',NULL,NULL,'010-1010-1010','06101',NULL,'매핑 테스트 자격 003','CONSULTANT','매핑 테스트 003',NULL,'mapping_test_consultant_003',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'2025-08-28 18:08:27.386030',NULL,_binary '\0','2025-09-17 09:10:50.692833',3,'서울시 강남구','매핑테스트로 4040',NULL,NULL,'mapping_test_consultant_004@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'매핑테스트상담사004',NULL,'매핑 테스트용 상담사 004','$2a$12$fdnm3VVzh8M0SPPV6xVRxeeHpSo0NsenAQel72YU6lCJlwgYIAsRO',NULL,NULL,'010-4040-4040','06404',NULL,'매핑 테스트 자격 004','CONSULTANT','매핑 테스트 004',NULL,'mapping_test_consultant_004',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(20,'2025-08-29 11:01:53.545936',NULL,_binary '\0','2025-09-17 13:41:47.648176',3,NULL,NULL,NULL,NULL,'new_test_client_001@mindgarden.com',NULL,NULL,0,NULL,'CLIENT_BRONZE',_binary '\0',_binary '\0',NULL,NULL,NULL,'새테스트내담자001',NULL,NULL,'$2a$12$NEZmcRjbMlwWVTx.k9Q2W.vTAH23LTSHp87B45.DpwZUc5vHjsVMa',NULL,NULL,'010-9999-8888',NULL,NULL,NULL,'CLIENT',NULL,0,'new_test_client_001',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(23,'2025-08-29 18:16:33.794925',NULL,_binary '\0','2025-09-17 22:31:39.627646',6,NULL,NULL,NULL,NULL,'beta74@live.co.kr',NULL,NULL,0,'MALE',NULL,_binary '',_binary '',NULL,NULL,NULL,'이재학','반짝반짝',NULL,'$2a$12$F5vqif2YSyK0JBJPzhV.SuoCNs.PLRCh/FkJny1JS6FtH5qGXV.Gy',NULL,NULL,'01086322121',NULL,NULL,NULL,'CLIENT',NULL,0,'이재학','https://phinf.pstatic.net/contact/20250409_296/17442042144434dG9t_JPEG/Gemini_Generated_Image_9dqpsn9dqpsn9dqp.jpg',NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(24,'2025-09-01 16:42:13.814278',NULL,_binary '\0','2025-09-18 12:20:44.808506',305,NULL,NULL,NULL,NULL,'admin@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '',_binary '\0',NULL,'2025-09-18 12:20:44.807310',NULL,'시스템 관리자',NULL,NULL,'$2a$12$s6seoi0GwNMHBG5i0xNmwOV2Vk0ka1.6abl/AEWbAELgsLxKldjQW',NULL,NULL,'010-0000-0000',NULL,NULL,NULL,'ADMIN',NULL,NULL,'admin@mindgarden.com','data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCADIAMgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAgMABAUBBgf/xAA8EAACAQIDBQQIBQMEAwEAAAABAgADEQQSITFBUWFxBROBkRQiMkJSobHBI0NictEzU4KSwuHxY4Pi8P/EABkBAQEBAQEBAAAAAAAAAAAAAAECAAMEBf/EAB4RAQEBAQEBAAIDAAAAAAAAAAABEQISAyExQVFh/9oADAMBAAIRAxEAPwD2QEMLCVeUYqT7Nr04WBDVYYWGFhpkCBaGDOhRCAEkhBJhqpO2dHKdAvAjFhO5uUECHlgdDmhC8JUjAtoWmAAN4djCtJlJkkNp0CGKcMJNrFyAEx2QToWTrFBDDCxgUmEEhaZCws6Fjgk7lEnVSFBYWWMtJaGkGWSMtJBteZCQwkeE5QhTnr9OGEZOU6Ej8kIJD02EBIQSWBTnRTh6bCAk6E5SyEnQkPTYQKcMJaPCmEEhejCQkILHZRCAk6SlTlCCCNCwgknSUFE6FjgvKGFhpwgUyd0IUuMdlncphpwsKBO2jAkLJDSTaTLH5BO5BxMNJGSd7sx+USZZtYgU5JYCyQ1nnwIQURoTlO91O/pHkoLCA5RndmEqTaMLCwgkaEhBYa2FBYQWNCzoWTrYWFhZYdp0LNrYALO5eUaFhBYacKAhAGNCQgsNOEgGEAY0JCFMw0lAGEAY0UzOinJ9Rircp2xjhTEIIIejhAUwskeEHCEE5Sb22EBJ0U48U4QTnJvRICcpJYygSQ9M80pjBELmEarHfPTRDAOUIAQVflGK4k/kuhRCySBhxhhobWwGSdCxgPSEByh6bCss6FEbl4SZDN7bAgCEAJ3LO5YehjgAhBRJlnQsNbBBYQAghZ3LDSLSd0nAsLJDWdAEIAcoIUQgoks7pxkvIFEILNsYN5y8OwG6dsIawLyQ9JJi8mtXiI1XBmAMSwA1MNsdVy2UAczPdflU+418TjKOGW9RtdyjaZmt21Uz3SkgXgSSZl1c1RyzEljtJi7EGdeflJ+0Xu16LDdsUnNqqmmeN7iaqOGAKsCDvE8SDaaGA7RfD+q12p8OEjv4/wA8nnr+3qQxG+MWoRvmQnalJgCoYy5QxKVfZOvAzz3iz9x1mX9L61BvjAwMphhxhX5zlisXNDJpKJrWNgxne/e2k2UYvX5TsorVZR6zG8NMUNl7mbK2LoE6JSOMURbY4n2NPCHm1saYheMykxNW9y2nSGKznW5tNea2NK87mmd31QjfOrWcbRcSfJxohpM8zKuKcDRTeVHxGJJ9ogcpU4tGN7PFVK4Q6zDOMqpc3N+JMUe0Sx9dgZU+Vb8NbEY7Loskwq2MU7WknSfL/Bry9Ou2+N7zNPN0O1G94AjlL1PtCk52lTzn0ry8k7jUYnhALkyuMQDsMLv1I1tDDsMuZATFCqDvhB5mWKVRlOmk0sNiSCDsYTGzmGtUg3vI651U6x6iljU9+4PERnptJmy5mA420nnaWJBtfQx4qX3zhflHWdvQrTHtKxseEMFhoCfGY2ExjUjY6qd3CadPFKwvpOPXHUdJ1Ks+s20iGigDWIFdeMhxKDfIyq2LIReEgRRuErDFKRBfEkj1RDzW2Lg04Qw3KZq4lht1hjFDeCJrxWli/wB5OGqBMmv2klM+0Og1mXi+06lcZR6qcBK5+PVF7kbuK7UoUbi+duAmTiu2Kz6IQg5TIZ774upVVBdjYXtPTz8OeXK/S1cqYmo5uzEnrFNUNrlrTNxPaCUyVU3aUX7RZjY2nacud7bT4i2+SYTYsnW8kfI9smlSYHZLiUSbTaTsn9aectUezRazOnnL9xynzrBp03U6EiPRmB9YXE3R2Yvxr5zo7MX4185PuKnzrIpkNutGhW3XmsnZafGvnH0+z1XTOsL3FTisdbnRhHJTzHQzWGAT41hjAqPeWTfpFThlig0NabLvM1UwlvfEP0QfEsm9xXln077xLFMso02S0uE/UIYwnAiReoqQhWO6GCTtEaMKRvEMUGttEjYcpA6mcdwi3ZrCObD1DsIiKuCqPodnWMsb8qtXHBdEBJ4mVKuMqNcFrDlL57MqExR7Ke8uXiJs6Zhq8Yp8Sq7pqVOyqhFgJUxHZFYiyr85c65TeemRU7Rc3yoAN0oVajuPWJNptN2LX+AecW3Y9ce4PMS51y53nqsFrkxZvN1uyK/wDzEU/ZFf4R5iPqJ8Vh1WNrSTUq9j4gnRAf8AISR9QeKt08QSLlx0EsU67fF85l0yCwC5j+5bfeW1zMNbr0MKuLvpD22/OQYh+JlGoyILkOTIjuxGVGt4mBaSYpr2ub9Y5K7k+0P9QmQzqr/iBxw3fWMVyfZUgHiZNhlay4hr6t85Zp1bi9zMmlRqupYU7jiDL1KiwALqAONz95FXF1axvqwhrWObS5lWk6021AbqP+Y4Ypb2VQOWVf5nOrWlqkbTblHo5Oy/lKivmF2pueaqI2ln2imQOYkVUi3qN8IN/wDrxIYk2MhuDqAeslSyDIS1tl/ERC5rahNOG2RmvsRvODYMuRtA851LML3gq5HEDpAd6R95i3CbWxyuWTSx5SvVayHNcHrDNUWtrfn/ANxVcKy2ZFPO0qCqpqqqnO+vDbKVbEqDYOW5gSxXKDQDTfqB9ZQrVc1Sytl6kMPlOsRRNUfKCF043lfvTrqSeAnGrV3LAZagGnqqR9JUqCz2buqfI5v+ZcSs1KlTLfuyOskXSqqujhTptyX/AN0kpOs6k7Pp6RWcj9F/vL1GhVbUU3K8XBU/SLNlVe8qIFO6x1+cJO7poWpZWvwBI8ryrUSHNQxCG6Kb9SYmr6QB+JRqt1p3H1nLu5DBWH/qYCKrLWYWaxHID+Zo1HhndnNqRZR/4b2mlSq91YAVM3DuMtvEtMehSZgGyvf9CZvvL9Ci9VbFStt70gL/ADh0eWiHLFWd6ludZRbwBj6LUu8sKqsx/uet95nIWoixpFm4iiD9DLtA1SAz00K8MgB+pnOukXDRZnBNGnb9CgR3coNe7U8iFH2lVai3P4WU88v2kLpf1qKMeovOdWtoAh9VaY8R/EcjZhay9BrKanMb5WXkDGersBe536yaqLBV811URiK/EgcpWFTu9M1+ikw1qkjUN5ESSuBFGp18YLBc18oPheVw7Wtc+RhHOANHYcmtJJjBst0oo3+dj9JxA4OtA+LX+04G9TQOp+EnWBSuzXZXA6//AFMxqtmb1aLAjflH8wsQzmy5VIO0in/JtFuKVQWyU3t8TGQqqrZaZU/oa00ZSxWHo2J76j+3u12/OZtXDYitVUUcOjDj3VgflNsl20C1ww4lD9bytVXE3u4a2/vMrA+Fh9Z0nWJs1k1eysWxscOiftuJXfCsh/EWkbf3CbHzmjjMGMQvr4nDoFOzu0UnxDTlDCYmmMuDOEI4tXYn5GdJ0i8s9y5KrSSmq/DTbKD85JdxGGxHcFqiVWbilVmXyJvJKnSbGPTWuq37/MfC0YxrBD+IubkP5MqiqBoEcnnYToYubd2w4+tb6GXYiV1PSs/r1UYHZdVP0kr1MSoy5lCbygW3zjAy0xsAAG0uYl69Fhlbutd20GaNR03Y0wpdif05F+8v06tQW/BtzzD7Sij0TTLKlEfuS31jKQpteypprpSA+0KY0sxZQxNuRQmMpM6g2IseRH3mUCo9pSo5U7/aMR0IIFWooHHQScVrUDsBZSAesLM5HtCZgr00UZnLHxM6MZQJ1B8Vh5p2NRXO9m8zCzX2XHjMxcXhxoNPCGuMwwH9T7QvNOxqIwv62Y+Ubn5kDhMkYvDG34mYciYz0miQMtXQbr/8SbzVStQVCNijxMIVHOnqg9TM5a6EaVB4tGLUBH9RfOR5Or+aoNouOsgNtz3/AHafWVadU7mBHUQxUYjSFipVgFib5lPLX+YTvUHsFfMyqKjEbBfmTCFRgfY8iIYTE9K9Zi6MTsB0t8pTqUsXUqEl6iNu7usQPmsstV09kgxdY94mUVMh4gkfeaCwOGTHUWJ712J3PVB/2QmxHaHrBcGrMdCS4sfmPpIi1AAKdZdNt1v9YGI7xgGDksvwOVv4bI62BzYlGao+Bpqx3M62+v1ki6lTEVrE4WurLsHfaHxzSRgx47vDcEsx55bxoxWgAL+U8/TrYrnbpaNFTFW238p7vLw+24a9RgQBeA+IcrZqYFuMxw2K3ADq1pwtV2s6eDXm8xvda64pkNkpoRy0h+kDMC1GmTxJvaY5rsBYkH5yek1PgLdUj4HtuNi6YtemnlOjG4c7aWg4ATD9LYaFAOqxlPHONBk8oeFT6Nr0nDNa9FvIRq1cK/5Zv0vMMdoViSBYf4xyYmoR6xAHjDyr22F7gj1aTH/AxqVKQ/LI8bTEGK01dG5XnVxaX1C+AMLzTOo3wyA+yyjlCD0joAzHnrMFcTT22Udb/wARy4yjoLKSP1EDyk+FzqNoVEBH4Sx9OsCP6VvGYYx1IaBAP8/tGpjMO29h4yLyqdNoMhOigX5wroLgMQf3THXFL+Wz+JEP0uoLWpoRxOsnxVeo1RcHSufO8PNUv/WJA6fxMoY5h7aAeBhjH0zb1VvxOkPFPqNMGoFJFca8ROBqugFVT1lH05bi2UkbNZw446myEcxDzTsagd/iUnlO53GqheekyxiyTfIh5ZrfWMXFG9jSt43heKfUaIqG5sGJ4k7JJnjEN/aIPUyQ8tr5j31/zvvDWoDtxBA4WmSMSuzu/KQ4mmNtI35z6D5XpsBqPv1Cxhq1C2jH5zFGNUHRPKMGO09gWmw+o2V7sj+pbqRCun98ecw/TFP5a3nRiuCgeEx9RuBgPfWEKxtoaZ8Jh9+W2fWGrt8SzYZ02w7Hctus7nPwL5zIWo496w+UIV34jwhita61Lj2FjFa/LpMf0moBuM6MU3MeE2GWNsEfF8zGKSfzB/qmD6Ux3nzjExCnbthip1G+hI/MXyvGBwNtROmUf9zBGIHPzjExAJ1PnJsXOm6tSlfV1v8At0j1qUdNkwlqpxHnC7xOF+hk+V+m93lP3Bfo0gqj+2Zgium646iEMSw1UkjrDyfTeNVd9LWT0gLspN1vMMYvjcQ1xIJ9q3MNaby3ps+kIdoqKOl4a1kOwtbqJjis26rO97VJ1YHrDyfTbWsl9Wa3WSYuaqNbeRkh4Pp84FQAaveT0hFGg8zJJPS+Troxfwr8pBXY693JJMZaIVS21IxW4LJJMYMXI9k+cln3aSSTKEveD3oWeoNtmEkkxdFYnkZ3MxOra9JJJjHVf9UatTxkkmVDFrKNoaMWtTbTMRJJCqlEGHuuDCFRvjMkkFDFZz7TfeORnP5gkkgqGjvLe0CIQY+8oPSSSChgg+4w8IWcg2BPS9pJIM4alRDozp4SSSTM/9k=',NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(25,'2025-09-01 16:42:14.058762','2025-09-02 17:58:44.209193',_binary '','2025-09-08 18:01:21.760263',7,NULL,NULL,NULL,NULL,'consultant1@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,'2025-09-02 17:57:02.286003',NULL,'김상담',NULL,NULL,'$2a$12$uHa0Xn7vXdNmSSAGIUK4FuUdUe8j.RjERC7jZ4qM1JAE4dZfd6pfC',NULL,NULL,'010-1234-5678',NULL,NULL,NULL,'CONSULTANT',NULL,NULL,'consultant1@mindgarden.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(31,'2025-09-02 10:15:18.804311',NULL,_binary '\0','2025-09-17 09:10:53.554311',4,NULL,NULL,NULL,NULL,'consultant2@mindgarden.com',NULL,NULL,NULL,NULL,'CONSULTANT_JUNIOR',_binary '\0',_binary '\0','2025-09-11 17:34:42.379929',NULL,NULL,'이상담',NULL,NULL,'$2a$12$xXF4NHOWGAZts3o./gMgnOQ/P6cRnr5JezrL0Irz1pEoI39ucQMTi',NULL,NULL,'010-2345-6789',NULL,NULL,NULL,'CONSULTANT','부부상담,아동상담,청소년상담',NULL,'consultant2@mindgarden.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(32,'2025-09-02 10:15:23.383813',NULL,_binary '\0','2025-09-17 09:10:55.659040',4,NULL,NULL,NULL,NULL,'consultant3@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'박상담',NULL,NULL,'$2a$12$nGylXXLe5LqYHQLPA1x3HuzDcL4p06tw1PRn3a.YyyVOD/SAihF2O',NULL,NULL,'010-3456-7890',NULL,NULL,NULL,'CONSULTANT','ANXIETY,COUPLE',NULL,'consultant3@mindgarden.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(33,'2025-09-02 10:15:27.365898',NULL,_binary '\0','2025-09-17 09:10:57.905910',3,NULL,NULL,NULL,NULL,'consultant4@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'최상담',NULL,NULL,'$2a$12$ASbnoj8alI2HQwKNWRT1he5adMVah/VaijjSyqh8uo9Ar4fYSWXGq',NULL,NULL,'010-4567-8901',NULL,NULL,NULL,'CONSULTANT',NULL,NULL,'consultant4@mindgarden.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(34,'2025-09-02 15:05:58.036839',NULL,_binary '\0','2025-09-08 17:49:32.997168',2,NULL,NULL,NULL,NULL,'testclient1@mindgarden.com',NULL,NULL,0,NULL,'CLIENT_BRONZE',_binary '',_binary '\0',NULL,NULL,NULL,'테스트내담자001',NULL,NULL,'$2a$12$RV786V6UqqfjfMLPQAmAGukIO4LW/uLCKw/nZ4/TVBLvFblYekFUO',NULL,NULL,'010-1111-1111',NULL,NULL,NULL,'CLIENT',NULL,0,'testclient1@mindgarden.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(35,'2025-09-02 15:06:03.660192',NULL,_binary '\0','2025-09-09 00:22:45.441593',2,NULL,NULL,NULL,NULL,'testclient2@mindgarden.com',NULL,NULL,0,NULL,'CLIENT_BRONZE',_binary '',_binary '\0',NULL,NULL,NULL,'테스트내담자002',NULL,NULL,'$2a$12$1RbMJ7ch5hpN4PBy3ZrNf.A1TM8lQSiTn.6VCq3rBl8tb1HpAceHG',NULL,NULL,'010-2222-2222',NULL,NULL,NULL,'CLIENT',NULL,0,'testclient2@mindgarden.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(36,'2025-09-02 15:06:09.297216',NULL,_binary '\0','2025-09-17 14:22:30.006128',3,NULL,NULL,NULL,NULL,'testclient3@mindgarden.com',NULL,NULL,0,NULL,'CLIENT_BRONZE',_binary '\0',_binary '\0',NULL,NULL,NULL,'테스트내담자003',NULL,NULL,'$2a$12$FWIOhV6Teg42lpIF1C3Cku4gu.kgo3s97Dc/vimtMGNCdH1UEiMzq',NULL,NULL,'010-3333-3333',NULL,NULL,NULL,'CLIENT',NULL,0,'testclient3@mindgarden.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(41,'2025-09-02 17:58:56.521113',NULL,_binary '\0','2025-09-17 09:11:01.678455',50,NULL,NULL,NULL,NULL,'consultant_new@mindgarden.com',NULL,NULL,0,NULL,'CONSULTANT_JUNIOR',_binary '\0',_binary '\0',NULL,'2025-09-09 10:14:52.085233',NULL,'김상담신규',NULL,NULL,'$2a$12$D4SpnFqvHD1WcICHPuU.V.FHs7Fh.e1QR4Xb2mIYJp6t8RSlNNxyq',NULL,NULL,'010-1234-5681',NULL,NULL,NULL,'CONSULTANT','TRAUMA,SELF_ESTEEM',0,'consultant_new@mindgarden.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(43,'2025-09-04 17:17:50.321598',NULL,_binary '\0','2025-09-18 12:20:30.716314',112,NULL,NULL,NULL,NULL,'agisunny@hanmail.net',NULL,NULL,0,'','CONSULTANT_SENIOR',_binary '',_binary '\0','2025-09-11 17:56:17.013360','2025-09-18 12:20:30.713890','\n전문분야: \n자격증: \n경력: \n상담가능시간: \n상세자기소개: \n학력: \n수상경력: \n연구실적: \n','김선희',NULL,NULL,'$2a$12$sovj5NW.YAuhPzpDXPQJquGc6D7NjaGop/11ZN70dWR6EkHooyjWe',NULL,NULL,'010-4285-8570',NULL,NULL,NULL,'CONSULTANT','DEPRESSION,ANXIETY,TRAUMA,RELATIONSHIP,FAMILY,COUPLE,CHILD,ADOLESCENT,ADDICTION,EATING,SLEEP,GRIEF,CAREER',0,'김선희','data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCADIAMgDASIAAhEBAxEB/8QAGwAAAQUBAQAAAAAAAAAAAAAABAABAgMGBQf/xAA8EAABAwMCBAMGAwQLAQAAAAABAAIDBAUREiEGEzFhFEFRIjJxgZHBI6GxBxVCUiQlJjVTYnOC0eHw8f/EABsBAQADAQEBAQAAAAAAAAAAAAABAgMEBQYH/8QALBEAAgICAQMDAwMFAQAAAAAAAAECEQMSBCExQQUTFCJRYRUy8CMzcYGRwf/aAAwDAQACEQMRAD8AzykE2FIBfnh6pJqsaoAKxoVGSSCkEwCmAs2BJYUsJYUWCOEsKWEsJZJEpsKeE2EsgjhJSwlhTYIpKWE+FFggQmIUyExCmwQTFTIUSFKYKyolWEKshWQIlRKkVEqyIGSSSVgSwpAKQapNaqNgTWqxrU7Wq1rFm5EkWtUw1WNYphizcgVaUtKv0JaFGwKNKWlX6EtCbElGlNpRGhNoTYFGlLSr9CWhNgUaU+lX6EtCbAH0pi1EFiYsTYgHLVAtRJYoFqspAGIUHBEuaqnNV0wDkKJCvIUC1XTIKsJKZakrWC4NVjWqYYrWMWDkSRYxXsjUmMV7GLNuwVtjVgYrWsVgYqiwflpaEVoTFihiwXQm0IksTaFBIPoS0IjQloQA+hLQiAxPoQA2hLQidCbQgBixMWIrRumLFJAIWKBajCxVuYlgDcxVOajXMVTmK6kAJzVAtRbmKstWikAYtSVxYkrbAJa1XMak1qujYsLBJjFc1uE7WpzsrRjZVuhwFIKh0waubU32hp3FstXA1w6gvGQuqHFnPsjGWZR7nbGEsLi0t8oqh4bFVQvcegDxk/JdWOYOUZOLOHdCOVS7FulLQptOVLC5nBo1UiktS0qbiAoagixsbD6UtKWoJagp9tjYWlLSnDgn2UODJ2I6UxarExVdRZU5qrLVc4gKGQVOjFlDmKp7EWQq3tVKosBOYqy1FuaqnNUpgGLUlcWpK2wCWsV8bE7WK9jVCIZHGAuXerjDbqSSoqHaY2/Un0HddWX2WlYqcG78UPEhzR27Hs+TpTvn5BepwcCm9pdkcnIyOKpdyMVFX3sGa5ySUtI73KSM6XEf5z9kSyxWuBoDaKA4/maHfquk6rp2TckzxCbGeXrGr6dVn+MbhLSWpzqdxa97gzUP4Qf/AIvWg8k5KEeiZxyUYrZ9R5LfZKmqdSCGm54bqLIxpIHy+KRhuNkxLQSyVdG336aQ5c0f5D9lleBo5Jb5zAThjHFxPnnb7/kvTWty1a8i8MtG9l+SmP61suhfZrnDcaSOop36o3fUH0K6ZdssPTA2fidsbNqS4AkNHRsjev1H/tlrxJli8vk8aMZJx7M68WVtU+5y7/eW2uHnSQzSRj3nRgHT8d0PZb/BdYXS0+sBrtJDxghB8Yv/AKpqAf4tLPq4D7rJWKR1o4imonH8KXZv6tP2XZh4ePJgbr6jCeeUZ14N/dbzFbqR9RPqLG4GG9TlCWriFlyjdJDFMyMHAc8AZPbdZniiQ1pfTNzop4XTv+OPZH6lNwdL/VJH8srh+QP3Wi4WNYdmupDzyc68GhtnFUdZeZKAQvaW5w8nY467eS0rJxjqvPbXdRJfpoBRxwvDXa39XEgjzCur+JqmlujKRtICCRuXZLgfT0+azzcDeVQjXT7locilcmegiYHzSdKAOq86reJbrbqiJ1XS0/hnnYMJLvrnGfku5db9FRW8VLsuDgNDR1dlc0vTZprzZquSnf4OhfbqaCkfOIXzBgyWsxsPXfyQ3Ct6feKaSZ0QiAeWhodq2wPNZ+5VlyntFRLLBTiJ8LssaTraCOuehwiP2bf3ZJ/qn9At8nDhDjSbXWzOOaUsqXg3bRkJOarIm7KRavnpxpnoxYI5ircxFuYoOYsmi4GWJIgsSVSQprVa1qTQrWhaIqwWpb7KxPBoM1BU1LvfnqZHuPzW7qW+yVieEW+G/eNC73qaqcP9rt2n5he3w/7M6/BwZ/3oz3H9rm8RFXwNc5obofp6txuD+aHp6p16t1BRzOyXSHnHzLWDP55b9V6NUMa5pBwVgb22O2Xueamjw+WmOhrR1kLg3YfRetx83uRUGuq7HJkhq9vDCX3e02PMELPbB9pkLcn5kn7rt8O3qK8MlMEUzBGQCXgYJPpgrBUXC90q5gHxcppOXPkP26lem2C0RWuhZBCCcbucerj6qvLWGEejuROHeT7Ujl8Tt0yWp495tdEB8zg/ktHH7iz/ABi10EdDWaS6KkqWTSNHXSNs/LK79LKyWBskbg5jhlpHmFyZOuKL/wAm0f3tGY40OKamZ/iVMbf1P2Wb4vpnxmCvi2cx2kkeXmCtlfrRTXF8b6l834e7QyQtAPrj1QFfDSPpXUlTKAxzdOXvAce+T5rq4+VQUa/2Y5IN2cm3RPqbbVVMjcSVYc7Ho3GGj/3qg+CnaqapYP4Xh31H/S1Hg4Z6QU7S5kJbpHLdjb0ymtvDtHQSmSm5rSRggvJB+Ss88dZJ+exHtu00Za1j+11b/v8A1CV4H9rKMdmfqVqIOGqOCr8VGZ+fnJcZCc+ufVRqeG6OerNTI6czZyHCQjHpj0Vvk49r/FEe1Kq/JnuNRigp/wDV+xQ3E+o2u1u30Boz8dIx91rbjYaW4Oa6qMrtIwAH4A+SeS00xoBRyNdJCBgB7skem6Y+TCKj+CZYpNs59XPHJw9USte3Q6ndg59W9FZ+zb+7JP8AVP6BQo+HLUHSMYDKcaXNdJnTnt5Fdyw2altZd4XmAP6hzyR9Oiwz5MaxSgr6l8cZbqTNPD7oVpCHidgK4PC+dyQ6npRYxaoOarQcpyFzyjRqmDFiSvLUlQsO1XNVLVewImQyMrctWE4hY6z8QQXRm1LUYp6n0B/hcf0z/wAr0EjIWX43pmTcP17XgYERd8xuvX9PyVNRfZ9Dj5Ebjf2Mtxbdrna5Y5aZsbqRwwS5pJDu+64n75guVZbKqVgjmgmDJG52w7bUOwOFu7HAK+w0bqhok5kDdWoZzt5rg8T8L0FNbKuppqcRzxsMjXNJwMbnbp0BXtYcuJP25Kn2tf8ADhnCb+pPoa6jgGkHCPDA0IKzSc6308p/jja76hHvdsvKyXtR2Rqjh8R1lJR0T31xHId7Dhpzqz5YXJ4JfM20va9sjYGyuFOZBhxj2I+6hxs/xUtBbo3YkqJwSQMlrW9XLvsaSxdfSGFJ93/4Yd5t/YynGt6lpOVSUZxUTfxfyjpt3yqaaw0bYv6RH4iZwy+SQklx81yuNQYuJqWST3NLMH4OOVqtR0EtwTjbPRdj/p4o6eTFfVN7eDk2Wimt17lihMngHx6wDu1rs9PitDV3SkoWt8XPHFnoHHc/JZmivdTNdnUT6aJpYTrcJDsB6bKDm01NeaiWaZ1XUyjDYWx6nMH2/JRPE5yvJ9vHkRnqvpNZSXKmq4+ZTTMlZnBLT0+KrkulIyoELqiISnJ0ahnbff0WJ4aeY73Xsa0xtOTo9MO6fmh6miifxZ4djeXE4AuDdurMkfNPiQU2m/Fj3nSZvaW50tYHmlmZLoOHaT0XMuVzt8wlpZKqLLgWuaH4+WVxbzBFZrXUOoQ6N1Q5rHEHoN+n5/VF2alhFlhYY2ubIzL8j3iUWGEVurrwS5yf0gn7P36BVjyy37rWT36go5RFUVUTJP5Sdx8fRYThqZ1NbrnKz3mNyPjg4RXDYnkt0pZSNn5r3B73SAF3Y5WnIwRnOU5duhTFkcYpI9CiucLoBM2VhiIyHhwxj4oc8SUDYDM6ri5Qdo1B2QT6D16+SxVJbaik4er4K9rCA10jBnOCG9fqqeEaOCeglfNE2Q80tGoZwNLen1XK+DhpybtJmvvztKj0y03aluLNdJMyVoOCWnoV12nIXlHAP4HEddDGcRgHb4O2Xq9OMtC8j1HjRwZNY9jt42V5I2yRCSt0pLyzrBmq+NDs6omNVTJZbjZZD9oczo7I+niGZ6t7aeNvqXH/AIBWyaMhZ+4WGev4poq6eSM0NJG4xxb6jKfM+WMd/JelwJxjk2k+3U5eRFuNLyFWigFJQwU7N2xRtYD64GFVf7a6ttdVTxkNfLE6ME9ASCFoI4gAozx5aVdZ3vsQ8a1oyLHx2Syx+Mka1lPE1r3+WwAXGPF0LhnwFyDD0dyNj+aJ4riNdxHZbYd4XPdUSjyIYNs/P9VroaQFo2Xe5QhFTmrcupzpSk2o9kYG3Mqb3xBBXCkmpqOmjc1rpm6XSF3b0WzjpsN3C6jKUDyVphAHRc2blbtUqSNceHXuYPi3hpl3pwA7lzsOWPx+R7LPU0V9ooxTz2/xWj2WyslaMjyzlej3Oso6SRkdTPHE+T3Q5wBKBfVUhrPC8+LxH+HqGr16Lrw8nIoatWjGeKO1p0zB2ixV7bxLX1bI4hJn8MO1EZ+GyHpLRdrfeKl8dK2eOYnEhkAAyc7+f5L0IzU2hr+azS4OcDnqG9T8lU+qpGsL3TxBoYJCS4Y0k4B+Bwt/l5G3a79DP2YryYS2We6Ul+nlkpmyRS5DpGvAAyQcgZynfaLo7iH94CjHLGBo5rckacLbmuoWMie6piDZc6Dq97BwcfNE82AMleXt0xe+c+7tnf5I+Xku3HxXkLDHtZnL3Y3XK2vgaQ2TZzSegIXDtNFfqaHwb6OIMbkNmfIMAfAbn8l6B4inD3MMrNTS0OGdwXe79VBtTSPq3UzZozUDrGDuFSHJnGLjVruWlii3dmC4esFdTtq4K6ACGZuNQeCfMdB8VVQ2u+WWaSKlpo6unecg6w3H1IwvQKuppKN7G1M0cTn+6HHGVDxlGaiSHnx82MEuZncADJz8lp8vJK242mV9mK6X2M5VUlxms87JIYn1MrS0MjdgNBGNyeqC4ZtNfb6SeGppxkuMjSHg5OAMfktiayjbFzDPHo0CTVnbSeh+BVf70twiZL4qHlvJDXatiR1Waz5NXFR6Mt7cbTsyvCtnudFf5KqekAimJBIkadGTn5r1CnZhoXGpK+iNaKUVEXiP8PUNXTPT4brRws2C831DLLLJOSo6ePBQVJkdKSv0pLymdZxWuREblz2v3REb1kaHTjcrm4QMb0Qx6tGVFWgtpCZ4yFU16mHLRZCupnayzzycWUVwjDTTsgkikydwSQRgfJaOOINCWQphy6MnJc0k/BnHEotscNTObkJ9SfKw9w01MvdbfXNu5q6GKnmbLC2B7ZnlujDidQwDnr026Bc42Su8W6LEBo3VfjOdqPMB66QMY67Zz02wtsQCoFoXdDnSiqMJYEzCR8P3DS6B/hxDBFUMgeHEmQydNQx7OPiUPDwpVU0dSxvJnidBFHFG6RzNJa4uIDgMjBJIPw9F6DoCfQFqvUplPjRMKLLdx4CZz2SzxNe2T+kOZsXggZDfawAAdhlXTWW4v/e8AZTcisDiyQyu1NJYG4LdPTI65W0DApBoUfqEvsv47J+OjD1fC88tybWRSMZIJ4nO3Ptxt0ktPfLcj/tX0NnuVNc2NDohQtmllc4SHU8PyQC3T1BPXPQLYloS0hQ/UJNUx8eKdoylxtlc25+KoY6eUSQiB7ZnlunDidQwDnruNugQTLHcG1tzOIjBVh+k852xLAB7GnHUdc9Fty0JtASPOklQeBMxFl4ZqLbUTESMMLqdkbGDPsOGouHwyc/NVScP3CKjtDYOW6Wki5cn4zowfZaNiGnbb0W80D0TFoU/qM72f88D48aoxlNw7Vi/Gtkex1O6qE3J1HA/CDA7p7wIO3TBW1jbgBRAAU9WFy8jlPNV+DTHiUOxJJVl6S5LNqMq16vjeuc16uZIqNFzqxyIhki5TJO6IZL3VAdJsisEi5zZe6sEqWA/mJxIgealzUsijoCROJEAJe6lzUskO5ibWgub3S5vdTZFBnMS1oLm7pxKp2FBwen1oESp+b3TYUGa0taD5vdNze6bCg3WlrQfN7pub3TYUGF6iZEIZe6gZe6bCgsyKJlQZl7qJl7pYoMMqSAMvdJBRmmyK1kndAh6sa9dLgDoslVzZe65zXqxsiycBZ0myqYm7rnNlUxKqaknQE3dPze65/NTiVRqDoc7unE3dc/mp+b3TUB/O7pc7ugOb3S5vdKAdzt+qlzu65/M7pxKlA6Am7pc7uufze6fmpQD+d3S53dc/mpc1KB0ed3Tc7ugOakZUoBxm7qBl7oMyqJl7pQCzL3UDL3QjpVAyq2pAYZUkCZUlOoORqUmvQ+VIOXa4lQsPVjXoQOUw5UcQFh6lrQgcpalTUmwrWlrQ2tLWo0FhXMT8xCa04emgsK5iXMQutLWmgsK5icSITWn1poLC+YlzELqT61GgCeYm5iG1Ja00FhPMS5ndC60taaCwkyKJkQ+tMXqdBZeXqBkVJcoFysoEWX8xJD6klbUWCpwkktiCYKmEklVgkCpZSSVSRZSykkoAspZSSQD5SykkgEnykkoA+U+UkkA2UxKSSAWUkkkAyYlJJSCJKiSkkrIgjlJJJSD/9k=',NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(45,'2025-09-04 20:38:30.031532',NULL,_binary '\0','2025-09-08 17:48:37.592303',3,NULL,NULL,NULL,NULL,'agisunny@daum.com',NULL,NULL,0,NULL,'CONSULTANT_JUNIOR',_binary '',_binary '\0',NULL,NULL,NULL,'김선희2',NULL,NULL,'$2a$12$x.ytrH97J2P2hy28l1N4JeqwU3wdTTbgqr7L2cLSxK/T5hvu1dL06',NULL,NULL,'010-1111-2222',NULL,NULL,NULL,'CONSULTANT','DEPRESSION,ANXIETY,TRAUMA',0,'김선희2',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(46,'2025-09-04 22:00:35.732225',NULL,_binary '\0','2025-09-09 00:22:45.442821',2,NULL,NULL,NULL,NULL,'lee@naver.com',NULL,NULL,0,NULL,'CLIENT_BRONZE',_binary '',_binary '\0',NULL,NULL,NULL,'이재욱',NULL,NULL,'$2a$12$9NtCxkqoJxOxfWkOZeXAl.vKlyVNq5EtKxtWvL3YJow0QMgzGHm.y',NULL,NULL,'010-5555-6666',NULL,NULL,NULL,'CLIENT',NULL,0,'lee@naver.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(48,'2025-09-05 16:16:59.000000',NULL,_binary '\0','2025-09-17 23:17:48.524287',237,NULL,NULL,NULL,NULL,'superadmin@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '',_binary '',NULL,'2025-09-17 23:17:48.524001',NULL,'수퍼관리자',NULL,NULL,'$2a$12$s6seoi0GwNMHBG5i0xNmwOV2Vk0ka1.6abl/AEWbAELgsLxKldjQW',NULL,NULL,NULL,NULL,NULL,NULL,'BRANCH_SUPER_ADMIN',NULL,NULL,'superadmin',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(50,'2025-09-12 15:35:14.000000',NULL,_binary '\0','2025-09-12 15:35:14.000000',0,NULL,NULL,NULL,NULL,'branch_super@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '',_binary '',NULL,NULL,NULL,'지점수퍼관리자',NULL,NULL,'$2a$12$s6seoi0GwNMHBG5i0xNmwOV2Vk0ka1.6abl/AEWbAELgsLxKldjQW',NULL,NULL,NULL,NULL,NULL,NULL,'BRANCH_SUPER_ADMIN',NULL,NULL,'branch_super',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(51,'2025-09-12 15:39:29.000000',NULL,_binary '\0','2025-09-12 23:10:53.198526',1,NULL,NULL,NULL,NULL,'hq_admin@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '',_binary '',NULL,'2025-09-12 23:10:53.198301',NULL,'헤드쿼터어드민',NULL,NULL,'$2a$12$s6seoi0GwNMHBG5i0xNmwOV2Vk0ka1.6abl/AEWbAELgsLxKldjQW',NULL,NULL,NULL,NULL,NULL,NULL,'HQ_ADMIN',NULL,NULL,'hq_admin',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(52,'2025-09-12 15:39:35.000000',NULL,_binary '\0','2025-09-12 15:39:35.000000',0,NULL,NULL,NULL,NULL,'super_hq_admin@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '',_binary '',NULL,NULL,NULL,'수퍼헤드쿼터어드민',NULL,NULL,'$2a$12$s6seoi0GwNMHBG5i0xNmwOV2Vk0ka1.6abl/AEWbAELgsLxKldjQW',NULL,NULL,NULL,NULL,NULL,NULL,'HQ_MASTER',NULL,NULL,'super_hq_admin',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(53,'2025-09-12 15:39:49.000000',NULL,_binary '\0','2025-09-12 15:39:49.000000',0,NULL,NULL,NULL,NULL,'branch_admin@mindgarden.com',NULL,NULL,NULL,NULL,NULL,_binary '',_binary '',NULL,NULL,NULL,'브런치어드민',NULL,NULL,'$2a$12$s6seoi0GwNMHBG5i0xNmwOV2Vk0ka1.6abl/AEWbAELgsLxKldjQW',NULL,NULL,NULL,NULL,NULL,NULL,'ADMIN',NULL,NULL,'branch_admin',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(54,'2025-09-12 16:23:36.974527',NULL,_binary '\0','2025-09-17 13:41:27.359873',2,NULL,NULL,NULL,NULL,'beta0629@gamil.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'이재학2',NULL,NULL,'$2a$12$DxmGsUhurLQsKZDqCK4YUerXFr/jDkHMjOSUdAOg9Yjb4VhKXRuuu',NULL,NULL,'010-1111-2222',NULL,NULL,NULL,'CLIENT',NULL,NULL,'beta0629@gamil.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(55,'2025-09-12 16:41:09.561165',NULL,_binary '\0','2025-09-17 13:35:01.632353',2,NULL,NULL,NULL,NULL,'testclient3@test.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'테스트내담자3',NULL,NULL,'$2a$12$73sakzRfVUcNgfKHcXBzDut1pW1TZRMhOAE7O2SWDhxmUZgkRhe/O',NULL,NULL,'010-1234-5678',NULL,NULL,NULL,'CLIENT',NULL,NULL,'testclient3@test.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(56,'2025-09-12 16:41:24.173197',NULL,_binary '\0','2025-09-17 09:32:15.736401',2,NULL,NULL,NULL,NULL,'testconsultant3@test.com',NULL,NULL,0,NULL,'CONSULTANT_JUNIOR',_binary '\0',_binary '\0',NULL,NULL,NULL,'테스트상담사3',NULL,NULL,'$2a$12$2ZbuCoaZUMFOP1sRqLunOO39tbMyilpj.GX3z/D4DrDEqbP2vGZ6a',NULL,NULL,'010-1111-2222',NULL,NULL,NULL,'CONSULTANT',NULL,0,'testconsultant3@test.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(57,'2025-09-12 16:42:54.569777',NULL,_binary '\0','2025-09-17 09:32:13.101108',2,NULL,NULL,NULL,NULL,'testconsultant4@test.com',NULL,NULL,0,NULL,'CONSULTANT_JUNIOR',_binary '\0',_binary '\0',NULL,NULL,NULL,'테스트상담사4',NULL,NULL,'$2a$12$Du2d/Pvo2vQ7rnvVD7HQoecdSMgLYL0t.P7mwGjVmKMaoViWX0wlS',NULL,NULL,'010-1111-2222',NULL,NULL,NULL,'CONSULTANT',NULL,0,'testconsultant4@test.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(58,'2025-09-12 16:43:14.097645',NULL,_binary '\0','2025-09-17 13:35:13.630325',2,NULL,NULL,NULL,NULL,'testclient_auto@test.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'자동지점테스트내담자',NULL,NULL,'$2a$12$BPbNWbM4F2cKjGTNrx0XJOKbth09X8sqw8mgJPTUFXnNfqlVis.Re',NULL,NULL,'010-1234-5678',NULL,NULL,NULL,'CLIENT',NULL,NULL,'testclient_auto@test.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(59,'2025-09-12 16:45:53.800847',NULL,_binary '\0','2025-09-17 13:41:19.631945',2,NULL,NULL,NULL,NULL,'111@naver.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'테스트2내담',NULL,NULL,'$2a$12$YI6ClSvwNhURkANqX.GAb.C90iV2FEKqIBXxLaz7qGlMa3V9JaSlm',NULL,NULL,'010-2222-3333',NULL,NULL,NULL,'CLIENT',NULL,NULL,'111@naver.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(60,'2025-09-12 16:50:45.449623',NULL,_binary '\0','2025-09-17 13:41:15.851135',2,NULL,NULL,NULL,NULL,'testclient_fixed3@test.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'수정된지점코드테스트3',NULL,NULL,'$2a$12$4lAdjKd0yGWveoRrSFEtFuapQfIhIvzVwFjUN3s6.qY1ZaaQe5eaq',NULL,NULL,'010-1234-5678',NULL,NULL,NULL,'CLIENT',NULL,NULL,'testclient_fixed3@test.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(61,'2025-09-12 16:51:36.644651',NULL,_binary '\0','2025-09-17 13:40:30.524846',2,NULL,NULL,NULL,NULL,'testclient_no_branch@test.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'지점코드없는테스트',NULL,NULL,'$2a$12$MOuT/anM2Y8V/tBgdliG5eJswbYL6VjVuzW49tBO9fs0hexFkWKN.',NULL,NULL,'010-1234-5678',NULL,NULL,NULL,'CLIENT',NULL,NULL,'testclient_no_branch@test.com',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(62,'2025-09-12 16:52:31.969817',NULL,_binary '\0','2025-09-17 13:40:27.117648',2,NULL,NULL,NULL,NULL,'1111@as',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'지점내담자 등록',NULL,NULL,'$2a$12$a29tzpQFG7gKyJoqzzMcjO2/WUuJOGByZ92cRsjICOFJN2bsWAlhG',NULL,NULL,'222-2333-3663',NULL,NULL,NULL,'CLIENT',NULL,NULL,'1111@as',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(63,'2025-09-12 16:56:58.374485',NULL,_binary '\0','2025-09-17 09:32:10.142184',2,NULL,NULL,NULL,NULL,'consultant@test.com',NULL,NULL,0,NULL,'CONSULTANT_JUNIOR',_binary '\0',_binary '\0',NULL,NULL,NULL,'김상담',NULL,NULL,'$2a$12$mlX5GaOpRyprVfDw994bDetawpxpkAosjKUkx1aS8Jyc3jjGciS2G',NULL,NULL,'010-1234-5678',NULL,NULL,NULL,'CONSULTANT',NULL,0,'김상담',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(66,'2025-09-12 17:00:40.091014',NULL,_binary '\0','2025-09-17 09:32:06.482499',2,NULL,NULL,NULL,NULL,'consultant3@test.com',NULL,NULL,0,NULL,'CONSULTANT_JUNIOR',_binary '\0',_binary '\0',NULL,NULL,NULL,'김상담사',NULL,NULL,'$2a$12$xz0ITd6lpB.bzku.4FumduYdWPVFbZHHwVuN38kwEh2cgnVr0QbGi',NULL,NULL,'010-1234-5678',NULL,NULL,NULL,'CONSULTANT',NULL,0,'김상담사',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(67,'2025-09-12 17:01:48.691251',NULL,_binary '\0','2025-09-17 09:31:49.198745',2,NULL,NULL,NULL,NULL,'11@11',NULL,NULL,0,NULL,'CONSULTANT_JUNIOR',_binary '\0',_binary '\0',NULL,NULL,NULL,'상담',NULL,NULL,'$2a$12$lbof49itAFToZS.zj6AJ7ODKefFOV3nJNcnQO.Lqil4jNGA9tO2mO',NULL,NULL,'010-0000-0000',NULL,NULL,NULL,'CONSULTANT',NULL,0,'상담',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(68,'2025-09-12 17:03:22.377581',NULL,_binary '\0','2025-09-17 13:40:23.968382',2,NULL,NULL,NULL,NULL,'client@test.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'김내담',NULL,NULL,'$2a$12$3IwcSzzFa1SGT9mTGlmkveX/G/fk.CaKvp3xAJsCLhRY6RzOZgFhK',NULL,NULL,'010-9876-5432',NULL,NULL,NULL,'CLIENT',NULL,NULL,'김내담',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(70,'2025-09-12 18:07:52.491492',NULL,_binary '\0','2025-09-17 09:31:30.785610',2,NULL,NULL,NULL,NULL,'11@33',NULL,NULL,0,NULL,'CONSULTANT_JUNIOR',_binary '\0',_binary '\0',NULL,NULL,NULL,'상담2',NULL,NULL,'$2a$12$.MeWl0b6ClHPqq0tKjIvneIx6Lyd9eS9PtH81lA.gMLpH4JzKDhEu',NULL,NULL,'010-6666-6666',NULL,NULL,NULL,'CONSULTANT',NULL,0,'상담2',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(71,'2025-09-12 23:30:47.144482',NULL,_binary '\0','2025-09-17 09:30:04.932910',2,NULL,NULL,NULL,NULL,'22@33',NULL,NULL,0,NULL,'CONSULTANT_JUNIOR',_binary '\0',_binary '\0',NULL,NULL,NULL,'이르',NULL,NULL,'$2a$12$YC4nMVRDt0n1DUO6FL4A.uCYi/YDiofHR7HwhcYndykneZ2UH2mBO',NULL,NULL,'111-1111-1111',NULL,NULL,NULL,'CONSULTANT',NULL,0,'이르',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(72,'2025-09-12 23:31:40.185403',NULL,_binary '\0','2025-09-12 23:31:40.263483',1,NULL,NULL,NULL,NULL,'mind@mind',NULL,NULL,NULL,NULL,NULL,_binary '',_binary '\0',NULL,NULL,NULL,'마음이',NULL,NULL,'$2a$12$RfZjqIGelBbdSbAit9ck7OEaf8zpX4lW4zna2z9XwScXtNLYFFoqu',NULL,NULL,'111-1111-1111',NULL,NULL,NULL,'CLIENT',NULL,NULL,'mind@mind',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(73,'2025-09-13 00:50:18.525630',NULL,_binary '\0','2025-09-13 00:50:18.525630',0,NULL,NULL,NULL,NULL,'trinity2012@kakao.com',NULL,NULL,NULL,NULL,NULL,_binary '',_binary '\0',NULL,NULL,NULL,'김선희',NULL,NULL,'$2a$12$tQYBxpLqks/7DZHzvMa4veX3kwdR.urxRrRX4OBjgpgSfxn7CqrzS',NULL,NULL,'01042858570',NULL,NULL,NULL,'CLIENT',NULL,NULL,'trinity2012',NULL,NULL,_binary '\0',NULL,NULL,NULL,NULL,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(75,'2025-09-13 01:01:28.717557',NULL,_binary '\0','2025-09-17 13:40:13.373640',1,NULL,NULL,NULL,NULL,'test2@kakao.com',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',NULL,NULL,NULL,'테스트사용자2',NULL,NULL,'$2a$12$CXoOo4MN9sikBDx.xJ5XEuGySIUmcmsEgN0X6U8AzlQi9ombvfeC.',NULL,NULL,'01012345679',NULL,NULL,NULL,'CLIENT',NULL,NULL,'test2',NULL,NULL,_binary '\0',NULL,NULL,NULL,1,'MAIN001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacations`
--

DROP TABLE IF EXISTS `vacations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `approved_at` datetime(6) DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `consultant_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `end_time` time(6) DEFAULT NULL,
  `is_approved` bit(1) NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` time(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `vacation_date` date NOT NULL,
  `vacation_type` enum('MORNING','MORNING_HALF_1','MORNING_HALF_2','AFTERNOON','AFTERNOON_HALF_1','AFTERNOON_HALF_2','CUSTOM_TIME','ALL_DAY','FULL_DAY') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacations`
--

LOCK TABLES `vacations` WRITE;
/*!40000 ALTER TABLE `vacations` DISABLE KEYS */;
INSERT INTO `vacations` VALUES (1,NULL,NULL,43,'2025-09-09 14:48:04.727596','2025-09-09 15:04:03.629210','18:00:00.000000',_binary '',_binary '','개인 사정','09:00:00.000000','2025-09-09 15:04:03.630703','2025-09-26','FULL_DAY'),(2,NULL,NULL,43,'2025-09-09 15:04:06.401557','2025-09-09 15:04:16.476042','10:30:00.000000',_binary '',_binary '','오전 반반차 테스트','09:00:00.000000','2025-09-09 15:04:16.476298','2025-09-26','MORNING_HALF_1'),(3,NULL,NULL,43,'2025-09-09 15:04:19.474227','2025-09-09 15:04:29.688851','18:00:00.000000',_binary '',_binary '','오후 반반차 테스트','15:30:00.000000','2025-09-09 15:04:29.689245','2025-09-26','AFTERNOON_HALF_1'),(4,NULL,NULL,43,'2025-09-09 15:04:33.141016',NULL,'16:00:00.000000',_binary '',_binary '\0','사용자 정의 시간 휴가 테스트','14:00:00.000000','2025-09-09 15:04:33.141024','2025-09-26','CUSTOM_TIME'),(5,NULL,NULL,43,'2025-09-09 15:10:14.247643',NULL,'12:00:00.000000',_binary '',_binary '\0','관리자가 등록한 오전 휴가','09:00:00.000000','2025-09-09 15:10:14.247654','2025-09-27','MORNING'),(6,NULL,NULL,43,'2025-09-09 15:48:38.365209','2025-09-09 15:57:55.114668',NULL,_binary '',_binary '','휴가',NULL,'2025-09-09 15:57:55.114946','2025-09-21','ALL_DAY'),(7,NULL,NULL,43,'2025-09-09 15:53:40.732466',NULL,NULL,_binary '',_binary '\0','22일 휴가 테스트 (수정됨)',NULL,'2025-09-09 15:57:58.131516','2025-09-22','ALL_DAY'),(8,NULL,NULL,45,'2025-09-09 15:55:29.006629',NULL,'10:30:00.000000',_binary '',_binary '\0','오전 반반차','09:00:00.000000','2025-09-09 15:55:29.006638','2025-09-21','MORNING_HALF_1'),(9,NULL,NULL,41,'2025-09-09 15:57:02.270108',NULL,NULL,_binary '',_binary '\0','반차',NULL,'2025-09-09 15:57:02.270115','2025-09-21','MORNING'),(10,NULL,NULL,45,'2025-09-09 16:00:51.038405',NULL,NULL,_binary '',_binary '\0','10월 6일 종일 휴가 테스트',NULL,'2025-09-09 16:18:33.053164','2025-10-06','ALL_DAY'),(11,NULL,NULL,45,'2025-09-09 16:17:40.002512',NULL,NULL,_binary '',_binary '\0','종일 휴무 테스트',NULL,'2025-09-09 16:17:40.002533','2025-09-26','ALL_DAY'),(12,NULL,NULL,43,'2025-09-09 17:08:47.267613',NULL,'18:00:00.000000',_binary '',_binary '\0','오후 반반','12:00:00.000000','2025-09-09 17:08:47.267637','2025-10-10','AFTERNOON_HALF_2'),(13,NULL,NULL,43,'2025-09-09 17:47:42.778931',NULL,'18:00:00.000000',_binary '',_binary '\0','반반차','16:00:00.000000','2025-09-09 17:47:42.778956','2025-10-08','AFTERNOON_HALF_2'),(14,NULL,NULL,32,'2025-09-10 09:31:40.646190',NULL,NULL,_binary '',_binary '\0','휴가',NULL,'2025-09-10 09:31:40.646212','2025-10-09','ALL_DAY'),(15,NULL,NULL,43,'2025-09-11 15:44:45.303324',NULL,NULL,_binary '',_binary '\0','휴가\n',NULL,'2025-09-11 15:44:45.303343','2025-09-09','FULL_DAY'),(16,NULL,NULL,43,'2025-09-11 15:47:32.066573',NULL,NULL,_binary '',_binary '\0','종일 휴가 테스트',NULL,'2025-09-11 15:47:32.066577','2025-09-11','ALL_DAY'),(17,NULL,NULL,43,'2025-09-16 14:32:24.079110',NULL,NULL,_binary '',_binary '\0','오전반차',NULL,'2025-09-16 14:32:24.079131','2025-09-18','MORNING');
/*!40000 ALTER TABLE `vacations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warm_words`
--

DROP TABLE IF EXISTS `warm_words`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warm_words` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consultant_role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `mood_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warm_words`
--

LOCK TABLES `warm_words` WRITE;
/*!40000 ALTER TABLE `warm_words` DISABLE KEYS */;
INSERT INTO `warm_words` VALUES (1,'APPRECIATION','CONSULTANT','오늘도 힘든 마음들을 들어주느라 고생하셨어요. 당신의 따뜻한 마음이 많은 사람들에게 힘이 되고 있어요.',NULL,NULL,NULL,NULL),(2,'ENCOURAGEMENT','CONSULTANT','상담사님의 작은 한마디가 누군가에게는 큰 위로가 됩니다. 오늘도 소중한 일을 하고 계세요.',NULL,NULL,NULL,NULL),(3,'SUPPORT','CONSULTANT','힘든 상담이 있어도 포기하지 않는 당신의 모습이 정말 아름다워요. 당신은 훌륭한 상담사입니다.',NULL,NULL,'STRESSED',NULL),(4,'APPRECIATION','CONSULTANT','오늘 하루도 열심히 일한 당신에게 박수를 보냅니다. 당신의 노력이 세상을 더 따뜻하게 만들어요.',NULL,NULL,'TIRED',NULL),(5,'SUPPORT','CONSULTANT','상담사님 덕분에 많은 사람들이 희망을 찾고 있어요. 당신은 정말 소중한 존재입니다.',NULL,NULL,'OVERWHELMED',NULL),(6,'APPRECIATION','CONSULTANT','오늘도 따뜻한 마음으로 내담자들을 도와주셔서 감사해요. 당신의 선한 마음이 세상을 밝게 해요.',NULL,NULL,'SUCCESS',NULL),(7,'ENCOURAGEMENT','CONSULTANT','힘든 하루였을 수도 있지만, 당신이 한 번의 상담으로도 누군가의 인생을 바꿀 수 있어요.',NULL,NULL,'STRESSED',NULL),(8,'SUPPORT','CONSULTANT','상담사님의 인내심과 이해심이 많은 사람들에게 희망을 주고 있어요. 당신은 정말 대단해요.',NULL,NULL,'TIRED',NULL),(9,'APPRECIATION','CONSULTANT','오늘도 마음의 상처를 치유하는 소중한 일을 하고 계시는군요. 당신의 따뜻함에 감사합니다.',NULL,NULL,NULL,NULL),(10,'ENCOURAGEMENT','CONSULTANT','힘든 순간에도 포기하지 않는 당신의 모습이 정말 아름다워요. 당신은 훌륭한 상담사입니다.',NULL,NULL,'OVERWHELMED',NULL),(11,'APPRECIATION','ADMIN','관리자로서 시스템을 잘 운영하고 계시는군요. 당신의 노고 덕분에 상담사들이 더 좋은 환경에서 일할 수 있어요.',NULL,NULL,NULL,NULL),(12,'ENCOURAGEMENT','ADMIN','복잡한 관리 업무를 차근차근 처리하시는 모습이 정말 대단해요. 당신의 세심함이 팀 전체의 힘이 됩니다.',NULL,NULL,'STRESSED',NULL),(13,'SUPPORT','ADMIN','관리자님 덕분에 시스템이 안정적으로 운영되고 있어요. 당신의 전문성이 팀의 든든한 버팀목입니다.',NULL,NULL,'TIRED',NULL),(14,'APPRECIATION','BRANCH_SUPER_ADMIN','지점 운영을 위해 고생하시는 모습이 정말 멋져요. 당신의 리더십이 지점의 발전을 이끌고 있어요.',NULL,NULL,NULL,NULL),(15,'ENCOURAGEMENT','BRANCH_SUPER_ADMIN','복잡한 지점 관리 업무를 해결하시는 모습이 정말 대단해요. 당신의 판단력이 팀의 성공을 만들어가고 있어요.',NULL,NULL,'STRESSED',NULL),(16,'SUPPORT','BRANCH_SUPER_ADMIN','지점 수퍼어드민님 덕분에 지점이 안정적으로 운영되고 있어요. 당신의 헌신이 지점의 미래를 밝게 해요.',NULL,NULL,'TIRED',NULL),(17,'APPRECIATION','CLIENT','오늘도 마음을 열고 상담에 참여해주셔서 감사해요. 당신의 용기가 정말 대단해요.',NULL,NULL,NULL,NULL),(18,'ENCOURAGEMENT','CLIENT','힘든 마음을 털어놓아주셔서 고맙습니다. 당신의 솔직함이 치유의 첫걸음이에요.',NULL,NULL,'STRESSED',NULL),(19,'SUPPORT','CLIENT','상담을 받으시느라 고생하셨어요. 당신의 노력이 분명 좋은 결과로 이어질 거예요.',NULL,NULL,'TIRED',NULL),(20,'ENCOURAGEMENT','CLIENT','마음의 변화를 위해 노력하는 당신의 모습이 정말 아름다워요. 당신은 충분히 소중한 사람입니다.',NULL,NULL,'OVERWHELMED',NULL),(21,'APPRECIATION','CLIENT','상담을 통해 조금씩 나아가고 있는 당신이 자랑스러워요. 작은 변화도 큰 의미가 있어요.',NULL,NULL,'SUCCESS',NULL),(22,'SUPPORT','CLIENT','힘든 순간에도 포기하지 않는 당신의 의지력이 정말 대단해요. 당신은 강한 사람이에요.',NULL,NULL,'STRESSED',NULL),(23,'ENCOURAGEMENT','CLIENT','자신을 돌아보고 변화하려는 마음이 정말 고귀해요. 당신의 진심이 느껴져요.',NULL,NULL,'TIRED',NULL),(24,'APPRECIATION','CLIENT','마음의 상처를 치유하려는 용기가 정말 멋져요. 당신의 용기가 많은 사람들에게 힘이 될 거예요.',NULL,NULL,'OVERWHELMED',NULL),(25,'SUPPORT','CLIENT','오늘도 마음을 열어주셔서 고맙습니다. 당신의 신뢰가 상담을 더 의미 있게 만들어요.',NULL,NULL,NULL,NULL),(26,'ENCOURAGEMENT','CLIENT','자신을 돌아보고 성장하려는 마음이 정말 아름다워요. 당신은 이미 훌륭한 사람입니다.',NULL,NULL,'SUCCESS',NULL),(27,'APPRECIATION','CONSULTANT','오늘도 힘든 마음들을 들어주느라 고생하셨어요. 당신의 따뜻한 마음이 많은 사람들에게 힘이 되고 있어요.','2025-09-14 21:55:17.000000',_binary '',NULL,'2025-09-14 21:55:17.000000'),(28,'ENCOURAGEMENT','CONSULTANT','상담사님의 작은 한마디가 누군가에게는 큰 위로가 됩니다. 오늘도 소중한 일을 하고 계세요.','2025-09-14 21:55:17.000000',_binary '',NULL,'2025-09-14 21:55:17.000000'),(29,'SUPPORT','CONSULTANT','힘든 상담이 있어도 포기하지 않는 당신의 모습이 정말 아름다워요. 당신은 훌륭한 상담사입니다.','2025-09-14 21:55:17.000000',_binary '','STRESSED','2025-09-14 21:55:17.000000'),(30,'APPRECIATION','CONSULTANT','오늘 하루도 열심히 일한 당신에게 박수를 보냅니다. 당신의 노력이 세상을 더 따뜻하게 만들어요.','2025-09-14 21:55:17.000000',_binary '','TIRED','2025-09-14 21:55:17.000000'),(31,'SUPPORT','CONSULTANT','상담사님 덕분에 많은 사람들이 희망을 찾고 있어요. 당신은 정말 소중한 존재입니다.','2025-09-14 21:55:17.000000',_binary '','OVERWHELMED','2025-09-14 21:55:17.000000'),(32,'APPRECIATION','CONSULTANT','오늘도 따뜻한 마음으로 내담자들을 도와주셔서 감사해요. 당신의 선한 마음이 세상을 밝게 해요.','2025-09-14 21:55:17.000000',_binary '','SUCCESS','2025-09-14 21:55:17.000000'),(33,'ENCOURAGEMENT','CONSULTANT','힘든 하루였을 수도 있지만, 당신이 한 번의 상담으로도 누군가의 인생을 바꿀 수 있어요.','2025-09-14 21:55:17.000000',_binary '','STRESSED','2025-09-14 21:55:17.000000'),(34,'SUPPORT','CONSULTANT','상담사님의 인내심과 이해심이 많은 사람들에게 희망을 주고 있어요. 당신은 정말 대단해요.','2025-09-14 21:55:17.000000',_binary '','TIRED','2025-09-14 21:55:17.000000'),(35,'APPRECIATION','CONSULTANT','오늘도 마음의 상처를 치유하는 소중한 일을 하고 계시는군요. 당신의 따뜻함에 감사합니다.','2025-09-14 21:55:17.000000',_binary '',NULL,'2025-09-14 21:55:17.000000'),(36,'ENCOURAGEMENT','CONSULTANT','힘든 순간에도 포기하지 않는 당신의 모습이 정말 아름다워요. 당신은 훌륭한 상담사입니다.','2025-09-14 21:55:17.000000',_binary '','OVERWHELMED','2025-09-14 21:55:17.000000'),(37,'APPRECIATION','CLIENT','오늘도 마음을 열고 상담에 참여해주셔서 감사해요. 당신의 용기가 정말 대단해요.','2025-09-14 21:55:17.000000',_binary '',NULL,'2025-09-14 21:55:17.000000'),(38,'ENCOURAGEMENT','CLIENT','힘든 마음을 털어놓아주셔서 고맙습니다. 당신의 솔직함이 치유의 첫걸음이에요.','2025-09-14 21:55:17.000000',_binary '','STRESSED','2025-09-14 21:55:17.000000'),(39,'SUPPORT','CLIENT','상담을 받으시느라 고생하셨어요. 당신의 노력이 분명 좋은 결과로 이어질 거예요.','2025-09-14 21:55:17.000000',_binary '','TIRED','2025-09-14 21:55:17.000000'),(40,'ENCOURAGEMENT','CLIENT','마음의 변화를 위해 노력하는 당신의 모습이 정말 아름다워요. 당신은 충분히 소중한 사람입니다.','2025-09-14 21:55:17.000000',_binary '','OVERWHELMED','2025-09-14 21:55:17.000000'),(41,'APPRECIATION','CLIENT','상담을 통해 조금씩 나아가고 있는 당신이 자랑스러워요. 작은 변화도 큰 의미가 있어요.','2025-09-14 21:55:17.000000',_binary '','SUCCESS','2025-09-14 21:55:17.000000'),(42,'SUPPORT','CLIENT','힘든 순간에도 포기하지 않는 당신의 의지력이 정말 대단해요. 당신은 강한 사람이에요.','2025-09-14 21:55:17.000000',_binary '','STRESSED','2025-09-14 21:55:17.000000'),(43,'ENCOURAGEMENT','CLIENT','자신을 돌아보고 변화하려는 마음이 정말 고귀해요. 당신의 진심이 느껴져요.','2025-09-14 21:55:17.000000',_binary '','TIRED','2025-09-14 21:55:17.000000'),(44,'APPRECIATION','CLIENT','마음의 상처를 치유하려는 용기가 정말 멋져요. 당신의 용기가 많은 사람들에게 힘이 될 거예요.','2025-09-14 21:55:17.000000',_binary '','OVERWHELMED','2025-09-14 21:55:17.000000'),(45,'SUPPORT','CLIENT','오늘도 마음을 열어주셔서 고맙습니다. 당신의 신뢰가 상담을 더 의미 있게 만들어요.','2025-09-14 21:55:17.000000',_binary '',NULL,'2025-09-14 21:55:17.000000'),(46,'ENCOURAGEMENT','CLIENT','자신을 돌아보고 성장하려는 마음이 정말 아름다워요. 당신은 이미 훌륭한 사람입니다.','2025-09-14 21:55:17.000000',_binary '','SUCCESS','2025-09-14 21:55:17.000000');
/*!40000 ALTER TABLE `warm_words` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-18 14:15:49
