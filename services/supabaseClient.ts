import { createClient } from '@supabase/supabase-js';

// Read environment variables (Vite provides `import.meta.env`, Node provides `process.env`)
const supabaseUrl = (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined) || process.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined) || process.env?.VITE_SUPABASE_ANON_KEY || '';

const isConfigMissing = !supabaseUrl || !supabaseAnonKey;

if (isConfigMissing) {
  console.warn('⚠️ SUPABASE CREDENTIALS MISSING: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your environment variables for database features to work.');
}

// Ensure createClient doesn't fail if strings are empty. 
// Using current origin as a fallback to avoid DNS lookup failures for non-existent domains.
export const supabase = createClient(supabaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://localhost'), supabaseAnonKey || 'placeholder');

export { isConfigMissing };

// Database types for TypeScript support
export interface WorkEntry {
  id: string;
  project_code?: string;
  date: string;
  description: string;
  photos: any[];
  created_at: string;
  updated_at: string;
}

export interface MaterialItem {
  id: string;
  project_code?: string;
  name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  bill_photo?: {
    name: string;
    url: string;
    uploaded_at: string;
  };
  created_at: string;
  updated_at: string;
}

export interface WorkerData {
  id: string;
  project_code?: string;
  name: string;
  role: string;
  daily_wage: number;
  attendance: boolean[];
  safety_checks?: {
    helmet_worn: boolean;
    gloves_worn: boolean;
    shoes_worn: boolean;
    timestamp: string;
  };
  created_at: string;
  updated_at: string;
}

// Helper functions for CRUD operations

/**
 * Test Supabase connection
 */
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('work_entries')
      .select('count', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    return { success: true, message: 'Connected to Supabase!' };
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    return {
      success: false,
      message: `Connection failed: ${error.message}. Make sure to create the 'work_entries' table in Supabase.`
    };
  }
};

/**
 * Save work entry to Supabase
 */
export const saveWorkEntry = async (entry: Omit<WorkEntry, 'id' | 'created_at' | 'updated_at'> & { project_id?: string }) => {
  try {
    const { data, error } = await supabase
      .from('work_entries')
      .insert([{
        project_id: entry.project_id,
        project_code: entry.project_code,
        date: entry.date,
        description: entry.description,
        photos: entry.photos,
      }])
      .select();

    if (error) {
      const errorMsg = error.message || 'Unknown error';
      console.error('Error saving work entry:', errorMsg);
      throw new Error(`Failed to save: ${errorMsg}.`);
    }
    return data?.[0];
  } catch (error: any) {
    console.error('Work entry save error:', error);
    throw error;
  }
};

/**
 * Get all work entries for a specific project
 */
export const getWorkEntries = async (projectId: string) => {
  if (!projectId) return [];

  const { data, error } = await supabase
    .from('work_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching work entries:', error);
    throw error;
  }
  return data || [];
};

/**
 * Update work entry
 */
export const updateWorkEntry = async (id: string, updates: Partial<WorkEntry>) => {
  const { data, error } = await supabase
    .from('work_entries')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating work entry:', error);
    throw error;
  }
  return data?.[0];
};

/**
 * Delete work entry
 */
export const deleteWorkEntry = async (id: string) => {
  const { error } = await supabase
    .from('work_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting work entry:', error);
    throw error;
  }
};

/**
 * Save material to Supabase
 */
export const saveMaterial = async (material: Omit<MaterialItem, 'id' | 'created_at' | 'updated_at'> & { project_id?: string }) => {
  try {
    const { data, error } = await supabase
      .from('materials')
      .insert([{
        project_id: material.project_id,
        project_code: material.project_code,
        name: material.name,
        quantity: material.quantity,
        unit: material.unit,
        cost_per_unit: material.cost_per_unit,
        bill_photo: material.bill_photo || null,
      }])
      .select();

    if (error) {
      const errorMsg = error.message || 'Unknown error';
      console.error('Error saving material:', errorMsg);
      throw new Error(`Failed to save: ${errorMsg}.`);
    }
    return data?.[0];
  } catch (error: any) {
    console.error('Material save error:', error);
    throw error;
  }
};

/**
 * Get all materials for a specific project
 */
export const getMaterials = async (projectId: string) => {
  if (!projectId) return [];

  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching materials:', error);
    throw error;
  }
  return data || [];
};

/**
 * Update material
 */
export const updateMaterial = async (id: string, updates: Partial<MaterialItem>) => {
  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating material:', error);
    throw error;
  }
  return data?.[0];
};

/**
 * Delete material
 */
export const deleteMaterial = async (id: string) => {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
};

/**
 * Upload file to Supabase Storage
 */
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
  return data;
};

/**
 * Get public URL for uploaded file
 */
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data?.publicUrl;
};
