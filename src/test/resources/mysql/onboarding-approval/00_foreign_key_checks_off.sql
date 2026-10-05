-- source: dev DB (production D-1 copy), 2026-10-05
-- users.branch_id and branches_dropped_20260612.manager_id reference each other.
-- Checks are disabled only while the SHOW CREATE statements load, then re-enabled.
SET FOREIGN_KEY_CHECKS=0;
