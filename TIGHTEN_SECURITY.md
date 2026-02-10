# 🔒 DATA ISOLATION: Tighten Supabase Security

To prevent data leakage between users, you must run this SQL in your Supabase Dashboard. This will ensure users can only see their own projects and associated data.

## ✅ Steps:
1. Go to your [Supabase SQL Editor](https://app.supabase.com/project/ccarijtonfrgnksmufcv/sql/new).
2. Copy the entire SQL block below.
3. Paste it into the editor and click **Run**.

```sql
-- 1. Tighten Projects Table (Only owner can see/edit)
DROP POLICY IF EXISTS "Allow all access" ON projects;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own projects" ON projects
  FOR ALL USING (auth.uid() = owner_id);

-- 2. Tighten Client Projects Table (Only client can see their access)
DROP POLICY IF EXISTS "Allow all access" ON client_projects;
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can only see their own project access" ON client_projects
  FOR ALL USING (auth.uid() = client_id);

-- 3. Tighten Work Entries Table (Owner or assigned Client)
DROP POLICY IF EXISTS "Allow all access on work_entries" ON work_entries;
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and clients can access work_entries" ON work_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = work_entries.project_id AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM client_projects cp
      WHERE cp.project_id = work_entries.project_id AND cp.client_id = auth.uid()
    )
  );

-- 4. Tighten Materials Table (Owner or assigned Client)
DROP POLICY IF EXISTS "Allow all access on materials" ON materials;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and clients can access materials" ON materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = materials.project_id AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM client_projects cp
      WHERE cp.project_id = materials.project_id AND cp.client_id = auth.uid()
    )
  );
```

---

> [!NOTE]
> Once you run this, the backend is secured! I will now proceed with the frontend changes to isolate local storage.
