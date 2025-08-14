-- Database schema for ShiftLift Platform Prep module

-- Raw sales at 15-minute granularity
CREATE TABLE IF NOT EXISTS sales_15min (
    id BIGSERIAL PRIMARY KEY,
    store_id TEXT NOT NULL,
    ts_local TIMESTAMPTZ NOT NULL,
    item_id TEXT NOT NULL,
    qty_sold INTEGER NOT NULL
);

-- Menu items (SKU level)
CREATE TABLE IF NOT EXISTS menu_items (
    id BIGSERIAL PRIMARY KEY,
    org_id TEXT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT,
    station TEXT
);

-- Recipes that map menu items to components and quantities
CREATE TABLE IF NOT EXISTS recipes (
    id BIGSERIAL PRIMARY KEY,
    org_id TEXT,
    sku TEXT NOT NULL REFERENCES menu_items(sku) ON DELETE CASCADE,
    component TEXT NOT NULL,
    qty NUMERIC NOT NULL,
    uom TEXT NOT NULL,
    shelf_life_hours INTEGER
);

-- Waste logs capturing discards and reasons
CREATE TABLE IF NOT EXISTS waste_logs (
    id BIGSERIAL PRIMARY KEY,
    org_id TEXT,
    store_id TEXT,
    ts_utc TIMESTAMPTZ,
    item_sku TEXT REFERENCES menu_items(sku) ON DELETE SET NULL,
    qty INTEGER,
    reason_code TEXT
);

-- Prep plans for a given service date and location
CREATE TABLE IF NOT EXISTS prep_plans (
    id BIGSERIAL PRIMARY KEY,
    service_date DATE NOT NULL,
    store_id TEXT NOT NULL,
    item_sku TEXT NOT NULL REFERENCES menu_items(sku) ON DELETE CASCADE,
    plan_qty INTEGER,
    confidence TEXT,
    made_qty INTEGER,
    override_qty INTEGER,
    UNIQUE(service_date, store_id, item_sku)
);