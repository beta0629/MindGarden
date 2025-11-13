CREATE TABLE ops_onboarding_request (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    tenant_name VARCHAR(120) NOT NULL,
    requested_by VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    risk_level VARCHAR(16) NOT NULL,
    checklist_json TEXT,
    decided_by VARCHAR(64),
    decision_at VARCHAR(30),
    decision_note TEXT
);

CREATE TABLE ops_pricing_plan (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    plan_code VARCHAR(40) UNIQUE NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    base_fee NUMERIC(12,2) NOT NULL,
    currency VARCHAR(8) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL
);

CREATE TABLE ops_pricing_addon (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    addon_code VARCHAR(40) UNIQUE NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    category VARCHAR(60),
    fee_type VARCHAR(16) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    unit VARCHAR(32),
    active BOOLEAN NOT NULL
);

CREATE TABLE ops_plan_addon (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    plan_id UUID NOT NULL REFERENCES ops_pricing_plan(id),
    addon_id UUID NOT NULL REFERENCES ops_pricing_addon(id),
    notes VARCHAR(255)
);

CREATE TABLE ops_feature_flag (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    flag_key VARCHAR(64) UNIQUE NOT NULL,
    description VARCHAR(200),
    state VARCHAR(16) NOT NULL,
    target_scope VARCHAR(64),
    expires_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE ops_audit_log (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    action VARCHAR(120) NOT NULL,
    metadata_json TEXT
);
