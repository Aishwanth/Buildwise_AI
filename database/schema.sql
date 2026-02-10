
-- BUILDWISE AI - FULL BACKEND SCHEMA
-- Copy and execute this in your Supabase SQL Editor

-- 1. WORK ENTRIES (Daily Updates)
CREATE TABLE IF NOT EXISTS work_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    description TEXT,
    photos JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MATERIALS (Inventory & Budget Tracking)
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT,
    cost_per_unit NUMERIC NOT NULL DEFAULT 0,
    bill_photo JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. WORKERS (HR & Workforce Hub)
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    daily_wage NUMERIC,
    attendance JSONB DEFAULT '[]',
    safety_checks JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROJECT SCENARIOS (AI Analysis Persistence)
CREATE TABLE IF NOT EXISTS project_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_type TEXT NOT NULL, -- 'CALCULATOR', 'PHASING', etc.
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TASKS (Assignment Module)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Simple policy to allow all access (Change this for production!)
CREATE POLICY "Allow all access" ON work_entries FOR ALL USING (true);
CREATE POLICY "Allow all access" ON materials FOR ALL USING (true);
CREATE POLICY "Allow all access" ON workers FOR ALL USING (true);
CREATE POLICY "Allow all access" ON project_scenarios FOR ALL USING (true);
CREATE POLICY "Allow all access" ON tasks FOR ALL USING (true);
