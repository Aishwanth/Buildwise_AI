import { supabase } from './supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'client';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: 'owner' | 'client';
}

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpData): Promise<AuthUser> => {
  try {
    // For now, we'll store credentials in the users table directly
    // In production, use Supabase Auth
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email: data.email,
        name: data.name,
        role: data.role,
        password_hash: btoa(data.password), // Simple base64 encoding (not secure for production)
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw error;
  }
};

/**
 * Log in user
 */
export const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', credentials.email)
      .single();

    if (error || !users) {
      throw new Error('User not found');
    }

    // Verify password (simple comparison, not secure for production)
    const storedHash = users.password_hash;
    const providedHash = btoa(credentials.password);

    if (storedHash !== providedHash) {
      throw new Error('Invalid password');
    }

    // Store user session in localStorage
    const authUser: AuthUser = {
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    };
    localStorage.setItem('buildwise_user', JSON.stringify(authUser));
    localStorage.setItem('buildwise_token', users.id);

    return authUser;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Log out user
 */
export const logout = () => {
  localStorage.removeItem('buildwise_user');
  localStorage.removeItem('buildwise_token');
  localStorage.removeItem('buildwise_project_id');
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): AuthUser | null => {
  const userJson = localStorage.getItem('buildwise_user');
  return userJson ? JSON.parse(userJson) : null;
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('buildwise_token');
};

/**
 * Create a project for owner
 */
export const createProject = async (ownerId: string, projectName: string, description: string = ''): Promise<any> => {
  try {
    const accessCode = generateAccessCode();
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        owner_id: ownerId,
        name: projectName,
        description: description,
        access_code: accessCode,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Project creation failed: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Project creation error:', error);
    throw error;
  }
};

/**
 * Get owner's projects
 */
export const getOwnerProjects = async (ownerId: string) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Get project details by access code
 */
export const getProjectByAccessCode = async (accessCode: string) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('access_code', accessCode)
      .single();

    if (error) {
      throw new Error('Invalid access code');
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

/**
 * Grant client access to project
 */
export const grantClientAccess = async (clientId: string, projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('client_projects')
      .insert([{
        client_id: clientId,
        project_id: projectId,
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error granting access:', error);
    throw error;
  }
};

/**
 * Get client's projects
 */
export const getClientProjects = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('client_projects')
      .select('project_id, projects(*)')
      .eq('client_id', clientId)
      .order('access_granted_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data?.map((cp: any) => cp.projects) || [];
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Generate random access code
 */
const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Verify access code and grant access
 */
export const verifyAndGrantAccess = async (clientId: string, accessCode: string) => {
  try {
    const project = await getProjectByAccessCode(accessCode);

    // Check if client already has access
    const { data: existing, error: checkError } = await supabase
      .from('client_projects')
      .select('id')
      .eq('client_id', clientId)
      .eq('project_id', project.id)
      .single();

    if (!checkError && existing) {
      return { success: true, message: 'Already has access to this project', project };
    }

    // Grant access
    await grantClientAccess(clientId, project.id);

    // Store project context
    localStorage.setItem('buildwise_project_id', project.id);

    return { success: true, message: 'Access granted', project };
  } catch (error: any) {
    console.error('Error verifying access code:', error);
    throw error;
  }
};

/**
 * Get a project by id
 */
export const getProjectById = async (projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching project by id:', error);
    throw error;
  }
};


/**
 * Update user details
 */
export const updateUser = async (userId: string, updates: Partial<{ name: string; email: string }>) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // update localStorage if current user
    const stored = localStorage.getItem('buildwise_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.id === data.id) {
        const updated = { ...parsed, ...updates };
        localStorage.setItem('buildwise_user', JSON.stringify(updated));
      }
    }

    return data;
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Get user by personal code
 */
export const getUserByPersonalCode = async (code: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('personal_code', code)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching user by personal code:', error);
    throw error;
  }
};

/**
 * Ensure a client has at least one project. If none exists, create a personal project and grant access.
 */
export const ensureClientHasProject = async (clientId: string, clientName?: string) => {
  try {
    const clientProjects = await getClientProjects(clientId);
    if (clientProjects && clientProjects.length > 0) return clientProjects[0];

    const projectName = clientName ? `Personal - ${clientName}` : 'Personal Project';
    const created = await createProject(clientId, projectName, 'Auto-created personal project');

    // grant client access
    await grantClientAccess(clientId, created.id);

    return created;
  } catch (error: any) {
    console.error('Error ensuring client project:', error);
    throw error;
  }
};


/**
 * Login with Google OAuth (Supabase)
 */
export const loginWithGoogle = async (role: 'owner' | 'client') => {
  try {
    localStorage.setItem('buildwise_pending_role', role);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: false,
      },
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (error: any) {
    throw new Error(`Google login failed: ${error.message}`);
  }
};

/**
 * Handle Google Login Callback
 * Syncs Supabase Auth user to public.users table
 */
export const handleGoogleLoginCallback = async (sessionUser: any) => {
  try {
    const pendingRole = localStorage.getItem('buildwise_pending_role') as 'owner' | 'client' | null;
    const role = pendingRole || 'owner'; // Default to owner if lost

    // Check if user exists in public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (!existingUser) {
      // Create new user in public.users
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Google User',
          role: role,
          password_hash: 'google_oauth_user', // Placeholder for non-password users
        }]);

      if (insertError) {
        console.error('Error creating public user record:', insertError);
        // Continue anyway, as we have the auth session
      }
    } else {
      // Optionally update metadata if needed, but skipping for now to avoid overwrites
    }

    const authUser: AuthUser = {
      id: sessionUser.id,
      email: sessionUser.email!,
      name: sessionUser.user_metadata?.full_name || existingUser?.name || sessionUser.email?.split('@')[0],
      role: existingUser?.role || role,
    };

    // Store session
    localStorage.setItem('buildwise_user', JSON.stringify(authUser));
    localStorage.setItem('buildwise_token', sessionUser.id);
    localStorage.removeItem('buildwise_pending_role');

    return authUser;
  } catch (error) {
    console.error('Error in Google callback:', error);
    throw error;
  }
};
