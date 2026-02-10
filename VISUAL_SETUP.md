# 📸 VISUAL SETUP GUIDE - Supabase Tables

## Where to Create Tables

### Location in Supabase Dashboard:
```
Supabase Dashboard
└── Your Project (ccarijtonfrgnksmufcv)
    └── SQL Editor (Left Sidebar)
        └── + New Query Button
            └── Paste SQL Code Here
                └── Click "Run" Button
```

---

## Copy-Paste SQL Commands

### Command 1: Create work_entries Table

**IMPORTANT:** Don't change anything, copy and paste EXACTLY:

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

**Steps:**
1. Select all the code above (Ctrl+A after clicking)
2. Copy (Ctrl+C)
3. Go to Supabase → SQL Editor
4. Click "+ New Query"
5. Paste in the editor (Ctrl+V)
6. Click "Run" button (top right)
7. ✅ Should say "Success"

---

### Command 2: Create materials Table

**IMPORTANT:** Click "+ New Query" AGAIN for this one

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

**Steps:**
1. Click "+ New Query" button
2. Select and copy code above
3. Paste in the new query editor
4. Click "Run" button
5. ✅ Should say "Success"

---

## Verification

### Confirm Tables Exist

After running both queries:

1. In Supabase sidebar, click **Tables**
2. You should see:
   ```
   Tables
   ├── work_entries ✅
   └── materials ✅
   ```

If you see both tables, you're done! 🎉

---

## Test Your App

### In Daily Work Update:

1. Click "Add Work Update" button
2. Select a date
3. Type description: "Test entry"
4. Click "Create Work Entry"
5. **Refresh the page** → Entry should still be there ✅

### In Materials:

1. Click "Add Material" button
2. Enter:
   - Material Name: "Test Cement"
   - Quantity: 100
   - Unit: "bags"
   - Cost Per Unit: 350
3. Click "Add Material"
4. **Refresh the page** → Material should still be there ✅

---

## Features Now Working

After table creation:

✅ **Daily Work Update Page:**
- Add work entries with date, description, and photos
- View photos in a modal
- Download photos
- Entries persist on refresh

✅ **Materials Page:**
- Add materials with quantity and cost
- Upload bill/receipt photos
- View bill photos in table
- Materials persist on refresh

✅ **Photo Viewer:**
- Click any photo to view full size
- Download photos from modal

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Failed to save" error | Tables not created. Follow steps above. |
| Data disappears on refresh | Tables don't have data. Check Supabase Dashboard → Tables → Data |
| Photos not showing | Refresh browser cache (Ctrl+Shift+R) |
| Button not working | Check browser console (F12) for error messages |

---

## Next Steps

Once tables are working:

1. **Add some test data** - Try adding 3-4 work entries and materials
2. **Test persistence** - Refresh page multiple times to confirm data stays
3. **Check Supabase Dashboard** - See your data in Tables section
4. **Start using the app!** - Add real project data

---

## Need Help?

1. **Check browser console**: F12 → Console tab → Look for red errors
2. **Check Supabase logs**: Supabase Dashboard → Logs
3. **Review SETUP_TABLES.md** for quick reference
4. **Review SUPABASE_PERSISTENCE.md** for technical details

**You've got this! 🚀**
