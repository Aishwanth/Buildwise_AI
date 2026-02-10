# 🛠️ Netlify Deployment Troubleshooting

Since your app is now "live" on Netlify, there are a few final configuration steps to connect your production site to your Supabase database.

### 1. Run the Database Setup (Again)
If you created a new Supabase project for Netlify, or if you haven't run the SQL lately, your database might be missing the `users` and `projects` tables.

**Action:**
1.  Go to your [Supabase SQL Editor](https://app.supabase.com/project/_/sql/new).
2.  Open the file **[RUN_SQL_FIRST.md](file:///c:/buildwise/RUN_SQL_FIRST.md)** in your editor.
3.  Copy and run all 5 SQL blocks. **This is required for Sign-up to work.**

---

### 2. Enable Google Login for Netlify
Google login will fail on Netlify until you tell Supabase that your Netlify URL is "safe".

**Action:**
1.  Copy your **Netlify Site URL** (e.g., `https://buildwise-ai.netlify.app`).
2.  In Supabase Dashboard, go to **Authentication** > **URL Configuration**.
3.  Add your Netlify URL to the **Redirect URLs** list.
4.  Click **Save**.

---

### 3. Check for Errors (F12)
If it still fails, please:
1.  Right-click anywhere on your Netlify site and select **Inspect**.
2.  Click the **Console** tab.
3.  Try to sign up again and **take a screenshot of any Red Errors** you see there. 

Common errors and fixes:
- `42P01: relation "users" does not exist`: You missed Step 1 above.
- `42501: new row violates row level security policy`: You need to run the RLS policies in [TIGHTEN_SECURITY.md](file:///c:/buildwise/TIGHTEN_SECURITY.md).
