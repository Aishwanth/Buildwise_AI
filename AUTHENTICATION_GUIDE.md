# BuildWise Authentication System - Complete Setup Guide

## What's New ✨

Your BuildWise app now has a **complete authentication & role-based access system** with:

### 👔 **Owner Role**
- ✅ Create and manage projects
- ✅ Generate unique access codes for clients
- ✅ View detailed project analytics (read-only)
- ✅ Track all project data in real-time
- ❌ Cannot edit/delete data (view-only)

### 👨‍💼 **Client Role**
- ✅ Enter owner's access code
- ✅ Access specific projects they're invited to
- ✅ View all project data and analytics
- ✅ Real-time updates from owner
- ❌ Cannot edit/delete data (view-only)

---

## 📋 Setup Steps

### Step 1: Create Database Tables in Supabase

Go to your [Supabase Dashboard](https://app.supabase.com) → SQL Editor and run all the SQL commands from this file:

**File:** `AUTHENTICATION_SETUP.md`

Copy each SQL block and run them one by one:
1. Create `users` table
2. Create `projects` table
3. Create `client_projects` table (many-to-many)
4. Update `work_entries` and `materials` tables with `project_id`
5. Enable RLS policies

### Step 2: Update Environment Variables

Your `.env.local` already has the Supabase credentials. Verify:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anonymous-key
```

### Step 3: Start the Application

```bash
npm run dev
```

The app will now show the **Login Page** first instead of the dashboard.

---

## 🎮 How to Use

### **First Time: Sign Up as Owner**

1. Go to http://localhost:3001
2. Click **"Sign Up Here"**
3. Select **Owner** role
4. Enter:
   - **Name:** Your name
   - **Email:** your@email.com
   - **Password:** At least 6 characters
5. Click **Create Account**
6. You'll be taken to the **Owner Dashboard**

### **Owner Dashboard Features**

#### 📁 Create a Project
1. Enter project name (e.g., "BuildWise Site A")
2. Click **Create**
3. Your project is created with an 8-character **Access Code** (e.g., `ABC12345`)

#### 📋 Share with Clients
1. Find your project in the grid
2. Click the **Copy** icon next to the access code
3. Share the code with your client via email/message
4. **They can now access your project data!**

#### 📊 View Project Data
Click on a project card to view all associated data:
- Daily work updates
- Material tracking
- Cost analysis
- Charts and analytics

---

### **Client: Get Access to Project**

#### 📝 First Time: Sign Up as Client
1. Go to http://localhost:3001
2. Click **"Sign Up Here"**
3. Select **Client** role
4. Enter your details
5. Click **Create Account**
6. You'll be on the **Client Dashboard**

#### 🔓 Access Owner's Project
1. Ask your project owner for the **access code**
2. Enter it in the **"Access Code"** field
3. Click **"Unlock Project"**
4. ✅ The project is now in your **"Your Projects"** list
5. Click on the project card to **view all data**

---

## 📁 New Files Created

### Services
- **`services/authService.ts`** - Authentication logic (login, signup, access control)

### Components
- **`components/Login.tsx`** - Login/signup form with role selection
- **`components/OwnerDashboard.tsx`** - Owner project management
- **`components/ClientDashboard.tsx`** - Client project access
- **`AppShell.tsx`** - Main routing between auth states

### Context
- **`context/AuthContext.tsx`** - Global authentication state management

### Documentation
- **`AUTHENTICATION_SETUP.md`** - SQL schema and setup instructions

---

## 🔐 Data Flow

### Owner Creates Project
```
Owner Signs Up → Creates Project → Access Code Generated → Shares Code
```

### Client Accesses Project
```
Client Signs Up → Enters Access Code → Verified → Access Granted → Views Data
```

---

## 🛠️ Technical Details

### Authentication Method
- **Simple hash-based** (for demo) - base64 encoding
- 💡 **Production:** Use Supabase Auth for better security

### Session Management
- User data stored in `localStorage` as `buildwise_user`
- Session persists across page refreshes
- Log out clears all user data

### Access Codes
- 8-character random codes (e.g., `ABC12345`)
- Unique per project
- Can be regenerated if needed

### Read-Only Mode
- Both owners and clients can only **view** data
- Cannot edit or delete
- Enforced on UI level (buttons hidden) and database level (RLS)

---

## 🧪 Test Scenarios

### Scenario 1: Single Owner, Multiple Clients
1. Owner creates project "Site A"
2. Generates and copies access code
3. 3 clients each sign up and enter the code
4. All 3 clients can now view Site A data
5. Updates from owner appear for all clients

### Scenario 2: Manage Multiple Projects
1. Owner creates "Project 1", "Project 2", "Project 3"
2. Client A gets access to "Project 1" and "Project 2"
3. Client B gets access to only "Project 3"
4. Each client sees only their assigned projects

---

## 📊 Next Steps (Optional Enhancements)

- [ ] Add project description/details editing for owners
- [ ] Implement email notifications when access granted
- [ ] Add client list for each project (show who has access)
- [ ] Implement proper Supabase Auth (instead of simple auth)
- [ ] Add role-based filtering for existing features
- [ ] Create audit logs for data changes
- [ ] Add project settings (archive, delete, transfer)

---

## ❓ Common Issues

### "Invalid access code"
- Check spelling (codes are case-sensitive)
- Make sure it's the correct project owner's code
- Verify project exists in owner's dashboard

### "Email already exists"
- The email is already registered
- Use a different email or login instead

### "Session lost after refresh"
- Check browser's localStorage is enabled
- Try clearing browser cache and logging in again
- Check VITE_SUPABASE credentials in .env.local

### Cannot access Supabase tables
- Make sure SQL commands from `AUTHENTICATION_SETUP.md` were run
- Check RLS policies are enabled
- Verify project_id columns were added to existing tables

---

## 📞 Support

Check files for detailed implementation:
- `AUTHENTICATION_SETUP.md` - Database schema
- `services/authService.ts` - All auth functions
- `components/Login.tsx` - Login UI
- `components/OwnerDashboard.tsx` - Owner features
- `components/ClientDashboard.tsx` - Client features

---

✅ **Your authentication system is ready!**

Try logging in now and create a project. Share the access code with another user to test the client access flow.
