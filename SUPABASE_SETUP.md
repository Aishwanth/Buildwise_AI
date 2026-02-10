# Supabase Integration Guide

## ✅ Configuration Complete

Your app is now connected to Supabase! Here's how to set up your database tables.

### Environment Variables
Your Supabase credentials are stored in `.env.local`:
- `VITE_SUPABASE_URL`: https://ccarijtonfrgnksmufcv.supabase.co
- `VITE_SUPABASE_ANON_KEY`: Your anonymous key (for client-side access)

---

## Step 1: Create Tables in Supabase

Go to your [Supabase Dashboard](https://app.supabase.com) → SQL Editor and run these SQL commands:

### 1. Work Entries Table
```sql
-- Create work_entries table
CREATE TABLE work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on date for faster queries
CREATE INDEX idx_work_entries_date ON work_entries(date DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read
CREATE POLICY "Allow public read access" ON work_entries
  FOR SELECT USING (true);

-- Create policy to allow all users to insert
CREATE POLICY "Allow public insert access" ON work_entries
  FOR INSERT WITH CHECK (true);

-- Create policy to allow all users to update
CREATE POLICY "Allow public update access" ON work_entries
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create policy to allow all users to delete
CREATE POLICY "Allow public delete access" ON work_entries
  FOR DELETE USING (true);
```

### 2. Materials Table
```sql
-- Create materials table
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

-- Create index on name for faster queries
CREATE INDEX idx_materials_name ON materials(name);

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON materials
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON materials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON materials
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON materials
  FOR DELETE USING (true);
```

### 3. Workers Table
```sql
-- Create workers table
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  daily_wage DECIMAL(10, 2) NOT NULL,
  attendance JSONB DEFAULT '[]',
  safety_checks JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_workers_name ON workers(name);

-- Enable RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON workers
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON workers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON workers
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON workers
  FOR DELETE USING (true);
```

### 4. Storage Buckets

Create two storage buckets in your Supabase dashboard:

1. **work-photos** - For daily work update photos
2. **bill-photos** - For material bill/receipt photos

Make both buckets **Public** so files can be accessed via public URLs.

---

## Step 2: Use in Your Components

### Example: Integrating with Daily Work Update Component

```tsx
import { saveWorkEntry, getWorkEntries, deleteWorkEntry } from '../services/supabaseClient';

// In your component:
const handleAddEntry = async () => {
  try {
    await saveWorkEntry({
      date: selectedDate,
      description: description,
      photos: photos,
    });
    // Refresh entries
    const entries = await getWorkEntries();
    setWorkEntries(entries);
  } catch (error) {
    console.error('Failed to save entry:', error);
  }
};

const handleDeleteEntry = async (id: string) => {
  try {
    await deleteWorkEntry(id);
    const entries = await getWorkEntries();
    setWorkEntries(entries);
  } catch (error) {
    console.error('Failed to delete entry:', error);
  }
};
```

### Example: Upload Photo to Storage

```tsx
import { uploadFile, getPublicUrl } from '../services/supabaseClient';

const uploadPhoto = async (file: File) => {
  try {
    const path = `work-photos/${Date.now()}-${file.name}`;
    await uploadFile('work-photos', path, file);
    const publicUrl = getPublicUrl('work-photos', path);
    return publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

---

## Available Functions in `supabaseClient.ts`

### Work Entries
- `saveWorkEntry(entry)` - Create new work entry
- `getWorkEntries()` - Fetch all work entries
- `updateWorkEntry(id, updates)` - Update work entry
- `deleteWorkEntry(id)` - Delete work entry

### Materials
- `saveMaterial(material)` - Create new material
- `getMaterials()` - Fetch all materials
- `updateMaterial(id, updates)` - Update material
- `deleteMaterial(id)` - Delete material

### File Storage
- `uploadFile(bucket, path, file)` - Upload file to storage
- `getPublicUrl(bucket, path)` - Get public URL for file

---

## Testing Your Connection

To test if everything is connected:

```tsx
import { supabase } from './services/supabaseClient';

// In a useEffect:
useEffect(() => {
  const testConnection = async () => {
    const { data, error } = await supabase
      .from('work_entries')
      .select('count');
    
    if (error) {
      console.error('Connection failed:', error);
    } else {
      console.log('✅ Connected to Supabase!', data);
    }
  };
  
  testConnection();
}, []);
```

---

## Data Persistence Flow

1. **Daily Work Update** → Saves to `work_entries` table + photos to `work-photos` bucket
2. **Materials** → Saves to `materials` table + bill photos to `bill-photos` bucket
3. **Workers** → Saves to `workers` table with attendance & safety records

All data syncs automatically with Supabase!

---

## Next Steps

1. Run the SQL commands in your Supabase SQL Editor
2. Create the storage buckets
3. Update your components to use the `supabaseClient` functions
4. Test the connection
5. Restart your dev server: `npm run dev`

**Need help?** Check the [Supabase Docs](https://supabase.com/docs)
