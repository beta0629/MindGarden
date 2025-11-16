ALTER TABLE ops_pricing_plan
    ADD COLUMN IF NOT EXISTS display_name_ko VARCHAR(120);

ALTER TABLE ops_pricing_plan
    ADD COLUMN IF NOT EXISTS description_ko TEXT;

ALTER TABLE ops_pricing_addon
    ADD COLUMN IF NOT EXISTS display_name_ko VARCHAR(120);

ALTER TABLE ops_pricing_addon
    ADD COLUMN IF NOT EXISTS category_ko VARCHAR(60);

UPDATE ops_pricing_plan
SET display_name_ko = COALESCE(display_name_ko, display_name),
    description_ko = COALESCE(description_ko, description);

UPDATE ops_pricing_addon
SET display_name_ko = COALESCE(display_name_ko, display_name),
    category_ko = COALESCE(category_ko, category);

