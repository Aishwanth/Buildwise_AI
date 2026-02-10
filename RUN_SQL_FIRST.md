# ⚠️ IMPORTANT: Run These SQL Commands FIRST

**Before testing the login, you MUST create the database tables in Supabase.**

## Steps:

1. Go to: https://app.supabase.com
2. Select your project `ccarijtonfrgnksmufcv`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste each SQL block below, **one at a time**
6. Click **Run** after each block

---

## SQL Block 1️⃣ - Create Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'client')),
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read" ON users FOR SELECT USING (true);
CREATE POLICY "Allow insert for new users" ON users FOR INSERT WITH CHECK (true);
```

---

## SQL Block 2️⃣ - Create Projects Table

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

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_access_code ON projects(access_code);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON projects FOR ALL USING (true) WITH CHECK (true);
```

---

## SQL Block 3️⃣ - Create Client Projects Table

```sql
CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_client_projects_client ON client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_project ON client_projects(project_id);

ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON client_projects FOR ALL USING (true) WITH CHECK (true);
```

---

## SQL Block 4️⃣ - Update Work Entries

```sql
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_work_entries_project ON work_entries(project_id);
```

---

## SQL Block 5️⃣ - Update Materials

```sql
ALTER TABLE materials ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
```

---

## ✅ After Running All 5 Blocks

- Refresh your app (F5)
- Try signing up again
- Should work now!

---

## 🔑 Google OAuth Setup (Optional but Recommended)

To enable Google login, follow these steps:

### In Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
4. Configure consent screen (choose "External")
5. Create **Web application** client
6. Add authorized redirect URIs:
   - `http://localhost:3001` (for local testing)
   - `https://your-domain.com` (for production)
   - `https://your-project.supabase.co/auth/v1/callback` (IMPORTANT!)

7. Copy the **Client ID** and **Client Secret**

### In Supabase Dashboard:
1. Go to your project
2. **Settings** → **Authentication** → **Providers**
3. Find **Google**
4. Paste **Client ID** and **Client Secret**
5. Hit **Save**

---

**After completing the SQL blocks above, your login will work! Then you can set up Google OAuth.**
