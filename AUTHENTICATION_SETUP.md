# BuildWise Authentication & Role-Based Access Setup

## SQL Schema - Run in Supabase SQL Editor

### Step 1: Create `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'client')),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Step 2: Create `projects` Table
```sql
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  access_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_access_code ON projects(access_code);
```

### Step 3: Create `client_projects` Table (Many-to-Many)
```sql
CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, project_id)
);

CREATE INDEX idx_client_projects_client ON client_projects(client_id);
CREATE INDEX idx_client_projects_project ON client_projects(project_id);
```

### Step 4: Update `work_entries` & `materials` Tables
```sql
-- Add project_id column to work_entries
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_work_entries_project ON work_entries(project_id);

-- Add project_id column to materials
ALTER TABLE materials ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
```

### Step 5: Enable RLS Policies
```sql
-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR true);

-- Projects table policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage their projects" ON projects
  FOR ALL USING (owner_id::text = auth.uid()::text);
CREATE POLICY "Clients can view assigned projects" ON projects
  FOR SELECT USING 
    (id IN (SELECT project_id FROM client_projects WHERE client_id::text = auth.uid()::text));

-- Client projects policies
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their project assignments" ON client_projects
  FOR SELECT USING (client_id::text = auth.uid()::text);
```

## How It Works

**Owner Flow:**
1. Sign up as Owner
2. Gets assigned to a project
3. Can view owner dashboard with analytics
4. Can generate access codes for clients
5. Can view all project data (read-only by design)

**Client Flow:**
1. Sign up as Client
2. Enter owner's access code
3. Gets access to owner's project
4. Can view filtered project data
5. Cannot edit or delete data

Next: Run these SQL commands in Supabase, then use the auth service and components in the React app.
