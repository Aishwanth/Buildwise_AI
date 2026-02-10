# 🚀 QUICK START: Create Supabase Tables (5 Minutes)

Your app is showing errors because the Supabase tables don't exist yet. **Follow these exact steps to fix it:**

---

## ✅ Step 1: Open Supabase Dashboard

1. Go to: https://app.supabase.com
2. Click on your project: **ccarijtonfrgnksmufcv**
3. On the left sidebar, click **SQL Editor**
4. Click **+ New Query**

---

## ✅ Step 2: Create work_entries Table

**Copy this entire SQL and paste it in the SQL Editor:**

```sql
CREATE TABLE work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access on work_entries" ON work_entries
  FOR ALL USING (true) WITH CHECK (true);
```

**Then click "Run" button**

---

## ✅ Step 3: Create materials Table

**Click "+ New Query" again and copy this:**

```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  cost_per_unit DECIMAL(10, 2) NOT NULL,
  bill_photo JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access on materials" ON materials
  FOR ALL USING (true) WITH CHECK (true);
```

**Then click "Run" button**

---

## ✅ Step 4: Verify Tables Were Created

Click on **Tables** in the left sidebar. You should see:
- ✅ `work_entries`
- ✅ `materials`

---

## ✅ What to Do Now

1. **Go back to your app**: http://localhost:3001
2. **Refresh the page** (Ctrl+R or Cmd+R)
3. **Go to Daily Work Update** → Try adding a work entry
4. **Go to Materials** → Try adding a material
5. **Refresh the page again** → Data should still be there! ✅

---

## ⚠️ Troubleshooting

**Q: Still getting errors after creating tables?**
A: Try refreshing the browser page (Ctrl+R) and check the browser console (F12) for specific error messages.

**Q: Data not appearing after I add it?**
A: Make sure you see the green "Create Work Entry" button change color - that means it saved!

**Q: Can I view the data in Supabase?**
A: Yes! In Supabase Dashboard → Tables → `work_entries` (or `materials`) → Click "Data" tab to see all entries.

---

## 🎉 You're Done!

Once the tables are created:
- ✅ Daily Work Updates will save and persist
- ✅ Materials will save with bill photos
- ✅ All data survives page refreshes
- ✅ Photos are stored as base64 in the database

**The app is now fully functional with Supabase!** 🚀
