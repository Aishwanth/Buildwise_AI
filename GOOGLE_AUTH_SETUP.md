# How to Fix "Unsupported provider: provider is not enabled"

The error you are seeing (`provider is not enabled`) means that **Google Authentication** is currently turned **OFF** in your Supabase project settings.

To fix this, you need to enable it in Supabase. This requires two main steps:
1. Get API Keys from Google Cloud.
2. Enter them into Supabase.

---

### Step 1: Get Google Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "BuildWise").
3. Search for **"Google People API"** and **enable** it (this is often required for user profile data).
4. Go to **APIs & Services > Credentials**.
5. Click **Create Credentials** -> **OAuth client ID**.
   - **Application Type**: Web application
   - **Name**: BuildWise Auth
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (Local testing)
     - `https://your-supabase-project.supabase.co` (Your production URL)
   - **Authorized redirect URIs**:
     - `https://<YOUR_SUPABASE_ID>.supabase.co/auth/v1/callback`
     - *(You can find this exact URL in Supabase Dashboard -> Authentication -> URL Configuration)*
6. Copy the **Client ID** and **Client Secret**.

### Step 2: Enable in Supabase
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project.
3. on the left sidebar, click **Authentication**.
4. Click on **Providers** in the sub-menu.
5. Find **Google** in the list and click it.
6. Toggle **Enable Google** to **ON**.
7. Paste your **Client ID** and **Client Secret** from Step 1.
8. Click **Save**.

### Step 3: Verify Redirect URL (Crucial)
1. Still in Supabase, go to **Authentication > URL Configuration**.
2. Ensure `http://localhost:5173` is listed in **Site URL** or **Redirect URLs**.
3. If it is missing, add it and save.

Once you save these settings in Supabase, the error will disappear and the Google login button will work!
